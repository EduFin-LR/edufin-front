import './AuthLayout.css'
import { FaRobot } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

interface Props {
    children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
    const navigate = useNavigate()

    return (
        <div className="auth-wrapper">
            {/* ── Left panel: form ── */}
            <div className="auth-left">
                <div className="auth-logo" onClick={() => navigate('/')}>
                    <FaRobot className="auth-logo-icon" />
                    <div>
                        <span className="auth-logo-name">EDUFIN</span>
                        <p className="auth-logo-tagline">Aprende finanzas jugando</p>
                    </div>
                </div>

                <div className="auth-form-wrapper">
                    {children}
                </div>
            </div>

            {/* ── Right panel: decorative ── */}
            <div className="auth-right">
                <div className="auth-bubble">
                    <p>¡Aprende, juega y conquista tus metas financieras!</p>
                </div>

                {/* Reemplaza esta imagen con el asset del personaje */}
                <img
                    src="/assets/character.png"
                    alt="Personaje Edufin"
                    className="auth-character"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />

                <div className="auth-deco-plus auth-deco-plus--1">+</div>
                <div className="auth-deco-plus auth-deco-plus--2">+</div>
            </div>
        </div>
    )
}
