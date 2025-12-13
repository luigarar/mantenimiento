
// Enums for rigid state management
export enum AssetStatus {
  OPERATIVO = 'OPERATIVO',
  EN_TALLER = 'EN_TALLER',
  AVERIADO = 'AVERIADO',
  RESERVADO = 'RESERVADO',
  BAJA = 'BAJA',
  FUERA_SERVICIO = 'FUERA_SERVICIO'
}

export enum WorkOrderPriority {
  CRITICA = 'CRITICA',
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA'
}

export enum WorkOrderStatus {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN_PROGRESO',
  ESPERA_REPUESTO = 'ESPERA_REPUESTO',
  TERMINADA = 'TERMINADA',
  CERRADA = 'CERRADA'
}

export type WorkOrderType = 'CORRECTIVO' | 'PREVENTIVO' | 'LEGAL' | 'MEJORA' | 'INSPECCION';
export type WorkOrderOrigin = 'CONDUCTOR' | 'CHECKLIST' | 'OPERACIONES' | 'PLANIFICACION' | 'TELEMETRIA';

export enum UserRole {
  ADMIN = 'ADMIN', 
  JEFE_MANTENIMIENTO = 'JEFE_MANTENIMIENTO',
  MECANICO = 'MECANICO',
  DIRECCION = 'DIRECCION'
}

export type Language = 'es' | 'en' | 'fr' | 'de';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  active: boolean;
}

// Notification Types
export enum NotificationType {
  CRITICAL_FAULT = 'CRITICAL_FAULT',
  ITV_EXPIRATION = 'ITV_EXPIRATION',
  LOW_STOCK = 'LOW_STOCK',
  OT_ASSIGNED = 'OT_ASSIGNED',
  SYSTEM = 'SYSTEM'
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRoles: UserRole[];
}

export interface UserPreferences {
  notifications: {
    [key in NotificationType]: boolean;
  };
  pushEnabled: boolean;
}

// Offline / Sync
export enum NetworkStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  SYNCING = 'SYNCING'
}

export interface PendingAction {
  id: string;
  type: 'CREATE_OT' | 'UPDATE_OT' | 'UPDATE_ASSET';
  payload: any;
  timestamp: number;
}

// --- ASSET DOMAIN ---

export type AssetOwnership = 'PROPIO' | 'RENTING' | 'LEASING' | 'ALQUILADO';

// Updated Categories based on user request
export type AssetDocCategory = 
  | 'SEGURO' 
  | 'ITV' 
  | 'FICHA_TECNICA' 
  | 'PERMISO_CIRCULACION' 
  | 'CERTIFICADO_ATP' // Transporte perecedero si aplica, o ADR
  | 'MANUAL_MANTENIMIENTO'
  | 'MARCADO_CE'
  | 'CHECKLIST_REVISION'
  | 'PRUEBA_PRESION'
  | 'PRUEBA_VACIO'
  | 'REVISION_VISUAL'
  | 'FOTO' 
  | 'OTRO';

export interface AssetDocument {
  id: string;
  name: string;
  type: 'PDF' | 'IMAGE';
  category: AssetDocCategory;
  url: string;
  uploadDate: string;
  effectiveDate?: string;
  expirationDate?: string;
  noExpiry?: boolean;
}

// --- NEW DAILY TRACKING ---
export interface DailyLog {
  id: string;
  assetId: string;
  assignmentId: string; // Links to the parent contract/project
  date: string; // YYYY-MM-DD
  hours: number; // Real hours worked that day
  startTime?: string; // HH:mm (Specific start for this day)
  endTime?: string;   // HH:mm (Specific end for this day)
  // Added RESERVADO per request for future dates
  status: 'TRABAJANDO' | 'PARADO' | 'TALLER' | 'AVERIADO' | 'RESERVADO'; 
  verified: boolean; // For the daily alarm check
  notes?: string;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  ceco: string; 
  province: string;
  city: string;
  locationDetails: string;
  client: string;
  jobDescription: string;
  offerId: string;
  startDate: string;
  endDate: string; 
  
  scheduleType: '8H' | '12H' | '24H' | 'CUSTOM';
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  customHours?: number; // Calculated or override
  
  // Accumulated totals are now derived from DailyLogs, but we keep estimates here
  estimatedTotalHours: number; 
  
  responsiblePerson: string;
  status: 'ACTIVA' | 'FINALIZADA'; // Simplified status for the assignment wrapper
  createdAt: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  
  // Standard Vehicle Fields
  licensePlate?: string; 
  vin?: string; 
  
  // Accessory Specific Fields
  isAccessory?: boolean; 
  reference?: string; 
  manufacturer?: string; 
  vendor?: string; 
  pressure?: number; 
  
  brand: string;
  model: string;
  type: string; 
  category?: string; 
  
  manufactureYear?: number;
  acquisitionYear?: number;
  
  status: AssetStatus;
  location: string; 
  currentAssignmentId?: string; // Active Assignment ID

  hours: number;
  ownership: AssetOwnership;
  responsible?: string;
  lastMaintenance: string;
  nextMaintenance: string;
  image?: string;
  documents: AssetDocument[];
  parentId?: string; 

  // --- NEW FIELDS FOR DETAILED VEHICLE MANAGEMENT ---
  vehicleSeats?: number;
  vehicleConfig?: string;

  // Industrial Specs
  pressurePumpBrand?: string;
  pressurePumpModel?: string;
  pressureMax?: number; 
  flowMax?: number; 
  pneumaticRegulator?: boolean;

  vacuumPumpBrand?: string;
  vacuumPumpModel?: string;
  vacuumType?: string; 
  vacuumFlow?: number; 
  vacuumPower?: string; 
  vacuumGenerated?: number; 

  tare?: number; 
  pma?: number; 
  payload?: number; 
  equipmentType?: string; 

  tankSludgeVolume?: number; 
  tankWaterVolume?: number; 
  tankMaterial?: string; 
  tankMaxFill?: number; 

  tipping?: boolean; 
  maxInclination?: number; 
  adr?: boolean;
  auxMotorBrand?: string;
  auxMotorModel?: string;
  auxMotorPower?: string;

  allowedOperations?: string[]; 
}

// --- WORK ORDER DOMAIN EXPANDED ---

export interface SparePart {
  id: string;
  sku: string;
  name: string;
  stock: number;
  price: number;
  location: string;
}

export interface PartUsage {
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LaborLog {
  mechanicId: string;
  mechanicName: string;
  hours: number;
  date: string;
}

export interface WorkOrder {
  id: string;
  type: WorkOrderType;
  origin: WorkOrderOrigin;
  assetId: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedManager?: string; 
  createdAt: string; 
  
  assignedMechanics?: string[]; 
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  estimatedHours: number;
  estimatedCost: number;

  laborLogs?: LaborLog[];
  partsUsed?: PartUsage[];
  photosBefore?: string[]; 
  photosAfter?: string[]; 
  observations?: string;

  closedAt?: string;
  finalAssetStatus?: AssetStatus;
  totalCostLabor?: number;
  totalCostParts?: number;
  totalCostExternal?: number; 
  signature?: {
    signedBy: string;
    timestamp: string;
    digitalSign: string; 
  };
}

export interface Mechanic {
  id: string;
  name: string;
  specialty: string;
  status: 'DISPONIBLE' | 'OCUPADO' | 'FUERA_TURNO';
}

export interface KpiData {
  name: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
}
