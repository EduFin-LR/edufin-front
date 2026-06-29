import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from 'react-icons/fa'
import './Toast.css'

export type ToastType = 'success' | 'warning' | 'error'

interface ToastProps {
    message:  string
    type:     ToastType
    onClose:  () => void
    duration?: number   // ms, default 4000
}

const CONFIG = {
    success: { icon: <FaCheckCircle />,        label: 'Éxito'      },
    warning: { icon: <FaExclamationTriangle />, label: 'Atención'   },
    error:   { icon: <FaTimesCircle />,         label: 'Error'      },
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
    useEffect(() => {
        const t = setTimeout(onClose, duration)
        return () => clearTimeout(t)
    }, [message, type, onClose, duration])

    const cfg = CONFIG[type]

    return (
        <motion.div
            className={`toast toast--${type}`}
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -16,  scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
            <span className="toast-icon">{cfg.icon}</span>
            <div className="toast-body">
                <span className="toast-label">{cfg.label}</span>
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={onClose} aria-label="Cerrar">
                <FaTimes />
            </button>
            <motion.div
                className="toast-progress"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
            />
        </motion.div>
    )
}

// ── Container: place once at app root or per-page ─────────────────────────────
interface ToastContainerProps {
    toast:    { message: string; type: ToastType } | null
    onClose:  () => void
}

export function ToastContainer({ toast, onClose }: ToastContainerProps) {
    return (
        <div className="toast-container">
            <AnimatePresence>
                {toast && (
                    <Toast
                        key={toast.message + toast.type}
                        message={toast.message}
                        type={toast.type}
                        onClose={onClose}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
