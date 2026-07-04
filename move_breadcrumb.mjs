import fs from 'fs';
let file = fs.readFileSync('components/Explorer.tsx', 'utf-8');

const breadcrumbMatch = file.match(/\{\/\* Breadcrumb \*\/\}[\s\S]*?<\/nav>/);
if (breadcrumbMatch) {
  const breadcrumbCode = breadcrumbMatch[0];
  file = file.replace(breadcrumbCode, '');
  
  // Find the end of the header div and insert breadcrumb after it.
  // The header div ends right before `<div className="flex flex-col lg:flex-row gap-8">`
  file = file.replace(
    '<div className="flex flex-col lg:flex-row gap-8">',
    `${breadcrumbCode}\n      <div className="flex flex-col lg:flex-row gap-8">`
  );
}

// Shrink header: p-6 -> p-4 sm:p-5
file = file.replace(
  'p-6 rounded-2xl',
  'p-4 sm:p-5 rounded-2xl'
);

file = file.replace(
  'space-y-8 animate-fade-in pb-8',
  'space-y-6 animate-fade-in pb-8'
);

fs.writeFileSync('components/Explorer.tsx', file);
