import json

__all__ = ["get_config"]

def get_config():
	return json.load(open("../config.json"))
