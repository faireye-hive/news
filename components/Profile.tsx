import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCommunity } from '../contexts/CommunityContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  getUserBalance, 
  scotFetch, 
  getUserDiscussions, 
  getPendingCuration, 
  getTribeInfo, 
  getAccountHistory,
  getAccountDetails,
  getFollowCount
} from '../services/hiveEngineService';
import { Balance, HivePost, TribeInfo } from '../types';
import { communityConfig } from '../config';
import { 
  User, 
  Coins, 
  TrendingUp, 
  HandCoins, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Loader2, 
  MessageCircle, 
  Heart, 
  ExternalLink, 
  Wallet, 
  UserPlus, 
  UserMinus, 
  ThumbsDown, 
  AlertCircle, 
  ArrowRightLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Users, 
  UserMinus2, 
  History,
  Award,
  BookOpen,
  CheckCircle2,
  MapPin,
  Calendar,
  Bookmark,
  Sparkles,
  Compass,
  Briefcase
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { sanitizeUrl } from '../utils/security';
import { extractImage } from '../utils/image';
import { VotersModal } from './VotersModal';
import VoteModal from './VoteModal';

const getReputation = (rep?: string | number) => {
  if (rep === undefined || rep === null) return '25';
  let repValue = Number(rep);
  if (isNaN(repValue) || repValue === 0) return '25';
  let neg = repValue < 0;
  let repLog = Math.log10(Math.abs(repValue));
  repLog = Math.max(repLog - 9, 0);
  let repFormatted = repLog * 9 + 25;
  if (neg) repFormatted = 50 - repFormatted;
  return Math.floor(repFormatted).toString();
};

const Profile: React.FC = () => {
  const { user, customJson, vote } = useAuth();
  const { community } = useCommunity();
  const location = useLocation();
  const { username } = useParams<{ username: string }>();
  const { t } = useLanguage();
  
  const currentProfile = username?.toLowerCase() || user;
  
  const [balance, setBalance] = useState<Balance | null>(null);
  const [scotData, setScotData] = useState<any>(null);
  const [pendingCuration, setPendingCuration] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'blog' | 'comments' | 'replies' | 'wallet'>('blog');
  const [discussions, setDiscussions] = useState<HivePost[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  const [followLoading, setFollowLoading] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);

  const [votingPost, setVotingPost] = useState<string | null>(null);
  const [votersModalPost, setVotersModalPost] = useState<HivePost | null>(null);
  const [voteModalPost, setVoteModalPost] = useState<HivePost | null>(null);
  const [tribeInfo, setTribeInfo] = useState<TribeInfo | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Dynamic Profile Details & Follow counters
  const [accountDetails, setAccountDetails] = useState<any | null>(null);
  const [followCount, setFollowCount] = useState<{ follower_count: number; following_count: number } | null>(null);

  // Wallet Actions State
  const [walletActionType, setWalletActionType] = useState<'transfer' | 'stake' | 'unstake' | 'delegate' | 'undelegate' | null>(null);
  const [walletActionAmount, setWalletActionAmount] = useState('');
  const [walletActionTo, setWalletActionTo] = useState('');
  const [walletActionLoading, setWalletActionLoading] = useState(false);

  // Account History State
  const [accountHistory, setAccountHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  useEffect(() => {
    if (!currentProfile) return;

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const isOwnProfile = user && currentProfile === user;

        const [balData, userScotData, curationData, tInfo, accDetails, folCount] = await Promise.all([
          getUserBalance(currentProfile, community),
          scotFetch(`/@${currentProfile}?token=${community}&hive=1`),
          isOwnProfile ? getPendingCuration(currentProfile, community) : Promise.resolve(0),
          getTribeInfo(community),
          getAccountDetails(currentProfile),
          getFollowCount(currentProfile)
        ]);
        
        if (balData) setBalance(balData);
        if (userScotData && userScotData[community]) {
          setScotData(userScotData[community]);
        }
        setPendingCuration(curationData);
        if (tInfo) setTribeInfo(tInfo);
        if (accDetails) setAccountDetails(accDetails);
        if (folCount) setFollowCount(folCount);
      } catch (error) {
        console.error("Profile fetching error", error);
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [currentProfile, community]);

  useEffect(() => {
    if (user && currentProfile && user !== currentProfile) {
       const checkFollow = async () => {
         try {
           const followingRes = await fetch(`https://hafsql-api.mahdiyari.info/accounts/${user}/following?limit=100`);
           const followingData = await followingRes.json();
           if (followingData && Array.isArray(followingData)) {
              if (followingData.some((f: any) => f.following === currentProfile)) {
                  setIsFollowing(true);
              } else {
                  setIsFollowing(false);
              }
           }
           
           const mutedRes = await fetch(`https://hafsql-api.mahdiyari.info/accounts/${user}/muted?limit=100`);
           const mutedData = await mutedRes.json();
           if (mutedData && Array.isArray(mutedData)) {
              if (mutedData.some((m: any) => m.following === currentProfile)) {
                  setIsMuted(true);
              } else {
                  setIsMuted(false);
              }
           }
         } catch (e) {
           console.error("Error checking follow status", e);
         }
       };
       checkFollow();
    }
  }, [user, currentProfile]);

  useEffect(() => {
    if (!currentProfile) return;
    if (activeTab === 'wallet') return;
    const fetchDiscussions = async () => {
       setLoadingDiscussions(true);
       const data = await getUserDiscussions(currentProfile, activeTab, community, 20);
       setDiscussions(data);
       setLoadingDiscussions(false);
    };
    fetchDiscussions();
  }, [currentProfile, activeTab, community]);

  const handleFollow = async () => {
    if (!user) return alert(t('profile.loginToFollow'));
    setFollowLoading(true);
    const what = isFollowing ? [] : ["blog"];
    const json = ["follow", { follower: user, following: currentProfile, what }];
    const res = await customJson('follow', json, isFollowing ? t('profile.unfollow') : t('profile.follow'));
    if (res.success) {
       setIsFollowing(!isFollowing);
    } else {
       alert(t('profile.error') + res.msg);
    }
    setFollowLoading(false);
  };

  const handleMute = async () => {
    if (!user) return alert(t('profile.loginToMute'));
    setMuteLoading(true);
    const what = isMuted ? [] : ["ignore"];
    const json = ["follow", { follower: user, following: currentProfile, what }];
    const res = await customJson('follow', json, isMuted ? t('profile.unmute') : t('profile.mute'));
    if (res.success) {
       setIsMuted(!isMuted);
    } else {
       alert(t('profile.error') + res.msg);
    }
    setMuteLoading(false);
  };

  const handleVote = (post: HivePost) => {
    if (!user) {
      alert(t('profile.loginToVote'));
      return;
    }

    const alreadyVoted = post.active_votes?.some(v => v.voter === user);
    if (alreadyVoted) {
      alert(t('profile.alreadyVoted'));
      return;
    }

    setVoteModalPost(post);
  };

  const handleConfirmVote = async (weight: number) => {
    if (!voteModalPost || !user) return;
    
    setVotingPost(voteModalPost.permlink);
    try {
      const result = await vote(voteModalPost.author, voteModalPost.permlink, weight);
      if (result.success) {
         setDiscussions(prev => prev.map(p => {
           if (p.author === voteModalPost.author && p.permlink === voteModalPost.permlink) {
              const active_votes = Array.isArray(p.active_votes) ? [...p.active_votes] : [];
              if (!active_votes.some((v: any) => v.voter === user)) {
                 active_votes.push({ voter: user, weight, percent: weight, rshares: 0 });
              }
              return {
                 ...p,
                 active_votes
              };
           }
           return p;
         }));
      } else {
        alert(t('profile.errorVote') + result.msg);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setVotingPost(null);
      setVoteModalPost(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallet' && currentProfile && community) {
      fetchHistory(0);
    }
  }, [activeTab, currentProfile, community]);

  const fetchHistory = async (offset: number) => {
    if (offset === 0) {
       setAccountHistory([]);
       setHasMoreHistory(true);
    }
    setHistoryLoading(true);
    try {
      const data = await getAccountHistory(currentProfile, community, 30, offset);
      if (data && data.length > 0) {
         setAccountHistory(prev => offset === 0 ? data : [...prev, ...data]);
         setHistoryOffset(offset + 30);
         if (data.length < 30) setHasMoreHistory(false);
      } else {
         setHasMoreHistory(false);
      }
    } catch (e) {
       console.error(e);
    } finally {
       setHistoryLoading(false);
    }
  };

  const handleWalletAction = async () => {
     if (!walletActionType || !walletActionAmount || parseFloat(walletActionAmount) <= 0) return;
     if ((walletActionType === 'transfer' || walletActionType === 'delegate' || walletActionType === 'undelegate') && !walletActionTo) return;

     setWalletActionLoading(true);
     const payload: any = {
        symbol: community,
        quantity: parseFloat(walletActionAmount).toFixed(tribeInfo?.precision ?? 4)
     };

     if (walletActionType === 'stake') {
        payload.to = user;
     }

     if (walletActionType === 'transfer' || walletActionType === 'delegate') {
        payload.to = walletActionTo;
     } else if (walletActionType === 'undelegate') {
        payload.from = walletActionTo;
     }

     let actionName = 'Transferência';
     if (walletActionType === 'stake') actionName = 'Power Up (Stake)';
     if (walletActionType === 'unstake') actionName = 'Power Down (Unstake)';
     if (walletActionType === 'delegate') actionName = 'Delegação';
     if (walletActionType === 'undelegate') actionName = t('profile.wallet.removeDelegationTitle');

     try {
       const res = await customJson('ssc-mainnet-hive', {
          contractName: 'tokens',
          contractAction: walletActionType,
          contractPayload: payload
       }, actionName, 'Active');

       if (res.success) {
          alert(t('profile.wallet.txSuccess'));
          setWalletActionAmount('');
          setWalletActionTo('');
          setWalletActionType(null);
          setTimeout(() => {
             fetchHistory(0);
          }, 4000);
       } else {
          alert(t('profile.wallet.txError') + res.msg);
       }
     } catch (e) {
        console.error(e);
     } finally {
        setWalletActionLoading(false);
     }
  };

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <User size={64} className="mb-4 text-slate-600" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('profile.loginRequired')}</h2>
        <p>{t('profile.loginDesc')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 text-hive animate-spin" />
      </div>
    );
  }

  const renderPostPreview = (text?: string) => {
    if (!text) return '';
    let parsedText = text.replace(/!\[.*?\]\(.*?\)/g, '');
    parsedText = parsedText.replace(/<[^>]*>?/gm, '');
    return parsedText.substring(0, 140) + '...';
  };

  const getThumbnail = (post: HivePost) => {
    const extracted = extractImage(post);
    if (extracted) return extracted;
    return `https://images.hive.blog/u/${post.author}/avatar`;
  };

  const getCalculatedCentReward = (post: HivePost) => {
    try {
      const precision = post.precision ?? tribeInfo?.precision ?? (communityConfig.tokenSymbol.toUpperCase() === 'POB' ? 8 : 2);
      const isLegacy = communityConfig.useLegacyScot;

      if (post.pending_token != null && post.pending_token > 0) {
        const val = isLegacy ? (post.pending_token / Math.pow(10, precision)) : post.pending_token;
        return val.toFixed(precision);
      }

      const authorPayout = Number((post as any).author_payout_value) || 0;
      const curatorPayout = Number((post as any).curator_payout_value) || 0;
      const beneficiaryPayout = Number((post as any).beneficiary_payout_value) || 0;
      const totalPaid = authorPayout + curatorPayout + beneficiaryPayout;
      if (totalPaid > 0) {
        const val = isLegacy ? (totalPaid / Math.pow(10, precision)) : totalPaid;
        return val.toFixed(precision);
      }

      if (tribeInfo && post.vote_rshares != null) {
          const rshares = Number(post.vote_rshares);
          const exponent = Number(tribeInfo.author_curve_exponent || 1);
          const rewardPool = parseFloat(tribeInfo.reward_pool || "0");
          const pendingRshares = parseFloat(tribeInfo.pending_rshares || "0");

          if (pendingRshares > 0 && rewardPool > 0 && !isNaN(rshares)) {
              let estimate = ((Math.pow(rshares, exponent) * rewardPool) / pendingRshares);
              if (isLegacy) {
                estimate = estimate / Math.pow(10, precision);
              }
              if (!isNaN(estimate)) {
                 return estimate.toFixed(precision);
              }
          }
      }

      return (0).toFixed(precision);
    } catch (e) {
      return (0).toFixed(tribeInfo?.precision ?? 2);
    }
  };

  // Parsing account dynamic details & metadata
  let profileMetadata: any = {};
  let reputation = '25';
  let createdDateString = '';
  let postsCount = 0;
  let ageYears = 1;

  if (accountDetails) {
    reputation = getReputation(accountDetails.reputation);
    postsCount = accountDetails.post_count || 0;
    
    // Parse created date & format
    try {
      if (accountDetails.created) {
        const createdDate = new Date(accountDetails.created);
        const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
        createdDateString = createdDate.toLocaleDateString(undefined, options);
        
        // Calculate age in years for trophy case
        const diffMs = Date.now() - createdDate.getTime();
        ageYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
        if (ageYears < 1) ageYears = 1;
      }
    } catch (e) {
      console.error("Error parsing creation date", e);
    }

    // Parse json metadata
    try {
      const metaStr = accountDetails.posting_json_metadata || accountDetails.json_metadata || '';
      const meta = typeof metaStr === 'string' ? JSON.parse(metaStr) : metaStr;
      if (meta && meta.profile) {
        profileMetadata = meta.profile;
      }
    } catch (e) {
      console.error("Error parsing profile metadata:", e);
    }
  }

  const displayName = profileMetadata.name || currentProfile;
  const bio = profileMetadata.about || `Fazendo curadoria e publicando as melhores notícias e artigos na comunidade ${community.toUpperCase()}.`;
  const locationText = profileMetadata.location || `NEWS Holder`;
  const website = profileMetadata.website || '';
  
  const rawProfileImage = profileMetadata.profile_image || '';
  const profileImage = rawProfileImage
    ? (rawProfileImage.startsWith('https://images.hive.blog/') ? rawProfileImage : `https://images.hive.blog/256x256/${rawProfileImage}`)
    : `https://images.hive.blog/u/${currentProfile}/avatar/large`;

  const rawCoverImage = profileMetadata.cover_image || '';
  const coverImage = rawCoverImage
    ? (rawCoverImage.startsWith('https://images.hive.blog/') ? rawCoverImage : `https://images.hive.blog/1280x0/${rawCoverImage}`)
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-24">
      {/* Outer 12-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Header, Navigation Tabs and Lists */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Profile Elegant Top Cover Card */}
          <div className="bg-slate-900/40 border border-slate-800/40 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-sm group">
            {/* Elegant Cover Image Backdrop */}
            {coverImage && (
              <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/35 z-20" />
                <img 
                  src={sanitizeUrl(coverImage)} 
                  alt="Cover" 
                  className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Glowing Red Background Blur for elegant neon highlights */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-hive/10 rounded-full blur-3xl pointer-events-none z-10" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-hive/5 rounded-full blur-3xl pointer-events-none z-10" />

            {/* Back watermark profile icon (only show if no cover image to avoid clutter) */}
            {!coverImage && (
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-slate-400 z-10">
                 <User size={250} />
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
              {/* Glowing Avatar Border */}
              <div className="relative shrink-0">
                <div className="p-[2px] rounded-[24px] bg-gradient-to-tr from-hive/60 to-red-500/60 shadow-[0_4px_20px_rgba(227,19,55,0.15)] group-hover:shadow-[0_4px_25px_rgba(227,19,55,0.3)] transition-all duration-500">
                  <img 
                    src={profileImage} 
                    alt={currentProfile} 
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-[22px] border-2 border-slate-950 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://images.hive.blog/u/${currentProfile}/avatar/large`;
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                {/* Brand Logo overlay Badge */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg z-20">
                  <img src="https://images.hive.blog/u/hive/avatar" className="w-4 h-4 rounded-full opacity-90" alt="hive" />
                </div>
              </div>

              {/* Profile Bio Details */}
              <div className="text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    {displayName}
                    <CheckCircle2 size={18} className="text-hive fill-hive/10" />
                  </h1>
                  {reputation && (
                    <span className="bg-slate-800 text-slate-400 border border-slate-700/60 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
                      REP {reputation}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-xs text-slate-400 font-medium">
                  <span className="font-mono text-slate-300">@{currentProfile}</span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="bg-hive/10 text-hive border border-hive/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {balance ? parseFloat(balance.stake).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'} {community.toUpperCase()} POWER
                  </span>
                </div>

                <p className="text-slate-300 text-sm max-w-md leading-relaxed mt-1">
                  {bio}
                </p>

                {/* Meta details (Joined, Location, Website) */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-xs text-slate-400 pt-1 font-medium">
                  {createdDateString && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-500" />
                      Entrou em {createdDateString}
                    </span>
                  )}
                  {locationText && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-500" />
                      {locationText}
                    </span>
                  )}
                  {website && (
                    <a 
                      href={sanitizeUrl(website)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1.5 text-hive hover:underline transition-colors"
                    >
                      <ExternalLink size={13} />
                      {website.replace(/https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Follow/Unfollow & Mute buttons */}
            {user && user !== currentProfile && (
              <div className="relative z-10 flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                <button 
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex-1 md:w-32 flex items-center justify-center gap-2 px-4 py-2 font-bold rounded-xl disabled:opacity-50 transition-all text-xs border ${
                    isFollowing 
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    : 'bg-hive text-white border-transparent hover:bg-red-600 shadow-lg shadow-hive/15'
                  }`}
                >
                  {followLoading ? <Loader2 size={13} className="animate-spin" /> : (isFollowing ? <UserMinus size={13} /> : <UserPlus size={13} />)}
                  {isFollowing ? t('profile.unfollow') : t('profile.follow')}
                </button>
                <button 
                  onClick={handleMute}
                  disabled={muteLoading}
                  className={`flex-1 md:w-32 flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-xl disabled:opacity-50 transition-all text-xs border ${
                    isMuted
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {muteLoading ? <Loader2 size={13} className="animate-spin" /> : (isMuted ? <AlertCircle size={13} /> : <ThumbsDown size={13} />)}
                  {isMuted ? t('profile.unmute') : t('profile.mute')}
                </button>
              </div>
            )}
          </div>

          {/* Tab Selection */}
          <div className="bg-slate-900/30 border border-slate-800/40 rounded-2xl p-1.5 flex items-center gap-1.5 w-full overflow-x-auto scrollbar-none backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('blog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'blog' 
                ? 'bg-hive text-white shadow-md shadow-hive/15' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen size={14} />
              {t('profile.tabs.posts')}
            </button>
            <button
              onClick={() => setActiveTab('replies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'replies' 
                ? 'bg-hive text-white shadow-md shadow-hive/15' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp size={14} />
              {t('profile.tabs.replies')}
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'comments' 
                ? 'bg-hive text-white shadow-md shadow-hive/15' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MessageCircle size={14} />
              {t('profile.tabs.comments')}
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'wallet' 
                ? 'bg-hive text-white shadow-md shadow-hive/15' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Wallet size={14} />
              Carteira
            </button>
          </div>

          {/* Dynamic Lists Section */}
          <div className="space-y-4">
            {activeTab === 'wallet' ? (
              <div className="space-y-6 animate-fade-in">
                 {/* Wallet Balances Card Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Liquid Balance */}
                    <div className="bg-slate-900/40 border border-slate-800/40 p-5 rounded-2xl flex items-start gap-4">
                      <div className="p-3 bg-amber-500/15 rounded-xl text-amber-500">
                         <Coins size={22} />
                      </div>
                      <div className="flex-1">
                        <span className="text-slate-500 text-[10px] text-transform uppercase font-bold tracking-wider block mb-0.5">{t('profile.wallet.liquidBalance')}</span>
                        <div className="text-xl font-mono font-black text-white mb-2">
                          {balance ? parseFloat(balance.balance).toLocaleString() : '0'} <span className="text-xs text-hive">{community.toUpperCase()}</span>
                        </div>
                        {user === currentProfile && (
                           <div className="flex gap-1.5">
                              <button onClick={() => setWalletActionType('transfer')} className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold px-2 py-1 rounded-lg border border-slate-700/60 transition-colors uppercase">{t('profile.wallet.send')}</button>
                              <button onClick={() => setWalletActionType('stake')} className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold px-2 py-1 rounded-lg border border-slate-700/60 transition-colors uppercase">{t('profile.wallet.powerUp')}</button>
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Staking Balance */}
                    <div className="bg-slate-900/40 border border-slate-800/40 p-5 rounded-2xl flex items-start gap-4">
                      <div className="p-3 bg-purple-500/15 rounded-xl text-purple-400">
                         <TrendingUp size={22} />
                      </div>
                      <div className="flex-1">
                        <span className="text-slate-500 text-[10px] text-transform uppercase font-bold tracking-wider block mb-0.5">{t('profile.wallet.staking')}</span>
                        <div className="text-xl font-mono font-black text-white mb-2">
                          {balance ? parseFloat(balance.stake).toLocaleString() : '0'} <span className="text-xs text-hive">{community.toUpperCase()}</span>
                        </div>
                        {user === currentProfile && (
                           <div className="flex gap-1.5">
                              <button onClick={() => setWalletActionType('unstake')} className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold px-2 py-1 rounded-lg border border-slate-700/60 transition-colors uppercase">{t('profile.wallet.powerDown')}</button>
                              <button onClick={() => setWalletActionType('delegate')} className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold px-2 py-1 rounded-lg border border-slate-700/60 transition-colors uppercase">{t('profile.wallet.delegate')}</button>
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Pending Curation rewards */}
                    <div className="bg-slate-900/40 border border-slate-800/40 p-5 rounded-2xl flex items-start gap-4">
                      <div className="p-3 bg-green-500/15 rounded-xl text-green-400">
                         <HandCoins size={22} />
                      </div>
                      <div className="flex-1">
                        <span className="text-slate-500 text-[10px] text-transform uppercase font-bold tracking-wider block mb-0.5">{t('profile.wallet.pendingCuration')}</span>
                        <div className="text-xl font-mono font-black text-white mb-2">
                          {pendingCuration.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-hive">{community.toUpperCase()}</span>
                        </div>
                        {scotData && scotData.voting_power !== undefined && (
                           <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                             Poder de Voto: {(scotData.voting_power / 100).toFixed(2)}%
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Outgoing delegations */}
                    <div className="bg-slate-900/40 border border-slate-800/40 p-5 rounded-2xl flex items-start gap-4">
                      <div className="p-3 bg-sky-500/15 rounded-xl text-sky-400">
                         <ArrowUpFromLine size={22} />
                      </div>
                      <div className="flex-1">
                        <span className="text-slate-500 text-[10px] text-transform uppercase font-bold tracking-wider block mb-0.5">{t('profile.wallet.delegationsOut')}</span>
                        <div className="text-xl font-mono font-black text-white mb-2">
                          {balance && balance.delegationsOut ? parseFloat(balance.delegationsOut).toLocaleString() : '0'} <span className="text-xs text-hive">{community.toUpperCase()}</span>
                        </div>
                        {user === currentProfile && parseFloat(balance?.delegationsOut || '0') > 0 && (
                           <div className="flex gap-1.5">
                              <button onClick={() => setWalletActionType('undelegate')} className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold px-2 py-1 rounded-lg border border-slate-700/60 transition-colors uppercase">{t('profile.wallet.removeDelegation')}</button>
                           </div>
                        )}
                      </div>
                    </div>
                 </div>

                 {/* Wallet Transaction Forms */}
                 {walletActionType && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative shadow-lg animate-slide-in-up">
                       <button onClick={() => setWalletActionType(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">✕</button>
                       <h3 className="text-lg font-black text-white mb-4">
                          {walletActionType === 'transfer' && t('profile.wallet.sendTokens')}
                          {walletActionType === 'stake' && t('profile.wallet.stakeTitle')}
                          {walletActionType === 'unstake' && t('profile.wallet.unstakeTitle')}
                          {walletActionType === 'delegate' && t('profile.wallet.delegateTokens')}
                          {walletActionType === 'undelegate' && 'Remover Delegação'}
                       </h3>
                       
                       <div className="space-y-4 max-w-md">
                          {(walletActionType === 'transfer' || walletActionType === 'delegate' || walletActionType === 'undelegate') && (
                             <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                   {walletActionType === 'undelegate' ? t('profile.wallet.fromUser') : t('profile.wallet.toUser')}
                                </label>
                                <input 
                                   type="text" 
                                   value={walletActionTo} 
                                   onChange={(e) => setWalletActionTo(e.target.value.toLowerCase())}
                                   placeholder="Nome do usuário"
                                   className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-hive transition-colors font-semibold"
                                />
                             </div>
                          )}
                          
                          <div>
                             <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                {t('profile.wallet.quantity')} ({community.toUpperCase()})
                             </label>
                             <div className="relative">
                               <input 
                                  type="number" 
                                  value={walletActionAmount} 
                                  onChange={(e) => setWalletActionAmount(e.target.value)}
                                  placeholder="0.00"
                                  min="0"
                                  step="any"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-hive transition-colors font-bold"
                               />
                               <button 
                                  onClick={() => {
                                     let maxBal = '0';
                                     if (walletActionType === 'transfer' || walletActionType === 'stake') maxBal = balance?.balance || '0';
                                     else if (walletActionType === 'unstake') maxBal = balance?.stake || '0';
                                     else if (walletActionType === 'delegate') maxBal = balance?.stake || '0';
                                     
                                     setWalletActionAmount(maxBal);
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 rounded-md uppercase transition-colors"
                               >
                                  Max
                               </button>
                             </div>
                          </div>

                          <button 
                             onClick={handleWalletAction}
                             disabled={walletActionLoading || !walletActionAmount}
                             className="w-full bg-hive text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-hive/10"
                          >
                             {walletActionLoading && <Loader2 size={15} className="animate-spin" />}
                             {t('profile.wallet.confirmTx')}
                          </button>
                       </div>
                    </div>
                 )}

                 {/* Account History Logs */}
                 <div className="mt-8">
                    <h3 className="text-base font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                       <History size={18} className="text-hive" /> Histórico da Conta
                    </h3>
                    <div className="bg-slate-900/40 border border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
                       {accountHistory.length === 0 && !historyLoading ? (
                          <div className="p-8 text-center text-slate-500">{t('profile.history.empty')}</div>
                       ) : (
                          <div className="divide-y divide-slate-800/40">
                             {accountHistory.map((item, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors gap-3">
                                   <div className="flex items-center gap-3">
                                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                                         {item.operation === 'tokens_transfer' ? <ArrowRightLeft size={16} /> :
                                          item.operation === 'tokens_stake' ? <ArrowUpCircle size={16} className="text-purple-400" /> :
                                          item.operation === 'tokens_unstake' ? <ArrowDownCircle size={16} className="text-orange-400" /> :
                                          item.operation === 'tokens_delegate' ? <Users size={16} className="text-blue-400" /> :
                                          item.operation === 'tokens_undelegate' ? <UserMinus2 size={16} className="text-red-400" /> :
                                          item.operation === 'mining_lottery' ? <Coins size={16} className="text-amber-400" /> :
                                          item.operation === 'tokens_issue' ? <Coins size={16} className="text-hive" /> :
                                          item.operation.includes('Reward') ? <HandCoins size={16} className="text-green-400" /> :
                                          <History size={16} />}
                                      </div>
                                      <div>
                                         <div className="text-white font-bold text-xs sm:text-sm">
                                            {item.operation === 'tokens_transfer' ? (item.to === currentProfile ? t('profile.history.received') : t('profile.history.sent')) : 
                                             item.operation === 'comments_curationReward' ? t('profile.history.curationReward') :
                                             item.operation === 'comments_curationReward_stake' ? t('profile.history.curationRewardStaked') :
                                             item.operation === 'comments_authorReward' ? t('profile.history.authorReward') :
                                             item.operation === 'comments_authorReward_stake' ? t('profile.history.authorRewardStaked') :
                                             item.operation === 'comments_beneficiaryReward' ? t('profile.history.beneficiaryReward') :
                                             item.operation === 'comments_beneficiaryReward_stake' ? t('profile.history.beneficiaryRewardStaked') :
                                             item.operation.replace('tokens_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                         </div>
                                         <div className="text-[10px] text-slate-500 font-medium">
                                            {new Date(item.timestamp * 1000).toLocaleString()}
                                            {item.from && item.from !== currentProfile && !item.from.includes('contract_') && ` • de @${item.from}`}
                                            {item.to && item.to !== currentProfile && !item.to.includes('contract_') && ` • para @${item.to}`}
                                            {item.authorperm && ` • post ${item.authorperm.split('/')[1] || item.authorperm}`}
                                            {item.memo && ` • memo: ${item.memo}`}
                                         </div>
                                      </div>
                                   </div>
                                   <div className="text-right shrink-0">
                                      <div className={`font-mono text-xs sm:text-sm font-black ${item.to === currentProfile || item.operation === 'mining_lottery' || item.operation === 'tokens_issue' || item.operation.includes('Reward') ? 'text-green-400' : 'text-white'}`}>
                                         {item.to === currentProfile || item.operation === 'mining_lottery' || item.operation === 'tokens_issue' || item.operation.includes('Reward') ? '+' : ''}
                                         {item.quantity} <span className="text-[9px] text-slate-500 font-bold">{item.symbol}</span>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                       {historyLoading && (
                          <div className="p-8 flex justify-center">
                             <Loader2 size={24} className="animate-spin text-hive" />
                          </div>
                       )}
                       {hasMoreHistory && !historyLoading && accountHistory.length > 0 && (
                          <div className="p-4 border-t border-slate-800/40 text-center bg-slate-900/30">
                             <button 
                                onClick={() => fetchHistory(historyOffset)}
                                className="text-hive text-xs font-black uppercase tracking-wider hover:text-red-500 transition-colors"
                             >
                                {t('profile.history.loadMore')}
                             </button>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            ) : loadingDiscussions ? (
              <div className="py-20 flex justify-center">
                 <Loader2 className="animate-spin text-hive" size={32} />
              </div>
            ) : discussions.length === 0 ? (
              <div className="py-20 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/40">
                 <MessageCircle size={32} className="mx-auto mb-4 opacity-50 text-hive" />
                 <p>{t('profile.noPosts')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                 {discussions.map(post => {
                    const isComment = post.parent_author !== '';
                    return (
                      <div 
                        key={`${post.author}-${post.permlink}`} 
                        className="bg-slate-900/40 border border-slate-800/40 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-slate-700/60 transition-all backdrop-blur-sm group/post"
                      >
                        {!isComment ? (
                          <div className="flex flex-col sm:flex-row gap-5 items-start">
                            {/* Left Text content */}
                            <div className="flex-1 space-y-2.5 min-w-0 w-full sm:order-1">
                              {/* Post Meta Header */}
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                <img 
                                  src={`https://images.hive.blog/u/${post.author}/avatar`} 
                                  alt={post.author}
                                  className="w-4 h-4 rounded-full border border-slate-800"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://images.hive.blog/u/${post.author}/avatar`;
                                  }}
                                />
                                <Link to={`/profile/${post.author}`} className="hover:text-hive transition-colors text-slate-400">
                                  em {community.toUpperCase()}
                                </Link>
                                <span>&bull;</span>
                                <span>{new Date(post.created + 'Z').toLocaleDateString()}</span>
                              </div>

                              {/* Post Title */}
                              <Link to={`/@${post.author}/${post.permlink}`} state={{ backgroundLocation: location }} className="block group/title">
                                <h3 className="text-base sm:text-lg font-black text-white group-hover/title:text-hive transition-colors line-clamp-2 leading-snug">
                                  {post.title}
                                </h3>
                              </Link>

                              {/* Excerpt */}
                              <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                                {renderPostPreview(post.body || (post as any).desc || '')}
                              </p>

                              {/* Card Footer Actions */}
                              <div className="flex items-center justify-between pt-3 border-t border-slate-800/40 mt-3">
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                  <Link to={`/profile/${post.author}`} className="font-mono text-slate-300 hover:text-hive transition-colors">
                                    @{post.author}
                                  </Link>
                                  
                                  {/* Upvote Button with list click */}
                                  <div className="flex items-center gap-1.5 transition-colors">
                                    <button 
                                      onClick={() => handleVote(post)}
                                      disabled={post.active_votes?.some(v => v.voter === user) || votingPost === post.permlink}
                                      className={`${
                                        post.active_votes?.some(v => v.voter === user) ? 'text-hive' : 'hover:text-hive'
                                      }`}
                                    >
                                      {votingPost === post.permlink ? (
                                        <Loader2 size={13} className="animate-spin" />
                                      ) : (
                                        <Heart size={13} className={post.active_votes?.some(v => v.voter === user) ? "fill-hive text-hive" : ""} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setVotersModalPost(post)}
                                      className="hover:text-white transition-colors"
                                    >
                                      {post.active_votes?.length || 0}
                                    </button>
                                  </div>

                                  {/* Comment Reply Badge */}
                                  <span className="flex items-center gap-1">
                                      <MessageCircle size={13} /> <span>{post.children}</span>
                                  </span>
                                </div>

                                {/* Dynamic Curation Payout Token */}
                                <span className="text-[10px] font-mono font-bold text-hive bg-hive/5 border border-hive/15 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                    <Coins size={11} />
                                    {getCalculatedCentReward(post)} {community.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Thumbnail on the Right side (Responsive layout) */}
                            <Link 
                              to={`/@${post.author}/${post.permlink}`} 
                              state={{ backgroundLocation: location }} 
                              className="w-full sm:w-36 h-28 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/40 block sm:order-2 group/img relative"
                            >
                              <img 
                                src={getThumbnail(post)}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://images.hive.blog/u/${post.author}/avatar`;
                                }}
                              />
                            </Link>
                          </div>
                        ) : (
                          // Comment Display Item (clean, minimal indent styling)
                          <div className="space-y-2.5 w-full">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              <img 
                                src={`https://images.hive.blog/u/${post.author}/avatar`} 
                                alt={post.author}
                                className="w-4 h-4 rounded-full border border-slate-800"
                              />
                              <Link to={`/profile/${post.author}`} className="hover:text-hive text-slate-400">
                                @{post.author}
                              </Link>
                              <span>&bull;</span>
                              <span>{new Date(post.created + 'Z').toLocaleDateString()}</span>
                              <span className="text-slate-600">&bull;</span>
                              <span className="truncate text-slate-400">em resposta a @{post.parent_author}</span>
                            </div>
                            
                            <div className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-1">
                              {renderPostPreview(post.body || (post as any).desc || '')}
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/40 mt-1">
                              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => handleVote(post)}
                                    disabled={post.active_votes?.some(v => v.voter === user) || votingPost === post.permlink}
                                    className={`${
                                      post.active_votes?.some(v => v.voter === user) ? 'text-hive font-black' : 'hover:text-hive'
                                    }`}
                                  >
                                    {votingPost === post.permlink ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Heart size={13} className={post.active_votes?.some(v => v.voter === user) ? "fill-hive text-hive" : ""} />
                                    )}
                                  </button>
                                  <span>{post.active_votes?.length || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle size={13} />
                                  <span>{post.children}</span>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono font-bold text-hive bg-hive/5 border border-hive/15 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Coins size={11} />
                                {getCalculatedCentReward(post)} {community.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                 })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Redesigned Beautiful Alya Sidebar Panel */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Beautiful Pedestal Token Emblem Box */}
           <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/40 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-between text-center shadow-xl h-72 backdrop-blur-md group">
             {/* Neon Red/Accent grid line watermarks */}
             <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0,80 Q25,50 50,75 T100,30 L100,100 L0,100 Z" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-hive" />
               <path d="M0,90 Q30,65 60,85 T100,45" fill="none" stroke="currentColor" strokeWidth="1" className="text-hive/40" />
             </svg>
             
             {/* Background glow behind pedestal */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-hive/10 blur-3xl pointer-events-none" />

             {/* Dynamic token 3D podium and initial display */}
             <div className="my-auto flex flex-col items-center relative z-10 w-full">
               <div className="relative mb-5 flex items-center justify-center">
                 {/* Pedestal bottom shadow */}
                 <div className="absolute bottom-[-15px] w-24 h-5 bg-black/60 blur-md rounded-full" />
                 
                 {/* Floating Glowing token element */}
                 <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-hive to-red-600 border border-hive/40 flex items-center justify-center shadow-[0_0_35px_rgba(227,19,55,0.4)] relative hover:scale-105 transition-transform duration-500 cursor-pointer">
                    <span className="text-white font-serif font-black text-4xl tracking-wider select-none drop-shadow-md">
                      {community.charAt(0).toUpperCase()}
                    </span>
                 </div>
               </div>

               {/* Token details text below podium */}
               <h3 className="text-base font-black text-white uppercase tracking-widest mt-4">
                 {community.toUpperCase()} TOKEN
               </h3>
               <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                 Moeda Oficial da Curation Engine
               </p>
             </div>
           </div>

           {/* User Profile Stats Card (Alya Layout) */}
           <div className="bg-slate-900/40 border border-slate-800/40 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-sm">
             <div className="flex flex-col items-center justify-center text-center pb-2 border-b border-slate-800/40">
                <span className="text-white font-black text-lg tracking-tight">{displayName}</span>
                <span className="text-slate-500 font-mono text-xs">@{currentProfile}</span>
             </div>

             {/* Stats Grid 2x2 */}
             <div className="grid grid-cols-2 gap-3.5">
               {/* 1. Liquid token balance */}
               <div className="bg-slate-950/45 border border-slate-800/50 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                 <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider mb-1">Saldo Líquido</span>
                 <span className="text-base font-mono font-black text-white">
                   {balance ? parseFloat(balance.balance).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '0'}
                 </span>
                 <span className="text-slate-500 text-[9px] font-bold uppercase">{community}</span>
               </div>

               {/* 2. Total curation activities */}
               <div className="bg-slate-950/45 border border-slate-800/50 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                 <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider mb-1">Contribuições</span>
                 <span className="text-base font-mono font-black text-white">{postsCount}</span>
                 <span className="text-slate-500 text-[9px] font-bold uppercase">Publicações</span>
               </div>

               {/* 3. Following */}
               <div className="bg-slate-950/45 border border-slate-800/50 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                 <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider mb-1">Seguindo</span>
                 <span className="text-base font-mono font-black text-white">{followCount?.following_count ?? 0}</span>
                 <span className="text-slate-500 text-[9px] font-bold uppercase">Autores</span>
               </div>

               {/* 4. Followers */}
               <div className="bg-slate-950/45 border border-slate-800/50 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                 <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider mb-1">Seguidores</span>
                 <span className="text-base font-mono font-black text-white">{followCount?.follower_count ?? 0}</span>
                 <span className="text-slate-500 text-[9px] font-bold uppercase">Leitores</span>
               </div>
             </div>

             {/* Holder badge and active status */}
             <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
               <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-hive animate-pulse" />
                  {community.toUpperCase()} Holder
               </span>
               <span className="flex items-center gap-1 text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Ativo recentemente
               </span>
             </div>
           </div>

           {/* Trophy Case Widget */}
           <div className="bg-slate-900/40 border border-slate-800/40 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-sm">
             <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Armário de Troféus</h4>
                <span className="text-[10px] font-bold text-hive uppercase tracking-wider hover:underline cursor-pointer">Ver todos</span>
             </div>

             {/* Metal glowing trophies row */}
             <div className="grid grid-cols-4 gap-2 items-center">
               
               {/* Trophy 1: Account Age */}
               <div className="flex flex-col items-center text-center group/trophy cursor-pointer">
                 <div className="w-11 h-11 rounded-full bg-gradient-to-br from-hive/15 to-slate-900 border border-hive/30 flex items-center justify-center shadow-[0_0_10px_rgba(227,19,55,0.05)] group-hover/trophy:scale-110 group-hover/trophy:border-hive/65 transition-all duration-300">
                   <Award size={18} className="text-hive" />
                 </div>
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-tight mt-1.5 block leading-none">
                    {ageYears} Ano{ageYears > 1 ? 's' : ''} Club
                 </span>
               </div>

               {/* Trophy 2: Curator */}
               <div className="flex flex-col items-center text-center group/trophy cursor-pointer">
                 <div className="w-11 h-11 rounded-full bg-gradient-to-br from-hive/15 to-slate-900 border border-hive/30 flex items-center justify-center shadow-[0_0_10px_rgba(227,19,55,0.05)] group-hover/trophy:scale-110 group-hover/trophy:border-hive/65 transition-all duration-300">
                   <Compass size={18} className="text-hive" />
                 </div>
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-tight mt-1.5 block leading-none">
                    Curador
                 </span>
               </div>

               {/* Trophy 3: Contributor */}
               <div className="flex flex-col items-center text-center group/trophy cursor-pointer">
                 <div className="w-11 h-11 rounded-full bg-gradient-to-br from-hive/15 to-slate-900 border border-hive/30 flex items-center justify-center shadow-[0_0_10px_rgba(227,19,55,0.05)] group-hover/trophy:scale-110 group-hover/trophy:border-hive/65 transition-all duration-300">
                   <Briefcase size={18} className="text-hive" />
                 </div>
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-tight mt-1.5 block leading-none">
                    Produtor
                 </span>
               </div>

               {/* Trophy 4: News Hunter */}
               <div className="flex flex-col items-center text-center group/trophy cursor-pointer">
                 <div className="w-11 h-11 rounded-full bg-gradient-to-br from-hive/15 to-slate-900 border border-hive/30 flex items-center justify-center shadow-[0_0_10px_rgba(227,19,55,0.05)] group-hover/trophy:scale-110 group-hover/trophy:border-hive/65 transition-all duration-300">
                   <Sparkles size={18} className="text-hive animate-pulse" />
                 </div>
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-tight mt-1.5 block leading-none">
                    Explorador
                 </span>
               </div>
             </div>
           </div>

           {/* Proud supporter banner widget */}
           <div className="bg-gradient-to-r from-slate-900/60 to-slate-950/60 border border-slate-800/45 rounded-2xl p-4 flex items-center gap-3.5 hover:border-slate-700/50 transition-all cursor-pointer group">
             <div className="w-10 h-10 rounded-xl bg-slate-950 border border-hive/20 flex items-center justify-center shadow-md shrink-0">
               <Coins size={18} className="text-hive" />
             </div>
             <div className="min-w-0">
               <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide leading-none mb-1">
                 Apoiador do token {community.toUpperCase()}
               </h4>
               <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-none">
                 Fortalecendo o jornalismo Web3.
               </p>
             </div>
           </div>

           {/* Redesigned bottom links footer */}
           <div className="space-y-3 pt-3 text-center lg:text-left">
             <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
               <Link to="/" className="hover:text-hive transition-colors">Início</Link>
               <span>&bull;</span>
               <Link to="/" className="hover:text-hive transition-colors">Populares</Link>
               <span>&bull;</span>
               <Link to="/" className="hover:text-hive transition-colors">Notícias</Link>
               <span>&bull;</span>
               <Link to="/" className="hover:text-hive transition-colors">Explorar</Link>
             </div>
             <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
               Hive.io &bull; © 2026. Todos os direitos reservados.
             </div>
           </div>
        </div>
      </div>
      
      <VotersModal 
         post={votersModalPost} 
         isOpen={votersModalPost !== null} 
         onClose={() => setVotersModalPost(null)}
         tribeInfo={tribeInfo}
      />
      <VoteModal
         isOpen={voteModalPost !== null}
         onClose={() => setVoteModalPost(null)}
         post={voteModalPost}
         username={user || ''}
         token={community}
         onVote={handleConfirmVote}
      />
    </div>
  );
};

export default Profile;
