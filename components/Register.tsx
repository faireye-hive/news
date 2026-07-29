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
  if (name.length < 3) return 'O nome de usuário deve ter pelo menos 3 caracteres.';
  if (name.length > 16) return 'O nome de usuário não pode ter mais de 16 caracteres.';
  
  const badCharMatch = name.match(/[^a-z0-9.-]/);
  if (badCharMatch) return 'Apenas letras minúsculas, números, hífens e pontos são permitidos.';
  
  if (/^[0-9.-]/.test(name)) return 'O nome deve começar com uma letra.';
  if (/[-.]$/.test(name)) return 'O nome não pode terminar com ponto ou hífen.';
  
  const segments = name.split('.');
  for (const seg of segments) {
    if (seg.length < 3) return 'Cada segmento separado por ponto deve ter pelo menos 3 caracteres.';
    if (/^[-0-9]/.test(seg)) return 'Cada segmento deve começar com uma letra.';
  }
  return null;
};

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { login, loginLight } = useAuth();

  const [registerMode, setRegisterMode] = useState<'full' | 'light'>('full');

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
          setUsernameError('Este nome de usuário já está em uso na Hive.');
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
    if (registerMode === 'light') {
      return handleCreateLightAccount(e);
    }
    e.preventDefault();
    if (!username || usernameError || !isUsernameAvailable) {
      alert('Por favor, escolha um nome de usuário válido e disponível.');
      return;
    }
    if (!savedKeysConfirmed) {
      alert('Por favor, confirme que você salvou o backup das suas chaves.');
      return;
    }

    const creator = creatorAccount.trim().toLowerCase();
    const activeKey = creatorActiveKey.trim();

    if (!creator) {
      setCreationError('A conta criadora (Creator Account) não foi configurada.');
      return;
    }
    if (!activeKey) {
      setCreationError('A Chave Ativa da conta criadora é necessária para assinar a transação na Hive.');
      return;
    }
    if (!derivedKeys) {
      setCreationError('Ocorreu um erro ao derivar as chaves da conta.');
      return;
    }

    setLoading(true);
    setCreationError(null);

    try {
      const buildAuth = (pubKey: string) => ({
        weight_threshold: 1,
        account_auths: [],
        key_auths: [[pubKey, 1]]
      });

      const ownerAuth = buildAuth(derivedKeys.ownerPublic);
      const activeAuth = buildAuth(derivedKeys.activePublic);
      const postingAuth = buildAuth(derivedKeys.postingPublic);

      // Construct create_claimed_account operation
      const createClaimedOp: any = [
        'create_claimed_account',
        {
          creator: creator,
          new_account_name: username.trim().toLowerCase(),
          owner: ownerAuth,
          active: activeAuth,
          posting: postingAuth,
          memo_key: derivedKeys.memoPublic,
          json_metadata: JSON.stringify({
            profile: {
              name: username,
              about: 'Conta criada via News Token Explorer',
            }
          }),
          extensions: []
        }
      ];

      const pKey = PrivateKey.fromString(activeKey);

      // Broadcast operation to Hive Blockchain
      await hiveClient.broadcast.sendOperations([createClaimedOp], pKey);

      setCreatedSuccess(true);
    } catch (err: any) {
      console.error('Account Creation Error:', err);
      const errMsg = err.message || err.toString();

      if (errMsg.includes('has_claimed_account') || errMsg.includes('rc_plugin') || errMsg.includes('Insufficient RC')) {
        setCreationError(`A conta criadora @${creator} não possui Claim Account Tokens suficientes ou Recursos (RC) para criar contas grátis.`);
      } else if (errMsg.includes('canonical') || errMsg.includes('private key') || errMsg.includes('signature')) {
        setCreationError('A Chave Ativa do criador informada é inválida ou incorreta.');
      } else {
        setCreationError(`Erro ao criar conta na Hive: ${errMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLogin = async () => {
    try {
      if (registerMode === 'light') {
        await loginLight(lightPrivateKey);
      } else {
        await login(username.trim().toLowerCase());
      }
      navigate('/explorer');
    } catch (err: any) {
      alert('Não foi possível fazer login automático. Erro: ' + err.message);
      navigate('/explorer');
    }
  };

  if (createdSuccess) {
    if (registerMode === 'light') {
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
                <CheckCircle2 size={18} /> Entrar na Conta Light
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
        <div className="bg-card border border-green-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
            <Sparkles size={36} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              🎉 Conta Criada com Sucesso!
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              Sua nova conta <span className="text-cent font-bold font-mono">@{username}</span> foi registrada na Hive Blockchain.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-left text-xs text-slate-300 space-y-2 font-mono">
            <div><span className="text-slate-500">Usuário:</span> @{username}</div>
            <div><span className="text-slate-500">Senha Máster:</span> {masterPassword}</div>
            <div><span className="text-slate-500">Posting Key:</span> {derivedKeys?.postingPrivate}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={handleDownloadBackup}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl border border-slate-700 transition-all text-sm"
            >
              <Download size={18} /> Baixar Backup das Chaves
            </button>

            <button
              onClick={handleAutoLogin}
              className="flex items-center justify-center gap-2 bg-cent hover:bg-green-400 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all text-sm shadow-lg shadow-cent/20"
            >
              <CheckCircle2 size={18} /> Entrar na Conta
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
            <UserPlus className="text-cent" /> Criar Conta na Hive Blockchain
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Crie sua conta única e descentralizada na blockchain Hive. Sua conta dá acesso a todo o ecossistema Web3.
          </p>
        </div>

        <div className="flex bg-slate-900 rounded-lg p-1">
          <button 
            type="button"
            onClick={() => setRegisterMode('full')}
            className={`flex-1 py-3 px-3 rounded-md text-sm font-bold transition-colors ${registerMode === 'full' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Full Account (Recommended)
          </button>
          <button 
            type="button"
            onClick={() => setRegisterMode('light')}
            className={`flex-1 py-3 px-3 rounded-md text-sm font-bold transition-colors ${registerMode === 'light' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Light Account (Guest)
          </button>
        </div>

        {creationError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
            <XCircle size={20} className="shrink-0 mt-0.5 text-red-400" />
            <div className="leading-relaxed">{creationError}</div>
          </div>
        )}

        <form onSubmit={handleCreateAccount} className="space-y-6">
          {registerMode === 'full' ? (
            <>
              {/* Step 1: Username selection */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-white uppercase tracking-wider">
                  1. Escolha o Nome de Usuário (@username)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-500 font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="ex: novousuario"
                    className={`w-full bg-slate-900 border ${
                      usernameError 
                        ? 'border-red-500 focus:border-red-500' 
                        : isUsernameAvailable === true 
                        ? 'border-green-500 focus:border-green-500' 
                        : 'border-slate-700 focus:border-cent'
                    } rounded-xl py-3 pl-8 pr-10 text-white placeholder-slate-600 outline-none font-mono text-sm transition-all`}
                    required
                  />

                  <div className="absolute right-3 top-3.5">
                    {isCheckingUsername && (
                      <RefreshCw size={18} className="animate-spin text-slate-400" />
                    )}
                    {!isCheckingUsername && isUsernameAvailable === true && (
                      <CheckCircle2 size={18} className="text-green-400" />
                    )}
                    {!isCheckingUsername && isUsernameAvailable === false && (
                      <XCircle size={18} className="text-red-400" />
                    )}
                  </div>
                </div>

                {usernameError ? (
                  <p className="text-red-400 text-xs font-medium">{usernameError}</p>
                ) : isUsernameAvailable === true ? (
                  <p className="text-green-400 text-xs font-medium">Nome de usuário disponível!</p>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Apenas minúsculas, números e hífens. De 3 a 16 caracteres.
                  </p>
                )}
              </div>

              {/* Step 2: Keys & Password Display */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Key size={16} className="text-cent" /> 2. Senha e Chaves de Acesso
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateNewPassword}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} /> Gerar Nova Senha
                  </button>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block uppercase mb-1">
                      Senha Máster (Master Password):
                    </span>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 select-all break-all flex items-center justify-between gap-2">
                      <span>{masterPassword || 'Gerando...'}</span>
                      <Lock size={14} className="text-slate-500 shrink-0" />
                    </div>
                  </div>

                  {derivedKeys && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="text-xs text-slate-400 font-semibold uppercase">Chaves Privadas Derivadas:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800/60">
                          <span className="text-slate-500 block">Posting Key (Login em apps):</span>
                          <span className="text-slate-300 break-all select-all">{derivedKeys.postingPrivate}</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800/60">
                          <span className="text-slate-500 block">Active Key (Carteira/Transações):</span>
                          <span className="text-slate-300 break-all select-all">{derivedKeys.activePrivate}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons for keys */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyKeys}
                      disabled={!derivedKeys}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
                    >
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      {copied ? 'Copiado para Área de Transferência!' : 'Copiar Todas as Chaves'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      disabled={!derivedKeys}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
                    >
                      <Download size={14} /> Baixar Arquivo de Backup (.txt)
                    </button>
                  </div>
                </div>

                {/* Mandatory confirmation checkbox */}
                <label className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl cursor-pointer hover:bg-amber-500/15 transition-all">
                  <input
                    type="checkbox"
                    checked={savedKeysConfirmed}
                onChange={(e) => setSavedKeysConfirmed(e.target.checked)}
                className="mt-1 rounded bg-slate-900 border-amber-500 text-cent focus:ring-0"
              />
              <span className="text-xs text-amber-200 leading-relaxed font-medium">
                <strong className="text-amber-400">Aviso Crítico de Segurança:</strong> Eu salvei e fiz backup da minha Senha Máster e Chaves em um local seguro. Entendo que na Web3 não existe opção de "Esqueci minha senha" e a perda das chaves é irreversível.
              </span>
            </label>
          </div>

          {/* Step 3: Account Creator Info / ENV status */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-white uppercase tracking-wider">
                3. Configuração do Criador (Creator Account)
              </label>

              <button
                type="button"
                onClick={() => setShowAdvancedCreator(!showAdvancedCreator)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {showAdvancedCreator ? 'Ocultar Opções Avançadas' : 'Opções do Criador'}
              </button>
            </div>

            {envCreatorAccount ? (
              <div className="p-3 bg-cent/10 border border-cent/30 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-cent" />
                  <span>
                    Conta criadora ativa: <strong className="text-white">@{envCreatorAccount}</strong> (via ENV)
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-cent bg-cent/20 px-2 py-0.5 rounded">
                  Grátis
                </span>
              </div>
            ) : (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Nenhuma conta criadora pré-configurada na variável de ambiente (<code>VITE_CREATOR_ACCOUNT</code>). Por favor, informe abaixo o nome da conta e sua chave ativa que possui Claim Account Tokens para registrar esta nova conta.
                </span>
              </div>
            )}

            {showAdvancedCreator && (
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-3 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Conta Criadora (@Creator)
                  </label>
                  <input
                    type="text"
                    value={creatorAccount}
                    onChange={(e) => setCreatorAccount(e.target.value.toLowerCase().trim())}
                    placeholder="ex: minerador.hive"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Chave Ativa do Criador (Active Private Key)
                  </label>
                  <input
                    type="password"
                    value={creatorActiveKey}
                    onChange={(e) => setCreatorActiveKey(e.target.value.trim())}
                    placeholder="5K..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cent font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Esta chave é utilizada apenas localmente no navegador para assinar a transação de criação da conta na blockchain.
                  </p>
                </div>
              </div>
            )}
          </div>
          </>
          ) : (
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
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading || 
              !savedKeysConfirmed || 
              (registerMode === 'full' && (!username || !!usernameError || !isUsernameAvailable)) ||
              (registerMode === 'light' && !nickname)
            }
            className="w-full bg-cent hover:bg-green-400 text-slate-900 font-black py-4 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-cent text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cent/10"
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Criando Conta na Blockchain...
              </>
            ) : (
              <>
                <UserPlus size={18} /> Criar Minha Conta Hive
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
