import api from './api'
import type { SignUpPayload, SignUpResponse, SignInPayload, SignInResponse } from '../types/auth'

// POST /iam/auth/sign-up
export const signUp = (payload: SignUpPayload) =>
    api.post<SignUpResponse>('/iam/auth/sign-up', payload)

// POST /iam/auth/sign-in
export const signIn = (payload: SignInPayload) =>
    api.post<SignInResponse>('/iam/auth/sign-in', payload)

// POST /iam/auth/forgot-password
export const forgotPassword = (email: string) =>
    api.post('/iam/auth/forgot-password', { email })

// POST /iam/auth/reset-password
export const resetPassword = (email: string, code: string, newPassword: string) =>
    api.post('/iam/auth/reset-password', { email, code, newPassword })
