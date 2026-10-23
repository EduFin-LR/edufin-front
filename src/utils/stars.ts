// Estrellas de los retos (QUIZ). Misma escala que el backend:
// 90-100% = 3, 50-89% = 2, menos = 1
export const MAX_STARS = 3

export function starsForScore(pct: number) {
    if (pct >= 90) return 3
    if (pct >= 50) return 2
    return 1
}

// Al volver del quiz la ruta anima las estrellas nuevas de esta lección
export const PENDING_STARS_KEY = 'pendingStarsLesson'
// Estrellas por lección que la ruta vio la última vez, para saber cuántas son nuevas
export const routeStarsKey = (topicId: string) => `routeStars:${topicId}`
