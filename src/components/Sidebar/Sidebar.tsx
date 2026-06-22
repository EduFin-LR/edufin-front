import './Sidebar.css'
import { useNavigate, useLocation } from 'react-router-dom'

import { FaHome } from 'react-icons/fa'
import { FaTrophy } from 'react-icons/fa'
import { FaUser } from 'react-icons/fa'

export default function Sidebar() {
    const navigate = useNavigate()
    const location = useLocation()

    const menuItems = [
        {
            label: 'Inicio',
            path: '/dashboard',
            icon: <FaHome />,
        },
        {
            label: 'Logros',
            path: '/achievements',
            icon: <FaTrophy />,
        },
        {
            label: 'Perfil',
            path: '/profile',
            icon: <FaUser />,
        },
        {
            label: 'Ranking',
            path: '/ranking',
            icon: <FaHome />,
        },
    ]

    return (
        <aside className="sidebar">
            <div className="sidebar-avatar">
                <img
                    src="https://i.pravatar.cc/150"
                    alt="avatar"
                />
            </div>

            <div className="sidebar-menu">
                {menuItems.map(item => (
                    <button
                        key={item.path}
                        className={`sidebar-item ${
                            location.pathname === item.path
                                ? 'active'
                                : ''
                        }`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            <button className="logout-btn">
                <FaHome />
                <span>Cerrar sesión</span>
            </button>
        </aside>
    )
}