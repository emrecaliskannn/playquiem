// npm run build sonrası otomatik çalışır
// package.json'daki build scriptine eklendi

import { writeFileSync } from 'fs'

const DOMAIN = 'https://playquiem.com'
const today = new Date().toISOString().split('T')[0]

const routes = [
  { url: '/',          priority: '1.0', changefreq: 'daily'   },
  { url: '/games',     priority: '0.9', changefreq: 'daily'   },
  { url: '/community', priority: '0.8', changefreq: 'daily'   },
  { url: '/trending',  priority: '0.8', changefreq: 'hourly'  },
  { url: '/news',      priority: '0.7', changefreq: 'daily'   },
  { url: '/players',   priority: '0.6', changefreq: 'weekly'  },
  { url: '/auth',      priority: '0.5', changefreq: 'monthly' },
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${DOMAIN}${r.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>`

writeFileSync('./dist/sitemap.xml', xml)
console.log('✅ sitemap.xml oluşturuldu →', DOMAIN + '/sitemap.xml')
