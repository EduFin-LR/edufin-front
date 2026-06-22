// import axios from 'axios'
//
// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
//     timeout: 10_000,
//     headers: { 'Content-Type': 'application/json' },
// })
//
// // Interceptor: adjunta el token de cada request
// api.interceptors.request.use(config => {
//     const token = localStorage.getItem('token')
//     if (token) config.headers.Authorization = `Bearer ${token}`
//     return config
// })
//
// // Interceptor: manejo global de 401
// api.interceptors.response.use(
//     response => response,
//     error => {
//         if (error.response?.status === 401) {
//             localStorage.removeItem('token')
//             window.location.href = '/'
//         }
//         return Promise.reject(error)
//     },
// )
//
// export default api
