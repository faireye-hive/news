import React, { useState, useEffect } from 'react';
import { Client, PrivateKey } from '@hiveio/dhive';
import { RefreshCw, Users, Key, AlertCircle, Save, CheckCircle2, Info, Trash2 } from 'lucide-react';

const hiveClient = new Client('https://api.hive.blog');

const LightAccountsAdmin: React.FC = () => {
  const envGuestAccountsStr = ((import.meta as any).env?.VITE_GUEST_ACCOUNT as string) || '';
  const envGuestActiveKeysStr = ((import.meta as any).env?.VITE_GUEST_ACTIVE_KEY as string) || '';
  
  const guestAccounts = envGuestAccountsStr.split(',').map(s => s.trim()).filter(Boolean);
  const guestActiveKeys = envGuestActiveKeysStr.split(',').map(s => s.trim()).filter(Boolean);

  const [accountsData, setAccountsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [masterWeights, setMasterWeights] = useState<Record<string, number>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [updateMessages, setUpdateMessages] = useState<Record<string, {type: 'success'|'error', text: string}>>({});
  const [revoking, setRevoking] = useState<Record<string, boolean>>({});

  const handleRevoke = async (accountName: string, accountIndex: number, pubKeyStr: string) => {
    const activeKeyStr = guestActiveKeys[accountIndex];
    if (!activeKeyStr) {
      setUpdateMessages({ ...updateMessages, [accountName]: { type: 'error', text: 'Active key not found for this account.' } });
      return;
    }

    if (!confirm(`Are you sure you want to revoke the key ${pubKeyStr.substring(0, 10)}...? This action cannot be undone.`)) return;

    setRevoking({ ...revoking, [`${accountName}_${pubKeyStr}`]: true });
    setUpdateMessages({ ...updateMessages, [accountName]: undefined as any });

    try {
      const acc = accountsData.find(a => a.name === accountName);
      if (!acc) throw new Error("Account data not found");

      const newPosting = { ...acc.posting };
      newPosting.key_auths = newPosting.key_auths.filter((auth: any) => auth[0] !== pubKeyStr);
      
      let metadata: any = {};
      try {
        metadata = JSON.parse(acc.posting_json_metadata || '{}');
      } catch (e) {}
      
      if (metadata.light_accounts && metadata.light_accounts[pubKeyStr]) {
        delete metadata.light_accounts[pubKeyStr];
      }

      const updateOp: any = [
        'account_update2',
        {
          account: accountName,
          owner: undefined,
          active: undefined,
          posting: newPosting,
          memo_key: acc.memo_key,
          json_metadata: acc.json_metadata,
          posting_json_metadata: JSON.stringify(metadata),
          extensions: []
        }
      ];

      const pKey = PrivateKey.fromString(activeKeyStr);
      await hiveClient.broadcast.sendOperations([updateOp], pKey);

      setUpdateMessages({ ...updateMessages, [accountName]: { type: 'success', text: 'Key revoked successfully!' } });
      await fetchAccounts();
    } catch (err: any) {
      console.error(err);
      setUpdateMessages({ ...updateMessages, [accountName]: { type: 'error', text: err.message || 'Error revoking key.' } });
    } finally {
      setRevoking({ ...revoking, [`${accountName}_${pubKeyStr}`]: false });
    }
  };

  const fetchAccounts = async () => {
    if (guestAccounts.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await hiveClient.database.getAccounts(guestAccounts);
      setAccountsData(data);
      
      const newThresholds: Record<string, number> = {};
      const newMasterWeights: Record<string, number> = {};
      
      data.forEach((acc, index) => {
        newThresholds[acc.name] = acc.posting.weight_threshold;
        // The master key is typically the first one or the one with the highest weight
        // Let's assume the highest weight key is the master key, or we can find the one matching VITE_GUEST_POSTING_KEY
        // But we don't have VITE_GUEST_POSTING_KEY as an array. 
        // We can just find the maximum weight in key_auths
        let maxWeight = 0;
        acc.posting.key_auths.forEach((auth: any) => {
          if (auth[1] > maxWeight) maxWeight = auth[1];
        });
        newMasterWeights[acc.name] = maxWeight;
      });
      
      setThresholds(newThresholds);
      setMasterWeights(newMasterWeights);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch guest accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleUpdate = async (accountName: string, index: number) => {
    const activeKeyStr = guestActiveKeys[index];
    if (!activeKeyStr) {
      setUpdateMessages({ ...updateMessages, [accountName]: { type: 'error', text: 'Active key not found for this account.' } });
      return;
    }

    setUpdating({ ...updating, [accountName]: true });
    setUpdateMessages({ ...updateMessages, [accountName]: undefined as any });

    try {
      const acc = accountsData.find(a => a.name === accountName);
      if (!acc) throw new Error("Account data not found");

      const newThreshold = thresholds[accountName];
      const newMasterWeight = masterWeights[accountName];

      const newPosting = { ...acc.posting };
      newPosting.weight_threshold = newThreshold;

      // Update the master key weight. 
      // We assume the master key is the one that previously had the maximum weight.
      // If there are multiple, we update the one with the highest weight currently.
      let masterPubKey = '';
      let maxWeight = -1;
      let masterIndex = -1;
      
      newPosting.key_auths.forEach((auth: any, i: number) => {
        if (auth[1] > maxWeight) {
          maxWeight = auth[1];
          masterPubKey = auth[0];
          masterIndex = i;
        }
      });

      if (masterIndex !== -1) {
        newPosting.key_auths[masterIndex][1] = newMasterWeight;
      }

      const updateOp: any = [
        'account_update2',
        {
          account: accountName,
          owner: undefined,
          active: undefined,
          posting: newPosting,
          memo_key: acc.memo_key,
          json_metadata: acc.json_metadata,
          posting_json_metadata: acc.posting_json_metadata,
          extensions: []
        }
      ];

      const pKey = PrivateKey.fromString(activeKeyStr);
      await hiveClient.broadcast.sendOperations([updateOp], pKey);

      setUpdateMessages({ ...updateMessages, [accountName]: { type: 'success', text: 'Thresholds updated successfully!' } });
      await fetchAccounts();
    } catch (err: any) {
      console.error(err);
      setUpdateMessages({ ...updateMessages, [accountName]: { type: 'error', text: err.message || 'Error updating account.' } });
    } finally {
      setUpdating({ ...updating, [accountName]: false });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3 text-blue-800 dark:text-blue-300">
        <Info className="w-6 h-6 shrink-0" />
        <div className="space-y-2 text-sm">
          <p>
            <strong>Light Accounts</strong> are used to onboard users without them needing their own Hive account. 
            They act as "guest profiles" inside these master accounts.
          </p>
          <p>
            To allow more Light Accounts, you can add more accounts in your <code>.env</code> file. 
            Use a comma-separated list for <code>VITE_GUEST_ACCOUNT</code> and <code>VITE_GUEST_ACTIVE_KEY</code>. 
            For example:
          </p>
          <code className="block bg-blue-100 dark:bg-blue-950 p-2 rounded text-xs">
            VITE_GUEST_ACCOUNT=guest1,guest2<br/>
            VITE_GUEST_ACTIVE_KEY=5K...,5J...
          </code>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      ) : accountsData.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          No guest accounts configured in environment variables.
        </div>
      ) : (
        <div className="space-y-6">
          {accountsData.map((acc, idx) => (
            <div key={acc.name} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold uppercase">
                    {acc.name.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">@{acc.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {acc.posting.key_auths.length - 1} Guests (Max 40)</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${acc.posting.key_auths.length < 40 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {acc.posting.key_auths.length < 40 ? 'Available' : 'Full'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Posting Weight Threshold
                  </label>
                  <input 
                    type="number" 
                    value={thresholds[acc.name] || 0}
                    onChange={(e) => setThresholds({...thresholds, [acc.name]: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The total weight required to broadcast a posting transaction (default 50).
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Master Key Weight
                  </label>
                  <input 
                    type="number" 
                    value={masterWeights[acc.name] || 0}
                    onChange={(e) => setMasterWeights({...masterWeights, [acc.name]: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The weight of the primary posting key (default 50). Guest keys have weight 1.
                  </p>
                </div>
              </div>

              {updateMessages[acc.name] && (
                <div className={`p-3 mb-4 rounded-lg text-sm flex items-center gap-2 ${
                  updateMessages[acc.name].type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {updateMessages[acc.name].type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {updateMessages[acc.name].text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => handleUpdate(acc.name, idx)}
                  disabled={updating[acc.name]}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {updating[acc.name] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Thresholds
                </button>
              </div>

              {/* Guest Keys List */}
              <div className="mt-8">
                <h4 className="text-md font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Active Guest Keys</h4>
                {acc.posting.key_auths.filter((auth: any) => auth[1] === 1).length === 0 ? (
                  <div className="text-sm text-gray-500 italic">No guest keys currently assigned.</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {acc.posting.key_auths.filter((auth: any) => auth[1] === 1).map((auth: any) => {
                      const pubKey = auth[0];
                      let nickname = "Unknown";
                      try {
                        const meta = JSON.parse(acc.posting_json_metadata || '{}');
                        nickname = meta.light_accounts?.[pubKey] || "Unknown";
                      } catch (e) {}

                      return (
                        <div key={pubKey} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{nickname}</div>
                            <div className="font-mono text-xs text-gray-500 truncate">{pubKey}</div>
                          </div>
                          <button
                            onClick={() => handleRevoke(acc.name, idx, pubKey)}
                            disabled={revoking[`${acc.name}_${pubKey}`]}
                            className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                            title="Revoke Key"
                          >
                            {revoking[`${acc.name}_${pubKey}`] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LightAccountsAdmin;
