import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

file = file.replace(
  '<span className="text-cent">#{community}</span>',
  '<span className={layoutMode === "journal" ? "text-hive" : "text-cent"}>#{community}</span>'
);

file = file.replace(
  '<div className="absolute top-0 right-0 py-12 px-16 bg-cent/5 blur-[80px] rounded-full pointer-events-none"></div>',
  '<div className={`absolute top-0 right-0 py-12 px-16 blur-[80px] rounded-full pointer-events-none ${layoutMode === "journal" ? "bg-hive/5" : "bg-cent/5"}`}></div>'
);

file = file.replace(
  /className="bg-slate-800 text-xs px-2 py-0\.5 rounded text-cent border border-cent\/20 font-mono"/g,
  'className={`bg-slate-800 text-xs px-2 py-0.5 rounded font-mono ${layoutMode === "journal" ? "text-slate-300 border border-slate-700" : "text-cent border border-cent/20"}`}'
);

fs.writeFileSync('components/Explorer.tsx', file);
