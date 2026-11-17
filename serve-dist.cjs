const http = require('http')
const fs = require('fs')
const path = require('path')

const port = Number(process.env.PORT || 3000)
// Vite React build → dist/  (Quasar era dist/spa)
const rootCandidates = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'dist', 'spa')
]
const root = rootCandidates.find((p) => fs.existsSync(path.join(p, 'index.html'))) || rootCandidates[0]

function getEnvVar(key, defaultValue) {
  try {
    const envPath = path.join(__dirname, '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match) {
          const lKey = match[1]
          let lVal = match[2] || ''
          if (
            (lVal.startsWith('"') && lVal.endsWith('"')) ||
            (lVal.startsWith("'") && lVal.endsWith("'"))
          ) {
            lVal = lVal.slice(1, -1)
          }
          if (lKey === key) return lVal.trim()
        }
      }
    }
  } catch (_) {}
  return process.env[key] || defaultValue
}

const apiHost = getEnvVar('API_HOST', '127.0.0.1')
const apiPortAbs = getEnvVar('API_PORT_ABS', '3100')
const apiPortD0 = getEnvVar('API_PORT_D0', '3002')

const apiTargets = {
  '/api-abs': `http://${apiHost}:${apiPortAbs}`,
  '/api-d0': `http://${apiHost}:${apiPortD0}`
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
}

function sendFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500)
      res.end('Internal Server Error')
      return
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0'
    })
    res.end(data)
  })
}

function proxyRequest(req, res, prefix) {
  const target = new URL(apiTargets[prefix])
  const proxiedPath = (req.url || '/').replace(prefix, '') || '/'

  const proxyReq = http.request(
    {
      hostname: target.hostname,
      port: target.port,
      path: proxiedPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${target.hostname}:${target.port}`
      }
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, {
        ...proxyRes.headers,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      })
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: 'Bad Gateway', target: apiTargets[prefix] }))
  })

  req.pipe(proxyReq)
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])

  for (const prefix of Object.keys(apiTargets)) {
    if (urlPath === prefix || urlPath.startsWith(`${prefix}/`)) {
      proxyRequest(req, res, prefix)
      return
    }
  }

  const requestedPath = path.normalize(path.join(root, urlPath))

  if (!requestedPath.startsWith(root)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.stat(requestedPath, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(requestedPath, res)
      return
    }

    sendFile(path.join(root, 'index.html'), res)
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend dist server on ${port} (root=${root})`)
})
