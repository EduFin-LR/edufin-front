import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import { signIn } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { ToastContainer } from '../../components/Toast/Toast'
import type { ToastType } from '../../components/Toast/Toast'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import './Login.css'

export default function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [form, setForm]       = useState({ username: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [toast, setToast]     = useState<{ message: string; type: ToastType } | null>(null)
    const [errors, setErrors]   = useState<{ username?: string; password?: string }>({})
    const [showPass, setShowPass] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setErrors(prev => ({ ...prev, [e.target.name]: undefined }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const next = {
            username: form.username.trim() ? undefined : 'Escribe tu nombre de usuario.',
            password: form.password ? undefined : 'Escribe tu contraseña.',
        }
        setErrors(next)
        if (next.username || next.password) return
        setLoading(true)
        try {
            const { data: auth } = await signIn({ username: form.username, password: form.password })
            // stores credentials + fetches profile/userInfo via context
            await login(auth.token, auth.id, auth.username)
            setToast({ message: `¡Bienvenido, ${auth.username}!`, type: 'success' })
            setTimeout(() => navigate('/dashboard'), 1000)
        } catch (err) {
            const msg = (isAxiosError<{ message?: string }>(err) && err.response?.data?.message) || 'Usuario o contraseña incorrectos.'
            setToast({ message: msg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <LoadingScreen visible={loading} message="Iniciando sesión…" />
            <ToastContainer toast={toast} onClose={() => setToast(null)} />

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-heading">
                    <h1 className="auth-form-title">Bienvenido de vuelta</h1>
                    <p className="auth-form-sub">Sigue tu ruta donde la dejaste.</p>
                </div>

                <div className="auth-field-group">
                    <div className="auth-field">
                        <label htmlFor="login-username">Nombre de usuario</label>
                        <input
                            id="login-username"
                            className={`input-field ${errors.username ? 'input-field--error' : ''}`}
                            type="text"
                            name="username"
                            placeholder="ana.torres"
                            value={form.username}
                            onChange={handleChange}
                            autoComplete="username"
                            aria-invalid={!!errors.username}
                            aria-describedby={errors.username ? 'login-username-err' : undefined}
                        />
                        {errors.username && <span className="auth-error" id="login-username-err">{errors.username}</span>}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="login-password">Contraseña</label>
                        <div className="auth-password">
                            <input
                                id="login-password"
                                className={`input-field ${errors.password ? 'input-field--error' : ''}`}
                                type={showPass ? 'text' : 'password'}
                                name="password"
                                placeholder="Tu contraseña"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? 'login-password-err' : undefined}
                            />
                            <button type="button" className="auth-show" onClick={() => setShowPass(v => !v)}
                                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                {showPass ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                        {errors.password && <span className="auth-error" id="login-password-err">{errors.password}</span>}
                    </div>
                </div>

                <div className="auth-links auth-links--end">
                    <button type="button" className="link-text" onClick={() => navigate('/forgot-password')}>
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Ingresando…' : 'Iniciar sesión'}
                </button>

                <p className="auth-switch">
                    ¿Aún no tienes cuenta?{' '}
                    <button type="button" className="link-text" onClick={() => navigate('/register')}>Crear cuenta</button>
                </p>
            </form>
        </AuthLayout>
    )
}
