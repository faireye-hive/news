import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

const journalLayoutCode = `
      {layoutMode === "journal" ? (
        <div className="flex-1 w-full flex flex-col gap-8">
          {loadingCurations ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-4 text-cent" />
              <p>Carregando destaques do jornal...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {/* Highlight / Breaking News */}
              {(() => {
                const highlight = curatedPosts.find(c => c.id === 'news_highlight');
                if (!highlight) return null;
                const post = highlight.post;
                const thumbnail = extractImage(post);
                const excerpt = getExcerpt(post.desc || post.body, 250);
                return (
                  <div className="flex flex-col lg:flex-row gap-8 lg:items-center bg-card rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl group">
                    <div className="w-full lg:w-2/3 h-[400px] lg:h-[500px] bg-slate-900 relative shrink-0">
                      {thumbnail ? (
                        <img src={\`https://images.hive.blog/800x0/\${thumbnail}\`} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><BookOpen size={64} className="text-slate-700" /></div>
                      )}
                      <div className="absolute top-4 left-4 bg-hive text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded shadow-sm">Destaque</div>
                    </div>
                    <div className="flex flex-col flex-1 p-6 lg:p-8">
                       <Link to={\`/@\${post.author}/\${post.permlink}\`} state={{ backgroundLocation: actualLocation }} className="block hover:text-slate-300 transition-colors">
                         <h2 className="font-serif font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">{post.title}</h2>
                         <p className="text-slate-400 font-serif text-lg leading-relaxed line-clamp-4">{excerpt}</p>
                       </Link>
                       <div className="mt-8 flex items-center gap-3 text-sm text-slate-500 font-medium">
                         <img src={\`https://images.hive.blog/u/\${post.author}/avatar\`} className="w-8 h-8 rounded-full bg-slate-800" />
                         <span>{post.author}</span>
                         <span>&bull;</span>
                         <span>{new Date(highlight.date).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Other Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {['news_economy', 'news_politics', 'news_crypto', 'news_entertainment', 'news_sport', 'news_philosophy'].map(cat => {
                  const catPost = curatedPosts.find(c => c.id === cat);
                  if (!catPost) return null;
                  const post = catPost.post;
                  const thumbnail = extractImage(post);
                  const catName = cat.replace('news_', '');
                  return (
                    <div key={cat} className="flex flex-col gap-4 group">
                      <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2">
                        <div className="w-2 h-2 rounded-full bg-hive"></div>
                        <h3 className="font-bold uppercase tracking-wider text-sm text-white">{catName}</h3>
                      </div>
                      <div className="w-full h-48 bg-slate-900 rounded-xl overflow-hidden relative">
                        {thumbnail ? (
                          <img src={\`https://images.hive.blog/400x0/\${thumbnail}\`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><BookOpen size={32} className="text-slate-700" /></div>
                        )}
                      </div>
                      <Link to={\`/@\${post.author}/\${post.permlink}\`} state={{ backgroundLocation: actualLocation }} className="block hover:text-slate-300 transition-colors">
                        <h4 className="font-serif font-bold text-white text-xl leading-tight mb-2 line-clamp-3">{post.title}</h4>
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-auto">
                        <span>{post.author}</span>
                        <span>&bull;</span>
                        <span>{new Date(catPost.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Ad Space Placeholder */}
              <div className="w-full py-12 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-800/20">
                <span className="font-mono text-sm tracking-widest uppercase mb-2">Advertisement Space</span>
                <span className="text-xs">Your Ad Here - Support the Hive Community</span>
              </div>
            </div>
          )}
        </div>
      ) : (
`;

// Replace `<div className="flex-1 w-full">` which contains the main feed
file = file.replace(
  '<div className="flex-1 w-full">',
  journalLayoutCode + '\n<div className="flex-1 w-full">'
);

// We need to close the `)` at the end of the `layoutMode === "journal" ? (...) : (...)`
file = file.replace(
  '{loading && posts.length > 0 && (',
  ')}\n{loading && posts.length > 0 && ('
);

fs.writeFileSync('components/Explorer.tsx', file);
