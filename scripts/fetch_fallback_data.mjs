import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://smt-api.enginerpc.com/get_discussions_by_created?limit=20&token=NEWS';

async function fetchAndSave() {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const filePath = path.resolve(__dirname, '..', 'public', 'fallback_discussions.json');
      fs.writeFileSync(filePath, JSON.stringify(data));
      console.log('Successfully saved fallback discussions.');
    } else {
      console.error('Failed to fetch:', res.statusText);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error fetching fallback data:', err);
    process.exit(1);
  }
}

fetchAndSave();
