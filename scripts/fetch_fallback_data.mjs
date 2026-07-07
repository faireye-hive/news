import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = 'NEWS';
const LIMIT = 200;

async function fetchAndSave() {
  try {
    let startAuthor = '';
    let startPermlink = '';
    let firstPage = true;

    const allPosts = [];

    while (true) {
      let url = `https://smt-api.enginerpc.com/get_discussions_by_created?limit=${LIMIT}&token=${TOKEN}`;

      if (startAuthor) {
        url += `&start_author=${encodeURIComponent(startAuthor)}&start_permlink=${encodeURIComponent(startPermlink)}`;
      }

      console.log(`Buscando: ${url}`);

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }

      const posts = await res.json();

      if (!Array.isArray(posts) || posts.length === 0) {
        console.log('Fim dos posts.');
        break;
      }

      // Remove o primeiro item das páginas seguintes (duplicado)
      const pagePosts = firstPage ? posts : posts.slice(1);

      firstPage = false;

      allPosts.push(...pagePosts);

      console.log(`Total: ${allPosts.length}`);

      // Última página
      if (posts.length < LIMIT) {
        break;
      }

      // Cursor da próxima página
      const last = posts[posts.length - 1];

      if (!last?.author || !last?.permlink) {
        break;
      }

      startAuthor = last.author;
      startPermlink = last.permlink;
    }

    const filePath = path.resolve(
      __dirname,
      '..',
      'public',
      'fallback_discussions.json'
    );

    fs.writeFileSync(
      filePath,
      JSON.stringify(allPosts, null, 2),
      'utf8'
    );

    console.log(`✅ Salvos ${allPosts.length} posts em:`);
    console.log(filePath);

  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

fetchAndSave();