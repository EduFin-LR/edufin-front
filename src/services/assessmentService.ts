import api from './api'
import type { DiagnosticQuestion, DiagnosticAnswer, DiagnosticResultProfile } from '../types/assessment'

export const getDiagnosticQuestions = (limit = 10) =>
    api.get<DiagnosticQuestion[]>(`/assessments/diagnostic/questions?limit=${limit}`)

export const submitDiagnostic = (answers: DiagnosticAnswer[]) =>
    api.post<DiagnosticResultProfile>('/assessments/diagnostic/submit', { answers })


