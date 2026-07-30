import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCommunity } from '../contexts/CommunityContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  AlertCircle, 
  RefreshCw, 
  LayoutList, 
  MessageCircle, 
  Clock, 
  Hash, 
  Check, 
  Sparkles,
  Play,
  Image as ImageIcon,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { getAuthorAvatarUrl } from '../utils/lightAccount';
import { sanitizeUrl } from '../utils/security';

interface ChatMessage {
  id: string;
  timestamp: string;
  author: string;
  message: string;
  block_num: number;
  nickname?: string;
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/shorts/')[1]?.split('?')[0] || null;
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/embed/')[1]?.split('?')[0] || null;
      }
      return parsed.searchParams.get('v');
    } else if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1).split('?')[0] || null;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function isTrustedImageUrl(urlStr: string): { isImage: boolean; domain: string } {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    const trustedDomains = [
      'images.hive.blog',
      'images.ecency.com',
      'files.peakd.com',
      'peakd.com',
      'ecency.com',
      'steemitimages.com',
      'ipfs.io',
      'ipfs.skyds.xyz'
    ];

    const isTrustedHost = trustedDomains.some(d => host === d || host.endsWith('.' + d));
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathname);

    if (isTrustedHost || hasImageExtension) {
      return { isImage: true, domain: host };
    }
  } catch (e) {
    return { isImage: false, domain: '' };
  }
  return { isImage: false, domain: '' };
}

const MediaLink: React.FC<{ url: string; label?: string; alt?: string }> = ({ url, label, alt }) => {
  const { t } = useLanguage();
  const [showMedia, setShowMedia] = useState(false);

  const cleanUrl = sanitizeUrl(url);
  if (!cleanUrl) return <span>{label || url}</span>;

  const ytId = extractYouTubeId(cleanUrl);
  if (ytId) {
    const ytThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return (
      <span className="block my-2">
        {!showMedia ? (
          <div
            onClick={() => setShowMedia(true)}
            className="relative w-64 xs:w-72 sm:w-80 h-40 rounded-2xl overflow-hidden border border-red-900/60 bg-slate-950 group cursor-pointer shadow-lg transition-all hover:border-red-500/80 hover:shadow-red-950/40 select-none my-1"
          >
            {/* Blurred Background Thumbnail */}
            <img
              src={ytThumb}
              alt="YouTube preview"
              className="absolute inset-0 w-full h-full object-cover filter blur-md opacity-40 scale-105 transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10 gap-2">
              <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-500 transition-all">
                <Play size={20} className="fill-current ml-0.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide shadow-sm">
                YouTube • {t('chat.clickToPlay')}
              </span>
            </div>

            {/* Direct link button top right */}
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors z-20"
              title="YouTube"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        ) : (
          <div className="mt-2 max-w-md">
            <div className="flex items-center justify-between mb-1 text-[11px] text-slate-400">
              <span className="font-medium text-red-400 flex items-center gap-1">
                <Play size={12} className="fill-current" /> YouTube
              </span>
              <button
                type="button"
                onClick={() => setShowMedia(false)}
                className="hover:text-white underline font-bold"
              >
                {t('chat.hideVideo')}
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-700 shadow-xl bg-black aspect-video relative">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </span>
    );
  }

  const { isImage, domain } = isTrustedImageUrl(cleanUrl);
  if (isImage) {
    return (
      <span className="block my-2">
        {!showMedia ? (
          <div
            onClick={() => setShowMedia(true)}
            className="relative w-56 xs:w-64 h-36 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 group cursor-pointer shadow-lg transition-all hover:border-cent/80 hover:shadow-cent/10 select-none my-1"
          >
            {/* Blurred Image Background Preview */}
            <img
              src={cleanUrl}
              alt={alt || "Blurred preview"}
              className="absolute inset-0 w-full h-full object-cover filter blur-lg opacity-35 scale-110 transition-transform duration-300 group-hover:scale-125"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10 gap-1.5">
              <div className="w-10 h-10 rounded-full bg-slate-800/90 text-cent border border-slate-700 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-slate-700 transition-all">
                <Eye size={18} />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {t('chat.clickToReveal')}
              </span>
              {domain && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
                  {domain}
                </span>
              )}
            </div>

            {/* Direct link button top right */}
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors z-20"
              title={cleanUrl}
            >
              <ExternalLink size={12} />
            </a>
          </div>
        ) : (
          <div className="mt-2 max-w-sm">
            <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400 px-1">
              <span className="font-mono text-slate-400 flex items-center gap-1">
                <ImageIcon size={12} className="text-cent" /> {domain}
              </span>
              <button
                type="button"
                onClick={() => setShowMedia(false)}
                className="hover:text-white underline font-bold"
              >
                {t('chat.hideImage')}
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-700/80 shadow-lg bg-slate-950/90 p-1">
              <img
                src={cleanUrl}
                alt={alt || "Chat image"}
                className="max-h-72 w-auto max-w-full rounded-lg object-contain cursor-pointer hover:opacity-95 transition-opacity"
                loading="lazy"
                referrerPolicy="no-referrer"
                onClick={() => window.open(cleanUrl, '_blank')}
              />
            </div>
          </div>
        )}
      </span>
    );
  }

  return (
    <a
      href={cleanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cent underline hover:opacity-80 break-all"
    >
      {label || url}
    </a>
  );
};

const renderSafeMessage = (text: string) => {
  if (!text) return null;

  // Pattern 1: Markdown image ![alt](url) -> match[1]=alt, match[2]=url
  // Pattern 2: Markdown link [label](url) -> match[3]=label, match[4]=url
  // Pattern 3: Raw URL https://... -> match[5]=url
  const pattern = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)|\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)|(https?:\/\/[^\s<>\)"]+)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    if (match[2]) {
      // Markdown Image
      elements.push(<MediaLink key={match.index} url={match[2]} alt={match[1]} />);
    } else if (match[4]) {
      // Markdown Link
      elements.push(<MediaLink key={match.index} url={match[4]} label={match[3]} />);
    } else if (match[5]) {
      // Raw URL
      let raw = match[5];
      let trailing = '';
      const trailMatch = raw.match(/[.,!?]+$/);
      if (trailMatch) {
        trailing = trailMatch[0];
        raw = raw.slice(0, -trailing.length);
      }
      elements.push(<MediaLink key={match.index} url={raw} />);
      if (trailing) {
        elements.push(trailing);
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements;
};

const Chat: React.FC = () => {
  const { user, lightAccount, customJson } = useAuth();
  const { t } = useLanguage();
  const { community } = useCommunity();

  const communityName = community ? (community.charAt(0).toUpperCase() + community.slice(1).toLowerCase()) : 'News';
  const communityDefaultId = `${community.toLowerCase()}_public_chat`;

  // Channel & Custom ID state
  const [selectedChannelPreset, setSelectedChannelPreset] = useState<string>('community');
  const [customChannelInput, setCustomChannelInput] = useState<string>('hive.micro');
  const [appliedCustomChannel, setAppliedCustomChannel] = useState<string>('hive.micro');

  const activeCustomId = selectedChannelPreset === 'custom'
    ? (appliedCustomChannel.trim() || 'hive.micro')
    : (selectedChannelPreset === 'community' ? communityDefaultId : selectedChannelPreset);

  // Messages & UI state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'microblog'>('chat');

  // Refresh controls
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // 30s default

  const fetchMessages = async (startBlock?: number, silent: boolean = false) => {
    if (!silent && !startBlock) {
      setIsRefreshing(true);
    }
    try {
      const url = `https://rpc.mahdiyari.info/hafsql/operations/custom_json/${activeCustomId}?limit=50${startBlock ? `&start=${startBlock}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      
      const parsedMessages: ChatMessage[] = data.map((item: any) => {
        let msgText: any = '';
        let nickname = undefined;
        try {
          const parsedJson = typeof item.json === 'string' ? JSON.parse(item.json) : item.json;
          if (parsedJson && typeof parsedJson === 'object') {
            msgText = parsedJson.message ?? parsedJson.text ?? parsedJson.body ?? parsedJson.content ?? '';
            if (parsedJson.author_nickname) {
              nickname = parsedJson.author_nickname;
            } else if (parsedJson.nickname) {
              nickname = parsedJson.nickname;
            }
          } else {
            msgText = parsedJson ?? '';
          }
        } catch (e) {
          msgText = typeof item.json === 'string' ? item.json : (item.json ? JSON.stringify(item.json) : '');
        }

        if (typeof msgText !== 'string') {
          if (msgText && typeof msgText === 'object') {
            msgText = JSON.stringify(msgText);
          } else {
            msgText = String(msgText ?? '');
          }
        }

        return {
          id: item.id || `${item.block_num}-${item.trx_id || Math.random()}`,
          timestamp: item.timestamp,
          author: (item.required_posting_auths && item.required_posting_auths[0]) || (item.required_auths && item.required_auths[0]) || 'Unknown',
          message: msgText,
          block_num: item.block_num,
          nickname
        };
      }).filter((m: ChatMessage) => typeof m.message === 'string' && m.message.trim() !== '');

      if (parsedMessages.length < 50) {
        setHasMore(false);
      }

      if (startBlock) {
        setMessages(prev => {
           const newMsgs = parsedMessages.filter(nm => !prev.some(pm => pm.id === nm.id));
           return [...prev, ...newMsgs];
        });
      } else {
        setMessages(prev => {
           if (prev.length === 0) return parsedMessages;
           // If polling, prepend new messages that aren't in state
           const newMsgs = parsedMessages.filter(nm => !prev.some(pm => pm.id === nm.id));
           
           // Remove temp optimistic messages that match the new ones
           const newPrev = prev.filter(pm => {
              if (pm.id.startsWith('temp-')) {
                 return !newMsgs.some(nm => nm.author === pm.author && nm.message === pm.message);
              }
              return true;
           });

           return [...newMsgs, ...newPrev];
        });
        if (!startBlock) {
          setHasMore(parsedMessages.length >= 50);
        }
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch when channel ID changes
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setHasMore(true);
    fetchMessages().finally(() => setLoading(false));
  }, [activeCustomId]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchMessages(undefined, true);
    }, autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [activeCustomId, autoRefreshInterval]);

  const handleManualRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchMessages(undefined, false).finally(() => setIsRefreshing(false));
  };

  const handleApplyCustomChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (customChannelInput.trim()) {
      setAppliedCustomChannel(customChannelInput.trim());
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputText.trim() || sending) return;

    setSending(true);
    
    const payload = {
      message: inputText.trim(),
      app: `${community}Explorer/1.0`
    };

    try {
      const res = await customJson(
        activeCustomId, 
        payload, 
        `Chat Message (${activeCustomId})`, 
        'Posting'
      );

      if (res.success) {
        // Optimistically add the message to the list
        const optimisticMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: user || '',
          message: inputText.trim(),
          block_num: 999999999,
          nickname: lightAccount?.nickname
        };
        setMessages(prev => [optimisticMsg, ...prev]);
        setInputText('');
      } else {
        alert(t('chat.errorSend') + res.msg);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestBlock = Math.min(...messages.map(m => m.block_num));
    await fetchMessages(oldestBlock);
    setLoadingMore(false);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
             <MessageSquare className="text-cent" /> 
             {communityName} {t('chat.title')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">{t('chat.subtitle')}</p>
        </div>
      </div>

      {/* Control Bar: Channel Selector, Manual Refresh, Auto-Refresh Interval & View Mode */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-3 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Channel Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white">
            <Hash size={14} className="text-cent shrink-0" />
            <select
              value={selectedChannelPreset}
              onChange={(e) => setSelectedChannelPreset(e.target.value)}
              className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value="community" className="bg-slate-900 text-white">
                {t('chat.presetCommunity', { community: communityName })}
              </option>
              <option value="hive.micro" className="bg-slate-900 text-white">
                hive.micro
              </option>
              <option value="custom" className="bg-slate-900 text-white">
                {t('chat.customChannel')}
              </option>
            </select>
          </div>

          {/* Custom ID Input form if 'custom' selected */}
          {selectedChannelPreset === 'custom' && (
            <form onSubmit={handleApplyCustomChannel} className="flex items-center gap-1">
              <input
                type="text"
                value={customChannelInput}
                onChange={(e) => setCustomChannelInput(e.target.value)}
                placeholder={t('chat.enterCustomId')}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cent w-36 sm:w-44"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-cent border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors"
                title="Aplicar ID"
              >
                <Check size={14} />
              </button>
            </form>
          )}

          {/* Active ID Badge */}
          <span className="hidden sm:inline-flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-300 border border-slate-700/50">
            ID: <strong className="text-cent font-bold">{activeCustomId}</strong>
          </span>
        </div>

        {/* Right: Refresh Controls & View Toggle */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 hover:bg-slate-700 text-xs font-bold text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title={t('chat.refresh')}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-cent' : 'text-slate-300'} />
            <span className="hidden xs:inline">{t('chat.refresh')}</span>
          </button>

          {/* Auto Refresh Select */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span className="hidden sm:inline text-slate-400">{t('chat.autoRefresh')}</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent font-mono text-white focus:outline-none cursor-pointer text-xs"
            >
              <option value={0} className="bg-slate-900 text-white">{t('chat.off')}</option>
              <option value={10} className="bg-slate-900 text-white">10s</option>
              <option value={30} className="bg-slate-900 text-white">30s</option>
              <option value={60} className="bg-slate-900 text-white">60s</option>
              <option value={300} className="bg-slate-900 text-white">5m</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('chat')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${viewMode === 'chat' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <MessageCircle size={13} />
              <span className="hidden xs:inline">{t('chat.chatMode')}</span>
            </button>
            <button
              onClick={() => setViewMode('microblog')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${viewMode === 'microblog' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutList size={13} />
              <span className="hidden xs:inline">{t('chat.feedMode')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="flex-1 bg-card border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        {/* Messages List */}
        <div className={`flex-1 p-4 overflow-y-auto ${viewMode === 'chat' ? 'flex flex-col-reverse gap-4' : 'flex flex-col gap-4 bg-slate-950/50'}`}>
          {loading && messages.length === 0 ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="animate-spin text-cent" size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
               <MessageSquare size={48} className="mb-4 opacity-20" />
               <p className="font-bold">{t('chat.noMessages')}</p>
               <p className="text-sm text-slate-500">{t('chat.beFirst')}</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                 const isOptimistic = msg.id.startsWith('temp-');
                 const isMe = isOptimistic || (lightAccount 
                   ? (msg.author === user && msg.nickname === lightAccount.nickname)
                   : (msg.author === user && !msg.nickname));

                 const avatarUrl = sanitizeUrl(getAuthorAvatarUrl(msg.author, msg.nickname));

                 if (viewMode === 'microblog') {
                   return (
                     <div key={msg.id} className={`bg-slate-900 border ${isOptimistic ? 'border-dashed border-slate-700 opacity-70' : 'border-slate-800'} rounded-xl p-4 flex gap-3 transition-all shadow-sm`}>
                        <img 
                          src={avatarUrl} 
                          alt={msg.author} 
                          className="w-10 h-10 rounded-full object-cover shrink-0 bg-slate-800 border border-slate-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = sanitizeUrl(`https://images.hive.blog/u/${msg.author}/avatar/small`);
                          }}
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between mb-1 gap-2">
                             <span className="font-bold text-cent truncate">
                               {msg.nickname ? `${msg.nickname} (@${msg.author})` : msg.author}
                             </span>
                             <div className="flex items-center gap-2 shrink-0">
                               {isOptimistic && <Loader2 size={12} className="animate-spin text-cent" />}
                               <span className="text-[11px] font-mono text-slate-500">{new Date(msg.timestamp).toLocaleString()}</span>
                             </div>
                           </div>
                           <div className="text-sm text-slate-300 break-words whitespace-pre-wrap leading-relaxed">{renderSafeMessage(msg.message)}</div>
                        </div>
                     </div>
                   );
                 }

                 return (
                   <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isOptimistic ? 'opacity-70' : ''}`}>
                     <div className="flex items-center gap-2 mb-1 px-1">
                        {!isMe && (
                          <img 
                            src={avatarUrl} 
                            alt={msg.author} 
                            className="w-5 h-5 rounded-full object-cover bg-slate-800"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = sanitizeUrl(`https://images.hive.blog/u/${msg.author}/avatar/small`);
                            }}
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span className={`text-xs font-medium ${isMe ? "text-cent font-bold" : "text-slate-400"}`}>
                          {isMe 
                            ? (lightAccount ? `${t("chat.you")} (${lightAccount.nickname})` : t("chat.you")) 
                            : (msg.nickname ? `${msg.nickname} (@${msg.author})` : msg.author)}
                        </span>
                        <div className="flex items-center gap-1">
                          {isOptimistic && <Loader2 size={10} className="animate-spin text-cent" />}
                          <span className="text-[10px] font-mono text-slate-500">
                             {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                     </div>
                     <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-cent text-slate-900 rounded-tr-sm font-medium' : 'bg-slate-800 text-white rounded-tl-sm border border-slate-700/50'}`}>
                        <div className="break-words whitespace-pre-wrap leading-relaxed">{renderSafeMessage(msg.message)}</div>
                     </div>
                   </div>
                 );
              })}
              
              {hasMore && (
                <div className="flex justify-center pt-4 pb-2">
                  <button 
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700/80 shadow-md"
                  >
                    {loadingMore ? <Loader2 size={14} className="animate-spin text-cent" /> : <RefreshCw size={14} />}
                    {t('chat.loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-700/50">
          {user ? (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cent transition-colors"
                maxLength={2000}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="bg-cent text-slate-900 px-4 sm:px-6 py-3 rounded-xl font-bold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-cent/10"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span className="hidden sm:inline">{t('chat.send')}</span>
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 text-slate-400 py-3 bg-slate-950 rounded-xl border border-slate-800 text-sm">
              <AlertCircle size={18} />
              <span>{t('chat.loginToChat')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
