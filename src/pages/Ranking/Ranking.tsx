import { useState } from 'react'
import { FaTrophy } from 'react-icons/fa'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import edufinLogo from '../../assets/images/edufinLogo.png'
import './Ranking.css'

// import { getRanking } from '../../services/rankingService'

const avatarBoy  = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href
const avatarGirl = new URL('../../assets/images/perfilNiño (3).png', import.meta.url).href

interface Player { id: number; name: string; xp: number; avatar: string; isMe?: boolean }

const RANKING_TODOS: Player[] = [
    { id: 1, name: 'Eduardo Jose',   xp: 1350, avatar: avatarBoy  },
    { id: 2, name: 'Maria Teresa',   xp: 1150, avatar: avatarGirl },
    { id: 3, name: 'Gheraldine Sam', xp:  950, avatar: avatarGirl },
    { id: 4, name: 'Jose Carlos',    xp:  940, avatar: avatarBoy, isMe: true },
    { id: 5, name: 'Julio Cesar',    xp:  690, avatar: avatarBoy  },
    { id: 6, name: 'Ana Lucia',      xp:  610, avatar: avatarGirl },
    { id: 7, name: 'Carlos Diaz',    xp:  540, avatar: avatarBoy  },
]

const RANKING_ESCUELA: Player[] = [
    { id: 1, name: 'Maria Teresa',   xp:  980, avatar: avatarGirl },
    { id: 2, name: 'Jose Carlos',    xp:  940, avatar: avatarBoy, isMe: true },
    { id: 3, name: 'Carlos Diaz',    xp:  540, avatar: avatarBoy  },
    { id: 4, name: 'Ana Lucia',      xp:  480, avatar: avatarGirl },
]

type Tab = 'todos' | 'escuela'

export default function Ranking() {
    const [tab, setTab] = useState<Tab>('todos')
    const list = tab === 'todos' ? RANKING_TODOS : RANKING_ESCUELA

    return (
        <MainLayout>
            <div className="rank-page">

                {/* Header */}
                <header className="dash-header">
                    <h1 className="rank-title">Ranking</h1>
                    <img src={edufinLogo} alt="Edufin" className="dash-logo" />
                </header>

                {/* Tabs */}
                <div className="rank-tabs">
                    <button
                        className={`rank-tab ${tab === 'todos' ? 'rank-tab--active' : ''}`}
                        onClick={() => setTab('todos')}
                    >
                        Todos
                    </button>
                    <button
                        className={`rank-tab ${tab === 'escuela' ? 'rank-tab--active' : ''}`}
                        onClick={() => setTab('escuela')}
                    >
                        Escuela
                    </button>
                </div>

                {/* List */}
                <ul className="rank-list">
                    {list.map((player, index) => {
                        const pos = index + 1
                        return (
                            <li
                                key={player.id}
                                className={`rank-row ${player.isMe ? 'rank-row--me' : ''}`}
                            >
                                {/* Position */}
                                <div className="rank-pos">
                                    {pos === 1
                                        ? <FaTrophy className="rank-trophy" />
                                        : <span className="rank-num">{pos}</span>
                                    }
                                </div>

                                {/* Avatar */}
                                <img
                                    src={player.avatar}
                                    alt={player.name}
                                    className="rank-avatar"
                                />

                                {/* Name */}
                                <span className="rank-name">{player.name}</span>

                                {/* XP */}
                                <span className="rank-xp">{player.xp.toLocaleString()} XP</span>
                            </li>
                        )
                    })}
                </ul>

            </div>
        </MainLayout>
    )
}
