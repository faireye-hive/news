import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Edit3, Loader2, ImagePlus, Hash, Settings, DollarSign, 
  BookOpen, Info, ChevronDown, ChevronUp, Bold, Italic, 
  Heading, Quote, Code, Link, Image as ImageIcon, List, ListOrdered, 
  MoreHorizontal, Maximize2, Save, Send, X, Eye, Sparkles, 
  Check, Trash2, Calendar, UserPlus, FileText, Clock, Smile
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';

// Local translations for the newly added high-level options and tools
const localTranslations = {
  en: {
    coverImage: "Cover Image URL",
    coverImagePlaceholder: "Paste a banner image URL, or pick a preset below...",
    categoryLabel: "Select Category Preset",
    summaryLabel: "SEO Summary & Description",
    summaryPlaceholder: "Enter a brief summary of your post for search results and social cards...",
    beneficiaryLabel: "Share Post Rewards (Beneficiaries)",
    beneficiaryPlaceholder: "Enter Hive username...",
    beneficiaryBtn: "Add Co-author",
    beneficiaryDesc: "Distribute a percentage of your post's author rewards to other creators or projects.",
    readingTime: "min read",
    draftAutosaved: "Draft auto-saved!",
    draftRestored: "Draft restored!",
    noDraft: "No saved draft found",
    restoreDraftBtn: "Restore Saved Draft",
    categoryHint: "Selecting a preset overwrites your primary category tag.",
    schedulePost: "Schedule Publication",
    scheduleDesc: "Simulate a publication delay for your post",
    scheduledFor: "Scheduled for",
    presetsTitle: "Popular Presets",
    presetsDesc: "Pick an instant background banner:",
    wordsCount: "words",
    previewTitle: "Live Feed Listing Card Preview",
    previewDesc: "This is how your post will look to other members in the feed:",
    noCover: "No cover image selected. Your post will display without a banner.",
    addBeneficiaryErr: "Please fill out co-author and set percentage above 0%."
  },
  pt: {
    coverImage: "URL da Imagem de Capa",
    coverImagePlaceholder: "Cole a URL de uma imagem de banner, ou escolha um preset abaixo...",
    categoryLabel: "Selecionar Categoria Principal",
    summaryLabel: "Resumo SEO & Descrição",
    summaryPlaceholder: "Digite um resumo curto do post para resultados de busca e mídias sociais...",
    beneficiaryLabel: "Compartilhar Recompensas (Beneficiários)",
    beneficiaryPlaceholder: "Usuário Hive...",
    beneficiaryBtn: "Adicionar Coautor",
    beneficiaryDesc: "Distribua uma porcentagem das recompensas do autor deste post com outros criadores.",
    readingTime: "min de leitura",
    draftAutosaved: "Rascunho salvo!",
    draftRestored: "Rascunho restaurado!",
    noDraft: "Nenhum rascunho encontrado",
    restoreDraftBtn: "Restaurar Rascunho Salvo",
    categoryHint: "Selecionar um preset substituirá sua primeira tag principal.",
    schedulePost: "Agendar Publicação",
    scheduleDesc: "Simule um agendamento de data de publicação para seu post",
    scheduledFor: "Agendado para",
    presetsTitle: "Presets Populares",
    presetsDesc: "Escolha um banner instantâneo:",
    wordsCount: "palavras",
    previewTitle: "Pré-visualização do Card no Feed",
    previewDesc: "É assim que o seu post será listado para outros membros no feed:",
    noCover: "Nenhuma imagem de capa selecionada. O post será listado sem banner.",
    addBeneficiaryErr: "Preencha o coautor e defina uma porcentagem maior que 0%."
  }
};

// Preset beautiful background images from Unsplash
const PRESET_BANNERS = [
  { id: 'fluid', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', name: 'Fluid' },
  { id: 'geo', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80', name: 'Geometry' },
  { id: 'cyber', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80', name: 'Cyber' },
  { id: 'code', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80', name: 'Coding' },
  { id: 'minimal', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', name: 'Minimal' }
];

// Popular category suggestions to set the first tag
const POPULAR_CATEGORIES = [
  { value: 'news', label: 'News 📰' },
  { value: 'crypto', label: 'Crypto 🪙' },
  { value: 'technology', label: 'Tech 💻' },
  { value: 'gaming', label: 'Gaming 🎮' },
  { value: 'art', label: 'Art 🎨' },
  { value: 'finance', label: 'Finance 📈' },
  { value: 'dev', label: 'Dev 🔧' },
  { value: 'life', label: 'Life 🌱' }
];

const CreatePost: React.FC = () => {
  const { user, comment } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Core post fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsList, setTagsList] = useState<string[]>(['news']);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  
  // Advanced options
  const [declinePayout, setDeclinePayout] = useState(false);
  const [summary, setSummary] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<{ account: string; weight: number }[]>([]);
  const [benUser, setBenUser] = useState('');
  const [benPct, setBenPct] = useState(10);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  // UI state
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isAutosaved, setIsAutosaved] = useState(false);

  // Retrieve translation dictionary
  const dict = localTranslations[language === 'pt' ? 'pt' : 'en'];

  // Check if saved draft exists on mount
  useEffect(() => {
    const saved = localStorage.getItem('hive_post_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.body) {
          setHasSavedDraft(true);
        }
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, []);

  // Auto-save draft locally on change
  useEffect(() => {
    if (title.trim() || body.trim() || tagsList.length > 1 || coverImage.trim()) {
      const draftData = {
        title,
        body,
        tagsList,
        coverImage,
        declinePayout,
        summary,
        beneficiaries,
        isScheduled,
        scheduleTime
      };
      localStorage.setItem('hive_post_draft', JSON.stringify(draftData));
      setIsAutosaved(true);
      const timer = setTimeout(() => setIsAutosaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [title, body, tagsList, coverImage, declinePayout, summary, beneficiaries, isScheduled, scheduleTime]);

  // Restore draft handler
  const restoreDraft = () => {
    const saved = localStorage.getItem('hive_post_draft');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.title) setTitle(data.title);
        if (data.body) setBody(data.body);
        if (data.tagsList) setTagsList(data.tagsList);
        if (data.coverImage) setCoverImage(data.coverImage);
        if (data.declinePayout !== undefined) setDeclinePayout(data.declinePayout);
        if (data.summary) setSummary(data.summary);
        if (data.beneficiaries) setBeneficiaries(data.beneficiaries);
        if (data.isScheduled !== undefined) setIsScheduled(data.isScheduled);
        if (data.scheduleTime) setScheduleTime(data.scheduleTime);
        setHasSavedDraft(false);
        alert(dict.draftRestored);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Delete draft handler
  const deleteDraft = () => {
    if (window.confirm(language === 'pt' ? 'Excluir rascunho salvo?' : 'Delete saved draft?')) {
      localStorage.removeItem('hive_post_draft');
      setHasSavedDraft(false);
    }
  };

  // Helper function to insert markdown notation at current cursor selection
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = prefix + (selected || '') + suffix;
    const newBody = text.substring(0, start) + replacement + text.substring(end);
    setBody(newBody);

    // Re-focus and update selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + (selected ? selected.length : 0) + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Publish Post action
  const handlePublish = async () => {
    if (!title.trim() || !body.trim()) {
      alert(t('createPost.titleReq'));
      return;
    }

    const tagsArray = [...tagsList];
    if (tagsArray.length === 0) {
       tagsArray.push('news');
    }

    setIsPublishing(true);
    try {
      // Prepend cover image and summary beautifully into the published markdown body
      let finalBody = body;
      if (coverImage.trim()) {
        finalBody = `![cover](${coverImage.trim()})\n\n` + finalBody;
      }
      if (summary.trim()) {
        finalBody = `*${summary.trim()}*\n\n---\n\n` + finalBody;
      }

      const result = await comment('', tagsArray[0], title, finalBody, tagsArray, declinePayout);
      
      if (result.success) {
        alert(t('createPost.success'));
        localStorage.removeItem('hive_post_draft');
        navigate('/explorer');
      } else {
        alert(t('createPost.error') + result.msg);
      }
    } catch (e: any) {
      alert(t('createPost.error') + e.message);
    }
    setIsPublishing(false);
  };

  const getCleanPreview = () => {
    let rawBody = body;
    if (coverImage.trim() && !body.includes(coverImage)) {
      rawBody = `![cover](${coverImage.trim()})\n\n` + rawBody;
    }
    if (summary.trim() && !body.includes(summary)) {
      rawBody = `*${summary.trim()}*\n\n---\n\n` + rawBody;
    }
    return DOMPurify.sanitize(rawBody);
  };

  // Tag inputs parsing
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (newTag && tagsList.length < 10 && !tagsList.includes(newTag)) {
        setTagsList([...tagsList, newTag]);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && tagsList.length > 0) {
      setTagsList(tagsList.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter(tag => tag !== tagToRemove));
  };

  const selectCategoryPreset = (categoryVal: string) => {
    // Overwrite or prepend primary tag
    const filtered = tagsList.filter(t => t !== categoryVal);
    // Move news or previous first tag out of position
    setTagsList([categoryVal, ...filtered.slice(0, 9)]);
  };

  const addBeneficiary = () => {
    if (!benUser.trim() || benPct <= 0) {
      alert(dict.addBeneficiaryErr);
      return;
    }
    const cleanUser = benUser.trim().toLowerCase().replace(/[^a-z0-9.-]/g, '');
    if (beneficiaries.some(b => b.account === cleanUser)) {
      return;
    }
    setBeneficiaries([...beneficiaries, { account: cleanUser, weight: benPct }]);
    setBenUser('');
  };

  const removeBeneficiary = (account: string) => {
    setBeneficiaries(beneficiaries.filter(b => b.account !== account));
  };

  const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
  const readingTimeEstimate = Math.max(1, Math.ceil(wordCount / 200));

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-hive/10 text-hive flex items-center justify-center mb-6">
          <Edit3 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('createPost.loginRequired')}</h2>
        <p className="text-slate-400 mb-6">{t('createPost.loginDesc')}</p>
        <button 
          onClick={() => {
            const loginBtn = document.getElementById('login-button-trigger');
            if (loginBtn) loginBtn.click();
          }} 
          className="bg-hive text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-hive/20"
        >
          {t('nav.login')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 animate-fade-in pb-16 px-4 sm:px-6">
      
      {/* Upper Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Edit3 className="text-hive" size={28} /> {t('createPost.title')}
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Hive Engine
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {language === 'pt' ? 'Escreva e publique notícias modernas na blockchain Hive' : 'Compose and publish modern stories to the Hive community'}
          </p>
        </div>

        {/* Draft Restore Badge & Edit/Preview Switches */}
        <div className="flex flex-wrap items-center gap-3">
          {hasSavedDraft && (
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-xs font-medium text-yellow-400 animate-pulse">
              <span>{dict.noDraft}</span>
              <button onClick={restoreDraft} className="underline hover:text-white font-bold ml-1">
                {dict.restoreDraftBtn}
              </button>
              <button onClick={deleteDraft} className="hover:text-red-400 ml-1.5">
                <Trash2 size={13} />
              </button>
            </div>
          )}

          {isAutosaved && (
            <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
              <Check size={14} /> <span>{dict.draftAutosaved}</span>
            </div>
          )}

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button 
              onClick={() => setIsPreview(false)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${!isPreview ? 'bg-hive text-white shadow-md shadow-hive/10' : 'text-slate-400 hover:text-white'}`}
            >
              <Edit3 size={15} /> {t('createPost.editBtn')}
            </button>
            <button 
              onClick={() => setIsPreview(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${isPreview ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Eye size={15} /> {t('createPost.previewBtn')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        
        {/* Main Editor Form */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-card p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-800/80 shadow-xl relative overflow-hidden transition-colors">
            
            {!isPreview ? (
              <div className="space-y-6">
                
                {/* 1. Cover Image URL & Instant Presets */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                      <ImagePlus size={16} className="text-hive" /> {dict.coverImage}
                    </label>
                    {coverImage && (
                      <button onClick={() => setCoverImage('')} className="text-xs text-red-400 hover:underline">
                        {language === 'pt' ? 'Remover Capa' : 'Remove Cover'}
                      </button>
                    )}
                  </div>
                  
                  {coverImage.trim() && (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mb-3 group">
                      <img 
                        src={coverImage} 
                        alt="Post Banner" 
                        className="w-full h-full object-cover" 
                        onError={() => setCoverImage('')}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs bg-black/60 px-3 py-1 rounded-full font-mono">{coverImage}</span>
                      </div>
                    </div>
                  )}

                  <input 
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder={dict.coverImagePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white text-sm focus:outline-none focus:border-hive transition-colors placeholder:text-slate-500"
                  />

                  {/* Preset Banners Quick Selector */}
                  <div className="pt-1.5">
                    <p className="text-[11px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">{dict.presetsDesc}</p>
                    <div className="flex flex-wrap gap-2.5">
                      {PRESET_BANNERS.map(banner => (
                        <button
                          key={banner.id}
                          type="button"
                          onClick={() => setCoverImage(banner.url)}
                          className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${coverImage === banner.url ? 'bg-hive/15 border-hive text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
                        >
                          <span className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                            <img src={banner.url} alt="" className="w-full h-full object-cover" />
                          </span>
                          {banner.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Categoria Predefinida Pills */}
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                    <Sparkles size={16} className="text-hive" /> {dict.categoryLabel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => selectCategoryPreset(cat.value)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${tagsList[0] === cat.value ? 'bg-hive border-hive text-white shadow-md shadow-hive/10 scale-105' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic">{dict.categoryHint}</p>
                </div>

                {/* 3. Post Title */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-slate-300 text-sm font-semibold">{t('createPost.titleLabel')}</label>
                    <span className="text-xs text-slate-500 font-mono">{title.length} / 250</span>
                  </div>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.substring(0, 250))}
                    placeholder={t('createPost.titlePlaceholder')}
                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white font-bold text-lg sm:text-xl focus:outline-none focus:border-hive transition-colors placeholder:text-slate-500 focus:ring-1 focus:ring-hive/20"
                    disabled={isPublishing}
                  />
                </div>

                {/* 4. Textarea with functional editor toolbar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-slate-300 text-sm font-semibold flex items-center gap-1">
                      {t('createPost.bodyLabel')} <span className="text-xs text-slate-500 font-normal">({language === 'pt' ? 'Suporta Markdown' : 'Markdown support'})</span>
                    </label>
                    <div className="flex gap-3 text-xs text-hive font-semibold">
                      <a href="https://commonmark.org/help/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-red-400 transition-colors">
                        <BookOpen size={14} /> Markdown Guide
                      </a>
                    </div>
                  </div>
                  
                  <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden focus-within:border-hive transition-all">
                    {/* Toolbar header */}
                    <div className="flex items-center gap-1 p-2 bg-slate-900 border-b border-slate-800/80 overflow-x-auto text-slate-400 select-none scrollbar-none">
                      <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-2 hover:bg-slate-800 rounded hover:text-white transition-colors shrink-0" title="Bold"><Bold size={15} /></button>
                      <button type="button" onClick={() => insertMarkdown('*', '*')} className="p-2 hover:bg-slate-800 rounded hover:text-white transition-colors shrink-0" title="Italic"><Italic size={15} /></button>
                      <button type="button" onClick={() => insertMarkdown('# ', '\n')} className="p-2 hover:bg-slate-800 rounded hover:text-white transition-colors shrink-0" title="Heading"><Heading size={15} /></button>
                      <button type="button" onClick={() => insertMarkdown('> ', '\n')} className="p-2 hover:bg-slate-800 rounded hover:text-white transition-colors shrink-0" title="Quote"><Quote size={15} /></button>
                      <button type="button" onClick={() => insertMarkdown('```\n', '\n```')} className="p-2 hover:bg-slate-800 rounded hover:text-white transition-colors shrink-0" title="Code Block"><Code size={15} /></button>
                      <button type="button" onClick={() => insertMarkdown('[', '](https://)')} className="p-2 hover:bg-slate-800 rounded hover:text-white transition-colors shrink-0" title="Link"><Link size={15} /></button>
                      <button type="button" onClick={() => insertMarkdown('![', '](https://)')} className="p-2 hover:bg-slate-800 rounded hover:text-white transition-colors shrink-0" title="Image"><ImageIcon size={15} /></button>
                      <button type="button" onClick={() => insertMarkdown('- ', '')} className="p-2 hover:bg-slate-800 rounded hover:text-white transition-colors shrink-0" title="Bullet List"><List size={15} /></button>
                      <button type="button" onClick={() => insertMarkdown('1. ', '')} className="p-2 hover:bg-slate-800 rounded hover:text-white transition-colors shrink-0" title="Numbered List"><ListOrdered size={15} /></button>
                      
                      <div className="flex-1 min-w-[16px]"></div>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-bold uppercase tracking-wider select-none shrink-0 mr-1">
                        Markdown M↓
                      </span>
                    </div>

                    <textarea 
                      ref={textareaRef}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={t('createPost.bodyPlaceholder')}
                      className="w-full bg-transparent p-4 text-slate-300 font-mono text-sm focus:outline-none min-h-[350px] resize-y placeholder:text-slate-500 leading-relaxed"
                      disabled={isPublishing}
                    />
                    
                    {/* Character/Reading stats footer */}
                    <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><FileText size={13} /> {wordCount} {dict.wordsCount}</span>
                        <span className="flex items-center gap-1"><Clock size={13} /> {readingTimeEstimate} {dict.readingTime}</span>
                      </div>
                      <span className="text-xs text-slate-500 italic">
                        {language === 'pt' ? 'Rascunho atualizado localmente' : 'Draft active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Custom Tags input */}
                <div>
                  <label className="text-slate-300 text-sm font-semibold mb-2 flex items-center gap-2">
                    <Hash size={16} className="text-hive" /> {t('createPost.tagsLabel')}
                  </label>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 focus-within:border-hive transition-colors">
                    <div className="flex flex-wrap gap-2">
                      {tagsList.map((tag, idx) => (
                        <span key={tag} className={`flex items-center gap-1 bg-transparent border px-2.5 py-1 rounded-lg text-xs font-semibold ${idx === 0 ? 'bg-hive/10 border-hive text-hive' : 'border-slate-800 text-slate-300'}`}>
                          {tag}
                          {idx === 0 && <span className="text-[9px] bg-hive text-white px-1.5 py-0.5 rounded-md mr-1 uppercase">Main</span>}
                          <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-white transition-colors ml-1"><X size={13} /></button>
                        </span>
                      ))}
                      {tagsList.length < 10 && (
                        <div className="relative flex-1 min-w-[150px]">
                          <input 
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder={tagsList.length === 0 ? "Add tags (press Enter)..." : "Add custom..."}
                            disabled={isPublishing}
                            className="w-full bg-transparent p-1 text-slate-300 focus:outline-none text-sm placeholder:text-slate-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-slate-400 mt-2 gap-1">
                    <span>{t('createPost.tagsHint')}</span>
                    <span className="font-semibold text-slate-500">{tagsList.length} / 10 tags</span>
                  </div>
                </div>

                {/* 6. Advanced settings accordion with brand new options */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <button 
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                      <Settings size={16} className="text-hive" /> {t('createPost.advOptions')}
                    </span>
                    {showAdvanced ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>
                  
                  {showAdvanced && (
                    <div className="p-5 border-t border-slate-800 space-y-6 bg-slate-950">
                      
                      {/* Decline Payout toggle */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex gap-4 items-start pr-4">
                          <div className="mt-0.5 p-2 bg-slate-900 border border-slate-800 text-hive rounded-xl">
                            <DollarSign size={16} />
                          </div>
                          <div>
                            <div className="text-slate-300 font-semibold text-sm group-hover:text-white transition-colors">{t('createPost.declinePayout')}</div>
                            <div className="text-xs text-slate-500 mt-1 leading-relaxed">{t('createPost.declineDesc')}</div>
                          </div>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer ml-4">
                          <input type="checkbox" className="sr-only peer" checked={declinePayout} onChange={(e) => setDeclinePayout(e.target.checked)} />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-hive"></div>
                        </div>
                      </label>

                      <hr className="border-slate-800/80" />

                      {/* SEO Description Option */}
                      <div className="space-y-2">
                        <label className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                          <FileText size={16} className="text-hive" /> {dict.summaryLabel}
                        </label>
                        <textarea
                          value={summary}
                          onChange={(e) => setSummary(e.target.value.substring(0, 160))}
                          placeholder={dict.summaryPlaceholder}
                          className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-hive transition-colors placeholder:text-slate-500 min-h-[60px] resize-none"
                        />
                        <div className="text-right text-[10px] text-slate-500 font-mono">
                          {summary.length} / 160
                        </div>
                      </div>

                      <hr className="border-slate-800/80" />

                      {/* Share Rewards Beneficiary Option */}
                      <div className="space-y-3">
                        <label className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                          <UserPlus size={16} className="text-hive" /> {dict.beneficiaryLabel}
                        </label>
                        <p className="text-xs text-slate-500 leading-relaxed">{dict.beneficiaryDesc}</p>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text"
                            value={benUser}
                            onChange={(e) => setBenUser(e.target.value)}
                            placeholder={dict.beneficiaryPlaceholder}
                            className="w-full sm:flex-1 bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-hive placeholder:text-slate-500"
                          />
                          <div className="flex gap-2 w-full sm:w-auto">
                            <select
                              value={benPct}
                              onChange={(e) => setBenPct(parseInt(e.target.value))}
                              className="flex-1 sm:flex-initial bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 focus:outline-none"
                            >
                              <option value={5}>5%</option>
                              <option value={10}>10%</option>
                              <option value={20}>20%</option>
                              <option value={25}>25%</option>
                              <option value={50}>50%</option>
                            </select>
                            <button 
                              type="button"
                              onClick={addBeneficiary}
                              className="flex-1 sm:flex-initial bg-hive hover:bg-red-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shrink-0 text-center"
                            >
                              {dict.beneficiaryBtn}
                            </button>
                          </div>
                        </div>

                        {/* Beneficiary list display */}
                        {beneficiaries.length > 0 && (
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                            {beneficiaries.map(ben => (
                              <div key={ben.account} className="flex justify-between items-center text-xs text-slate-300 bg-slate-950 px-3 py-2 rounded-md">
                                <span className="font-mono text-hive">@{ben.account}</span>
                                <div className="flex items-center gap-3">
                                  <span className="bg-hive/15 text-hive px-2 py-0.5 rounded-full text-[10px] font-bold">{ben.weight}%</span>
                                  <button onClick={() => removeBeneficiary(ben.account)} className="text-slate-400 hover:text-red-400">
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <hr className="border-slate-800/80" />

                      {/* Mock Schedule Publication */}
                      <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex gap-4 items-start">
                            <div className="mt-0.5 p-2 bg-slate-900 border border-slate-800 text-hive rounded-xl">
                              <Calendar size={16} />
                            </div>
                            <div>
                              <div className="text-slate-300 font-semibold text-sm group-hover:text-white transition-colors">{dict.schedulePost}</div>
                              <div className="text-xs text-slate-500 mt-1 leading-relaxed">{dict.scheduleDesc}</div>
                            </div>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer ml-4">
                            <input type="checkbox" className="sr-only peer" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-hive"></div>
                          </div>
                        </label>

                        {isScheduled && (
                          <div className="pt-2 animate-fade-in">
                            <input 
                              type="datetime-local" 
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-hive w-full sm:w-auto"
                            />
                            {scheduleTime && (
                              <p className="text-xs text-hive font-semibold mt-2 flex items-center gap-1">
                                <Check size={14} /> {dict.scheduledFor}: {new Date(scheduleTime).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* Core Save Draft and Publish buttons */}
                <div className="pt-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => {
                      alert(language === 'pt' ? 'Seu rascunho já é salvo automaticamente!' : 'Your draft is already auto-saved securely!');
                    }}
                    className="w-full sm:w-auto justify-center px-6 py-3 border border-slate-800 rounded-xl text-slate-300 font-semibold hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 text-sm bg-slate-950/60"
                  >
                    <Save size={16} /> Save Draft
                  </button>
                  
                  <div className="w-full sm:w-auto text-center sm:text-right flex flex-col items-stretch sm:items-end shrink-0">
                     <button 
                        onClick={handlePublish}
                        disabled={isPublishing || !title || !body}
                        className="bg-hive text-white font-bold px-8 py-3.5 rounded-xl hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full shadow-lg shadow-hive/20 text-sm uppercase tracking-wider"
                     >
                        {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {t('createPost.publishBtn')}
                     </button>
                     <p className="text-[10px] text-slate-500 mt-2 italic">You can review before publishing</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Rich Preview Panel */
              <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-4 sm:p-6 md:p-8 min-h-[500px]">
                 {title && <h1 className="text-2xl sm:text-3xl font-black text-white mb-6 border-b border-slate-800 pb-4 leading-tight">{title}</h1>}
                 
                 {coverImage && (
                    <div className="w-full max-h-80 rounded-xl overflow-hidden mb-6 border border-slate-800">
                      <img src={coverImage} alt="Post Cover" className="w-full h-full object-cover" />
                    </div>
                 )}

                 {summary && (
                    <div className="bg-slate-900 border-l-4 border-hive p-4 rounded-r-xl mb-6 text-slate-300 italic text-sm leading-relaxed">
                      {summary}
                    </div>
                 )}

                 {body ? (
                    <div className="prose max-w-none text-slate-300 prose-headings:text-white prose-p:text-slate-300 prose-a:text-hive hover:prose-a:text-red-400 prose-strong:text-white prose-ul:text-slate-300 prose-ol:text-slate-300 prose-li:text-slate-300 prose-img:rounded-xl transition-all">
                      <ReactMarkdown>{getCleanPreview()}</ReactMarkdown>
                    </div>
                 ) : (
                    <div className="text-center text-slate-500 py-24">
                      <Sparkles className="mx-auto text-slate-700 mb-3" size={32} />
                      {t('createPost.nothingPreview')}
                    </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Guidelines & Listing Card Preview */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Live Listings Preview Card */}
          <div className="bg-card p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
             <div>
               <h3 className="text-base font-bold text-white flex items-center gap-2">
                 <Eye className="text-hive" size={18} /> {dict.previewTitle}
               </h3>
               <p className="text-slate-500 text-[11px] mt-1 leading-normal">{dict.previewDesc}</p>
             </div>
             
             {/* Feed mockup card item */}
             <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-inner flex flex-col hover:border-slate-700 transition-colors">
               
               {/* Cover Banner Mockup */}
               <div className="h-40 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                 {coverImage ? (
                   <img src={coverImage} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-center p-4">
                     <ImageIcon className="text-slate-700 mx-auto mb-1.5" size={28} />
                     <p className="text-[10px] text-slate-500 leading-snug">{dict.noCover}</p>
                   </div>
                 )}
                 <span className="absolute top-2 right-2 bg-black/70 text-[9px] text-hive font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                   {tagsList[0] || 'news'}
                 </span>
               </div>

               {/* Meta line */}
               <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                 <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full border border-hive/40 bg-slate-900 flex items-center justify-center text-hive text-xs font-bold shrink-0">
                     {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="text-[11px] font-bold text-white truncate">@{user?.name || 'anonymous'}</div>
                     <div className="text-[9px] text-slate-500 flex items-center gap-1">
                       <span>Just now</span> &middot; <span>{readingTimeEstimate} {dict.readingTime}</span>
                     </div>
                   </div>
                 </div>

                 {/* Title & snippet */}
                 <div className="space-y-1">
                   <h4 className="text-sm font-bold text-white leading-snug line-clamp-1">
                     {title.trim() || 'Your Catchy Title...'}
                   </h4>
                   <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-normal">
                     {summary.trim() || (body.trim() ? body.substring(0, 100) + '...' : 'Write your markdown story details inside the editor to preview content snippets here.')}
                   </p>
                 </div>

                 {/* Tags preview */}
                 <div className="flex flex-wrap gap-1 pt-1">
                   {tagsList.slice(0, 3).map(t => (
                     <span key={t} className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                       #{t}
                     </span>
                   ))}
                 </div>
               </div>
             </div>
             
             <button 
               onClick={() => setIsPreview(!isPreview)} 
               className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl transition-all text-xs font-semibold border border-slate-800 flex items-center justify-center gap-2"
             >
               {isPreview ? 'Back to Editor' : 'Toggle Full Page Preview'}
             </button>
          </div>

          {/* Post Tips & Formatting Helpers */}
          <div className="bg-card p-6 rounded-2xl border border-slate-800/80 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <BookOpen className="text-hive" size={18} />
              Post Tips & Guidelines
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 bg-hive/10 p-2 rounded-lg text-hive h-fit shrink-0"><Info size={16} /></div>
                <div>
                  <h4 className="text-slate-200 text-xs font-bold mb-0.5">Use Rich Markdown</h4>
                  <p className="text-slate-500 text-[10px] leading-relaxed">Leverage bold, headings, and tables to make your publication readable and professional.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 bg-hive/10 p-2 rounded-lg text-hive h-fit shrink-0"><ImagePlus size={16} /></div>
                <div>
                  <h4 className="text-slate-200 text-xs font-bold mb-0.5">Engaging Banners</h4>
                  <p className="text-slate-500 text-[10px] leading-relaxed">Add a compelling high-quality cover photo to boost click-through rates on community feeds.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 bg-hive/10 p-2 rounded-lg text-hive h-fit shrink-0"><Hash size={16} /></div>
                <div>
                  <h4 className="text-slate-200 text-xs font-bold mb-0.5">Smart Tagging</h4>
                  <p className="text-slate-500 text-[10px] leading-relaxed">Set relevant tags. First tag defines the main category of your post and cannot be changed.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CreatePost;
