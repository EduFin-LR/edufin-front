import { useEffect, useState } from 'react'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import edufinLogo from '../../assets/images/edufinLogo.png'
import { getMyAchievements } from '../../services/profileService'
import type { Achievement } from '../../services/profileService'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import './Logros.css'

type TabType = 'todos' | 'desbloqueados' | 'bloqueados'

const TABS: { key: TabType; label: string }[] = [
    { key: 'todos',         label: 'Todos'         },
    { key: 'desbloqueados', label: 'Desbloqueados' },
    { key: 'bloqueados',    label: 'Bloqueados'     },
]

function AchievementCard({ a }: { a: Achievement }) {
    return (
        <div className={`logro-card ${a.isUnlocked ? 'logro-card--unlocked' : 'logro-card--locked'}`}>
            {/* Tooltip on hover */}
            <div className="logro-tooltip">
                <span className="logro-tooltip-name">{a.name}</span>
                <span className="logro-tooltip-desc">{a.description}</span>
                {a.isUnlocked && a.earnedAt && (
                    <span className="logro-tooltip-date">
                        {new Date(a.earnedAt).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })}
                    </span>
                )}
            </div>

            {/* Badge */}
            <div className="logro-badge">
                <img
                    src={a.iconUrl}
                    alt={a.name}
                    className={`logro-icon ${a.isUnlocked ? '' : 'logro-icon--locked'}`}
                />
                {!a.isUnlocked && <div className="logro-lock-overlay">🔒</div>}
            </div>

            <span className="logro-name">{a.name}</span>
        </div>
    )
}

export default function Logros() {
    const [tab, setTab]     = useState<TabType>('todos')
    const [list, setList]   = useState<Achievement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyAchievements().then(r => setList(r.data)).catch(() => {}).finally(() => setLoading(false))
    }, [])

    const filtered =
        tab === 'desbloqueados' ? list.filter(a =>  a.isUnlocked) :
        tab === 'bloqueados'    ? list.filter(a => !a.isUnlocked) :
        list

    return (
        <MainLayout>
            <LoadingScreen visible={loading} message="Cargando logros…" />
            <div className="logros-page">

                <header className="dash-header">
                    <h1 className="rank-title">Mis logros</h1>
                    <img src={edufinLogo} alt="Edufin" className="dash-logo" />
                </header>

                <div className="rank-tabs">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            className={`rank-tab ${tab === t.key ? 'rank-tab--active' : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="logros-grid">
                    {filtered.map(a => <AchievementCard key={a.id} a={a} />)}
                </div>

            </div>
        </MainLayout>
    )
}
