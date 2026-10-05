import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import edufinLogo from '../../assets/images/edufinLogo.png'
import './SplashScreen.css'

// Animación de entrada: el robot aparece, se escribe EDUFIN letra por letra y
// una línea de metro se dibuja como barra de carga, encendiendo sus estaciones.
const DURATION_MS = 2600
const LETTERS = [
    { ch: 'E', fin: false }, { ch: 'D', fin: false }, { ch: 'U', fin: false },
    { ch: 'F', fin: true },  { ch: 'I', fin: true },  { ch: 'N', fin: true },
]
const STATIONS = [20, 100, 180, 260]           // x de cada estación en la línea (ancho 280)
const LINE_START = 0.75, LINE_DURATION = 1.3   // segundos

export default function SplashScreen({ children }: { children: ReactNode }) {
    const [visible, setVisible] = useState(true)
    const reduce = useReducedMotion()

    useEffect(() => {
        const t = setTimeout(() => setVisible(false), reduce ? 900 : DURATION_MS)
        return () => clearTimeout(t)
    }, [reduce])

    return (
        <>
            <AnimatePresence>
                {visible && (
                    <motion.div
                        className="splash"
                        role="status"
                        aria-label="Cargando Edufin"
                        exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                        <div className="splash-grid" aria-hidden="true" />

                        <div className="splash-brand" aria-hidden="true">
                            {/* Robot con halo */}
                            <motion.div
                                className="splash-robot"
                                initial={reduce ? false : { opacity: 0, y: 24, scale: 0.7 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.05 }}
                            >
                                <span className="splash-halo" />
                                <svg viewBox="12 6 288 406" className="splash-robot-img">
                                    <image href={edufinLogo} width="1175" height="417" />
                                </svg>
                            </motion.div>

                            {/* EDUFIN letra por letra */}
                            <div className="splash-word">
                                {LETTERS.map((l, i) => (
                                    <motion.span
                                        key={i}
                                        className={l.fin ? 'fin' : 'edu'}
                                        initial={reduce ? false : { opacity: 0, y: 28, rotateX: -70 }}
                                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                        transition={{ duration: 0.45, delay: 0.3 + i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
                                    >
                                        {l.ch}
                                    </motion.span>
                                ))}
                            </div>
                        </div>

                        {/* Línea de metro como barra de carga */}
                        <svg className="splash-line" viewBox="0 0 280 24" aria-hidden="true">
                            <line x1="20" y1="12" x2="260" y2="12" className="splash-line-track" />
                            <motion.line
                                x1="20" y1="12" x2="260" y2="12"
                                className="splash-line-fill"
                                initial={reduce ? false : { pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: LINE_DURATION, delay: LINE_START, ease: 'easeInOut' }}
                            />
                            {STATIONS.map(x => (
                                <motion.circle
                                    key={x}
                                    cx={x} cy="12" r="6"
                                    className="splash-stn"
                                    initial={reduce ? false : { fill: '#15291F', stroke: '#36503F', scale: 1 }}
                                    animate={{ fill: '#3FBF62', stroke: '#8BE3A4', scale: [1, 1.35, 1] }}
                                    transition={{ duration: 0.35, delay: LINE_START + (LINE_DURATION * (x - 20)) / 240 }}
                                />
                            ))}
                        </svg>

                        <motion.p
                            className="splash-tagline"
                            initial={reduce ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                        >
                            Aprende finanzas, una parada a la vez
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
            {!visible && children}
        </>
    )
}
