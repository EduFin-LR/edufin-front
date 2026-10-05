import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FaLock, FaCheck } from 'react-icons/fa'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import Logo from '../../components/Logo/Logo'
import { getMyAchievements } from '../../services/profileService'
import type { Achievement } from '../../services/profileService'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import './Logros.css'

type TabType = 'todos' | 'desbloqueados' | 'bloqueados'

// Una fecha sin hora (AAAA-MM-DD) se lee como fecha local; si no, en Perú saldría un día antes
const fmtDate = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Anillo de avance: cuántos logros llevas del total
function ProgressRing({ value, total }: { value: number; total: number }) {
    const pct = total > 0 ? value / total : 0
    const r = 44, c = 2 * Math.PI * r
    return (
        <svg className="logros-ring" viewBox="0 0 110 110" role="img" aria-label={`${value} de ${total} logros`}>
            <circle cx="55" cy="55" r={r} className="logros-ring-track" />
            <motion.circle
                cx="55" cy="55" r={r}
                className="logros-ring-fill"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: c * (1 - pct) }}
                transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                transform="rotate(-90 55 55)"
            />
            <text x="55" y="52" textAnchor="middle" className="logros-ring-num">{Math.round(pct * 100)}%</text>
            <text x="55" y="70" textAnchor="middle" className="logros-ring-lbl">completado</text>
        </svg>
    )
}

function Medal({ a, size = 'md' }: { a: Achievement; size?: 'md' | 'lg' }) {
    return (
        <div className={`logro-medal logro-medal--${size} ${a.isUnlocked ? 'is-on' : 'is-off'}`}>
            <img src={a.iconUrl} alt="" className="logro-medal-img" />
            <span className="logro-medal-state" aria-hidden="true">
                {a.isUnlocked ? <FaCheck /> : <FaLock />}
            </span>
        </div>
    )
}

function AchievementCard({ a, i }: { a: Achievement; i: number }) {
    return (
        <motion.article
            className={`logro-card ${a.isUnlocked ? 'logro-card--on' : 'logro-card--off'}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.04 }}
        >
            <Medal a={a} />
            <div className="logro-body">
                <h3 className="logro-name">{a.name}</h3>
                <p className="logro-desc">{a.description}</p>
            </div>
            <p className={`logro-foot ${a.isUnlocked ? 'is-on' : ''}`}>
                {a.isUnlocked
                    ? (a.earnedAt ? `Obtenido el ${fmtDate(a.earnedAt)}` : 'Obtenido')
                    : 'Bloqueado'}
            </p>
        </motion.article>
    )
}

export default function Logros() {
    const [tab, setTab]         = useState<TabType>('todos')
    const [list, setList]       = useState<Achievement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyAchievements().then(r => setList(r.data)).catch(() => {}).finally(() => setLoading(false))
    }, [])

    // Primero los obtenidos (los más recientes arriba), luego los bloqueados
    const sorted = useMemo(() => [...list].sort((x, y) => {
        if (x.isUnlocked !== y.isUnlocked) return x.isUnlocked ? -1 : 1
        return (y.earnedAt ?? '').localeCompare(x.earnedAt ?? '')
    }), [list])

    const unlocked = sorted.filter(a => a.isUnlocked)
    const locked   = sorted.filter(a => !a.isUnlocked)
    const latest   = unlocked.find(a => a.earnedAt) ?? unlocked[0]
    const filtered = tab === 'desbloqueados' ? unlocked : tab === 'bloqueados' ? locked : sorted

    const TABS: { key: TabType; label: string; count: number }[] = [
        { key: 'todos',         label: 'Todos',         count: sorted.length },
        { key: 'desbloqueados', label: 'Obtenidos',     count: unlocked.length },
        { key: 'bloqueados',    label: 'Por conseguir', count: locked.length },
    ]

    return (
        <MainLayout>
            <LoadingScreen visible={loading} message="Cargando logros…" />
            <div className="logros-page">

                <header className="dash-header">
                    <div>
                        <h1 className="logros-title">Mis logros</h1>
                        <p className="logros-sub">Cada logro es una parada que ya superaste.</p>
                    </div>
                    <Logo className="dash-logo" />
                </header>

                {/* Resumen */}
                <section className="logros-summary" aria-label="Resumen de logros">
                    <div className="logros-summary-progress">
                        <ProgressRing value={unlocked.length} total={sorted.length} />
                        <div>
                            <p className="logros-big">{unlocked.length} <span>de {sorted.length}</span></p>
                            <p className="logros-muted">logros obtenidos</p>
                            {locked.length > 0 && <p className="logros-hint">Te faltan {locked.length} por conseguir</p>}
                        </div>
                    </div>

                    <div className="logros-latest">
                        {latest ? <>
                            <Medal a={latest} size="lg" />
                            <div>
                                <small>Tu último logro</small>
                                <b>{latest.name}</b>
                                <p>{latest.description}</p>
                                {latest.earnedAt && <span>{fmtDate(latest.earnedAt)}</span>}
                            </div>
                        </> : (
                            <div>
                                <small>Tu primer logro te espera</small>
                                <b>Completa una lección para empezar</b>
                                <p>Los logros se desbloquean mientras avanzas en tu ruta.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Pestañas */}
                <div className="logros-tabs" role="tablist" aria-label="Filtrar logros">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={tab === t.key}
                            className={`logros-tab ${tab === t.key ? 'logros-tab--on' : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}<span>{t.count}</span>
                        </button>
                    ))}
                </div>

                {filtered.length > 0 ? (
                    <div className="logros-grid">
                        {filtered.map((a, i) => <AchievementCard key={a.id} a={a} i={i} />)}
                    </div>
                ) : !loading && (
                    <p className="logros-empty">
                        {tab === 'desbloqueados' ? 'Aún no tienes logros. Completa tu primera lección para ganar uno.'
                            : tab === 'bloqueados' ? '¡Conseguiste todos los logros!'
                            : 'No hay logros para mostrar.'}
                    </p>
                )}
            </div>
        </MainLayout>
    )
}
