import api from './api'

export interface QuizOption {
    id:            string
    optionText:    string
    isCorrect:     boolean
    matchCategory: string | null
}

export interface QuizQuestion {
    id:             string
    questionText:   string
    explanation:    string | null
    questionType:   'MULTIPLE_CHOICE' | 'DRAG_AND_DROP'
    hint:           string
    successMessage: string
    errorMessage:   string
    options:        QuizOption[]
}

export interface QuizCompleteResult {
    correctAnswers:   number
    incorrectAnswers: number
    totalQuestions:   number
    xpEarned:         number
    passed:           boolean
}

export interface AttemptPayload {
    questionId:       string
    selectedOptionId: string
    timeTakenSec:     number
}

export const getLessonQuestions = (lessonId: string) =>
    api.get<QuizQuestion[]>(`/lessons/${lessonId}/questions`)

export const startLesson = (lessonId: string) =>
    api.post(`/attempts/lessons/${lessonId}/start`)

export const submitAttempt = (payload: AttemptPayload) =>
    api.post('/attempts', payload)

export const completeLesson = (lessonId: string, timeSpentSec: number) =>
    api.post<QuizCompleteResult>(`/attempts/lessons/${lessonId}/complete`, { timeSpentSec })
