from sqlalchemy import Column, DateTime, String, Integer, func
from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy_woven import DAPI_META_TABLE, DAPI_META_COLUMN, STORAGE

Base = declarative_base()


class Cart(Base):
    __tablename__ = 'cart'
    __dapi__ = DAPI_META_TABLE(
        owner="engineering/ecommerce",
        desc="The cart with items that the buyer has prepared to checkout",
        domain="ecommerce",
        source=STORAGE.MYSQL,
        destinations=[STORAGE.SNOWFLAKE],
    )

    cart_id = Column(
        Integer,
        nullable=False,
        primary_key=True,
        __dapi__=DAPI_META_COLUMN(
            desc="primary key system identifier",
            pii=False,
        )
    )

    user_id = Column(
        Integer,
        nullable=False,
        __dapi__=DAPI_META_COLUMN(
            desc="the buyer that the cart belongs to",
            pii=False,
        )
    )

    item_sku = Column(
        String,
        nullable=False,
        __dapi__=DAPI_META_COLUMN(
            desc="The item in the cart",
            pii=False,
        )
    )

    address = Column(
        String,
        nullable=True,
        __dapi__=DAPI_META_COLUMN(
            desc="the shipping address",
            pii=True,
        )
    )

    amount = Column(
        Integer,
        nullable=False,
        __dapi__=DAPI_META_COLUMN(
            desc="total amount of the cart with taxes and shipping",
            pii=False,
        )
    )

    purchase_number = Column(
        String,
        nullable=True,
        __dapi__=DAPI_META_COLUMN(
            desc="has a purchase number when the cart has been purchased, otherwise the cart is pending",
            pii=False,
        )
    )

    created = Column(
        DateTime,
        default=func.now(),
        nullable=False,
        __dapi__=DAPI_META_COLUMN(
            desc="cart creation time",
            pii=False,
        )
    )
