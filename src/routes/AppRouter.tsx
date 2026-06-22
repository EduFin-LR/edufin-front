import { BrowserRouter, Routes, Route } from 'react-router-dom'

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

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth */}
                <Route path="/"                element={<Login />} />
                <Route path="/register"        element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/email-sent"      element={<EmailSent />} />

                {/* App */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/logros"    element={<Logros />} />
                <Route path="/learning"  element={<Learning />} />
                <Route path="/quiz"      element={<Quiz />} />
                <Route path="/ranking"   element={<Ranking />} />
                <Route path="/profile"   element={<Profile />} />
            </Routes>
        </BrowserRouter>
    )
}
