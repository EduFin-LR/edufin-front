import { motion, AnimatePresence } from 'framer-motion'
import edufinLogo from '../../assets/images/edufinLogo.png'
import './LoadingScreen.css'

interface Props {
    visible:   boolean
    message?:  string
}

export default function LoadingScreen({ visible, message = 'Cargando…' }: Props) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="ls-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                >
                    <motion.div
                        className="ls-card"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                    >
                        {/* Logo */}
                        <img src={edufinLogo} alt="Edufin" className="ls-logo" />

                        {/* Bouncing dots */}
                        <div className="ls-dots">
                            {[0, 1, 2].map(i => (
                                <motion.span
                                    key={i}
                                    className="ls-dot"
                                    animate={{ y: [0, -14, 0] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.7,
                                        delay: i * 0.15,
                                        ease: 'easeInOut',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Message */}
                        <p className="ls-message">{message}</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
