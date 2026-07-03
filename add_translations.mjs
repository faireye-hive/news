import fs from 'fs';

let en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));
let pt = JSON.parse(fs.readFileSync('locales/pt.json', 'utf-8'));

en.dashboard.topStakes = "Top Stakes";
en.dashboard.rank = "Rank";
en.dashboard.account = "Account";
en.dashboard.stakedTokens = "Staked Tokens";

pt.dashboard.topStakes = "Top Stakes";
pt.dashboard.rank = "Rank";
pt.dashboard.account = "Conta";
pt.dashboard.stakedTokens = "Tokens em Stake";

fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('locales/pt.json', JSON.stringify(pt, null, 2));
