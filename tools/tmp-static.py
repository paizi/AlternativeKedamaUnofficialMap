# -*- coding: utf-8 -*-

import http.server
import socketserver
import os

PORT = 28080

Handler = http.server.SimpleHTTPRequestHandler

os.chdir('../')

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
