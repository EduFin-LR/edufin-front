import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo/Logo'
import AuthHero from './AuthHero'
import './AuthLayout.css'

export default function AuthLayout({ children }: { children: ReactNode }) {
    const navigate = useNavigate()

    return (
        <div className="auth-wrapper">
            <section className="auth-left">
                <div className="auth-form-wrapper">
                    <Logo height={72} className="auth-logo" onClick={() => navigate('/')} />
                    {children}
                </div>
            </section>

            <aside className="auth-right">
                <AuthHero />
            </aside>
        </div>
    )
}
