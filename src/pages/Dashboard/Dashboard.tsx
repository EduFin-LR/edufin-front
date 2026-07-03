import { useEffect, useState, useRef } from 'react'
import { playSelect } from '../../utils/sounds'
import { useNavigate } from 'react-router-dom'
import { FaPiggyBank, FaStar } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import edufinLogo from '../../assets/images/edufinLogo.png'
import fuegoGif   from '../../assets/gifs/fuego.gif'
import progresoA  from '../../assets/images/ProgresoA.png'
import progresoB  from '../../assets/images/ProgresoB.png'
import progresoC  from '../../assets/images/ProgresoC.png'
import progresoD  from '../../assets/images/ProgresoD.png'
import { getDashboard } from '../../services/dashboardService'
import { useAuth } from '../../context/AuthContext'
import type { DashboardResponse, DashboardLearningPath } from '../../types/auth'
import './Dashboard.css'

const avatarBoy = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href

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

// ── XP Bar with spark particles ───────────────────────────────────────────────
function XpBar({ pct, xp, xpMax }: { pct: number; xp: number; xpMax: number }) {
    const [sparked, setSparked] = useState(false)
    const sparked$ = useRef(false)
    useEffect(() => {
        const t = setTimeout(() => { if (!sparked$.current) { sparked$.current = true; setSparked(true) } }, 600)
        return () => clearTimeout(t)
    }, [])

    const sparks = sparked ? Array.from({ length: 6 }) : []

    return (
        <div className="xp-bar-wrap">
            <div className="xp-bar-labels">
                <span className="xp-nums">{xp.toLocaleString()} / {xpMax.toLocaleString()} XP</span>
                <span className="xp-pct-tag">{pct}%</span>
            </div>
            <div className="xp-bar" style={{ position: 'relative' }}>
                <motion.div
                    className="xp-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
                    onAnimationComplete={() => setSparked(true)}
                />
                <AnimatePresence>
                    {sparks.map((_, i) => (
                        <motion.span
                            key={i}
                            className="xp-spark"
                            style={{ left: `calc(${pct}% - 4px)` }}
                            initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                            animate={{
                                opacity: 0,
                                y: (i % 2 === 0 ? -1 : 1) * (8 + i * 4),
                                x: (i - 2.5) * 6,
                                scale: 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7, delay: i * 0.06 }}
                        >✦</motion.span>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}

// ── Player Card (idea 1) ──────────────────────────────────────────────────────
function PlayerCard({
    name, avatar, level, xp, xpMax, xpPct, streakDays, tierImg, tierLabel,
    onLevelClick,
}: {
    name: string; avatar: string; level: number; xp: number; xpMax: number;
    xpPct: number; streakDays: number; tierImg: string; tierLabel: string;
    onLevelClick: () => void;
}) {
    return (
        <motion.div
            className="player-card"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="player-avatar-wrap">
                <img
                    src={avatar}
                    alt="avatar"
                    className="player-avatar"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = avatarBoy }}
                />
                <div className="player-streak-bubble">
                    <img src={fuegoGif} alt="racha" className="player-streak-fire" />
                    <span>{streakDays}</span>
                </div>
            </div>

            <div className="player-info">
                <h2 className="player-name">{name}</h2>
                <span className="player-tier-label">{tierLabel}</span>

                <div className="player-level-row" onClick={onLevelClick}>
                    <img src={tierImg} alt="nivel" className="player-tier-img" />
                    <span className="player-level-num">Nivel {level}</span>
                    <span className="player-level-hint">Ver ruta →</span>
                </div>

                <XpBar pct={xpPct} xp={xp} xpMax={xpMax} />
            </div>
        </motion.div>
    )
}

// ── Daily missions (idea 3) ───────────────────────────────────────────────────
function DailyMissions({ streakDays, completedToday }: { streakDays: number; completedToday: number }) {
    const missions = [
        { id: 1, icon: '📖', label: 'Completa 1 lección hoy',      done: completedToday >= 1 },
        { id: 2, icon: '🔥', label: `Mantén tu racha (${streakDays} días)`, done: streakDays > 0 },
        { id: 3, icon: '⭐', label: 'Responde 5 preguntas bien',    done: false },
    ]
    return (
        <section className="missions-section">
            <h2 className="dash-section-title">Misiones del día</h2>
            <div className="missions-row">
                {missions.map((m, i) => (
                    <motion.div
                        key={m.id}
                        className={`mission-card ${m.done ? 'mission-card--done' : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <span className="mission-icon">{m.icon}</span>
                        <span className="mission-label">{m.label}</span>
                        <span className={`mission-check ${m.done ? 'mission-check--done' : ''}`}>
                            {m.done ? '✓' : '○'}
                        </span>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}

// ── Course card with glow & stars (ideas 4 & 5) ───────────────────────────────
function CourseCard({ course, onContinue }: { course: DashboardLearningPath; onContinue: () => void }) {
    const pct         = course.progressPercentage
    const isPending   = course.status === 'LOCKED'
    const isCompleted = course.status === 'COMPLETED'
    const isActive    = course.status === 'IN_PROGRESS' || course.status === 'UNLOCKED'

    return (
        <div className={`course-card ${isPending ? 'course-card--pending' : ''} ${isCompleted ? 'course-card--completed' : ''} ${isActive ? 'course-card--active' : ''}`}>
            {isActive && <div className="course-glow-ring" />}

            <div className="course-icon-wrap">
                <FaPiggyBank className="course-icon" />
                {isCompleted && <span className="course-done-check">✓</span>}
            </div>

            <div className="course-body">
                <h3 className="course-title">
                    {course.topicName}
                    {course.isAiRecommended && <span className="course-ai-badge">IA</span>}
                </h3>
                <p className="course-meta">{course.completedLessons} de {course.totalLessons} lecciones completadas</p>
                <div className="course-bar">
                    <motion.div
                        className="course-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                    />
                </div>
                {pct > 0 && <span className="course-pct">{pct}%</span>}
            </div>

            {/* Floating stars for completed */}
            {isCompleted && (
                <div className="course-stars">
                    {[0,1,2].map(i => (
                        <motion.span
                            key={i}
                            className="course-star"
                            animate={{ y: [0, -5, 0], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                        >
                            <FaStar />
                        </motion.span>
                    ))}
                </div>
            )}

            <button
                className={`btn course-btn ${isPending ? 'course-btn--pending' : isCompleted ? 'course-btn--completed' : 'btn-primary'}`}
                onClick={() => { playSelect(); onContinue() }}
            >
                {isCompleted ? 'Repasar' : 'Continuar'}
            </button>
        </div>
    )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const navigate = useNavigate()
    const [data, setData] = useState<DashboardResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [showLevelModal, setShowLevelModal] = useState(false)
    const { profile, userInfo } = useAuth()

    useEffect(() => {
        getDashboard().then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false))
    }, [])

    const firstName  = data?.user.firstName ?? userInfo?.fullName?.split(' ')[0] ?? '…'
    const streakDays = profile?.streakDays ?? data?.gamification.streakDays ?? 0
    const level      = data?.gamification.currentLevel  ?? 1
    const xp         = data?.gamification.currentXp     ?? 0
    const xpMax      = data?.gamification.nextLevelXp   ?? 400
    const xpPct      = Math.min(100, Math.round((xp / xpMax) * 100))
    const active     = data?.learningPath.filter(c => c.status === 'IN_PROGRESS' || c.status === 'UNLOCKED') ?? []
    const pending    = data?.learningPath.filter(c => c.status === 'LOCKED')      ?? []
    const completed  = data?.learningPath.filter(c => c.status === 'COMPLETED')   ?? []

    const ti       = Math.max(0, tierIndex(level))
    const tierImg  = LEVEL_TIERS[ti].img
    const tierLbl  = LEVEL_TIERS[ti].label
    const avatar   = userInfo?.avatarUrl ?? avatarBoy
    const completedToday = completed.length  // approximate

    return (
        <MainLayout>
            <LoadingScreen visible={loading} message="Cargando dashboard…" />
            {showLevelModal && <LevelRoadModal level={level} onClose={() => setShowLevelModal(false)} />}
            <div className="dash">

                {/* Header */}
                <header className="dash-header">
                    <h1 className="dash-greeting">¡Hola, <span>{firstName}!</span></h1>
                    <img src={edufinLogo} alt="Edufin" className="dash-logo" />
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

                {/* Active courses */}
                {active.length > 0 && (
                    <section className="dash-section">
                        <h2 className="dash-section-title">Continuar aprendiendo</h2>
                        {active.map(c => (
                            <CourseCard key={c.topicId} course={c} onContinue={() => navigate(`/learning/${c.topicId}`)} />
                        ))}
                    </section>
                )}

                {/* Pending courses */}
                {pending.length > 0 && (
                    <section className="dash-section">
                        <h2 className="dash-section-title">Pendiente</h2>
                        {pending.map(c => (
                            <CourseCard key={c.topicId} course={c} onContinue={() => navigate(`/learning/${c.topicId}`)} />
                        ))}
                    </section>
                )}

                {/* Completed courses */}
                {completed.length > 0 && (
                    <section className="dash-section">
                        <h2 className="dash-section-title">Completados 🎉</h2>
                        {completed.map(c => (
                            <CourseCard key={c.topicId} course={c} onContinue={() => navigate(`/learning/${c.topicId}`)} />
                        ))}
                    </section>
                )}

            </div>
        </MainLayout>
    )
}
