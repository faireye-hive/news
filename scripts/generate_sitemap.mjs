import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL do seu projeto no GitHub Pages
const SITE_URL = 'https://faireye-hive.github.io/news';
const TOKEN = 'NEWS';
const LIMIT = 200;

async function generateSitemap() {
  try {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Páginas principais
    const staticPages = [
      '',
      '/discovery',
      '/feed',
      '/explorer',
      '/market-pools'
    ];

    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;
    }

    let startAuthor = '';
    let startPermlink = '';
    let firstPage = true;
    let totalPosts = 0;

    while (true) {
      let url = `https://smt-api.enginerpc.com/get_discussions_by_created?limit=${LIMIT}&token=${TOKEN}`;

      if (startAuthor) {
        url += `&start_author=${encodeURIComponent(startAuthor)}&start_permlink=${encodeURIComponent(startPermlink)}`;
      }

      console.log(`Buscando: ${url}`);

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Erro ${res.status}`);
      }

      const posts = await res.json();

      if (!Array.isArray(posts) || posts.length === 0) {
        console.log('Fim dos posts.');
        break;
      }

      // Remove o primeiro item das próximas páginas
      const pagePosts = firstPage ? posts : posts.slice(1);

      firstPage = false;

      if (pagePosts.length === 0) {
        break;
      }

      for (const post of pagePosts) {
        if (!post.author || !post.permlink) continue;

        totalPosts++;

        xml += `  <url>
    <loc>${SITE_URL}/@${post.author}/${post.permlink}</loc>`;

        if (post.created) {
          xml += `
    <lastmod>${new Date(post.created + 'Z').toISOString()}</lastmod>`;
        }

        xml += `
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      }

      console.log(`Posts adicionados: ${totalPosts}`);

      // Última página
      if (posts.length < LIMIT) {
        console.log('Última página encontrada.');
        break;
      }

      // Cursor para próxima página
      const last = posts[posts.length - 1];

      startAuthor = last.author;
      startPermlink = last.permlink;

      // Segurança contra loop infinito
      if (!startAuthor || !startPermlink) {
        console.log('Cursor inválido.');
        break;
      }
    }

    xml += `</urlset>`;

    const filePath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');

    fs.writeFileSync(filePath, xml, 'utf8');

    console.log(`✅ Sitemap gerado com ${totalPosts} posts.`);
    console.log(`📄 ${filePath}`);

  } catch (err) {
    console.error('Erro ao gerar sitemap:', err);
    process.exit(1);
  }
}

generateSitemap();