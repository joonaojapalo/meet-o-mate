from decimal import Decimal

from sqlalchemy import *
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.orm.exc import NoResultFound

from models import *
from config import *


def get_engine(database_uri, echo=False):
	print " * Connecting to database: %s" % database_uri
	engine = create_engine(database_uri, echo=echo, convert_unicode=True)
	return engine



def create_user(name):
	session.add(User(name=name))
	session.commit()


def create_class(class_name):
	session.add(Class(name=class_name))
	session.commit()


def read_runners():
	rs = []
	readable = ["id", "bip", "firstname", "lastname", "club", "class_name", "status"]
	for r in session.query(Runner).join(Class):
		output = pluck(r, readable)
		output["finish_time"] = r.finish_time()
		output["start_time"] = r.start_time()
		output["result_time"] = r.result_time()
		rs.append(output)

	return rs


def update_runner(id, bip, class_name, first, last, club, status):
	
	try:
		runner = session.query(Runner).filter_by(id=id).join(Class).one()
	except NoResultFound:
		return create_runner(bip, class_name, first, last, club, status)

	runner.bip = int(bip)
	runner.class_name = class_name
	runner.firstname = first
	runner.lastname = last
	runner.club = club
	runner.status = status

	session.commit()

	readable = ["id", "bip", "firstname", "lastname", "club", "class_name", "status"]
	obj = pluck(runner, readable)
	return obj


def create_runner(bip, class_name, first, last, club, status="new"):
	runner = Runner(bip=int(bip), firstname=first, lastname=last, club=club, class_name=class_name, status=status)
	session.add(runner)
	session.commit()

	readable = ["id", "bip", "firstname", "lastname", "club", "class_name", "status"]
	return pluck(runner, readable)


def create_time(ts, bip=None):
	readable = ["id", "bip", "ts", "status"]

	time = Time(ts=ts)
	if bip:
		time.status = "fixed"
		time.bip = bip
		session.add(time)
	else:
		time.status = "open"
		session.add(time)

	session.commit()
	obj = pluck(time, readable)
	replace_attr_type(obj, Decimal, float)
	return obj


def update_time(id, bip):
	readable = ["id", "bip", "ts", "status"]

	t = session.query(Time).filter_by(id=id).one()
	t.bip = bip
	t.status = "fixed"

	session.commit()
	obj = pluck(t, readable)
	replace_attr_type(obj, Decimal, float)
	return obj


def set_runner_time(bip, time_id):
	runner = session.query(Runner).filter_by(bid=bip)
	time = session.query(Time).filter_by(id=time_id)
	time.bip = runner.bip
	session.commit()


def set_class_start_time(class_name, time):
	klass = session.query(Class).filter_by(name=class_name).one()
	klass.t_start = time
	session.commit()


def pluck(obj, attrs):
	return dict((attr, getattr(obj, attr)) for attr in attrs)

def pick(objs, attrs):
	return [pluck(obj, attrs) for obj in objs]

def replace_attr_type(obj, from_type, to_type):
	for key in obj.keys():
		value = obj[key]
		if type(value) == from_type:
			obj[key] = to_type(value)


def replace_attr_type_all(objs, from_type, to_type):
	for obj in objs:
		replace_attr_type(obj, from_type, to_type)


def read_times():
	# query all times
	times = pick(session.query(Time), ("id", "bip", "ts", "status"))

	# convert to serializable form
	replace_attr_type_all(times, Decimal, float)

	return times


def read_classes():
	objs = pick(session.query(Class), ('name', 't_start'))
	replace_attr_type_all(objs, Decimal, float)
	return objs


def update_class(class_name, t_start):
	klass = session.query(Class).filter_by(name=class_name).one()
	klass.t_start = t_start

	session.commit()

	obj = pluck(klass, ('name', 't_start'))
	replace_attr_type(obj, Decimal, float)

	return obj


def reset_timing():
	for time in session.query(Time):
		session.delete(time)

	for c in session.query(Class):
		c.t_start = None

	session.commit()

# read conf
conf = get_config()
engine = get_engine(conf.get("DATABASE_URI"))

# create session
Session = scoped_session(sessionmaker(bind=engine, autocommit=False, autoflush=False))

# get session
session = Session()

