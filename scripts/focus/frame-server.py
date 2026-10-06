# Local-only: serves the design handoff folder and accepts POST /save?file=NAME to write rendered frame HTML to disk.
import http.server, os, sys, urllib.parse
ROOT, OUT = sys.argv[1], sys.argv[2]
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    # DNS rebinding: a foreign host name pointed at 127.0.0.1 must not read the folder either
    def host_ok(self): return self.headers.get('Host', '') in ('127.0.0.1:8779', 'localhost:8779')
    def do_GET(self):
        if not self.host_ok(): self.send_response(403); self.end_headers(); return
        super().do_GET()
    def do_HEAD(self):
        if not self.host_ok(): self.send_response(403); self.end_headers(); return
        super().do_HEAD()
    def do_POST(self):
        if not self.host_ok(): self.send_response(403); self.end_headers(); return
        # only the page this server itself serves may post frames (another site open in the browser cannot)
        origin = self.headers.get('Origin', '')
        if origin not in ('http://127.0.0.1:8779', 'http://localhost:8779'): self.send_response(403); self.end_headers(); return
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        name = os.path.basename(q.get('file', [''])[0])
        if not name.endswith('.html'): self.send_response(400); self.end_headers(); return
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        open(os.path.join(OUT, name), 'wb').write(body)
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
http.server.ThreadingHTTPServer(('127.0.0.1', 8779), H).serve_forever()
