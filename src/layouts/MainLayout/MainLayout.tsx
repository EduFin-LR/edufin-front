import Sidebar from '../../components/Sidebar/Sidebar'
import './MainLayout.css'

interface Props {
    children: React.ReactNode
}

export default function MainLayout({
                                       children,
                                   }: Props) {
    return (
        <div className="layout">
            <Sidebar />

            <main className="content">
                {children}
            </main>
        </div>
    )
}