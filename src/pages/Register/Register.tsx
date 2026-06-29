import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import { signUp } from '../../services/authService'
import type { Gender } from '../../types/auth'
import { ToastContainer } from '../../components/Toast/Toast'
import type { ToastType } from '../../components/Toast/Toast'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import './Register.css'

export default function Register() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        username:        '',
        email:           '',
        password:        '',
        confirmPassword: '',
    })
    const [gender, setGender]   = useState<Gender>('MALE')
    const [loading, setLoading] = useState(false)
    const [toast, setToast]     = useState<{ message: string; type: ToastType } | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.username || !form.email || !form.password || !form.confirmPassword) {
            setToast({ message: 'Completa todos los campos.', type: 'warning' })
            return
        }
        if (form.password !== form.confirmPassword) {
            setToast({ message: 'Las contraseñas no coinciden.', type: 'warning' })
            return
        }
        setLoading(true)
        try {
            await signUp({ username: form.username, email: form.email, password: form.password, gender })
            setToast({ message: 'Cuenta creada. Ahora inicia sesión.', type: 'success' })
            setTimeout(() => navigate('/'), 1500)
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Error al registrarse. Intenta de nuevo.'
            setToast({ message: msg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <LoadingScreen visible={loading} message="Creando cuenta…" />
            <ToastContainer toast={toast} onClose={() => setToast(null)} />

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <h2 className="auth-form-title">Crear cuenta</h2>

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
                        type="email"
                        name="email"
                        placeholder="Correo electrónico"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                    />
                    <input
                        className="input-field"
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                    />
                    <input
                        className="input-field"
                        type="password"
                        name="confirmPassword"
                        placeholder="Repetir contraseña"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                    />
                </div>

                {/* Gender switch */}
                <div className="gender-switch">

                    <button
                        type="button"
                        className={`gender-toggle ${gender === 'FEMALE' ? 'gender-toggle--on' : ''}`}
                        onClick={() => setGender(g => g === 'MALE' ? 'FEMALE' : 'MALE')}
                        aria-label="Cambiar género"
                    >
                        <span className="gender-thumb" />
                    </button>
                    <span className="gender-label">
                        {gender === 'MALE' ? 'Masculino' : 'Femenino'}
                    </span>
                </div>

                <div className="auth-links">
                    <button type="button" className="link-text" onClick={() => navigate('/')}>
                        ¿Ya tienes cuenta?
                    </button>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Registrando…' : 'Registrarse'}
                </button>
            </form>
        </AuthLayout>
    )
}
