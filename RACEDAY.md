
Setup arena network
-------------------

1. Shut down internet connections
2. Set static ip (eg. 192.168.10.1)
3. Start laptop access point
```shell
sporzznet/create.bat
sporzznet/start.bat
```


Start meet-o-mate
-----------------

1. Configure meet-o-mate
```shell
cp config.json.dist config.json
cp app/classes.txt.dist app/classes.txt.dist
```

Setup configuration in `config.json`.
 - set database path, result web host credentials

2. Create meet database (sqlite)
```shell
app/init_db.py
app/init_classes.py # reads app/classes.txt
```

3. Start
```
app/run.py
```
