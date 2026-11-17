import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import net from 'net'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readDotEnvVar(key) {
  try {
    const envPath = path.join(__dirname, '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match && match[1] === key) {
          let lVal = match[2] || ''
          if ((lVal.startsWith('"') && lVal.endsWith('"')) || (lVal.startsWith("'") && lVal.endsWith("'"))) {
            lVal = lVal.slice(1, -1)
          }
          return lVal.trim()
        }
      }
    }
  } catch {
    return ''
  }
  return ''
}

function getEnvVar(key, defaultValue) {
  const fromFile = readDotEnvVar(key)
  if (fromFile) return fromFile
  return process.env[key] || defaultValue
}

function isPortReachable(host, port, timeoutMs = 150) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false
    const finish = (ok) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
    socket.connect(Number(port), host)
  })
}

export default defineConfig(async () => {
  const dotEnvApiHost = readDotEnvVar('API_HOST')
  const rawApiHost = getEnvVar('API_HOST', '')
  const apiHost = rawApiHost || '127.0.0.1'
  const apiPortAbs = getEnvVar('API_PORT_ABS', '3100')
  const apiPortD0 = getEnvVar('API_PORT_D0', '3002')

  const isLoopback = apiHost === '127.0.0.1' || apiHost === 'localhost' || apiHost === '::1'
  const hasExternalApi = Boolean(rawApiHost) && (
    Boolean(dotEnvApiHost) ||
    !isLoopback ||
    (await isPortReachable(apiHost, apiPortAbs))
  )

  const frontendPort = Number(getEnvVar('PORT', '8501')) || 8501

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __HAS_EXTERNAL_API__: JSON.stringify(hasExternalApi)
    },
    server: {
      host: '0.0.0.0',
      port: frontendPort,
      allowedHosts: true,
      ...(hasExternalApi
        ? {
            proxy: {
              '/api-abs': {
                target: `http://${apiHost}:${apiPortAbs}`,
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/api-abs/, '')
              },
              '/api-d0': {
                target: `http://${apiHost}:${apiPortD0}`,
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/api-d0/, '')
              }
            }
          }
        : {})
    }
  }
})
