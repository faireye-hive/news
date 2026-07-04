import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

// We need a modal for the admin to select a flair, or a simple dropdown/menu.
// It's easier to add a small dropdown menu for the admin on the post card.
// We'll use a local state for which post is being curated, and show a small inline menu.

const stateInjection = `
  const [curatingPost, setCuratingPost] = useState<HivePost | null>(null);
`;
file = file.replace(
  'const [loadingCurations, setLoadingCurations] = useState(false);',
  'const [loadingCurations, setLoadingCurations] = useState(false);\n  const [curatingPost, setCuratingPost] = useState<HivePost | null>(null);'
);

const adminBtn = `
                        {user === "faireye" && (
                          <div className="relative">
                            <button
                              onClick={(e) => { e.preventDefault(); setCuratingPost(curatingPost?.permlink === post.permlink ? null : post); }}
                              className="text-xs font-bold text-hive border border-hive px-2 py-1 rounded hover:bg-hive hover:text-white transition-colors"
                            >
                              Curate
                            </button>
                            {curatingPost?.permlink === post.permlink && (
                              <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-2 flex flex-col gap-1">
                                {['highlight', 'entertainment', 'politics', 'sport', 'philosophy', 'crypto', 'economy'].map(flair => (
                                  <button
                                    key={flair}
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      const json = { author: post.author, permlink: post.permlink };
                                      try {
                                        await customJson(\`news_\${flair}\`, json, \`Curate \${flair}\`);
                                        setCuratingPost(null);
                                        alert("Curated as " + flair);
                                      } catch (err: any) {
                                        alert("Failed: " + err);
                                      }
                                    }}
                                    className="text-left px-2 py-1 text-xs hover:bg-slate-700 rounded text-slate-200 uppercase tracking-wider"
                                  >
                                    {flair}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
`;

// Insert it in the card footer where reward and share buttons are
// The card footer looks like:
// <div className="flex items-center gap-3">
//   {viewMode === "list" && (
file = file.replace(
  '<div className="flex items-center gap-3">',
  '<div className="flex items-center gap-3">\n' + adminBtn
);

fs.writeFileSync('components/Explorer.tsx', file);
