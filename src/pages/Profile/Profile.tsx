import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import edufinLogo from '../../assets/images/edufinLogo.png'
import fuegoGif   from '../../assets/gifs/fuego.gif'
import progresoA  from '../../assets/images/ProgresoA.png'
import progresoB  from '../../assets/images/ProgresoB.png'
import progresoC  from '../../assets/images/ProgresoC.png'
import progresoD  from '../../assets/images/ProgresoD.png'
import { getMyAchievements } from '../../services/profileService'
import type { Achievement } from '../../services/profileService'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import './Profile.css'

const avatarBoy = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href

function LevelBadge({ level }: { level: number }) {
    const img = level <= 5  ? progresoA
              : level <= 15 ? progresoB
              : level <= 25 ? progresoC
              :               progresoD
    return (
        <div className="level-badge-wrap">
            <img src={img} alt="nivel" className="level-badge-img" />
            <span className="level-badge-num">{level}</span>
        </div>
    )
}

export default function Profile() {
    const { profile, userInfo } = useAuth()
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyAchievements().then(r => setAchievements(r.data.filter(a => a.isUnlocked))).catch(() => {}).finally(() => setLoading(false))
    }, [])

    const name       = userInfo?.fullName ?? userInfo?.username ?? '…'
    const xp         = profile?.totalPoints  ?? 0
    const level      = profile?.currentLevel ?? 1
    const streakDays = profile?.streakDays   ?? 0
    const avatar     = userInfo?.avatarUrl   ?? avatarBoy

    return (
        <MainLayout>
            <LoadingScreen visible={loading} message="Cargando perfil…" />
            <div className="profile-page">

                {/* Header */}
                <header className="dash-header">
                    <h1 className="rank-title">Mi perfil</h1>
                    <img src={edufinLogo} alt="Edufin" className="dash-logo" />
                </header>

                {/* Body */}
                <div className="profile-body">

                    {/* Avatar */}
                    <div className="profile-avatar-wrap">
                        <img src={avatar} alt="avatar" className="profile-avatar"
                            onError={e => { (e.currentTarget as HTMLImageElement).src = avatarBoy }} />
                    </div>

                    {/* Info */}
                    <div className="profile-info">
                        <h2 className="profile-name">{name}</h2>
                        {userInfo?.email && <p className="profile-joined">{userInfo.email}</p>}

                        {/* Stats */}
                        <div className="profile-stats">
                            <div className="profile-stat">
                                <LevelBadge level={level} />
                                <span className="profile-stat-val">{xp.toLocaleString()} exp</span>
                            </div>
                            <div className="profile-stat">
                                <img src={fuegoGif} alt="racha" className="profile-fire" />
                                <span className="profile-stat-val">{streakDays} días</span>
                            </div>
                        </div>

                        {/* Logros desbloqueados */}
                        {achievements.length > 0 && (
                            <div className="profile-logros">
                                <h3 className="profile-logros-title">Logros obtenidos</h3>
                                <div className="profile-logros-grid">
                                    {achievements.map(a => (
                                        <div key={a.id} className="profile-logro-item" title={a.name}>
                                            <img src={a.iconUrl} alt={a.name} className="profile-logro-icon" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </MainLayout>
    )
}
