
import React, { useState, useEffect } from 'react';
import { User, Language } from '../types';
import { storageService } from '../services/storage';
import { Lock, User as UserIcon, AlertCircle, Factory } from 'lucide-react';
import { t } from '../services/translations';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  // Default to Spanish for login until authenticated logic
  const currentLang: Language = 'es'; 

  useEffect(() => {
    // Load custom logo from LocalStorage (Simulating permanent storage)
    const savedLogo = localStorage.getItem('app_custom_logo');
    if (savedLogo) setCustomLogo(savedLogo);
  }, []);

  // Admin backdoor to set logo on login screen for Demo purposes
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomLogo(base64);
        localStorage.setItem('app_custom_logo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await storageService.initData();
      const user = await storageService.getUserByUsername(username);

      if (user && user.password === password) {
        if (!user.active) {
          setError(t('userInactive', currentLang));
        } else {
          onLogin(user);
        }
      } else {
        setError(t('loginError', currentLang));
      }
    } catch (err) {
      console.error(err);
      setError('System Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-100/50 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-full h-full bg-indigo-100/50 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-gray-200">
        
        {/* Header with Logo */}
        <div className="bg-white p-8 text-center flex flex-col items-center justify-center relative group border-b border-gray-100">
          
          {/* Hidden input for logo upload (Click title to change) */}
          <input type="file" id="loginLogoUpload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
          
          <div 
             className="w-full flex items-center justify-center mb-6 cursor-pointer transition-transform hover:scale-105"
             onClick={() => document.getElementById('loginLogoUpload')?.click()}
             title="Click to set custom logo"
          >
             {customLogo ? (
               <img 
                 src={customLogo} 
                 alt="Logo" 
                 className="h-28 w-auto object-contain" 
               />
             ) : (
                <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 transform rotate-3">
                  <Factory size={48} className="text-white transform -rotate-3" />
                </div>
             )}
          </div>
          
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gestión de Activos</h1>
          <p className="text-slate-400 font-mono text-xs mt-2 uppercase tracking-widest">v.1.0</p>
        </div>

        <div className="p-8">
          <h2 className="text-lg font-bold text-gray-700 mb-6 text-center uppercase tracking-wide">{t('loginTitle', currentLang)}</h2>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm border border-red-100 animate-pulse">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('username', currentLang)}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm bg-gray-50"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('password', currentLang)}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm bg-gray-50"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95 mt-4"
            >
              {loading ? t('loading', currentLang) : t('loginButton', currentLang)}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">© 2025 Gestión de Activos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
