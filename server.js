// lightworkai.ca is retired (2026-10-14): Lightwork is now Glacier for Business.
// This server only redirects. Every path answers 301 to glacierfinancial.ca/business and keeps the
// query string (so an old ?setup=done link still lands with ?setup=done). The browser keeps any #fragment itself.
// robots.txt and sitemap.xml are still served as plain files so crawlers can re-crawl the old URLs and see the 301s.
// Why not `serve`: serve-handler matches the path only and drops the query string on a redirect (checked in
// node_modules/serve-handler/src/index.js, shouldRedirect). serve.json is kept as the path-only fallback.
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const { default: FALLBACK, map: MAP } = JSON.parse(fs.readFileSync(path.join(__dirname, 'redirects.json'), 'utf8'))
const STATIC = { '/robots.txt': 'text/plain; charset=utf-8', '/sitemap.xml': 'application/xml; charset=utf-8' }

http.createServer((req, res) => {
  try {
    const q = req.url.indexOf('?')
    const rawPath = q < 0 ? req.url : req.url.slice(0, q)
    const qs = q < 0 ? '' : req.url.slice(q + 1)
    // /a//b -> /a/b, drop trailing slash and index.html, lowercase
    const p = ('/' + rawPath.split('/').filter(Boolean).join('/')).replace(/\/index\.html$/, '').toLowerCase() || '/'

    if (p === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok') }
    if (STATIC[p] && (req.method === 'GET' || req.method === 'HEAD')) {
      res.writeHead(200, { 'Content-Type': STATIC[p] })
      return res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(path.join(__dirname, p.slice(1))))
    }

    const dest = Object.hasOwn(MAP, p) ? MAP[p] : FALLBACK
    const target = dest + (qs ? (dest.includes('?') ? '&' : '?') + qs : '')
    res.writeHead(301, { Location: target, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' })
    res.end(req.method === 'HEAD' ? undefined : 'Moved to ' + target + '\n')
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }); res.end('bad request\n')
  }
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0')
