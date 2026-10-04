import edufinLogo from '../../assets/images/edufinLogo.png'
import './Logo.css'

// Logo «A»: el robot de siempre + EDU/FIN con colores que se leen sobre fondo oscuro.
// El robot se recorta del PNG original para no duplicar el archivo.
const IMG_W = 1175, IMG_H = 417

export default function Logo({ height = 40, className = '', onClick }: {
    height?:    number
    className?: string
    onClick?:   () => void
}) {
    return (
        <svg
            className={`edufin-logo ${onClick ? 'edufin-logo--link' : ''} ${className}`}
            viewBox="0 0 470 130"
            height={height}
            role={onClick ? 'link' : 'img'}
            aria-label="Edufin"
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={onClick ? e => { if (e.key === 'Enter') onClick() } : undefined}
        >
            <svg x="0" y="6" width="84" height="118" viewBox="12 6 288 406" aria-hidden="true">
                <image href={edufinLogo} width={IMG_W} height={IMG_H} />
            </svg>
            <text x="96" y="95" className="edufin-logo-text" fontSize="86" letterSpacing="-1">
                <tspan className="edufin-logo-edu">EDU</tspan>
                <tspan className="edufin-logo-fin">FIN</tspan>
            </text>
        </svg>
    )
}
