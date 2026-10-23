import api from './api'

export interface Lesson {
    id:          string
    title:       string
    content:     string
    videoUrl:    string
    lessonOrder: number
    lessonType:  'QUIZ' | 'VIDEO' | 'READING' | 'FINAL'
    status:      'UNLOCKED' | 'LOCKED' | 'COMPLETED'
    // Solo QUIZ: 0 sin intento; 1-3 según el mejor puntaje
    stars?:      number
}

export interface TopicLessons {
    topicId:   string
    topicName: string
    category:  string
    lessons:   Lesson[]
}

export const getTopicLessons = (topicId: string) =>
    api.get<TopicLessons>(`/topics/${topicId}/lessons`)
