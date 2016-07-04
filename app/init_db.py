from sqlalchemy import create_engine

from models import Base
from config import get_config


def create_schema(metadata, engine):
	metadata.create_all(engine)


if __name__ == "__main__":

	# read config
	conf = get_config()
	print " * Creating create_schema: %s" % conf["DATABASE_URI"]

	engine = create_engine(conf["DATABASE_URI"], echo=True)
	create_schema(Base.metadata, engine)
