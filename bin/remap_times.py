from persistent import *

mapping = {} # bip: id

bips = [3,4,12,7,16,13,6,5]

for bip0, bip1 in zip(bips, reversed(bips)):
	time = session.query(Time).filter_by(bip=bip0).one()
	print "%s\t%.2f\t%i\t%i" % (time.id, time.ts, bip0, bip1)
	mapping[time.id] = bip1


for tid, bip in mapping.items():
	time = session.query(Time).filter_by(id=tid).one()
	print tid, bip, time.bip
	time.bip = bip

session.commit()

