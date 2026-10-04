import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import { signUp } from '../../services/authService'
import type { Gender, DashboardLearningPath } from '../../types/auth'
import { ToastContainer } from '../../components/Toast/Toast'
import type { ToastType } from '../../components/Toast/Toast'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import CourseMetro from '../Dashboard/CourseMetro'
import { THEMES } from '../Learning/routeThemes'
import '../Login/Login.css'
import './Register.css'

type Field = 'username' | 'email' | 'password' | 'confirmPassword'

// Vista previa de la ruta para el paso final (aún sin progreso: solo el módulo 1 abierto)
const PREVIEW_NAMES = ['Ingresos y presupuesto', 'Ahorro', 'Crédito y deuda', 'Pensiones', 'Inversión', 'Módulo 6', 'Sistema financiero y seguridad']
const PREVIEW = Object.values(THEMES)
    .sort((a, b) => a.moduleNum - b.moduleNum)
    .map((theme, i) => ({
        theme,
        course: {
            topicId: `preview-${theme.key}`, topicName: PREVIEW_NAMES[i], completedLessons: 0, totalLessons: 0,
            progressPercentage: 0, status: i === 0 ? 'UNLOCKED' : 'LOCKED', isAiRecommended: false,
        } satisfies DashboardLearningPath,
    }))

// 0 a 4 según largo, mayúsculas/minúsculas, números y símbolos
function passwordStrength(p: string) {
    let n = 0
    if (p.length >= 8) n++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++
    if (/\d/.test(p)) n++
    if (/[^A-Za-z0-9]/.test(p)) n++
    return n
}
const STRENGTH_LABEL = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Muy segura']
const STRENGTH_COLOR = ['#FF8A80', '#F5C04A', '#A5D66B', '#4CC46B']

export default function Register() {
    const navigate = useNavigate()
    const [step, setStep] = useState<0 | 1>(0)
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
    const [gender, setGender]   = useState<Gender>('MALE')
    const [errors, setErrors]   = useState<Partial<Record<Field, string>>>({})
    const [loading, setLoading] = useState(false)
    const [toast, setToast]     = useState<{ message: string; type: ToastType } | null>(null)

    const strength = passwordStrength(form.password)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setErrors(prev => ({ ...prev, [e.target.name]: undefined }))
    }

    const validate = () => {
        const next: Partial<Record<Field, string>> = {}
        if (!form.username.trim()) next.username = 'Elige un nombre de usuario.'
        if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Escribe un correo válido.'
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
            await signUp({ username: form.username.trim(), email: form.email.trim(), password: form.password, gender })
            setStep(1)
        } catch (err) {
            const msg = (isAxiosError<{ message?: string }>(err) && err.response?.data?.message) || 'Error al registrarse. Intenta de nuevo.'
            setToast({ message: msg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const field = (name: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
        <div className="auth-field">
            <label htmlFor={`reg-${name}`}>{label}</label>
            <input
                id={`reg-${name}`}
                className={`input-field ${errors[name] ? 'input-field--error' : ''}`}
                name={name}
                value={form[name]}
                onChange={handleChange}
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `reg-${name}-err` : undefined}
                {...props}
            />
            {errors[name] && <span className="auth-error" id={`reg-${name}-err`}>{errors[name]}</span>}
        </div>
    )

    return (
        <AuthLayout>
            <LoadingScreen visible={loading} message="Creando cuenta…" />
            <ToastContainer toast={toast} onClose={() => setToast(null)} />

            {/* Pasos: tu cuenta → tu ruta */}
            <ol className="reg-steps" aria-label="Pasos del registro">
                <li className={step === 0 ? 'on' : 'done'} aria-current={step === 0 ? 'step' : undefined}>
                    <i>{step === 0 ? 1 : '✓'}</i><span>Tu cuenta</span>
                </li>
                <li className={`reg-steps-bar ${step === 1 ? 'done' : ''}`} aria-hidden="true" />
                <li className={step === 1 ? 'on' : ''} aria-current={step === 1 ? 'step' : undefined}>
                    <i>2</i><span>Tu ruta</span>
                </li>
            </ol>

            {step === 0 ? (
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="auth-heading">
                        <h1 className="auth-form-title">Crea tu cuenta</h1>
                        <p className="auth-form-sub">Toma menos de un minuto.</p>
                    </div>

                    <div className="auth-field-group">
                        {field('username', 'Nombre de usuario', { type: 'text', placeholder: 'ana.torres', autoComplete: 'username' })}
                        {field('email', 'Correo', { type: 'email', placeholder: 'ana.torres@upc.edu.pe', autoComplete: 'email' })}

                        <div className="auth-field">
                            <label htmlFor="reg-password">Contraseña</label>
                            <input
                                id="reg-password"
                                className={`input-field ${errors.password ? 'input-field--error' : ''}`}
                                type="password"
                                name="password"
                                placeholder="Mínimo 8 caracteres"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                aria-invalid={!!errors.password}
                                aria-describedby="reg-password-strength"
                            />
                            <div className="reg-strength" aria-hidden="true">
                                {[0, 1, 2, 3].map(k => (
                                    <i key={k} style={{ background: k < strength ? STRENGTH_COLOR[strength - 1] : undefined }} />
                                ))}
                            </div>
                            <span className="reg-strength-label" id="reg-password-strength">
                                {form.password ? `Seguridad: ${STRENGTH_LABEL[strength]}` : 'Usa 8 caracteres o más.'}
                            </span>
                            {errors.password && <span className="auth-error">{errors.password}</span>}
                        </div>

                        {field('confirmPassword', 'Repite la contraseña', { type: 'password', autoComplete: 'new-password' })}

                        <div className="auth-field">
                            <span className="reg-label" id="reg-gender-label">Género</span>
                            <div className="reg-options" role="radiogroup" aria-labelledby="reg-gender-label">
                                {([['MALE', 'Masculino'], ['FEMALE', 'Femenino']] as const).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={gender === value}
                                        className={`reg-option ${gender === value ? 'reg-option--on' : ''}`}
                                        onClick={() => setGender(value)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                    </button>

                    <p className="auth-switch">
                        ¿Ya tienes cuenta?{' '}
                        <button type="button" className="link-text" onClick={() => navigate('/')}>Inicia sesión</button>
                    </p>
                </form>
            ) : (
                <div className="auth-form">
                    <div className="auth-heading">
                        <h1 className="auth-form-title">Tu ruta está lista{form.username ? `, ${form.username.trim()}` : ''}</h1>
                        <p className="auth-form-sub">
                            Empiezas en el módulo 1, <strong>Ingresos y presupuesto</strong>. Son 7 módulos y avanzas a tu ritmo.
                        </p>
                    </div>
                    <div className="reg-preview">
                        <CourseMetro modules={PREVIEW} selectedId={null} onSelect={() => {}} />
                    </div>
                    <button type="button" className="btn btn-primary auth-submit" onClick={() => navigate('/')}>
                        Iniciar sesión →
                    </button>
                </div>
            )}
        </AuthLayout>
    )
}
