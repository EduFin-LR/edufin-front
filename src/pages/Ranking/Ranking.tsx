import { useEffect, useState } from 'react'
import { FaTrophy } from 'react-icons/fa'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import edufinLogo from '../../assets/images/edufinLogo.png'
import { getLeaderboard } from '../../services/profileService'
import type { LeaderboardEntry } from '../../services/profileService'
import { useAuth } from '../../context/AuthContext'
import './Ranking.css'

const avatarBoy  = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href
const avatarGirl = new URL('../../assets/images/perfilNiño (3).png', import.meta.url).href

export default function Ranking() {
    const { userId } = useAuth()
    const [list, setList] = useState<LeaderboardEntry[]>([])

    useEffect(() => {
        getLeaderboard().then(r => setList(r.data)).catch(() => {})
    }, [])

    return (
        <MainLayout>
            <div className="rank-page">

                {/* Header */}
                <header className="dash-header">
                    <h1 className="rank-title">Ranking</h1>
                    <img src={edufinLogo} alt="Edufin" className="dash-logo" />
                </header>

                {/* List */}
                <ul className="rank-list">
                    {list.map((entry, index) => {
                        const pos  = index + 1
                        const isMe = entry.userId === userId
                        const avatar = index % 2 === 0 ? avatarBoy : avatarGirl
                        return (
                            <li key={entry.userId} className={`rank-row ${isMe ? 'rank-row--me' : ''}`}>
                                <div className="rank-pos">
                                    {pos === 1
                                        ? <FaTrophy className="rank-trophy" />
                                        : <span className="rank-num">{pos}</span>
                                    }
                                </div>
                                <img src={avatar} alt={entry.displayName} className="rank-avatar" />
                                <span className="rank-name">{entry.displayName}</span>
                                <span className="rank-xp">{entry.totalPoints.toLocaleString()} XP</span>
                            </li>
                        )
                    })}
                </ul>

            </div>
        </MainLayout>
    )
}
