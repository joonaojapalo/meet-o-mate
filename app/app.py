import json
import time
import collections

from flask import Flask, render_template, request, url_for
from flask_restful import Api
from flask_restful import Resource, fields, marshal_with, reqparse

from config import *
from persistent import *
from nocache import *
import i18n


# create  app instance
app = Flask(__name__)
app.jinja_env.add_extension('pyjade.ext.jinja.PyJadeExtension')

# configure app
conf = get_config()
app.config.update(conf)

# define api
api = Api(app)


# db session
@app.teardown_appcontext
def shutdown_session(exception=None):
    session.remove()


# exceptions
@app.errorhandler(NoResultFound)
def not_found_handler(error):
    return json.dumps({"msg": "not found"}), 404


@app.errorhandler(DBAPIError)
def db_error_handler(error):
    return json.dumps({"msg": "db api error: %s" % error.message}), 500


@app.route("/ping")
def get_ping():
	"Is connection alive"
	return json.dumps({"status": "ok", "time": format_time(time.time())})


runner_fields = {
    "id": fields.Integer,
    "bip": fields.Integer,
    "class_name": fields.String,
    "club": fields.String,
    "finish_time": fields.Float,
    "firstname": fields.String,
    "lastname": fields.String,
    "result_time": fields.Float,
    "start_time": fields.Float,
    "status": fields.String
    }

runner_status_enum = ('new', 'ok', 'dq', 'dnf', 'dns')

runner_parser = reqparse.RequestParser()
runner_parser.add_argument("firstname", required=True)
runner_parser.add_argument("lastname", required=True)
runner_parser.add_argument("bip", type=int, default=-1)
runner_parser.add_argument("club")
runner_parser.add_argument("class_name")
runner_parser.add_argument("status", choices=runner_status_enum)


class RunnersAPI (Resource):
    @marshal_with(runner_fields)
    def post(self):
        args = runner_parser.parse_args()
        return create_runner(args['bip'],
                             args['class_name'],
                             args['firstname'],
                             args['lastname'],
                             args['club'],
                             args['status'])

    @marshal_with(runner_fields)
    def get(self):
        return read_runners()


class RunnerAPI (Resource):
    @marshal_with(runner_fields)
    def put(self, id):
        args = runner_parser.parse_args()
        return update_runner(id,
                             args['bip'],
                             args['class_name'],
                             args['firstname'],
                             args['lastname'],
                             args['club'],
                             args['status'])

# user api end-points
api.add_resource(RunnerAPI, "/api/runners/<int:id>")
api.add_resource(RunnersAPI, "/api/runners")



#@app.route("/runners", methods=['POST'])
#def add_runner():
#    runner = create_runner(request.json['bip'], request.json['class_name'], request.json['firstname'], request.json['lastname'], request.json['club'], request.json['status'])
#    return json.dumps(runner);


#@app.route("/runners/<int:bip>", methods=['PUT'])
#def put_runner(bip):
#    runner = update_runner(bip, request.json['class_name'], request.json['firstname'], request.json['lastname'], request.json['club'], request.json['status'])
#    return json.dumps(runner)


@app.route("/classes/init")
def init_classes():
    for class_name in ("N", "M", "M kunto", "N kunto", "P15", "T15", "T13", "P13", "P11", "T11"):
        create_class(class_name)

    return "true"


@app.route("/runners/<int:bip>/time")
def set_runner_time(bip):
    create_time(time.time(), bip)
    return "true"


@app.route("/times", methods=['GET'])
@nocache
def get_times():
    return json.dumps(read_times())


def format_time(ts):
    return time.strftime("%H:%M:%S", time.gmtime(float(ts)))

@app.route("/times", methods=['POST'])
def time_create():
    bip = request.json.get("bip")
    ts = float(request.json.get("ts"))
    app.logger.info('Time %s (%s) created to %s' % (ts, format_time(ts), "#%s" % bip if bip else '-'))
    time = create_time(ts, bip)
    app.logger.info(' **Time %s (%s) got id %i' % (ts, format_time(ts), time['id']))
    return json.dumps(time)


@app.route("/times/<int:id>", methods=['PUT'])
def put_time(id):
    bip = request.json.get("bip")
    app.logger.info('Time %i fixed to #%i' % (id, bip))
    time = update_time(id, bip)
    return json.dumps(time)


@app.route("/classes")
def get_classes():
    return json.dumps(read_classes())


@app.route("/classes/<name>", methods=['PUT'])
def put_class(name):
    ts = float(request.json.get("t_start"))
    app.logger.info('Start for class "%s" at %f (%s)' % (name, ts, format_time(ts)))
    obj = update_class(name, ts)
    return json.dumps(obj)


@app.route("/classes/<name>/start_time")
def class_start_time(name):
    """
        Raises: NoResultFound
    """
    set_class_start_time(name, time.time())
    return "true"




# UI end-points
@app.route("/")
def landing():
    return render_template("app.jade", **get_ui_args())


@app.route("/register")
@nocache
def register_ui():    
    return render_template("register.jade", **get_ui_args())


@app.route("/finish")
@nocache
def timing_ui():
    return render_template("finish.jade", **get_ui_args())


@app.route("/results")
@nocache
def results_ui():
    classes = collections.defaultdict(list)

    for r in read_runners():
        if r['status'] == 'new':
            continue

        t = r['result_time']
        result = t if (r['status'] == 'ok' and type(t) == float) else r['status']

        classes[r['class_name']].append({
            'bip': r['bip'],
            'firstname': r['firstname'],
            'lastname': r['lastname'],
            'status':  r['status'],
            'result': result
            })

    results = []

    for class_name, rs in classes.items():
        sorted_rs = sorted(rs, result_cmp)

        place = 1
        for r in sorted_rs:
            if r['status'] == 'ok' and type(r['result']) == float:
                r['place'] = place
                r['result'] = format_time(r['result'])
                place += 1
            else:
                r['result'] = i18n.status.get(r['status'], r['status'])

        results.append({'name': class_name, 'list': sorted_rs})

    # order classes
    results.sort(class_cmp)
    return render_template("results.jade", results=results, eventName=app.config.get("eventName", ""));


def get_ui_args():
    return {
        "url_timing": url_for("timing_ui"),
        "url_register": url_for("register_ui"),
        "url_results": url_for("results_ui"),
        "app": url_for('static', filename='app/app.js'),
    }

def class_cmp(a, b):
    f = lambda x:'kunto' in x['name']
    l = lambda x:len(x['name'])
    m = lambda x:x['name'].startswith('M') or x['name'].startswith('P')
    return 4 * cmp(m(a), m(b)) + 2 * cmp(f(a), f(b)) + cmp(l(a), l(b))


def result_cmp(a, b):
    ra = a['result']
    rb = b['result']
    if type(ra) != float:
        return 1
    if type(rb) != float:
        return -1
    return cmp(ra, rb) # int(ra > rb) - int(ra < rb)


