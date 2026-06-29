import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'https://edufin-backend-service-production.up.railway.app/api/v1',
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
})

// Adjunta el token Bearer en cada request si existe
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Redirige al login en caso de 401, pero solo si NO es un endpoint de autenticación
api.interceptors.response.use(
    response => response,
    error => {
        const isAuthEndpoint = error.config?.url?.includes('/iam/auth/')
        if (error.response?.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('token')
            window.location.href = '/'
        }
        return Promise.reject(error)
    },
)

export default api
