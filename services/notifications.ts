import { AppNotification, NotificationType, UserRole, UserPreferences, Asset, WorkOrder } from '../types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    [NotificationType.CRITICAL_FAULT]: true,
    [NotificationType.ITV_EXPIRATION]: true,
    [NotificationType.LOW_STOCK]: true,
    [NotificationType.OT_ASSIGNED]: true,
    [NotificationType.SYSTEM]: true,
  },
  pushEnabled: false
};

// Simulate checking for critical conditions
export const checkSystemAlerts = (assets: Asset[], workOrders: WorkOrder[]): AppNotification[] => {
  const alerts: AppNotification[] = [];

  // Check Expiring Maintenance
  assets.forEach(asset => {
    if (new Date(asset.nextMaintenance) < new Date()) {
      alerts.push({
        id: `alert-maint-${asset.id}`,
        type: NotificationType.ITV_EXPIRATION,
        title: 'Mantenimiento Vencido',
        message: `El activo ${asset.code} tiene el mantenimiento vencido (${asset.nextMaintenance}).`,
        timestamp: new Date().toISOString(),
        read: false,
        targetRoles: [UserRole.JEFE_MANTENIMIENTO, UserRole.DIRECCION]
      });
    }
  });

  // Check Critical OTs
  const criticalCount = workOrders.filter(wo => wo.priority === 'CRITICA' && wo.status !== 'CERRADA').length;
  if (criticalCount > 0) {
    alerts.push({
      id: `alert-critical-${Date.now()}`,
      type: NotificationType.CRITICAL_FAULT,
      title: 'Averías Críticas Activas',
      message: `Hay ${criticalCount} órdenes de trabajo críticas pendientes de resolución.`,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: [UserRole.JEFE_MANTENIMIENTO, UserRole.DIRECCION, UserRole.MECANICO]
    });
  }

  return alerts;
};

// Simulate Requesting Permission (Simulates FCM Token logic)
export const requestNotificationPermission = async (): Promise<boolean> => {
  // In a real app: const permission = await Notification.requestPermission();
  // const token = await getToken(messaging, { vapidKey: '...' });
  console.log("Simulando solicitud de permisos FCM...");
  return new Promise(resolve => setTimeout(() => resolve(true), 800));
};
