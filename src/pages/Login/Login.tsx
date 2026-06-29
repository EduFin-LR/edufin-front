import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.username || !form.password) {
            setToast({ message: 'Completa todos los campos.', type: 'warning' })
            return
        }
        setLoading(true)
        try {
            const { data: auth } = await signIn({ username: form.username, password: form.password })
            // stores credentials + fetches profile/userInfo via context
            await login(auth.token, auth.id, auth.username)
            setToast({ message: `¡Bienvenido, ${auth.username}!`, type: 'success' })
            setTimeout(() => navigate('/dashboard'), 1000)
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Usuario o contraseña incorrectos.'
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
                <h2 className="auth-form-title">Iniciar sesión</h2>

                <div className="auth-field-group">
                    <input
                        className="input-field"
                        type="text"
                        name="username"
                        placeholder="Nombre de usuario"
                        value={form.username}
                        onChange={handleChange}
                        autoComplete="username"
                    />
                    <input
                        className="input-field"
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                    />
                </div>

                <div className="auth-links">
                    <button type="button" className="link-text" onClick={() => navigate('/register')}>
                        ¿No tienes cuenta?
                    </button>
                    <button type="button" className="link-text" onClick={() => navigate('/forgot-password')}>
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Ingresando…' : 'Iniciar sesión'}
                </button>
            </form>
        </AuthLayout>
    )
}
