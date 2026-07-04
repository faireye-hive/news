import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

file = file.replace(
  'const { user, vote } = useAuth();',
  'const { user, vote, customJson } = useAuth();'
);

fs.writeFileSync('components/Explorer.tsx', file);
