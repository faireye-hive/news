import fs from 'fs';

let file = fs.readFileSync('components/Dashboard.tsx', 'utf-8');

const topStakesUI = `
        {/* Top Stakes */}
        <div className="bg-card p-6 rounded-2xl border border-slate-700/50 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-400" /> Top Stakes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Rank</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Staked Tokens</th>
                </tr>
              </thead>
              <tbody>
                {topStakes.filter(s => parseFloat(s.staked_tokens) > 0).map((stake, idx) => (
                  <tr key={stake.name} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">#{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{stake.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-cent">
                      {parseFloat(stake.staked_tokens).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
`;

file = file.replace(/        <\/div>\n      <\/div>\n    <\/div>/, `        </div>\n${topStakesUI}      </div>\n    </div>`);

fs.writeFileSync('components/Dashboard.tsx', file);
