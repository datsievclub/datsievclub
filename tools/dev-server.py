#!/usr/bin/env python3
"""Локальный сервер для просмотра макета.

python3 -m http.server отдаёт файлы с кэшированием и отвечает 304 на
повторные запросы. Из-за этого браузер продолжал показывать старые
assets/site.css и assets/site.js после правок — макет выглядел
недоделанным, хотя в файлах уже лежала свежая вёрстка.

Здесь на каждый ответ ставим no-store: превью всегда показывает то,
что реально лежит на диске.
"""

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_head(self):
        # 304 не отдаём: условный запрос тоже должен принести свежий файл
        for header in ("If-Modified-Since", "If-None-Match"):
            while header in self.headers:
                del self.headers[header]
        return super().send_head()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8143
    ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()
