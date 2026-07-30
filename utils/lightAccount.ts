export interface LightAccountProfile {
  nickname: string;
  name?: string;
  about?: string;
  profile_image?: string;
  cover_image?: string;
}

export const getLightAccountProfileLocal = (nickname: string): LightAccountProfile | null => {
  if (!nickname) return null;
  try {
    const data = localStorage.getItem(`news_profile_${nickname}`);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return null;
};

export const fetchLightAccountProfileFromHive = async (guestAccount: string, nickname: string): Promise<LightAccountProfile | null> => {
  if (!guestAccount || !nickname) return null;
  
  // 1. Check local storage first
  const local = getLightAccountProfileLocal(nickname);
  
  try {
    const res = await fetch('https://api.hive.blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'condenser_api.get_account_history',
        params: [guestAccount, -1, 100],
        id: 1,
      }),
    });
    const json = await res.json();
    if (json.result && Array.isArray(json.result)) {
      // Find latest custom_json with id matching news_profile_<nickname>
      const targetId = `news_profile_${nickname}`;
      for (let i = json.result.length - 1; i >= 0; i--) {
        const op = json.result[i][1]?.op;
        if (op && op[0] === 'custom_json' && op[1]?.id === targetId) {
          try {
            const parsed = typeof op[1].json === 'string' ? JSON.parse(op[1].json) : op[1].json;
            if (parsed) {
              const fullProfile: LightAccountProfile = {
                nickname,
                name: parsed.name || local?.name || '',
                about: parsed.about || local?.about || '',
                profile_image: parsed.profile_image || local?.profile_image || '',
                cover_image: parsed.cover_image || local?.cover_image || '',
              };
              localStorage.setItem(`news_profile_${nickname}`, JSON.stringify(fullProfile));
              return fullProfile;
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    console.error("Error fetching light account profile from Hive history:", e);
  }

  return local;
};

export const getAuthorAvatarUrl = (author: string, nickname?: string, jsonMetadata?: any): string => {
  if (nickname) {
    const lightProf = getLightAccountProfileLocal(nickname);
    if (lightProf && lightProf.profile_image && lightProf.profile_image.trim()) {
      return lightProf.profile_image.trim();
    }
  }

  try {
    const meta = typeof jsonMetadata === 'string' ? JSON.parse(jsonMetadata) : jsonMetadata;
    if (meta && meta.author_profile_image && meta.author_profile_image.trim()) {
      return meta.author_profile_image.trim();
    }
  } catch (e) {}

  return `https://images.hive.blog/u/${author}/avatar`;
};
