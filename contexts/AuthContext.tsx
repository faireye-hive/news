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
    const guestAccount = ((import.meta as any).env?.VITE_GUEST_ACCOUNT as string) || '';
    if (!guestAccount) throw new Error("Light account not configured (VITE_GUEST_ACCOUNT)");

    let privKey: PrivateKey;
    try {
      privKey = PrivateKey.fromString(privateKeyStr);
    } catch (e) {
      throw new Error("Invalid private key format");
    }

    const pubKeyStr = privKey.createPublic().toString();
    const accounts = await hiveClient.database.getAccounts([guestAccount]);
    const account = accounts[0];
    if (!account) throw new Error(`Guest account @${guestAccount} not found`);

    const auths = account.posting.key_auths as [string, number][];
    const isAuthorized = auths.some((auth) => auth[0] === pubKeyStr);
    
    if (!isAuthorized) {
      throw new Error("This key is not registered as a light account");
    }

    let metadata = {};
    try {
      metadata = JSON.parse(account.posting_json_metadata || '{}');
    } catch (e) {}

    const nickname = (metadata as any).light_accounts?.[pubKeyStr] || 'Guest';

    const lightUser = { nickname, privateKey: privateKeyStr, guestAccount };
    setLightAccount(lightUser);
    setUser(guestAccount);
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
    const permlink = cleanTitle 
      ? cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()
      : 're-' + parentPermlink + '-' + Date.now();
      
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
        const guestPostingKey = ((import.meta as any).env?.VITE_GUEST_POSTING_KEY as string) || '';
        if (!guestPostingKey) throw new Error("Master posting key not configured");
        
        const privKey = PrivateKey.fromString(lightAccount.privateKey);
        const masterKey = PrivateKey.fromString(guestPostingKey);

        await hiveClient.broadcast.sendOperations(operations, [privKey, masterKey]);
        return { success: true, msg: 'Commented successfully' };
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
        const guestPostingKey = ((import.meta as any).env?.VITE_GUEST_POSTING_KEY as string) || '';
        if (!guestPostingKey) throw new Error("Master posting key not configured");
        
        const privKey = PrivateKey.fromString(lightAccount.privateKey);
        const masterKey = PrivateKey.fromString(guestPostingKey);
        
        // Append nickname context if it's a social action (like follow)
        const enrichedJson = { ...json, author_nickname: lightAccount.nickname };

        const op: any[] = ['custom_json', {
          required_auths: [],
          required_posting_auths: [lightAccount.guestAccount],
          id,
          json: JSON.stringify(enrichedJson)
        }];

        await hiveClient.broadcast.sendOperations([op], [privKey, masterKey]);
        return { success: true, msg: 'Custom JSON broadcasted' };
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
