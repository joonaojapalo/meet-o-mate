import os
import time
import urllib2

from config import *

# read conf
conf = get_config()#dict( l.strip().split("=")[:2] for l in open("conf"))

result_url = "http://192.168.100.22/results"
pw = conf["web_ssh_pass"]
dest = "hardrun.net:%s" % conf["web_result_path"]

sleep_time = int(conf["web_result_update_sleep"])

while 1:
	# get rendered result page
	r = urllib2.urlopen(result_url)
	s = r.read()
	print "creating... ",
	open("results.html", "w").write(s)

	# put to web
	print "uploading... ",
	os.system("pscp -pw %s results.html %s@%s" % (pw, conf["web_user"], dest))
	print "done.",
	time.sleep(60)
