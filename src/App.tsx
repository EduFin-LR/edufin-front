import './App.css'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './routes/AppRouter'
import SplashScreen from './components/SplashScreen/SplashScreen'

function App() {
    return (
        <SplashScreen>
            <AuthProvider>
                <AppRouter />
            </AuthProvider>
        </SplashScreen>
    )
}

export default App
