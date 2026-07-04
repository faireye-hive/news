import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

const journalBlock = `
                if (layoutMode === "journal") {
                  const isFeatured = index === 0;
                  return (
                    <div
                      key={\`\${post.author}-\${post.permlink}\`}
                      className={\`group flex \${isFeatured ? "flex-col lg:flex-row gap-8 lg:items-center col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 pb-12 border-b border-slate-800" : "flex-col gap-4"}\`}
                    >
                      <div className={\`shrink-0 \${isFeatured ? "w-full lg:w-2/3 h-[400px] lg:h-[500px]" : "w-full h-48 sm:h-56"} rounded-xl overflow-hidden bg-slate-900 relative\`}>
                        {thumbnail ? (
                          <img
                            src={\`https://images.hive.blog/\${isFeatured ? '800x0' : '400x0'}/\${thumbnail}\`}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            onError={(e) => {
                              (e.target).src = "https://placehold.co/600x400/0f172a/334155?text=News";
                            }}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            loading={index === 0 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-700">
                             <BookOpen size={48} strokeWidth={1} />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 flex gap-2">
                          {mainTag && (
                            <span className="bg-hive text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded shadow-sm">
                              {mainTag}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className={\`flex flex-col flex-1 \${isFeatured ? "lg:py-8" : ""}\`}>
                        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <Link to={\`/profile/\${post.author}\`} className="hover:text-white transition-colors flex items-center gap-2">
                            <img src={\`https://images.hive.blog/u/\${post.author}/avatar\`} alt={post.author} className="w-6 h-6 rounded-full bg-slate-800" />
                            {post.author}
                          </Link>
                          <span>&bull;</span>
                          <span>{timeAgo(post.created)}</span>
                        </div>
                        
                        <Link to={\`/@\${post.author}/\${post.permlink}\`} state={{ backgroundLocation: actualLocation }} className="block group-hover:text-slate-300 transition-colors">
                          <h3 className={\`font-serif font-bold text-white leading-tight \${isFeatured ? "text-3xl sm:text-4xl lg:text-5xl mb-4" : "text-xl sm:text-2xl mb-2 line-clamp-3"}\`}>
                            {post.title}
                          </h3>
                          {excerpt && (
                            <p className={\`text-slate-400 font-serif leading-relaxed \${isFeatured ? "text-lg sm:text-xl line-clamp-4" : "text-sm line-clamp-3"}\`}>
                              {excerpt}
                            </p>
                          )}
                        </Link>
                        
                        <div className="mt-auto pt-4 flex items-center justify-between text-slate-500 text-sm">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleVoteClick(post)}
                              disabled={userHasVoted || isVotingThis}
                              className={\`flex items-center gap-1.5 transition-colors \${userHasVoted ? "text-hive" : "hover:text-hive"}\`}
                            >
                              {isVotingThis ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Heart size={16} className={userHasVoted ? "fill-hive" : ""} />
                              )}
                              <span className="font-semibold">{up}</span>
                            </button>
                            <Link to={\`/@\${post.author}/\${post.permlink}#comments\`} state={{ backgroundLocation: actualLocation }} className="flex items-center gap-1.5 hover:text-white transition-colors">
                              <MessageCircle size={16} />
                              <span className="font-semibold">{post.children}</span>
                            </Link>
                          </div>
                          <div className="font-mono font-medium text-slate-400">
                            {reward} {community}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
`;

file = file.replace(
  '                return (\n                  <div',
  journalBlock + '\n                return (\n                  <div'
);

file = file.replace(
  /className=\{\n\s*viewMode === "grid"/g,
  `className={
                layoutMode === "journal"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                  : viewMode === "grid"`
);

fs.writeFileSync('components/Explorer.tsx', file);
