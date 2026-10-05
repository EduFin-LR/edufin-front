import api from './api'
import type { DiagnosticQuestion, DiagnosticAnswer, DiagnosticResultProfile } from '../types/assessment'

// ── Diagnóstico legado ────────────────────────────────────────────────────────
// Se conserva para no romper otros consumidores mientras se migra el flujo.
export const getDiagnosticQuestions = (limit = 10) =>
    api.get<DiagnosticQuestion[]>(`/assessments/diagnostic/questions?limit=${limit}`)

export const submitDiagnostic = (answers: DiagnosticAnswer[]) =>
    api.post<DiagnosticResultProfile>('/assessments/diagnostic/submit', { answers })

// ── Pre-test / Post-test experimental ────────────────────────────────────────
export type ExperimentalAssessmentPhase = 'PRE_TEST' | 'POST_TEST'

export interface ExperimentalOption {
    id: string
    optionText: string
}

export interface ExperimentalQuestion {
    id: string
    code: string
    questionOrder: number
    moduleNumber: number
    moduleName: string
    competency: string
    questionText: string
    options: ExperimentalOption[]
}

export interface ExperimentalAnswer {
    questionId: string
    selectedOptionId: string
    timeTakenSec: number
}

export interface ExperimentalSubmissionResponse {
    submissionId: string
    phase: ExperimentalAssessmentPhase
    totalQuestions: number
    submittedAt: string
}

export const getExperimentalQuestions = () =>
    api.get<ExperimentalQuestion[]>('/assessments/experimental/questions')

export const submitExperimentalAssessment = (
    phase: ExperimentalAssessmentPhase,
    answers: ExperimentalAnswer[],
) =>
    api.post<ExperimentalSubmissionResponse>('/assessments/experimental/submit', {
        phase,
        answers,
    })
