import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, UserX, UserCheck, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { getVotingPower } from '../services/hiveEngineService';

const AdminPanel: React.FC = () => {
  const { user, customJson } = useAuth();
  const [targetUser, setTargetUser] = useState('');
  const [isMuting, setIsMuting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // The admin account and reward pool ID specific to this tribe
  const ADMIN_ACCOUNT = 'faireye';
  const REWARD_POOL_ID = 55;
  const TOKEN_SYMBOL = 'NEWS';

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (targetUser.trim()) {
        checkUserStatus(targetUser.trim().replace(/^@/, ''));
      } else {
        setUserStatus(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [targetUser]);

  const checkUserStatus = async (username: string) => {
    setIsSearching(true);
    try {
      const vp = await getVotingPower(username, TOKEN_SYMBOL);
      setUserStatus(vp || { account: username, mute: false });
    } catch (err) {
      console.error("Error checking user status:", err);
      setUserStatus(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMuteToggle = async (mute: boolean) => {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to perform this action.' });
      return;
    }
    
    if (user !== ADMIN_ACCOUNT) {
      setMessage({ type: 'error', text: `Only the admin (${ADMIN_ACCOUNT}) can perform this action.` });
      return;
    }

    if (!targetUser.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid username.' });
      return;
    }

    // Clean username
    const username = targetUser.trim().replace(/^@/, '');

    setIsMuting(true);
    setMessage(null);

    try {
      const payload = {
        contractName: 'comments',
        contractAction: 'setMute',
        contractPayload: {
          rewardPoolId: REWARD_POOL_ID,
          account: username,
          mute: mute
        }
      };

      const response = await customJson(
        'ssc-mainnet-hive',
        payload,
        `${mute ? 'Mute' : 'Unmute'} User`,
        'Active'
      );

      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully ${mute ? 'muted' : 'unmuted'} @${username}. The transaction has been broadcast.` 
        });
        setTargetUser('');
      } else {
        setMessage({ 
          type: 'error', 
          text: response.message || 'Failed to broadcast transaction. Make sure you used the Active key.' 
        });
      }
    } catch (err: any) {
      console.error("Mute error:", err);
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setIsMuting(false);
    }
  };

  if (user !== ADMIN_ACCOUNT) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Shield className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Admin Access Required</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          This page is restricted to community administrators. You must be logged in as <strong>@{ADMIN_ACCOUNT}</strong> to access these features.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Moderation Panel</h2>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Mute / Unmute User</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Muted users will no longer receive NEWS rewards from the reward pool (ID: {REWARD_POOL_ID}). 
              This requires your <strong>Active Key</strong> to authorize the smart contract transaction.
            </p>
            
            {message && (
              <div className={`p-4 mb-6 rounded-lg flex items-start space-x-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}>
                {message.type === 'success' ? (
                  <UserCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <p>{message.text}</p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 pb-6">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                  @
                </span>
                <input
                  type="text"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  placeholder="username"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isMuting}
                />
                
                {targetUser && (
                  <div className="absolute -bottom-6 left-0 text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    {isSearching ? (
                      <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Checking status...</span>
                    ) : userStatus ? (
                      <span className={`font-medium ${userStatus.mute ? 'text-red-500' : 'text-green-500'}`}>
                        {userStatus.mute ? 'User is currently MUTED' : 'User is currently UNMUTED'}
                      </span>
                    ) : (
                      <span>No user data found</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-shrink-0 gap-3">
                <button
                  onClick={() => handleMuteToggle(true)}
                  disabled={isMuting || !targetUser.trim()}
                  className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isMuting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <UserX className="w-5 h-5" />
                  )}
                  <span>Mute User</span>
                </button>
                
                <button
                  onClick={() => handleMuteToggle(false)}
                  disabled={isMuting || !targetUser.trim()}
                  className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isMuting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <UserCheck className="w-5 h-5" />
                  )}
                  <span>Unmute User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
