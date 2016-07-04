import os
import sys

from sqlalchemy import create_engine

from models import Base, Class
from config import get_config

def get_classes_file(clases_file):
	if not os.path.isfile(clases_file):
		fp = open(clases_file, "w")
		fp.writelines("\n".join(["M", "N"]))
		print " * %s created" % classes_txt
		print "   go and modify meet classes"
		sys.exit(1)
	else:
		return open(classes_txt)


if __name__ == "__main__":

	# read confg
	conf = get_config()

	# get engine
	engine = create_engine(conf["DATABASE_URI"], echo=True)
	from sqlalchemy.orm import sessionmaker
	db_session = sessionmaker(bind=engine)()

	classes_txt = "classes.txt"
	classes = get_classes_file(classes_txt)

	print " * Creating classses form: %s" %classes_txt
	for line in classes:
		class_name = line.strip()
		db_session.add(Class(name=class_name))

	db_session.commit()
