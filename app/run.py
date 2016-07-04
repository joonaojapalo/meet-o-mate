import logging
from logging.handlers import RotatingFileHandler

from app import app

if __name__ == "__main__":

    # setup roating logger
    handler = RotatingFileHandler(app.config.get("logFile", "app.log"), maxBytes=5000000, backupCount=1)
    handler.setLevel(logging.INFO)
    app.logger.addHandler(handler)

    # start app
    app.run(port=app.config.get("port"), host=app.config.get("host", "127.0.0.1"))

