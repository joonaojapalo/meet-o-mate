from persistent import *

from parse_times import *

fixes = parse_finish_times("finish_times.log")
print len(fixes)

for bip, ts in fixes.items():
	t = float(ts)
	print "injecting #%i <- %f" % (bip, t)
	create_time(t, bip)

