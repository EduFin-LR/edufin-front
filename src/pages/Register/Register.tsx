import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import './Register.css'

// import { register } from '../../services/authService'

export default function Register() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        fullName:        '',
        username:        '',
        password:        '',
        confirmPassword: '',
    })
    const [error, setError]   = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.fullName || !form.username || !form.password || !form.confirmPassword) {
            setError('Completa todos los campos.')
            return
        }
        if (form.password !== form.confirmPassword) {
            setError('Las contraseñas no coinciden.')
            return
        }
        setLoading(true)
        try {
            // const response = await register({ fullName: form.fullName, username: form.username, password: form.password })
            // localStorage.setItem('token', response.data.token)
            navigate('/dashboard')
        } catch {
            setError('Error al registrarse. Intenta de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <h2 className="auth-form-title">Crear cuenta</h2>

                <div className="auth-field-group">
                    <input
                        className="input-field"
                        type="text"
                        name="fullName"
                        placeholder="Nombre completo"
                        value={form.fullName}
                        onChange={handleChange}
                        autoComplete="name"
                    />
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

                {error && <p className="auth-error">{error}</p>}

                <div className="auth-links">
                    <button
                        type="button"
                        className="link-text"
                        onClick={() => navigate('/')}
                    >
                        ¿Ya tienes cuenta?
                    </button>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Registrando…' : 'Registrarse'}
                </button>
            </form>
        </AuthLayout>
    )
}
