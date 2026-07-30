import { Client, PrivateKey, Authority } from '@hiveio/dhive';

interface Env {
  CREATOR_ACCOUNT?: string;
  VITE_CREATOR_ACCOUNT?: string;
  CREATOR_ACTIVE_KEY?: string;
  VITE_CREATOR_ACTIVE_KEY?: string;
}

const hiveClient = new Client([
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://api.openhive.network'
]);

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const creatorAccount = context.env.CREATOR_ACCOUNT || context.env.VITE_CREATOR_ACCOUNT;
  const creatorActiveKey = context.env.CREATOR_ACTIVE_KEY || context.env.VITE_CREATOR_ACTIVE_KEY;

  if (!creatorAccount || !creatorActiveKey) {
    return new Response(
      JSON.stringify({ error: 'CREATOR_ACCOUNT or CREATOR_ACTIVE_KEY is not configured in Cloudflare Pages environment variables.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await context.request.json()) as any;
    const { username, ownerPublic, activePublic, postingPublic, memoPublic } = body;

    if (!username || !ownerPublic || !activePublic || !postingPublic || !memoPublic) {
      return new Response(
        JSON.stringify({ error: 'Missing required account creation fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ownerAuth: Authority = {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [[ownerPublic, 1]]
    };

    const activeAuth: Authority = {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [[activePublic, 1]]
    };

    const postingAuth: Authority = {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [[postingPublic, 1]]
    };

    const createOp: any = [
      'create_claimed_account',
      {
        creator: creatorAccount,
        new_account_name: username,
        owner: ownerAuth,
        active: activeAuth,
        posting: postingAuth,
        memo_key: memoPublic,
        json_metadata: JSON.stringify({ created_by: 'News App Cloudflare Function' }),
        extensions: []
      }
    ];

    const activeKey = PrivateKey.fromString(creatorActiveKey);
    const result = await hiveClient.broadcast.sendOperations([createOp], activeKey);

    return new Response(
      JSON.stringify({ success: true, result, msg: `Account @${username} created successfully!` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Failed to create account.' }),
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
