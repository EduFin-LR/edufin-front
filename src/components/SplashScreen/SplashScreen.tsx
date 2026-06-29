import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import edufinLogo from '../../assets/images/edufinLogo.png'
import './SplashScreen.css'

export default function SplashScreen({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 2200)
        return () => clearTimeout(t)
    }, [])

    return (
        <>
            <AnimatePresence>
                {visible && (
                    <motion.div
                        className="splash"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                        <motion.img
                            src={edufinLogo}
                            alt="Edufin"
                            className="splash-logo"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: 'backOut' }}
                        />
                        <motion.div
                            className="splash-dots"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.4 }}
                        >
                            {[0, 1, 2].map(i => (
                                <motion.span
                                    key={i}
                                    className="splash-dot"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15, ease: 'easeInOut' }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {!visible && children}
        </>
    )
}
