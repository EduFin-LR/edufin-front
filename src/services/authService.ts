import api from './api'
import type { SignUpPayload, SignUpResponse, SignInPayload, SignInResponse } from '../types/auth'

// POST /iam/auth/sign-up
export const signUp = (payload: SignUpPayload) =>
    api.post<SignUpResponse>('/iam/auth/sign-up', payload)

// POST /iam/auth/sign-in
export const signIn = (payload: SignInPayload) =>
    api.post<SignInResponse>('/iam/auth/sign-in', payload)

// ── Pendientes — descomentar cuando el backend los entregue ───────────────────
// export const forgotPassword = (email: string)                   => api.post('/iam/auth/forgot-password', { email })
// export const resetPassword  = (token: string, password: string) => api.post('/iam/auth/reset-password',  { token, password })
// export const logout         = ()                                 => { localStorage.removeItem('token') }
