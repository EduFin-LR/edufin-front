import './Sidebar.css'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaHome, FaTrophy, FaUser, FaSignOutAlt, FaMedal } from 'react-icons/fa'

const avatarBoy = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href

const MENU = [
    { label: 'Inicio',   path: '/dashboard',  icon: <FaHome /> },
    { label: 'Logros',   path: '/logros',      icon: <FaMedal /> },
    { label: 'Perfil',   path: '/profile',     icon: <FaUser /> },
    { label: 'Ranking',  path: '/ranking',     icon: <FaTrophy /> },
]

export default function Sidebar() {
    const navigate  = useNavigate()
    const location  = useLocation()

    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/')
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-avatar">
                <img src={avatarBoy} alt="avatar" />
            </div>

            <nav className="sidebar-menu">
                {MENU.map(item => (
                    <button
                        key={item.path}
                        className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
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
        </aside>
    )
}
