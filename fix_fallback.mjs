import fs from 'fs';

let file = fs.readFileSync('services/hiveEngineService.ts', 'utf-8');

file = file.replace(
/const isByteInitialLoad = token\.toUpperCase\(\) === 'BYTE' && !start_author;\s*const cacheKey = \`byte_posts_\$\{sort\}_\$\{tag \|\| 'all'\}\`;\s*\/\/ Se for BYTE, tenta retornar os 200 iniciais do cache persistente\s*if \(isByteInitialLoad\) \{/,
`const isInitialLoad = !start_author;
  const cacheKey = \`\${token.toLowerCase()}_posts_\${sort}_\${tag || 'all'}\`;

  if (isInitialLoad) {`
);

file = file.replace(/isByteInitialLoad/g, 'isInitialLoad');
file = file.replace(/token\.toUpperCase\(\) === 'BYTE' && !start_author/g, '!start_author');
file = file.replace(/byte-data-updated/g, 'token-data-updated');

const fallbackLogic = `
      if (!cached || !Array.isArray(cached) || cached.length === 0) {
        if (sort === 'created' && !tag && !start_author) {
          try {
            const fallbackRes = await fetch('./fallback_discussions.json');
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              if (Array.isArray(fallbackData) && fallbackData.length > 0) {
                console.log("Loaded posts from fallback JSON");
                
                // Dispara a mesma lógica de atualização em background
                scotFetch(\`/get_discussions_by_\${sort}?\${query.toString()}\`).then(async (freshData) => {
                  if (Array.isArray(freshData)) {
                    await localforage.setItem(cacheKey, freshData);
                    window.dispatchEvent(new CustomEvent('token-data-updated', { detail: { sort } }));
                  }
                }).catch(err => console.error("Background refresh error:", err));

                return fallbackData.slice(0, limit);
              }
            }
          } catch (fallbackErr) {
            console.error("Fallback JSON load error", fallbackErr);
          }
        }
      }
`;

file = file.replace(/if \(cached && Array\.isArray\(cached\) && cached\.length > 0\) \{/, fallbackLogic + '\n      if (cached && Array.isArray(cached) && cached.length > 0) {');

fs.writeFileSync('services/hiveEngineService.ts', file);
