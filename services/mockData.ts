

import { Asset, AssetStatus, Mechanic, WorkOrder, WorkOrderPriority, WorkOrderStatus, SparePart, AssetAssignment, DailyLog } from '../types';

// --- 1. ASSETS (Base definitions) ---
export const MOCK_ASSETS: Asset[] = [
  // A. COCHES (2)
  { id: 'veh-001', code: 'TUR-01', name: 'Toyota Corolla Comercial', brand: 'Toyota', model: 'Corolla Hybrid', licensePlate: '4588-LMB', vin: 'JTN1122334455', status: AssetStatus.OPERATIVO, location: 'Tarragona', hours: 45000, type: 'Coche', category: 'VEHICULO', vehicleConfig: 'Coche', vehicleSeats: 2, ownership: 'RENTING', manufactureYear: 2022, acquisitionYear: 2022, nextMaintenance: '2025-09-15', lastMaintenance: '2025-03-10', documents: [], image: 'https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'veh-002', code: 'TUR-02', name: 'Peugeot 208 Técnico', brand: 'Peugeot', model: '208', licensePlate: '1234-KKL', vin: 'VF31122334455', status: AssetStatus.OPERATIVO, location: 'Huelva', hours: 32000, type: 'Coche', category: 'VEHICULO', vehicleConfig: 'Coche', vehicleSeats: 5, ownership: 'RENTING', manufactureYear: 2021, acquisitionYear: 2021, nextMaintenance: '2025-08-01', lastMaintenance: '2025-02-01', documents: [], image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80', isAccessory: false },

  // B. FURGONES (3)
  { id: 'veh-003', code: 'FUR-01', name: 'Furgón Taller Móvil Norte', brand: 'Mercedes-Benz', model: 'Sprinter 319', licensePlate: '9988-JHG', vin: 'WDB906111222', status: AssetStatus.OPERATIVO, location: 'Bilbao', hours: 120000, type: 'Furgón Taller', category: 'VEHICULO', vehicleConfig: 'Furgón 3 Plazas', vehicleSeats: 3, ownership: 'PROPIO', manufactureYear: 2019, acquisitionYear: 2019, nextMaintenance: '2025-07-20', lastMaintenance: '2025-01-20', documents: [], image: 'https://images.unsplash.com/photo-1566008885218-90abf9200ddb?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'veh-004', code: 'FUR-02', name: 'Furgoneta Equipo Limpieza', brand: 'Renault', model: 'Master', licensePlate: '7766-HBB', vin: 'VF1FD112233', status: AssetStatus.OPERATIVO, location: 'Cartagena', hours: 89000, type: 'Furgón Mixto', category: 'VEHICULO', vehicleConfig: 'Furgón 9 Plazas', vehicleSeats: 9, ownership: 'LEASING', manufactureYear: 2018, acquisitionYear: 2018, nextMaintenance: '2025-10-05', lastMaintenance: '2025-04-05', documents: [], image: 'https://images.unsplash.com/photo-1616423664033-63023eb29e02?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'veh-005', code: 'FUR-03', name: 'Furgón Transporte Equipos', brand: 'Iveco', model: 'Daily', licensePlate: '4455-MDM', vin: 'ZCFC112233', status: AssetStatus.EN_TALLER, location: 'Madrid', hours: 210000, type: 'Furgón Carga', category: 'VEHICULO', vehicleConfig: 'Furgón 3 Plazas', vehicleSeats: 3, ownership: 'PROPIO', manufactureYear: 2017, acquisitionYear: 2017, nextMaintenance: '2025-05-10', lastMaintenance: '2024-11-10', documents: [], image: 'https://images.unsplash.com/photo-1605218427306-0331d927d2bc?auto=format&fit=crop&w=400&q=80', isAccessory: false },

  // C. CAMIONES DE VACÍO / MIXTOS (10)
  { id: 'ind-001', code: 'MIX-01', name: 'Camión Mixto ADR Inox', brand: 'MAN', model: 'TGS 26.440', licensePlate: '1122-KLS', status: AssetStatus.OPERATIVO, location: 'Tarragona', hours: 8500, category: 'VEHICULO', type: 'Vehículo Mixto', tankSludgeVolume: 10000, tankWaterVolume: 4000, tankMaterial: 'Inox 316', adr: true, pressurePumpBrand: 'Uraca', pressurePumpModel: 'P3-45', pressureMax: 200, flowMax: 330, vacuumPumpBrand: 'Hibon', vacuumPumpModel: 'SIAV 8702', vacuumType: 'Lóbulos', vacuumFlow: 4500, ownership: 'PROPIO', manufactureYear: 2020, acquisitionYear: 2020, nextMaintenance: '2025-08-15', lastMaintenance: '2025-02-15', documents: [], image: 'https://images.unsplash.com/photo-1596423737522-38379659a291?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'ind-002', code: 'SUC-02', name: 'Succionador Alto Vacío', brand: 'Scania', model: 'R500', licensePlate: '3344-JJS', status: AssetStatus.OPERATIVO, location: 'Huelva', hours: 12400, category: 'VEHICULO', type: 'Camión Cisterna', tankSludgeVolume: 16000, tankWaterVolume: 0, tankMaterial: 'Acero Carbono', adr: true, tipping: true, vacuumPumpBrand: 'Jurop', vacuumPumpModel: 'PVT 1000', vacuumType: 'Paletas', vacuumFlow: 3800, ownership: 'LEASING', manufactureYear: 2018, acquisitionYear: 2018, nextMaintenance: '2025-06-20', lastMaintenance: '2024-12-20', documents: [], image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'ind-003', code: 'MIX-03', name: 'Mixto Urbano Pequeño', brand: 'Iveco', model: 'Eurocargo', licensePlate: '5566-LPP', status: AssetStatus.RESERVADO, location: 'Madrid', hours: 6200, category: 'VEHICULO', type: 'Vehículo Mixto', tankSludgeVolume: 4000, tankWaterVolume: 2000, tankMaterial: 'Acero Carbono', adr: false, pressurePumpBrand: 'Pratissoli', pressurePumpModel: 'MW 40', pressureMax: 150, flowMax: 120, vacuumPumpBrand: 'Jurop', vacuumPumpModel: 'PN 84', vacuumType: 'Paletas', vacuumFlow: 900, ownership: 'PROPIO', manufactureYear: 2021, acquisitionYear: 2021, nextMaintenance: '2025-09-01', lastMaintenance: '2025-03-01', documents: [], image: 'https://images.unsplash.com/photo-1580901368919-79848f322b64?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'ind-004', code: 'MIX-04', name: 'Camión Reciclador', brand: 'Mercedes', model: 'Arocs', licensePlate: '8899-KMN', status: AssetStatus.AVERIADO, location: 'Barcelona', hours: 9800, category: 'VEHICULO', type: 'Vehículo Mixto', tankSludgeVolume: 12000, tankWaterVolume: 6000, tankMaterial: 'Inox 304', adr: true, pressurePumpBrand: 'Uraca', pressurePumpModel: 'KD 716', pressureMax: 250, flowMax: 400, vacuumPumpBrand: 'Wiedemann', vacuumPumpModel: 'KW 4000', vacuumType: 'Anillo Líquido', vacuumFlow: 4000, ownership: 'PROPIO', manufactureYear: 2019, acquisitionYear: 2019, nextMaintenance: '2025-05-30', lastMaintenance: '2024-11-30', documents: [], image: 'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'ind-005', code: 'SUC-05', name: 'Semirremolque Cisterna', brand: 'Parcisa', model: 'Inox 304', licensePlate: 'R-2233-BBBs', status: AssetStatus.OPERATIVO, location: 'Cartagena', hours: 0, category: 'VEHICULO', type: 'Camión Cisterna', tankSludgeVolume: 28000, tankMaterial: 'Inox 316', adr: true, ownership: 'PROPIO', manufactureYear: 2016, acquisitionYear: 2016, nextMaintenance: '2025-07-15', lastMaintenance: '2025-01-15', documents: [], image: 'https://plus.unsplash.com/premium_photo-1661962360398-b6f7902d3339?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'ind-006', code: 'MIX-06', name: 'Impulsor Polivalente', brand: 'Volvo', model: 'FMX', licensePlate: '6677-LZS', status: AssetStatus.OPERATIVO, location: 'Puertollano', hours: 3400, category: 'VEHICULO', type: 'Vehículo Mixto', tankSludgeVolume: 8000, tankWaterVolume: 3000, tankMaterial: 'Inox 304', adr: true, pressurePumpBrand: 'Woma', pressurePumpModel: '1502 P', pressureMax: 1000, flowMax: 100, vacuumPumpBrand: 'Samson', vacuumPumpModel: 'V20', vacuumType: 'Anillo Líquido', vacuumFlow: 2500, ownership: 'RENTING', manufactureYear: 2023, acquisitionYear: 2023, nextMaintenance: '2025-11-01', lastMaintenance: '2025-05-01', documents: [], image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'ind-007', code: 'SUC-07', name: 'Equipo Desatasco Ligero', brand: 'Nissan', model: 'Cabstar', licensePlate: '2211-GHT', status: AssetStatus.OPERATIVO, location: 'Sevilla', hours: 15600, category: 'VEHICULO', type: 'Vehículo Mixto', tankSludgeVolume: 2000, tankWaterVolume: 1000, tankMaterial: 'Aluminio', adr: false, pressurePumpBrand: 'Speck', pressurePumpModel: 'P45', pressureMax: 200, flowMax: 80, ownership: 'PROPIO', manufactureYear: 2015, acquisitionYear: 2015, nextMaintenance: '2025-06-10', lastMaintenance: '2024-12-10', documents: [], image: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'ind-008', code: 'MIX-08', name: 'Camión Lavacontenedores', brand: 'Renault', model: 'D Wide', licensePlate: '9900-JJK', status: AssetStatus.EN_TALLER, location: 'Valencia', hours: 8100, category: 'VEHICULO', type: 'Camión Cisterna', tankWaterVolume: 8000, tankMaterial: 'Acero', adr: false, pressurePumpBrand: 'Pratissoli', pressureMax: 180, flowMax: 150, ownership: 'PROPIO', manufactureYear: 2018, acquisitionYear: 2018, nextMaintenance: '2025-05-20', lastMaintenance: '2024-11-20', documents: [], image: 'https://images.unsplash.com/photo-1610303649662-ff71b6973976?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'ind-009', code: 'MIX-09', name: 'Mixto Gran Capacidad', brand: 'DAF', model: 'CF', licensePlate: '1234-MMN', status: AssetStatus.OPERATIVO, location: 'Coruña', hours: 2100, category: 'VEHICULO', type: 'Vehículo Mixto', tankSludgeVolume: 14000, tankWaterVolume: 5000, tankMaterial: 'Inox 316', adr: true, vacuumPumpBrand: 'Kaiser', vacuumPumpModel: 'KWP 3100', vacuumType: 'Anillo Líquido', vacuumFlow: 3100, ownership: 'RENTING', manufactureYear: 2023, acquisitionYear: 2023, nextMaintenance: '2025-12-01', lastMaintenance: '2025-06-01', documents: [], image: 'https://images.unsplash.com/photo-1574786636787-73d8ebc706e1?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'ind-010', code: 'SUC-10', name: 'Cisterna ADR Químicos', brand: 'Scania', model: 'G450', licensePlate: '5678-LLP', status: AssetStatus.OPERATIVO, location: 'Algeciras', hours: 5400, category: 'VEHICULO', type: 'Camión Cisterna', tankSludgeVolume: 12000, tankMaterial: 'Ebonitado', adr: true, vacuumPumpBrand: 'Hibon', vacuumFlow: 1500, ownership: 'PROPIO', manufactureYear: 2020, acquisitionYear: 2020, nextMaintenance: '2025-08-20', lastMaintenance: '2025-02-20', documents: [], image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', isAccessory: false },

  // D. BOMBAS DE PRESIÓN (5)
  { id: 'maq-001', code: 'BOM-01', name: 'Equipo UHP 2500 Bar', brand: 'Hammelmann', model: 'HDP 172', status: AssetStatus.OPERATIVO, location: 'Tarragona', hours: 4500, category: 'MAQUINARIA', type: 'Bomba de Alta Presión', pressureMax: 2500, flowMax: 26, auxMotorBrand: 'Volvo Penta', auxMotorPower: '200 CV', ownership: 'PROPIO', manufactureYear: 2019, acquisitionYear: 2019, nextMaintenance: '2025-07-01', lastMaintenance: '2025-01-01', documents: [], image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'maq-002', code: 'BOM-02', name: 'Bomba Gran Caudal', brand: 'Woma', model: '1502 P', status: AssetStatus.OPERATIVO, location: 'Huelva', hours: 6200, category: 'MAQUINARIA', type: 'Bomba de Alta Presión', pressureMax: 1000, flowMax: 150, auxMotorBrand: 'Deutz', ownership: 'PROPIO', manufactureYear: 2017, acquisitionYear: 2017, nextMaintenance: '2025-06-15', lastMaintenance: '2024-12-15', documents: [], image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'maq-003', code: 'BOM-03', name: 'Hidrolimpiadora Agua Caliente', brand: 'Kärcher', model: 'HDS 1000', status: AssetStatus.RESERVADO, location: 'Madrid', hours: 1200, category: 'MAQUINARIA', type: 'Hidrolimpiadora', pressureMax: 200, flowMax: 15, ownership: 'PROPIO', manufactureYear: 2022, acquisitionYear: 2022, nextMaintenance: '2025-09-10', lastMaintenance: '2025-03-10', documents: [], image: 'https://images.unsplash.com/photo-1632212932308-417723927694?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'maq-004', code: 'BOM-04', name: 'Equipo HP Autónomo', brand: 'Uraca', model: 'KD 716', status: AssetStatus.AVERIADO, location: 'Cartagena', hours: 9800, category: 'MAQUINARIA', type: 'Bomba de Alta Presión', pressureMax: 800, flowMax: 80, auxMotorBrand: 'Cummins', ownership: 'PROPIO', manufactureYear: 2016, acquisitionYear: 2016, nextMaintenance: '2025-05-01', lastMaintenance: '2024-11-01', documents: [], image: 'https://images.unsplash.com/photo-1563297121-70233b66c434?auto=format&fit=crop&w=400&q=80', isAccessory: false },
  { id: 'maq-005', code: 'BOM-05', name: 'Bomba Pruebas Hidráulicas', brand: 'Kamat', model: 'K 10000', status: AssetStatus.OPERATIVO, location: 'Bilbao', hours: 1500, category: 'MAQUINARIA', type: 'Bomba de Alta Presión', pressureMax: 1500, flowMax: 40, ownership: 'RENTING', manufactureYear: 2021, acquisitionYear: 2021, nextMaintenance: '2025-10-01', lastMaintenance: '2025-04-01', documents: [], image: 'https://images.unsplash.com/photo-1542833077-4634220b3323?auto=format&fit=crop&w=400&q=80', isAccessory: false },

  // E. ACCESORIOS (Simple example list)
  { id: 'acc-001', code: 'TOB-01', name: 'Tobera Warthog', status: AssetStatus.OPERATIVO, location: 'Huelva', hours: 0, category: 'ACCESORIO', type: 'Tobera', isAccessory: true, brand: 'StoneAge', model: 'Warthog', ownership: 'PROPIO', lastMaintenance: '', nextMaintenance: '', documents: [] },
  // ... more accessories can be added, but they don't impact main occupation logic
];

// --- 2. COMPLEX HISTORY GENERATOR (2025) ---

const ASSIGNMENTS: AssetAssignment[] = [];
const DAILY_LOGS: DailyLog[] = [];

// Helper to generate a range of days
const generateLogsForRange = (
  assetId: string, 
  assignmentId: string, 
  startStr: string, 
  endStr: string, 
  baseHours: number, 
  weekendOff: boolean,
  probabilityOfIssues: number // 0 to 1, chance of breakdown/0 hours
) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const today = new Date('2025-12-12'); // Simulation anchor date

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d > today) break; // Don't generate logs for future

    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    
    let hours = baseHours;
    let status: any = 'TRABAJANDO';

    if (weekendOff && isWeekend) {
      hours = 0;
      status = 'PARADO';
    } else {
      // Random variations
      if (Math.random() < probabilityOfIssues) {
        hours = 0;
        status = 'AVERIADO'; // Breakdown day
      } else if (Math.random() < 0.1) {
        hours = Math.floor(hours * 0.5); // Half day
      } else if (Math.random() < 0.05) {
        hours += 2; // Overtime
      }
    }

    DAILY_LOGS.push({
      id: `log-${assetId}-${dateStr}`,
      assetId,
      assignmentId,
      date: dateStr,
      hours,
      status,
      verified: true
    });
  }
};

// --- SCENARIO 1: PARADA TÉCNICA (SHUTDOWN) - 24H Work ---
// Trucks ind-001, ind-002 work continuous 24h shifts in March & Oct
const createShutdown = (assets: string[], start: string, end: string, client: string) => {
  assets.forEach(id => {
    const assignId = `asg-${id}-${start}`;
    ASSIGNMENTS.push({
      id: assignId,
      assetId: id,
      ceco: 'PARADA-2025',
      province: 'Tarragona',
      city: 'La Pobla',
      locationDetails: 'Planta Petroquímica',
      client: client,
      jobDescription: 'Limpieza Industrial Parada',
      offerId: 'OFF-SD-25',
      startDate: start,
      endDate: end,
      // isPermanent: false, // REMOVED
      scheduleType: '24H',
      estimatedTotalHours: 720,
      responsiblePerson: 'Jefe Parada',
      status: new Date(end) < new Date('2025-12-12') ? 'FINALIZADA' : 'ACTIVA',
      createdAt: start
    });
    generateLogsForRange(id, assignId, start, end, 24, false, 0.02); // 24h, no weekend off, low failure rate
  });
};

// --- SCENARIO 2: CONTINUOUS MAINTENANCE CONTRACT ---
// Veh-003, ind-006 work Mon-Fri all year
const createContinuous = (assets: string[], start: string) => {
  assets.forEach(id => {
    const assignId = `asg-${id}-cont`;
    ASSIGNMENTS.push({
      id: assignId,
      assetId: id,
      ceco: 'CONT-25',
      province: 'Madrid',
      city: 'Madrid',
      locationDetails: 'Fabrica Cliente',
      client: 'Nestlé',
      jobDescription: 'Servicio Continuo Residuos',
      offerId: 'CTR-2025',
      startDate: start,
      endDate: '', // Open
      // isPermanent: true, // REMOVED
      scheduleType: '8H',
      estimatedTotalHours: 2000,
      responsiblePerson: 'Gestor Cuenta',
      status: 'ACTIVA',
      createdAt: start
    });
    generateLogsForRange(id, assignId, start, '2025-12-12', 8, true, 0.05); // 8h, weekends off
  });
};

// --- SCENARIO 3: SPORADIC JOBS ---
// ind-007 gets assigned to many small jobs
const createSporadic = (assetId: string) => {
  const jobs = [
    { s: '2025-01-10', e: '2025-01-15', c: 'Repsol', loc: 'Cartagena' },
    { s: '2025-02-01', e: '2025-02-01', c: 'Aguas BCN', loc: 'Barcelona' },
    { s: '2025-03-10', e: '2025-03-20', c: 'Iberdrola', loc: 'Cofrentes' },
    { s: '2025-05-05', e: '2025-06-05', c: 'Cepsa', loc: 'Huelva' }, // 1 month job
    { s: '2025-08-01', e: '2025-08-02', c: 'Desatascos Pepe', loc: 'Sevilla' },
    { s: '2025-11-01', e: '2025-12-12', c: 'Acciona', loc: 'Bilbao' } // Current
  ];

  jobs.forEach((job, idx) => {
    const assignId = `asg-${assetId}-${idx}`;
    const isActive = new Date(job.e) >= new Date('2025-12-12');
    ASSIGNMENTS.push({
      id: assignId,
      assetId: assetId,
      ceco: `SPOT-${idx}`,
      province: 'Varios',
      city: job.loc,
      locationDetails: 'Obra Civil',
      client: job.c,
      jobDescription: 'Servicio Puntual',
      offerId: `OFF-${idx}`,
      startDate: job.s,
      endDate: job.e,
      // isPermanent: false, // REMOVED
      scheduleType: '12H',
      estimatedTotalHours: 100,
      responsiblePerson: 'Tráfico',
      status: isActive ? 'ACTIVA' : 'FINALIZADA',
      createdAt: job.s
    });
    generateLogsForRange(assetId, assignId, job.s, job.e, 10, true, 0.0);
  });
};

// --- SCENARIO 4: MAJOR BREAKDOWN ---
// ind-004 works Jan-Feb, then breaks down until June
const createBreakdownScenario = (assetId: string) => {
  // Good period
  const assignId1 = `asg-${assetId}-good`;
  ASSIGNMENTS.push({
    id: assignId1,
    assetId,
    ceco: 'P1',
    province: 'Zaragoza',
    city: 'Zaragoza',
    locationDetails: 'Papelera',
    client: 'Saica',
    jobDescription: 'Limpieza',
    offerId: 'O1',
    startDate: '2025-01-01',
    endDate: '2025-02-28',
    // isPermanent: false, // REMOVED
    scheduleType: '8H',
    estimatedTotalHours: 300,
    responsiblePerson: 'Taller',
    status: 'FINALIZADA',
    createdAt: '2025-01-01'
  });
  generateLogsForRange(assetId, assignId1, '2025-01-01', '2025-02-28', 8, true, 0);

  // Breakdown period (No assignments, or assignment marked as stopped, usually just no assignment but Asset Status is Averiado)
  // We simulate "In Workshop" simply by lack of productive logs or 0h logs if assigned. 
  // Let's say it was assigned but couldn't work.
  const assignId2 = `asg-${assetId}-bad`;
  ASSIGNMENTS.push({
    id: assignId2,
    assetId,
    ceco: 'P1',
    province: 'Zaragoza',
    city: 'Zaragoza',
    locationDetails: 'Taller Externo',
    client: 'Saica',
    jobDescription: 'En Reparación',
    offerId: 'REPAIR',
    startDate: '2025-03-01',
    endDate: '2025-05-30',
    // isPermanent: false, // REMOVED
    scheduleType: '8H',
    estimatedTotalHours: 0,
    responsiblePerson: 'Jefe Taller',
    status: 'FINALIZADA',
    createdAt: '2025-03-01'
  });
  // Generate 0h logs
  generateLogsForRange(assetId, assignId2, '2025-03-01', '2025-05-30', 0, false, 1.0); // 100% issue rate
};

// --- EXECUTE GENERATION ---
createShutdown(['ind-001', 'ind-002', 'maq-001'], '2025-03-01', '2025-03-31', 'Repsol Parada');
createShutdown(['ind-001', 'ind-002'], '2025-10-01', '2025-10-20', 'Dow Chemical Parada');
createContinuous(['veh-003', 'ind-006', 'veh-001'], '2025-01-01');
createSporadic('ind-007');
createBreakdownScenario('ind-004');

// Fill gaps for other assets with random active jobs starting recently
MOCK_ASSETS.forEach(a => {
  if (!a.isAccessory && !ASSIGNMENTS.find(as => as.assetId === a.id)) {
    // Default recent assignment
    const start = '2025-11-01';
    const assignId = `asg-${a.id}-def`;
    ASSIGNMENTS.push({
      id: assignId,
      assetId: a.id,
      ceco: 'GEN',
      province: 'Base',
      city: a.location,
      locationDetails: 'Base Operativa',
      client: 'Varios',
      jobDescription: 'Servicios Disponibles',
      offerId: 'GEN',
      startDate: start,
      endDate: '',
      // isPermanent: true, // REMOVED
      scheduleType: '8H',
      estimatedTotalHours: 0,
      responsiblePerson: 'Tráfico',
      status: 'ACTIVA',
      createdAt: start
    });
    generateLogsForRange(a.id, assignId, start, '2025-12-12', 8, true, 0.1);
  }
});

export const MOCK_ASSIGNMENTS_DATA = ASSIGNMENTS;
export const MOCK_DAILY_LOGS_DATA = DAILY_LOGS;

// --- EXPORT LISTS ---
export const MOCK_PARTS_LIST: SparePart[] = [
    { id: 'p1', sku: 'FIL-AIR-001', name: 'Filtro Aire Primario', stock: 15, price: 45.50, location: 'A-01' },
    { id: 'p2', sku: 'FIL-OIL-022', name: 'Filtro Aceite Hidráulico', stock: 8, price: 32.00, location: 'A-02' },
];

export const MOCK_WORK_ORDERS_LIST: WorkOrder[] = [
  {
    id: 'OT-2025-999',
    assetId: 'ind-004',
    description: 'Reparación Motor Principal tras avería crítica.',
    priority: WorkOrderPriority.CRITICA,
    status: WorkOrderStatus.TERMINADA,
    type: 'CORRECTIVO',
    origin: 'CONDUCTOR',
    createdAt: '2025-03-05',
    estimatedHours: 40,
    estimatedCost: 5000,
    partsUsed: [],
    laborLogs: []
  }
];