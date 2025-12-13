
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Asset, WorkOrder, PendingAction, User, UserRole, SparePart, AssetAssignment, DailyLog } from '../types';
import { MOCK_ASSETS, MOCK_WORK_ORDERS_LIST, MOCK_PARTS_LIST, MOCK_ASSIGNMENTS_DATA, MOCK_DAILY_LOGS_DATA } from './mockData';

interface AppDB extends DBSchema {
  assets: {
    key: string;
    value: Asset;
  };
  workOrders: {
    key: string;
    value: WorkOrder;
  };
  spareParts: {
    key: string;
    value: SparePart;
  };
  assignments: {
    key: string;
    value: AssetAssignment;
    indexes: { 'by-asset': string };
  };
  dailyLogs: {
    key: string;
    value: DailyLog;
    indexes: { 'by-asset': string, 'by-date': string, 'by-assignment': string };
  };
  pendingActions: {
    key: string;
    value: PendingAction;
  };
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string };
  };
}

const DB_NAME = 'mantentpro-db';
const DB_VERSION = 6; 

class StorageService {
  private dbPromise: Promise<IDBPDatabase<AppDB>>;

  constructor() {
    this.dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workOrders')) {
          db.createObjectStore('workOrders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('spareParts')) {
          db.createObjectStore('spareParts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('assignments')) {
          const assignStore = db.createObjectStore('assignments', { keyPath: 'id' });
          assignStore.createIndex('by-asset', 'assetId', { unique: false });
        }
        if (!db.objectStoreNames.contains('dailyLogs')) {
          const logStore = db.createObjectStore('dailyLogs', { keyPath: 'id' });
          logStore.createIndex('by-asset', 'assetId', { unique: false });
          logStore.createIndex('by-date', 'date', { unique: false });
          logStore.createIndex('by-assignment', 'assignmentId', { unique: false });
        }
        if (!db.objectStoreNames.contains('pendingActions')) {
          db.createObjectStore('pendingActions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('by-username', 'username', { unique: true });
        }
      },
    });
  }

  async initData() {
    const db = await this.dbPromise;
    
    const assetCount = await db.count('assets');
    if (assetCount === 0) {
      console.log('Seeding massive initial data...');
      const tx = db.transaction(['assets', 'workOrders', 'spareParts', 'assignments', 'dailyLogs'], 'readwrite');
      
      await Promise.all([
        ...MOCK_ASSETS.map(asset => tx.objectStore('assets').put(asset)),
        ...MOCK_WORK_ORDERS_LIST.map(wo => tx.objectStore('workOrders').put(wo)),
        ...MOCK_PARTS_LIST.map(part => tx.objectStore('spareParts').put(part)),
        ...MOCK_ASSIGNMENTS_DATA.map(assign => tx.objectStore('assignments').put(assign)),
        ...MOCK_DAILY_LOGS_DATA.map(log => tx.objectStore('dailyLogs').put(log))
      ]);
      
      await tx.done;
    }

    const userCount = await db.count('users');
    if (userCount === 0) {
      const adminUser: User = {
        id: 'admin-001',
        username: 'admin',
        password: 'admin',
        fullName: 'Administrador Sistema',
        role: UserRole.ADMIN,
        active: true
      };
      await db.put('users', adminUser);
    }
  }

  // --- Assets ---
  async getAssets(): Promise<Asset[]> {
    return (await this.dbPromise).getAll('assets');
  }

  async saveAsset(asset: Asset): Promise<void> {
    const db = await this.dbPromise;
    await db.put('assets', asset);
  }

  async deleteAsset(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('assets', id);
  }

  // --- Spare Parts ---
  async getSpareParts(): Promise<SparePart[]> {
    return (await this.dbPromise).getAll('spareParts');
  }

  // --- Work Orders ---
  async getWorkOrders(): Promise<WorkOrder[]> {
    return (await this.dbPromise).getAll('workOrders');
  }

  async saveWorkOrder(wo: WorkOrder, isOffline: boolean): Promise<void> {
    const db = await this.dbPromise;
    await db.put('workOrders', wo);

    if (isOffline) {
      const action: PendingAction = {
        id: crypto.randomUUID(),
        type: 'CREATE_OT',
        payload: wo,
        timestamp: Date.now()
      };
      await db.put('pendingActions', action);
    }
  }

  // --- Assignments & Logs (ATOMIC TRANSACTION) ---
  
  async getAssignments(): Promise<AssetAssignment[]> {
    return (await this.dbPromise).getAll('assignments');
  }

  async getDailyLogs(): Promise<DailyLog[]> {
    return (await this.dbPromise).getAll('dailyLogs');
  }

  // NEW: Save everything in one transaction to guarantee data integrity
  async saveAssignmentWithLogs(assignment: AssetAssignment, logs: DailyLog[], assetToUpdate?: Asset): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['assignments', 'dailyLogs', 'assets'], 'readwrite');
    
    // 1. Save the main assignment wrapper
    await tx.objectStore('assignments').put(assignment);

    // 2. Save all daily logs
    for (const log of logs) {
        await tx.objectStore('dailyLogs').put(log);
    }

    // 3. Update asset current pointer if needed
    if (assetToUpdate) {
        await tx.objectStore('assets').put(assetToUpdate);
    }

    await tx.done;
  }

  // --- Offline ---
  async getPendingActions(): Promise<PendingAction[]> {
    return (await this.dbPromise).getAll('pendingActions');
  }

  async clearPendingAction(id: string) {
    return (await this.dbPromise).delete('pendingActions', id);
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    return (await this.dbPromise).getAll('users');
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await this.dbPromise;
    return db.getFromIndex('users', 'by-username', username);
  }

  async saveUser(user: User): Promise<void> {
    const db = await this.dbPromise;
    await db.put('users', user);
  }

  async deleteUser(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('users', id);
  }

  // --- BACKUP & RESTORE ---
  async getFullBackup(): Promise<any> {
    const db = await this.dbPromise;
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      assets: await db.getAll('assets'),
      assignments: await db.getAll('assignments'),
      dailyLogs: await db.getAll('dailyLogs'),
      workOrders: await db.getAll('workOrders'),
      users: await db.getAll('users'),
      spareParts: await db.getAll('spareParts')
    };
  }

  async restoreBackup(data: any): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['assets', 'assignments', 'dailyLogs', 'workOrders', 'users', 'spareParts'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('assets').clear(),
      tx.objectStore('assignments').clear(),
      tx.objectStore('dailyLogs').clear(),
      tx.objectStore('workOrders').clear(),
      tx.objectStore('users').clear(),
      tx.objectStore('spareParts').clear(),
    ]);

    if(data.assets) for(const i of data.assets) await tx.objectStore('assets').put(i);
    if(data.assignments) for(const i of data.assignments) await tx.objectStore('assignments').put(i);
    if(data.dailyLogs) for(const i of data.dailyLogs) await tx.objectStore('dailyLogs').put(i);
    if(data.workOrders) for(const i of data.workOrders) await tx.objectStore('workOrders').put(i);
    if(data.users) for(const i of data.users) await tx.objectStore('users').put(i);
    if(data.spareParts) for(const i of data.spareParts) await tx.objectStore('spareParts').put(i);

    await tx.done;
  }
}

export const storageService = new StorageService();
