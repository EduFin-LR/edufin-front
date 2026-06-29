import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { getMyProfile, getUserById } from '../services/profileService'
import type { ProfileResponse, UserResponse } from '../types/auth'

interface AuthState {
    token:    string | null
    userId:   string | null
    username: string | null
    profile:  ProfileResponse | null
    userInfo: UserResponse | null
    ready:    boolean          // true once the initial fetch attempt is done
}

interface AuthContextValue extends AuthState {
    /** Call after sign-in to store credentials and load remote data */
    login:  (token: string, userId: string, username: string) => Promise<void>
    /** Wipe all auth state and localStorage */
    logout: () => void
    /** Re-fetch profile + userInfo (e.g. after XP gain) */
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        token:    localStorage.getItem('token'),
        userId:   localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
        profile:  JSON.parse(localStorage.getItem('profile')  ?? 'null'),
        userInfo: JSON.parse(localStorage.getItem('userInfo') ?? 'null'),
        ready:    false,
    })

    // Fetch both services; silently fails (e.g. expired token → interceptor will redirect)
    const fetchRemoteData = useCallback(async (userId: string) => {
        try {
            const [profileRes, userRes] = await Promise.all([
                getMyProfile(),
                getUserById(userId),
            ])
            localStorage.setItem('profile',  JSON.stringify(profileRes.data))
            localStorage.setItem('userInfo', JSON.stringify(userRes.data))
            setState(prev => ({ ...prev, profile: profileRes.data, userInfo: userRes.data }))
        } catch {
            // token is invalid — interceptor in api.ts handles the redirect
        }
    }, [])

    // On mount: if there is already a token, refresh profile data from the server
    useEffect(() => {
        const userId = localStorage.getItem('userId')
        if (userId && localStorage.getItem('token')) {
            fetchRemoteData(userId).finally(() => {
                setState(prev => ({ ...prev, ready: true }))
            })
        } else {
            setState(prev => ({ ...prev, ready: true }))
        }
    }, [fetchRemoteData])

    const login = useCallback(async (token: string, userId: string, username: string) => {
        localStorage.setItem('token',    token)
        localStorage.setItem('userId',   userId)
        localStorage.setItem('username', username)
        setState(prev => ({ ...prev, token, userId, username }))
        await fetchRemoteData(userId)
    }, [fetchRemoteData])

    const logout = useCallback(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('username')
        localStorage.removeItem('profile')
        localStorage.removeItem('userInfo')
        setState({ token: null, userId: null, username: null, profile: null, userInfo: null, ready: true })
    }, [])

    const refreshProfile = useCallback(async () => {
        const userId = localStorage.getItem('userId')
        if (userId) await fetchRemoteData(userId)
    }, [fetchRemoteData])

    return (
        <AuthContext.Provider value={{ ...state, login, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}
