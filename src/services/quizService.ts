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
    interactionType?: InteractionType
    selectionReason?: SelectionReason
}

interface AdaptiveQuestionEnvelope {
    question:        Omit<QuizQuestion, 'interactionType' | 'selectionReason'>
    interactionType: InteractionType
    selectionReason: SelectionReason
}

export interface AdaptiveQuizResponse {
    adaptive:                   boolean
    standardQuestionCount:      number
    reinforcementQuestionCount: number
    questions:                  AdaptiveQuestionEnvelope[]
}

export interface DynamicFinalResponse {
    topicId:               string
    adaptive:              boolean
    standardQuestionCount: number
    adaptiveQuestionCount: number
    questions:             AdaptiveQuestionEnvelope[]
}


export interface FinalCompletionResponse {
    totalQuestions:     number
    correctAnswers:     number
    incorrectAnswers:   number
    score:              number
    passed:             boolean
    finalExperience:    number
    nextTopicUnlocked:  boolean
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
    questionId:             string
    selectedOptionId:       string
    timeTakenSec:           number
    selectedMatchCategory?: string | null
    interactionType?:       InteractionType
    selectionReason?:       SelectionReason
}

const flattenQuestions = (
    questions: AdaptiveQuestionEnvelope[]
): QuizQuestion[] =>
    questions.map(item => ({
        ...item.question,
        interactionType: item.interactionType,
        selectionReason: item.selectionReason,
    }))

// LESSON / READING / VIDEO
export const getLessonQuestions = (lessonId: string) =>
    api.get<QuizQuestion[]>(`/lessons/${lessonId}/questions`)

// QUIZ adaptativo
export const getAdaptiveQuizQuestions = async (lessonId: string) => {
    const response = await api.get<AdaptiveQuizResponse>(
        `/assessments/adaptive-quizzes/lessons/${lessonId}`
    )

    return {
        ...response,
        data: flattenQuestions(response.data.questions),
    }
}

// FINAL dinámico por Topic/módulo
export const getDynamicFinalQuestions = async (topicId: string) => {
    const response = await api.get<DynamicFinalResponse>(
        `/assessments/finals/topics/${topicId}`
    )

    return {
        ...response,
        data: flattenQuestions(response.data.questions),
    }
}

export const startLesson = (lessonId: string) =>
    api.post(`/attempts/lessons/${lessonId}/start`)

export const submitAttempt = (payload: AttemptPayload) =>
    api.post('/attempts', payload)

export const completeLesson = (lessonId: string, timeSpentSec: number) =>
    api.post<QuizCompleteResult>(
        `/attempts/lessons/${lessonId}/complete`,
        { timeSpentSec }
    )

export const completeDynamicFinal = (
    topicId: string,
    questionIds: string[],
    timeSpentSec: number
) =>
    api.post<FinalCompletionResponse>(
        `/assessments/finals/topics/${topicId}/complete`,
        {
            questionIds,
            timeSpentSec,
        }
    )

