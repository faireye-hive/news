import fs from 'fs';

let file = fs.readFileSync('components/Dashboard.tsx', 'utf-8');

// Add getTopStakes import
file = file.replace(/getCentRichList/g, 'getCentRichList, getTopStakes');

// Add topStakes state
file = file.replace(/const \[richList, setRichList\] = useState<Balance\[\]>\(\[\]\);/, "const [richList, setRichList] = useState<Balance[]>([]);\n  const [topStakes, setTopStakes] = useState<{name: string, staked_tokens: string}[]>([]);");

// Add to fetchData
file = file.replace(/const \[t, m, o, r\] = await Promise\.all\(\[/, "const [t, m, o, r, ts] = await Promise.all([");
file = file.replace(/getCentRichList\(community\)/, "getCentRichList(community),\n      getTopStakes(community)");
file = file.replace(/setRichList\(r\);/, "setRichList(r);\n    setTopStakes(ts.sort((a,b) => parseFloat(b.staked_tokens) - parseFloat(a.staked_tokens)).slice(0, 10));");

// Add formatting for 3 decimals on Top Holders
file = file.replace(/parseInt\(holder\.balance\)\.toLocaleString\(\)/g, "parseFloat(holder.balance).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})");

// We need to add the Buyer/Seller to Market Depth table.
// And Top Stakes table below Top Holders.
fs.writeFileSync('components/Dashboard.tsx', file);
