import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPiggyBank } from 'react-icons/fa'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import edufinLogo from '../../assets/images/edufinLogo.png'
import fuegoGif   from '../../assets/gifs/fuego.gif'
import progresoA  from '../../assets/images/ProgresoA.png'
import { getDashboard } from '../../services/dashboardService'
import { useAuth } from '../../context/AuthContext'
import type { DashboardResponse, DashboardLearningPath } from '../../types/auth'
import './Dashboard.css'

// ── Level badge ───────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: number }) {
    return (
        <div className="level-badge-wrap">
            <img src={progresoA} alt="nivel" className="level-badge-img" />
            <span className="level-badge-num">{level}</span>
        </div>
    )
}

// ── Course card ───────────────────────────────────────────────────────────────
function CourseCard({ course, onContinue }: { course: DashboardLearningPath; onContinue: () => void }) {
    const pct         = course.progressPercentage
    const isPending   = course.status === 'LOCKED'
    const isCompleted = course.status === 'COMPLETED'

    return (
        <div className={`course-card ${isPending ? 'course-card--pending' : ''} ${isCompleted ? 'course-card--completed' : ''}`}>
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
                    <div className="course-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                {pct > 0 && <span className="course-pct">{pct}%</span>}
            </div>
            <button
                className={`btn course-btn ${isPending ? 'course-btn--pending' : isCompleted ? 'course-btn--completed' : 'btn-primary'}`}
                onClick={onContinue}
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
    const { profile } = useAuth()

    useEffect(() => {
        getDashboard().then(res => setData(res.data)).catch(() => {})
    }, [])

    const firstName  = data?.user.firstName                       ?? '…'
    // streakDays viene de /profiles/me (más confiable que /dashboard/home/me)
    const streakDays = profile?.streakDays ?? data?.gamification.streakDays ?? 0
    const level      = data?.gamification.currentLevel  ?? 1
    const xp         = data?.gamification.currentXp     ?? 0
    const xpMax      = data?.gamification.nextLevelXp   ?? 400
    const xpPct      = Math.min(100, Math.round((xp / xpMax) * 100))
    const active     = data?.learningPath.filter(c => c.status === 'IN_PROGRESS' || c.status === 'UNLOCKED') ?? []
    const pending    = data?.learningPath.filter(c => c.status === 'LOCKED')      ?? []
    const completed  = data?.learningPath.filter(c => c.status === 'COMPLETED')   ?? []

    return (
        <MainLayout>
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

                    <div className="stat-card stat-level">
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
