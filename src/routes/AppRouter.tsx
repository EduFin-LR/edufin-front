import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import Login          from '../pages/Login/Login'
import Register       from '../pages/Register/Register'
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword'
import EmailSent      from '../pages/EmailSent/EmailSent'
import Dashboard      from '../pages/Dashboard/Dashboard'
import Learning       from '../pages/Learning/Learning'
import Quiz           from '../pages/Quiz/Quiz'
import Profile        from '../pages/Profile/Profile'
import Ranking        from '../pages/Ranking/Ranking'
import Logros         from '../pages/Logros/Logros'
import Diagnostic     from '../pages/Diagnostic/Diagnostic'

// Redirect to /dashboard (or /diagnostic if test pending) if already logged in
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { token, profile, ready } = useAuth()
    if (!ready) return null
    if (!token) return <>{children}</>
    return profile?.diagnostic_test === false
        ? <Navigate to="/diagnostic" replace />
        : <Navigate to="/dashboard" replace />
}

// /diagnostic: solo si está logueado Y aún no completó el test
function DiagnosticRoute() {
    const { token, profile, ready } = useAuth()
    if (!ready) return null
    if (!token) return <Navigate to="/" replace />
    if (profile?.diagnostic_test !== false) return <Navigate to="/dashboard" replace />
    return <Diagnostic />
}

// Require token; if logged in but test pending, redirect to /diagnostic
function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { token, profile, ready } = useAuth()
    if (!ready) return null
    if (!token) return <Navigate to="/" replace />
    if (profile?.diagnostic_test === false) return <Navigate to="/diagnostic" replace />
    return <>{children}</>
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth */}
                <Route path="/" element={
                    <PublicRoute><Login /></PublicRoute>
                } />
                <Route path="/register" element={
                    <PublicRoute><Register /></PublicRoute>
                } />
                <Route path="/forgot-password" element={
                    <PublicRoute><ForgotPassword /></PublicRoute>
                } />
                <Route path="/email-sent" element={
                    <PublicRoute><EmailSent /></PublicRoute>
                } />

                {/* Diagnostic — private but no test-pending guard */}
                <Route path="/diagnostic" element={<DiagnosticRoute />} />

                {/* App */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/logros"    element={<PrivateRoute><Logros /></PrivateRoute>} />
                <Route path="/learning/:topicId" element={<PrivateRoute><Learning /></PrivateRoute>} />
                <Route path="/quiz/:lessonId" element={<PrivateRoute><Quiz /></PrivateRoute>} />
                <Route path="/ranking"   element={<PrivateRoute><Ranking /></PrivateRoute>} />
                <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
            </Routes>
        </BrowserRouter>
    )
}
