import api from './api'

export type InteractionType = 'QUIZ' | 'FINAL' | 'REINFORCEMENT'
export type SelectionReason = 'STANDARD' | 'LOW_MASTERY'

export interface QuizOption {
    id:            string
    optionText:    string
    isCorrect:     boolean
    matchCategory: string | null
}

export interface QuizQuestion {
    id:              string
    questionText:    string
    explanation:     string | null
    questionType:    'MULTIPLE_CHOICE' | 'DRAG_AND_DROP'
    hint:            string
    successMessage:  string
    errorMessage:    string
    TheoryText?:     string
    options:         QuizOption[]

    // Metadata devuelta por el endpoint adaptativo.
    interactionType: InteractionType
    selectionReason: SelectionReason
}

interface AdaptiveQuizQuestion {
    question:        Omit<QuizQuestion, 'interactionType' | 'selectionReason'>
    interactionType: InteractionType
    selectionReason: SelectionReason
}

export interface AdaptiveQuizResponse {
    adaptive:                  boolean
    standardQuestionCount:     number
    reinforcementQuestionCount:number
    questions:                 AdaptiveQuizQuestion[]
}

export interface QuizCompleteResult {
    correctAnswers:      number
    incorrectAnswers:    number
    totalQuestions:      number
    lessonExperience:    number
    questionsExperience: number
    totalExperience:     number
    passed?:             boolean
}

export interface AttemptPayload {
    questionId:           string
    selectedOptionId:     string
    timeTakenSec:         number
    selectedMatchCategory?: string | null
    interactionType:      InteractionType
    selectionReason:      SelectionReason
}

/**
 * Para QUIZ usamos el endpoint adaptativo.
 * El backend devuelve cada pregunta envuelta con interactionType/selectionReason;
 * aquí la aplanamos para que Quiz.tsx pueda seguir trabajando con QuizQuestion[].
 */
export const getLessonQuestions = async (lessonId: string) => {
    const response = await api.get<AdaptiveQuizResponse>(
        `/assessments/adaptive-quizzes/lessons/${lessonId}`
    )

    return {
        ...response,
        data: response.data.questions.map(item => ({
            ...item.question,
            interactionType: item.interactionType,
            selectionReason: item.selectionReason,
        })),
    }
}

export const startLesson = (lessonId: string) =>
    api.post(`/attempts/lessons/${lessonId}/start`)

export const submitAttempt = (payload: AttemptPayload) =>
    api.post('/attempts', payload)

export const completeLesson = (lessonId: string, timeSpentSec: number) =>
    api.post<QuizCompleteResult>(`/attempts/lessons/${lessonId}/complete`, { timeSpentSec })
