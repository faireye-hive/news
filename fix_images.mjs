import fs from 'fs';
let file = fs.readFileSync('components/SinglePost.tsx', 'utf-8');

const regex = /\/\/ Proxy images through images\.hive\.blog to avoid tracking[\s\S]*?bodyToParse = bodyToParse\.replace\([\s\S]*?return \`\!\[\$\{alt\}\]\(https:\/\/images\.hive\.blog\/0x0\/\$\{url\}\)\`;\n\s*\},?\n\s*\);/g;

const match = file.match(regex);
console.log(match ? "Found match" : "No match");

const replacement = `        // Convert markdown images to HTML tags so they parse correctly even inside HTML blocks like <center>
        bodyToParse = bodyToParse.replace(
          /!\\[(.*?)\\]\\((https?:\\/\\/[^\\s)]+)\\)/g,
          (match, alt, url) => {
            let finalUrl = url;
            if (!url.includes("images.hive.blog")) {
              finalUrl = \`https://images.hive.blog/0x0/\${url}\`;
            }
            return \`<img src="\${finalUrl}" alt="\${alt}" loading="lazy" />\`;
          },
        );`;

if (match) {
  file = file.replace(regex, replacement);
  fs.writeFileSync('components/SinglePost.tsx', file);
  console.log("Replaced successfully.");
}
