import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getEnvVar(key, defaultValue) {
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
  } catch (_) {}
  return process.env[key] || defaultValue
}

const apiHost = getEnvVar('API_HOST', '127.0.0.1')
const apiPortAbs = getEnvVar('API_PORT_ABS', '3100')
const apiPortD0 = getEnvVar('API_PORT_D0', '3002')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 8501,
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
})
