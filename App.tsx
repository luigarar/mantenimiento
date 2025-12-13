import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import OccupationView from './components/OccupationView';
import WorkOrders from './components/WorkOrders';
import MechanicView from './components/MechanicView';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import TeamView from './components/TeamView';
import Login from './components/Login';
import { Asset, WorkOrder, UserRole, NetworkStatus, AppNotification, UserPreferences, User, Language } from './types';
import { storageService } from './services/storage';
import { checkSystemAlerts, DEFAULT_PREFERENCES } from './services/notifications';

function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Navigation & Language State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentLang, setCurrentLang] = useState<Language>('es');
  
  // Data State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  
  // System State
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE
  );
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Initialize DB and Network Listeners
  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('mantentpro_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    const initApp = async () => {
      await storageService.initData(); // Ensure admin user & basic data exist
      if (storedUser) {
        await loadData();
      }
    };

    initApp();

    const handleOnline = async () => {
      setNetworkStatus(NetworkStatus.SYNCING);
      // Simulate Sync delay
      setTimeout(async () => {
        const pending = await storageService.getPendingActions();
        if (pending.length > 0) {
          pending.forEach(p => storageService.clearPendingAction(p.id));
          const msg: AppNotification = {
             id: `sync-${Date.now()}`,
             type: 'SYSTEM' as any,
             title: 'Sincronización Completada',
             message: 'Tus datos offline se han subido correctamente.',
             timestamp: new Date().toISOString(),
             read: false,
             targetRoles: [UserRole.MECANICO, UserRole.JEFE_MANTENIMIENTO, UserRole.ADMIN]
          };
          setNotifications(prev => [msg, ...prev]);
        }
        setNetworkStatus(NetworkStatus.ONLINE);
      }, 2000);
    };

    const handleOffline = () => setNetworkStatus(NetworkStatus.OFFLINE);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    const loadedAssets = await storageService.getAssets();
    const loadedWorkOrders = await storageService.getWorkOrders();
    setAssets(loadedAssets);
    setWorkOrders(loadedWorkOrders);
    
    // Initial Alert Check
    const alerts = checkSystemAlerts(loadedAssets, loadedWorkOrders);
    setNotifications(prev => [...prev, ...alerts]);
  }

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('mantentpro_user', JSON.stringify(user));
    loadData();
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mantentpro_user');
    setAssets([]);
    setWorkOrders([]);
  };

  const addWorkOrder = async (newOT: WorkOrder) => {
    // 1. Optimistic UI Update
    setWorkOrders([newOT, ...workOrders]);
    
    // 2. Save to DB
    const isOffline = networkStatus === NetworkStatus.OFFLINE;
    await storageService.saveWorkOrder(newOT, isOffline);

    // 3. Trigger Notification
    const newNotif: AppNotification = {
      id: `new-ot-${newOT.id}`,
      type: 'OT_ASSIGNED' as any,
      title: 'Nueva Orden de Trabajo',
      message: `OT ${newOT.id} creada para ${newOT.assignedMechanics?.length ? newOT.assignedMechanics.length + ' técnicos' : 'Sin asignar'}`,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: [UserRole.MECANICO, UserRole.JEFE_MANTENIMIENTO, UserRole.ADMIN]
    };
    setNotifications(prev => [newNotif, ...prev]);
    loadData(); // Ensure DB sync
  };

  const handleClearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- Auth Guard ---
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (currentUser.role === UserRole.MECANICO) {
      if (currentPage === 'assets') return <AssetList assets={assets} currentLang={currentLang} onRefresh={loadData} />;
      return <MechanicView workOrders={workOrders} assets={assets} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard assets={assets} workOrders={workOrders} />;
      case 'assets':
        return <AssetList assets={assets} currentLang={currentLang} onRefresh={loadData} />;
      case 'occupation':
        return <OccupationView assets={assets} currentLang={currentLang} />;
      case 'workorders':
        return <WorkOrders workOrders={workOrders} assets={assets} addWorkOrder={addWorkOrder} currentLang={currentLang} onRefresh={loadData} />;
      case 'reports':
        return <Reports assets={assets} workOrders={workOrders} />;
      case 'team':
        return <TeamView currentLang={currentLang} />;
      case 'users':
        return currentUser.role === UserRole.ADMIN ? <UserManagement /> : <div className="p-4 text-red-500">Acceso Denegado</div>;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <h3 className="text-xl font-medium">Módulo en construcción</h3>
            <p>Esta sección ({currentPage}) estará disponible en la próxima versión.</p>
          </div>
        );
    }
  };

  return (
    <Layout 
      currentRole={currentUser.role} 
      setRole={() => {}} 
      currentPage={currentPage}
      setPage={setCurrentPage}
      networkStatus={networkStatus}
      notifications={notifications}
      preferences={preferences}
      onUpdatePreferences={setPreferences}
      onClearNotification={handleClearNotification}
      onLogout={handleLogout}
      username={currentUser.username}
      currentLang={currentLang}
      setLang={setCurrentLang}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;