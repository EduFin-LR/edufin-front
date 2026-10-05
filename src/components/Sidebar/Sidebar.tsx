import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaHome, FaTrophy, FaUser, FaSignOutAlt, FaMedal, FaBars, FaTimes } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { playNav } from '../../utils/sounds'
import Logo from '../Logo/Logo'
import { useUserAvatar } from '../../hooks/useUserAvatar'
import './Sidebar.css'


const MENU = [
    { label: 'Inicio',  path: '/dashboard', icon: <FaHome /> },
    { label: 'Logros',  path: '/logros',     icon: <FaMedal /> },
    { label: 'Perfil',  path: '/profile',    icon: <FaUser /> },
    { label: 'Ranking', path: '/ranking',    icon: <FaTrophy /> },
]

function NavContent({ onClose }: { onClose?: () => void }) {
    const navigate  = useNavigate()
    const location  = useLocation()

    const go = (path: string) => {
        playNav()
        navigate(path)
        onClose?.()
    }

    const { logout, profile, userInfo, username } = useAuth()
    const displayName = userInfo?.fullName || userInfo?.username || username || 'Tú'
    const avatar = useUserAvatar()

    const handleLogout = () => {
        logout()
        navigate('/')
        onClose?.()
    }

    return (
        <>
            <div className="sidebar-brand">
                <Logo height={50} onClick={() => go('/dashboard')} />
            </div>

            <nav className="sidebar-menu">
                {MENU.map(item => (
                    <button
                        key={item.path}
                        className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => go(item.path)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-foot">
                <button className="sidebar-me" onClick={() => go('/profile')}>
                    <img src={avatar.src} alt="" className="sidebar-me-avatar"
                        onError={e => { e.currentTarget.src = avatar.character }} />
                    <span className="sidebar-me-info">
                        <b>{displayName}</b>
                        <small>Nivel {profile?.currentLevel ?? 1} · 🔥 {profile?.streakDays ?? 0} {profile?.streakDays === 1 ? 'día' : 'días'}</small>
                    </span>
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt />
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </>
    )
}

export default function Sidebar() {
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <aside className="sidebar sidebar--desktop">
                <NavContent />
            </aside>

            {/* ── Mobile: hamburger button ── */}
            <button className="hamburger-btn" onClick={() => setOpen(true)} aria-label="Abrir menú">
                <FaBars />
            </button>

            {/* ── Mobile: drawer overlay ── */}
            {open && (
                <div className="sidebar-overlay" onClick={() => setOpen(false)}>
                    <aside className="sidebar sidebar--drawer" onClick={e => e.stopPropagation()}>
                        <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Cerrar menú">
                            <FaTimes />
                        </button>
                        <NavContent onClose={() => setOpen(false)} />
                    </aside>
                </div>
            )}
        </>
    )
}
