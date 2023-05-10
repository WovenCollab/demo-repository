# Woven DAPI check

:warning: **You have 2 breaking changes**

1. **MySQL User table's `phone` column was removed**  - affects 3 use cases
    On Snowflake, _Fraud Model feature store_ (@john.doe), _Google Ads_ (@steph), and _Servicing_ (@jane.hu) have used this field in the past 3 months

2. **DynamoDB Cart table's `purchase_number` nullability was changed** - affects 1 use case
    On Looker, _Underwriting model performance WBR dashboard_ (@niki) uses `purchase_number` nullability to filter for carts that haven't completed the purchase. This semantic change may cause disruption. Should they use the newly added `status` column instead?

-------------------

Thank you for sharing these two Data APIs. The two tables in this PR were used by 25 use cases just last week - of which 13 were deemed critical. They were queried more than 500 times.
