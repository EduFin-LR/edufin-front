import { useEffect, useState, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion'
import { LuArrowLeft, LuLightbulb, LuChevronDown, LuBookOpen, LuTarget, LuArrowRight, LuGripVertical, LuX, LuCheck, LuMousePointerClick, LuMove, LuFlame, LuCornerDownRight } from 'react-icons/lu'
import { FaStar } from 'react-icons/fa'
import {
    getLessonQuestions, getAdaptiveQuizQuestions, getDynamicFinalQuestions, completeDynamicFinal, startLesson, completeLesson, submitAttempt,
} from '../../services/quizService'
import { playCorrect, playWrong, playComplete, playStar } from '../../utils/sounds'
import { MAX_STARS, PENDING_STARS_KEY, starsForScore } from '../../utils/stars'
import { PENDING_NEXT_KEY } from '../../utils/nextLesson'
import type { QuizQuestion, QuizOption, QuizCompleteResult } from '../../services/quizService'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import Logo from '../../components/Logo/Logo'
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

interface Theory {
    titulo?:     string
    texto?:      string
    ejemplo?:    string
    idea_clave?: string
}

// El backend envía TheoryText como JSON serializado; si no lo es, se usa como texto plano
function parseTheory(raw: unknown): Theory {
    if (raw && typeof raw === 'object') return raw as Theory
    if (typeof raw !== 'string') return {}
    try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') return parsed as Theory
    } catch { /* texto plano */ }
    return { texto: raw }
}

function TheoryCard({ text, questionId }: { text: string; questionId: string }) {
    const [open, setOpen] = useState(true)
    useEffect(() => setOpen(true), [questionId])
    const theory = parseTheory(text)

    return (
        <motion.div
            className="theory-card"
            layout
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <button className="theory-header" onClick={() => setOpen(o => !o)} aria-expanded={open}>
                <span className="theory-header-left">
                    <span className="theory-icon"><LuLightbulb /></span>
                    <span className="theory-title">Concepto clave</span>
                </span>
                <motion.span
                    className="theory-chevron"
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                ><LuChevronDown /></motion.span>
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
                        {theory.titulo && <h3 className="theory-subtitle">{theory.titulo}</h3>}
                        {theory.texto && <p className="theory-text">{highlightCaps(theory.texto)}</p>}
                        {theory.ejemplo && (
                            <div className="theory-example">
                                <span className="theory-label"><LuBookOpen /> Ejemplo</span>
                                <p>{theory.ejemplo}</p>
                            </div>
                        )}
                        {theory.idea_clave && (
                            <div className="theory-key">
                                <span className="theory-label"><LuTarget /> Recuerda</span>
                                <p>{theory.idea_clave}</p>
                            </div>
                        )}
                        <button className="theory-dismiss" onClick={() => setOpen(false)}>
                            Entendido, ir a la pregunta <LuArrowRight />
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
    const [revealed, setRevealed] = useState(false)
    useEffect(() => { setSelected(null); setRevealed(false) }, [question.id])

    const handleConfirm = () => {
        if (!selected || revealed) return
        const opt = question.options.find(o => o.id === selected)!
        setRevealed(true)
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

    // Atajos: A-D o 1-4 eligen, Enter confirma
    useEffect(() => {
        if (disabled || revealed) return
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return
            const k = e.key.toLowerCase()
            const idx = /^[1-9]$/.test(k) ? Number(k) - 1 : /^[a-z]$/.test(k) ? k.charCodeAt(0) - 97 : -1
            if (idx >= 0 && idx < question.options.length) { setSelected(question.options[idx].id); return }
            // preventDefault evita que Enter también "pulse" el botón enfocado y confirme dos veces
            if (k === 'enter') { e.preventDefault(); handleConfirm() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleConfirm se recrea en cada render
    }, [disabled, revealed, question.options, selected])

    // Estado de cada opción después de confirmar
    const stateOf = (opt: QuizOption) => {
        if (!revealed) return selected === opt.id ? 'selected' : ''
        if (opt.isCorrect) return 'correct'
        if (selected === opt.id) return 'wrong'
        return 'dim'
    }

    return (
        <div className="quiz-mc">
            <span className="quiz-kind"><LuMousePointerClick /> Elige una respuesta</span>
            <p className="quiz-question-text">{question.questionText}</p>
            <div className="quiz-options" role="radiogroup" aria-label="Opciones">
                {question.options.map((opt, i) => {
                    const st = stateOf(opt)
                    return (
                        <motion.button
                            key={opt.id}
                            className={`quiz-option${st ? ` quiz-option--${st}` : ''}`}
                            onClick={() => { if (!disabled && !revealed) setSelected(opt.id) }}
                            disabled={disabled || revealed}
                            role="radio"
                            aria-checked={selected === opt.id}
                            whileTap={!revealed ? { scale: 0.985 } : undefined}
                            animate={st === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : st === 'correct' ? { scale: [1, 1.02, 1] } : {}}
                            transition={{ duration: 0.35 }}
                        >
                            <span className="quiz-letter" aria-hidden="true">
                                {st === 'correct' ? <LuCheck /> : st === 'wrong' ? <LuX /> : String.fromCharCode(65 + i)}
                            </span>
                            <span className="quiz-option-text">{opt.optionText}</span>
                            {st === 'correct' && <span className="quiz-option-tag">Correcta</span>}
                            {st === 'wrong'   && <span className="quiz-option-tag">Tu respuesta</span>}
                        </motion.button>
                    )
                })}
            </div>
            {!revealed && (
                <>
                    <button
                        className="btn btn-primary quiz-next-btn"
                        disabled={!selected || disabled}
                        onClick={handleConfirm}
                    >
                        {selected ? 'Confirmar' : 'Elige una opción'}
                    </button>
                </>
            )}
        </div>
    )
}

// ── Drag & Drop con framer-motion ──────────────────────────────────────────────
// Colores de los grupos, tomados de la paleta de la app
const ZONE_COLORS = ['#4CC46B', '#60A5FA', '#F5C04A', '#A78BFA', '#F472B6']

type DragEvt = MouseEvent | TouchEvent | PointerEvent
function pointOf(event: DragEvt) {
    // clientX/Y (coordenadas de ventana) para comparar con getBoundingClientRect()
    if ('changedTouches' in event && event.changedTouches.length > 0) {
        return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
    }
    return { x: (event as PointerEvent).clientX, y: (event as PointerEvent).clientY }
}

// Tarjeta del banco: se arrastra a un grupo, o se toca y luego se toca el grupo.
// Si se suelta fuera de un grupo, regresa a su lugar
function DragCard({ option, disabled, picked, constraintsRef, onMove, onDrop, onPick }: {
    option: QuizOption
    disabled: boolean
    picked: boolean
    constraintsRef: React.RefObject<HTMLDivElement | null>
    onMove: (event: DragEvt) => void
    onDrop: (event: DragEvt) => boolean
    onPick: () => void
}) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const back = { type: 'spring', stiffness: 500, damping: 32 } as const
    return (
        <motion.div
            className={`dd-card${picked ? ' dd-card--picked' : ''}`}
            style={{ x, y }}
            drag={!disabled}
            dragConstraints={constraintsRef}
            dragElastic={0.05}
            dragMomentum={false}
            whileDrag={{ scale: 1.06, zIndex: 50, boxShadow: '0 12px 28px rgba(0,0,0,0.35)', cursor: 'grabbing' }}
            whileHover={disabled ? undefined : { y: -2 }}
            onDrag={(event) => onMove(event)}
            onDragEnd={(event) => {
                if (!onDrop(event)) { animate(x, 0, back); animate(y, 0, back) }
            }}
            onTap={() => { if (!disabled) onPick() }}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-pressed={picked}
            onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick() } }}
            layout
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.12 } }}
        >
            <span className="dd-drag-icon"><LuGripVertical /></span>
            {option.optionText}
        </motion.div>
    )
}

function DragDrop({
    question, onAnswer, disabled, questionStartTime,
}: { question: QuizQuestion; onAnswer: (correct: boolean) => void; disabled: boolean; questionStartTime: number }) {
    const categories = getCategories(question.options)
    const [placed, setPlaced] = useState<Record<string, string | null>>(
        () => Object.fromEntries(question.options.map(o => [o.id, null]))
    )
    const [revealed, setRevealed] = useState(false)
    // Tarjeta tocada, esperando que se toque su grupo
    const [picked,   setPicked]   = useState<string | null>(null)
    // Grupo bajo el puntero mientras se arrastra
    const [overZone, setOverZone] = useState<string | null>(null)
    const zoneRefs     = useRef<Record<string, HTMLDivElement | null>>({})
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setPlaced(Object.fromEntries(question.options.map(o => [o.id, null])))
        setRevealed(false)
        setPicked(null)
        setOverZone(null)
    }, [question.id])

    const unplaced  = question.options.filter(o => placed[o.id] === null)
    const allPlaced = unplaced.length === 0
    const total     = question.options.length

    const zoneAt = (event: DragEvt) => {
        const { x, y } = pointOf(event)
        return categories.find(cat => {
            const r = zoneRefs.current[cat]?.getBoundingClientRect()
            return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
        }) ?? null
    }

    // Devuelve true si la tarjeta cayó en un grupo
    const handleDragEnd = (optId: string, event: DragEvt) => {
        setOverZone(null)
        const cat = zoneAt(event)
        if (!cat) return false
        setPlaced(prev => ({ ...prev, [optId]: cat }))
        setPicked(null)
        return true
    }

    const placePicked = (cat: string) => {
        if (!picked || disabled) return
        setPlaced(prev => ({ ...prev, [picked]: cat }))
        setPicked(null)
    }

    const handleRemove = (optId: string) => {
        if (disabled || revealed) return
        setPlaced(prev => ({ ...prev, [optId]: null }))
    }

    const handleConfirm = () => {
        const timeTakenSec = Math.round((Date.now() - questionStartTime) / 1000)
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
        setRevealed(true)
        setPicked(null)
        onAnswer(allCorrect)
    }

    // helper: estado de una tarjeta ya colocada
    const cardResult = (o: QuizOption): 'correct' | 'wrong' | null => {
        if (!revealed) return null
        return placed[o.id] === o.matchCategory ? 'correct' : 'wrong'
    }

    return (
        <div className="quiz-dd" ref={containerRef}>
            <span className="quiz-kind"><LuMove /> Clasifica las tarjetas</span>
            <p className="quiz-question-text">{question.questionText}</p>
            {question.hint && <p className="quiz-hint"><LuLightbulb /> {question.hint}</p>}

            {/* Banco de tarjetas sin colocar */}
            <div className="dd-bank-wrap">
                <div className="dd-bank-head">
                    <span>
                        {revealed   ? 'Revisa la corrección en cada grupo'
                        : picked    ? 'Ahora toca el grupo donde va'
                        : allPlaced ? 'Listo. Toca una tarjeta de un grupo para quitarla, o confirma'
                        :             'Arrastra cada tarjeta a su grupo, o tócala y luego toca el grupo'}
                    </span>
                    <span className="dd-count">{total - unplaced.length} de {total} colocadas</span>
                </div>
                <div className="dd-bank">
                    <AnimatePresence>
                        {unplaced.map(opt => (
                            <DragCard
                                key={opt.id}
                                option={opt}
                                disabled={disabled}
                                picked={picked === opt.id}
                                constraintsRef={containerRef}
                                onMove={event => setOverZone(zoneAt(event))}
                                onDrop={event => handleDragEnd(opt.id, event)}
                                onPick={() => setPicked(p => p === opt.id ? null : opt.id)}
                            />
                        ))}
                    </AnimatePresence>
                    {unplaced.length === 0 && (
                        <span className="dd-bank-empty"><LuCheck /> Todas las tarjetas están colocadas</span>
                    )}
                </div>
            </div>

            {/* Grupos */}
            <div className="dd-zones">
                {categories.map((cat, i) => {
                    const items = question.options.filter(o => placed[o.id] === cat)
                    const active = overZone === cat || (!!picked && !disabled)
                    return (
                        <div
                            key={cat}
                            ref={el => { zoneRefs.current[cat] = el }}
                            className={`dd-zone${overZone === cat ? ' dd-zone--over' : ''}${active ? ' dd-zone--ready' : ''}`}
                            style={{ '--z': ZONE_COLORS[i % ZONE_COLORS.length] } as React.CSSProperties}
                            onClick={() => placePicked(cat)}
                            role={picked ? 'button' : undefined}
                            aria-label={picked ? `Colocar en ${cat}` : undefined}
                        >
                            <div className="dd-zone-head">
                                <span className="dd-zone-title">{cat}</span>
                                <span className="dd-zone-count">{items.length}</span>
                            </div>
                            <div className="dd-zone-items">
                                <AnimatePresence>
                                    {items.map(o => {
                                        const res = cardResult(o)
                                        return (
                                            <motion.div
                                                key={o.id}
                                                className={`dd-placed${res ? ` dd-placed--${res}` : ''}`}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                // Con una tarjeta elegida, tocar dentro del grupo la coloca ahí; si no, quita esta
                                                onClick={e => { e.stopPropagation(); if (picked) placePicked(cat); else handleRemove(o.id) }}
                                                title={!disabled && !revealed && !picked ? 'Quitar del grupo' : undefined}
                                            >
                                                <div className="dd-placed-main">
                                                    <span>{o.optionText}</span>
                                                    {!disabled && !revealed && <span className="dd-remove"><LuX /></span>}
                                                    {res && <span className="dd-result-icon">{res === 'correct' ? <LuCheck /> : <LuX />}</span>}
                                                </div>
                                                {res === 'wrong' && o.matchCategory && (
                                                    <span className="dd-placed-fix"><LuCornerDownRight /> Va en: <b>{o.matchCategory}</b></span>
                                                )}
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                                {items.length === 0 && <span className="dd-zone-empty">Suelta aquí</span>}
                            </div>
                        </div>
                    )
                })}
            </div>

            {!revealed && (
                <button
                    className="btn btn-primary quiz-next-btn"
                    disabled={!allPlaced || disabled}
                    onClick={handleConfirm}
                >
                    {allPlaced ? 'Confirmar' : `Faltan ${unplaced.length} ${unplaced.length === 1 ? 'tarjeta' : 'tarjetas'}`}
                </button>
            )}
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
                        {isLast ? 'Ver resultado' : <>Siguiente <LuArrowRight className="ic" /></>}
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

// ── XP star burst (result screen) ─────────────────────────────────────────────
function XpStarBurst({ active }: { active: boolean }) {
    const [stars] = useState(() =>
        Array.from({ length: 11 }, (_, i) => ({
            id: i,
            x:    (Math.random() - 0.5) * 150,
            y:    -(90 + Math.random() * 190),
            size: 13 + Math.floor(Math.random() * 11),
            delay: 0.78 + i * 0.058 + Math.random() * 0.05,
            dur:  0.82 + Math.random() * 0.38,
        }))
    )
    if (!active) return null
    return (
        <div className="xp-burst-wrap" aria-hidden>
            {stars.map(s => (
                <motion.span
                    key={s.id}
                    className="xp-burst-star"
                    style={{ fontSize: s.size }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{ x: s.x, y: s.y, scale: [0, 1.5, 0.9, 0], opacity: [0, 1, 0.85, 0] }}
                    transition={{ duration: s.dur, delay: s.delay, ease: 'easeOut' }}
                ><FaStar /></motion.span>
            ))}
        </div>
    )
}

// ── Estrellas del reto (result screen) ────────────────────────────────────────
const RESULT_STARS_DELAY = 1.5   // después de que se llena el círculo
function ResultStars({ earned }: { earned: number }) {
    useEffect(() => {
        const timers = Array.from({ length: earned }, (_, k) =>
            setTimeout(() => playStar(k), (RESULT_STARS_DELAY + k * 0.4 + 0.2) * 1000))
        return () => timers.forEach(clearTimeout)
    }, [earned])

    const label = earned === 3 ? '¡Perfecto! Reto dominado' : earned === 2 ? '¡Bien! Llega al 90% para la tercera' : 'Repasa y vuelve por más estrellas'
    return (
        <div className="quiz-result-stars" aria-label={`Ganaste ${earned} de ${MAX_STARS} estrellas`}>
            <div className="qrs-row">
                {Array.from({ length: MAX_STARS }, (_, k) => (
                    <span key={k} className={`qrs-slot${k === 1 ? ' qrs-slot--mid' : ''}`}>
                        <span className="qrs-empty"><FaStar /></span>
                        {k < earned && (
                            <motion.span
                                className="qrs-full"
                                initial={{ scale: 0, rotate: -120, opacity: 0 }}
                                animate={{ scale: [0, 1.6, 1], rotate: [-120, 15, 0], opacity: 1 }}
                                transition={{ duration: 0.55, delay: RESULT_STARS_DELAY + k * 0.4, ease: 'easeOut' }}
                            ><FaStar /></motion.span>
                        )}
                    </span>
                ))}
            </div>
            <motion.p className="qrs-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: RESULT_STARS_DELAY + earned * 0.4 + 0.2 }}>
                {label}
            </motion.p>
        </div>
    )
}

// ── Result screen ──────────────────────────────────────────────────────────────
function ResultScreen({ result, isFinal, showStars, onBack, onNext, onRetry }: {
    result: QuizCompleteResult | null
    isFinal: boolean
    showStars: boolean
    onBack: () => void
    onNext: () => void
    onRetry: () => void
}) {
    const pct    = result ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0
    const passed = result?.passed ?? (pct >= 60)
    const totalXp = result?.totalExperience ?? 0

    const fireConfetti = useCallback(() => {
        const burst = (origin: { x: number; y: number }, angle: number) =>
            confetti({ particleCount: 80, spread: 60, angle, origin, colors: ['#2db84f', '#52d472', '#fbbf24', '#34d399', '#ffffff'], shapes: ['star', 'circle'], scalar: 1.1 })
        burst({ x: 0, y: 0.7 }, 60)
        burst({ x: 1, y: 0.7 }, 120)
        setTimeout(() => { burst({ x: 0.1, y: 0.5 }, 70); burst({ x: 0.9, y: 0.5 }, 110) }, 350)
    }, [])

    useEffect(() => {
        if (passed) { const t = setTimeout(fireConfetti, 500); return () => clearTimeout(t) }
    }, [passed, fireConfetti])

    const cor = result?.correctAnswers ?? 0
    const inc = result?.incorrectAnswers ?? 0
    const tot = result?.totalQuestions ?? 1

    const title = isFinal && passed
        ? '¡Felicidades! Módulo completado'
        : passed
            ? '¡Lección completada!'
            : '¡Buen intento!'

    const subtitle = isFinal && passed
        ? 'Aprobaste la evaluación final'
        : passed
            ? 'Aquí está tu resultado'
            : 'Sigue practicando para pasar'

    return (
        <div className="quiz-result-page">
            <Logo className="quiz-result-logo" />

            <motion.img
                src={passed ? robotFeliz : robotIncorrecto}
                alt={passed ? 'robot feliz' : 'robot triste'}
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
                <h1 className="quiz-result-title">{title}</h1>
                <p className="quiz-result-sub">{subtitle}</p>

                {/* Score circle */}
                <div className="quiz-result-circle">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="none" style={{ stroke: 'var(--color-track)' }} strokeWidth="10"/>
                        <motion.circle
                            cx="50" cy="50" r="44" fill="none"
                            stroke={passed ? '#2db84f' : '#f59e0b'}
                            strokeWidth="10" strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            initial={{ strokeDasharray: '0 276' }}
                            animate={{ strokeDasharray: `${pct * 2.76} 276` }}
                            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
                        />
                    </svg>
                    <span className="quiz-result-pct" style={{ color: passed ? '#2db84f' : '#f59e0b' }}>{pct}%</span>
                </div>

                {showStars && result && result.totalQuestions > 0 && <ResultStars earned={starsForScore(pct)} />}

                {/* Barras correctas / incorrectas */}
                <motion.div className="quiz-result-bars" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
                    <div className="qrb-row">
                        <span className="qrb-label qrb-label--ok">Correctas</span>
                        <div className="qrb-track">
                            <motion.div className="qrb-fill qrb-fill--ok"
                                initial={{ width: 0 }}
                                animate={{ width: `${(cor / tot) * 100}%` }}
                                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.55 }}
                            />
                        </div>
                        <span className="qrb-count qrb-count--ok"><CountUp to={cor} delay={0.55} /></span>
                    </div>
                    <div className="qrb-row">
                        <span className="qrb-label qrb-label--bad">Incorrectas</span>
                        <div className="qrb-track">
                            <motion.div className="qrb-fill qrb-fill--bad"
                                initial={{ width: 0 }}
                                animate={{ width: `${(inc / tot) * 100}%` }}
                                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.65 }}
                            />
                        </div>
                        <span className="qrb-count qrb-count--bad"><CountUp to={inc} delay={0.65} /></span>
                    </div>
                </motion.div>

                {/* XP */}
                <motion.div
                    className="quiz-xp-block"
                    style={{ position: 'relative', overflow: 'visible' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, type: 'spring', stiffness: 260, damping: 20 }}
                >
                    <div className="quiz-xp-total">
                        <img src={progresoA} alt="xp" className="quiz-xp-icon" />
                        <span className="quiz-xp-total-num">+<CountUp to={totalXp} duration={1.4} delay={0.8} /></span>
                        <span className="quiz-xp-total-lbl">XP ganada</span>
                    </div>
                    <XpStarBurst active={totalXp > 0} />
                </motion.div>

                {/* Botones */}
                <div className="quiz-result-actions">
                    {passed ? (
                        <button className="btn btn-primary quiz-result-btn" onClick={isFinal ? onBack : onNext}>
                            {isFinal ? 'Continuar' : <>Siguiente nivel <LuArrowRight className="ic" /></>}
                        </button>
                    ) : (
                        <button className="btn btn-primary quiz-result-btn quiz-result-btn--retry" onClick={onRetry}>
                            Reintentar
                        </button>
                    )}
                    <button className="btn quiz-result-btn quiz-result-btn--back" onClick={onBack}>
                        Volver a la ruta
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Quiz() {
    const { lessonId } = useParams<{ lessonId: string }>()
    const navigate     = useNavigate()
    const location     = useLocation()
    const { lessonType, topicId } = (location.state ?? {}) as { lessonType?: string; topicId?: string }
    const isFinal = lessonType === 'FINAL'
    // Solo los retos (QUIZ) dan estrellas
    const isQuizLesson = lessonType === 'QUIZ'

    const [questions,  setQuestions]  = useState<QuizQuestion[]>([])
    const [current,    setCurrent]    = useState(0)
    const [feedback,   setFeedback]   = useState<FeedbackState>(null)
    const [loading,    setLoading]    = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [result,     setResult]     = useState<QuizCompleteResult | null>(null)
    const [screen,     setScreen]     = useState<'quiz' | 'result'>('quiz')
    const [correct,       setCorrect]       = useState(0)
    // Aciertos seguidos: se muestra a partir de 2
    const [streak,        setStreak]        = useState(0)
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
        if (isCorrect) { setCorrect(c => c + 1); setStreak(s => s + 1); playCorrect() } else { setStreak(0); playWrong() }
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
                const questionIds = questions.map(question => question.id)
                const res = await completeLesson(
                    lessonId!,
                    questionIds,
                    timeSpentSec
                )

                // El backend ya calcula el resultado únicamente sobre las preguntas
                // presentadas en esta ejecución y agrupa cada DRAG_AND_DROP como
                // una sola pregunta para score/correctas/incorrectas.
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

    const handleRetry = () => {
        setScreen('quiz')
        setCurrent(0)
        setFeedback(null)
        setCorrect(0)
        setStreak(0)
        setResult(null)
        setQuestions([])
        setLoading(true)
        // re-fetch questions
        if (!lessonId) return
        if (isFinal) {
            if (!topicId) { setLoading(false); return }
            getDynamicFinalQuestions(topicId)
                .then(r => { setQuestions(r.data); startTime.current = Date.now(); questionStartAt.current = Date.now() })
                .catch(() => {})
                .finally(() => setLoading(false))
            return
        }
        const req = lessonType === 'QUIZ' ? getAdaptiveQuizQuestions(lessonId) : getLessonQuestions(lessonId)
        startLesson(lessonId)
            .then(() => req)
            .then(r => { setQuestions(r.data); startTime.current = Date.now(); questionStartAt.current = Date.now() })
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const handleBack = () => {
        const xp = result?.totalExperience ?? 0
        if (xp > 0) sessionStorage.setItem('pendingXp', String(xp))
        if (isQuizLesson && lessonId) sessionStorage.setItem(PENDING_STARS_KEY, lessonId)
        navigate(-1)
    }

    const handleNextLevel = () => {
        if (lessonId) sessionStorage.setItem(PENDING_NEXT_KEY, lessonId)
        handleBack()
    }

    if (screen === 'result') return <ResultScreen result={result} isFinal={isFinal} showStars={isQuizLesson} onBack={handleBack} onNext={handleNextLevel} onRetry={handleRetry} />

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
                <header className="quiz-top-bar">
                    <button className="quiz-back-btn" onClick={() => navigate(-1)} aria-label="Salir de la lección">
                        <LuArrowLeft /><span>Salir</span>
                    </button>
                    <div className="quiz-progress-wrap">
                        <div className="quiz-progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Avance de la lección">
                            <motion.div className="quiz-progress-fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
                        </div>
                        <div className="quiz-progress-meta">
                            <span className="quiz-progress-label">Pregunta {Math.min(current + 1, questions.length)} de {questions.length}</span>
                            <AnimatePresence>
                                {streak >= 2 && (
                                    <motion.span
                                        key={streak}
                                        className="quiz-streak"
                                        initial={{ scale: 0.6, opacity: 0 }}
                                        animate={{ scale: [0.6, 1.15, 1], opacity: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.35 }}
                                        aria-label={`${streak} respuestas correctas seguidas`}
                                    >
                                        <LuFlame /> {streak} seguidas
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <Logo className="quiz-logo" />
                </header>

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
