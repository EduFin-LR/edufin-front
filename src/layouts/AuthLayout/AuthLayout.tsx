import './AuthLayout.css'
import { useNavigate } from 'react-router-dom'
import edufinLogo    from '../../assets/images/edufinLogo.png'
import portadaInicio from '../../assets/images/portadaInicio.png'

interface Props {
    children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
    const navigate = useNavigate()

    return (
        <div className="auth-wrapper">
            <div className="contMain">
                <div className="auth-left">
                    <img
                        src={edufinLogo}
                        alt="Edufin"
                        className="auth-logo-img"
                        onClick={() => navigate('/')}
                    />

                    <div className="auth-form-wrapper">
                        {children}
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <img
                    src={portadaInicio}
                    alt="Personaje Edufin"
                    className="auth-character"
                />
            </div>
        </div>
    )
}
