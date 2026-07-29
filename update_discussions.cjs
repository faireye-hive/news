const fs = require('fs');
let code = fs.readFileSync('components/Profile.tsx', 'utf8');

const target = `       const data = await getUserDiscussions(currentProfile, activeTab, community, 20);
       setDiscussions(data);`;

const replacement = `       let data = await getUserDiscussions(currentProfile, activeTab, community, isViewingOwnLightAccount ? 50 : 20);
       if (isViewingOwnLightAccount && lightAccount) {
         data = data.filter((post: any) => {
           try {
             const meta = typeof post.json_metadata === 'string' ? JSON.parse(post.json_metadata) : post.json_metadata;
             return meta?.author_nickname === lightAccount.nickname;
           } catch(e) { return false; }
         });
       }
       setDiscussions(data.slice(0, 20));`;

code = code.replace(target, replacement);
fs.writeFileSync('components/Profile.tsx', code);
