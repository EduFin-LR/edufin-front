import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import { forgotPassword } from '../../services/authService'
import { ToastContainer } from '../../components/Toast/Toast'
import type { ToastType } from '../../components/Toast/Toast'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import '../Login/Login.css'

export default function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail]     = useState('')
    const [error, setError]     = useState('')
    const [loading, setLoading] = useState(false)
    const [toast, setToast]     = useState<{ message: string; type: ToastType } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) {
            setError('Ingresa tu correo electrónico.')
            return
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Escribe un correo válido.')
            return
        }
        setLoading(true)
        try {
            await forgotPassword(email.trim())
            navigate('/reset-password', { state: { email: email.trim() } })
        } catch (err) {
            const msg = (isAxiosError<{ message?: string }>(err) && err.response?.data?.message)
                || 'No encontramos esa cuenta. Verifica tu correo.'
            setToast({ message: msg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <LoadingScreen visible={loading} message="Enviando código…" />
            <ToastContainer toast={toast} onClose={() => setToast(null)} />

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-heading">
                    <h1 className="auth-form-title">Recuperar cuenta</h1>
                    <p className="auth-form-sub">
                        Te enviaremos un código a tu correo para restablecer tu contraseña.
                    </p>
                </div>

                <div className="auth-field-group">
                    <div className="auth-field">
                        <label htmlFor="fp-email">Correo electrónico</label>
                        <input
                            id="fp-email"
                            className={`input-field ${error ? 'input-field--error' : ''}`}
                            type="email"
                            name="email"
                            placeholder="Tu correo electrónico"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setError('') }}
                            autoComplete="email"
                            aria-invalid={!!error}
                        />
                        {error && <span className="auth-error">{error}</span>}
                    </div>
                </div>

                <div className="auth-links">
                    <button type="button" className="link-text" onClick={() => navigate('/')}>
                        Volver al inicio de sesión
                    </button>
                </div>

                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Enviando…' : 'Enviar código'}
                </button>
            </form>
        </AuthLayout>
    )
}
