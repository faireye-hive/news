import fs from 'fs';

let file = fs.readFileSync('services/hiveEngineService.ts', 'utf-8');

const topStakesCode = `
export const getTopStakes = async (symbol: string = 'BYTE'): Promise<{name: string, staked_tokens: string}[]> => {
  try {
    const response = await fetch(\`https://smt-api.enginerpc.com/get_staked_accounts?token=\${symbol}\`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch(e) {
    console.error("Error fetching top stakes:", e);
  }
  return [];
};
`;

file = file.replace(/export const getCentRichList/, topStakesCode + "\nexport const getCentRichList");

fs.writeFileSync('services/hiveEngineService.ts', file);
