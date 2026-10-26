import { useEffect, useState, useCallback } from 'react'
import { getVolume, setVolume, getMuted, setMuted, playSelect } from '../../utils/sounds'
import { FaVolumeUp, FaVolumeMute, FaStar, FaTrophy, FaRoute, FaLock, FaMedal, FaEnvelope, FaCheck } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import Logo from '../../components/Logo/Logo'
import { useUserAvatar } from '../../hooks/useUserAvatar'
import fuegoGif   from '../../assets/gifs/fuego.gif'
import progresoA  from '../../assets/images/ProgresoA.png'
import progresoB  from '../../assets/images/ProgresoB.png'
import progresoC  from '../../assets/images/ProgresoC.png'
import progresoD  from '../../assets/images/ProgresoD.png'
import { getMyAchievements, getLeaderboard } from '../../services/profileService'
import type { Achievement } from '../../services/profileService'
import AchievementBadge from '../../components/AchievementBadge/AchievementBadge'
import { getDashboard } from '../../services/dashboardService'
import type { DashboardResponse } from '../../types/auth'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import './Profile.css'

// Mismos rangos que la ruta de niveles del dashboard
const TIERS = [
    { img: progresoA, label: 'Iniciado', min: 1,  max: 5  },
    { img: progresoB, label: 'Aprendiz', min: 6,  max: 15 },
    { img: progresoC, label: 'Experto',  min: 16, max: 25 },
    { img: progresoD, label: 'Maestro',  min: 26, max: 99 },
]
const tierIdx = (level: number) => Math.max(0, TIERS.findIndex(t => level >= t.min && level <= t.max))

// Separador de miles siempre (toLocaleString en español no lo pone en números de 4 cifras)
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const fmtDate = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function LevelBadge({ level, className = '' }: { level: number; className?: string }) {
    return (
        <div className={`pf-badge ${className}`}>
            <img src={TIERS[tierIdx(level)].img} alt="" />
            <span>{level}</span>
        </div>
    )
}

export default function Profile() {
    const { profile, userInfo, userId } = useAuth()
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [dash,    setDash]    = useState<DashboardResponse | null>(null)
    const [rank,    setRank]    = useState<{ pos: number; total: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [volume, setVol]      = useState(() => getVolume())
    const [muted,  setMut]      = useState(() => getMuted())

    const handleVolume = useCallback((v: number) => {
        setVol(v); setVolume(v)
        if (v > 0 && muted) { setMut(false); setMuted(false) }
    }, [muted])

    const handleMute = useCallback(() => {
        const next = !muted; setMut(next); setMuted(next)
    }, [muted])

    const handleTest = useCallback(() => { playSelect() }, [])

    useEffect(() => {
        Promise.allSettled([
            getMyAchievements().then(r => setAchievements(r.data)),
            getDashboard().then(r => setDash(r.data)),
            getLeaderboard().then(r => {
                const i = r.data.findIndex(e => e.userId === userId)
                if (i >= 0) setRank({ pos: i + 1, total: r.data.length })
            }),
        ]).finally(() => setLoading(false))
    }, [userId])

    const name       = userInfo?.fullName ?? userInfo?.username ?? '…'
    const xp         = profile?.totalPoints  ?? dash?.gamification.currentXp ?? 0
    const level      = profile?.currentLevel ?? dash?.gamification.currentLevel ?? 1
    const streakDays = profile?.streakDays   ?? dash?.gamification.streakDays ?? 0
    const nextXp     = dash?.gamification.nextLevelXp
    const levelPct   = nextXp ? Math.min(100, Math.round((xp / nextXp) * 100)) : 0
    const avatar     = useUserAvatar()
    const tier       = tierIdx(level)

    const modules     = dash?.learningPath ?? []
    const modulesDone = modules.filter(m => m.status === 'COMPLETED').length
    const unlocked    = achievements.filter(a => a.isUnlocked)
    // Primero los obtenidos (los más recientes arriba), luego los pendientes
    const sortedAch   = [...achievements].sort((a, b) =>
        Number(b.isUnlocked) - Number(a.isUnlocked) || (b.earnedAt ?? '').localeCompare(a.earnedAt ?? ''))

    return (
        <MainLayout>
            <LoadingScreen visible={loading} message="Cargando perfil…" />
            <div className="profile-page">

                <header className="dash-header">
                    <h1 className="rank-title">Mi perfil</h1>
                    <Logo className="dash-logo" />
                </header>

                {/* ── Portada ── */}
                <section className="pf-hero">
                    <div className="pf-cover" aria-hidden />
                    <div className="pf-hero-body">
                        <div className="pf-avatar-wrap">
                            <img src={avatar.src} alt="Tu avatar" className="pf-avatar"
                                onError={e => { e.currentTarget.src = avatar.character }} />
                            <LevelBadge level={level} className="pf-avatar-badge" />
                        </div>
                        <div className="pf-identity">
                            <h2 className="pf-name">{name}</h2>
                            <div className="pf-meta">
                                {userInfo?.username && <span>@{userInfo.username}</span>}
                                {userInfo?.email && <span><FaEnvelope className="ic" /> {userInfo.email}</span>}
                            </div>
                            <span className="pf-tier-pill">
                                <FaMedal className="ic" /> {TIERS[tier].label} · Nivel {level}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ── Indicadores ── */}
                <div className="pf-stats">
                    <div className="pf-stat">
                        <span className="pf-stat-icon pf-stat-icon--xp"><FaStar /></span>
                        <div>
                            <strong>{fmt(xp)}</strong>
                            <span>XP total</span>
                        </div>
                    </div>
                    <div className="pf-stat">
                        <span className="pf-stat-icon pf-stat-icon--fire"><img src={fuegoGif} alt="" /></span>
                        <div>
                            <strong>{streakDays}</strong>
                            <span>{streakDays === 1 ? 'Día de racha' : 'Días de racha'}</span>
                        </div>
                    </div>
                    <div className="pf-stat">
                        <span className="pf-stat-icon pf-stat-icon--rank"><FaTrophy /></span>
                        <div>
                            <strong>{rank ? <>#{rank.pos}<small> de {rank.total}</small></> : '–'}</strong>
                            <span>Puesto en ranking</span>
                        </div>
                    </div>
                    <div className="pf-stat">
                        <span className="pf-stat-icon pf-stat-icon--mod"><FaRoute /></span>
                        <div>
                            <strong>{modulesDone}<small> de {modules.length || '–'}</small></strong>
                            <span>Módulos completados</span>
                        </div>
                    </div>
                </div>

                <div className="pf-grid">
                    <div className="pf-col">
                        {/* ── Progreso de nivel ── */}
                        <section className="pf-card">
                            <h3 className="pf-card-title">Progreso de nivel</h3>
                            <div className="pf-level-row">
                                <LevelBadge level={level} className="pf-level-badge" />
                                <div className="pf-level-info">
                                    <div className="pf-level-top">
                                        <span>Nivel {level} <small>→ {level + 1}</small></span>
                                        {nextXp ? <span className="pf-level-nums">{fmt(xp)} / {fmt(nextXp)} XP</span> : null}
                                    </div>
                                    <div className="pf-bar"><div className="pf-bar-fill" style={{ width: `${levelPct}%` }} /></div>
                                    {nextXp ? (
                                        <span className="pf-level-hint">
                                            {xp >= nextXp ? 'Listo para subir de nivel' : <>Te faltan <b>{fmt(nextXp - xp)} XP</b> para el nivel {level + 1}</>}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            {/* Camino de rangos */}
                            <ol className="pf-tiers">
                                {TIERS.map((t, i) => (
                                    <li key={t.label} className={i < tier ? 'is-done' : i === tier ? 'is-current' : ''}>
                                        <img src={t.img} alt="" />
                                        <strong>{t.label}</strong>
                                        <span>Nv. {t.min}{t.max < 99 ? `–${t.max}` : '+'}</span>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        {/* ── Módulos ── */}
                        {modules.length > 0 && (
                            <section className="pf-card">
                                <h3 className="pf-card-title">Mis módulos</h3>
                                <ul className="pf-modules">
                                    {modules.map(m => {
                                        const locked = m.status === 'LOCKED'
                                        const done   = m.status === 'COMPLETED'
                                        const pct    = Math.round(m.progressPercentage ?? 0)
                                        return (
                                            <li key={m.topicId} className={locked ? 'is-locked' : done ? 'is-done' : ''}>
                                                <span className="pf-mod-icon">
                                                    {locked ? <FaLock /> : done ? <FaCheck /> : `${pct}%`}
                                                </span>
                                                <div className="pf-mod-info">
                                                    <div className="pf-mod-top">
                                                        <span className="pf-mod-name">{m.topicName}</span>
                                                        <span className="pf-mod-count">
                                                            {locked ? 'Bloqueado' : `${m.completedLessons}/${m.totalLessons}`}
                                                        </span>
                                                    </div>
                                                    <div className="pf-bar pf-bar--thin"><div className="pf-bar-fill" style={{ width: `${pct}%` }} /></div>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </section>
                        )}
                    </div>

                    <div className="pf-col">
                        {/* ── Logros ── */}
                        <section className="pf-card">
                            <div className="pf-card-head">
                                <h3 className="pf-card-title">Logros</h3>
                                {achievements.length > 0 && (
                                    <span className="pf-card-count">{unlocked.length} de {achievements.length}</span>
                                )}
                            </div>
                            {achievements.length === 0 ? (
                                <p className="pf-empty">Completa lecciones y retos para ganar tus primeros logros.</p>
                            ) : (
                                <ul className="pf-achievements">
                                    {sortedAch.map(a => (
                                        <li key={a.id} className={a.isUnlocked ? '' : 'is-locked'}>
                                            <div className="pf-ach-icon">
                                                <AchievementBadge name={a.name} iconUrl={a.iconUrl} className="pf-ach-img" />
                                                {!a.isUnlocked && <span className="pf-ach-lock"><FaLock /></span>}
                                            </div>
                                            <div className="pf-ach-info">
                                                <strong>{a.name}</strong>
                                                <span>{a.description}</span>
                                                {a.isUnlocked && fmtDate(a.earnedAt) && <em>Obtenido el {fmtDate(a.earnedAt)}</em>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* ── Ajustes ── */}
                        <section className="pf-card">
                            <h3 className="pf-card-title">Sonido</h3>
                            <div className="profile-sound-row">
                                <button
                                    className={`profile-mute-btn ${muted ? 'profile-mute-btn--muted' : ''}`}
                                    onClick={handleMute}
                                    title={muted ? 'Activar sonido' : 'Silenciar'}
                                    aria-label={muted ? 'Activar sonido' : 'Silenciar'}
                                >
                                    {muted ? <FaVolumeMute /> : <FaVolumeUp />}
                                </button>
                                <input
                                    type="range"
                                    min={0} max={1} step={0.01}
                                    value={muted ? 0 : volume}
                                    onChange={e => handleVolume(parseFloat(e.target.value))}
                                    className="profile-volume-slider"
                                    aria-label="Volumen"
                                />
                                <span className="profile-volume-pct">{muted ? 0 : Math.round(volume * 100)}%</span>
                                <button className="profile-sound-test" onClick={handleTest}>Probar</button>
                            </div>
                        </section>
                    </div>
                </div>

            </div>
        </MainLayout>
    )
}
