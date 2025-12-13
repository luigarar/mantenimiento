
import React, { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, Truck, Wrench, Users, Settings, LogOut, FileText, UserCog, Map, BarChart3, Factory } from 'lucide-react';
import { UserRole, NetworkStatus, AppNotification, UserPreferences, Language } from '../types';
import TopNavigation from './TopNavigation';
import { t } from '../services/translations';

interface LayoutProps {
  children: React.ReactNode;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  currentPage: string;
  setPage: (page: string) => void;
  networkStatus: NetworkStatus;
  notifications: AppNotification[];
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onClearNotification: (id: string) => void;
  onLogout: () => void;
  username: string;
  currentLang: Language;
  setLang: (l: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentRole, 
  setRole, 
  currentPage, 
  setPage,
  networkStatus,
  notifications,
  preferences,
  onUpdatePreferences,
  onClearNotification,
  onLogout,
  username,
  currentLang,
  setLang
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('app_custom_logo');
    if (savedLogo) setCustomLogo(savedLogo);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRole !== UserRole.ADMIN) return;
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

  const menuItems = [
    { id: 'dashboard', label: t('dashboard', currentLang), icon: LayoutDashboard, roles: [UserRole.JEFE_MANTENIMIENTO, UserRole.DIRECCION, UserRole.ADMIN] },
    { id: 'assets', label: 'Maestro de Activos', icon: Truck, roles: [UserRole.JEFE_MANTENIMIENTO, UserRole.MECANICO, UserRole.DIRECCION, UserRole.ADMIN] },
    { id: 'occupation', label: 'Estado y Ocupación', icon: Map, roles: [UserRole.JEFE_MANTENIMIENTO, UserRole.DIRECCION, UserRole.ADMIN] },
    { id: 'workorders', label: t('workOrders', currentLang), icon: Wrench, roles: [UserRole.JEFE_MANTENIMIENTO, UserRole.MECANICO, UserRole.ADMIN] },
    { id: 'reports', label: t('reports', currentLang), icon: FileText, roles: [UserRole.JEFE_MANTENIMIENTO, UserRole.DIRECCION, UserRole.ADMIN] },
    { id: 'team', label: t('team', currentLang), icon: Users, roles: [UserRole.JEFE_MANTENIMIENTO, UserRole.ADMIN] },
    { id: 'users', label: t('users', currentLang), icon: UserCog, roles: [UserRole.ADMIN] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden print:bg-white">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - UPDATED COLORS (Lighter Neutral) */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white text-slate-700 transform transition-transform duration-300 ease-in-out border-r border-gray-200
        lg:translate-x-0 lg:static lg:inset-0 shadow-lg flex flex-col print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area */}
        <div className="py-8 px-6 bg-white flex flex-col items-center justify-center border-b border-gray-100 relative group gap-3">
          
          <div 
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => currentRole === UserRole.ADMIN && document.getElementById('logoInput')?.click()}
          >
            {customLogo ? (
              <img 
                src={customLogo} 
                alt="Logo" 
                className="h-24 w-auto object-contain"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Factory size={40} className="text-white" />
              </div>
            )}
          </div>
          
          <div className="text-center mt-2">
             <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Gestión de Activos</h1>
             <p className="text-xs font-mono font-medium text-slate-400 mt-0.5">v.1.0</p>
          </div>
          
          {/* Admin Tooltip for Logo Upload */}
          {currentRole === UserRole.ADMIN && (
            <>
              <input 
                type="file" 
                id="logoInput" 
                className="hidden" 
                accept="image/*" 
                onChange={handleLogoUpload} 
              />
            </>
          )}

          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 absolute right-4 top-4">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-gray-100">
             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
               {username.charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-bold text-slate-800 truncate">{username}</p>
               <p className="text-xs text-slate-500 truncate capitalize">{currentRole.replace('_', ' ').toLowerCase()}</p>
             </div>
          </div>
        </div>

        <nav className="mt-4 px-3 space-y-1 flex-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentPage === item.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${currentPage === item.id ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onLogout} className="w-full flex items-center text-sm text-slate-600 hover:text-red-600 cursor-pointer p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all font-medium">
            <LogOut className="mr-3 h-5 w-5" />
            {t('logout', currentLang)}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Toggle + Desktop TopNav */}
        <div className="flex flex-col print:hidden">
          <header className="flex lg:hidden items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 focus:outline-none">
              <Menu size={24} />
            </button>
            <span className="font-semibold text-gray-800 truncate max-w-[200px]">
              {menuItems.find(i => i.id === currentPage)?.label || 'App'}
            </span>
            <div className="w-6"></div> {/* Spacer */}
          </header>
          
          <TopNavigation 
            networkStatus={networkStatus}
            notifications={notifications}
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
            onClearNotification={onClearNotification}
            userRole={currentRole}
            currentLang={currentLang}
            setLang={setLang}
          />
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 lg:p-8 print:p-0 print:bg-white print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
