import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

file = file.replace(
  '${tag === sub ? "${layoutMode === \\"journal\\" ? \\"text-white bg-slate-800\\" : \\"text-cent bg-cent/10\\"} font-bold" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}',
  '${tag === sub ? (layoutMode === "journal" ? "text-white bg-slate-800" : "text-cent bg-cent/10") + " font-bold" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}'
);

file = file.replace(
  'className="font-mono ${layoutMode === \\"journal\\" ? \\"text-white bg-slate-800\\" : \\"text-cent bg-cent/10\\"} px-1.5 py-0.5 rounded"',
  'className={`font-mono ${layoutMode === "journal" ? "text-white bg-slate-800" : "text-cent bg-cent/10"} px-1.5 py-0.5 rounded`}'
);

file = file.replace(
  'isPaid ? "text-slate-400 bg-slate-800" : "${layoutMode === \\"journal\\" ? \\"text-white bg-slate-800\\" : \\"text-cent bg-cent/10\\"}"',
  'isPaid ? "text-slate-400 bg-slate-800" : (layoutMode === "journal" ? "text-white bg-slate-800" : "text-cent bg-cent/10")'
);

fs.writeFileSync('components/Explorer.tsx', file);
