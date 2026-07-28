import React from 'react';
import { useCommunity } from '../contexts/CommunityContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings: React.FC = () => {
  const { community, setCommunity } = useCommunity();
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-card p-6 md:p-8 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <SettingsIcon className="text-cent" /> 
          Configurações (Settings)
        </h2>
        
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-2">Comunidade Principal (Token)</h3>
            <p className="text-sm text-slate-400 mb-4">
              Escolha qual comunidade você deseja explorar por padrão. 
              Isso afeta os feeds, a recompensa exibida e a exibição de tokens.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setCommunity('NEWS')}
                className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all ${
                  community === 'NEWS' 
                    ? 'border-cent bg-cent/10 text-white' 
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                <div className="text-xl font-bold mb-1">NEWS</div>
                <div className="text-xs opacity-70">News Community</div>
              </button>
              
              <button
                onClick={() => setCommunity('VYB')}
                className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all ${
                  community === 'VYB' 
                    ? 'border-blue-500 bg-blue-500/10 text-white' 
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                <div className="text-xl font-bold mb-1">VYB</div>
                <div className="text-xs opacity-70">Verify Your Brain</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
