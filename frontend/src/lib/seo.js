// Simple SEO hook - updates document title and meta tags
export function useSEO({ title, description, image } = {}) {
  const base = 'Playquiem'
  const fullTitle = title ? `${title} — ${base}` : `${base} — Game Diary & Tracker`
  const desc = description || 'Log every game you play, rate them, write reviews and discover what to play next.'

  if (typeof document !== 'undefined') {
    document.title = fullTitle

    const setMeta = (selector, content) => {
      const el = document.querySelector(selector)
      if (el) el.setAttribute('content', content)
    }

    setMeta('meta[name="description"]', desc)
    setMeta('meta[property="og:title"]', fullTitle)
    setMeta('meta[property="og:description"]', desc)
    setMeta('meta[name="twitter:title"]', fullTitle)
    setMeta('meta[name="twitter:description"]', desc)
    if (image) {
      setMeta('meta[property="og:image"]', image)
      setMeta('meta[name="twitter:image"]', image)
    }
  }
}
