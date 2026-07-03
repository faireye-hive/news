import fs from 'fs';

let file = fs.readFileSync('components/Feed.tsx', 'utf-8');

if (!file.includes("import VoteModal")) {
  file = file.replace("import VotersModal", "import VoteModal from './VoteModal';\nimport VotersModal");
}

file = file.replace(/const \[votingPost, setVotingPost\] = useState<string \| null>\(null\);/, 
  "const [votingPost, setVotingPost] = useState<string | null>(null);\n  const [voteModalPost, setVoteModalPost] = useState<HivePost | null>(null);");

const newHandleVote = `
  const handleVoteClick = (post: HivePost) => {
    if (!user) {
      alert(t('feed.loginToVote'));
      return;
    }
    const alreadyVoted = post.active_votes?.some((v) => v.voter === user);
    if (alreadyVoted) {
      alert(t('feed.error') + "Você já votou neste post.");
      return;
    }
    setVoteModalPost(post);
  };

  const handleConfirmVote = async (weight: number) => {
    if (!voteModalPost || !user) return;
    
    setVotingPost(voteModalPost.permlink);
    try {
      const result = await vote(voteModalPost.author, voteModalPost.permlink, weight);
      if (result.success) {
        setPosts(posts.map(p => {
          if (p.author === voteModalPost.author && p.permlink === voteModalPost.permlink) {
            let active_votes = Array.isArray(p.active_votes) ? [...p.active_votes] : [];
            if (!active_votes.some((v: any) => v.voter === user)) {
               active_votes.push({ voter: user, percent: weight, rshares: 0, weight: weight });
            }
            return { ...p, active_votes };
          }
          return p;
        }));
      } else {
        alert(t('feed.errorVote') + result.msg);
      }
    } catch (error) {
      console.error(error);
      alert(t('feed.error'));
    } finally {
      setVotingPost(null);
      setVoteModalPost(null);
    }
  };
`;

file = file.replace(/const handleVote = async \(post: HivePost\) => \{[\s\S]*?finally \{\s*setVotingPost\(null\);\s*\}\s*\};/, newHandleVote.trim());

file = file.replace(/onClick=\{.*?handleVote\(post\)\}/g, "onClick={() => handleVoteClick(post)}");

const modalRender = `
      <VotersModal
        post={votersModalPost}
        isOpen={votersModalPost !== null}
        onClose={() => setVotersModalPost(null)}
        tribeInfo={tribeInfo}
      />
      <VoteModal
        isOpen={voteModalPost !== null}
        onClose={() => setVoteModalPost(null)}
        post={voteModalPost}
        username={user || ''}
        token={community}
        onVote={handleConfirmVote}
      />
`;
file = file.replace(/<VotersModal[\s\S]*?\/>/, modalRender.trim());

fs.writeFileSync('components/Feed.tsx', file);
