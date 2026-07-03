import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getVotingPower } from '../services/hiveEngineService';
import { HivePost } from '../types';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: HivePost | null;
  username: string;
  token: string;
  onVote: (weight: number) => void;
}

const VoteModal: React.FC<VoteModalProps> = ({ isOpen, onClose, post, username, token, onVote }) => {
  const { t } = useLanguage();
  const [weight, setWeight] = useState<number>(100); // 1 to 100
  const [isDownvote, setIsDownvote] = useState<boolean>(false);
  const [vpData, setVpData] = useState<any>(null);
  const [loadingVp, setLoadingVp] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && username && token) {
      fetchVp();
    }
  }, [isOpen, username, token]);

  const fetchVp = async () => {
    setLoadingVp(true);
    try {
      const data = await getVotingPower(username, token);
      setVpData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVp(false);
    }
  };

  if (!isOpen || !post) return null;

  const calculateCurrentVp = (power: number, lastVoteTime: number, regenerationDays: number) => {
    const elapsedSeconds = (Date.now() - lastVoteTime) / 1000;
    const regenerated = (elapsedSeconds * 10000) / (regenerationDays * 86400);
    return Math.min(10000, power + regenerated) / 100;
  };

  let currentUpVp = 100;
  let currentDownVp = 100;

  if (vpData) {
    // We assume regenerationDays is 5 for now as we don't have the config here easily, 
    // but typically it's 5 days for upvote and downvote
    currentUpVp = calculateCurrentVp(vpData.votingPower || 10000, vpData.lastVoteTimestamp, 5);
    currentDownVp = calculateCurrentVp(vpData.downvotingPower || 10000, vpData.lastVoteTimestamp, 5);
  }

  const handleVoteSubmit = () => {
    const finalWeight = isDownvote ? -Math.abs(weight) * 100 : Math.abs(weight) * 100;
    onVote(finalWeight);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            Vote
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 space-y-6">
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setIsDownvote(false)}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors ${!isDownvote ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <ArrowUpCircle size={18} /> Upvote
            </button>
            <button 
              onClick={() => setIsDownvote(true)}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors ${isDownvote ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <ArrowDownCircle size={18} /> Downvote
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium text-slate-300">
              <span>{t('voteModal.weight')}: {weight}%</span>
              <span className={isDownvote ? 'text-red-400' : 'text-green-400'}>
                {isDownvote ? '-' : '+'}{(weight * 100).toLocaleString()}
              </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDownvote ? 'accent-red-500 bg-red-900/30' : 'accent-green-500 bg-green-900/30'}`}
            />
            <div className="flex justify-between gap-2">
              {[1, 25, 50, 75, 100].map(v => (
                <button 
                  key={v}
                  onClick={() => setWeight(v)}
                  className={`flex-1 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 transition-colors ${weight === v ? (isDownvote ? 'text-red-400 ring-1 ring-red-400/50' : 'text-green-400 ring-1 ring-green-400/50') : 'text-slate-400'}`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">{t('voteModal.votingPower', { token })}</span>
                {loadingVp ? <Loader2 size={14} className="animate-spin text-slate-500" /> : null}
             </div>
             {vpData ? (
                <div className="space-y-2">
                   <div>
                     <div className="flex justify-between text-xs text-slate-400 mb-1">
                       <span>{t('voteModal.upvotePower')}</span>
                       <span className="font-mono text-green-400">{currentUpVp.toFixed(2)}%</span>
                     </div>
                     <div className="w-full bg-slate-900 rounded-full h-1.5">
                       <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, currentUpVp)}%` }}></div>
                     </div>
                   </div>
                   <div>
                     <div className="flex justify-between text-xs text-slate-400 mb-1">
                       <span>{t('voteModal.downvotePower')}</span>
                       <span className="font-mono text-red-400">{currentDownVp.toFixed(2)}%</span>
                     </div>
                     <div className="w-full bg-slate-900 rounded-full h-1.5">
                       <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, currentDownVp)}%` }}></div>
                     </div>
                   </div>
                </div>
             ) : (
                <p className="text-xs text-slate-500">
                  {loadingVp ? t('voteModal.loading') : t('voteModal.notFound')}
                </p>
             )}
          </div>

          <button 
            onClick={handleVoteSubmit}
            className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${isDownvote ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isDownvote ? t('voteModal.confirmDownvote') : t('voteModal.confirmUpvote')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
