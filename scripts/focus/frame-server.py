# Local-only: serves the design handoff folder and accepts POST /save?file=NAME to write rendered frame HTML to disk.
import http.server, os, sys, urllib.parse
ROOT, OUT = sys.argv[1], sys.argv[2]
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        name = os.path.basename(q.get('file', [''])[0])
        if not name.endswith('.html'): self.send_response(400); self.end_headers(); return
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        open(os.path.join(OUT, name), 'wb').write(body)
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
http.server.ThreadingHTTPServer(('127.0.0.1', 8779), H).serve_forever()
