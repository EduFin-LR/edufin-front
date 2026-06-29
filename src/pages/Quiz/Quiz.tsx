import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    getLessonQuestions, startLesson, completeLesson, submitAttempt,
} from '../../services/quizService'
import { playCorrect, playWrong } from '../../utils/sounds'
import type { QuizQuestion, QuizOption, QuizCompleteResult } from '../../services/quizService'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import edufinLogo from '../../assets/images/edufinLogo.png'
import progresoA  from '../../assets/images/ProgresoA.png'
import './Quiz.css'

type FeedbackState = 'correct' | 'incorrect' | null

function getCategories(options: QuizOption[]) {
    const seen = new Set<string>()
    return options
        .map(o => o.matchCategory)
        .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c))
}

// ── Multiple Choice ────────────────────────────────────────────────────────────
function MultipleChoice({
    question, onAnswer, disabled, questionStartTime,
}: { question: QuizQuestion; onAnswer: (_: string, correct: boolean) => void; disabled: boolean; questionStartTime: number }) {
    const [selected, setSelected] = useState<string | null>(null)
    useEffect(() => setSelected(null), [question.id])

    const handleConfirm = () => {
        if (!selected) return
        const opt = question.options.find(o => o.id === selected)!
        const timeTakenSec = Math.round((Date.now() - questionStartTime) / 1000)
        submitAttempt({ questionId: question.id, selectedOptionId: selected, timeTakenSec }).catch(() => {})
        onAnswer(selected, opt.isCorrect)
    }

    return (
        <div className="quiz-mc">
            <p className="quiz-question-text">{question.questionText}</p>
            <div className="quiz-options">
                {question.options.map(opt => (
                    <button
                        key={opt.id}
                        className={`quiz-option ${selected === opt.id ? 'quiz-option--selected' : ''}`}
                        onClick={() => { if (!disabled) setSelected(opt.id) }}
                        disabled={disabled}
                    >
                        <span className="quiz-radio" />
                        {opt.optionText}
                    </button>
                ))}
            </div>
            <button
                className="btn btn-primary quiz-next-btn"
                disabled={!selected || disabled}
                onClick={handleConfirm}
            >
                Confirmar
            </button>
        </div>
    )
}

// ── Drag & Drop con framer-motion ──────────────────────────────────────────────
function DragDrop({
    question, onAnswer, disabled, questionStartTime,
}: { question: QuizQuestion; onAnswer: (correct: boolean) => void; disabled: boolean; questionStartTime: number }) {
    const categories = getCategories(question.options)
    const [placed, setPlaced] = useState<Record<string, string | null>>(
        () => Object.fromEntries(question.options.map(o => [o.id, null]))
    )
    const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({})

    useEffect(() => {
        setPlaced(Object.fromEntries(question.options.map(o => [o.id, null])))
    }, [question.id])

    const unplaced = question.options.filter(o => placed[o.id] === null)
    const allPlaced = unplaced.length === 0

    const handleDragEnd = (optId: string, point: { x: number; y: number }) => {
        for (const cat of categories) {
            const el = zoneRefs.current[cat]
            if (!el) continue
            const rect = el.getBoundingClientRect()
            if (
                point.x >= rect.left && point.x <= rect.right &&
                point.y >= rect.top  && point.y <= rect.bottom
            ) {
                setPlaced(prev => ({ ...prev, [optId]: cat }))
                return
            }
        }
    }

    const handleRemove = (optId: string) => {
        if (disabled) return
        setPlaced(prev => ({ ...prev, [optId]: null }))
    }

    const handleConfirm = () => {
        const timeTakenSec = Math.round((Date.now() - questionStartTime) / 1000)
        // un attempt por cada opción colocada
        question.options.forEach(o => {
            if (placed[o.id] !== null) {
                submitAttempt({ questionId: question.id, selectedOptionId: o.id, timeTakenSec }).catch(() => {})
            }
        })
        const allCorrect = question.options.every(o => placed[o.id] === o.matchCategory)
        onAnswer(allCorrect)
    }

    // color de zona por índice
    const zoneColors = ['#dcfce7', '#fef9c3', '#fee2e2']
    const zoneBorders = ['#86efac', '#fde047', '#fca5a5']

    return (
        <div className="quiz-dd">
            <p className="quiz-question-text">{question.questionText}</p>
            {question.hint && <p className="quiz-hint">💡 {question.hint}</p>}

            {/* Banco de tarjetas sin colocar */}
            <div className="dd-bank">
                <AnimatePresence>
                    {unplaced.map(opt => (
                        <motion.div
                            key={opt.id}
                            className="dd-card"
                            drag={!disabled}
                            dragElastic={0.15}
                            dragMomentum={false}
                            whileDrag={{ scale: 1.06, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', cursor: 'grabbing' }}
                            whileHover={{ scale: 1.03 }}
                            onDragEnd={(_, info) => handleDragEnd(opt.id, info.point)}
                            layout
                            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
                        >
                            <span className="dd-drag-icon">⠿</span>
                            {opt.optionText}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {unplaced.length === 0 && (
                    <span className="dd-bank-empty">Todas las tarjetas han sido colocadas ✓</span>
                )}
            </div>

            {/* Zonas */}
            <div className="dd-zones">
                {categories.map((cat, i) => (
                    <div
                        key={cat}
                        ref={el => { zoneRefs.current[cat] = el }}
                        className="dd-zone"
                        style={{ background: zoneColors[i] ?? '#f3f4f6', borderColor: zoneBorders[i] ?? '#d1d5db' }}
                    >
                        <span className="dd-zone-title">{cat}</span>
                        <div className="dd-zone-items">
                            <AnimatePresence>
                                {question.options.filter(o => placed[o.id] === cat).map(o => (
                                    <motion.div
                                        key={o.id}
                                        className="dd-placed"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        onClick={() => handleRemove(o.id)}
                                    >
                                        <span className="dd-drag-icon">⠿</span>
                                        <span>{o.optionText}</span>
                                        {!disabled && <span className="dd-remove">✕</span>}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="btn btn-primary quiz-next-btn"
                disabled={!allPlaced || disabled}
                onClick={handleConfirm}
            >
                Confirmar
            </button>
        </div>
    )
}

// ── Feedback banner ────────────────────────────────────────────────────────────
function FeedbackBanner({ feedback, message, onNext, isLast }: {
    feedback: FeedbackState; message: string; onNext: () => void; isLast: boolean
}) {
    if (!feedback) return null
    const ok = feedback === 'correct'
    return (
        <motion.div
            className={`quiz-feedback ${ok ? 'quiz-feedback--correct' : 'quiz-feedback--incorrect'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
            <div className="quiz-feedback-left">
                <span className="quiz-feedback-icon">{ok ? '🎉' : '😅'}</span>
                <p className="quiz-feedback-msg">{message}</p>
            </div>
            <button className="btn btn-primary quiz-feedback-btn" onClick={onNext}>
                {isLast ? 'Ver resultado' : 'Siguiente →'}
            </button>
        </motion.div>
    )
}

// ── Result screen ──────────────────────────────────────────────────────────────
function ResultScreen({ result, onBack }: { result: QuizCompleteResult | null; onBack: () => void }) {
    const pct = result ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0
    return (
        <div className="quiz-result-page">
            <img src={edufinLogo} alt="Edufin" className="quiz-result-logo" />
            <motion.div
                className="quiz-result-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="quiz-result-title">
                    {result?.passed ? '¡Lección completada! 🎉' : '¡Buen intento! 💪'}
                </h1>
                <p className="quiz-result-sub">Aquí está tu resultado</p>

                <div className="quiz-result-circle">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#e5f7ea" strokeWidth="10"/>
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#2db84f" strokeWidth="10"
                            strokeDasharray={`${pct * 2.76} 276`} strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                        />
                    </svg>
                    <span className="quiz-result-pct">{pct}%</span>
                </div>

                <div className="quiz-result-stats">
                    <div className="quiz-stat">
                        <span className="quiz-stat-num quiz-stat-correct">{result?.correctAnswers ?? 0}</span>
                        <span className="quiz-stat-lbl">Correctas</span>
                    </div>
                    <div className="quiz-stat">
                        <span className="quiz-stat-num quiz-stat-wrong">{result?.incorrectAnswers ?? 0}</span>
                        <span className="quiz-stat-lbl">Incorrectas</span>
                    </div>
                    <div className="quiz-stat">
                        <div className="quiz-stat-xp">
                            <img src={progresoA} alt="xp" className="quiz-stat-xp-img" />
                            <span className="quiz-stat-num quiz-stat-xpnum">+{result?.xpEarned ?? 0}</span>
                        </div>
                        <span className="quiz-stat-lbl">XP ganada</span>
                    </div>
                </div>

                <button className="btn btn-primary quiz-result-btn" onClick={onBack}>
                    Volver a la ruta
                </button>
            </motion.div>
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Quiz() {
    const { lessonId } = useParams<{ lessonId: string }>()
    const navigate     = useNavigate()

    const [questions,  setQuestions]  = useState<QuizQuestion[]>([])
    const [current,    setCurrent]    = useState(0)
    const [feedback,   setFeedback]   = useState<FeedbackState>(null)
    const [loading,    setLoading]    = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [result,     setResult]     = useState<QuizCompleteResult | null>(null)
    const [screen,     setScreen]     = useState<'quiz' | 'result'>('quiz')
    const [correct,       setCorrect]       = useState(0)
    const startTime       = useRef(Date.now())
    const questionStartAt = useRef(Date.now())

    useEffect(() => {
        if (!lessonId) return
        setLoading(true)
        startLesson(lessonId)
            .then(() => getLessonQuestions(lessonId))
            .then(r => { setQuestions(r.data); startTime.current = Date.now() })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [lessonId])

    const q      = questions[current]
    const isLast = current === questions.length - 1

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) { setCorrect(c => c + 1); playCorrect() } else { playWrong() }
        setFeedback(isCorrect ? 'correct' : 'incorrect')
    }

    const handleNext = async () => {
        setFeedback(null)
        questionStartAt.current = Date.now()
        if (!isLast) { setCurrent(c => c + 1); return }
        setSubmitting(true)
        const timeSpentSec = Math.round((Date.now() - startTime.current) / 1000)
        try {
            const res = await completeLesson(lessonId!, timeSpentSec)
            setResult(res.data)
        } catch {
            const tot = questions.length
            const cor = correct + (feedback === 'correct' ? 1 : 0)
            setResult({ correctAnswers: cor, incorrectAnswers: tot - cor, totalQuestions: tot, xpEarned: 100, passed: cor >= tot * 0.6 })
        } finally {
            setSubmitting(false)
            setScreen('result')
        }
    }

    const pct = questions.length > 0 ? Math.round((current / questions.length) * 100) : 0

    if (screen === 'result') return <ResultScreen result={result} onBack={() => navigate(-1)} />

    return (
        <>
            <LoadingScreen visible={loading || submitting} message={submitting ? 'Calculando resultados…' : 'Cargando lección…'} />
            <div className="quiz-page">
                <img src={edufinLogo} alt="Edufin" className="quiz-logo" />

                <div className="quiz-progress-wrap">
                    <span className="quiz-progress-label">Pregunta {current + 1} de {questions.length}</span>
                    <div className="quiz-progress-bar">
                        <motion.div className="quiz-progress-fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={q?.id}
                        className="quiz-body"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.22 }}
                    >
                        {q?.questionType === 'MULTIPLE_CHOICE' && (
                            <MultipleChoice question={q} onAnswer={(_, ok) => handleAnswer(ok)} disabled={!!feedback} questionStartTime={questionStartAt.current} />
                        )}
                        {q?.questionType === 'DRAG_AND_DROP' && (
                            <DragDrop question={q} onAnswer={handleAnswer} disabled={!!feedback} questionStartTime={questionStartAt.current} />
                        )}
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                    {feedback && (
                        <FeedbackBanner feedback={feedback} message={feedback === 'correct' ? q.successMessage : q.errorMessage} onNext={handleNext} isLast={isLast} />
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}
