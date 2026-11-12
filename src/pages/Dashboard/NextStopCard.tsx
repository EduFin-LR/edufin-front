import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { FaArrowRight } from 'react-icons/fa'
import { CoverArt } from '../Learning/ModuleCover'
import type { RouteTheme } from '../Learning/routeThemes'
import type { DashboardLearningPath } from '../../types/auth'
import type { Lesson } from '../../services/learningService'

const TYPE_LABEL: Record<Lesson['lessonType'], string> = {
    LESSON: 'Lección', READING: 'Lección', QUIZ: 'Reto', VIDEO: 'Video', FINAL: 'Caso real',
}

// Tarjeta principal del inicio: el módulo elegido con su portada y la lección que sigue
export default function NextStopCard({ course, theme, lessons, prevName, onOpen }: {
    course:   DashboardLearningPath
    theme:    RouteTheme
    lessons:  Lesson[] | undefined      // undefined mientras carga
    prevName: string | null             // módulo anterior (para explicar el bloqueo)
    onOpen:   () => void
}) {
    const locked = course.status === 'LOCKED'
    const done   = course.status === 'COMPLETED'
    const light  = !!theme.coverLight
    const accent = light ? '#3A9E52' : theme.line
    // Priorizar la actividad iniciada antes que una nueva.
    const left = Math.max(0, course.totalLessons - course.completedLessons)
    const next = lessons?.find(l => l.status === 'IN_PROGRESS')
        ?? lessons?.find(l => l.status === 'UNLOCKED')
    // El FINAL del módulo es virtual y no viene en GET /topics/{id}/lessons.
    const finalPending = !next && left === 1 && course.completedLessons > 0

    let stopLabel: string, stopText: string
    if (done) {
        stopLabel = 'Módulo completado'
        stopText = `Terminaste las ${course.totalLessons} actividades`
    } else if (locked) {
        stopLabel = 'Bloqueado'
        stopText = prevName ? `Completa «${prevName}» para desbloquearlo` : 'Aún no está disponible'
    } else if (next) {
        stopLabel = `Tu siguiente parada · ${TYPE_LABEL[next.lessonType] ?? 'Actividad'}`
        stopText = next.title
    } else if (lessons === undefined) {
        stopLabel = 'Tu siguiente parada'
        stopText = 'Cargando siguiente actividad…'
    } else if (finalPending) {
        stopLabel = 'Tu siguiente parada · Caso real'
        stopText = 'Evaluación final del módulo'
    } else {
        stopLabel = 'Tu siguiente parada'
        stopText = course.completedLessons > 0 ? 'Abre el mapa para continuar' : 'Empieza el módulo'
    }

    return (
        <motion.section
            key={course.topicId}
            className={`next-stop ${light ? 'next-stop--light' : ''}`}
            style={{ '--ns-scrim': theme.cover, '--ns-accent': accent } as CSSProperties}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            aria-live="polite"
        >
            <svg className="next-stop-art" viewBox="0 0 1000 420" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
                <CoverArt k={theme.key} n={theme.moduleNum} />
            </svg>
            <div className="next-stop-scrim" />

            <div className="next-stop-body">
                <span className="next-stop-eyebrow">
                    Módulo {String(theme.moduleNum).padStart(2, '0')} · {theme.world}
                </span>
                <h2 className="next-stop-title">{course.topicName}</h2>

                <div className="next-stop-lesson">
                    <small>{stopLabel}</small>
                    <b>{stopText}</b>
                </div>

                <div className="next-stop-progress">
                    <span className="next-stop-bar"><i style={{ width: `${course.progressPercentage}%` }} /></span>
                    <span>
                        {course.completedLessons} de {course.totalLessons} actividades
                        {!done && !locked && left > 0 && ` · ${left === 1 ? 'te falta 1 actividad' : `te faltan ${left} actividades`}`}
                    </span>
                </div>

                <button className={`next-stop-btn ${locked ? 'next-stop-btn--ghost' : ''}`} onClick={onOpen}>
                    {done ? 'Repasar' : locked ? 'Ver ruta' : <>Continuar <FaArrowRight className="ic" /></>}
                </button>
            </div>
        </motion.section>
    )
}
