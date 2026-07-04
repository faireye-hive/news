import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

file = file.replace(
  'sort === s\n                    ? "bg-cent text-slate-900 shadow-lg"',
  'sort === s\n                    ? (layoutMode === "journal" ? "bg-white text-slate-900 shadow-lg" : "bg-cent text-slate-900 shadow-lg")'
);

file = file.replace(
  /bg-cent text-slate-900 px-4 py-2\.5/g,
  '${layoutMode === "journal" ? "bg-white text-slate-900" : "bg-cent text-slate-900"} px-4 py-2.5'
);

file = file.replace(
  /text-cent bg-cent\/10/g,
  '${layoutMode === "journal" ? "text-white bg-slate-800" : "text-cent bg-cent/10"}'
);

fs.writeFileSync('components/Explorer.tsx', file);
