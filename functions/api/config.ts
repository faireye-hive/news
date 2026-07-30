interface Env {
  GEMINI_API_KEY?: string;
  API_KEY?: string;
  GUEST_ACCOUNT?: string;
  VITE_GUEST_ACCOUNT?: string;
  GUEST_POSTING_KEY?: string;
  VITE_GUEST_POSTING_KEY?: string;
  CREATOR_ACCOUNT?: string;
  VITE_CREATOR_ACCOUNT?: string;
  CREATOR_ACTIVE_KEY?: string;
  VITE_CREATOR_ACTIVE_KEY?: string;
}

export const onRequestGet = async (context: { env: Env }) => {
  const env = context.env;

  const guestAccount = env.GUEST_ACCOUNT || env.VITE_GUEST_ACCOUNT || '';
  const creatorAccount = env.CREATOR_ACCOUNT || env.VITE_CREATOR_ACCOUNT || '';

  const hasGeminiKey = !!(env.GEMINI_API_KEY || env.API_KEY);
  const hasGuestKey = !!(env.GUEST_POSTING_KEY || env.VITE_GUEST_POSTING_KEY);
  const hasCreatorKey = !!(env.CREATOR_ACTIVE_KEY || env.VITE_CREATOR_ACTIVE_KEY);

  return new Response(
    JSON.stringify({
      guestAccount,
      creatorAccount,
      hasGeminiKey,
      hasGuestKey,
      hasCreatorKey,
      platform: 'Cloudflare Pages Functions'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
};
