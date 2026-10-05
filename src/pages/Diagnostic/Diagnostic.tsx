import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
    getExperimentalQuestions,
    submitExperimentalAssessment,
    getExperimentalAssessmentStatus,
} from '../../services/assessmentService'
import type {
    ExperimentalQuestion,
    ExperimentalAnswer,
    ExperimentalSubmissionResponse,
} from '../../services/assessmentService'
import { playComplete } from '../../utils/sounds'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import Logo from '../../components/Logo/Logo'
import idea from '../../assets/images/idea.png'
import saludo from '../../assets/images/saludo.png'
import pensando from '../../assets/images/pensando.png'
import './Diagnostic.css'

type Screen = 'welcome' | 'quiz' | 'result'

export default function Diagnostic() {
    const navigate = useNavigate()
    const location = useLocation()
    const isPostTest = location.pathname === '/post-test'
    const phase = isPostTest ? 'POST_TEST' : 'PRE_TEST'
    const { username, refreshProfile } = useAuth()

    const [screen, setScreen] = useState<Screen>('welcome')
    const [questions, setQuestions] = useState<ExperimentalQuestion[]>([])
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState<ExperimentalAnswer[]>([])
    const [selected, setSelected] = useState<string | null>(null)
    const [result, setResult] = useState<ExperimentalSubmissionResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [startedAt, setStartedAt] = useState<number>(Date.now())

    useEffect(() => {
        setLoading(true)
        setLoadError(false)

        const load = async () => {
            if (isPostTest) {
                const status = await getExperimentalAssessmentStatus()
                if (!status.data.postTestEligible || status.data.postTestCompleted) {
                    navigate('/dashboard', { replace: true })
                    return
                }
            }

            const response = await getExperimentalQuestions()
            setQuestions(response.data)
        }

        load()
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false))
    }, [isPostTest, navigate])

    const displayName = username ?? 'Estudiante'
    const total = questions.length || 12

    const handleStart = () => {
        if (questions.length === 0) return
        setStartedAt(Date.now())
        setScreen('quiz')
    }

    const handleSelect = (optionId: string) => setSelected(optionId)

    const handleNext = async () => {
        if (!selected || !questions[current]) return

        const q = questions[current]
        const timeTakenSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
        const newAnswers: ExperimentalAnswer[] = [
            ...answers,
            {
                questionId: q.id,
                selectedOptionId: selected,
                timeTakenSec,
            },
        ]

        setAnswers(newAnswers)
        setSelected(null)
        setStartedAt(Date.now())
        setSubmitError(null)

        if (current + 1 < questions.length) {
            setCurrent(c => c + 1)
            return
        }

        setLoading(true)
        try {
            const res = await submitExperimentalAssessment(phase, newAnswers)
            setResult(res.data)
            playComplete()
            setScreen('result')
        } catch (error: any) {
            const status = error?.response?.status
            if (status === 409) {
                setSubmitError(isPostTest ? 'Este post-test ya fue registrado anteriormente para tu cuenta.' : 'Este pre-test ya fue registrado anteriormente para tu cuenta.')
            } else {
                setSubmitError('No se pudo guardar la evaluación. Inténtalo nuevamente.')
            }
        } finally {
            setLoading(false)
        }
    }

    const pct = questions.length > 0
        ? Math.round((current / questions.length) * 100)
        : 0

    // ── Welcome ────────────────────────────────────────────────────────────────
    if (screen === 'welcome') return (
        <div className="diag-page">
            <LoadingScreen visible={loading} message="Cargando evaluación…" />
            <Logo className="diag-logo" />
            <div className="diag-welcome">
                <div className="diag-welcome-text">
                    <h1>{isPostTest ? '¡ÚLTIMA EVALUACIÓN!' : <>¡BIENVENIDO, <span>{displayName.toUpperCase()}!</span></>}</h1>
                    <p>
                        {isPostTest ? (
                            <>Has completado todos los módulos.<br />Ahora queremos medir cuánto aprendiste<br />durante tu experiencia en EDUFIN.</>
                        ) : (
                            <>Antes de comenzar tu aventura,<br />queremos conocer tu nivel inicial de<br />conocimientos financieros.</>
                        )}
                    </p>
                    <ul className="diag-info-list">
                        <li><span className="diag-icon">📋</span> {total} preguntas</li>
                        <li><span className="diag-icon">🕐</span> Aprox. 7 minutos</li>
                        <li><span className="diag-icon">🎯</span> Selecciona “No lo sé” si no estás seguro</li>
                    </ul>

                    {loadError && (
                        <p style={{ marginTop: 12 }}>
                            No se pudo cargar la evaluación. Recarga la página para intentarlo nuevamente.
                        </p>
                    )}

                    <button
                        className="btn btn-primary diag-start-btn"
                        onClick={handleStart}
                        disabled={loading || loadError || questions.length === 0}
                    >
                        {isPostTest ? 'Comenzar post-test' : 'Comenzar evaluación'}
                    </button>
                </div>
                <img src={saludo} alt="personaje" className="diag-character" />
            </div>
        </div>
    )

    // ── Result ─────────────────────────────────────────────────────────────────
    if (screen === 'result') return (
        <div className="diag-page diag-page--result">
            <Logo className="diag-logo" />
            <motion.div
                className="diag-result"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="diag-result-title">¡Evaluación completada!</h1>
                <p className="diag-result-subtitle">{isPostTest ? 'Tu evaluación final fue registrada correctamente' : 'Tus respuestas fueron registradas correctamente'}</p>

                <div className="diag-profile-card">
                    <img src={idea} alt="robot" className="diag-profile-img" />
                    <div className="diag-profile-info">
                        <h2>{isPostTest ? '¡Experiencia completada!' : '¡Todo listo para comenzar!'}</h2>
                        <p>
                            {isPostTest
                                ? 'Gracias por completar EDUFIN. Esta evaluación permitirá comparar tu conocimiento final con tu nivel inicial y no modifica el modelo adaptativo.'
                                : 'Este pre-test nos permite medir tu nivel inicial y también ayuda a inicializar la estimación de dominio del sistema. No otorga experiencia ni desbloquea contenidos por sí mismo.'}
                        </p>
                    </div>
                </div>

                <div className="diag-score-row">
                    <div className="diag-score-card">
                        <span className="diag-score-label">Respuestas registradas</span>
                        <div className="diag-score-val">
                            <span className="diag-score-icon">📋</span>
                            <strong>{result?.totalQuestions ?? total}/{total}</strong>
                        </div>
                    </div>
                    <div className="diag-score-card">
                        <span className="diag-score-label">Estado</span>
                        <div className="diag-score-val">
                            <span className="diag-score-icon">✅</span>
                            <strong>Completado</strong>
                        </div>
                    </div>
                </div>

                <button className="btn btn-primary diag-start-btn" onClick={async () => {
                    await refreshProfile()
                    navigate('/dashboard')
                }}>
                    {isPostTest ? 'Finalizar experiencia' : 'Ir al inicio'}
                </button>
            </motion.div>
        </div>
    )

    // ── Quiz ───────────────────────────────────────────────────────────────────
    const q = questions[current]

    return (
        <>
            <LoadingScreen visible={loading} message="Guardando respuestas…" />
            <div className="diag-page diag-page--quiz">
                <Logo className="diag-logo" />

                <div className="diag-progress-wrap">
                    <span className="diag-progress-label">Pregunta {current + 1} de {questions.length}</span>
                    <div className="diag-progress-bar">
                        <motion.div
                            className="diag-progress-fill"
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                </div>

                <div className="diag-quiz-body">
                    <div className="diag-quiz-left">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={q?.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                <p className="diag-question-text">{q?.questionText}</p>
                                <div className="diag-options">
                                    {q?.options.map(opt => (
                                        <button
                                            key={opt.id}
                                            className={`diag-option ${selected === opt.id ? 'diag-option--selected' : ''}`}
                                            onClick={() => handleSelect(opt.id)}
                                        >
                                            <span className="diag-option-radio" />
                                            {opt.optionText}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {submitError && (
                            <p style={{ marginTop: 12 }}>
                                {submitError}
                            </p>
                        )}

                        <button
                            className="btn btn-primary diag-next-btn"
                            onClick={handleNext}
                            disabled={!selected || loading}
                        >
                            {current + 1 < questions.length ? 'Siguiente' : 'Finalizar'}
                        </button>
                    </div>

                    <img src={pensando} alt="pensando" className="diag-character diag-character--quiz" />
                </div>
            </div>
        </>
    )
}
