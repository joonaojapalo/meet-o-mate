from persistent import *

print read_classes()

rs = read_runners()
bips = [ r['bip'] for r in rs]
bip = max(bips) + 1 if bips != [] else 1

print create_runner(bip, "M", "first","last", "club")
print "-" * 13
print read_runners()

