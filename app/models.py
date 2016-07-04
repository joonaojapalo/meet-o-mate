
from sqlalchemy import *
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref

Base = declarative_base()


## application domain
class User (Base):
	__tablename__ = 'user'
	id = Column(Integer, Sequence('user_id_seq'), primary_key=True)
	name = Column(String)
	email = Column(String)
	hash = Column(String)



## event domain
class Class (Base):
	__tablename__ = "class"
	name = Column(String, primary_key=True)
	t_start = Column(Numeric)


class Runner (Base):
	__tablename__ = 'runner'

	id 			= Column(Integer, primary_key=True)
	bip 		= Column(Integer)
	firstname 	= Column(String(64))
	lastname 	= Column(String(64))
	club 		= Column(String(64), index=True)
	class_name 	= Column(String, ForeignKey("class.name"), nullable=False)
	status 		= Column(Enum("new", "ok", "dq", "dnf", "dns"), default="new")
	# add FK to registration when necessary

	time = relationship("Time")
	klass = relationship("Class")

	def finish_time(self):
		if len(self.time) and self.time[-1].ts:
			return float(self.time[-1].ts)

	def start_time(self):
		if self.klass and self.klass.t_start:
			return float(self.klass.t_start)

	def result_time(self):
		start = self.start_time()
		finish = self.finish_time()

		if start is not None and finish is not None:
			return finish - start



class Time (Base):
	__tablename__ = "time"
	id = Column(Integer, Sequence('time_id_seq'), primary_key=True)
	status = Column(Enum("open", "fixed"))
	ts = Column(Numeric, index=True)
	bip = Column(Integer, ForeignKey("runner.bip"))


## Registration domain
class Registration (Base):
	__tablename__ = "registration"
	id = Column(Integer, Sequence("registration_id_seq"), primary_key=True)
	hash = Column(String, unique=True)
	email = Column(String)



