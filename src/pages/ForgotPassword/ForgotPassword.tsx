import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import '../Login/Login.css'

// import { forgotPassword } from '../../services/authService'

export default function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail]   = useState('')
    const [error, setError]   = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            setError('Ingresa tu correo electrónico.')
            return
        }
        setLoading(true)
        try {
            // await forgotPassword(email)
            navigate('/email-sent')
        } catch {
            setError('No encontramos esa cuenta. Verifica tu correo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <h2 className="auth-form-title">Recuperar cuenta</h2>
                <p style={{ margin: '0 0 8px', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    Te enviaremos un enlace a tu correo para restablecer tu contraseña.
                </p>

                <div className="auth-field-group">
                    <input
                        className="input-field"
                        type="email"
                        name="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError('') }}
                        autoComplete="email"
                    />
                </div>

                {error && <p className="auth-error">{error}</p>}

                <div className="auth-links">
                    <button
                        type="button"
                        className="link-text"
                        onClick={() => navigate('/')}
                    >
                        Volver al inicio de sesión
                    </button>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Enviando…' : 'Enviarme al correo'}
                </button>
            </form>
        </AuthLayout>
    )
}
