import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

file = file.replace(
  'import { getHivePosts, getTribeInfo, getTrendingTags } from "../services/hiveEngineService";',
  'import { getHivePosts, getTribeInfo, getTrendingTags, getAdminCuratedPosts, getPostContent } from "../services/hiveEngineService";'
);

const stateInjection = `
  const [layoutMode, setLayoutMode] = useState<"classic" | "journal">(() => {
    return (
      (localStorage.getItem("explorer_layout_mode") as "classic" | "journal") || "journal"
    );
  });
  const [curatedPosts, setCuratedPosts] = useState<any[]>([]);
  const [loadingCurations, setLoadingCurations] = useState(false);
`;

file = file.replace(
  /const \[layoutMode, setLayoutMode\][\s\S]*?\}\);\n/,
  stateInjection
);

const effectInjection = `
  useEffect(() => {
    if (layoutMode === "journal") {
      setLoadingCurations(true);
      getAdminCuratedPosts('faireye').then(async (curations) => {
        // fetch content for them
        const withContent = await Promise.all(curations.map(async (c: any) => {
          const content = await getPostContent(c.author, c.permlink);
          return { ...c, post: content };
        }));
        setCuratedPosts(withContent.filter(c => c.post));
        setLoadingCurations(false);
      });
    }
  }, [layoutMode]);
`;

file = file.replace(
  '  useEffect(() => {',
  effectInjection + '\n  useEffect(() => {'
);

fs.writeFileSync('components/Explorer.tsx', file);
