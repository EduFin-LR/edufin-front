import { useNavigate } from 'react-router-dom'
import { FaPiggyBank } from 'react-icons/fa'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import edufinLogo from '../../assets/images/edufinLogo.png'
import fuegoGif   from '../../assets/gifs/fuego.gif'
import './Dashboard.css'

// ── Mock data — reemplazar con llamadas al servicio cuando el backend esté listo ──
// import { getUser, getCourses } from '../../services/dashboardService'
const USER = {
    name: 'Jose Carlos',
    streakDays: 7,
    level: 3,
    xp: 750,
    xpMax: 1200,
}
const COURSES = [
    { id: 1, title: 'Ahorro Básico',        completed: 10, total: 12, status: 'active'   as const },
    { id: 2, title: 'Presupuesto personal', completed: 0,  total: 15, status: 'pending'  as const },
    { id: 3, title: 'Inversiones básicas',  completed: 0,  total: 10, status: 'pending'  as const },
]

// ── Level badge (inline SVG) ──────────────────────────────────────────────────
function LevelBadge({ level }: { level: number }) {
    const palette =
        level <= 5  ? { dark:'#1a8c3c', mid:'#2db84f', ring:'#80d99a', center:'#d4f5df' } :
        level <= 15 ? { dark:'#1756b8', mid:'#2e7ef5', ring:'#80b8fa', center:'#d0e8fe' } :
        level <= 25 ? { dark:'#6420c8', mid:'#8c4ee8', ring:'#c0a0f8', center:'#ece0ff' } :
                      { dark:'#b86000', mid:'#e08800', ring:'#f8c840', center:'#fff0c0' }

    const bumps = Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI / 4) - Math.PI / 2
        return { x: +(60 + 47 * Math.cos(a)).toFixed(2), y: +(60 + 47 * Math.sin(a)).toFixed(2) }
    })

    return (
        <svg viewBox="0 0 120 120" width="58" height="58" xmlns="http://www.w3.org/2000/svg">
            {bumps.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r="13" fill={palette.dark} />)}
            <circle cx="60" cy="60" r="45" fill={palette.mid} />
            <circle cx="60" cy="60" r="37" fill={palette.ring} />
            <circle cx="60" cy="60" r="28" fill={palette.center} />
            <text x="60" y="61" textAnchor="middle" dominantBaseline="middle"
                fontFamily="Arial Black,Arial,sans-serif"
                fontSize={level >= 10 ? 19 : 22} fontWeight="900" fill={palette.dark}>
                {level}
            </text>
        </svg>
    )
}

// ── Course card ───────────────────────────────────────────────────────────────
interface Course { id: number; title: string; completed: number; total: number; status: 'active' | 'pending' }

function CourseCard({ course, onContinue }: { course: Course; onContinue: () => void }) {
    const pct = course.total > 0 ? Math.round((course.completed / course.total) * 100) : 0
    const isPending = course.status === 'pending'

    return (
        <div className={`course-card ${isPending ? 'course-card--pending' : ''}`}>
            <div className="course-icon-wrap">
                <FaPiggyBank className="course-icon" />
            </div>
            <div className="course-body">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-meta">{course.completed} de {course.total} lecciones completadas</p>
                <div className="course-bar">
                    <div className="course-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                {pct > 0 && <span className="course-pct">{pct}%</span>}
            </div>
            <button className={`btn course-btn ${isPending ? 'course-btn--pending' : 'btn-primary'}`} onClick={onContinue}>
                Continuar
            </button>
        </div>
    )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const navigate = useNavigate()
    const xpPct = Math.round((USER.xp / USER.xpMax) * 100)

    return (
        <MainLayout>
            <div className="dash">

                {/* Header */}
                <header className="dash-header">
                    <h1 className="dash-greeting">¡Hola, <span>{USER.name}!</span></h1>
                    <img src={edufinLogo} alt="Edufin" className="dash-logo" />
                </header>

                {/* Stats */}
                <div className="dash-stats">
                    <div className="stat-card stat-streak">
                        <img src={fuegoGif} alt="fuego" className="streak-icon" />
                        <div>
                            <span className="stat-num">{USER.streakDays}</span>
                            <span className="stat-lbl">Racha de días</span>
                        </div>
                    </div>

                    <div className="stat-card stat-level">
                        <LevelBadge level={USER.level} />
                        <div className="level-info">
                            <span className="level-title">Nivel {USER.level}</span>
                            <div className="xp-row">
                                <span className="xp-nums">{USER.xp.toLocaleString()} / {USER.xpMax.toLocaleString()}</span>
                                <span className="xp-tag">XP</span>
                            </div>
                            <div className="xp-bar">
                                <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active courses */}
                <section className="dash-section">
                    <h2 className="dash-section-title">Continuar aprendiendo</h2>
                    {COURSES.filter(c => c.status === 'active').map(c => (
                        <CourseCard key={c.id} course={c} onContinue={() => navigate('/learning')} />
                    ))}
                </section>

                {/* Pending courses */}
                <section className="dash-section">
                    <h2 className="dash-section-title">Pendiente</h2>
                    {COURSES.filter(c => c.status === 'pending').map(c => (
                        <CourseCard key={c.id} course={c} onContinue={() => navigate('/learning')} />
                    ))}
                </section>

            </div>
        </MainLayout>
    )
}
