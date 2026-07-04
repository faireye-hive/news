import fs from 'fs';
let file = fs.readFileSync('components/SinglePost.tsx', 'utf-8');

const regex = /bodyToParse = bodyToParse\.replace\(\n\s*\/!\\\[\(\.\*\?\)\\\]\\\\\(\(https\?:\\\\\/\\\\\/\[\^\\\\s\)\].\*\?\)\\\\\)\/g,\n\s*\(match, alt, url\) => \{\n\s*if \(url\.includes\("images\.hive\.blog"\)\) return match;\n\s*return \`!\\\[\$\{alt\}\\\]\(https:\/\/images\.hive\.blog\/0x0\/\$\{url\}\)\`;\n\s*\},\n\s*\);/g;

// Instead of regex, let's just do standard replace, there's only one remaining.

const oldBlock = `        bodyToParse = bodyToParse.replace(
          /!\\[(.*?)\\]\\((https?:\\/\\/[^\\s)]+)\\)/g,
          (match, alt, url) => {
            if (url.includes("images.hive.blog")) return match;
            return \`![$\{alt}](https://images.hive.blog/0x0/$\{url})\`;
          },
        );`;

const newBlock = `        bodyToParse = bodyToParse.replace(
          /!\\[(.*?)\\]\\((https?:\\/\\/[^\\s)]+)\\)/g,
          (match, alt, url) => {
            let finalUrl = url;
            if (!url.includes("images.hive.blog")) {
              finalUrl = \`https://images.hive.blog/0x0/\${url}\`;
            }
            return \`<img src="\${finalUrl}" alt="\${alt}" loading="lazy" />\`;
          },
        );`;

file = file.replace(oldBlock, newBlock);
fs.writeFileSync('components/SinglePost.tsx', file);
