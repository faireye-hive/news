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

      // Compress items for smaller fallback payload
      const compactPosts = pagePosts.map(p => {
        let parsedMeta = {};
        if (p.json_metadata) {
          try {
            parsedMeta = typeof p.json_metadata === 'string' 
              ? JSON.parse(p.json_metadata) 
              : p.json_metadata;
          } catch (e) {}
        }
        
        let firstImage = null;
        if (parsedMeta.image && Array.isArray(parsedMeta.image) && parsedMeta.image.length > 0) {
          firstImage = parsedMeta.image[0];
        } else if (parsedMeta.images && Array.isArray(parsedMeta.images) && parsedMeta.images.length > 0) {
          firstImage = parsedMeta.images[0];
        } else if (typeof parsedMeta.image === 'string') {
          firstImage = parsedMeta.image;
        }

        let upvotes = 0;
        let downvotes = 0;
        if (p.active_votes && Array.isArray(p.active_votes)) {
          p.active_votes.forEach(v => {
            if (v.percent > 0) upvotes++;
            else if (v.percent < 0) downvotes++;
          });
        }

        return {
          author: p.author,
          permlink: p.permlink,
          title: p.title,
          created: p.created,
          desc: p.desc ? p.desc.substring(0, 180) : "",
          vote_rshares: p.vote_rshares || "0",
          pending_token: p.pending_token || 0,
          net_votes: upvotes - downvotes,
          json_metadata: JSON.stringify({
            image: firstImage ? [firstImage] : [],
            tags: parsedMeta.tags || []
          })
        };
      });

      allPosts.push(...compactPosts);

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
      JSON.stringify(allPosts),
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