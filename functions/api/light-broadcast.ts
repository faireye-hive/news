import { Client, PrivateKey } from '@hiveio/dhive';

interface Env {
  GUEST_POSTING_KEY?: string;
  VITE_GUEST_POSTING_KEY?: string;
}

const hiveClient = new Client([
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://api.openhive.network'
]);

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const masterPostingKey = context.env.GUEST_POSTING_KEY || context.env.VITE_GUEST_POSTING_KEY;

  if (!masterPostingKey) {
    return new Response(
      JSON.stringify({ error: 'GUEST_POSTING_KEY is not configured in Cloudflare Pages environment variables.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await context.request.json()) as any;
    const { operations, lightPrivateKey } = body;

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid operations array.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!lightPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'Missing light user private key.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const privKey = PrivateKey.fromString(lightPrivateKey);
    const masterKey = PrivateKey.fromString(masterPostingKey);

    const result = await hiveClient.broadcast.sendOperations(operations, [privKey, masterKey]);

    return new Response(
      JSON.stringify({ success: true, result, msg: 'Transaction broadcast successfully via Cloudflare Pages Function' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Error broadcasting transaction' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};
