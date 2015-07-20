import re
import collections


straight_pat = r"Time (\d+\.\d+) \(\d+:\d+:\d+\) created to #([0-9]*)"
open_pat = r"Time (\d+\.\d+) \(\d+:\d+:\d+\) created to -"
time_pat = r"\*\*Time (\d+\.\d+) \(\d+:\d+:\d+\) got id (\d+)"
fix_pat = r"Time (\d+) fixed to #(\d+)"


def parse_fixes(fname):
	fixes = {} #collections.defaultdict(list)
	times = {}
	previous_open = None

	for line in open(fname):
		line = line.strip()

		mstraight = re.search(straight_pat, line)
		m2 = re.search(open_pat, line)
		m3 = re.search(time_pat, line)
		mfix = re.search(fix_pat, line)

		if mfix:
	#		print "open fix", mfix.groups()
			assert int(mfix.group(2)) not in fixes
			fixes[int(mfix.group(2))] = times[int(mfix.group(1))]

		# straight fix
		if mstraight:
	#		print line, "||", m1.group(1), m1.group(2)
	#		print "straight fix:", m1.group(1), m1.group(2)
			assert int(mstraight.group(2)) not in fixes
			fixes[int(mstraight.group(2))] = mstraight.group(1)

		# open time
		if m2:
			previous_open = m2.groups(1)

		if m3:
			if int(m3.group(2)) in times:
				print "warn: time override", m3.group(2)

			times[int(m3.group(2))] = m3.group(1)
	#		print "time %s=%s" % (m3.group(2), m3.group(1))
	return fixes, times


def parse_finish_times(fname):
	fixes, times = parse_fixes(fname)
	return fixes

#print "Fixes: %i" % len(fixes)

