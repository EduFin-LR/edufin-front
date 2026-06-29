import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { getDiagnosticQuestions, submitDiagnostic } from '../../services/assessmentService'
import { playCorrect, playComplete } from '../../utils/sounds'
import type { DiagnosticQuestion, DiagnosticAnswer, DiagnosticResultProfile } from '../../types/assessment'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import edufinLogo from '../../assets/images/edufinLogo.png'
import pensando   from '../../assets/images/pensando.png'
import progresoA  from '../../assets/images/ProgresoA.png'
import './Diagnostic.css'

type Screen = 'welcome' | 'quiz' | 'result'

export default function Diagnostic() {
    const navigate  = useNavigate()
    const { username, refreshProfile } = useAuth()

    const [screen,    setScreen]    = useState<Screen>('welcome')
    const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
    const [current,   setCurrent]   = useState(0)
    const [answers,   setAnswers]   = useState<DiagnosticAnswer[]>([])
    const [selected,  setSelected]  = useState<string | null>(null)
    const [result,    setResult]    = useState<DiagnosticResultProfile | null>(null)
    const [loading,   setLoading]   = useState(false)
    const [startedAt, setStartedAt] = useState<number>(Date.now())

    useEffect(() => {
        getDiagnosticQuestions(10).then(r => setQuestions(r.data)).catch(() => {})
    }, [])

    const displayName = username ?? 'Estudiante'
    const total       = questions.length || 10

    const handleStart = () => {
        setStartedAt(Date.now())
        setScreen('quiz')
    }

    const handleSelect = (optionId: string) => setSelected(optionId)

    const handleNext = async () => {
        if (!selected) return
        const q            = questions[current]
        const timeTakenSec = Math.round((Date.now() - startedAt) / 1000)
        const newAnswers   = [...answers, { questionId: q.questionId, selectedOptionId: selected, timeTakenSec }]
        setAnswers(newAnswers)
        setSelected(null)
        setStartedAt(Date.now())

        if (current + 1 < total) {
            playCorrect()
            setCurrent(c => c + 1)
        } else {
            setLoading(true)
            try {
                const res = await submitDiagnostic(newAnswers)
                setResult(res.data)
            } catch {
                setResult(null)
            } finally {
                setLoading(false)
                playComplete()
                setScreen('result')
            }
        }
    }

    const pct = total > 0 ? Math.round((current / total) * 100) : 0

    // ── Welcome ────────────────────────────────────────────────────────────────
    if (screen === 'welcome') return (
        <div className="diag-page">
            <img src={edufinLogo} alt="Edufin" className="diag-logo" />
            <div className="diag-welcome">
                <div className="diag-welcome-text">
                    <h1>¡BIENVENIDO, <span>{displayName.toUpperCase()}!</span></h1>
                    <p>Antes de comenzar tu aventura,<br />descubramos que tan fuerte es tu<br />poder financiero.</p>
                    <ul className="diag-info-list">
                        <li><span className="diag-icon">📋</span> {total} preguntas</li>
                        <li><span className="diag-icon">🕐</span> Aprox. 7 minutos</li>
                        <li><span className="diag-icon">🪙</span> 100 puntos de experiencia</li>
                    </ul>
                    <button className="btn btn-primary diag-start-btn" onClick={handleStart}>
                        Comenzar evaluación
                    </button>
                </div>
                <img src={pensando} alt="personaje" className="diag-character" />
            </div>
        </div>
    )

    // ── Result ─────────────────────────────────────────────────────────────────
    if (screen === 'result') return (
        <div className="diag-page diag-page--result">
            <img src={edufinLogo} alt="Edufin" className="diag-logo" />
            <motion.div
                className="diag-result"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="diag-result-title">¡Evaluación completada!</h1>
                <p className="diag-result-subtitle">Este es tu perfil financiero</p>

                <div className="diag-profile-card">
                    <img src={pensando} alt="robot" className="diag-profile-img" />
                    <div className="diag-profile-info">
                        <h2>{result?.financialLevel ?? 'Perfil financiero'}</h2>
                        <p>{result?.feedbackMessage ?? 'Completaste la evaluación inicial.'}</p>
                    </div>
                </div>

                <div className="diag-score-row">
                    <div className="diag-score-card">
                        <span className="diag-score-label">Puntaje total</span>
                        <div className="diag-score-val">
                            <span className="diag-score-icon">📋</span>
                            <strong>{result?.score ?? 0}/{(result?.totalQuestions ?? 10) * 10}</strong>
                        </div>
                    </div>
                    <div className="diag-score-card">
                        <span className="diag-score-label">Experiencia ganada</span>
                        <div className="diag-score-val">
                            <img src={progresoA} alt="xp" className="diag-xp-icon" />
                            <strong className="diag-xp-text">+100 exp</strong>
                        </div>
                    </div>
                </div>

                <button className="btn btn-primary diag-start-btn" onClick={async () => {
                    await refreshProfile()
                    navigate('/dashboard')
                }}>
                    Ir al inicio
                </button>
            </motion.div>
        </div>
    )

    // ── Quiz ───────────────────────────────────────────────────────────────────
    const q = questions[current]

    return (
        <>
            <LoadingScreen visible={loading} message="Procesando resultados…" />
            <div className="diag-page diag-page--quiz">
                <img src={edufinLogo} alt="Edufin" className="diag-logo" />

                <div className="diag-progress-wrap">
                    <span className="diag-progress-label">Pregunta {current + 1} de {total}</span>
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
                                key={current}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                <p className="diag-question-text">{q?.questionText}</p>
                                <div className="diag-options">
                                    {q?.options.map(opt => (
                                        <button
                                            key={opt.optionId}
                                            className={`diag-option ${selected === opt.optionId ? 'diag-option--selected' : ''}`}
                                            onClick={() => handleSelect(opt.optionId)}
                                        >
                                            <span className="diag-option-radio" />
                                            {opt.optionText}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <button
                            className="btn btn-primary diag-next-btn"
                            onClick={handleNext}
                            disabled={!selected || loading}
                        >
                            {current + 1 < total ? 'Siguiente' : 'Finalizar'}
                        </button>
                    </div>

                    <img src={pensando} alt="pensando" className="diag-character diag-character--quiz" />
                </div>
            </div>
        </>
    )
}
