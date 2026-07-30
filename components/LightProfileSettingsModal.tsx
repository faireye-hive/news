import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LightAccountProfile, getLightAccountProfileLocal } from '../utils/lightAccount';
import { X, User, Image, AlignLeft, CheckCircle, Loader2, Sparkles, Camera } from 'lucide-react';
import { sanitizeUrl } from '../utils/security';

interface LightProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (profile: LightAccountProfile) => void;
}

export const LightProfileSettingsModal: React.FC<LightProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { lightAccount, customJson } = useAuth();
  const { t } = useLanguage();

  const existingProfile = lightAccount ? getLightAccountProfileLocal(lightAccount.nickname) : null;

  const [name, setName] = useState(existingProfile?.name || lightAccount?.nickname || '');
  const [about, setAbout] = useState(existingProfile?.about || '');
  const [profileImage, setProfileImage] = useState(existingProfile?.profile_image || '');
  const [coverImage, setCoverImage] = useState(existingProfile?.cover_image || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !lightAccount) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const profileData: LightAccountProfile = {
      nickname: lightAccount.nickname,
      name: name.trim() || lightAccount.nickname,
      about: about.trim(),
      profile_image: profileImage.trim(),
      cover_image: coverImage.trim(),
    };

    const customJsonId = `news_profile_${lightAccount.nickname}`;

    try {
      const res = await customJson(
        customJsonId,
        profileData,
        t('lightProfile.updateTxMemo', { nickname: lightAccount.nickname })
      );

      if (res.success) {
        localStorage.setItem(customJsonId, JSON.stringify(profileData));
        if (onSaved) onSaved(profileData);
        alert(t('lightProfile.success'));
        onClose();
      } else {
        alert(t('lightProfile.errorSave') + (res.msg || ''));
      }
    } catch (err: any) {
      alert(t('lightProfile.errorUnexpected') + err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewAvatar = profileImage.trim() 
    ? profileImage.trim() 
    : `https://images.hive.blog/u/${lightAccount.guestAccount}/avatar`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in relative my-auto my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-hive/10 border border-hive/20 flex items-center justify-center text-hive">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t('lightProfile.title')}</h2>
              <p className="text-xs text-slate-400">
                {t('lightProfile.subtitle', { nickname: lightAccount.nickname })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Live Profile Preview Card */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg group">
            {/* Banner Preview */}
            <div className="h-28 bg-slate-800 relative overflow-hidden flex items-center justify-center">
              {coverImage.trim() ? (
                <img
                  src={sanitizeUrl(coverImage.trim())}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-slate-600 text-xs flex items-center gap-1.5 font-medium">
                  <Image size={14} /> {t('lightProfile.noCover')}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Avatar & Details Preview */}
            <div className="p-4 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
              <div className="relative shrink-0">
                <img
                  src={previewAvatar}
                  alt={name || lightAccount.nickname}
                  className="w-20 h-20 rounded-2xl border-4 border-slate-950 object-cover shadow-xl bg-slate-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://images.hive.blog/u/${lightAccount.guestAccount}/avatar`;
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center sm:text-left min-w-0 flex-1">
                <h3 className="text-base font-bold text-white truncate flex items-center justify-center sm:justify-start gap-1.5">
                  {name.trim() || lightAccount.nickname}
                  <CheckCircle size={14} className="text-hive fill-hive/10" />
                </h3>
                <p className="text-xs font-mono text-slate-400">@{lightAccount.nickname}</p>
                {about.trim() && (
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{about.trim()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form id="light-profile-form" onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <User size={14} className="text-hive" /> {t('lightProfile.displayName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('lightProfile.displayNamePlaceholder')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-hive transition-colors"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Camera size={14} className="text-hive" /> {t('lightProfile.profileImage')}
              </label>
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.png"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-hive transition-colors font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">{t('lightProfile.profileImageHint')}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Image size={14} className="text-hive" /> {t('lightProfile.coverImage')}
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://exemplo.com/meu-banner.jpg"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-hive transition-colors font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">{t('lightProfile.coverImageHint')}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <AlignLeft size={14} className="text-hive" /> {t('lightProfile.about')}
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder={t('lightProfile.aboutPlaceholder')}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-hive transition-colors resize-none"
                maxLength={250}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            disabled={saving}
          >
            {t('lightProfile.cancel')}
          </button>
          <button
            type="submit"
            form="light-profile-form"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-hive hover:bg-red-600 text-white shadow-lg shadow-hive/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? t('lightProfile.saving') : t('lightProfile.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

