import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../layouts/MainLayout/MainLayout'
import edufinLogo from '../../assets/images/edufinLogo.png'
import fuegoGif   from '../../assets/gifs/fuego.gif'
import './Profile.css'

const avatarBoy = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href

function LevelBadge({ level }: { level: number }) {
    const p = level <= 5  ? { dark:'#1a8c3c', mid:'#2db84f', ring:'#80d99a', center:'#d4f5df' }
            : level <= 15 ? { dark:'#1756b8', mid:'#2e7ef5', ring:'#80b8fa', center:'#d0e8fe' }
            : level <= 25 ? { dark:'#6420c8', mid:'#8c4ee8', ring:'#c0a0f8', center:'#ece0ff' }
            :               { dark:'#b86000', mid:'#e08800', ring:'#f8c840', center:'#fff0c0' }
    const bumps = Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI / 4) - Math.PI / 2
        return { x: +(60 + 47 * Math.cos(a)).toFixed(2), y: +(60 + 47 * Math.sin(a)).toFixed(2) }
    })
    return (
        <svg viewBox="0 0 120 120" width="52" height="52" xmlns="http://www.w3.org/2000/svg">
            {bumps.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r="13" fill={p.dark} />)}
            <circle cx="60" cy="60" r="45" fill={p.mid} />
            <circle cx="60" cy="60" r="37" fill={p.ring} />
            <circle cx="60" cy="60" r="28" fill={p.center} />
            <text x="60" y="61" textAnchor="middle" dominantBaseline="middle"
                fontFamily="Arial Black,Arial,sans-serif"
                fontSize={level >= 10 ? 19 : 22} fontWeight="900" fill={p.dark}>
                {level}
            </text>
        </svg>
    )
}

function SmallBadge({ emoji, color }: { emoji: string; color: typeof UNLOCKED_LOGROS[0]['color'] }) {
    const bumps = Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI / 4) - Math.PI / 2
        return { x: +(60 + 47 * Math.cos(a)).toFixed(2), y: +(60 + 47 * Math.sin(a)).toFixed(2) }
    })
    return (
        <svg viewBox="0 0 120 120" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
            {bumps.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r="13" fill={color.dark} />)}
            <circle cx="60" cy="60" r="45" fill={color.mid} />
            <circle cx="60" cy="60" r="37" fill={color.ring} />
            <circle cx="60" cy="60" r="28" fill={color.center} />
            <text x="60" y="68" textAnchor="middle" fontSize="26">{emoji}</text>
        </svg>
    )
}

export default function Profile() {
    const { profile, userInfo } = useAuth()

    const name       = userInfo?.fullName ?? userInfo?.username ?? '…'
    const xp         = profile?.totalPoints  ?? 0
    const level      = profile?.currentLevel ?? 1
    const streakDays = profile?.streakDays   ?? 0
    const avatar     = userInfo?.avatarUrl   ?? avatarBoy

    return (
        <MainLayout>
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
                    </div>

                </div>
            </div>
        </MainLayout>
    )
}
