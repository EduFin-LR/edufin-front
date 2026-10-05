import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getLeaderboard } from '../services/profileService'
import avatarBoy  from '../assets/images/perfilNiño (1).png'
import avatarGirl from '../assets/images/perfilNiño (3).png'

export { avatarBoy, avatarGirl }

type Gender = 'MALE' | 'FEMALE'
const KEY = 'gender'

function readCached(): Gender | null {
    try {
        const g = localStorage.getItem(KEY)
        return g === 'MALE' || g === 'FEMALE' ? g : null
    } catch { return null }
}

// Avatar del usuario: su foto si tiene; si no, el personaje (niño o niña) según su género.
// El perfil no trae el género, pero el ranking sí: se busca ahí una vez y se guarda.
export function useUserAvatar() {
    const { userInfo, userId } = useAuth()
    const [gender, setGender] = useState<Gender | null>(readCached)

    useEffect(() => {
        if (gender || !userId) return
        let alive = true
        getLeaderboard()
            .then(r => {
                const me = r.data.find(e => e.userId === userId)
                if (!alive || !me?.gender) return
                setGender(me.gender)
                try { localStorage.setItem(KEY, me.gender) } catch { /* sin almacenamiento */ }
            })
            .catch(() => {})
        return () => { alive = false }
    }, [gender, userId])

    const character = gender === 'FEMALE' ? avatarGirl : avatarBoy
    return { src: userInfo?.avatarUrl || character, character, gender }
}
