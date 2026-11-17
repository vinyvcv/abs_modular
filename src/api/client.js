import axios from 'axios'
import { handleMockRequest } from './mockApi'

/* global __HAS_EXTERNAL_API__ */
const hasExternalApi = typeof __HAS_EXTERNAL_API__ !== 'undefined' ? __HAS_EXTERNAL_API__ : false

function withMockFallback(instance) {
  if (!hasExternalApi) {
    instance.defaults.adapter = async (config) => {
      const data = await handleMockRequest(config)
      return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }
    return instance
  }

  instance.interceptors.response.use(
    (res) => res,
    async (err) => {
      const status = err?.response?.status
      if (!err.response || status === 502 || status === 503 || status === 504) {
        const data = await handleMockRequest(err.config)
        return { data, status: 200, statusText: 'OK (Mock)', headers: {}, config: err.config }
      }
      return Promise.reject(err)
    }
  )
  return instance
}

export const api = withMockFallback(
  axios.create({
    baseURL: '/api-abs'
  })
)

export const absD0Api = withMockFallback(
  axios.create({
    baseURL: '/api-d0'
  })
)

absD0Api.interceptors.request.use((config) => {
  const token = localStorage.getItem('abs_d0_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
