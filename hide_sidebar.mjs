import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

file = file.replace(
  'className={`hidden lg:block shrink-0 transition-all duration-300 ${sidebarCollapsed === "collapsed" ? "w-16" : "w-64"}`}',
  'className={`hidden lg:block shrink-0 transition-all duration-300 ${sidebarCollapsed === "collapsed" ? "w-16" : "w-64"} ${layoutMode === "journal" ? "!hidden" : ""}`}'
);

fs.writeFileSync('components/Explorer.tsx', file);
