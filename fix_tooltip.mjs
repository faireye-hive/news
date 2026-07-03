import fs from 'fs';

let file = fs.readFileSync('components/Dashboard.tsx', 'utf-8');

const customTooltipCode = `
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-200 font-bold mb-1">Price: {label}</p>
        <p className="text-slate-300">Amount: {data.amount}</p>
        <p className="text-cent font-medium">User: {data.account}</p>
        <p className="text-xs text-slate-500 mt-1 uppercase">{data.type}</p>
      </div>
    );
  }
  return null;
};
`;

if (!file.includes('CustomTooltip')) {
  file = file.replace(/const Dashboard: React\.FC = \(\) => \{/, customTooltipCode + '\nconst Dashboard: React.FC = () => {');
  
  file = file.replace(/<Tooltip \n\s*contentStyle=\{\{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F1F5F9' \}\}\n\s*itemStyle=\{\{ color: '#F1F5F9' \}\}\n\s*labelStyle=\{\{ color: '#94A3B8' \}\}\n\s*\/>/m, '<Tooltip content={<CustomTooltip />} />');
}

fs.writeFileSync('components/Dashboard.tsx', file);
