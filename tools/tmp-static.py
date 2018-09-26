# -*- coding: utf-8 -*-

import logging
import sys
import time
import os

from flask import Flask
from flask_compress import Compress
from flask.helpers import send_file
from flask.globals import request
from flask.templating import render_template
from flask import abort
from flask import redirect

app = Flask(__name__);
Compress(app);

@app.route('/map')
def toEntrance():
    return redirect('/map/view/kedama-map.html'), 302

@app.route('/map/<path:file>')
def download_map(file):
    fpath = os.path.abspath(os.path.join('../',file))
    if not (os.path.exists(fpath) and os.path.isfile(fpath)):
        abort(404)
    return send_file(fpath), 200


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG, stream=sys.stdout, format='[%(asctime)s][%(thread)6d/%(levelname)s] %(message)s')
    print("============================start=================================")
    app.run(host='0.0.0.0', port=28080, debug=True)
