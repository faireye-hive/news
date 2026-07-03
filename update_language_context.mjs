import fs from 'fs';

let file = fs.readFileSync('contexts/LanguageContext.tsx', 'utf-8');

file = file.replace(/t: \(key: string\) => string;/, "t: (key: string, params?: Record<string, any>) => string;");

const tImplementation = `
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        return key; // Fallback
      }
    }

    if (typeof value === "string") {
      if (params) {
        let result = value;
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(new RegExp(\`\\\\{\\$\\{k\\}\\\\}\`, 'g'), v);
        }
        return result;
      }
      return value;
    }
    return key;
  };
`;

file = file.replace(/const t = \(key: string\): string => \{[\s\S]*?  \};/, tImplementation.trim());

fs.writeFileSync('contexts/LanguageContext.tsx', file);
