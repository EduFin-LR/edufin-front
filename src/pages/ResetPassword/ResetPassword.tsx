import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isAxiosError } from 'axios'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import { resetPassword } from '../../services/authService'
import { ToastContainer } from '../../components/Toast/Toast'
import type { ToastType } from '../../components/Toast/Toast'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import '../Login/Login.css'

export default function ResetPassword() {
    const navigate = useNavigate()
    const location = useLocation()
    const prefillEmail = (location.state as { email?: string } | null)?.email ?? ''

    const [form, setForm] = useState({ email: prefillEmail, code: '', password: '', confirmPassword: '' })
    const [errors, setErrors] = useState<Partial<Record<'email' | 'code' | 'password' | 'confirmPassword', string>>>({})
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setErrors(prev => ({ ...prev, [e.target.name]: undefined }))
    }

    const validate = () => {
        const next: typeof errors = {}
        if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Escribe un correo válido.'
        if (!form.code.trim()) next.code = 'Ingresa el código que recibiste.'
        if (form.password.length < 8) next.password = 'La contraseña necesita al menos 8 caracteres.'
        if (form.confirmPassword !== form.password) next.confirmPassword = 'Las contraseñas no coinciden.'
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true)
        try {
            await resetPassword(form.email.trim(), form.code.trim(), form.password)
            setToast({ message: '¡Contraseña actualizada! Ya puedes iniciar sesión.', type: 'success' })
            setTimeout(() => navigate('/'), 1800)
        } catch (err) {
            const msg = (isAxiosError<{ message?: string }>(err) && err.response?.data?.message)
                || 'Código incorrecto o expirado. Intenta de nuevo.'
            setToast({ message: msg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <LoadingScreen visible={loading} message="Actualizando contraseña…" />
            <ToastContainer toast={toast} onClose={() => setToast(null)} />

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-heading">
                    <h1 className="auth-form-title">Nueva contraseña</h1>
                    <p className="auth-form-sub">Ingresa el código que enviamos a tu correo.</p>
                </div>

                <div className="auth-field-group">
                    {/* Email */}
                    <div className="auth-field">
                        <label htmlFor="rp-email">Correo electrónico</label>
                        <input
                            id="rp-email"
                            className={`input-field ${errors.email ? 'input-field--error' : ''}`}
                            type="email"
                            name="email"
                            placeholder="Tu correo electrónico"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && <span className="auth-error">{errors.email}</span>}
                    </div>

                    {/* Código */}
                    <div className="auth-field">
                        <label htmlFor="rp-code">Código de verificación</label>
                        <input
                            id="rp-code"
                            className={`input-field rp-code-input ${errors.code ? 'input-field--error' : ''}`}
                            type="text"
                            name="code"
                            placeholder="Ej. 439349"
                            value={form.code}
                            onChange={handleChange}
                            inputMode="numeric"
                            maxLength={8}
                            autoComplete="one-time-code"
                            aria-invalid={!!errors.code}
                        />
                        {errors.code && <span className="auth-error">{errors.code}</span>}
                    </div>

                    {/* Nueva contraseña */}
                    <div className="auth-field">
                        <label htmlFor="rp-password">Nueva contraseña</label>
                        <div className="auth-password">
                            <input
                                id="rp-password"
                                className={`input-field ${errors.password ? 'input-field--error' : ''}`}
                                type={showPass ? 'text' : 'password'}
                                name="password"
                                placeholder="Mínimo 8 caracteres"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                aria-invalid={!!errors.password}
                            />
                            <button type="button" className="auth-show" onClick={() => setShowPass(v => !v)}
                                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                {showPass ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                        {errors.password && <span className="auth-error">{errors.password}</span>}
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="auth-field">
                        <label htmlFor="rp-confirmPassword">Repite la contraseña</label>
                        <input
                            id="rp-confirmPassword"
                            className={`input-field ${errors.confirmPassword ? 'input-field--error' : ''}`}
                            type="password"
                            name="confirmPassword"
                            placeholder="Escribe tu contraseña de nuevo"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            onPaste={e => e.preventDefault()}
                            onCopy={e => e.preventDefault()}
                            onCut={e => e.preventDefault()}
                            autoComplete="new-password"
                            aria-invalid={!!errors.confirmPassword}
                        />
                        {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
                    </div>
                </div>

                <div className="auth-links">
                    <button type="button" className="link-text" onClick={() => navigate('/forgot-password')}>
                        Reenviar código
                    </button>
                    <button type="button" className="link-text" onClick={() => navigate('/')}>
                        Volver al inicio
                    </button>
                </div>

                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Guardando…' : 'Restablecer contraseña'}
                </button>
            </form>
        </AuthLayout>
    )
}
