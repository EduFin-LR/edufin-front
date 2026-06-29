import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBook, FaBrain, FaPlay, FaLock, FaClipboardList, FaCheck, FaArrowLeft, FaTimes, FaChevronDown } from 'react-icons/fa'
import edufinLogo from '../../assets/images/edufinLogo.png'
import progresoA  from '../../assets/images/ProgresoA.png'
import { getTopicLessons } from '../../services/learningService'
import type { TopicLessons, Lesson } from '../../services/learningService'
import { useAuth } from '../../context/AuthContext'
import './Learning.css'

const avatarBoy = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href

// ── Colors por tipo ────────────────────────────────────────────────────────────
const NODE_COLORS = {
    QUIZ:    { bg:'#3b82f6', border:'#1d4ed8', glow:'rgba(59,130,246,0.45)', icon:'#fff' },
    VIDEO:   { bg:'#ec4899', border:'#be185d', glow:'rgba(236,72,153,0.45)', icon:'#fff' },
    READING: { bg:'#2db84f', border:'#1a8c3c', glow:'rgba(45,184,79,0.45)',  icon:'#fff' },
    LOCKED:  { bg:'#d1d5db', border:'#9ca3af', glow:'rgba(156,163,175,0.2)', icon:'#9ca3af' },
}

function NodeIcon({ type, locked }: { type: Lesson['lessonType']; locked: boolean }) {
    if (locked) return <FaLock />
    if (type === 'QUIZ')    return <FaClipboardList />
    if (type === 'VIDEO')   return <FaPlay />
    return <FaBook />
}

// ── Generar posiciones en zigzag ───────────────────────────────────────────────
function buildPositions(count: number) {
    const positions: { x: number; y: number }[] = []
    const startX = 100
    const stepX  = count > 1 ? Math.min(160, 820 / (count - 1)) : 0
    const yHigh  = 170
    const yLow   = 370

    for (let i = 0; i < count; i++) {
        positions.push({ x: startX + i * stepX, y: i % 2 === 0 ? yLow : yHigh })
    }
    return positions
}

// ── Generar SVG path entre nodos ───────────────────────────────────────────────
function buildPath(positions: { x: number; y: number }[], from: number, to: number) {
    if (from >= to || positions.length === 0) return ''
    let d = `M${positions[from].x},${positions[from].y}`
    for (let i = from + 1; i <= to && i < positions.length; i++) {
        const { x: x1, y: y1 } = positions[i - 1]
        const { x: x2, y: y2 } = positions[i]
        const mx = (x1 + x2) / 2
        d += ` C${mx},${y1} ${mx},${y2} ${x2},${y2}`
    }
    return d
}

// ── Node component ─────────────────────────────────────────────────────────────
function MapNode({ lesson, pos, isCurrent, onClick }: {
    lesson: Lesson
    pos: { x: number; y: number }
    isCurrent: boolean
    onClick: (l: Lesson) => void
}) {
    const isLocked    = lesson.status === 'LOCKED'
    const isCompleted = lesson.status === 'COMPLETED'
    const colors      = isLocked ? NODE_COLORS.LOCKED : NODE_COLORS[lesson.lessonType] ?? NODE_COLORS.READING

    const nodeStyle = isLocked
        ? { background: '#d1d5db', border: '3px dashed #9ca3af', boxShadow: 'none' }
        : {
            background: colors.bg,
            border: `3px solid ${colors.border}`,
            boxShadow: `0 6px 20px ${colors.glow}, 0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)`,
          }

    return (
        <div
            className="map-node-wrap"
            style={{ left: pos.x - 34, top: pos.y - 34 }}
            onClick={() => onClick(lesson)}
        >
            {isCurrent && (
                <motion.div
                    className="node-arrow"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                >
                    <FaChevronDown />
                </motion.div>
            )}

            {isCurrent && (
                <div className="node-pulse-ring" style={{ background: colors.bg }} />
            )}

            <motion.div
                className={`map-node ${isCurrent ? 'map-node--current' : ''}`}
                style={{ ...nodeStyle, color: colors.icon }}
                whileHover={{ scale: isLocked ? 1 : 1.12, y: isLocked ? 0 : -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
                <NodeIcon type={lesson.lessonType} locked={isLocked} />
            </motion.div>

            {isCompleted && (
                <div className="node-check"><FaCheck /></div>
            )}

            <span className="node-num" style={{ color: isLocked ? '#9ca3af' : '#374151' }}>
                {lesson.lessonOrder}
            </span>
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Learning() {
    const navigate      = useNavigate()
    const { topicId }   = useParams<{ topicId: string }>()
    const { profile }   = useAuth()

    const [topic,    setTopic]    = useState<TopicLessons | null>(null)
    const [selected, setSelected] = useState<Lesson | null>(null)
    const [hint,     setHint]     = useState(true)
    const [scale,    setScale]    = useState(1)
    const viewportRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!topicId) return
        getTopicLessons(topicId).then(r => setTopic(r.data)).catch(() => {})
    }, [topicId])

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault()
        setScale(s => Math.min(1.6, Math.max(0.5, s - e.deltaY * 0.001)))
    }, [])

    const lessons   = topic?.lessons ?? []
    const positions = buildPositions(lessons.length)

    // índice del primer UNLOCKED (nodo actual)
    const currentIdx = lessons.findIndex(l => l.status === 'UNLOCKED')

    // índice del último nodo desbloqueado (COMPLETED o primer UNLOCKED)
    const lastUnlockedIdx = Math.max(
        lessons.findLastIndex(l => l.status === 'COMPLETED'),
        currentIdx,
    )

    const canvasWidth  = positions.length > 0 ? positions[positions.length - 1].x + 120 : 600
    const canvasHeight = 530

    const unlockedPath = buildPath(positions, 0, lastUnlockedIdx)
    const lockedPath   = lastUnlockedIdx >= 0 && lastUnlockedIdx < lessons.length - 1
        ? buildPath(positions, lastUnlockedIdx, lessons.length - 1)
        : ''

    // stats del header
    const completed    = lessons.filter(l => l.status === 'COMPLETED').length
    const progressPct  = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0
    const level        = profile?.currentLevel ?? 1
    const xp           = profile?.totalPoints  ?? 0

    return (
        <div className="learning-page">

            {/* ── Header ── */}
            <header className="learning-header">
                <button className="learning-back" onClick={() => navigate('/dashboard')}>
                    <FaArrowLeft /> Volver
                </button>

                <div className="learning-course-info">
                    <img src={avatarBoy} alt="avatar" className="learning-avatar" />
                    <div>
                        <p className="learning-course-name">{topic?.topicName ?? '…'}</p>
                        <div className="learning-progress-row">
                            <div className="learning-progress-bar">
                                <div className="learning-progress-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className="learning-progress-pct">{progressPct}%</span>
                        </div>
                    </div>
                </div>

                <div className="learning-xp">
                    <div className="learning-level-wrap">
                        <img src={progresoA} alt="nivel" className="learning-level-img" />
                        <span className="learning-level-num">{level}</span>
                    </div>
                    <span className="learning-xp-val">{xp} exp</span>
                </div>

                <img src={edufinLogo} alt="Edufin" className="dash-logo" />
            </header>

            {/* ── Map viewport ── */}
            <div ref={viewportRef} className="map-viewport" onWheel={handleWheel}>
                <motion.div
                    className="map-canvas"
                    drag
                    dragMomentum={false}
                    dragConstraints={{ left: -Math.max(0, canvasWidth - 600), right: 100, top: -200, bottom: 100 }}
                    style={{ scale, width: canvasWidth, height: canvasHeight }}
                    onDragStart={() => setHint(false)}
                    whileDrag={{ cursor: 'grabbing' }}
                >
                    {/* Module banner */}
                    <div className="map-module-banner">
                        <span className="map-module-chip">{topic?.category ?? 'Módulo'}</span>
                        <span className="map-module-title">{topic?.topicName ?? '…'}</span>
                    </div>

                    {/* SVG paths */}
                    <svg
                        className="map-svg"
                        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                        style={{ width: canvasWidth, height: canvasHeight }}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Unlocked path */}
                        {unlockedPath && <>
                            <path d={unlockedPath} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="12" strokeLinecap="round"/>
                            <path d={unlockedPath} fill="none" stroke="#fff"              strokeWidth="10" strokeLinecap="round"/>
                            <path d={unlockedPath} fill="none" stroke="#2db84f"           strokeWidth="6"  strokeLinecap="round"/>
                        </>}

                        {/* Locked path */}
                        {lockedPath && <>
                            <path d={lockedPath} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8"  strokeLinecap="round"/>
                            <path d={lockedPath} fill="none" stroke="#c4b5fd"           strokeWidth="5"  strokeDasharray="8 6" strokeLinecap="round"/>
                        </>}
                    </svg>

                    {/* Nodes */}
                    {lessons.map((lesson, i) => (
                        <MapNode
                            key={lesson.id}
                            lesson={lesson}
                            pos={positions[i]}
                            isCurrent={i === currentIdx}
                            onClick={setSelected}
                        />
                    ))}
                </motion.div>

                <AnimatePresence>
                    {hint && (
                        <motion.div className="map-hint" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            ☝️ Arrastra para explorar · 🖱️ Scroll para zoom
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Lesson modal ── */}
            <AnimatePresence>
                {selected && (
                    <motion.div className="lesson-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelected(null)}>
                        <motion.div
                            className="lesson-modal"
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 80, opacity: 0 }}
                            transition={{ type:'spring', stiffness:300, damping:28 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="lesson-modal-close" onClick={() => setSelected(null)}><FaTimes /></button>
                            <div className="lesson-modal-icon" style={{
                                background: (NODE_COLORS[selected.lessonType] ?? NODE_COLORS.READING).bg,
                                boxShadow:  `0 8px 24px ${(NODE_COLORS[selected.lessonType] ?? NODE_COLORS.READING).glow}`,
                            }}>
                                <NodeIcon type={selected.lessonType} locked={selected.status === 'LOCKED'} />
                            </div>
                            <div className="lesson-modal-body">
                                <h3 className="lesson-modal-title">{selected.title}</h3>
                                <p className="lesson-modal-desc">{selected.content}</p>
                                {selected.status === 'COMPLETED' && <span className="lesson-modal-badge">✅ Completada</span>}
                            </div>
                            <button
                                className={`btn ${selected.status === 'LOCKED' ? '' : 'btn-primary'} lesson-modal-btn`}
                                disabled={selected.status === 'LOCKED'}
                                style={selected.status === 'LOCKED' ? { background:'#9ca3af', color:'#fff', cursor:'not-allowed' } : {}}
                                onClick={() => selected.status !== 'LOCKED' && navigate(`/quiz/${selected.id}`)}
                            >
                                {selected.status === 'LOCKED'     ? '🔒 Bloqueada'
                                : selected.status === 'COMPLETED' ? 'Repasar lección'
                                :                                   'Iniciar lección'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
