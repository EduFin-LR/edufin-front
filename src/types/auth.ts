// ── Sign-up ────────────────────────────────────────────────────────────────────
export type Gender = 'MALE' | 'FEMALE'

export interface SignUpPayload {
    username: string
    email:    string
    password: string
    gender:   Gender
}

export interface SignUpResponse {
    message: string
}

// ── Sign-in ────────────────────────────────────────────────────────────────────
export interface SignInPayload {
    username: string
    password: string
}

export interface SignInResponse {
    id:       string
    username: string
    token:    string
}

// ── GET /profiles/me ───────────────────────────────────────────────────────────
export interface ProfileResponse {
    id:              string
    userId:          string
    totalPoints:     number
    currentLevel:    number
    streakDays:      number
    diagnostic_test: boolean
}

// ── GET /users/{userId} ────────────────────────────────────────────────────────
export interface UserResponse {
    id:         string
    username:   string
    email:      string
    fullName:   string | null
    avatarUrl:  string | null
}

// ── GET /dashboard/home/me ─────────────────────────────────────────────────────
export interface DashboardLearningPath {
    topicId:             string
    topicName:           string
    completedLessons:    number
    totalLessons:        number
    progressPercentage:  number
    status:              'UNLOCKED' | 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED'
    isAiRecommended:     boolean
}

export interface DashboardResponse {
    user: {
        firstName:  string
        avatarUrl:  string | null
    }
    gamification: {
        streakDays:    number
        currentLevel:  number
        currentXp:     number
        nextLevelXp:   number
    }
    learningPath: DashboardLearningPath[]
}

// ── Pendientes ─────────────────────────────────────────────────────────────────
// export interface ForgotPasswordPayload { email: string }
// export interface ResetPasswordPayload  { token: string; password: string }
