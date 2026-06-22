import { useState } from 'react'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import edufinLogo from '../../assets/images/edufinLogo.png'
import './Logros.css'

// import { getLogros } from '../../services/logrosService'

type Color = 'green' | 'blue' | 'purple' | 'gold' | 'red' | 'teal'
type TabType = 'todos' | 'desbloqueados' | 'bloqueados'

interface Achievement {
    id: number
    title: string
    desc: string
    emoji: string
    color: Color
    unlocked: boolean
}

const PALETTE: Record<Color, { dark: string; mid: string; ring: string; center: string }> = {
    green:  { dark:'#1a8c3c', mid:'#2db84f', ring:'#80d99a', center:'#d4f5df' },
    blue:   { dark:'#1756b8', mid:'#2e7ef5', ring:'#80b8fa', center:'#d0e8fe' },
    purple: { dark:'#6420c8', mid:'#8c4ee8', ring:'#c0a0f8', center:'#ece0ff' },
    gold:   { dark:'#b86000', mid:'#e08800', ring:'#f8c840', center:'#fff0c0' },
    red:    { dark:'#b91c1c', mid:'#ef4444', ring:'#fca5a5', center:'#fee2e2' },
    teal:   { dark:'#0f766e', mid:'#14b8a6', ring:'#5eead4', center:'#ccfbf1' },
}
const DARK = { dark:'#1c1c1c', mid:'#2a2a2a', ring:'#383838', center:'#222' }

const ALL_ACHIEVEMENTS: Achievement[] = [
    { id:1,  title:'Level Up',          desc:'Alcanzaste el nivel 3',               emoji:'⭐', color:'purple', unlocked:true  },
    { id:2,  title:'Primer capítulo',   desc:'Completaste tu primera lección',      emoji:'📖', color:'blue',  unlocked:true  },
    { id:3,  title:'Racha 7 días',      desc:'Mantén 7 días de racha',              emoji:'🔥', color:'gold',  unlocked:false },
    { id:4,  title:'Quiz perfecto',     desc:'Obtén 100% en un quiz',               emoji:'🎯', color:'green', unlocked:false },
    { id:5,  title:'Ahorrador novato',  desc:'Completa el módulo de ahorro',        emoji:'🐷', color:'teal',  unlocked:false },
    { id:6,  title:'Racha 14 días',     desc:'Mantén 14 días de racha',             emoji:'💥', color:'red',   unlocked:false },
    { id:7,  title:'Nivel 10',          desc:'Alcanza el nivel 10',                 emoji:'🏆', color:'gold',  unlocked:false },
    { id:8,  title:'Maestro del quiz',  desc:'Completa 10 quizzes perfectos',       emoji:'🧠', color:'blue',  unlocked:false },
    { id:9,  title:'Inversionista',     desc:'Completa módulo de inversiones',      emoji:'📈', color:'green', unlocked:false },
    { id:10, title:'Racha 30 días',     desc:'Mantén 30 días de racha',             emoji:'🌟', color:'purple',unlocked:false },
    { id:11, title:'Velocista',         desc:'Completa una lección en menos de 3m', emoji:'⚡', color:'teal',  unlocked:false },
    { id:12, title:'Social',            desc:'Invita a 3 amigos',                   emoji:'👥', color:'blue',  unlocked:false },
]

function BadgeSVG({ color, emoji, unlocked }: { color: Color; emoji: string; unlocked: boolean }) {
    const p = unlocked ? PALETTE[color] : DARK
    const bumps = Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI / 4) - Math.PI / 2
        return { x: +(60 + 47 * Math.cos(a)).toFixed(2), y: +(60 + 47 * Math.sin(a)).toFixed(2) }
    })
    return (
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="logro-badge-svg">
            {bumps.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r="13" fill={p.dark} />)}
            <circle cx="60" cy="60" r="45" fill={p.mid} />
            <circle cx="60" cy="60" r="37" fill={p.ring} />
            <circle cx="60" cy="60" r="28" fill={p.center} />
            {unlocked && (
                <text x="60" y="68" textAnchor="middle" fontSize="24">{emoji}</text>
            )}
        </svg>
    )
}

export default function Logros() {
    const [tab, setTab] = useState<TabType>('todos')

    const filtered =
        tab === 'desbloqueados' ? ALL_ACHIEVEMENTS.filter(a => a.unlocked) :
        tab === 'bloqueados'    ? ALL_ACHIEVEMENTS.filter(a => !a.unlocked) :
        ALL_ACHIEVEMENTS

    const TABS: { key: TabType; label: string }[] = [
        { key: 'todos',          label: 'Todos'          },
        { key: 'desbloqueados',  label: 'Desbloqueados'  },
        { key: 'bloqueados',     label: 'Bloqueados'     },
    ]

    return (
        <MainLayout>
            <div className="logros-page">

                {/* Header */}
                <header className="dash-header">
                    <h1 className="rank-title">Mis logros</h1>
                    <img src={edufinLogo} alt="Edufin" className="dash-logo" />
                </header>

                {/* Tabs */}
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

                {/* Grid */}
                <div className="logros-grid">
                    {filtered.map(a => (
                        <div
                            key={a.id}
                            className={`logro-card ${a.unlocked ? 'logro-card--unlocked' : 'logro-card--locked'}`}
                            title={a.unlocked ? `${a.title}: ${a.desc}` : `Bloqueado — ${a.desc}`}
                        >
                            <BadgeSVG color={a.color} emoji={a.emoji} unlocked={a.unlocked} />
                            {a.unlocked && <span className="logro-title">{a.title}</span>}
                        </div>
                    ))}
                </div>

            </div>
        </MainLayout>
    )
}
