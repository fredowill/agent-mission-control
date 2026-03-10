# Mission Control Operations Rules

## Rule 6: Don't restart servers unnecessarily.
MC external HTML files hot-reload without a restart (`readPage` reads from disk on each request). Only restart the server when server.js itself changes (new routes, API endpoints, embedded HTML). Unnecessary restarts cause bugs. If unsure whether a restart is needed, curl the page first to check.

## Rule 14: Never write non-ASCII punctuation to data files.
Use ASCII equivalents in all JSON, NDJSON, and data files: `--` for em dash, `->` for arrow, straight quotes only, `...` for ellipsis. server.js writeJSON sanitizes at the write layer, but don't rely on it -- write clean from the start.
