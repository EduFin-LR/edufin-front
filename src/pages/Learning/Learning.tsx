import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBook, FaPlay, FaLock, FaClipboardList, FaCheck, FaArrowLeft, FaTimes, FaTrophy } from 'react-icons/fa'
import robotFeliz from '../../assets/images/robotFeliz.png'
import edufinLogo from '../../assets/images/edufinLogo.png'
import progresoA  from '../../assets/images/ProgresoA.png'
import { getTopicLessons } from '../../services/learningService'
import type { TopicLessons, Lesson } from '../../services/learningService'
import { useAuth } from '../../context/AuthContext'
import { playHover } from '../../utils/sounds'
import './Learning.css'

const avatarBoy = new URL('../../assets/images/perfilNiño (1).png', import.meta.url).href

// ── Colors por tipo ────────────────────────────────────────────────────────────
const NODE_COLORS = {
    QUIZ:    { bg:'#3b82f6', border:'#1d4ed8', glow:'rgba(59,130,246,0.45)', icon:'#fff' },
    VIDEO:   { bg:'#ec4899', border:'#be185d', glow:'rgba(236,72,153,0.45)', icon:'#fff' },
    READING: { bg:'#2db84f', border:'#1a8c3c', glow:'rgba(45,184,79,0.45)',  icon:'#fff' },
    FINAL:   { bg:'#f59e0b', border:'#b45309', glow:'rgba(245,158,11,0.55)', icon:'#fff' },
    LOCKED:  { bg:'#d1d5db', border:'#9ca3af', glow:'rgba(156,163,175,0.2)', icon:'#9ca3af' },
}

function NodeIcon({ type, locked }: { type: Lesson['lessonType']; locked: boolean }) {
    if (locked) return <FaLock />
    if (type === 'QUIZ')    return <FaClipboardList />
    if (type === 'VIDEO')   return <FaPlay />
    if (type === 'FINAL')   return <FaTrophy />
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
    const isFinal     = lesson.lessonType === 'FINAL'
    const colors      = isLocked ? NODE_COLORS.LOCKED : NODE_COLORS[lesson.lessonType] ?? NODE_COLORS.READING
    const nodeSize    = isFinal ? 50 : 34

    const nodeStyle = isLocked
        ? { background: '#d1d5db', border: '3px dashed #9ca3af', boxShadow: 'none' }
        : {
            background: isFinal
                ? `radial-gradient(circle at 35% 35%, #fde68a, ${colors.bg} 70%)`
                : colors.bg,
            border: `${isFinal ? 4 : 3}px solid ${colors.border}`,
            boxShadow: `0 6px 20px ${colors.glow}, 0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)`,
          }

    return (
        <div
            className={`map-node-wrap ${isFinal ? 'map-node-wrap--final' : ''}`}
            style={{ left: pos.x - nodeSize, top: pos.y - nodeSize }}
            onClick={() => onClick(lesson)}
        >
            {/* Robot mascot on current node */}
            {isCurrent && (
                <motion.img
                    src={robotFeliz}
                    alt="robot"
                    className="node-robot"
                    animate={{ y: [0, -7, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                />
            )}

            {isCurrent && (
                <div className="node-pulse-ring" style={{ background: colors.bg }} />
            )}

            <motion.div
                className={`map-node ${isCurrent ? 'map-node--current' : ''} ${isFinal ? 'map-node--final' : ''} ${isLocked ? 'map-node--locked' : ''}`}
                style={{ ...nodeStyle, color: colors.icon }}
                onHoverStart={() => { if (!isLocked) playHover() }}
                whileHover={{ scale: isLocked ? 1 : 1.12, y: isLocked ? 0 : -3 }}
                animate={isFinal && !isLocked ? { boxShadow: [
                    `0 6px 20px ${colors.glow}`,
                    `0 6px 40px rgba(245,158,11,0.8)`,
                    `0 6px 20px ${colors.glow}`,
                ]} : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 20, ...(isFinal && !isLocked ? { boxShadow: { repeat: Infinity, duration: 2, ease: 'easeInOut' } } : {}) }}
            >
                <NodeIcon type={lesson.lessonType} locked={isLocked} />
            </motion.div>

            {isFinal && !isLocked && (
                <>
                    <div className="node-final-label">🏆 Final</div>
                    <div className="node-final-ring1" />
                    <div className="node-final-ring2" />
                </>
            )}

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
                    dragConstraints={{
                        left:   -Math.max(0, canvasWidth  - (viewportRef.current?.clientWidth  ?? 600) + 80),
                        right:  Math.min(300, (viewportRef.current?.clientWidth  ?? 600) * 0.4),
                        top:    -Math.max(0, canvasHeight - (viewportRef.current?.clientHeight ?? 530) + 80),
                        bottom: Math.min(200, (viewportRef.current?.clientHeight ?? 530) * 0.3),
                    }}
                    style={{ scale, width: canvasWidth, height: canvasHeight }}
                    onDragStart={() => setHint(false)}
                    whileDrag={{ cursor: 'grabbing' }}
                >
                    {/* Module banner */}
                    <div className="map-module-banner">
                        <span className="map-module-chip">{topic?.category ?? 'Módulo'}</span>
                        <span className="map-module-title">{topic?.topicName ?? '…'}</span>
                    </div>

                    {/* Sky decorations */}
                    <span className="sky-deco" style={{ top: '8%',  left: '12%' }}>🪙</span>
                    <span className="sky-deco" style={{ top: '14%', left: '55%' }}>⭐</span>
                    <span className="sky-deco" style={{ top: '6%',  left: '80%' }}>🪙</span>
                    <span className="sky-deco" style={{ top: '60%', left: '30%' }}>✨</span>
                    <span className="sky-deco" style={{ top: '70%', left: '72%' }}>⭐</span>

                    {/* SVG paths — game-map dotted style */}
                    <svg
                        className="map-svg"
                        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Full path (locked — white semi-transparent dashes) */}
                        {positions.length > 1 && (() => {
                            const fullPath = buildPath(positions, 0, positions.length - 1)
                            return <>
                                <path d={fullPath} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="10" strokeLinecap="round"/>
                                <path d={fullPath} fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="6"  strokeLinecap="round" strokeDasharray="12 14"/>
                            </>
                        })()}

                        {/* Unlocked portion (green bright dashes) */}
                        {unlockedPath && <>
                            <path d={unlockedPath} fill="none" stroke="rgba(34,197,94,0.35)" strokeWidth="10" strokeLinecap="round"/>
                            <path d={unlockedPath} fill="none" stroke="#4ade80"              strokeWidth="6"  strokeLinecap="round" strokeDasharray="12 14"/>
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
                {selected && (() => {
                    const isVideo  = selected.lessonType === 'VIDEO' && !!selected.videoUrl
                    const colors   = NODE_COLORS[selected.lessonType] ?? NODE_COLORS.READING
                    const isLocked = selected.status === 'LOCKED'
                    return (
                        <motion.div
                            className="lesson-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelected(null)}
                        >
                            <motion.div
                                className={`lesson-modal ${isVideo ? 'lesson-modal--video' : ''}`}
                                initial={{ y: 80, opacity: 0, scale: 0.96 }}
                                animate={{ y: 0,  opacity: 1, scale: 1    }}
                                exit={{ y: 80, opacity: 0, scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <button className="lesson-modal-close" onClick={() => setSelected(null)}><FaTimes /></button>

                                {/* Video embed */}
                                {isVideo && (
                                    <motion.div
                                        className="lesson-video-wrap"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.18, duration: 0.4 }}
                                    >
                                        <iframe
                                            className="lesson-video-iframe"
                                            src={selected.videoUrl}
                                            title={selected.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </motion.div>
                                )}

                                {/* Icon (only for non-video) */}
                                {!isVideo && (
                                    <div className="lesson-modal-icon" style={{
                                        background: colors.bg,
                                        boxShadow:  `0 8px 24px ${colors.glow}`,
                                    }}>
                                        <NodeIcon type={selected.lessonType} locked={isLocked} />
                                    </div>
                                )}

                                {/* Video type badge */}
                                {isVideo && (
                                    <div className="lesson-video-badge">
                                        <span className="lesson-video-dot" />
                                        Video
                                    </div>
                                )}

                                <div className="lesson-modal-body">
                                    <h3 className="lesson-modal-title">{selected.title}</h3>
                                    <p className="lesson-modal-desc">{selected.content}</p>
                                    {selected.status === 'COMPLETED' && <span className="lesson-modal-badge-done">✅ Completada</span>}
                                </div>

                                <button
                                    className={`btn ${isLocked ? '' : 'btn-primary'} lesson-modal-btn`}
                                    disabled={isLocked}
                                    style={isLocked ? { background: '#9ca3af', color: '#fff', cursor: 'not-allowed' } : {}}
                                    onClick={() =>
                                        !isLocked &&
                                        navigate(
                                            `/quiz/${selected.id}?type=${selected.lessonType}`
                                        )
                                    }
                                >
                                    {isLocked                        ? '🔒 Bloqueada'
                                    : selected.status === 'COMPLETED' ? (isVideo ? '▶ Ver otra vez' : 'Repasar lección')
                                    :                                   (isVideo ? '▶ Ver video'     : 'Iniciar lección')}
                                </button>
                            </motion.div>
                        </motion.div>
                    )
                })()}
            </AnimatePresence>
        </div>
    )
}
