from sqlalchemy import Column, DateTime, String, Integer, func
from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy_woven import DAPI_META_TABLE, DAPI_META_COLUMN, STORAGE

Base = declarative_base()


class User(Base):
    __tablename__ = 'user'
    __dapi__ = DAPI_META_TABLE(
        owner="engineering/membership",
        desc="Source of truth of buyers/consumers that signed up with Acme",
        domain="buyer_growth",
        source=STORAGE.MYSQL,
        destinations=[STORAGE.SNOWFLAKE, STORAGE.ICEBERG],
    )

    id = Column(
        Integer,
        primary_key=True,
        nullable=False,
        __dapi__=DAPI_META_COLUMN(
            desc="primary key system identifier",
            pii=False,
        )
    )
    name = Column(
        String,
        nullable=False,
        __dapi__=DAPI_META_COLUMN(
            desc="the user's full name",
            pii=True,
        )
    )
    email = Column(
        String,
        nullable=False,
        __dapi__=DAPI_META_COLUMN(
            desc="the primary email",
            pii=True,
        )
    )

    address = Column(
        String,
        nullable=False,
        __dapi__=DAPI_META_COLUMN(
            desc="the billing address",
            pii=True,
        )
    )

    phone = Column(
        String,
        nullable=False,
        __dapi__=DAPI_META_COLUMN(
            desc="the user's phone number",
            pii=True,
        )
    )

    joined_at = Column(
        DateTime,
        nullable=False,
        default=func.now()
        __dapi__=DAPI_META_COLUMN(
            desc="time when they joined Acme",
            pii=False,
        )
    )
