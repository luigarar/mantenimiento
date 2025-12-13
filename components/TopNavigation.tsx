import React, { useState } from 'react';
import { Bell, Wifi, WifiOff, RefreshCw, Settings, Check, Globe } from 'lucide-react';
import { AppNotification, NetworkStatus, UserRole, UserPreferences, NotificationType, Language } from '../types';
import { t } from '../services/translations';

interface TopNavigationProps {
  networkStatus: NetworkStatus;
  notifications: AppNotification[];
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onClearNotification: (id: string) => void;
  userRole: UserRole;
  currentLang: Language;
  setLang: (l: Language) => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ 
  networkStatus, 
  notifications, 
  preferences,
  onUpdatePreferences,
  onClearNotification,
  userRole,
  currentLang,
  setLang
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Filter notifications by role
  const myNotifications = notifications.filter(n => n.targetRoles.includes(userRole));
  const unreadCount = myNotifications.filter(n => !n.read).length;

  const togglePref = (type: NotificationType) => {
    onUpdatePreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [type]: !preferences.notifications[type]
      }
    });
  };

  const languages: {code: Language, label: string}[] = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
  ];

  return (
    <div className="bg-white h-16 border-b border-gray-200 px-6 flex items-center justify-between shadow-sm z-20">
      {/* Status Indicator */}
      <div className="flex items-center gap-3">
        {networkStatus === NetworkStatus.ONLINE && (
          <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
            <Wifi size={14} className="mr-2" /> Online
          </span>
        )}
        {networkStatus === NetworkStatus.OFFLINE && (
          <span className="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium border border-gray-300">
            <WifiOff size={14} className="mr-2" /> Offline
          </span>
        )}
        {networkStatus === NetworkStatus.SYNCING && (
          <span className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 animate-pulse">
            <RefreshCw size={14} className="mr-2 animate-spin" /> Sync...
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        
        {/* Language Selector */}
        <div className="relative">
          <button 
            onClick={() => { setShowLangMenu(!showLangMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Globe size={18} />
            <span className="text-sm font-medium uppercase">{currentLang}</span>
          </button>
          
          {showLangMenu && (
             <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
               {languages.map(l => (
                 <button
                   key={l.code}
                   onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                   className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex justify-between ${currentLang === l.code ? 'font-bold text-blue-600' : 'text-gray-700'}`}
                 >
                   {l.label}
                   {currentLang === l.code && <Check size={14} />}
                 </button>
               ))}
             </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); setShowLangMenu(false); }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">{t('config', currentLang)}</h3>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-blue-600"
                >
                  <Settings size={16} />
                </button>
              </div>
              
              {showSettings ? (
                <div className="p-4 space-y-3">
                  <p className="text-xs text-gray-500 uppercase font-bold">Alert Preferences</p>
                  {Object.keys(NotificationType).map((type) => (
                     <div key={type} className="flex items-center justify-between">
                       <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ').toLowerCase()}</span>
                       <button 
                         onClick={() => togglePref(type as NotificationType)}
                         className={`w-8 h-4 rounded-full transition-colors ${preferences.notifications[type as NotificationType] ? 'bg-blue-500' : 'bg-gray-300'} relative`}
                       >
                         <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${preferences.notifications[type as NotificationType] ? 'translate-x-4' : ''}`} />
                       </button>
                     </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {myNotifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">No new notifications.</p>
                  ) : (
                    myNotifications.map(n => (
                      <div key={n.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <button onClick={() => onClearNotification(n.id)} className="text-gray-300 hover:text-green-500"><Check size={14} /></button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-2 text-right">{new Date(n.timestamp).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;