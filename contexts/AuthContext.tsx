import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HiveKeychain, KeychainResponse } from '../types';
import { Client, PrivateKey } from '@hiveio/dhive';

const hiveClient = new Client([
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://api.openhive.network',
  'https://api.c0ff33a.uk'
]);

interface LightAccount {
  nickname: string;
  privateKey: string;
  guestAccount: string;
}

interface AuthContextType {
  user: string | null;
  lightAccount: LightAccount | null;
  login: (username: string) => Promise<void>;
  loginLight: (privateKey: string) => Promise<void>;
  logout: () => void;
  vote: (author: string, permlink: string, weight: number) => Promise<KeychainResponse>;
  comment: (parentAuthor: string, parentPermlink: string, title: string, body: string, tags: string[], declinePayout?: boolean) => Promise<KeychainResponse>;
  customJson: (id: string, json: any, display_name: string, keyType?: 'Posting' | 'Active') => Promise<KeychainResponse>;
  isKeychainInstalled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [lightAccount, setLightAccount] = useState<LightAccount | null>(null);
  const [isKeychainInstalled, setIsKeychainInstalled] = useState(false);

  useEffect(() => {
    // Check if keychain is installed after window load
    const checkKeychain = () => {
      if (window.hive_keychain) {
        setIsKeychainInstalled(true);
      } else {
        // Fallback for slower injections
        setTimeout(() => {
          if (window.hive_keychain) setIsKeychainInstalled(true);
        }, 500);
      }
    };
    
    checkKeychain();

    // Persist login
    const savedLight = localStorage.getItem('cent_light_user');
    if (savedLight) {
      try {
        const parsed = JSON.parse(savedLight);
        setLightAccount(parsed);
        setUser(parsed.guestAccount);
      } catch (e) {}
    } else {
      const savedUser = localStorage.getItem('cent_user');
      if (savedUser) {
        setUser(savedUser);
      }
    }
  }, []);

  const login = async (username: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!window.hive_keychain) {
        alert("Hive Keychain is not installed!");
        reject("Keychain missing");
        return;
      }

      const ts = Date.now();
      const message = `Login to News Explorer: ${ts}`;

      window.hive_keychain.requestSignBuffer(
        username,
        message,
        'Posting',
        (response: KeychainResponse) => {
          if (response.success) {
            setUser(username);
            setLightAccount(null);
            localStorage.setItem('cent_user', username);
            localStorage.removeItem('cent_light_user');
            resolve();
          } else {
            console.error(response);
            reject(response.msg);
          }
        }
      );
    });
  };

  const loginLight = async (privateKeyStr: string) => {
    const envGuestAccountsStr = ((import.meta as any).env?.VITE_GUEST_ACCOUNT as string) || 'cent-light';
    const guestAccounts = envGuestAccountsStr.split(',').map((s: string) => s.trim()).filter(Boolean);

    let privKey: PrivateKey;
    try {
      privKey = PrivateKey.fromString(privateKeyStr);
    } catch (e) {
      throw new Error("Invalid private key format");
    }

    const pubKeyStr = privKey.createPublic().toString();
    const accounts = await hiveClient.database.getAccounts(guestAccounts);
    
    let authorizedAccount = null;
    let nickname = 'Guest';

    for (const account of accounts) {
      const auths = account.posting.key_auths as [string, number][];
      const isAuthorized = auths.some((auth) => auth[0] === pubKeyStr);
      if (isAuthorized) {
        authorizedAccount = account;
        let metadata = {};
        try {
          metadata = JSON.parse(account.posting_json_metadata || '{}');
        } catch (e) {}
        nickname = (metadata as any).light_accounts?.[pubKeyStr] || 'Guest';
        break;
      }
    }

    if (!authorizedAccount) {
      throw new Error("This key is not registered as a light account");
    }

    const lightUser = { nickname, privateKey: privateKeyStr, guestAccount: authorizedAccount.name };
    setLightAccount(lightUser);
    setUser(authorizedAccount.name);
    localStorage.setItem('cent_light_user', JSON.stringify(lightUser));
    localStorage.removeItem('cent_user');
  };

  const logout = () => {
    setUser(null);
    setLightAccount(null);
    localStorage.removeItem('cent_user');
    localStorage.removeItem('cent_light_user');
  };

  const vote = async (author: string, permlink: string, weight: number): Promise<KeychainResponse> => {
    if (lightAccount) {
      return { success: false, msg: "Light accounts cannot vote" };
    }

    return new Promise((resolve) => {
      if (!user || !window.hive_keychain) {
        resolve({ success: false, msg: "User not logged in or Keychain missing" });
        return;
      }

      window.hive_keychain.requestVote(
        user,
        permlink,
        author,
        weight,
        (response: KeychainResponse) => {
          resolve(response);
        }
      );
    });
  };

  const comment = async (parentAuthor: string, parentPermlink: string, title: string, body: string, tags: string[], declinePayout: boolean = false): Promise<KeychainResponse> => {
    const cleanTitle = title.trim();
    let permlink = cleanTitle 
      ? cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()
      : 're-' + parentPermlink + '-' + Date.now();
      
    if (lightAccount) {
      const pubKey = PrivateKey.fromString(lightAccount.privateKey).createPublic().toString();
      const msgUint8 = new TextEncoder().encode(pubKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyPrefix = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 10);
      
      permlink = `u-${keyPrefix}-${permlink}`;
    }

    const metadata = {
      tags: tags,
      app: 'news',
      ...(lightAccount ? { author_nickname: lightAccount.nickname } : {})
    };

    const operations: any[] = [
      ['comment', {
        parent_author: parentAuthor,
        parent_permlink: parentPermlink,
        author: lightAccount ? lightAccount.guestAccount : user,
        permlink: permlink,
        title: cleanTitle,
        body: body,
        json_metadata: JSON.stringify(metadata)
      }]
    ];

    if (declinePayout) {
      operations.push(['comment_options', {
        author: lightAccount ? lightAccount.guestAccount : user,
        permlink: permlink,
        max_accepted_payout: '0.000 HBD',
        percent_hbd: 10000,
        allow_votes: true,
        allow_curation_rewards: true,
        extensions: []
      }]);
    }

    if (lightAccount) {
      try {
        const privKey = PrivateKey.fromString(lightAccount.privateKey);
        const pubKeyStr = privKey.createPublic().toString();

        const props = await hiveClient.database.getDynamicGlobalProperties();
        const ref_block_num = props.head_block_number & 0xFFFF;
        const head_block_id = props.head_block_id;
        const ref_block_prefix = parseInt(head_block_id.slice(14, 16) + head_block_id.slice(12, 14) + head_block_id.slice(10, 12) + head_block_id.slice(8, 10), 16);
        const expiration = new Date(new Date(props.time + 'Z').getTime() + 60 * 1000).toISOString().slice(0, -5);
        
        const tx = {
            ref_block_num,
            ref_block_prefix,
            expiration,
            operations,
            extensions: []
        };
        
        const signedTx = hiveClient.broadcast.sign(tx, privKey);
        const signatureLight = signedTx.signatures[0];

        const workerResponse = await fetch("https://hive-light-api.faireye.workers.dev/sign-and-broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicLightKey: pubKeyStr,
            signatureLight: signatureLight,
            tx: tx
          })
        });

        if (!workerResponse.ok) {
          const errJson = await workerResponse.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to broadcast");
        }

        return { success: true, msg: 'Commented successfully via Worker' };
      } catch (err: any) {
        console.error(err);
        return { success: false, msg: err.message };
      }
    }

    return new Promise((resolve) => {
      if (!user || !window.hive_keychain) {
        resolve({ success: false, msg: "User not logged in or Keychain missing" });
        return;
      }

      window.hive_keychain.requestBroadcast(
        user,
        operations,
        'Posting',
        (response: KeychainResponse) => {
          resolve(response);
        }
      );
    });
  };

  const customJson = async (id: string, json: any, display_name: string, keyType: 'Posting' | 'Active' = 'Posting'): Promise<KeychainResponse> => {
    if (lightAccount) {
      if (id === 'follow' || (Array.isArray(json) && json[0] === 'follow') || (typeof json === 'object' && json?.id === 'follow')) {
        return { success: false, msg: "Light accounts cannot follow users" };
      }
      if (keyType === 'Active') {
        return { success: false, msg: "Light accounts cannot perform Active key operations" };
      }
      try {
        const privKey = PrivateKey.fromString(lightAccount.privateKey);
        const pubKeyStr = privKey.createPublic().toString();
        
        // Append nickname context if it's a social action (like follow)
        const enrichedJson = { ...json, author_nickname: lightAccount.nickname };

        const operations: any[] = [['custom_json', {
          required_auths: [],
          required_posting_auths: [lightAccount.guestAccount],
          id,
          json: JSON.stringify(enrichedJson)
        }]];

        const props = await hiveClient.database.getDynamicGlobalProperties();
        const ref_block_num = props.head_block_number & 0xFFFF;
        const head_block_id = props.head_block_id;
        const ref_block_prefix = parseInt(head_block_id.slice(14, 16) + head_block_id.slice(12, 14) + head_block_id.slice(10, 12) + head_block_id.slice(8, 10), 16);
        const expiration = new Date(new Date(props.time + 'Z').getTime() + 60 * 1000).toISOString().slice(0, -5);
        
        const tx = {
            ref_block_num,
            ref_block_prefix,
            expiration,
            operations,
            extensions: []
        };
        
        const signedTx = hiveClient.broadcast.sign(tx, privKey);
        const signatureLight = signedTx.signatures[0];

        const workerResponse = await fetch("https://hive-light-api.faireye.workers.dev/sign-and-broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicLightKey: pubKeyStr,
            signatureLight: signatureLight,
            tx: tx
          })
        });

        if (!workerResponse.ok) {
          const errJson = await workerResponse.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to broadcast");
        }

        return { success: true, msg: 'Custom JSON broadcasted via Worker' };
      } catch (err: any) {
        console.error(err);
        return { success: false, msg: err.message };
      }
    }

    return new Promise((resolve) => {
      if (!user || !window.hive_keychain) {
        resolve({ success: false, msg: "User not logged in or Keychain missing" });
        return;
      }

      window.hive_keychain.requestCustomJson(
        user,
        id,
        keyType,
        JSON.stringify(json),
        display_name,
        (response: KeychainResponse) => resolve(response)
      );
    });
  };

  return (
    <AuthContext.Provider value={{ user, lightAccount, login, loginLight, logout, vote, comment, customJson, isKeychainInstalled }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
