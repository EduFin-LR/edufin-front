import { useEffect, useState, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowLeft } from 'react-icons/fa'
import {
    getLessonQuestions, getAdaptiveQuizQuestions, getDynamicFinalQuestions, completeDynamicFinal, startLesson, completeLesson, submitAttempt,
} from '../../services/quizService'
import { playCorrect, playWrong, playComplete } from '../../utils/sounds'
import type { QuizQuestion, QuizOption, QuizCompleteResult } from '../../services/quizService'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import edufinLogo       from '../../assets/images/edufinLogo.png'
import progresoA        from '../../assets/images/ProgresoA.png'
import robotCorrecto    from '../../assets/images/robotCorrecto.png'
import robotIncorrecto  from '../../assets/images/robotIncorrecto.png'
import robotFeliz       from '../../assets/images/robotFeliz.png'
import './Quiz.css'

type FeedbackState = 'correct' | 'incorrect' | null

function getCategories(options: QuizOption[]) {
    const seen = new Set<string>()
    return options
        .map(o => o.matchCategory)
        .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c))
}

// ── Theory card ────────────────────────────────────────────────────────────────
function highlightCaps(text: string) {
    // Split by words fully in UPPERCASE (3+ chars) and wrap them
    const parts = text.split(/(\b[A-ZÁÉÍÓÚÑÜ]{3,}\b)/)
    return parts.map((part, i) =>
        /^[A-ZÁÉÍÓÚÑÜ]{3,}$/.test(part)
            ? <strong key={i} className="theory-keyword">{part}</strong>
            : part
    )
}

function TheoryCard({ text, questionId }: { text: string; questionId: string }) {
    const [open, setOpen] = useState(true)
    useEffect(() => setOpen(true), [questionId])

    return (
        <motion.div
            className="theory-card"
            layout
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <button className="theory-header" onClick={() => setOpen(o => !o)}>
                <span className="theory-header-left">
                    <span className="theory-bulb">💡</span>
                    <span className="theory-title">Concepto clave</span>
                </span>
                <motion.span
                    className="theory-chevron"
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >▾</motion.span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="body"
                        className="theory-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <p className="theory-text">{highlightCaps(text)}</p>
                        <button className="theory-dismiss" onClick={() => setOpen(false)}>
                            Entendido, ir a la pregunta →
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
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
        submitAttempt({
            questionId: question.id,
            selectedOptionId: selected,
            timeTakenSec,
            selectedMatchCategory: null,
            interactionType: question.interactionType,
            selectionReason: question.selectionReason,
        }).catch(() => {})
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
    const zoneRefs     = useRef<Record<string, HTMLDivElement | null>>({})
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setPlaced(Object.fromEntries(question.options.map(o => [o.id, null])))
    }, [question.id])

    const unplaced = question.options.filter(o => placed[o.id] === null)
    const allPlaced = unplaced.length === 0

    const handleDragEnd = (optId: string, event: MouseEvent | TouchEvent | PointerEvent) => {
        // Use clientX/Y (viewport coords) to match getBoundingClientRect()
        // info.point uses page coords (includes scroll) — that's why it drifts
        let cx: number, cy: number
        if ('changedTouches' in event && event.changedTouches.length > 0) {
            cx = event.changedTouches[0].clientX
            cy = event.changedTouches[0].clientY
        } else {
            cx = (event as PointerEvent).clientX
            cy = (event as PointerEvent).clientY
        }
        for (const cat of categories) {
            const el = zoneRefs.current[cat]
            if (!el) continue
            const rect = el.getBoundingClientRect()
            if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
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
                submitAttempt({
                    questionId: question.id,
                    selectedOptionId: o.id,
                    timeTakenSec,
                    selectedMatchCategory: placed[o.id],
                    interactionType: question.interactionType,
                    selectionReason: question.selectionReason,
                }).catch(() => {})
            }
        })
        const allCorrect = question.options.every(o => placed[o.id] === o.matchCategory)
        onAnswer(allCorrect)
    }

    // color de zona por índice
    const zoneColors = ['#dcfce7', '#fef9c3', '#fee2e2']
    const zoneBorders = ['#86efac', '#fde047', '#fca5a5']

    return (
        <div className="quiz-dd" ref={containerRef}>
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
                            dragConstraints={containerRef}
                            dragElastic={0.05}
                            dragMomentum={false}
                            whileDrag={{ scale: 1.06, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', cursor: 'grabbing' }}
                            whileHover={{ scale: 1.03 }}
                            onDragEnd={(event) => handleDragEnd(opt.id, event)}
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
            <div className="quiz-feedback-inner">
                {/* Robot animado */}
                <AnimatePresence>
                    <motion.img
                        key={feedback}
                        src={ok ? robotCorrecto : robotIncorrecto}
                        alt={ok ? 'robot correcto' : 'robot incorrecto'}
                        className="quiz-feedback-robot"
                        initial={{ x: ok ? -80 : 80, opacity: 0, rotate: ok ? -15 : 15 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
                    />
                </AnimatePresence>

                <div className="quiz-feedback-content">
                    <div className="quiz-feedback-left">
                        <p className="quiz-feedback-msg">{message}</p>
                    </div>
                    <button className="btn btn-primary quiz-feedback-btn" onClick={onNext}>
                        {isLast ? 'Ver resultado' : 'Siguiente →'}
                    </button>
                </div>

                <div className="quiz-feedback-spacer" />
            </div>
        </motion.div>
    )
}

// ── Animated counter ──────────────────────────────────────────────────────────
function CountUp({ to, duration = 1.2, delay = 0 }: { to: number; duration?: number; delay?: number }) {
    const [val, setVal] = useState(0)
    useEffect(() => {
        let start: number | null = null
        let raf: number
        const step = (ts: number) => {
            if (!start) start = ts + delay * 1000
            const elapsed = ts - start
            if (elapsed < 0) { raf = requestAnimationFrame(step); return }
            const progress = Math.min(elapsed / (duration * 1000), 1)
            setVal(Math.round(progress * to))
            if (progress < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [to, duration, delay])
    return <>{val}</>
}

// ── Result screen ──────────────────────────────────────────────────────────────
function ResultScreen({ result, onBack }: { result: QuizCompleteResult | null; onBack: () => void }) {
    const pct      = result ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0
    const passed   = result?.passed ?? (pct >= 60)

    const fireConfetti = useCallback(() => {
        const burst = (origin: { x: number; y: number }, angle: number) =>
            confetti({
                particleCount: 80,
                spread: 60,
                angle,
                origin,
                colors: ['#2db84f', '#52d472', '#fbbf24', '#34d399', '#ffffff'],
                shapes: ['star', 'circle'],
                scalar: 1.1,
            })
        burst({ x: 0, y: 0.7 }, 60)
        burst({ x: 1, y: 0.7 }, 120)
        setTimeout(() => {
            burst({ x: 0.1, y: 0.5 }, 70)
            burst({ x: 0.9, y: 0.5 }, 110)
        }, 350)
    }, [])

    useEffect(() => {
        if (passed) {
            const t = setTimeout(fireConfetti, 500)
            return () => clearTimeout(t)
        }
    }, [passed, fireConfetti])
    const totalXp  = result?.totalExperience ?? 0

    return (
        <div className="quiz-result-page">
            <img src={edufinLogo} alt="Edufin" className="quiz-result-logo" />

            {/* Robot feliz */}
            <motion.img
                src={robotFeliz}
                alt="robot feliz"
                className="quiz-result-robot"
                initial={{ scale: 0.3, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.1 }}
            />

            <motion.div
                className="quiz-result-card"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
            >
                <h1 className="quiz-result-title">
                    {passed ? '¡Lección completada!' : '¡Buen intento!'}
                </h1>
                <p className="quiz-result-sub">Aquí está tu resultado</p>

                {/* Score circle */}
                <div className="quiz-result-circle">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#e5f7ea" strokeWidth="10"/>
                        <motion.circle
                            cx="50" cy="50" r="44" fill="none"
                            stroke={pct >= 60 ? '#2db84f' : '#f59e0b'}
                            strokeWidth="10" strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            initial={{ strokeDasharray: '0 276' }}
                            animate={{ strokeDasharray: `${pct * 2.76} 276` }}
                            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
                        />
                    </svg>
                    <span className="quiz-result-pct" style={{ color: pct >= 60 ? '#2db84f' : '#f59e0b' }}>
                        {pct}%
                    </span>
                </div>

                {/* Correct / Incorrect */}
                <div className="quiz-result-stats">
                    <motion.div className="quiz-stat" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
                        <span className="quiz-stat-num quiz-stat-correct">
                            <CountUp to={result?.correctAnswers ?? 0} delay={0.5} />
                        </span>
                        <span className="quiz-stat-lbl">Correctas</span>
                    </motion.div>
                    <motion.div className="quiz-stat" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
                        <span className="quiz-stat-num quiz-stat-wrong">
                            <CountUp to={result?.incorrectAnswers ?? 0} delay={0.6} />
                        </span>
                        <span className="quiz-stat-lbl">Incorrectas</span>
                    </motion.div>
                </div>

                {/* XP breakdown */}
                <motion.div
                    className="quiz-xp-block"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, type: 'spring', stiffness: 260, damping: 20 }}
                >
                    <div className="quiz-xp-total">
                        <img src={progresoA} alt="xp" className="quiz-xp-icon" />
                        <span className="quiz-xp-total-num">
                            +<CountUp to={totalXp} duration={1.4} delay={0.8} />
                        </span>
                        <span className="quiz-xp-total-lbl">XP ganada</span>
                    </div>
                </motion.div>

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
    const [searchParams] = useSearchParams()
    const lessonType = searchParams.get('type')
    const topicId = searchParams.get('topicId')
    const isFinal = lessonType === 'FINAL'

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

        // FINAL no representa una Lesson persistida.
        if (isFinal) {
            if (!topicId) {
                setLoading(false)
                return
            }

            getDynamicFinalQuestions(topicId)
                .then(r => {
                    setQuestions(r.data)
                    startTime.current = Date.now()
                    questionStartAt.current = Date.now()
                })
                .catch(() => {})
                .finally(() => setLoading(false))

            return
        }

        const questionsRequest =
            lessonType === 'QUIZ'
                ? getAdaptiveQuizQuestions(lessonId)
                : getLessonQuestions(lessonId)

        startLesson(lessonId)
            .then(() => questionsRequest)
            .then(r => {
                setQuestions(r.data)
                startTime.current = Date.now()
                questionStartAt.current = Date.now()
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [lessonId, lessonType, topicId, isFinal])

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
            if (isFinal) {
                if (!topicId) {
                    throw new Error('topicId no disponible para completar el FINAL')
                }

                const questionIds = questions.map(question => question.id)

                const res = await completeDynamicFinal(
                    topicId,
                    questionIds,
                    timeSpentSec
                )

                setResult({
                    correctAnswers: res.data.correctAnswers,
                    incorrectAnswers: res.data.incorrectAnswers,
                    totalQuestions: res.data.totalQuestions,
                    lessonExperience: 0,
                    questionsExperience: res.data.finalExperience,
                    totalExperience: res.data.finalExperience,
                    passed: res.data.passed,
                })

            } else {
                const res = await completeLesson(lessonId!, timeSpentSec)
                setResult(res.data)
            }

        } catch {
            const tot = questions.length
            const cor = correct

            setResult({
                correctAnswers: cor,
                incorrectAnswers: tot - cor,
                totalQuestions: tot,
                lessonExperience: 0,
                questionsExperience: 0,
                totalExperience: 0,
                passed: cor >= tot * 0.6,
            })

        } finally {
            setSubmitting(false)
            playComplete()
            setScreen('result')
        }
    }

    const pct = questions.length > 0 ? Math.round((current / questions.length) * 100) : 0

    if (screen === 'result') return <ResultScreen result={result} onBack={() => navigate(-1)} />

    return (
        <>
            <LoadingScreen
                visible={loading || submitting}
                message={
                    submitting
                        ? 'Calculando resultados…'
                        : isFinal
                            ? 'Generando evaluación final…'
                            : 'Cargando lección…'
                }
            />
            <div className="quiz-page">
                <div className="quiz-top-bar">
                    <button className="quiz-back-btn" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Salir
                    </button>
                    <img src={edufinLogo} alt="Edufin" className="quiz-logo" />
                </div>

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
                        {q?.TheoryText && (
                            <TheoryCard text={q.TheoryText} questionId={q.id} />
                        )}
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
