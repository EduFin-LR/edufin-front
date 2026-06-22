import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaHome, FaTrophy, FaUser, FaSignOutAlt, FaMedal, FaBars, FaTimes } from 'react-icons/fa'
import './Sidebar.css'

const avatarBoy = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href

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
        navigate(path)
        onClose?.()
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/')
        onClose?.()
    }

    return (
        <>
            <div className="sidebar-avatar">
                <img src={avatarBoy} alt="avatar" />
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

            <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Cerrar sesión</span>
            </button>
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
