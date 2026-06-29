import { useEffect, useState } from 'react'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import edufinLogo from '../../assets/images/edufinLogo.png'
import { getMyAchievements } from '../../services/profileService'
import type { Achievement } from '../../services/profileService'
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
            <div className="logro-icon-wrap">
                <img
                    src={a.iconUrl}
                    alt={a.name}
                    className={`logro-icon ${a.isUnlocked ? '' : 'logro-icon--locked'}`}
                />
                {!a.isUnlocked && <div className="logro-lock-overlay">🔒</div>}
            </div>
            <span className="logro-name">{a.name}</span>
            <span className="logro-desc">{a.description}</span>
            {a.isUnlocked && a.earnedAt && (
                <span className="logro-date">
                    {new Date(a.earnedAt).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })}
                </span>
            )}
        </div>
    )
}

export default function Logros() {
    const [tab, setTab]   = useState<TabType>('todos')
    const [list, setList] = useState<Achievement[]>([])

    useEffect(() => {
        getMyAchievements().then(r => setList(r.data)).catch(() => {})
    }, [])

    const filtered =
        tab === 'desbloqueados' ? list.filter(a =>  a.isUnlocked) :
        tab === 'bloqueados'    ? list.filter(a => !a.isUnlocked) :
        list

    return (
        <MainLayout>
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
