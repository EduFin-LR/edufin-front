import api from './api'
import type { DashboardResponse } from '../types/auth'

export const getDashboard = () => api.get<DashboardResponse>('/dashboard/home/me')
