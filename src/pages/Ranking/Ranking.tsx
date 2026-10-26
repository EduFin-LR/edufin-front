import { useEffect, useState } from 'react'
import { FaTrophy, FaCrown, FaArrowUp } from 'react-icons/fa'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import Logo from '../../components/Logo/Logo'
import progresoA  from '../../assets/images/ProgresoA.png'
import progresoB  from '../../assets/images/ProgresoB.png'
import progresoC  from '../../assets/images/ProgresoC.png'
import progresoD  from '../../assets/images/ProgresoD.png'
import { getLeaderboard } from '../../services/profileService'
import type { LeaderboardEntry } from '../../services/profileService'
import { useAuth } from '../../context/AuthContext'
import './Ranking.css'

const avatarBoy  = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href
const avatarGirl = new URL('../../assets/images/perfilNiño (3).png', import.meta.url).href

// Mismos rangos que la ruta de niveles del dashboard
function tierFor(level: number) {
    if (level <= 5)  return { img: progresoA, label: 'Iniciado' }
    if (level <= 15) return { img: progresoB, label: 'Aprendiz' }
    if (level <= 25) return { img: progresoC, label: 'Experto' }
    return                  { img: progresoD, label: 'Maestro' }
}

// Separador de miles siempre (toLocaleString en español no lo pone en números de 4 cifras)
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const avatarOf = (e: LeaderboardEntry) => e.gender === 'FEMALE' ? avatarGirl : avatarBoy

function LevelBadge({ level, size = 'md' }: { level: number; size?: 'md' | 'lg' }) {
    return (
        <div className={`rank-level-badge rank-level-badge--${size}`}>
            <img src={tierFor(level).img} alt="" className="rank-level-img" />
            <span className="rank-level-num">{level}</span>
        </div>
    )
}

// Orden visual del podio: 2.º a la izquierda, 1.º al centro, 3.º a la derecha
const PODIUM_ORDER = [1, 0, 2]

export default function Ranking() {
    const { userId } = useAuth()
    const [list, setList]       = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getLeaderboard().then(r => setList(r.data)).catch(() => {}).finally(() => setLoading(false))
    }, [])

    const podium = list.slice(0, 3)
    const rest   = list.slice(3)
    const myIdx  = list.findIndex(e => e.userId === userId)
    const me     = myIdx >= 0 ? list[myIdx] : undefined
    const ahead  = myIdx > 0 ? list[myIdx - 1] : undefined
    const gap    = me && ahead ? Math.max(0, ahead.totalPoints - me.totalPoints) + 1 : 0

    return (
        <MainLayout>
            <LoadingScreen visible={loading} message="Cargando ranking…" />
            <div className="rank-page">
                <header className="dash-header">
                    <div>
                        <h1 className="rank-title">Ranking</h1>
                        <p className="rank-sub">Clasificación por experiencia acumulada</p>
                    </div>
                    <Logo className="dash-logo" />
                </header>

                {/* Tu posición */}
                {me && (
                    <section className="rank-me-card" aria-label="Tu posición">
                        <div className="rank-me-pos">
                            <span className="rank-me-pos-lbl">Tu puesto</span>
                            <strong>{myIdx + 1}<small>/{list.length}</small></strong>
                        </div>
                        <div className="rank-me-info">
                            <span className="rank-me-xp">{fmt(me.totalPoints)} XP</span>
                            <span className="rank-me-hint">
                                {ahead
                                    ? <><FaArrowUp className="ic" /> Te faltan <b>{fmt(gap)} XP</b> para superar a {ahead.displayName}</>
                                    : <><FaCrown className="ic" /> Lideras el ranking. Sigue sumando para mantenerte arriba</>}
                            </span>
                        </div>
                    </section>
                )}

                {/* Podio */}
                {podium.length > 0 && (
                    <ol className="rank-podium" aria-label="Primeros puestos">
                        {PODIUM_ORDER.filter(i => podium[i]).map(i => {
                            const entry = podium[i]
                            const pos   = i + 1
                            const isMe  = entry.userId === userId
                            const level = entry.currentLevel ?? 1
                            return (
                                <li key={entry.userId} className={`podium-card podium-card--${pos} ${isMe ? 'is-me' : ''}`}>
                                    {pos === 1 && <FaCrown className="podium-crown" aria-hidden />}
                                    <div className="podium-avatar-wrap">
                                        <img src={avatarOf(entry)} alt="" className="podium-avatar" />
                                        <span className="podium-medal">{pos}</span>
                                    </div>
                                    <span className="podium-name" title={entry.displayName}>
                                        {entry.displayName}{isMe && <em> (tú)</em>}
                                    </span>
                                    <span className="podium-tier">
                                        <LevelBadge level={level} /> {tierFor(level).label}
                                    </span>
                                    <span className="podium-xp">{fmt(entry.totalPoints)} <small>XP</small></span>
                                    <div className="podium-step" aria-hidden>
                                        {pos === 1 ? <FaTrophy /> : pos}
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                )}

                {/* Resto de la tabla, en columnas fijas para que todo quede alineado */}
                {rest.length > 0 && (
                    <section className="rank-table" aria-label="Clasificación">
                        <div className="rank-table-head" aria-hidden>
                            <span>#</span>
                            <span>Estudiante</span>
                            <span>Nivel</span>
                            <span className="rank-col-xp">XP</span>
                        </div>
                        <ul className="rank-list">
                            {rest.map((entry, k) => {
                                const pos   = k + 4
                                const isMe  = entry.userId === userId
                                const level = entry.currentLevel ?? 1
                                return (
                                    <li key={entry.userId} className={`rank-row ${isMe ? 'rank-row--me' : ''}`}>
                                        <span className="rank-num">{pos}</span>
                                        <div className="rank-user">
                                            <img src={avatarOf(entry)} alt="" className="rank-avatar" />
                                            <span className="rank-name">{entry.displayName}</span>
                                            {isMe && <em className="rank-you">Tú</em>}
                                        </div>
                                        <div className="rank-level">
                                            <LevelBadge level={level} />
                                            <span className="rank-tier">{tierFor(level).label}</span>
                                        </div>
                                        <span className="rank-xp rank-col-xp">{fmt(entry.totalPoints)} <small>XP</small></span>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                )}

                {!loading && list.length === 0 && (
                    <p className="rank-empty">Aún no hay estudiantes en el ranking.</p>
                )}
            </div>
        </MainLayout>
    )
}
