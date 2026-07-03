import React, { useEffect, useState } from 'react';
import { getCentMetrics, getCentTokenInfo, getOrderBook, getCentRichList, getTopStakes } from '../services/hiveEngineService';
import { analyzeTokenData, isGeminiAvailable } from '../services/geminiService';
import { Token, MarketMetrics, Order, Balance } from '../types';
import { sanitizeUrl } from '../utils/security';
import { useCommunity } from '../contexts/CommunityContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  DollarSign, 
  BarChart3, 
  BrainCircuit,
  RefreshCw 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';


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

const Dashboard: React.FC = () => {
  const { community } = useCommunity();
  const { t } = useLanguage();
  const [token, setToken] = useState<Token | null>(null);
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [orderBook, setOrderBook] = useState<{ buy: Order[], sell: Order[] }>({ buy: [], sell: [] });
  const [richList, setRichList] = useState<Balance[]>([]);
  const [topStakes, setTopStakes] = useState<{name: string, staked_tokens: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [t, m, o, r, ts] = await Promise.all([
      getCentTokenInfo(community),
      getCentMetrics(community),
      getOrderBook(community),
      getCentRichList(community), getTopStakes(community)
    ]);
    setToken(t);
    setMetrics(m);
    setOrderBook(o);
    setRichList(r);
    setTopStakes(ts.sort((a,b) => parseFloat(b.staked_tokens) - parseFloat(a.staked_tokens)).slice(0, 10));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [community]);

  const handleAiAnalysis = async () => {
    if (!token || !metrics) return;
    setAnalyzing(true);
    const result = await analyzeTokenData(token, metrics);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-cent">
        <RefreshCw className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!token || !metrics) {
    return <div className="p-8 text-center text-red-500">{t('dashboard.errorData')} {community}.</div>;
  }

  const priceChange = parseFloat(metrics.priceChangePercent);
  const isPositive = priceChange >= 0;

  // Prepared data for charts
  const depthData = [
    ...orderBook.buy.slice(0, 10).map(o => ({ type: 'Bid', price: parseFloat(o.price), amount: parseFloat(o.quantity), account: o.account })).reverse(),
    ...orderBook.sell.slice(0, 10).map(o => ({ type: 'Ask', price: parseFloat(o.price), amount: parseFloat(o.quantity), account: o.account }))
  ];

  const richListData = richList.slice(0, 5).map(b => ({
    name: b.account,
    value: parseFloat(b.balance)
  }));

  const meta = JSON.parse(token.metadata || "{}");
  // Security fix: Sanitize external URL from metadata
  const iconUrl = sanitizeUrl(meta.icon) || "https://picsum.photos/200";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-card p-6 rounded-2xl shadow-lg border border-slate-700/50">
        <div className="flex items-center gap-4">
          <img src={iconUrl} alt={`${community} Logo`} className="w-16 h-16 rounded-full border-2 border-cent shadow-[0_0_15px_rgba(74,222,128,0.3)]" />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{token.name} <span className="text-cent">({token.symbol})</span></h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">{meta.desc || t('dashboard.tokenDesc')}</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <div className="text-4xl font-mono font-bold text-white">{parseFloat(metrics.lastPrice).toFixed(5)} <span className="text-sm text-slate-400">HIVE</span></div>
          <div className={`flex items-center justify-end gap-1 font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            <span>{metrics.priceChangePercent} (24h)</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title={t('dashboard.volume')} value={`${parseFloat(metrics.volume).toFixed(2)} HIVE`} icon={<Activity className="text-blue-400" />} />
        <MetricCard title={t('dashboard.circSupply')} value={`${parseInt(token.circulatingSupply).toLocaleString()} ${community}`} icon={<Users className="text-purple-400" />} />
        <MetricCard title={t('dashboard.highestBid')} value={metrics.highestBid} icon={<TrendingUp className="text-green-400" />} />
        <MetricCard title={t('dashboard.lowestAsk')} value={metrics.lowestAsk} icon={<TrendingDown className="text-red-400" />} />
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BrainCircuit size={100} />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2 mb-4">
            <BrainCircuit /> {t('dashboard.aiTitle')}
          </h2>
          {!isGeminiAvailable() ? (
            <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <BrainCircuit size={20} className="text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-300 text-sm font-medium">{t('dashboard.aiNotConfigured')}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {t('dashboard.aiConfigDesc')} <code className="bg-slate-700 px-1 rounded text-indigo-300">GEMINI_API_KEY</code> {t('dashboard.inEnvironment')}
                </p>
              </div>
            </div>
          ) : (
            <>
              {aiAnalysis ? (
                <div className="prose max-w-none text-slate-300 prose-headings:text-white prose-p:text-slate-300 prose-a:text-cent hover:prose-a:text-white prose-strong:text-white text-sm leading-relaxed whitespace-pre-line bg-black/20 p-4 rounded-xl border border-white/5">
                  {aiAnalysis}
                </div>
              ) : (
                <div className="text-slate-400 text-sm">
                  {t('dashboard.aiPrompt')}
                </div>
              )}
              <button 
                onClick={handleAiAnalysis} 
                disabled={analyzing}
                className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {analyzing ? <RefreshCw className="animate-spin" size={16}/> : <BrainCircuit size={16}/>}
                {analyzing ? t('dashboard.analyzing') : t('dashboard.generateInsights')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Market Depth / Order Book Visual */}
        <div className="bg-card p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-cent" /> {t('dashboard.marketDepth')}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depthData}>
                <XAxis dataKey="price" stroke="#64748B" fontSize={12} tickFormatter={(val) => val.toFixed(4)} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#4ADE80">
                  {depthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'Bid' ? '#4ADE80' : '#F87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs font-mono">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-400 rounded-sm"></div> {t('dashboard.bids')}</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-sm"></div> {t('dashboard.asks')}</div>
          </div>
        </div>

        {/* Rich List */}
        <div className="bg-card p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-purple-400" /> {t('dashboard.topHolders')}
          </h3>
          <div className="flex flex-col md:flex-row items-center">
            <div className="h-64 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={richListData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {richListData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#4ADE80', '#3B82F6', '#A855F7', '#F472B6', '#FACC15'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3 mt-4 md:mt-0">
              {richList.slice(0, 5).map((holder, idx) => (
                <div key={holder.account} className="flex justify-between items-center text-sm p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono">#{idx + 1}</span>
                    <span className="font-medium text-slate-200">{holder.account}</span>
                  </div>
                  <span className="text-slate-400 font-mono">{parseFloat(holder.balance).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Stakes */}
        <div className="bg-card p-6 rounded-2xl border border-slate-700/50 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-400" /> Top Stakes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">{t('dashboard.rank')}</th>
                  <th className="px-4 py-3">{t('dashboard.account')}</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">{t('dashboard.stakedTokens')}</th>
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
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-card p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <span className="text-slate-400 text-sm font-medium">{title}</span>
      <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
    </div>
    <div className="text-xl font-bold text-white font-mono">{value}</div>
  </div>
);

export default Dashboard;