from persistent import *

print read_classes()


start1 = 1437210150.898000 # lapse
start2 = 1437211390.650000 #aikuiset

# set group start  times
for c in "P15 T15 P13 T13 P11 T11".split(" "):
	print "setting", c
	update_class(c, start1)

for c in ("M", "N", "M kunto", "N kunto"):
	print "setting", c
	update_class(c, start2)


"""
Start for class "P15" at (12:02:30)
Start for class "T15" at 1437210151.936000 (12:02:31)
Start for class "P13" at 1437210152.801000 (12:02:32)
Start for class "T13" at 1437210153.625000 (12:02:33)
Start for class "P11" at 1437210154.457000 (12:02:34)
Start for class "T11" at 1437210155.369000 (12:02:35)
Start for class "M" at  (12:23:10)
Start for class "M kunto" at 1437211391.293000 (12:23:11)
Start for class "N kunto" at 1437211394.032000 (12:23:14)
Start for class "N" at 1437211394.867000 (12:23:14)
"""
