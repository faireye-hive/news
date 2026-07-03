import fs from 'fs';
let file = fs.readFileSync('components/MarketPools.tsx', 'utf-8');
file = file.replace(/\`\$\{t\("pools\.insufficientBalance"\)\.replace\("\{token\}", swapFrom\)\}\`/g, "t('pools.insufficientBalance', { token: swapFrom })");
fs.writeFileSync('components/MarketPools.tsx', file);
