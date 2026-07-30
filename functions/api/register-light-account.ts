import { Client, PrivateKey } from '@hiveio/dhive';

interface Env {
  GUEST_ACCOUNT?: string;
  VITE_GUEST_ACCOUNT?: string;
  GUEST_ACTIVE_KEY?: string;
  VITE_GUEST_ACTIVE_KEY?: string;
  CREATOR_ACTIVE_KEY?: string;
  VITE_CREATOR_ACTIVE_KEY?: string;
  GUEST_POSTING_KEY?: string;
  VITE_GUEST_POSTING_KEY?: string;
}

const hiveClient = new Client([
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://api.openhive.network'
]);

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const env = context.env;
  const guestAccount = env.GUEST_ACCOUNT || env.VITE_GUEST_ACCOUNT || 'hive.micro';
  const activeKeyStr = env.GUEST_ACTIVE_KEY || env.CREATOR_ACTIVE_KEY || env.VITE_GUEST_ACTIVE_KEY;

  try {
    const body = (await context.request.json()) as any;
    const { pubKeyStr, nickname } = body;

    if (!pubKeyStr) {
      return new Response(
        JSON.stringify({ error: 'Missing public key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (activeKeyStr) {
      const accounts = await hiveClient.database.getAccounts([guestAccount]);
      const account = accounts[0];
      if (!account) {
        return new Response(
          JSON.stringify({ error: `Guest account @${guestAccount} not found on Hive.` }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const newPosting = { ...account.posting };
      const authExists = newPosting.key_auths.some((auth: any) => auth[0] === pubKeyStr);

      if (!authExists) {
        newPosting.key_auths.push([pubKeyStr, 1]);
        newPosting.key_auths.sort((a: any, b: any) => a[0].localeCompare(b[0]));
      }

      let metadata: any = {};
      try {
        metadata = JSON.parse(account.posting_json_metadata || '{}');
      } catch (e) {}

      metadata.light_accounts = metadata.light_accounts || {};
      metadata.light_accounts[pubKeyStr] = nickname || 'Guest';

      const updateOp: any = [
        'account_update2',
        {
          account: guestAccount,
          posting: newPosting,
          memo_key: account.memo_key,
          json_metadata: account.json_metadata,
          posting_json_metadata: JSON.stringify(metadata),
          extensions: []
        }
      ];

      const pKey = PrivateKey.fromString(activeKeyStr);
      await hiveClient.broadcast.sendOperations([updateOp], pKey);

      return new Response(
        JSON.stringify({ success: true, guestAccount, msg: `Light account key added to @${guestAccount} on Hive` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: true, guestAccount, msg: `Light account initialized for @${guestAccount}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to register light account' }),
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
