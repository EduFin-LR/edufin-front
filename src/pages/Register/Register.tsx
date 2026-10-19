import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import { signUp, verifyEmail, resendVerification } from '../../services/authService'
import type { Gender, DashboardLearningPath } from '../../types/auth'
import { ToastContainer } from '../../components/Toast/Toast'
import type { ToastType } from '../../components/Toast/Toast'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import CourseMetro from '../Dashboard/CourseMetro'
import { THEMES } from '../Learning/routeThemes'
import '../Login/Login.css'
import './Register.css'

type Field = 'username' | 'email' | 'password' | 'confirmPassword'
type Step = 0 | 1 | 2   // 0 = formulario, 1 = verificar email, 2 = tu ruta

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
    const [step, setStep]         = useState<Step>(0)
    const [form, setForm]         = useState({ username: '', email: '', password: '', confirmPassword: '' })
    const [gender, setGender]     = useState<Gender>('MALE')
    const [errors, setErrors]     = useState<Partial<Record<Field, string>>>({})
    const [loading, setLoading]   = useState(false)
    const [toast, setToast]       = useState<{ message: string; type: ToastType } | null>(null)
    const [code, setCode]         = useState('')
    const [codeError, setCodeError] = useState('')
    const [resending, setResending] = useState(false)

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

    // Paso 0 → 1: crear cuenta (el backend envía el código automáticamente)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true)
        try {
            await signUp({ username: form.username.trim(), email: form.email.trim(), password: form.password, gender })
            setStep(1)
        } catch (err) {
            // Si el correo ya está registrado (400), ir directo a verificar
            const errMsg = isAxiosError<{ message?: string }>(err) && err.response?.data?.message || ''
            if (isAxiosError(err) && (err.response?.status === 409 ||
                (err.response?.status === 400 && errMsg.toLowerCase().includes('registrado')))) {
                await resendVerification(form.email.trim()).catch(() => {})
                setStep(1)
                return
            }
            const msg = (isAxiosError<{ message?: string }>(err) && err.response?.data?.message) || 'Error al registrarse. Intenta de nuevo.'
            setToast({ message: msg, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // Ir directo al paso de verificación (cuenta ya creada, falta verificar)
    const handleGoToVerify = async () => {
        if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
            setErrors(prev => ({ ...prev, email: 'Escribe tu correo para reenviar el código.' }))
            return
        }
        setLoading(true)
        await resendVerification(form.email.trim()).catch(() => {})
        setLoading(false)
        setStep(1)
    }

    // Paso 1 → 2: verificar código
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) { setCodeError('Ingresa el código que te enviamos.'); return }
        setLoading(true)
        try {
            await verifyEmail(form.email.trim(), code.trim())
            setStep(2)
        } catch (err) {
            const msg = (isAxiosError<{ message?: string }>(err) && err.response?.data?.message) || 'Código incorrecto o expirado.'
            setCodeError(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResending(true)
        try {
            await resendVerification(form.email.trim())
            setToast({ message: 'Código reenviado. Revisa tu correo.', type: 'success' })
        } catch {
            setToast({ message: 'No se pudo reenviar. Intenta en un momento.', type: 'error' })
        } finally {
            setResending(false)
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
            <LoadingScreen visible={loading} message={step === 0 ? 'Creando cuenta…' : 'Verificando…'} />
            <ToastContainer toast={toast} onClose={() => setToast(null)} />

            {/* Indicador de pasos */}
            <ol className="reg-steps" aria-label="Pasos del registro">
                <li className={step === 0 ? 'on' : 'done'} aria-current={step === 0 ? 'step' : undefined}>
                    <i>{step === 0 ? '1' : '✓'}</i><span className="reg-step-label">Cuenta</span>
                </li>
                <li className={`reg-steps-bar ${step >= 1 ? 'done' : ''}`} aria-hidden="true" />
                <li className={step === 1 ? 'on' : step === 2 ? 'done' : ''} aria-current={step === 1 ? 'step' : undefined}>
                    <i>{step < 2 ? '2' : '✓'}</i><span className="reg-step-label">Verificar</span>
                </li>
                <li className={`reg-steps-bar ${step === 2 ? 'done' : ''}`} aria-hidden="true" />
                <li className={step === 2 ? 'on' : ''} aria-current={step === 2 ? 'step' : undefined}>
                    <i>3</i><span className="reg-step-label">Tu ruta</span>
                </li>
            </ol>

            {/* ── Paso 0: formulario ── */}
            {step === 0 && (
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="auth-heading">
                        <h1 className="auth-form-title">Crea tu cuenta</h1>
                        <p className="auth-form-sub">Toma menos de un minuto.</p>
                    </div>

                    <div className="auth-field-group">
                        {field('username', 'Nombre de usuario', { type: 'text', placeholder: 'Mínimo 3 caracteres', autoComplete: 'username' })}
                        {field('email', 'Correo', { type: 'email', placeholder: 'Tu correo electrónico', autoComplete: 'email' })}

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

                        <div className="auth-field">
                            <label htmlFor="reg-confirmPassword">Repite la contraseña</label>
                            <input
                                id="reg-confirmPassword"
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
                                aria-describedby={errors.confirmPassword ? 'reg-confirmPassword-err' : undefined}
                            />
                            {errors.confirmPassword && <span className="auth-error" id="reg-confirmPassword-err">{errors.confirmPassword}</span>}
                        </div>

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
                    <p className="auth-switch">
                        ¿Ya te registraste pero no verificaste?{' '}
                        <button type="button" className="link-text" onClick={handleGoToVerify}>Verificar correo</button>
                    </p>
                </form>
            )}

            {/* ── Paso 1: verificar email ── */}
            {step === 1 && (
                <form className="auth-form" onSubmit={handleVerify} noValidate>
                    <div className="auth-heading">
                        <h1 className="auth-form-title">Verifica tu correo</h1>
                        <p className="auth-form-sub">
                            Enviamos un código a <strong>{form.email}</strong>. Ingrésalo para activar tu cuenta.
                        </p>
                    </div>

                    <div className="auth-field-group">
                        <div className="auth-field">
                            <label htmlFor="reg-code">Código de verificación</label>
                            <input
                                id="reg-code"
                                className={`input-field rp-code-input ${codeError ? 'input-field--error' : ''}`}
                                type="text"
                                placeholder="Ej. 439349"
                                value={code}
                                onChange={e => { setCode(e.target.value); setCodeError('') }}
                                inputMode="numeric"
                                maxLength={8}
                                autoComplete="one-time-code"
                                autoFocus
                            />
                            {codeError && <span className="auth-error">{codeError}</span>}
                        </div>
                    </div>

                    <div className="auth-links">
                        <button type="button" className="link-text" onClick={handleResend} disabled={resending}>
                            {resending ? 'Reenviando…' : '¿No llegó? Reenviar código'}
                        </button>
                    </div>

                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Verificando…' : 'Verificar cuenta'}
                    </button>
                </form>
            )}

            {/* ── Paso 2: tu ruta ── */}
            {step === 2 && (
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
