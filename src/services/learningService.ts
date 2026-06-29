import api from './api'

export interface Lesson {
    id:          string
    title:       string
    content:     string
    videoUrl:    string
    lessonOrder: number
    lessonType:  'QUIZ' | 'VIDEO' | 'READING'
    status:      'UNLOCKED' | 'LOCKED' | 'COMPLETED'
}

export interface TopicLessons {
    topicId:   string
    topicName: string
    category:  string
    lessons:   Lesson[]
}

export const getTopicLessons = (topicId: string) =>
    api.get<TopicLessons>(`/topics/${topicId}/lessons`)
