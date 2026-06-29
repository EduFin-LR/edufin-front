import api from './api'
import type { ProfileResponse, UserResponse } from '../types/auth'

export const getMyProfile  = ()                  => api.get<ProfileResponse>('/profiles/me')
export const getUserById   = (userId: string)    => api.get<UserResponse>(`/users/${userId}`)
