
Setup arena network
-------------------

1. Shut down internet connections

2. Set static ip (eg. 192.168.10.1)

3. Start laptop access point
```
sporzznet/create.bat
sporzznet/start.bat
```


Start meet-o-mate
-----------------

1. Configure meet-o-mate
Setup configuration in `config.json`.
 - set database path

2. Create meet database (sqlite)
app/init_db.py
app/init_classes.py # reads app/classes.txt

2. Start
```
app/run.py
```
