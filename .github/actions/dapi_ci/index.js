const fs = require('fs');

const DAPI_FILE_PATTERN = '*.dapi';

const dapiCheck = async ({context, core, exec, fetch, glob}) => {
  core.info("Woven DAPI check validates DAPIs and analyzes them for potential downstream breakages")

  core.startGroup('Getting all the DAPIs...')
  const allDapiFiles = await getAllDapiFiles({core, glob});
  if(allDapiFiles.length == 0){
    core.warning('No DAPI files were found in this repository. Bye');
    process.exit(0);
  }
  core.endGroup()

  await core.group(
    'Validating DAPIs...',
    async () => await validateDapiFiles({allDapiFiles, core, fetch})
  );
  await core.group(
    'Registering DAPIs...',
    async () => await registerDapiFiles({allDapiFiles, core, context, fetch})
  );
  await core.group(
    'Getting usage statistics for all the DAPIs...',
    async () => await getDapiStats({allDapiFiles, core, fetch})
  );

  core.startGroup('Checking for changes to DAPIs...')
  const changedDapiFiles = await getChangedDapiFiles({context, core, exec});
  if(changedDapiFiles.length == 0){
    core.info('No changes were detected to DAPI files. Nice!');
    process.exit(0);
  }
  core.endGroup()

  await core.group(
    'Analyzing downstream impact of changes to DAPIs...',
    async () => await getImpactOfChangedDapiFiles({changedDapiFiles, core, fetch})
  );

  return "DAPI check complete"
}

const getAllDapiFiles = async ({core, glob}) => {
  const patterns = [`**/${DAPI_FILE_PATTERN}`];
  const globber = await glob.create(patterns.join('\n'), {followSymbolicLinks: true});
  return await globber.glob();
}

const readFiles = (fileList) => {
  const contentList = [];
  for (const file of fileList) {
    const content = fs.readFileSync(file, 'utf8');
    contentList.push(content);
  }
  return contentList;
}

const constructGetDiffCommand = ({beforeCommit, afterCommit}) => {
  return `git diff --name-only ${beforeCommit} ${afterCommit} -- "${DAPI_FILE_PATTERN}"`
}

const getChangedDapiFiles = async ({context, core, exec}) => {
  let cmd;
  if(context.eventName === "pull_request"){
    cmd = constructGetDiffCommand(
      {beforeCommit: context.payload.pull_request.base.sha, afterCommit: context.payload.pull_request.head.sha}
    )
  }else if(context.eventName === "push"){
    cmd = constructGetDiffCommand(
      {beforeCommit: context.payload.push.before, afterCommit: context.payload.push.after}
    )
  }else{
    core.error(`${context.eventName} is not supported by this action`)
    process.exit(1);
  }

  const res = await exec.getExecOutput(cmd)
  if(res.exitCode !== 0){
    core.error('Error while trying to fetch changes to DAPI');
  }
  return res.stdout.split('\n').filter(n => n);
}

const validateDapiFiles = async ({allDapiFiles, core, fetch}) => {
  const resp = await askDapiServer({
    core, fetch, requestPath: '/v1/registry/validate', dapiContentList: readFiles(allDapiFiles),
  })
  return resp.mdMessage
}

const registerDapiFiles = async ({allDapiFiles, context, core, fetch}) => {
  if (core.getBooleanInput('register-on-merge-to-mainline') === false || context.eventName != 'push' || context.payload.push.ref != `refs/heads/${core.getInput('mainline-branch-name')}`) {
    core.info('Registration skipped');
    return "Registration skipped"
  } else {
    core.info('Starting registration...');
    const resp = await askDapiServer({
      core, fetch, requestPath: '/v1/registry/register', dapiContentList: readFiles(allDapiFiles), extraArgs: {commit_hash: context.sha}
    })
    return resp.mdMessage
  }
}

const getDapiStats = async ({allDapiFiles, core, fetch}) => {
  const resp = await askDapiServer({
    core, fetch, requestPath: '/v1/registry/stats', dapiContentList: readFiles(allDapiFiles),
  })
  return resp.mdMessage
}

const getImpactOfChangedDapiFiles = async ({changedDapiFiles, core, fetch}) => {
  const resp = await askDapiServer({
    core, fetch, requestPath: '/v1/registry/impact', dapiContentList: readFiles(changedDapiFiles),
  })
  return resp.mdMessage
}

const askDapiServer = async ({core, fetch, requestPath, dapiContentList, extraArgs}) => {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dapis: dapiContentList,
      ...extraArgs,
    })
  };

  console.log(`${core.getInput('dapi-server-hostname')}${requestPath}`);
  const response = await fetch(`${core.getInput('dapi-server-hostname')}${requestPath}`, requestOptions);
  const message = await response.json()

  if(response.status == 422 || response.status >= 500){
    core.error(`Something went wrong! API failure with ${response.status} - ${requestPath}`);
    process.exit(1);
  }

  if(message.error){
    core.error(message.md)
  } else {
    core.info(message.md)
  }

  return {
    statusCode: response.status,
    error: message.error,
    md: message.md,
    json: message.json,
  }
}

module.exports = dapiCheck;
