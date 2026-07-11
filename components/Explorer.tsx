import React, { useEffect, useState } from "react";
import {
  getHivePosts,
  getTribeInfo,
  getTrendingTags, getAdminCuratedPosts, getPostContent, getScotPost,
} from "../services/hiveEngineService";
import { HivePost, TribeInfo } from "../types";
import { communityConfig, bannedUsers } from "../config";
import { sanitizeUrl } from "../utils/security";
import { extractImage, getProxiedImageUrl } from "../utils/image";
import {
  MessageCircle,
  Heart,
  Calendar,
  ExternalLink,
  Filter,
  Loader2,
  Info,
  ThumbsDown,
  Edit3,
  LayoutGrid,
  List,
  ChevronRight,
  Home,
  Search,
  Star,
  StarOff,
  PanelLeftClose,
  PanelLeftOpen,
  Code2,
  Globe,
  Database,
  Cloud,
  Blocks,
  Smartphone,
  Wrench,
  Sparkles,
  Hash,
  Layers,
  Newspaper,
  BookOpen, VolumeX, Volume2, MoreVertical, RefreshCw
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCommunity } from "../contexts/CommunityContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { TOPICS } from "../constants";
import VoteModal from "./VoteModal";
import { VotersModal } from "./VotersModal";

const getTopicIcon = (id: string, size = 16) => {
  switch (id) {
    case "javascript":
      return <Code2 size={size} />;
    case "webdev":
      return <Globe size={size} />;
    case "backend":
      return <Database size={size} />;
    case "devops":
      return <Cloud size={size} />;
    case "blockchain":
      return <Blocks size={size} />;
    case "mobile":
      return <Smartphone size={size} />;
    case "tools":
      return <Wrench size={size} />;
    case "ai":
      return <Sparkles size={size} />;
    default:
      return <Layers size={size} />;
  }
};

const JOURNAL_CATEGORIES = [
  { id: 'news_entertainment', label: 'Entertainment' },
  { id: 'news_politics', label: 'Politics' },
  { id: 'news_sport', label: 'Sport' },
  { id: 'news_philosophy', label: 'Philosophy' },
  { id: 'news_crypto', label: 'Crypto' },
  { id: 'news_economy', label: 'Economy' },
];

const getGradientPlaceholder = (seed: string, categoryId?: string) => {
  if (categoryId) {
    const themeColors: Record<string, { hue1: number, hue2: number }> = {
      news_highlight: { hue1: 345, hue2: 15 },    
      news_entertainment: { hue1: 25, hue2: 45 }, 
      news_politics: { hue1: 350, hue2: 10 },     
      news_sport: { hue1: 140, hue2: 160 },       
      news_philosophy: { hue1: 270, hue2: 290 },  
      news_crypto: { hue1: 200, hue2: 220 },      
      news_economy: { hue1: 210, hue2: 230 }      
    };
    const hues = themeColors[categoryId];
    if (hues) {
      return `linear-gradient(135deg, hsl(${hues.hue1}, 50%, 15%), hsl(${hues.hue2}, 50%, 10%))`;
    }
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 40%, 15%), hsl(${hue2}, 40%, 10%))`;
};

const CATEGORY_THEMES: Record<string, {
  color: string;
  border: string;
  bg: string;
  hoverText: string;
  accentText: string;
  text: string;
  line: string;
}> = {
  news_entertainment: {
    color: 'text-orange-500',
    border: 'border-orange-500',
    bg: 'bg-orange-600 hover:bg-orange-500',
    hoverText: 'hover:text-orange-400',
    accentText: 'text-orange-400 group-hover/item:text-orange-300',
    text: 'text-orange-500',
    line: 'bg-orange-500'
  },
  news_politics: {
    color: 'text-red-500',
    border: 'border-red-500',
    bg: 'bg-red-700 hover:bg-red-600',
    hoverText: 'hover:text-red-400',
    accentText: 'text-red-400 group-hover/item:text-red-300',
    text: 'text-red-500',
    line: 'bg-red-500'
  },
  news_sport: {
    color: 'text-emerald-500',
    border: 'border-emerald-500',
    bg: 'bg-emerald-600 hover:bg-emerald-500',
    hoverText: 'hover:text-emerald-400',
    accentText: 'text-emerald-400 group-hover/item:text-emerald-300',
    text: 'text-emerald-500',
    line: 'bg-emerald-500'
  },
  news_philosophy: {
    color: 'text-indigo-500',
    border: 'border-indigo-500',
    bg: 'bg-indigo-700 hover:bg-indigo-600',
    hoverText: 'hover:text-indigo-400',
    accentText: 'text-indigo-400 group-hover/item:text-indigo-300',
    text: 'text-indigo-500',
    line: 'bg-indigo-500'
  },
  news_crypto: {
    color: 'text-amber-500',
    border: 'border-amber-500',
    bg: 'bg-amber-600 hover:bg-amber-500',
    hoverText: 'hover:text-amber-400',
    accentText: 'text-amber-400 group-hover/item:text-amber-300',
    text: 'text-amber-500',
    line: 'bg-amber-500'
  },
  news_economy: {
    color: 'text-cyan-500',
    border: 'border-cyan-500',
    bg: 'bg-cyan-600 hover:bg-cyan-500',
    hoverText: 'hover:text-cyan-400',
    accentText: 'text-cyan-400 group-hover/item:text-cyan-300',
    text: 'text-cyan-500',
    line: 'bg-cyan-500'
  }
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  news_entertainment: ['news_entertainment', 'entertainment', 'entretenimento', 'art', 'music', 'cinema', 'tv', 'culture', 'filme', 'musica', 'geek', 'pop'],
  news_politics: ['news_politics', 'politics', 'politica', 'governo', 'geopolitics', 'worldnews', 'news'],
  news_sport: ['news_sport', 'sport', 'sports', 'esporte', 'esportes', 'futebol', 'soccer', 'football', 'mma', 'ufc', 'basketball'],
  news_philosophy: ['news_philosophy', 'philosophy', 'filosofia', 'history', 'historia', 'science', 'ciencia', 'books', 'livros'],
  news_crypto: ['news_crypto', 'crypto', 'bitcoin', 'hive', 'blockchain', 'ethereum', 'cryptocurrency', 'token', 'web3', 'pob', 'news-crypto'],
  news_economy: ['news_economy', 'economy', 'economia', 'finance', 'financas', 'business', 'negocios', 'investing', 'investimentos', 'money']
};

const getPostTags = (post: HivePost): string[] => {
  const tags: string[] = [];
  if (post.parent_permlink) {
    tags.push(post.parent_permlink.toLowerCase());
  }
  if (post.json_metadata) {
    try {
      const meta = typeof post.json_metadata === 'string' ? JSON.parse(post.json_metadata) : post.json_metadata;
      if (meta && Array.isArray(meta.tags)) {
        meta.tags.forEach((t: any) => {
          if (typeof t === 'string') {
            tags.push(t.toLowerCase());
          }
        });
      }
    } catch (e) {}
  }
  return Array.from(new Set(tags));
};

const Explorer: React.FC = () => {
  const { user, vote, customJson } = useAuth();
  const { community } = useCommunity();
  const { t, language } = useLanguage();
  const [, setSearchParams] = useSearchParams();
  const globalLocation = useLocation();
  const actualLocation = globalLocation.state?.backgroundLocation || globalLocation;
  const currentSearchParams = new URLSearchParams(actualLocation.search);
  
  const initialTag = currentSearchParams.get("tag") || "";
  const initialParentTag =
    TOPICS.find((t) => t.id === initialTag || t.sub.includes(initialTag))?.id ||
    null;

  const [posts, setPosts] = useState<HivePost[]>([]);
  const [tribeInfo, setTribeInfo] = useState<TribeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"created" | "trending" | "hot">("created");
  const [tag, setTag] = useState<string>(initialTag);
  const [selectedParentTag, setSelectedParentTag] = useState<string | null>(
    initialParentTag,
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [votingPost, setVotingPost] = useState<string | null>(null);
  const [voteModalPost, setVoteModalPost] = useState<HivePost | null>(null); // permlink of post being voted on
  const [votersModalPost, setVotersModalPost] = useState<HivePost | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (
      (localStorage.getItem("explorer_view_mode") as "grid" | "list") || "grid"
    );
  });
  
  const [layoutMode, setLayoutMode] = useState<"classic" | "journal">(() => {
    return (
      (localStorage.getItem("explorer_layout_mode") as "classic" | "journal") || "journal"
    );
  });
  const [curatedPosts, setCuratedPosts] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem(`journal_cache_${community}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.curatedPosts || [];
      }
    } catch (e) {}
    return [];
  });
  const [cacheList, setCacheList] = useState<HivePost[]>([]);
  const [loadingCurations, setLoadingCurations] = useState(false);
  const [curatingPost, setCuratingPost] = useState<HivePost | null>(null);
  const [openAdminMenu, setOpenAdminMenu] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<
    "collapsed" | "expanded"
  >(() => {
    return (
      (localStorage.getItem("explorer_sidebar_mode") as
        "collapsed" | "expanded") || "expanded"
    );
  });

  const [categorySearch, setCategorySearch] = useState("");
  const [favoriteTags, setFavoriteTags] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("favoriteTags") || "[]");
    } catch {
      return [];
    }
  });
  const [trendingTags, setTrendingTags] = useState<string[]>([]);

  const fetchCurations = async (forceRefresh: boolean = false) => {
    const cacheKey = `journal_cache_${community}`;

    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const TWELVE_HOURS = 12 * 60 * 60 * 1000;
          if (Date.now() - parsed.timestamp < TWELVE_HOURS) {
            setCuratedPosts(parsed.curatedPosts || []);
            return;
          }
        }
      } catch (e) {
        console.error("Error reading journal cache:", e);
      }
    }

    setLoadingCurations(true);
    try {
      // 1. Fetch 200 latest discussions from SCOT (Cache)
      let cache = await getHivePosts(community, 'created', 200);
      
      // Load fallback discussions to avoid individual fetches for older curated posts
      try {
        const fallbackRes = await fetch('./fallback_discussions.json');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData)) {
            // Append fallback data to cache, avoiding duplicates
            const cacheKeys = new Set(cache.map(p => `${p.author}/${p.permlink}`));
            const uniqueFallback = fallbackData.filter(p => !cacheKeys.has(`${p.author}/${p.permlink}`));
            cache = [...cache, ...uniqueFallback];
          }
        }
      } catch (err) {
        console.error("Failed to load fallback for curations", err);
      }

      setCacheList(cache);

      // 2. Fetch admin curation list
      const curations = await getAdminCuratedPosts('faireye');

      // 3. Match curation list to cache or fetch individually
      const withContent = [];
      const chunkSize = 5;
      for (let i = 0; i < curations.length; i += chunkSize) {
        const chunk = curations.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map(async (c: any) => {
          let post = cache.find(p => p.author === c.author && p.permlink === c.permlink);
          if (!post) {
            try {
              const [scot, hive] = await Promise.all([
                 getScotPost(c.author, c.permlink, community),
                 getPostContent(c.author, c.permlink)
              ]);
              if (hive) {
                 post = { ...hive, ...scot, json_metadata: hive.json_metadata, body: hive.body, active_votes: scot?.active_votes || hive.active_votes };
              } else {
                 post = scot;
              }
            } catch (err) {
              console.error("Error fetching curated post", c.permlink, err);
            }
          }
          return { ...c, post };
        }));
        withContent.push(...chunkResults);
        
        // Small delay between chunks
        if (i + chunkSize < curations.length) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      const finalCurated = withContent.filter(c => c.post);
      setCuratedPosts(finalCurated);

      try {
        const compactCurated = finalCurated.map(c => {
          if (!c.post) return c;
          const p = c.post;
          return {
            ...c,
            post: {
              ...p,
              body: p.body ? p.body.substring(0, 300) : "", // Only need a snippet
              active_votes: p.active_votes
                ? p.active_votes
                    .filter((v: any) => v.percent !== 0)
                    .map((v: any) => ({ voter: v.voter, percent: v.percent }))
                : []
            }
          };
        });

        localStorage.setItem(cacheKey, JSON.stringify({
          curatedPosts: compactCurated,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error("Error writing journal cache:", e);
      }
    } catch (error) {
      console.error("Error fetching curations:", error);
    } finally {
      setLoadingCurations(false);
    }
  };

  const [mutingPostPermlink, setMutingPostPermlink] = useState<string | null>(null);

  const handlePostMute = async (post: HivePost, mute: boolean) => {
    if (!user) return;
    try {
      setMutingPostPermlink(post.permlink);
      const payload = {
        contractName: 'comments',
        contractAction: 'setPostMute',
        contractPayload: {
          rewardPoolId: 55,
          authorperm: `@${post.author}/${post.permlink}`,
          mute: mute
        }
      };

      const response = await customJson(
        'ssc-mainnet-hive',
        payload,
        `${mute ? 'Mute' : 'Unmute'} Post`,
        'Active'
      );

      if (response.success) {
        alert(`Successfully ${mute ? 'muted' : 'unmuted'} post.`);
      } else {
        alert(response.message || 'Failed to broadcast transaction.');
      }
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred.');
    } finally {
      setMutingPostPermlink(null);
    }
  };

  const handleCurate = async (post: HivePost, flair: string) => {
    const json = {
      author: post.author,
      permlink: post.permlink,
      link: `/@${post.author}/${post.permlink}`,
      date: new Date().toISOString()
    };
    try {
      await customJson(`news_${flair}`, json, `Curate ${flair}`);
      alert(`Successfully curated under news_${flair}!`);
      // Reload curated posts
      if (layoutMode === "journal") {
        fetchCurations(true);
      }
    } catch (err: any) {
      alert("Failed to curate: " + (err.message || err));
    }
  };

  const toggleFavorite = (e: React.MouseEvent, tagStr: string) => {
    e.stopPropagation();
    setFavoriteTags((prev) => {
      const newFavs = prev.includes(tagStr)
        ? prev.filter((t) => t !== tagStr)
        : [...prev, tagStr];
      localStorage.setItem("favoriteTags", JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const filteredTopics = TOPICS.map((t) => {
    const lowerSearch = categorySearch.toLowerCase().trim();
    if (!lowerSearch) return { ...t, expandAlways: false };

    const matchesParent =
      t.label.toLowerCase().includes(lowerSearch) ||
      t.id.toLowerCase().includes(lowerSearch);
    const matchingSub = t.sub.filter((s) =>
      s.toLowerCase().includes(lowerSearch),
    );

    if (matchesParent || matchingSub.length > 0) {
      return {
        ...t,
        sub: matchesParent ? t.sub : matchingSub,
        expandAlways: true,
      };
    }
    return null;
  }).filter(Boolean) as any[];

  // If URL changes, update the states

  useEffect(() => {
    if (layoutMode === "journal") {
      fetchCurations();
    }
  }, [layoutMode, community]);

  useEffect(() => {
    const params = new URLSearchParams(actualLocation.search);
    const freshTag = params.get("tag") || "";
    setTag(freshTag);
    setSelectedParentTag(
      TOPICS.find((t) => t.id === freshTag || t.sub.includes(freshTag))?.id ||
        null,
    );
  }, [actualLocation.search]);

  useEffect(() => {
    localStorage.setItem("explorer_view_mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("explorer_layout_mode", layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    localStorage.setItem("explorer_sidebar_mode", sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    const init = async () => {
      const [info, tags] = await Promise.all([
        getTribeInfo(community),
        getTrendingTags(community, 20),
      ]);
      setTribeInfo(info);
      setTrendingTags(tags);
      fetchPosts(true);
    };
    init();
  }, [sort, community, tag]);

  const fetchPosts = async (reset: boolean, silent: boolean = false) => {
    if (reset && !silent) {
      setLoading(true);
      setPosts([]);
    } else if (!reset) {
      setLoadingMore(true);
    }

    let startAuthor, startPermlink;
    if (!reset && posts.length > 0) {
      const lastPost = posts[posts.length - 1];
      startAuthor = lastPost.author;
      startPermlink = lastPost.permlink;
    }

    const data = await getHivePosts(
      community,
      sort,
      20,
      startAuthor,
      startPermlink,
      tag,
    );

    const lowercaseBanned = (bannedUsers || []).map((u) => u.toLowerCase());
    const filteredData = data.filter(
      (p) => !lowercaseBanned.includes(p.author.toLowerCase()),
    );

    if (reset) {
      setPosts(filteredData);
    } else {
      const newPosts = filteredData.filter(
        (p) => !posts.find((existing) => existing.permlink === p.permlink),
      );
      setPosts((prev) => [...prev, ...newPosts]);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    const handleByteUpdate = (e: any) => {
      if (e.detail?.sort === sort) {
        fetchPosts(true, true);
      }
    };
    window.addEventListener("token-data-updated", handleByteUpdate);
    return () =>
      window.removeEventListener("token-data-updated", handleByteUpdate);
  }, [sort, community, tag]);

  const handleVoteClick = (post: HivePost) => {
    if (!user) {
      alert("Faça login para votar!");
      return;
    }
    const alreadyVoted = post.active_votes?.some((v) => v.voter === user);
    if (alreadyVoted) {
      alert("Você já votou neste post.");
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
        setPosts((currentPosts) =>
          currentPosts.map((p) => {
            if (p.author === voteModalPost.author && p.permlink === voteModalPost.permlink) {
              const currentVotes = p.active_votes || [];
              return {
                ...p,
                active_votes: [
                  ...currentVotes,
                  {
                    voter: user,
                    weight,
                    rshares: 0,
                    percent: weight,
                  },
                ],
              };
            }
            return p;
          })
        );
      } else {
        alert("Erro ao votar: " + result.msg);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao votar.");
    } finally {
      setVotingPost(null);
      setVoteModalPost(null);
    }
  };

  const getCalculatedReward = (post: HivePost) => {
    try {
      const precision = post.precision ?? tribeInfo?.precision ?? (communityConfig.tokenSymbol.toUpperCase() === 'POB' ? 8 : 2);
      const isLegacy = communityConfig.useLegacyScot;

      // 1. Prioritize pending_token if present and valid
      if (post.pending_token != null && post.pending_token > 0) {
        const val = isLegacy ? (post.pending_token / Math.pow(10, precision)) : post.pending_token;
        return val.toFixed(precision);
      }

      // 2. Check if post is paid out (author_payout_value, curator_payout_value, beneficiary_payout_value)
      const authorPayout = Number((post as any).author_payout_value) || 0;
      const curatorPayout = Number((post as any).curator_payout_value) || 0;
      const beneficiaryPayout = Number((post as any).beneficiary_payout_value) || 0;
      const totalPaid = authorPayout + curatorPayout + beneficiaryPayout;
      if (totalPaid > 0) {
        const val = isLegacy ? (totalPaid / Math.pow(10, precision)) : totalPaid;
        return val.toFixed(precision);
      }


      // 4. Dynamic Calculation using rshares as a fallback
      if (tribeInfo && post.vote_rshares != null) {
        const rshares = Number(post.vote_rshares);
        const exponent =
          tribeInfo.author_curve_exponent != null
            ? Number(tribeInfo.author_curve_exponent)
            : 1;
        const rewardPool =
          tribeInfo.reward_pool != null ? parseFloat(tribeInfo.reward_pool) : 0;
        const pendingRshares =
          tribeInfo.pending_rshares != null
            ? parseFloat(tribeInfo.pending_rshares)
            : 0;

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
      console.error("Error calculating reward", e);
      return (0).toFixed(tribeInfo?.precision ?? 2);
    }
  };

  const getVoteCounts = (post: HivePost) => {
    if (!post.active_votes || !Array.isArray(post.active_votes)) {
      // Fallback if active_votes is missing, assuming net_votes are mostly upvotes
      return { up: post.net_votes, down: 0 };
    }

    let up = 0;
    let down = 0;

    post.active_votes.forEach((vote) => {
      if (vote.percent > 0) up++;
      else if (vote.percent < 0) down++;
    });

    return { up, down };
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString + "Z");
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
  };

  const getExcerpt = (text: string, length: number = 180) => {
    if (!text) return "";
    let cleanText = text
      .replace(/!\[.*?\]\((.*?)\)/g, "") // remove markdown images
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1") // replace markdown links with text
      .replace(/(https?:\/\/[^\s]+)/g, "") // remove bare URLs
      .replace(/<[^>]*>?/gm, "") // remove HTML tags
      .replace(/[#*`_~>\|-]/g, "") // remove markdown symbols
      .replace(/\n+/g, " ") // replace newlines with space
      .replace(/\s+/g, " ") // replace multiple spaces with single space
      .trim();
    return cleanText.length > length
      ? cleanText.substring(0, length) + "..."
      : cleanText;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      

      <div className="flex flex-col md:flex-row justify-between items-center bg-card p-3 sm:p-4 rounded-xl border border-slate-700/50 shadow-lg relative overflow-hidden gap-3">
        <div className={`absolute top-0 right-0 py-8 px-12 blur-[80px] rounded-full pointer-events-none ${layoutMode === "journal" ? "bg-hive/5" : "bg-cent/5"}`}></div>
        <div className="w-full md:w-auto relative z-10">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <span className={layoutMode === "journal" ? "text-hive" : "text-cent"}>#{community}</span>{" "}
            {t("explorer.title")}
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-2 font-medium">
            {t("explorer.subtitle")}
            {tribeInfo && tribeInfo.reward_pool && (
              <span className={`bg-slate-800 text-[10px] px-2 py-0.5 rounded font-mono ${layoutMode === "journal" ? "text-slate-300 border border-slate-700" : "text-cent border border-cent/20"}`}>
                Pool: {parseFloat(tribeInfo.reward_pool).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: tribeInfo.precision ?? 2 })} {community}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <Link
              to="/create-post"
              className={`flex items-center gap-1.5 ${layoutMode === "journal" ? "bg-white text-slate-900" : "bg-cent text-slate-900"} px-3.5 py-2 text-xs rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,200,0,0.3)] transition-all whitespace-nowrap`}
            >
              <Edit3 size={14} />
              {t("nav.post")}
            </Link>
            
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 shadow-inner gap-0.5">
              <button
                onClick={() => setLayoutMode("classic")}
                className={`p-1 px-2.5 flex items-center gap-1.5 text-xs font-bold rounded-md transition-all ${layoutMode === "classic" ? "bg-slate-800 text-cent shadow border border-slate-700/50" : "text-slate-500 hover:text-white"}`}
                title="Design Classic"
              >
                <Layers size={14} />
                <span className="hidden sm:inline">Classic</span>
              </button>
              <button
                onClick={() => setLayoutMode("journal")}
                className={`p-1 px-2.5 flex items-center gap-1.5 text-xs font-bold rounded-md transition-all ${layoutMode === "journal" ? "bg-slate-800 text-white shadow border border-slate-700/50" : "text-slate-500 hover:text-white"}`}
                title="Design Jornal"
              >
                <Newspaper size={14} />
                <span className="hidden sm:inline">Journal</span>
              </button>
              {layoutMode === "journal" && (
                <button
                  onClick={() => fetchCurations(true)}
                  disabled={loadingCurations}
                  className="p-1 px-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-all disabled:opacity-50 flex items-center justify-center"
                  title="Atualizar Jornal"
                >
                  <RefreshCw size={14} className={loadingCurations ? "animate-spin text-hive" : ""} />
                </button>
              )}
            </div>

            {layoutMode === "classic" && (
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 shadow-inner">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded-md transition-all ${viewMode === "grid" ? "bg-slate-800 text-cent shadow border border-slate-700/50" : "text-slate-500 hover:text-white"}`}
                  title="Modo Grid"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1 rounded-md transition-all ${viewMode === "list" ? "bg-slate-800 text-cent shadow border border-slate-700/50" : "text-slate-500 hover:text-white"}`}
                  title="Modo Lista"
                >
                  <List size={15} />
                </button>
              </div>
            )}
          </div>
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 w-full sm:w-auto overflow-x-auto shadow-inner">
            {(["created", "trending", "hot"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize whitespace-nowrap ${
                  sort === s
                    ? (layoutMode === "journal" ? "bg-white text-slate-900 shadow-lg" : "bg-cent text-slate-900 shadow-lg")
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {s === "created"
                  ? t("explorer.new")
                  : s === "hot"
                    ? t("explorer.trending")
                    : t("explorer.hot")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Trending Tags */}
      <div className="lg:hidden w-full overflow-x-auto py-1.5 flex items-center gap-2 scrollbar-hide mb-1 mt-2">
        <button
          onClick={() => setSearchParams({})}
          className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-medium transition-colors ${!tag ? "bg-cent text-slate-900 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
        >
          {t("explorer.all")}
        </button>
        {trendingTags.map((tStr) => (
          <button
            key={`mob-${tStr}`}
            onClick={() => setSearchParams({ tag: tStr })}
            className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-medium transition-colors ${tag === tStr ? "bg-cent text-slate-900 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            #{tStr}
          </button>
        ))}
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium px-2 py-1 select-none">
        <button
          onClick={() => setSearchParams({})}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <Home size={14} />
          <span>Home</span>
        </button>
        <ChevronRight size={12} className="text-slate-600" />
        <button
          onClick={() => setSearchParams({})}
          className={`hover:text-white transition-colors ${!tag ? "text-slate-300 font-bold" : ""}`}
        >
          Explorer
        </button>
        {tag && (
          <>
            <ChevronRight size={12} className="text-slate-600" />
            <span className={layoutMode === "journal" ? "text-hive font-bold uppercase" : "text-cent font-bold uppercase"}>
              #{tag}
            </span>
          </>
        )}
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 relative">
        {/* Sidebar */}
        {layoutMode !== "journal" && (
          <div
            className={`shrink-0 transition-all duration-300 hidden lg:block ${sidebarCollapsed === "expanded" ? "lg:w-64" : "lg:w-12"}`}
          >
          <div className="bg-card p-5 rounded-2xl border border-slate-700/50 shadow-lg sticky top-24">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700/50">
              {sidebarCollapsed === "expanded" && (
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <Filter size={18} className="text-cent" />
                  {t("explorer.categories")}
                </div>
              )}
              <button
                onClick={() =>
                  setSidebarCollapsed((prev) =>
                    prev === "expanded" ? "collapsed" : "expanded",
                  )
                }
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                {sidebarCollapsed === "expanded" ? (
                  <PanelLeftClose size={18} />
                ) : (
                  <PanelLeftOpen size={18} />
                )}
              </button>
            </div>

            {sidebarCollapsed === "expanded" ? (
              <>
                {/* Search Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder={t("explorer.search")}
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cent/50 transition-colors"
                  />
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <button
                      onClick={() => setSearchParams({})}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${!selectedParentTag && !tag ? "bg-cent/10 text-cent border border-cent/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                    >
                      {t("explorer.all")}
                    </button>
                  </div>

                  {favoriteTags.length > 0 && !categorySearch && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2 px-1">
                        {t("explorer.favorites")}
                      </div>
                      <div className="space-y-1">
                        {favoriteTags.map((favTag) => {
                          const parentTopic = TOPICS.find(
                            (t) => t.id === favTag || t.sub.includes(favTag),
                          );
                          return (
                            <div
                              key={`fav-${favTag}`}
                              className="relative group"
                            >
                              <button
                                onClick={() => setSearchParams({ tag: favTag })}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all pr-8 flex items-center gap-2 ${tag === favTag ? "bg-cent/10 text-cent font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                              >
                                <span className="opacity-50">
                                  {parentTopic ? (
                                    getTopicIcon(parentTopic.id, 14)
                                  ) : (
                                    <Hash size={14} />
                                  )}
                                </span>
                                <span>{favTag}</span>
                              </button>
                              <button
                                onClick={(e) => toggleFavorite(e, favTag)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-cent transition-opacity"
                                title="Remover dos favoritos"
                              >
                                <StarOff
                                  size={14}
                                  className="text-slate-400 hover:text-red-400"
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2 px-1">
                      Todas Categorias
                    </div>
                    <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {filteredTopics.map((t) => (
                        <div key={t.id} className="space-y-1">
                          <div className="relative group">
                            <button
                              onClick={() => {
                                if (
                                  selectedParentTag === t.id &&
                                  !t.expandAlways
                                ) {
                                  setSearchParams({});
                                } else {
                                  setSearchParams({ tag: t.id });
                                }
                              }}
                              className={`w-full text-left px-3 py-2 pr-8 rounded-lg text-sm font-medium transition-all flex justify-between items-center ${selectedParentTag === t.id ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={
                                    selectedParentTag === t.id
                                      ? "text-cent"
                                      : "text-slate-500"
                                  }
                                >
                                  {getTopicIcon(t.id, 16)}
                                </span>
                                <span className="truncate">{t.label}</span>
                              </div>
                            </button>
                            <button
                              onClick={(e) => toggleFavorite(e, t.id)}
                              title={
                                favoriteTags.includes(t.id)
                                  ? "Remover favorito"
                                  : "Favoritar categoria"
                              }
                              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-opacity ${favoriteTags.includes(t.id) ? "opacity-100 text-cent" : "opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300"}`}
                            >
                              <Star
                                size={14}
                                className={
                                  favoriteTags.includes(t.id) ? "fill-cent" : ""
                                }
                              />
                            </button>
                          </div>

                          {(selectedParentTag === t.id || t.expandAlways) && (
                            <div className="pl-3 py-1 space-y-1 border-l-2 border-slate-800 ml-3">
                              {t.sub.map((sub) => (
                                <div key={sub} className="relative group">
                                  <button
                                    onClick={() =>
                                      setSearchParams({ tag: sub })
                                    }
                                    className={`w-full text-left px-3 py-1.5 pr-8 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${tag === sub ? (layoutMode === "journal" ? "text-white bg-slate-800" : "text-cent bg-cent/10") + " font-bold" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
                                  >
                                    <Hash size={12} className="opacity-50" />
                                    <span className="truncate block">
                                      {sub}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => toggleFavorite(e, sub)}
                                    title={
                                      favoriteTags.includes(sub)
                                        ? "Remover favorito"
                                        : "Favoritar tag"
                                    }
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-opacity ${favoriteTags.includes(sub) ? "opacity-100 text-cent" : "opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300"}`}
                                  >
                                    <Star
                                      size={12}
                                      className={
                                        favoriteTags.includes(sub)
                                          ? "fill-cent"
                                          : ""
                                      }
                                    />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {filteredTopics.length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-4">
                          Nenhuma categoria encontrada
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 mt-4">
                {/* Collapsed icons */}
                <button
                  onClick={() => setSearchParams({})}
                  className={`p-2 rounded-lg transition-all ${!selectedParentTag && !tag ? "bg-cent/10 text-cent border border-cent/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                  title="Tudo"
                >
                  <Layers size={18} />
                </button>

                <div className="w-full h-px bg-slate-800 my-2"></div>

                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSearchParams({ tag: t.id });
                      setSidebarCollapsed("expanded");
                    }}
                    className={`p-2 rounded-lg transition-all ${selectedParentTag === t.id ? "bg-cent/10 text-cent border border-cent/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                    title={t.label}
                  >
                    {getTopicIcon(t.id, 18)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0 transition-all duration-300">
          {loading || (layoutMode === "journal" && !tag && loadingCurations) ? (
            layoutMode === "journal" && !tag ? (
              <div className="space-y-12 animate-pulse">
                <div className="h-[400px] bg-slate-800/30 rounded-2xl border border-slate-700/40"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-72 bg-slate-800/30 rounded-2xl border border-slate-700/40"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={
                  layoutMode === "journal"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    : viewMode === "grid"
                    ? `grid grid-cols-1 md:grid-cols-2 ${sidebarCollapsed === "collapsed" ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-2 xl:grid-cols-3"} gap-6`
                    : "flex flex-col gap-4"
                }
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`bg-card animate-pulse border border-slate-700/50 ${viewMode === "grid" ? "rounded-xl h-80" : "rounded-xl h-36 flex flex-col justify-center"}`}
                  >
                    {viewMode === "grid" && (
                      <div className="h-40 bg-slate-700/50 rounded-t-xl"></div>
                    )}
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                      <div className="h-4 bg-slate-700/50 rounded w-1/4 mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card rounded-2xl border border-slate-700/50">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Edit3 size={32} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t("explorer.emptyState")}
              </h3>
              <p className="text-slate-400 max-w-md mb-6">
                {t("explorer.emptyStateText")}
                {tag ? (
                  <span>
                    {" "}
                    com a tag{" "}
                    <span className={`font-mono ${layoutMode === "journal" ? "text-white bg-slate-800" : "text-cent bg-cent/10"} px-1.5 py-0.5 rounded`}>
                      #{tag}
                    </span>
                  </span>
                ) : (
                  ""
                )}
                !
              </p>
              <Link
                to="/create-post"
                className="flex items-center gap-2 bg-cent text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-cent/90 transition-all shadow-lg shadow-cent/20"
              >
                <Edit3 size={18} />
                {t("explorer.createPost")}
              </Link>
            </div>
          ) : layoutMode === "journal" && !tag ? (
            <div className="space-y-12 animate-fade-in pb-12">
               {/* Hero Section: news_highlight */}
               {(() => {
                 const highlightCuration = curatedPosts.find(c => c.id === 'news_highlight');
                 const highlightPost = highlightCuration?.post || posts[0];
                 if (!highlightPost) return null;

                 const thumbnail = extractImage(highlightPost);
                 const reward = getCalculatedReward(highlightPost);
                 const excerpt = getExcerpt(highlightPost.desc || highlightPost.body, 220);
                 const { up } = getVoteCounts(highlightPost);
                 const userHasVoted = user && highlightPost.active_votes?.some((v) => v.voter === user);
                 const isVotingThis = votingPost === highlightPost.permlink;

                 return (
                   <div className="group flex flex-col lg:flex-row gap-8 items-stretch pb-12 border-b border-slate-800 animate-fade-in">
                     <div className="w-full lg:w-3/5 h-[320px] sm:h-[420px] lg:h-[450px] rounded-2xl overflow-hidden bg-slate-900 relative shadow-inner shrink-0">
                       {thumbnail ? (
                         <img
                           src={getProxiedImageUrl(thumbnail, 800) || ""}
                           alt={highlightPost.title}
                           className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                           onError={(e) => {
                             (e.target as HTMLImageElement).src = "https://placehold.co/800x600/0f172a/334155?text=Highlighted+News";
                           }}
                         />
                       ) : (
                           <div
                              className="w-full h-full flex items-center justify-center border border-slate-800 rounded-2xl"
                              style={{ background: getGradientPlaceholder(`${highlightPost.author}-${highlightPost.permlink}`, 'news_highlight') }}
                            >
                              <BookOpen size={64} strokeWidth={1} className="text-white/20" />
                            </div>
                       )}
                       <div className="absolute top-4 left-4">
                         <span className="bg-red-600 text-white px-3 py-1 text-xs font-black uppercase tracking-wider rounded-md shadow-lg flex items-center gap-1.5 animate-pulse">
                           <Sparkles size={12} className="fill-white" />
                           Highlight
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex flex-col justify-between w-full lg:w-2/5 py-2">
                       <div>
                         <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                           <Link to={`/profile/${highlightPost.author}`} className="hover:text-white transition-colors flex items-center gap-2">
                             <img src={`https://images.hive.blog/u/${highlightPost.author}/avatar`} alt={highlightPost.author} className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700" />
                             <span className="font-extrabold text-slate-300 hover:text-white">@{highlightPost.author}</span>
                           </Link>
                           <span>&bull;</span>
                           <span className="font-mono text-slate-500">{timeAgo(highlightPost.created)}</span>
                         </div>
                         
                         <Link to={`/@${highlightPost.author}/${highlightPost.permlink}`} state={{ backgroundLocation: actualLocation }} className="block">
                           <h2 className="font-serif font-black text-white text-3xl sm:text-4xl leading-tight mb-4 group-hover:text-hive transition-colors">
                             {highlightPost.title}
                           </h2>
                           <p className="text-slate-400 font-serif leading-relaxed text-sm sm:text-base line-clamp-4">
                             {excerpt}
                           </p>
                         </Link>
                       </div>

                       <div className="pt-6 flex items-center justify-between border-t border-slate-800/80 text-slate-500 text-sm mt-6">
                         <div className="flex items-center gap-4">
                           <button
                             onClick={() => handleVoteClick(highlightPost)}
                             disabled={userHasVoted || isVotingThis}
                             className={`flex items-center gap-1.5 transition-colors ${userHasVoted ? "text-hive" : "hover:text-hive"}`}
                           >
                             {isVotingThis ? (
                               <Loader2 size={16} className="animate-spin" />
                             ) : (
                               <Heart size={16} className={userHasVoted ? "fill-hive" : ""} />
                             )}
                             <span className="font-bold">{up}</span>
                           </button>
                           <Link to={`/@${highlightPost.author}/${highlightPost.permlink}#comments`} state={{ backgroundLocation: actualLocation }} className="flex items-center gap-1.5 hover:text-white transition-colors">
                             <MessageCircle size={16} />
                             <span className="font-bold">{highlightPost.children}</span>
                           </Link>
                         </div>
                         
                         <div className="flex items-center gap-1.5 sm:gap-0">
                           <div className="font-mono font-bold text-white bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-xs">
                             {reward} {community}
                           </div>
                                                    {user === "faireye" && (
                             <div className="relative">
                               <button
                                 onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   setOpenAdminMenu(openAdminMenu === highlightPost.permlink ? null : highlightPost.permlink);
                                   setCuratingPost(null);
                                 }}
                                 className="text-slate-400 hover:text-white p-1 transition-colors rounded-full hover:bg-slate-800/80"
                                 title="Opções de Admin"
                               >
                                 <MoreVertical size={16} />
                               </button>
                               {openAdminMenu === highlightPost.permlink && (
                                 <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1.5 animate-fade-in">
                                   <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
                                     Ações de Admin
                                   </div>
                                   
                                   <button
                                     onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       setCuratingPost(curatingPost?.permlink === highlightPost.permlink ? null : highlightPost);
                                     }}
                                     className="flex items-center justify-between w-full text-left px-2 py-1.5 text-xs hover:bg-slate-800 text-slate-200 rounded transition-colors"
                                   >
                                     <span>Curar Post</span>
                                     <Star size={12} className={curatingPost?.permlink === highlightPost.permlink ? "fill-hive text-hive" : "text-slate-400"} />
                                   </button>

                                   {curatingPost?.permlink === highlightPost.permlink && (
                                     <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-1.5 flex flex-col gap-1 max-h-40 overflow-y-auto">
                                       {['highlight', 'entertainment', 'politics', 'sport', 'philosophy', 'crypto', 'economy'].map(flair => (
                                         <button
                                           key={flair}
                                           onClick={async (e) => {
                                             e.preventDefault();
                                             e.stopPropagation();
                                             await handleCurate(highlightPost, flair);
                                             setCuratingPost(null);
                                             setOpenAdminMenu(null);
                                           }}
                                           className="text-left px-2 py-1 text-[10px] hover:bg-slate-800 rounded text-slate-300 uppercase tracking-wider font-semibold"
                                         >
                                           {flair}
                                         </button>
                                       ))}
                                     </div>
                                   )}

                                   <div className="border-t border-slate-800/80 my-0.5"></div>

                                   <button
                                     onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       handlePostMute(highlightPost, true);
                                       setOpenAdminMenu(null);
                                     }}
                                     disabled={mutingPostPermlink === highlightPost.permlink}
                                     className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs hover:bg-red-950/30 text-red-400 hover:text-red-300 rounded transition-colors disabled:opacity-50"
                                   >
                                     <VolumeX size={14} />
                                     <span>Mutar Post</span>
                                   </button>

                                   <button
                                     onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handlePostMute(highlightPost, false);
                                        setOpenAdminMenu(null);
                                     }}
                                     disabled={mutingPostPermlink === highlightPost.permlink}
                                     className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs hover:bg-green-950/30 text-green-400 hover:text-green-300 rounded transition-colors disabled:opacity-50"
                                   >
                                     <Volume2 size={14} />
                                     <span>Desmutar Post</span>
                                   </button>
                                 </div>
                               )}
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })()}

               {/* Categories Grid + Ad Space */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {JOURNAL_CATEGORIES.map((cat) => {
                   // Filter and sort curated posts for this category by date descending
                   const catCurations = curatedPosts
                     .filter((c) => c.id === cat.id)
                     .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

                   // Deduplicate curated posts to avoid displaying the same post multiple times
                   const seenCurations = new Set<string>();
                   const uniqueCatCurations = catCurations.filter((c) => {
                     const key = `${c.author}/${c.permlink}`;
                     if (seenCurations.has(key)) return false;
                     seenCurations.add(key);
                     return true;
                   });

                   const catPost = uniqueCatCurations[0]?.post;

                   if (!catPost) {
                     return (
                       <div key={cat.id} className="bg-card/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-center items-center text-center h-80">
                         <span className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">#{cat.label}</span>
                         <p className="text-slate-500 text-xs font-medium">Waiting for curation...</p>
                       </div>
                     );
                   }

                   const thumbnail = extractImage(catPost);
                   const reward = getCalculatedReward(catPost);
                   const { up } = getVoteCounts(catPost);
                   const userHasVoted = user && catPost.active_votes?.some((v) => v.voter === user);
                   const isVotingThis = votingPost === catPost.permlink;

                   // Get up to 3 secondary curated posts (the previous curations for this exact category)
                   const subPosts = uniqueCatCurations
                     .slice(1, 4)
                     .map((c) => c.post)
                     .filter(Boolean);

                    const theme = CATEGORY_THEMES[cat.id] || {
                      color: 'text-slate-400',
                      border: 'border-slate-800',
                      bg: 'bg-slate-800',
                      hoverText: 'hover:text-white',
                      accentText: 'text-slate-400',
                      text: 'text-slate-400',
                      line: 'bg-slate-700'
                    };

                    const localizedLabel = language === 'pt' ? (
                      cat.id === 'news_entertainment' ? 'Entretenimento' :
                      cat.id === 'news_politics' ? 'Política' :
                      cat.id === 'news_sport' ? 'Esporte' :
                      cat.id === 'news_philosophy' ? 'Filosofia' :
                      cat.id === 'news_crypto' ? 'Cripto' :
                      cat.id === 'news_economy' ? 'Economia' :
                      cat.label
                    ) : cat.label;

                    return (
                      <div key={cat.id} className="flex flex-col">
                        {/* Column Header - Styled beautifully like the screenshot */}
                        <div className="border-b border-slate-700 pb-2 mb-6 flex items-center justify-between">
                          <div className="relative">
                            <h2 className={`font-serif font-black text-2xl tracking-tight ${theme.text}`}>
                              {localizedLabel}
                            </h2>
                            <div className={`absolute bottom-[-9px] left-0 h-1 w-12 ${theme.line}`} />
                          </div>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        </div>

                         {/* Main Featured Card - Borderless with transparent background and exact width matching text */}
                        <div className="group/card flex flex-col bg-transparent transition-all duration-300">
                          <div className="h-48 bg-slate-950 shrink-0 relative overflow-hidden rounded-2xl mb-4 border border-slate-700/50">
                            {thumbnail ? (
                              <img
                                src={getProxiedImageUrl(thumbnail, 400) || ""}
                                alt={catPost.title}
                                className="w-full h-full object-cover group-hover/card:scale-102 transition-all duration-500"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://placehold.co/400x300/0f172a/334155?text=No+Image";
                                }}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ background: getGradientPlaceholder(`${catPost.author}-${catPost.permlink}`, cat.id) }}
                              >
                                <BookOpen size={36} strokeWidth={1} className="text-white/20" />
                              </div>
                            )}
                          </div>

                          {/* Seamless transparent details section */}
                          <div className="flex flex-col flex-1 bg-transparent text-white transition-colors duration-300 min-h-[150px]">
                            <Link to={`/@${catPost.author}/${catPost.permlink}`} state={{ backgroundLocation: actualLocation }} className="block">
                              <h3 className="font-serif font-bold text-slate-100 text-lg sm:text-xl leading-snug line-clamp-2 hover:text-hive transition-colors mb-2">
                                {catPost.title}
                              </h3>
                            </Link>
                            <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed mb-4">
                              {getExcerpt(catPost.desc || catPost.body, 100)}
                            </p>

                            <div className="flex items-center justify-between text-slate-400 text-xs pt-3 border-t border-slate-700/50 mt-auto">
                              <Link to={`/profile/${catPost.author}`} className="font-mono text-xs text-slate-300 hover:text-hive hover:underline transition-colors font-semibold">
                                @{catPost.author}
                              </Link>
                              <div className="flex items-center gap-1.5 sm:gap-3">
                                <button
                                  onClick={() => handleVoteClick(catPost)}
                                  disabled={userHasVoted || isVotingThis}
                                  className={`flex items-center gap-1.5 text-xs font-semibold hover:text-hive transition-colors ${userHasVoted ? "text-hive" : "text-slate-400"}`}
                                >
                                  {isVotingThis ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Heart size={13} className={userHasVoted ? "fill-hive" : ""} />
                                  )}
                                  {up}
                                </button>
                                <span className="font-mono font-bold text-white bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded text-xs">{reward}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dashed separator line between featured post and secondary posts */}
                        {subPosts.length > 0 && (
                          <div className="border-t border-dashed border-slate-700 my-5" />
                        )}

                        {/* Secondary Related News Items - Listed elegantly below the dashed divider */}
                        {subPosts.length > 0 && (
                          <div className="space-y-4">
                            {subPosts.map((sub) => {
                              const subReward = getCalculatedReward(sub);
                              const subThumbnail = extractImage(sub);
                              return (
                                <div key={`${sub.author}-${sub.permlink}`} className="flex gap-3 py-3 border-b border-dashed border-slate-700/60 last:border-0 group/item items-start">
                                  {/* Small Thumbnail */}
                                  <div className="w-16 h-12 bg-slate-950 rounded-lg overflow-hidden shrink-0 relative border border-slate-700/50">
                                    {subThumbnail ? (
                                      <img
                                        src={getProxiedImageUrl(subThumbnail, 120, 120) || ""}
                                        alt={sub.title}
                                        className="w-full h-full object-cover group-hover/item:scale-105 transition-all duration-300"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = "https://placehold.co/120x120/0f172a/334155?text=No+Image";
                                        }}
                                      />
                                    ) : (
                                       <div
                                          className="w-full h-full flex items-center justify-center"
                                          style={{ background: getGradientPlaceholder(`${sub.author}-${sub.permlink}`, cat.id) }}
                                        >
                                          <BookOpen size={16} strokeWidth={1} className="text-white/20" />
                                        </div>
                                    )}
                                  </div>

                                  {/* Title & Metadata */}
                                  <div className="flex-1 min-w-0">
                                    <Link 
                                      to={`/@${sub.author}/${sub.permlink}`} 
                                      state={{ backgroundLocation: actualLocation }}
                                      className="block"
                                    >
                                      <h4 className="font-serif font-bold text-sm text-slate-200 hover:text-hive group-hover/item:text-hive transition-colors leading-snug line-clamp-2">
                                        {sub.title}
                                      </h4>
                                    </Link>
                                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-mono">
                                      <Link to={`/profile/${sub.author}`} className="hover:text-hive hover:underline transition-colors">
                                        @{sub.author}
                                      </Link>
                                      <span className="text-slate-300 font-semibold">{subReward} {community}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                 })}

                 {/* Sponsored Ads Slot */}
                 <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-dashed border-slate-700 rounded-2xl p-6 flex flex-col justify-between items-center text-center h-72 shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-slate-800 text-slate-400 border-l border-b border-slate-700 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-bl">
                     Sponsored
                   </div>
                   <div className="my-auto flex flex-col items-center">
                     <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
                       <Sparkles size={16} className="text-hive animate-pulse" />
                     </div>
                     <h4 className="text-xs font-bold text-slate-200 mb-1 uppercase tracking-wider">Patrocinador do Diário</h4>
                     <p className="text-slate-400 text-[10px] max-w-[190px] leading-relaxed">
                       Anuncie com a comunidade #NEWS. Alcance milhares de investidores e entusiastas Web3.
                     </p>
                   </div>
                   <button className="bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white font-bold text-[10px] py-2 px-3.5 rounded-xl border border-slate-800 transition-all uppercase tracking-wider">
                     Reservar Espaço
                   </button>
                 </div>
               </div>
             </div>
          ) : (
            <div
              className={
                layoutMode === "journal"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                  : viewMode === "grid"
                  ? `grid grid-cols-1 md:grid-cols-2 ${sidebarCollapsed === "collapsed" ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-2 xl:grid-cols-3"} gap-6`
                  : "flex flex-col gap-5"
              }
            >
              {posts.map((post, index) => {
                const thumbnail = extractImage(post);
                const reward = getCalculatedReward(post);
                const isPaid =
                  post.cashout_time &&
                  new Date(post.cashout_time + "Z").getTime() < Date.now();
                const { up, down } = getVoteCounts(post);
                const userHasVoted =
                  user && post.active_votes?.some((v) => v.voter === user);
                const isVotingThis = votingPost === post.permlink;
                const excerpt = getExcerpt(post.desc || post.body, 180);

                let postTags: string[] = [];
                try {
                  const meta = JSON.parse(post.json_metadata || "{}");
                  postTags = Array.isArray(meta.tags)
                    ? meta.tags.filter((t: any) => typeof t === "string")
                    : [];
                } catch (e) {}

                const allOurTags = new Set(TOPICS.flatMap((t) => t.sub));
                const mainTag =
                  postTags.find((tag) => allOurTags.has(tag)) ||
                  postTags.find(
                    (tag) => tag !== community && tag !== "hive-192096",
                  ) ||
                  postTags[0];


                if (layoutMode === "journal") {
                  const isFeatured = index === 0;
                  return (
                    <div
                      key={`${post.author}-${post.permlink}`}
                      className={`group flex ${isFeatured ? "flex-col lg:flex-row gap-8 lg:items-center col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 pb-12 border-b border-slate-800" : "flex-col gap-4"}`}
                    >
                      <div className={`shrink-0 ${isFeatured ? "w-full lg:w-2/3 h-[400px] lg:h-[500px]" : "w-full h-48 sm:h-56"} rounded-xl overflow-hidden bg-slate-900 relative`}>
                        {thumbnail ? (
                          <img
                            src={getProxiedImageUrl(thumbnail, isFeatured ? 800 : 400) || ""}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            onError={(e) => {
                              (e.target).src = "https://placehold.co/600x400/0f172a/334155?text=News";
                            }}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            loading={index === 0 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center border border-slate-800 rounded-xl"
                            style={{ background: getGradientPlaceholder(`${post.author}-${post.permlink}`) }}
                          >
                            <BookOpen size={48} strokeWidth={1} className="text-white/20" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 flex gap-2">
                          {mainTag && (
                            <span className="bg-hive text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded shadow-sm">
                              {mainTag}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className={`flex flex-col flex-1 ${isFeatured ? "lg:py-8" : ""}`}>
                        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <Link to={`/profile/${post.author}`} className="hover:text-white transition-colors flex items-center gap-2">
                            <img src={`https://images.hive.blog/u/${post.author}/avatar`} alt={post.author} className="w-6 h-6 rounded-full bg-slate-800" />
                            {post.author}
                          </Link>
                          <span>&bull;</span>
                          <span>{timeAgo(post.created)}</span>
                        </div>
                        
                        <Link to={`/@${post.author}/${post.permlink}`} state={{ backgroundLocation: actualLocation }} className="block group-hover:text-slate-300 transition-colors">
                          <h3 className={`font-serif font-bold text-white leading-tight ${isFeatured ? "text-3xl sm:text-4xl lg:text-5xl mb-4" : "text-xl sm:text-2xl mb-2 line-clamp-3"}`}>
                            {post.title}
                          </h3>
                          {excerpt && (
                            <p className={`text-slate-400 font-serif leading-relaxed ${isFeatured ? "text-lg sm:text-xl line-clamp-4" : "text-sm line-clamp-3"}`}>
                              {excerpt}
                            </p>
                          )}
                        </Link>
                        
                        <div className="mt-auto pt-4 flex items-center justify-between text-slate-500 text-sm">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleVoteClick(post)}
                              disabled={userHasVoted || isVotingThis}
                              className={`flex items-center gap-1.5 transition-colors ${userHasVoted ? "text-hive" : "hover:text-hive"}`}
                            >
                              {isVotingThis ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Heart size={16} className={userHasVoted ? "fill-hive" : ""} />
                              )}
                              <span className="font-semibold">{up}</span>
                            </button>
                            <Link to={`/@${post.author}/${post.permlink}#comments`} state={{ backgroundLocation: actualLocation }} className="flex items-center gap-1.5 hover:text-white transition-colors">
                              <MessageCircle size={16} />
                              <span className="font-semibold">{post.children}</span>
                            </Link>
                          </div>
                          <div className="font-mono font-medium text-slate-400">
                            {reward} {community}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`${post.author}-${post.permlink}`}
                    className={`group bg-card rounded-2xl border border-slate-700/50 hover:border-slate-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cent/5 flex ${viewMode === "list" ? "flex-col sm:flex-row items-stretch" : "flex-col h-full"}`}
                  >
                    {viewMode === "grid" && (
                      <div className="relative h-48 bg-slate-800 overflow-hidden rounded-t-2xl shrink-0">
                        {thumbnail ? (
                          <img
                            src={getProxiedImageUrl(thumbnail, 200) || ""}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/600x400/1e293b/475569?text=No+Image";
                            }}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            loading={index === 0 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                            <span className="font-mono text-xs">
                              Sem Imagem
                            </span>
                          </div>
                        )}
                        <div
                          className={`absolute top-3 right-3 ${isPaid ? "bg-slate-700/90 text-slate-300" : "bg-cent/90 text-slate-900"} backdrop-blur-sm font-bold px-2.5 py-1 rounded-md text-xs flex items-center gap-1 font-mono shadow-lg`}
                        >
                          {reward} {community}
                        </div>
                        {mainTag && (
                          <div className="absolute top-3 left-3 bg-slate-900/80 text-white backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium shadow-lg border border-slate-700/50 capitalize truncate max-w-[120px]">
                            #{mainTag}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`p-5 flex flex-col flex-1 ${viewMode === "list" ? "justify-between" : ""}`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-3 mb-3">
                        <Link
                          to={`/profile/${post.author}`}
                          className="shrink-0"
                        >
                          <img
                            src={`https://images.hive.blog/u/${post.author}/avatar`}
                            alt={post.author}
                            className="w-7 h-7 rounded-full border border-slate-600 object-cover hover:border-cent transition-colors"
                          />
                        </Link>
                        <Link
                          to={`/profile/${post.author}`}
                          className="text-xs font-bold text-slate-300 hover:text-cent cursor-pointer truncate"
                        >
                          @{post.author}
                        </Link>
                        {viewMode === "list" && mainTag && (
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs font-medium border border-slate-700/50 capitalize truncate max-w-[100px] ml-2">
                            #{mainTag}
                          </span>
                        )}
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1 ml-auto shrink-0">
                          <Calendar size={12} />
                          {timeAgo(post.created)}
                        </span>
                      </div>

                      <Link
                        to={`/@${post.author}/${post.permlink}`}
                        state={{ backgroundLocation: actualLocation }}
                        className="block flex-1 group-hover:text-cent transition-colors"
                      >
                        <h3
                          className={`font-bold text-white leading-tight mb-2 ${viewMode === "list" ? "text-xl" : "text-lg line-clamp-2"}`}
                        >
                          {post.title}
                        </h3>
                        {excerpt && (
                          <p
                            className={`text-slate-400 text-sm leading-relaxed font-medium ${viewMode === "grid" ? "line-clamp-3" : "line-clamp-2"} mb-2`}
                          >
                            {excerpt}
                          </p>
                        )}
                      </Link>

                      <div
                        className={`flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-700/50 text-slate-400 text-xs`}
                      >
                        <div className="flex gap-2 sm:gap-3 items-center">
                          <div className="flex items-center gap-1.5 transition-colors">
                            <button
                              onClick={() => handleVoteClick(post)}
                              disabled={userHasVoted || isVotingThis}
                              className={`${
                                userHasVoted
                                  ? "text-green-400"
                                  : "hover:text-green-300 text-slate-400"
                              }`}
                              title={
                                userHasVoted ? "Você já votou" : "Votar 100%"
                              }
                            >
                              {isVotingThis ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Heart
                                  size={16}
                                  className={
                                    userHasVoted ? "fill-green-400" : ""
                                  }
                                />
                              )}
                            </button>
                            <button
                              onClick={() => setVotersModalPost(post)}
                              className="font-medium text-sm hover:text-white transition-colors"
                              title="Ver quem votou"
                            >
                              {up}
                            </button>
                          </div>

                          {down > 0 && (
                            <span
                              className="flex items-center gap-1.5 text-red-400/90 hover:text-red-300 transition-colors"
                              title="Downvotes"
                            >
                              <ThumbsDown
                                size={14}
                                className="fill-red-400/20"
                              />{" "}
                              <span className="font-medium text-sm">
                                {down}
                              </span>
                            </span>
                          )}

                          <Link
                            to={`/@${post.author}/${post.permlink}#comments`}
                            state={{ backgroundLocation: actualLocation }}
                            className="flex items-center gap-1.5 hover:text-blue-400 transition-colors ml-1"
                          >
                            <MessageCircle size={16} />{" "}
                            <span className="font-medium text-sm">
                              {post.children}
                            </span>
                          </Link>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-3">

                        {user === "faireye" && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenAdminMenu(openAdminMenu === post.permlink ? null : post.permlink);
                                setCuratingPost(null);
                              }}
                              className="text-slate-400 hover:text-white p-1 transition-colors rounded-full hover:bg-slate-800/80"
                              title="Opções de Admin"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openAdminMenu === post.permlink && (
                              <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1.5 animate-fade-in text-slate-200">
                                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
                                  Ações de Admin
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCuratingPost(curatingPost?.permlink === post.permlink ? null : post);
                                  }}
                                  className="flex items-center justify-between w-full text-left px-2 py-1.5 text-xs hover:bg-slate-800 text-slate-200 rounded transition-colors"
                                >
                                  <span>Curar Post</span>
                                  <Star size={12} className={curatingPost?.permlink === post.permlink ? "fill-hive text-hive" : "text-slate-400"} />
                                </button>

                                {curatingPost?.permlink === post.permlink && (
                                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-1.5 flex flex-col gap-1 max-h-40 overflow-y-auto">
                                    {['highlight', 'entertainment', 'politics', 'sport', 'philosophy', 'crypto', 'economy'].map(flair => (
                                      <button
                                        key={flair}
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const json = { author: post.author, permlink: post.permlink };
                                          try {
                                            await customJson(`news_${flair}`, json, `Curate ${flair}`);
                                            setCuratingPost(null);
                                            setOpenAdminMenu(null);
                                            alert("Curated as " + flair);
                                          } catch (err: any) {
                                            alert("Failed: " + err);
                                          }
                                        }}
                                        className="text-left px-2 py-1 text-[10px] hover:bg-slate-800 rounded text-slate-300 uppercase tracking-wider font-semibold"
                                      >
                                        {flair}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                <div className="border-t border-slate-800/80 my-0.5"></div>

                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    await handlePostMute(post, true);
                                    setOpenAdminMenu(null);
                                  }}
                                  disabled={mutingPostPermlink === post.permlink}
                                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs hover:bg-red-950/30 text-red-400 hover:text-red-300 rounded transition-colors disabled:opacity-50"
                                >
                                  <VolumeX size={14} />
                                  <span>Mutar Post</span>
                                </button>

                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    await handlePostMute(post, false);
                                    setOpenAdminMenu(null);
                                  }}
                                  disabled={mutingPostPermlink === post.permlink}
                                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs hover:bg-green-950/30 text-green-400 hover:text-green-300 rounded transition-colors disabled:opacity-50"
                                >
                                  <Volume2 size={14} />
                                  <span>Desmutar Post</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                          {viewMode === "list" && (
                            <div
                              className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 font-mono text-xs ${isPaid ? "text-slate-400 bg-slate-800" : (layoutMode === "journal" ? "text-white bg-slate-800" : "text-cent bg-cent/10")}`}
                            >
                              {reward} {community}
                            </div>
                          )}
                          <a
                            href={`https://peakd.com/@${post.author}/${post.permlink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-white transition-colors"
                            title="Abrir no PeakD"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {posts.length > 0 && !loading && (
            <div className="text-center mt-10">
              <button
                onClick={() => fetchPosts(false)}
                disabled={loadingMore}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-sm font-bold text-slate-300 transition-all flex items-center gap-2 mx-auto disabled:opacity-50 hover:shadow-lg"
              >
                {loadingMore && <Loader2 size={16} className="animate-spin" />}
                {loadingMore ? t("explorer.loading") : t("explorer.loadMore")}
              </button>
            </div>
          )}
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

export default Explorer;
