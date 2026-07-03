import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCommunity } from '../contexts/CommunityContext';
import { getMarketPools, getUserPoolShares, getUserBalance, getPoolHolders, getUserBalances, clearApiCache } from '../services/hiveEngineService';
import { 
  ArrowLeftRight, 
  Droplets, 
  Plus, 
  Minus, 
  Coins, 
  Loader2, 
  Info, 
  RefreshCw, 
  Sliders, 
  AlertCircle, 
  TrendingUp, 
  Wallet,
  ArrowRight,
  Users
} from 'lucide-react';

interface Pool {
  tokenPair: string;
  baseQuantity: string;
  quoteQuantity: string;
  baseVolume: string;
  quoteVolume: string;
  basePrice: string;
  quotePrice: string;
  totalShares: string;
}

interface Share {
  tokenPair: string;
  account: string;
  shares: string;
}

const MarketPools: React.FC = () => {
  const { user, customJson } = useAuth();
  const { t } = useLanguage();
  const { community } = useCommunity(); // usually "BYTE"

  const [pools, setPools] = useState<Pool[]>([]);
  const [userShares, setUserShares] = useState<Share[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [poolHolders, setPoolHolders] = useState<Share[]>([]);
  const [loadingHolders, setLoadingHolders] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'swap' | 'add' | 'remove' | 'overview'>('swap');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  // Swap State
  const [swapFrom, setSwapFrom] = useState<string>('SWAP.HIVE');
  const [swapTo, setSwapTo] = useState<string>('BYTE');
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [estimatedOut, setEstimatedOut] = useState<string>('0.00');
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [slippage, setSlippage] = useState<number>(1.0); // 1.0%

  // Add Liquidity State
  const [addAmountA, setAddAmountA] = useState<string>('');
  const [addAmountB, setAddAmountB] = useState<string>('');
  
  // Remove Liquidity State
  const [removePercent, setRemovePercent] = useState<number>(50); // 50%

  // Fetch Pool and User Data
  const fetchData = async () => {
    setLoading(true);
    try {
      clearApiCache();
      // Fetch pools containing current community token (e.g. "BYTE")
      const marketPools = await getMarketPools(community);
      setPools(marketPools);

      // Set default selected pool
      if (marketPools.length > 0 && !selectedPool) {
        // Prefer BYTE:SWAP.HIVE or SWAP.HIVE:BYTE if exists
        const defaultPool = marketPools.find(p => p.tokenPair.includes('SWAP.HIVE')) || marketPools[0];
        setSelectedPool(defaultPool);
      }

      if (user) {
        // Fetch user pool shares
        const shares = await getUserPoolShares(user, community);
        setUserShares(shares);

        const allUserBalances = await getUserBalances(user);
        const newBalances: Record<string, string> = {};
        allUserBalances.forEach(b => {
          newBalances[b.symbol] = b.balance;
        });
        setBalances(newBalances);
      }
    } catch (e) {
      console.error("Error fetching pools data:", e);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      clearApiCache();
      const marketPools = await getMarketPools(community);
      setPools(marketPools);
      
      if (selectedPool) {
         const updatedSelected = marketPools.find(p => p.tokenPair === selectedPool.tokenPair);
         if (updatedSelected) setSelectedPool(updatedSelected);
      }

      if (user) {
        const shares = await getUserPoolShares(user, community);
        setUserShares(shares);
        const allUserBalances = await getUserBalances(user);
        const newBalances: Record<string, string> = {};
        allUserBalances.forEach(b => {
          newBalances[b.symbol] = b.balance;
        });
        setBalances(newBalances);
      }
    } catch (e) {
      console.error("Error refreshing data:", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [user, community]);

  // Handle Pool Selection change
  useEffect(() => {
    if (selectedPool) {
      const [tokenA, tokenB] = selectedPool.tokenPair.split(':');
      if (swapFrom === tokenA) {
        setSwapTo(tokenB);
      } else if (swapFrom === tokenB) {
        setSwapTo(tokenA);
      } else {
        setSwapFrom(tokenA);
        setSwapTo(tokenB);
      }

      if (activeTab === 'overview') {
        fetchHolders(selectedPool.tokenPair);
      }
    }
  }, [selectedPool]);

  useEffect(() => {
    if (activeTab === 'overview' && selectedPool) {
      fetchHolders(selectedPool.tokenPair);
    }
  }, [activeTab]);

  const fetchHolders = async (pair: string) => {
    setLoadingHolders(true);
    try {
      const holders = await getPoolHolders(pair);
      setPoolHolders(holders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHolders(false);
    }
  };

  // Recalculate Swap outputs
  useEffect(() => {
    if (!selectedPool || !swapAmount || isNaN(parseFloat(swapAmount))) {
      setEstimatedOut('0.00');
      setPriceImpact(0);
      return;
    }

    const input = parseFloat(swapAmount);
    if (input <= 0) {
      setEstimatedOut('0.00');
      setPriceImpact(0);
      return;
    }

    const [tokenA, tokenB] = selectedPool.tokenPair.split(':');
    const isFromBase = swapFrom === tokenA;

    const baseQty = parseFloat(selectedPool.baseQuantity);
    const quoteQty = parseFloat(selectedPool.quoteQuantity);

    // X is the pool of From token, Y is the pool of To token
    const x = isFromBase ? baseQty : quoteQty;
    const y = isFromBase ? quoteQty : baseQty;

    // Swap fee is 0.25% in Hive Engine marketpools
    const fee = 0.0025;
    const inputAfterFee = input * (1 - fee);

    // Constant product formula: (x + dx) * (y - dy) = x * y
    // dy = (y * dx) / (x + dx)
    const output = (y * inputAfterFee) / (x + inputAfterFee);
    setEstimatedOut(output.toFixed(8));

    // Price Impact = (1 - (actualRate / originalRate)) * 100
    // originalRate = y / x
    // actualRate = output / input
    const originalRate = y / x;
    const actualRate = output / input;
    const impact = Math.max(0, (1 - (actualRate / originalRate)) * 100);
    setPriceImpact(impact);

  }, [swapAmount, swapFrom, swapTo, selectedPool]);

  // Auto calculate add liquidity ratio
  const handleAddAmountAChange = (val: string) => {
    setAddAmountA(val);
    if (!selectedPool || !val || isNaN(parseFloat(val))) {
      setAddAmountB('');
      return;
    }

    const amtA = parseFloat(val);
    const baseQty = parseFloat(selectedPool.baseQuantity);
    const quoteQty = parseFloat(selectedPool.quoteQuantity);

    if (baseQty > 0) {
      const amtB = amtA * (quoteQty / baseQty);
      setAddAmountB(amtB.toFixed(8));
    }
  };

  const handleAddAmountBChange = (val: string) => {
    setAddAmountB(val);
    if (!selectedPool || !val || isNaN(parseFloat(val))) {
      setAddAmountA('');
      return;
    }

    const amtB = parseFloat(val);
    const baseQty = parseFloat(selectedPool.baseQuantity);
    const quoteQty = parseFloat(selectedPool.quoteQuantity);

    if (quoteQty > 0) {
      const amtA = amtB * (baseQty / quoteQty);
      setAddAmountA(amtA.toFixed(8));
    }
  };

  const getPrecision = (token: string, pool: Pool) => {
    if (token === 'BYTE') return 0;
    if (token === 'NEWS') return 3;
    const [tokenA] = pool.tokenPair.split(':');
    return token === tokenA ? (pool.baseQuantity.split('.')[1]?.length || 8) : (pool.quoteQuantity.split('.')[1]?.length || 8);
  };

  // Perform Swap Action
  const handleSwapSubmit = async () => {
    if (!user) return alert("Por favor, faça login para negociar.");
    if (!selectedPool) return;
    
    const amt = parseFloat(swapAmount);
    if (isNaN(amt) || amt <= 0) return alert("Insira um valor válido.");

    const balanceAvailable = parseFloat(balances[swapFrom] || '0');
    if (amt > balanceAvailable) {
      return alert(t('pools.insufficientBalanceExt', { token: swapFrom, balance: balanceAvailable }));
    }

    const minOut = parseFloat(estimatedOut) * (1 - slippage / 100);

    const [tokenA, tokenB] = selectedPool.tokenPair.split(':');
    const pFrom = getPrecision(swapFrom, selectedPool);
    const pTo = getPrecision(swapTo, selectedPool);

    const factorFrom = Math.pow(10, pFrom);
    const formattedAmt = (Math.floor(amt * factorFrom) / factorFrom).toFixed(pFrom);
    
    const factorTo = Math.pow(10, pTo);
    const formattedMinOut = (Math.floor(minOut * factorTo) / factorTo).toFixed(pTo);

    setActionLoading(true);

    const jsonPayload = {
      contractName: "marketpools",
      contractAction: "swapTokens",
      contractPayload: {
        tokenPair: selectedPool.tokenPair,
        tokenSymbol: swapFrom,
        tokenAmount: formattedAmt,
        tradeType: "exactInput",
        minAmountOut: formattedMinOut
      }
    };

    try {
      const res = await customJson('ssc-mainnet-hive', jsonPayload, `Swap de ${swapFrom} para ${swapTo}`, 'Active');
      if (res.success) {
        alert(t('pools.successSwap'));
        setSwapAmount('');
        setTimeout(refreshData, 3000);
        setTimeout(refreshData, 6000);
        setTimeout(refreshData, 10000);
      } else {
        alert("Erro no Swap: " + res.msg);
      }
    } catch (err: any) {
      console.error(err);
      alert("Ocorreu um erro: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Add Liquidity Action
  const handleAddLiquiditySubmit = async () => {
    if (!user) return alert(t('pools.loginToAdd'));
    if (!selectedPool) return;

    const amtA = parseFloat(addAmountA);
    const amtB = parseFloat(addAmountB);

    if (isNaN(amtA) || amtA <= 0 || isNaN(amtB) || amtB <= 0) {
      return alert("Insira valores válidos para ambos os tokens.");
    }

    const [tokenA, tokenB] = selectedPool.tokenPair.split(':');
    const balA = parseFloat(balances[tokenA] || '0');
    const balB = parseFloat(balances[tokenB] || '0');

    if (amtA > balA) return alert(t('pools.insufficientBalance', { token: tokenA }));
    if (amtB > balB) return alert(t('pools.insufficientBalance', { token: tokenB }));

    const pA = getPrecision(tokenA, selectedPool);
    const pB = getPrecision(tokenB, selectedPool);

    const factorA = Math.pow(10, pA);
    const formattedA = (Math.floor(amtA * factorA) / factorA).toFixed(pA);

    const factorB = Math.pow(10, pB);
    const formattedB = (Math.floor(amtB * factorB) / factorB).toFixed(pB);

    setActionLoading(true);

    const jsonPayload = {
      contractName: "marketpools",
      contractAction: "addLiquidity",
      contractPayload: {
        tokenPair: selectedPool.tokenPair,
        baseQuantity: formattedA,
        quoteQuantity: formattedB
      }
    };

    try {
      const res = await customJson('ssc-mainnet-hive', jsonPayload, `Adicionar Liquidez ao par ${selectedPool.tokenPair}`, 'Active');
      if (res.success) {
        alert("Transação enviada com sucesso! Atualizando dados em alguns segundos...");
        setAddAmountA('');
        setAddAmountB('');
        setTimeout(() => {
          fetchData();
        }, 4000);
      } else {
        alert(t('pools.errorAdd') + res.msg);
      }
    } catch (err: any) {
      console.error(err);
      alert("Ocorreu um erro: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Remove Liquidity Action
  const handleRemoveLiquiditySubmit = async () => {
    if (!user) return alert(t('pools.loginToRemove'));
    if (!selectedPool) return;

    const shareInfo = userShares.find(s => s.tokenPair === selectedPool.tokenPair);
    if (!shareInfo || parseFloat(shareInfo.shares) <= 0) {
      return alert("Você não possui participação nesta pool.");
    }

    const userTotalShares = parseFloat(shareInfo.shares);
    const sharesToRemove = (userTotalShares * removePercent) / 100;

    if (sharesToRemove <= 0) return alert("Selecione um percentual válido.");

    setActionLoading(true);

    const jsonPayload = {
      contractName: "marketpools",
      contractAction: "removeLiquidity",
      contractPayload: {
        tokenPair: selectedPool.tokenPair,
        sharesOut: removePercent.toString()
      }
    };

    try {
      const res = await customJson('ssc-mainnet-hive', jsonPayload, `Remover Liquidez do par ${selectedPool.tokenPair}`, 'Active');
      if (res.success) {
        alert("Transação enviada com sucesso! Atualizando dados em alguns segundos...");
        setTimeout(() => {
          fetchData();
        }, 4000);
      } else {
        alert(t('pools.errorRemove') + res.msg);
      }
    } catch (err: any) {
      console.error(err);
      alert("Ocorreu um erro: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Get current user share details
  const getPoolUserShareDetails = (pool: Pool) => {
    const share = userShares.find(s => s.tokenPair === pool.tokenPair);
    if (!share) return null;

    const userSharesAmt = parseFloat(share.shares);
    const totalSharesAmt = parseFloat(pool.totalShares);
    
    if (totalSharesAmt <= 0 || userSharesAmt <= 0) return null;

    const proportion = userSharesAmt / totalSharesAmt;
    const baseAmt = parseFloat(pool.baseQuantity) * proportion;
    const quoteAmt = parseFloat(pool.quoteQuantity) * proportion;

    const [tokenA, tokenB] = pool.tokenPair.split(':');

    return {
      shares: userSharesAmt.toFixed(6),
      proportion: (proportion * 100).toFixed(4) + '%',
      baseAmount: baseAmt.toFixed(4) + ' ' + tokenA,
      quoteAmount: quoteAmt.toFixed(4) + ' ' + tokenB
    };
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 p-8 opacity-5 pointer-events-none">
          <Droplets size={180} className="text-cent" />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-cent/10 rounded-xl border border-cent/20">
             <Droplets size={36} className="text-cent" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t("pools.title")}</h1>
            <p className="text-slate-400 text-sm">{t("pools.subtitle")} <span className="font-bold text-cent">{community}</span>.</p>
          </div>
        </div>

        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-lg text-slate-300 hover:text-white transition-all text-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? t('pools.refreshing') : t('pools.refresh')}
        </button>
      </div>

      {pools.length === 0 && !loading ? (
        <div className="bg-card p-12 text-center rounded-2xl border border-slate-700/50 flex flex-col items-center">
           <AlertCircle size={48} className="text-slate-500 mb-3" />
           <p className="text-slate-400">{t("pools.noPools")} {community}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Pools Sidebar Selector */}
          <div className="space-y-4 md:col-span-1">
             <div className="bg-card p-4 rounded-xl border border-slate-700/50 shadow-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">{t("pools.availablePools")}</h3>
                <div className="space-y-2">
                   {pools.map(pool => {
                      const [tokenA, tokenB] = pool.tokenPair.split(':');
                      const isSelected = selectedPool?.tokenPair === pool.tokenPair;
                      const userShare = getPoolUserShareDetails(pool);
                      return (
                         <button
                           key={pool.tokenPair}
                           onClick={() => setSelectedPool(pool)}
                           className={`w-full text-left p-3.5 rounded-xl transition-all border flex flex-col gap-2 ${
                             isSelected 
                             ? 'bg-cent/10 border-cent text-white' 
                             : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                           }`}
                         >
                            <div className="flex items-center justify-between w-full">
                               <span className="font-bold text-sm">{tokenA} / {tokenB}</span>
                               <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono border border-slate-700/50">
                                 1 {tokenA} = {parseFloat(pool.basePrice).toFixed(6)} {tokenB}
                               </span>
                            </div>
                            
                            <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                               <span>TVL: {parseFloat(pool.baseQuantity).toLocaleString(undefined, {maximumFractionDigits: 0})} {tokenA}</span>
                               <span>/ {parseFloat(pool.quoteQuantity).toLocaleString(undefined, {maximumFractionDigits: 0})} {tokenB}</span>
                            </div>

                            {userShare && (
                              <div className="mt-1 pt-1 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-cent font-medium">
                                 <span>{t('pools.yourShareText')} {userShare.proportion}</span>
                                 <span>{t('pools.myLiquidity')}</span>
                              </div>
                            )}
                         </button>
                      );
                   })}
                </div>
             </div>

             {/* User Balances Card */}
             {user && (
               <div className="bg-card p-4 rounded-xl border border-slate-700/50 shadow-md">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1 flex items-center gap-1.5">
                    <Wallet size={12} className="text-cent" /> {t("pools.yourBalances")}
                 </h3>
                 <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                       <span className="font-bold text-slate-300">{community}</span>
                       <span className="font-semibold text-white">{parseFloat(balances[community] || '0').toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                       <span className="font-bold text-slate-300">SWAP.HIVE</span>
                       <span className="font-semibold text-white">{parseFloat(balances['SWAP.HIVE'] || '0').toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</span>
                    </div>
                 </div>
               </div>
             )}
          </div>

          {/* Interactive Interface (Swap / Add / Remove) */}
          <div className="md:col-span-2 space-y-4">
             {selectedPool && (
                <div className="bg-card rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                   
                   {/* Tabs bar */}
                   <div className="flex border-b border-slate-800 bg-slate-900/60 p-1">
                      <button
                        onClick={() => setActiveTab('swap')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'swap' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                         <ArrowLeftRight size={16} /> {t("pools.swapTab")}
                      </button>
                      <button
                        onClick={() => setActiveTab('add')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'add' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                         <Plus size={16} /> {t("pools.addTab")}
                      </button>
                      <button
                        onClick={() => setActiveTab('remove')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'remove' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                         <Minus size={16} /> {t("pools.removeTab")}
                      </button>
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                         <Info size={16} /> Statistics
                      </button>
                   </div>

                   {/* Tab Contents */}
                   <div className="p-6 sm:p-8">

                      {/* SWAP TAB */}
                      {activeTab === 'swap' && (
                         <div className="space-y-4">
                            {/* FROM Box */}
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative">
                               <div className="flex justify-between items-center mb-1 text-xs text-slate-400">
                                  <span>{t("pools.from")}</span>
                                  {user && (
                                     <div className="flex items-center gap-3">
                                       <button onClick={refreshData} title={t('pools.refreshBalances')} className="text-slate-500 hover:text-white transition-colors">
                                          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                                       </button>
                                       <button 
                                         onClick={() => setSwapAmount(balances[swapFrom] || '0')}
                                         className="hover:text-cent transition-colors"
                                       >
                                          {t('pools.balance')} <span className="font-mono">{parseFloat(balances[swapFrom] || '0').toFixed(4)}</span> (MAX)
                                       </button>
                                     </div>
                                  )}
                               </div>
                               <div className="flex items-center gap-3">
                                  <input 
                                    type="number"
                                    value={swapAmount}
                                    onChange={(e) => setSwapAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-transparent border-0 text-2xl font-bold text-white focus:outline-none focus:ring-0 w-full font-mono p-0"
                                    disabled={actionLoading}
                                  />
                                  <select
                                    value={swapFrom}
                                    onChange={(e) => {
                                      const nextFrom = e.target.value;
                                      const [tokenA, tokenB] = selectedPool.tokenPair.split(':');
                                      setSwapFrom(nextFrom);
                                      setSwapTo(nextFrom === tokenA ? tokenB : tokenA);
                                    }}
                                    className="bg-slate-800 border border-slate-700 text-white font-bold rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                                    disabled={actionLoading}
                                  >
                                     {selectedPool.tokenPair.split(':').map(t => (
                                        <option key={t} value={t}>{t}</option>
                                     ))}
                                  </select>
                               </div>
                            </div>

                            {/* Middle Switch Icon */}
                            <div className="flex justify-center -my-2.5 relative z-10">
                               <button 
                                 onClick={() => {
                                    const prevFrom = swapFrom;
                                    setSwapFrom(swapTo);
                                    setSwapTo(prevFrom);
                                    setSwapAmount('');
                                 }}
                                 className="bg-slate-800 p-2 border border-slate-700 hover:border-cent hover:text-cent text-slate-400 rounded-full transition-all shadow-md"
                               >
                                  <ArrowLeftRight size={16} className="rotate-90" />
                               </button>
                            </div>

                            {/* TO Box */}
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                               <div className="flex justify-between items-center mb-1 text-xs text-slate-400">
                                  <span>{t("pools.to")}</span>
                                  {user && (
                                     <div className="flex items-center gap-3">
                                       <button onClick={refreshData} title={t('pools.refreshBalances')} className="text-slate-500 hover:text-white transition-colors">
                                          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                                       </button>
                                       <span className="font-mono text-slate-500">
                                          {t('pools.balance')} {parseFloat(balances[swapTo] || '0').toFixed(4)}
                                       </span>
                                     </div>
                                  )}
                               </div>
                               <div className="flex items-center justify-between gap-3">
                                  <div className="text-2xl font-bold text-slate-300 font-mono py-0.5 select-all">
                                     {estimatedOut}
                                  </div>
                                  <div className="bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg px-4 py-1.5 text-sm">
                                     {swapTo}
                                  </div>
                               </div>
                            </div>

                            {/* Slippage Settings */}
                            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                               <span className="flex items-center gap-1">
                                  <Sliders size={13} /> {t('pools.slippage')}
                               </span>
                               <div className="flex items-center gap-1.5">
                                  {[0.5, 1.0, 2.0].map(s => (
                                     <button
                                       key={s}
                                       onClick={() => setSlippage(s)}
                                       className={`px-2 py-0.5 rounded font-bold font-mono ${slippage === s ? 'bg-cent text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                                     >
                                        {s}%
                                     </button>
                                  ))}
                               </div>
                            </div>

                            {/* Calculations Table */}
                            {parseFloat(swapAmount) > 0 && (
                              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
                                 <div className="flex justify-between items-center text-slate-400">
                                    <span>{t("pools.swapFee")}</span>
                                    <span>{(parseFloat(swapAmount) * 0.0025).toFixed(6)} {swapFrom}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-slate-400">
                                    <span>{t("pools.minReturn")}</span>
                                    <span className="text-white">{(parseFloat(estimatedOut) * (1 - slippage / 100)).toFixed(6)} {swapTo}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-slate-400">
                                    <span>{t("pools.priceImpact")}</span>
                                    <span className={`font-bold ${priceImpact > 5 ? 'text-red-400' : priceImpact > 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                                       {priceImpact.toFixed(3)}%
                                    </span>
                                 </div>
                                 <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-slate-800/80">
                                    <span>{t("pools.estimatedPrice")}</span>
                                    <span className="text-slate-300">1 {swapFrom} ≈ {(parseFloat(estimatedOut)/parseFloat(swapAmount)).toFixed(6)} {swapTo}</span>
                                 </div>
                              </div>
                            )}

                            {/* Submit Button */}
                            <button
                              onClick={handleSwapSubmit}
                              disabled={actionLoading || !swapAmount || parseFloat(swapAmount) <= 0 || (user && parseFloat(swapAmount) > parseFloat(balances[swapFrom] || '0'))}
                              className="w-full py-4 bg-cent hover:bg-green-400 disabled:bg-slate-800 text-slate-900 disabled:text-slate-500 font-bold text-base rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                            >
                               {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeftRight size={18} />}
                               {actionLoading ? t('pools.processingSwap') : 
                                 (!user ? t('pools.loginToSwap') : 
                                  parseFloat(swapAmount) > parseFloat(balances[swapFrom] || '0') ? t('pools.insufficientBalance', { token: swapFrom }) :
                                  `${t("pools.executeSwap")} (${swapFrom} → ${swapTo})`)}
                            </button>
                            <p className="text-[10px] text-slate-500 text-center">
                              {t('pools.disclaimer')}
                            </p>
                         </div>
                      )}

                      {/* ADD LIQUIDITY TAB */}
                      {activeTab === 'add' && (
                         <div className="space-y-5">
                            <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl flex gap-3 text-xs text-slate-400">
                               <Info size={18} className="text-cent shrink-0" />
                               <p>
                                 {t('pools.addLiquidityInfo')}
                               </p>
                            </div>

                            {/* Token A Input */}
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                               <div className="flex justify-between items-center mb-1 text-xs text-slate-400">
                                  <span>{t('pools.addToken')} {selectedPool.tokenPair.split(':')[0]}</span>
                                  {user && (
                                     <button 
                                       onClick={() => handleAddAmountAChange(balances[selectedPool.tokenPair.split(':')[0]] || '0')}
                                       className="hover:text-cent transition-colors"
                                     >
                                        {t('pools.balance')} <span className="font-mono">{parseFloat(balances[selectedPool.tokenPair.split(':')[0]] || '0').toFixed(4)}</span> (MAX)
                                     </button>
                                  )}
                               </div>
                               <div className="flex items-center gap-3">
                                  <input 
                                    type="number"
                                    value={addAmountA}
                                    onChange={(e) => handleAddAmountAChange(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-transparent border-0 text-2xl font-bold text-white focus:outline-none w-full font-mono p-0"
                                    disabled={actionLoading}
                                  />
                                  <div className="bg-slate-800 text-white font-bold rounded-lg px-4 py-1.5 text-sm">
                                     {selectedPool.tokenPair.split(':')[0]}
                                  </div>
                               </div>
                            </div>

                            {/* Plus Icon */}
                            <div className="flex justify-center -my-3 relative z-10">
                               <div className="bg-slate-800 p-2 border border-slate-700 text-cent rounded-full shadow-md">
                                  <Plus size={16} />
                               </div>
                            </div>

                            {/* Token B Input */}
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                               <div className="flex justify-between items-center mb-1 text-xs text-slate-400">
                                  <span>{t('pools.addToken')} {selectedPool.tokenPair.split(':')[1]} {t('pools.calculated')}</span>
                                  {user && (
                                     <button 
                                       onClick={() => handleAddAmountBChange(balances[selectedPool.tokenPair.split(':')[1]] || '0')}
                                       className="hover:text-cent transition-colors"
                                     >
                                        {t('pools.balance')} <span className="font-mono">{parseFloat(balances[selectedPool.tokenPair.split(':')[1]] || '0').toFixed(4)}</span> (MAX)
                                     </button>
                                  )}
                               </div>
                               <div className="flex items-center gap-3">
                                  <input 
                                    type="number"
                                    value={addAmountB}
                                    onChange={(e) => handleAddAmountBChange(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-transparent border-0 text-2xl font-bold text-white focus:outline-none w-full font-mono p-0"
                                    disabled={actionLoading}
                                  />
                                  <div className="bg-slate-800 text-white font-bold rounded-lg px-4 py-1.5 text-sm">
                                     {selectedPool.tokenPair.split(':')[1]}
                                  </div>
                               </div>
                            </div>

                            {/* Ratio indicator */}
                            <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-xl text-xs flex justify-between items-center font-mono text-slate-400">
                               <span>{t("pools.marketRatio")}</span>
                               <span>
                                  1 {selectedPool.tokenPair.split(':')[0]} = {parseFloat(selectedPool.basePrice).toFixed(6)} {selectedPool.tokenPair.split(':')[1]}
                               </span>
                            </div>

                            {/* Submit Button */}
                            <button
                              onClick={handleAddLiquiditySubmit}
                              disabled={actionLoading || !addAmountA || !addAmountB}
                              className="w-full py-4 bg-cent hover:bg-green-400 disabled:bg-slate-800 text-slate-900 disabled:text-slate-500 font-bold text-base rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                            >
                               {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                               {actionLoading ? t('pools.processingAdd') : t('pools.addLiquidity')}
                            </button>
                         </div>
                      )}

                      {/* REMOVE LIQUIDITY TAB */}
                      {activeTab === 'remove' && (
                         <div className="space-y-6">
                            {(() => {
                               const details = getPoolUserShareDetails(selectedPool);
                               if (!details) {
                                  return (
                                     <div className="bg-slate-900/40 p-12 text-center rounded-2xl border border-slate-800 flex flex-col items-center">
                                        <AlertCircle size={36} className="text-slate-500 mb-2" />
                                        <h4 className="text-white font-bold text-sm">{t("pools.noSharesTitle")}</h4>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm">{t("pools.noSharesDesc", { pair: selectedPool.tokenPair })}</p>
                                     </div>
                                  );
                               }

                               return (
                                  <div className="space-y-5">
                                     {/* Info Card */}
                                     <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                                        <div className="flex justify-between items-center text-slate-400">
                                           <span>{t("pools.yourLpBalance")}</span>
                                           <span className="text-white font-bold">{details.shares}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                           <span>{t("pools.yourPoolShare")}</span>
                                           <span className="text-cent font-bold">{details.proportion}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                                           <div className="text-[11px] text-slate-500">{t("pools.approxValues")}</div>
                                           <div className="flex justify-between text-white text-xs font-semibold">
                                              <span>{selectedPool.tokenPair.split(':')[0]}</span>
                                              <span>{details.baseAmount}</span>
                                           </div>
                                           <div className="flex justify-between text-white text-xs font-semibold">
                                              <span>{selectedPool.tokenPair.split(':')[1]}</span>
                                              <span>{details.quoteAmount}</span>
                                           </div>
                                        </div>
                                     </div>

                                     {/* Percentage Selector */}
                                     <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                           <span className="text-slate-400 font-medium">{t("pools.removePercentage")}</span>
                                           <span className="text-cent font-bold text-lg">{removePercent}%</span>
                                        </div>
                                        <input 
                                          type="range"
                                          min="1"
                                          max="100"
                                          value={removePercent}
                                          onChange={(e) => setRemovePercent(parseInt(e.target.value))}
                                          className="w-full accent-cent"
                                          disabled={actionLoading}
                                        />
                                        <div className="flex justify-between gap-2">
                                           {[25, 50, 75, 100].map(p => (
                                              <button
                                                key={p}
                                                onClick={() => setRemovePercent(p)}
                                                className={`flex-1 py-1 text-xs font-bold font-mono rounded border transition-colors ${removePercent === p ? 'bg-cent text-slate-900 border-cent' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}
                                              >
                                                 {p === 100 ? 'MÁXIMO' : p + '%'}
                                              </button>
                                           ))}
                                        </div>
                                     </div>

                                     {/* Estimated Returns */}
                                     {removePercent < 100 && (
                                        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-900 text-xs space-y-1.5 font-mono text-slate-400">
                                           <div className="text-slate-500">{t("pools.partialEstimate")}</div>
                                           <div className="flex justify-between">
                                              <span>{selectedPool.tokenPair.split(':')[0]}</span>
                                              <span className="text-white">{(parseFloat(details.baseAmount) * removePercent / 100).toFixed(4)} {selectedPool.tokenPair.split(':')[0]}</span>
                                           </div>
                                           <div className="flex justify-between">
                                              <span>{selectedPool.tokenPair.split(':')[1]}</span>
                                              <span className="text-white">{(parseFloat(details.quoteAmount) * removePercent / 100).toFixed(4)} {selectedPool.tokenPair.split(':')[1]}</span>
                                           </div>
                                        </div>
                                     )}

                                     {/* Submit Button */}
                                     <button
                                       onClick={handleRemoveLiquiditySubmit}
                                       disabled={actionLoading}
                                       className="w-full py-4 bg-red-500 hover:bg-red-400 text-slate-900 font-bold text-base rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                     >
                                        {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Minus size={18} />}
                                        {actionLoading ? 'Processando Retirada...' : t('pools.removePercent', { percent: removePercent })}
                                     </button>
                                  </div>
                               );
                            })()}
                         </div>
                      )}

                      {/* OVERVIEW STATS TAB */}
                      {activeTab === 'overview' && (
                         <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl space-y-1">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">{t('pools.reserveOf')} {selectedPool.tokenPair.split(':')[0]}</span>
                                  <div className="text-lg font-bold text-white font-mono">
                                     {parseFloat(selectedPool.baseQuantity).toLocaleString(undefined, {minimumFractionDigits: 4})}
                                  </div>
                               </div>
                               <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl space-y-1">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">{t('pools.reserveOf')} {selectedPool.tokenPair.split(':')[1]}</span>
                                  <div className="text-lg font-bold text-white font-mono">
                                     {parseFloat(selectedPool.quoteQuantity).toLocaleString(undefined, {minimumFractionDigits: 4})}
                                  </div>
                               </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                               <h4 className="text-sm font-semibold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                                  <TrendingUp size={16} className="text-cent" /> {t('pools.priceIndicators')}
                               </h4>
                               <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                                  <div className="space-y-1.5">
                                     <div className="text-slate-500">1 {selectedPool.tokenPair.split(':')[0]} vale:</div>
                                     <div className="text-white font-bold bg-slate-950 p-2 rounded text-center">
                                        {parseFloat(selectedPool.basePrice).toFixed(6)} {selectedPool.tokenPair.split(':')[1]}
                                     </div>
                                  </div>
                                  <div className="space-y-1.5">
                                     <div className="text-slate-500">1 {selectedPool.tokenPair.split(':')[1]} vale:</div>
                                     <div className="text-white font-bold bg-slate-950 p-2 rounded text-center">
                                        {parseFloat(selectedPool.quotePrice).toFixed(6)} {selectedPool.tokenPair.split(':')[0]}
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs text-slate-400">
                               <h4 className="text-sm font-semibold text-white font-sans mb-1">{t('pools.additionalInfo')}</h4>
                               <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                                  <span>{t('pools.totalSharesInfo')}</span>
                                  <span className="text-white font-bold">{parseFloat(selectedPool.totalShares).toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
                                </div>
                               <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                                  <span>Volume 24h ({selectedPool.tokenPair.split(':')[0]})</span>
                                  <span className="text-white">{parseFloat(selectedPool.baseVolume).toLocaleString()} {selectedPool.tokenPair.split(':')[0]}</span>
                               </div>
                               <div className="flex justify-between items-center py-1.5">
                                  <span>Volume 24h ({selectedPool.tokenPair.split(':')[1]})</span>
                                  <span className="text-white">{parseFloat(selectedPool.quoteVolume).toLocaleString()} {selectedPool.tokenPair.split(':')[1]}</span>
                               </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                               <h4 className="text-sm font-semibold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                                  <Users size={16} className="text-cent" /> {t('pools.liquidityProviders')}
                               </h4>
                               {loadingHolders ? (
                                  <div className="flex justify-center py-6">
                                     <Loader2 size={24} className="animate-spin text-cent" />
                                  </div>
                               ) : (
                                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                     {poolHolders.map((holder, idx) => {
                                        const shareAmt = parseFloat(holder.shares);
                                        const totalAmt = parseFloat(selectedPool.totalShares);
                                        const proportion = totalAmt > 0 ? (shareAmt / totalAmt) * 100 : 0;
                                        
                                        const baseAmt = parseFloat(selectedPool.baseQuantity) * (proportion / 100);
                                        const quoteAmt = parseFloat(selectedPool.quoteQuantity) * (proportion / 100);

                                        return (
                                           <div key={holder.account} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-xs">
                                              <div className="flex items-center gap-3">
                                                 <span className="text-slate-500 font-bold w-6">{idx + 1}.</span>
                                                 <span className="text-white font-bold">@{holder.account}</span>
                                              </div>
                                              <div className="flex flex-col items-end gap-1">
                                                <div className="text-cent font-bold">{proportion.toFixed(2)}% <span className="text-slate-500 font-normal ml-1">({shareAmt.toFixed(4)} Shares)</span></div>
                                                <div className="text-[10px] text-slate-400">
                                                   ≈ {baseAmt.toLocaleString(undefined, {maximumFractionDigits: 2})} {selectedPool.tokenPair.split(':')[0]} / {quoteAmt.toLocaleString(undefined, {maximumFractionDigits: 2})} {selectedPool.tokenPair.split(':')[1]}
                                                </div>
                                              </div>
                                           </div>
                                        );
                                     })}
                                     {poolHolders.length === 0 && (
                                        <div className="text-center text-slate-500 py-4 text-xs">Nenhum provedor encontrado.</div>
                                     )}
                                     {poolHolders.length > 0 && (
                                        <div className="text-center text-slate-500 py-3 text-[10px] border-t border-slate-800/60 mt-2">
                                           {t('pools.showingAllProviders', { count: poolHolders.length })}
                                        </div>
                                     )}
                                  </div>
                               )}
                            </div>
                         </div>
                      )}

                   </div>
                </div>
             )}
          </div>

        </div>
      )}

    </div>
  );
};

export default MarketPools;
