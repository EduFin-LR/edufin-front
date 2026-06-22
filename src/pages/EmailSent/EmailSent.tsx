import { useNavigate } from 'react-router-dom'
import { FaRobot } from 'react-icons/fa'
import './EmailSent.css'

export default function EmailSent() {
    const navigate = useNavigate()

    return (
        <div className="email-sent-page">
            <div className="email-sent-card">
                <h1 className="email-sent-title">¡Correo enviado con éxito!</h1>

                <div className="email-sent-avatar">
                    <FaRobot className="email-sent-robot-icon" />
                </div>

                <div className="email-sent-badge">Ahorrador novato</div>

                <p className="email-sent-desc">
                    Revisa la bandeja de entrada del correo ingresado y sigue las indicaciones correspondientes.
                </p>

                <button
                    className="btn btn-primary email-sent-btn"
                    onClick={() => navigate('/')}
                >
                    Continuar
                </button>
            </div>
        </div>
    )
}
