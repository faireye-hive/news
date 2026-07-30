import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserPlus, 
  Key, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Download, 
  ShieldAlert, 
  Sparkles, 
  ArrowLeft, 
  Check, 
  Lock, 
  RefreshCw,
  Info
} from 'lucide-react';
import { Client, PrivateKey } from '@hiveio/dhive';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const HIVE_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://api.openhive.network',
  'https://api.c0ff33a.uk'
];

const hiveClient = new Client(HIVE_NODES);

// Helper to generate a strong master password
const generateMasterPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomStr = '';
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < array.length; i++) {
    randomStr += chars[array[i] % chars.length];
  }
  return `P5K${randomStr}`;
};

// Helper to validate Hive username format
const validateHiveUsername = (name: string): string | null => {
  if (!name) return null;
  if (name.length < 3) return 'Username must be at least 3 characters.';
  if (name.length > 16) return 'Username cannot be longer than 16 characters.';
  
  const badCharMatch = name.match(/[^a-z0-9.-]/);
  if (badCharMatch) return 'Only lowercase letters, numbers, hyphens, and periods are allowed.';
  
  if (/^[0-9.-]/.test(name)) return 'Name must start with a letter.';
  if (/[-.]$/.test(name)) return 'Name cannot end with a period or hyphen.';
  
  const segments = name.split('.');
  for (const seg of segments) {
    if (seg.length < 3) return 'Each segment separated by a period must have at least 3 characters.';
    if (/^[-0-9]/.test(seg)) return 'Each segment must start with a letter.';
  }
  return null;
};

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { login, loginLight } = useAuth();

  const [registerMode, setRegisterMode] = useState<'full' | 'light'>('light');

  // Full Account State
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [masterPassword, setMasterPassword] = useState('');

  // Light Account State
  const [nickname, setNickname] = useState('');
  const [lightPrivateKey, setLightPrivateKey] = useState('');
  
  const [savedKeysConfirmed, setSavedKeysConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Derived keys state (Full Account)
  const [derivedKeys, setDerivedKeys] = useState<{
    ownerPrivate: string;
    ownerPublic: string;
    activePrivate: string;
    activePublic: string;
    postingPrivate: string;
    postingPublic: string;
    memoPrivate: string;
    memoPublic: string;
  } | null>(null);

  // Creator credentials (ENV default or custom)
  const envCreatorAccount = ((import.meta as any).env?.VITE_CREATOR_ACCOUNT as string) || '';
  const envCreatorKey = ((import.meta as any).env?.VITE_CREATOR_ACTIVE_KEY as string) || '';

  const envGuestAccountsStr = ((import.meta as any).env?.VITE_GUEST_ACCOUNT as string) || '';
  const envGuestActiveKeysStr = ((import.meta as any).env?.VITE_GUEST_ACTIVE_KEY as string) || '';
  
  const guestAccounts = envGuestAccountsStr.split(',').map(s => s.trim()).filter(Boolean);
  const guestActiveKeys = envGuestActiveKeysStr.split(',').map(s => s.trim()).filter(Boolean);

  const [creatorAccount, setCreatorAccount] = useState(envCreatorAccount);
  const [creatorActiveKey, setCreatorActiveKey] = useState(envCreatorKey);
  const [showAdvancedCreator, setShowAdvancedCreator] = useState(!envCreatorAccount);

  const [loading, setLoading] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState(false);
  const [assignedGuestAccount, setAssignedGuestAccount] = useState('');

  // Generate initial master password on mount
  useEffect(() => {
    handleGenerateNewPassword();
    setLightPrivateKey(PrivateKey.fromSeed(Math.random().toString()).toString());
  }, []);

  // Whenever username or password changes, update keys
  useEffect(() => {
    if (username && masterPassword && !usernameError) {
      try {
        const ownerKey = PrivateKey.fromLogin(username.toLowerCase(), masterPassword, 'owner');
        const activeKey = PrivateKey.fromLogin(username.toLowerCase(), masterPassword, 'active');
        const postingKey = PrivateKey.fromLogin(username.toLowerCase(), masterPassword, 'posting');
        const memoKey = PrivateKey.fromLogin(username.toLowerCase(), masterPassword, 'memo');

        setDerivedKeys({
          ownerPrivate: ownerKey.toString(),
          ownerPublic: ownerKey.createPublic().toString(),
          activePrivate: activeKey.toString(),
          activePublic: activeKey.createPublic().toString(),
          postingPrivate: postingKey.toString(),
          postingPublic: postingKey.createPublic().toString(),
          memoPrivate: memoKey.toString(),
          memoPublic: memoKey.createPublic().toString(),
        });
      } catch (err) {
        console.error('Error deriving keys:', err);
      }
    } else {
      setDerivedKeys(null);
    }
  }, [username, masterPassword, usernameError]);

  // Debounced username checking
  useEffect(() => {
    const cleanName = username.trim().toLowerCase();
    if (!cleanName) {
      setUsernameError(null);
      setIsUsernameAvailable(null);
      return;
    }

    const fmtError = validateHiveUsername(cleanName);
    if (fmtError) {
      setUsernameError(fmtError);
      setIsUsernameAvailable(false);
      return;
    }

    setUsernameError(null);
    setIsCheckingUsername(true);

    const timer = setTimeout(async () => {
      try {
        const accounts = await hiveClient.database.getAccounts([cleanName]);
        if (accounts && accounts.length > 0) {
          setIsUsernameAvailable(false);
          setUsernameError('This username is already taken on Hive.');
        } else {
          setIsUsernameAvailable(true);
          setUsernameError(null);
        }
      } catch (err) {
        console.error('Error checking account availability:', err);
        // Fail-safe: allow proceeding if RPC network error
        setIsUsernameAvailable(true);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleGenerateNewPassword = () => {
    const newPass = generateMasterPassword();
    setMasterPassword(newPass);
    setCopied(false);
  };

  const getKeysBackupText = () => {
    if (!derivedKeys) return '';
    return `=====================================================
HIVE BLOCKCHAIN ACCOUNT KEYS BACKUP
=====================================================
ACCOUNT NAME: @${username}
CREATED AT: ${new Date().toLocaleString()}

MASTER PASSWORD:
${masterPassword}

-----------------------------------------------------
PRIVATE KEYS (KEEP SECRET & SAFE! DO NOT SHARE!):
-----------------------------------------------------
Owner Private Key:   ${derivedKeys.ownerPrivate}
Active Private Key:  ${derivedKeys.activePrivate}
Posting Private Key: ${derivedKeys.postingPrivate}
Memo Private Key:    ${derivedKeys.memoPrivate}

-----------------------------------------------------
PUBLIC KEYS:
-----------------------------------------------------
Owner Public Key:   ${derivedKeys.ownerPublic}
Active Public Key:  ${derivedKeys.activePublic}
Posting Public Key: ${derivedKeys.postingPublic}
Memo Public Key:    ${derivedKeys.memoPublic}

=====================================================
INSTRUCTIONS:
1. Use your Master Password or Posting Private Key to log in to Hive apps via Hive Keychain.
2. Keep this text file in a password manager or offline encrypted storage.
3. If you lose your keys, nobody can recover your account.
=====================================================`;
  };

  const handleCopyKeys = () => {
    const text = getKeysBackupText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadBackup = () => {
    const text = getKeysBackupText();
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `hive-keys-${username.toLowerCase() || 'backup'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCreateLightAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname) {
      alert("Please choose a nickname.");
      return;
    }
    if (guestAccounts.length === 0 || guestActiveKeys.length === 0 || guestAccounts.length !== guestActiveKeys.length) {
      setCreationError("Guest accounts are not fully or properly configured in the environment variables (mismatching lengths or empty).");
      return;
    }

    setLoading(true);
    setCreationError(null);

    try {
      const pubKeyStr = PrivateKey.fromString(lightPrivateKey).createPublic().toString();
      
      // Find an account with available space (< 40 keys)
      let selectedAccountObj = null;
      let selectedAccountName = '';
      let selectedActiveKey = '';
      
      const accountsData = await hiveClient.database.getAccounts(guestAccounts);
      
      for (let i = 0; i < accountsData.length; i++) {
        const acc = accountsData[i];
        if (acc.posting.key_auths.length < 40) {
          selectedAccountObj = acc;
          selectedAccountName = guestAccounts[i];
          selectedActiveKey = guestActiveKeys[i];
          break;
        }
      }
      
      if (!selectedAccountObj) {
        throw new Error("All configured guest accounts are full. Please ask the administrator to add more.");
      }
      
      const account = selectedAccountObj;

      // Update Posting Auth
      const newPosting = { ...account.posting };
      const authExists = newPosting.key_auths.some((auth: any) => auth[0] === pubKeyStr);
      
      if (!authExists) {
        newPosting.key_auths.push([pubKeyStr, 1]);
        // Sort keys alphabetically by public key string (Hive requirement)
        newPosting.key_auths.sort((a: any, b: any) => a[0].localeCompare(b[0]));
      }

      // Update Metadata
      let metadata: any = {};
      try {
        metadata = JSON.parse(account.posting_json_metadata || '{}');
      } catch (e) {}
      
      metadata.light_accounts = metadata.light_accounts || {};
      metadata.light_accounts[pubKeyStr] = nickname;

      const updateOp: any = [
        'account_update2',
        {
          account: selectedAccountName,
          owner: undefined,
          active: undefined,
          posting: newPosting,
          memo_key: account.memo_key,
          json_metadata: account.json_metadata,
          posting_json_metadata: JSON.stringify(metadata),
          extensions: []
        }
      ];

      const pKey = PrivateKey.fromString(selectedActiveKey);
      await hiveClient.broadcast.sendOperations([updateOp], pKey);

      setAssignedGuestAccount(selectedAccountName);
      setCreatedSuccess(true);
    } catch (err: any) {
      console.error(err);
      setCreationError(err.message || err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    return handleCreateLightAccount(e);
  };

  const handleAutoLogin = async () => {
    try {
      await loginLight(lightPrivateKey);
      navigate('/explorer');
    } catch (err: any) {
      alert('Auto-login failed. Error: ' + err.message);
      navigate('/explorer');
    }
  };

  if (createdSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
        <div className="bg-card border border-green-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
            <Sparkles size={36} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              🎉 Light Account Created!
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              Your nickname <span className="text-cent font-bold font-mono">{nickname}</span> is now linked to <span className="text-cent font-bold font-mono">@{assignedGuestAccount}</span>.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-left text-xs text-slate-300 space-y-2 font-mono">
            <div><span className="text-slate-500">Nickname:</span> {nickname}</div>
            <div><span className="text-slate-500">Light Private Key:</span> <br/><span className="break-all">{lightPrivateKey}</span></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={handleAutoLogin}
              className="flex items-center justify-center gap-2 bg-cent hover:bg-green-400 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all text-sm shadow-lg shadow-cent/20"
            >
              <CheckCircle2 size={18} /> Login to Light Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 animate-fade-in space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-cent bg-cent/10 px-3 py-1.5 rounded-full border border-cent/20">
          <Sparkles size={14} /> Hive Account Creator
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-card border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <UserPlus className="text-cent" /> Create Light Account
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Create your free guest profile on the Hive blockchain to start participating immediately without needing funds or complex key setups.
          </p>
        </div>

        {creationError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
            <XCircle size={20} className="shrink-0 mt-0.5 text-red-400" />
            <div className="leading-relaxed">{creationError}</div>
          </div>
        )}

        <form onSubmit={handleCreateAccount} className="space-y-6">
          <div className="space-y-6">
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-4">
              <p className="text-sm text-slate-300">
                Light Accounts are guest profiles that share a master Hive account. You don't need funds to create one.
              </p>
              <div>
                <label className="block text-slate-400 text-xs uppercase mb-1 font-bold">
                  Guest Account
                </label>
                <input
                  type="text"
                  value={guestAccounts.join(', ') || 'Not configured in .env'}
                  disabled
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-500 outline-none font-medium text-xs"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">
                  Choose your Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cent rounded-xl py-3 px-4 text-white placeholder-slate-600 outline-none font-medium text-sm transition-all"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block uppercase mb-1">
                  Your Light Private Key (Save this!)
                </span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 select-all break-all flex items-center justify-between gap-2">
                  <span>{lightPrivateKey}</span>
                  <Lock size={14} className="text-slate-500 shrink-0" />
                </div>
              </div>
              
              <label className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl cursor-pointer hover:bg-amber-500/15 transition-all">
                <input
                  type="checkbox"
                  checked={savedKeysConfirmed}
                  onChange={(e) => setSavedKeysConfirmed(e.target.checked)}
                  className="mt-1 rounded bg-slate-900 border-amber-500 text-cent focus:ring-0"
                />
                <span className="text-xs text-amber-200 leading-relaxed font-medium">
                  <strong className="text-amber-400">Security Warning:</strong> I have saved my Light Private Key. I will need this to log in.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading || 
              !savedKeysConfirmed || 
              !nickname
            }
            className="w-full bg-cent hover:bg-green-400 text-slate-900 font-black py-4 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-cent text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cent/10"
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Creating Light Account...
              </>
            ) : (
              <>
                <UserPlus size={18} /> Create Light Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
