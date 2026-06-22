import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import './Login.css'

// import { login } from '../../services/authService'

export default function Login() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ username: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.username || !form.password) {
            setError('Completa todos los campos.')
            return
        }
        setLoading(true)
        try {
            // const response = await login(form)
            // localStorage.setItem('token', response.data.token)
            navigate('/dashboard')
        } catch {
            setError('Usuario o contraseña incorrectos.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
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

                {error && <p className="auth-error">{error}</p>}

                <div className="auth-links">
                    <button
                        type="button"
                        className="link-text"
                        onClick={() => navigate('/register')}
                    >
                        ¿No tienes cuenta?
                    </button>
                    <button
                        type="button"
                        className="link-text"
                        onClick={() => navigate('/forgot-password')}
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Ingresando…' : 'Iniciar sesión'}
                </button>
            </form>
        </AuthLayout>
    )
}
