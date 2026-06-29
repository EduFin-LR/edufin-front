export interface DiagnosticOption {
    optionId:   string
    optionText: string
}

export interface DiagnosticQuestion {
    questionId:   string
    questionText: string
    options:      DiagnosticOption[]
}

export interface DiagnosticAnswer {
    questionId:       string
    selectedOptionId: string
    timeTakenSec:     number
}

export interface DiagnosticResultProfile {
    totalQuestions:   number
    correctAnswers:   number
    incorrectAnswers: number
    score:            number
    financialLevel:   string
    feedbackMessage:  string
}
