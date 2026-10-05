import { useEffect, useMemo, useState } from 'react'
import { playSelect } from '../../utils/sounds'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import Logo from '../../components/Logo/Logo'
import fuegoGif   from '../../assets/gifs/fuego.gif'
import progresoA  from '../../assets/images/ProgresoA.png'
import progresoB  from '../../assets/images/ProgresoB.png'
import progresoC  from '../../assets/images/ProgresoC.png'
import progresoD  from '../../assets/images/ProgresoD.png'
import { getDashboard } from '../../services/dashboardService'
import { getExperimentalAssessmentStatus } from '../../services/assessmentService'
import type { ExperimentalAssessmentStatus } from '../../services/assessmentService'
import { getTopicLessons } from '../../services/learningService'
import type { Lesson } from '../../services/learningService'
import { themeForTopic } from '../Learning/routeThemes'
import NextStopCard from './NextStopCard'
import CourseMetro from './CourseMetro'
import { useAuth } from '../../context/AuthContext'
import type { DashboardResponse } from '../../types/auth'
import './Dashboard.css'


const LEVEL_TIERS = [
    { img: progresoA, label: 'Iniciado',  minLevel: 1,  maxLevel: 5  },
    { img: progresoB, label: 'Aprendiz',  minLevel: 6,  maxLevel: 15 },
    { img: progresoC, label: 'Experto',   minLevel: 16, maxLevel: 25 },
    { img: progresoD, label: 'Maestro',   minLevel: 26, maxLevel: 99 },
]

function tierIndex(level: number) {
    return LEVEL_TIERS.findIndex((t) => level >= t.minLevel && level <= t.maxLevel)
}

// ── Level Badge ───────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: number }) {
    const ti  = Math.max(0, tierIndex(level))
    const img = LEVEL_TIERS[ti].img
    return (
        <div className="level-badge-wrap">
            <img src={img} alt="nivel" className="level-badge-img" />
            <span className="level-badge-num">{level}</span>
        </div>
    )
}

// ── Level road modal ──────────────────────────────────────────────────────────
function LevelRoadModal({ level, onClose }: { level: number; onClose: () => void }) {
    const current = tierIndex(level)
    return (
        <AnimatePresence>
            <motion.div
                className="lvl-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="lvl-modal"
                    initial={{ scale: 0.88, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.88, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                    onClick={e => e.stopPropagation()}
                >
                    <h2 className="lvl-modal-title">Tu camino de niveles</h2>
                    <p className="lvl-modal-sub">Nivel actual: <strong>{level}</strong></p>

                    <div className="lvl-road">
                        {LEVEL_TIERS.map((tier, i) => {
                            const unlocked = i <= current
                            const isNow    = i === current
                            return (
                                <div key={tier.label} className="lvl-road-row">
                                    {i > 0 && (
                                        <div className={`lvl-road-line ${unlocked ? 'lvl-road-line--done' : ''}`} />
                                    )}
                                    <div className={`lvl-node ${unlocked ? 'lvl-node--unlocked' : 'lvl-node--locked'} ${isNow ? 'lvl-node--current' : ''}`}>
                                        <div className="lvl-node-badge">
                                            <img
                                                src={tier.img}
                                                alt={tier.label}
                                                className="lvl-node-img"
                                                style={{ filter: unlocked ? 'none' : 'grayscale(1) brightness(0.5)' }}
                                            />
                                        </div>
                                        <div className="lvl-node-info">
                                            <span className="lvl-node-label">{tier.label}</span>
                                            <span className="lvl-node-range">Niveles {tier.minLevel} – {tier.maxLevel === 99 ? '30' : tier.maxLevel}</span>
                                            {isNow && <span className="lvl-node-here-tag">← Aquí estás</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <button className="btn btn-primary lvl-modal-close" onClick={onClose}>Cerrar</button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const navigate = useNavigate()
    const [data, setData] = useState<DashboardResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [showLevelModal, setShowLevelModal] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [lessonsByTopic, setLessonsByTopic] = useState<Record<string, Lesson[]>>({})
    const [experimentalStatus, setExperimentalStatus] = useState<ExperimentalAssessmentStatus | null>(null)
    const { profile, userInfo } = useAuth()

    useEffect(() => {
        Promise.allSettled([
            getDashboard().then(res => setData(res.data)),
            getExperimentalAssessmentStatus().then(res => setExperimentalStatus(res.data)),
        ]).finally(() => setLoading(false))
    }, [])

    // Módulos en el orden del curso, cada uno con su mundo
    const modules = useMemo(() => (data?.learningPath ?? [])
        .map(course => ({ course, theme: themeForTopic(course.topicName) }))
        .sort((x, y) => x.theme.moduleNum - y.theme.moduleNum), [data])

    // Por defecto se muestra el módulo en curso (o el primero sin terminar)
    const defaultModule = modules.find(m => m.course.status === 'IN_PROGRESS' || m.course.status === 'UNLOCKED')
        ?? modules.find(m => m.course.status !== 'COMPLETED')
        ?? modules[modules.length - 1]
    const selectedIdx = Math.max(0, modules.findIndex(m => m.course.topicId === (selectedId ?? defaultModule?.course.topicId)))
    const selected    = modules[selectedIdx]

    // La lección que sigue se obtiene de la ruta del módulo (se pide una vez por módulo)
    const selectedTopicId = selected?.course.topicId
    const needsLessons = !!selected && selected.course.status !== 'LOCKED' && selected.course.status !== 'COMPLETED'
    useEffect(() => {
        if (!selectedTopicId || !needsLessons || lessonsByTopic[selectedTopicId]) return
        getTopicLessons(selectedTopicId)
            .then(r => setLessonsByTopic(prev => ({ ...prev, [selectedTopicId]: r.data.lessons })))
            .catch(() => setLessonsByTopic(prev => ({ ...prev, [selectedTopicId]: [] })))
    }, [selectedTopicId, needsLessons, lessonsByTopic])

    const firstName  = data?.user.firstName ?? userInfo?.fullName?.split(' ')[0] ?? '…'
    const streakDays = profile?.streakDays ?? data?.gamification.streakDays ?? 0
    const level      = data?.gamification.currentLevel  ?? 1
    const xp         = data?.gamification.currentXp     ?? 0
    const xpMax      = data?.gamification.nextLevelXp   ?? 400
    const xpPct      = Math.min(100, Math.round((xp / xpMax) * 100))
    const completedCount = modules.filter(m => m.course.status === 'COMPLETED').length
    const nextLocked     = modules.find(m => m.course.status === 'LOCKED')


    return (
        <MainLayout>
            <LoadingScreen visible={loading} message="Cargando dashboard…" />
            {showLevelModal && <LevelRoadModal level={level} onClose={() => setShowLevelModal(false)} />}
            <div className="dash">

                {/* Header */}
                <header className="dash-header">
                    <h1 className="dash-greeting">¡Hola, <span>{firstName}!</span></h1>
                    <Logo className="dash-logo" />
                </header>

                {/* Stats */}
                <div className="dash-stats">
                    <div className="stat-card stat-streak">
                        <img src={fuegoGif} alt="fuego" className="streak-icon" />
                        <div>
                            <span className="stat-num">{streakDays}</span>
                            <span className="stat-lbl">Racha de días</span>
                        </div>
                    </div>

                    <div className="stat-card stat-level" onClick={() => setShowLevelModal(true)} style={{ cursor: 'pointer' }}>
                        <LevelBadge level={level} />
                        <div className="level-info">
                            <span className="level-title">Nivel {level}</span>
                            <div className="xp-row">
                                <span className="xp-nums">{xp.toLocaleString()} / {xpMax.toLocaleString()}</span>
                                <span className="xp-tag">XP</span>
                            </div>
                            <div className="xp-bar">
                                <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {experimentalStatus?.postTestEligible && !experimentalStatus.postTestCompleted && (
                    <motion.section
                        className="posttest-available-card"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <span className="posttest-available-eyebrow">Evaluación final disponible</span>
                            <h2>Completa tu post-test</h2>
                            <p>Ya completaste los 7 módulos. Realiza la evaluación final de 12 preguntas para cerrar tu experiencia en EDUFIN.</p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => { playSelect(); navigate('/post-test') }}
                        >
                            Realizar post-test
                        </button>
                    </motion.section>
                )}

                {/* 1 · Tu siguiente parada */}
                {selected && (
                    <NextStopCard
                        course={selected.course}
                        theme={selected.theme}
                        lessons={lessonsByTopic[selected.course.topicId]}
                        prevName={modules[selectedIdx - 1]?.course.topicName ?? null}
                        onOpen={() => { playSelect(); navigate(`/learning/${selected.course.topicId}`, { state: { topicName: selected.course.topicName } }) }}
                    />
                )}

                {/* 2 · Mapa de los módulos */}
                {modules.length > 0 && (
                    <section className="course-metro" aria-labelledby="course-metro-title">
                        <div className="course-metro-head">
                            <h2 id="course-metro-title" className="dash-section-title">Tu recorrido</h2>
                            <span className="course-metro-sum">
                                {completedCount} de {modules.length} módulos{nextLocked ? ` · siguiente: ${nextLocked.course.topicName}` : ''}
                            </span>
                        </div>
                        <div className="course-metro-scroll">
                            <CourseMetro modules={modules} selectedId={selected?.course.topicId ?? null} onSelect={setSelectedId} />
                        </div>
                    </section>
                )}

            </div>
        </MainLayout>
    )
}
