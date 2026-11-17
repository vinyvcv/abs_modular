import axios from 'axios'

export const api = axios.create({
  baseURL: '/api-abs'
})

export const absD0Api = axios.create({
  baseURL: '/api-d0'
})

absD0Api.interceptors.request.use((config) => {
  const token = localStorage.getItem('abs_d0_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
