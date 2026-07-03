import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL do seu projeto no GitHub Pages
const SITE_URL = 'https://faireye-hive.github.io/news';
const TOKEN = 'NEWS'; // Seu token

async function generateSitemap() {
  try {
    const res = await fetch(`https://smt-api.enginerpc.com/get_discussions_by_created?limit=100&token=${TOKEN}`);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Páginas principais
    const staticPages = ['', '/discovery', '/feed', '/explorer', '/market-pools'];
    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${SITE_URL}/#${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    }

    if (res.ok) {
      const posts = await res.json();
      if (Array.isArray(posts)) {
        for (const post of posts) {
          if (post.author && post.permlink) {
            xml += `  <url>\n    <loc>${SITE_URL}/#/@${post.author}/${post.permlink}</loc>\n    <lastmod>${new Date(post.created + 'Z').toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
          }
        }
      }
    }
    
    xml += `</urlset>`;
    
    const filePath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(filePath, xml);
    console.log('Successfully generated sitemap.xml.');
  } catch (err) {
    console.error('Error generating sitemap:', err);
    process.exit(1);
  }
}

generateSitemap();
