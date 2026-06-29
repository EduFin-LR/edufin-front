import api from './api'
import type { ProfileResponse, UserResponse } from '../types/auth'

export interface LeaderboardEntry {
    userId:       string
    displayName:  string
    totalPoints:  number
    currentLevel: number
    streakDays:   number
}

export const getMyProfile    = ()                  => api.get<ProfileResponse>('/profiles/me')
export const getUserById     = (userId: string)    => api.get<UserResponse>(`/users/${userId}`)
export const getLeaderboard  = ()                  => api.get<LeaderboardEntry[]>('/profiles/leaderboard')
