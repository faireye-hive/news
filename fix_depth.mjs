import fs from 'fs';

let file = fs.readFileSync('components/Dashboard.tsx', 'utf-8');

file = file.replace(
/const depthData = \[\s*\.\.\.orderBook\.buy\.slice\(0, 10\)\.map\(o => \(\{ type: 'Bid', price: parseFloat\(o\.price\), amount: parseFloat\(o\.quantity\) \}\)\)\.reverse\(\),\s*\.\.\.orderBook\.sell\.slice\(0, 10\)\.map\(o => \(\{ type: 'Ask', price: parseFloat\(o\.price\), amount: parseFloat\(o\.quantity\) \}\)\)\s*\];/,
\`const depthData = [
    ...orderBook.buy.slice(0, 10).map(o => ({ type: 'Bid', price: parseFloat(o.price), amount: parseFloat(o.quantity), account: o.account })).reverse(),
    ...orderBook.sell.slice(0, 10).map(o => ({ type: 'Ask', price: parseFloat(o.price), amount: parseFloat(o.quantity), account: o.account }))
  ];\`
);

fs.writeFileSync('components/Dashboard.tsx', file);
