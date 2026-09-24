import { useEffect, useRef } from 'react'

// ── AdSense Ad Unit Component ─────────────────────────────────
// SETUP: Replace YOUR_PUB_ID and slot IDs with values from Google AdSense
// AdSense → Ads → By ad unit → Get code
//
// 1. Add to index.html <head>:
//    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUB_ID" crossorigin="anonymous"></script>
//
// 2. Replace "ca-pub-YOUR_PUB_ID" below with your real Publisher ID
// 3. Replace slot numbers with your real Ad Unit slot IDs

const PUB_ID = 'ca-pub-6074354505115219'
const ENABLED = PUB_ID !== 'ca-pub-YOUR_PUB_ID' // Only show ads when real ID is set

export function AdUnit({ slot, format = 'auto', style = {} }) {
  const ref = useRef(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (!ENABLED || pushed.current) return
    try {
      if (window.adsbygoogle && ref.current) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        pushed.current = true
      }
    } catch (e) {}
  }, [])

  if (!ENABLED) return null // Don't render until real ID is set

  return (
    <div style={{ overflow: 'hidden', textAlign: 'center', ...style }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

export function SidebarAd() {
  return <AdUnit slot="1111111111" format="auto" style={{ width: 160, minHeight: 320 }} />
}

export function BannerAd() {
  return <AdUnit slot="2222222222" format="auto" style={{ width: '100%', minHeight: 90, maxWidth: 728, margin: '0 auto' }} />
}

export function InFeedAd() {
  return <AdUnit slot="3333333333" format="fluid" style={{ width: '100%', minHeight: 120, margin: '8px 0' }} />
}

export function RectangleAd() {
  return <AdUnit slot="4444444444" format="auto" style={{ width: 300, minHeight: 250, margin: '0 auto' }} />
}
