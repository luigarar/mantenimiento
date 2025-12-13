
import React, { useState, useEffect, useRef } from 'react';
import { Asset, AssetStatus, Language, AssetAssignment, DailyLog } from '../types';
import { Map as MapIcon, List, Calendar as CalendarIcon, Printer, Plus, Save, X, MapPin, Briefcase, User, Clock, CheckCircle, BarChart3, Edit, TrendingUp, Filter, AlertTriangle, ArrowRight, ArrowLeft, History, Database, Check, Upload, Download, FileText } from 'lucide-react';
import { storageService } from '../services/storage';
import { SPANISH_LOCATIONS, Province, getProvinceCoordinates } from '../services/spanishLocations';
import { t } from '../services/translations';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface OccupationViewProps {
  assets: Asset[];
  currentLang: Language;
}

// Leaflet Typings Hack for No-Build Env
declare global {
  const L: any;
}

type DateRangeOption = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

// --- DATE HELPER TO AVOID TIMEZONE ISSUES ---
const getDatesInRange = (startStr: string, endStr: string) => {
    const dates: string[] = [];
    if (!startStr) return dates;
    
    // Parse manually YYYY-MM-DD
    const [sY, sM, sD] = startStr.split('-').map(Number);
    // If no end date, assume single day
    const [eY, eM, eD] = endStr ? endStr.split('-').map(Number) : [sY, sM, sD];
    
    // Create dates at NOON to avoid DST/Timezone midnight shifts
    const current = new Date(sY, sM - 1, sD, 12, 0, 0); 
    const end = new Date(eY, eM - 1, eD, 12, 0, 0);

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

// Get local YYYY-MM-DD safely
const getLocalTodayStr = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

const OccupationView: React.FC<OccupationViewProps> = ({ assets, currentLang }) => {
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'ASSIGNMENTS' | 'MAP' | 'DASHBOARD' | 'DATA'>('CALENDAR');
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  
  // Alerts
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0);

  // Modals & Selection
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false); // New vs Continue
  const [showDayDetailModal, setShowDayDetailModal] = useState(false); // Day detail list
  const [showHistoryModal, setShowHistoryModal] = useState(false); // Full history asset
  const [isSaving, setIsSaving] = useState(false);
  
  // States for Editing/Saving
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<AssetAssignment | null>(null);
  const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalTodayStr());
  
  // Map State
  const [mapDate, setMapDate] = useState<string>(getLocalTodayStr());

  // Calendar State
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // Stats State
  const [statsRange, setStatsRange] = useState<DateRangeOption>('YEAR');
  const [customStart, setCustomStart] = useState('2025-01-01');
  const [customEnd, setCustomEnd] = useState(getLocalTodayStr());

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Form State (Assignment) - Removed isPermanent
  const initialForm: Partial<AssetAssignment> = {
    id: '', assetId: '', ceco: '', province: '', city: '', locationDetails: '',
    client: '', jobDescription: '', offerId: '', startDate: '', endDate: '',
    scheduleType: '8H', startTime: '08:00', endTime: '16:00', customHours: 8, responsiblePerson: '', status: 'ACTIVA'
  };
  const [formData, setFormData] = useState<Partial<AssetAssignment>>(initialForm);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [calculatedDuration, setCalculatedDuration] = useState(0);

  useEffect(() => {
    loadData();
  }, [assets]);

  // Real-time duration calc for Form
  useEffect(() => {
      const h = calculateTimeDiff(formData.startTime || '08:00', formData.endTime || '16:00');
      setCalculatedDuration(h);
  }, [formData.startTime, formData.endTime]);

  const loadData = async () => {
    const assignList = await storageService.getAssignments();
    const logList = await storageService.getDailyLogs();
    
    setAssignments(assignList.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    setDailyLogs(logList);

    // Check Daily Verification
    const today = getLocalTodayStr();
    const workingAssets = assets.filter(a => !a.isAccessory);
    const logsToday = logList.filter(l => l.date === today);
    setPendingVerificationCount(workingAssets.length - logsToday.length);
  };

  // --- MAP ---
  useEffect(() => {
    if (activeTab === 'MAP' && mapRef.current) {
        if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

        const map = L.map(mapRef.current).setView([40.4168, -3.7038], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

        assets.filter(a => !a.isAccessory).forEach((asset) => {
            let lat = 40.4168; let lng = -3.7038;
            
            const logForDate = dailyLogs.find(l => l.assetId === asset.id && l.date === mapDate);
            const assignForDate = assignments.find(a => a.id === logForDate?.assignmentId) || assignments.find(a => a.assetId === asset.id && a.status === 'ACTIVA');

            const locName = assignForDate ? assignForDate.province : asset.location;
            const coords = getProvinceCoordinates(locName?.split(' ')[0] || '');
            
            if (coords) {
                lat = coords.lat + (Math.random() - 0.5) * 0.05;
                lng = coords.lng + (Math.random() - 0.5) * 0.05;
            }

            let color = 'gray'; 
            if (logForDate) {
                if (logForDate.status === 'TRABAJANDO') color = '#22c55e';
                else if (logForDate.status === 'AVERIADO') color = '#ef4444';
                else if (logForDate.status === 'TALLER') color = '#f59e0b';
                else if (logForDate.status === 'RESERVADO') color = '#3b82f6';
            } else if (asset.status === AssetStatus.AVERIADO) {
                color = '#ef4444';
            }

            const flagIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [14, 14], iconAnchor: [7, 7]
            });

            L.marker([lat, lng], { icon: flagIcon }).addTo(map).bindPopup(`
                <div style="font-family: sans-serif;">
                    <strong style="font-size:14px">${asset.code}</strong><br/>
                    ${asset.name}<br/>
                    <span style="color:${color}; font-weight:bold">${logForDate?.status || 'SIN ACTIVIDAD'}</span><br/>
                    ${assignForDate ? `Cliente: ${assignForDate.client}` : 'Sin Asignar'}
                </div>
            `);
        });
        mapInstance.current = map;
    }
  }, [activeTab, assets, assignments, dailyLogs, mapDate]);

  // --- STATS ---
  const calculateOccupationStats = (assetId: string | 'ALL') => {
      let startRange: number, endRange: number;
      if (statsRange === 'CUSTOM') {
          startRange = new Date(customStart).getTime();
          endRange = new Date(customEnd).getTime();
      } else {
          const end = new Date(); 
          const start = new Date();
          if (statsRange === 'WEEK') start.setDate(end.getDate() - 7);
          if (statsRange === 'MONTH') start.setMonth(end.getMonth() - 1);
          if (statsRange === 'YEAR') { start.setMonth(0); start.setDate(1); }
          startRange = start.getTime();
          endRange = end.getTime();
      }

      const logsInRange = dailyLogs.filter(l => {
          const d = new Date(l.date).getTime();
          if (assetId !== 'ALL' && l.assetId !== assetId) return false;
          if (assetId === 'ALL') {
              const asset = assets.find(a => a.id === l.assetId);
              if (asset?.isAccessory) return false;
          }
          return d >= startRange && d <= endRange;
      });

      const totalRealHours = logsInRange.reduce((sum, log) => sum + log.hours, 0);
      let theoreticalHours = 0;
      let assetCount = assetId === 'ALL' ? assets.filter(a => !a.isAccessory).length : 1;
      
      let cursor = new Date(startRange);
      const endD = new Date(endRange);
      while (cursor <= endD) {
          const day = cursor.getDay();
          if (day !== 0 && day !== 6) { theoreticalHours += (8 * assetCount); }
          cursor.setDate(cursor.getDate() + 1);
      }

      const percent = theoreticalHours > 0 ? (totalRealHours / theoreticalHours) * 100 : 0;

      return { real: totalRealHours, theoretical: theoreticalHours, percent: percent.toFixed(1) };
  };

  const getOccupationColor = (percent: number) => {
      if (percent < 50) return '#ef4444'; 
      if (percent >= 50 && percent <= 70) return '#f97316'; 
      return '#22c55e'; 
  };

  const calculateTimeDiff = (start: string, end: string) => {
      if (!start || !end) return 8;
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      let diff = (h2 + m2/60) - (h1 + m1/60);
      if (diff < 0) diff += 24; 
      return parseFloat(diff.toFixed(2));
  };

  // --- HANDLERS ---

  const handleAssetClick = (asset: Asset) => {
      setSelectedAsset(asset);
      const today = getLocalTodayStr();
      // Find current or most recent assignment for this asset
      const activeAssign = assignments.find(a => a.assetId === asset.id && a.startDate <= today && (!a.endDate || a.endDate >= today));
      
      setEditingAssignment(activeAssign || null);
      
      if (activeAssign) {
          // Pre-fill form if continuing
          setFormData({...activeAssign});
      } else {
          // Clean form if new
          setFormData({ ...initialForm, assetId: asset.id, startDate: today });
      }
      
      setShowActionModal(true);
  };

  const handleEditSpecificAssignment = (assignment: AssetAssignment) => {
      const asset = assets.find(a => a.id === assignment.assetId);
      if (!asset) return;
      setSelectedAsset(asset);
      setEditingAssignment(assignment);
      setFormData({ ...assignment });
      const prov = SPANISH_LOCATIONS.find(p => p.name === assignment.province);
      setSelectedProvince(prov || null);
      setShowAssignModal(true);
  };

  const handleEditDailyFromCalendar = (asset: Asset, log?: DailyLog, parentAssign?: AssetAssignment) => {
      setSelectedAsset(asset);
      setEditingAssignment(null); // Treat as new override
      
      setFormData({
          ...initialForm,
          ...(parentAssign || {}),
          id: '', // Crucial: New ID for the override assignment
          assetId: asset.id,
          startDate: selectedDate,
          endDate: selectedDate,
          startTime: log?.startTime || parentAssign?.startTime || '08:00',
          endTime: log?.endTime || parentAssign?.endTime || '16:00',
          status: (log?.status === 'TRABAJANDO' || log?.status === 'RESERVADO') ? 'ACTIVA' : 'FINALIZADA'
      });

      setShowAssignModal(true);
  };

  const handleActionChoice = (choice: 'CONTINUE' | 'NEW') => {
      setShowActionModal(false);
      if (choice === 'CONTINUE' && editingAssignment) {
          handleEditSpecificAssignment(editingAssignment);
      } else {
          setEditingAssignment(null); 
          setFormData({ ...initialForm, assetId: selectedAsset?.id, startDate: getLocalTodayStr() });
          setShowAssignModal(true);
      }
  };

  // --- ROBUST SAVE LOGIC (ATOMIC + RE-FETCH) ---
  const handleSaveAssignment = async () => {
    setIsSaving(true);
    
    // VALIDATION
    if (!formData.assetId) {
        alert("Error: Debe seleccionar un Activo.");
        setIsSaving(false);
        return;
    }
    if (!formData.startDate) {
        alert("Error: Debe seleccionar una Fecha de Inicio.");
        setIsSaving(false);
        return;
    }

    try {
        // 1. Generate ID (New or Keep Existing)
        const finalId = editingAssignment ? editingAssignment.id : crypto.randomUUID();

        // 2. Generate list of dates involved
        const effectiveEndDate = formData.endDate || formData.startDate;
        const dateList = getDatesInRange(formData.startDate, effectiveEndDate);

        if (dateList.length === 0) {
            alert("Error: El rango de fechas no es válido.");
            setIsSaving(false);
            return;
        }

        const rangeMsg = dateList.length > 1 
            ? `desde ${formData.startDate} hasta ${effectiveEndDate} (${dateList.length} días)` 
            : `el día ${formData.startDate}`;

        if (!window.confirm(`Se guardará la asignación ${rangeMsg}. ¿Continuar?`)) {
            setIsSaving(false);
            return;
        }

        // 3. Create/Update Assignment Wrapper
        const hours = calculateTimeDiff(formData.startTime || '08:00', formData.endTime || '16:00');

        const assignmentToSave: AssetAssignment = {
          id: finalId,
          assetId: formData.assetId,
          ceco: formData.ceco || '',
          province: formData.province || '',
          city: formData.city || '',
          locationDetails: formData.locationDetails || '',
          client: formData.client || 'Sin Cliente',
          jobDescription: formData.jobDescription || '',
          offerId: formData.offerId || '',
          startDate: formData.startDate,
          endDate: effectiveEndDate,
          scheduleType: formData.scheduleType || 'CUSTOM',
          startTime: formData.startTime || '08:00',
          endTime: formData.endTime || '16:00',
          customHours: hours, 
          estimatedTotalHours: hours * dateList.length, 
          responsiblePerson: formData.responsiblePerson || '',
          status: formData.status as 'ACTIVA' | 'FINALIZADA',
          createdAt: new Date().toISOString(),
        };
        
        // 4. GENERATE DAILY LOGS
        const todayStr = getLocalTodayStr();
        const logsToSave: DailyLog[] = [];
        
        for (const dateStr of dateList) {
            let dayStatus: 'TRABAJANDO' | 'PARADO' | 'TALLER' | 'AVERIADO' | 'RESERVADO';
            
            // STRICT RULE: If date is in future, it MUST be RESERVADO
            if (dateStr > todayStr) {
                dayStatus = 'RESERVADO'; 
            } else {
                // If today or past, use the selected status (default to TRABAJANDO if ACTIVA)
                dayStatus = formData.status === 'ACTIVA' ? 'TRABAJANDO' : 'PARADO';
            }

            // Find existing log in local state to preserve ID if overlapping, or make new
            const existingLog = dailyLogs.find(l => l.assetId === assignmentToSave.assetId && l.date === dateStr);
            
            logsToSave.push({
                id: existingLog ? existingLog.id : crypto.randomUUID(),
                assetId: assignmentToSave.assetId,
                assignmentId: assignmentToSave.id,
                date: dateStr,
                startTime: assignmentToSave.startTime,
                endTime: assignmentToSave.endTime,
                hours: hours,
                status: dayStatus,
                verified: true, // Auto-verify creation
                notes: `Cliente: ${assignmentToSave.client} | Trabajo: ${assignmentToSave.jobDescription}`
            });
        }

        // 5. ATOMIC SAVE & UPDATE ASSET
        const asset = assets.find(a => a.id === formData.assetId);
        let assetToUpdate: Asset | undefined;
        
        if (asset && assignmentToSave.status === 'ACTIVA' && dateList.includes(todayStr)) {
             assetToUpdate = { ...asset, currentAssignmentId: assignmentToSave.id };
        }

        // --- ATOMIC TRANSACTION ---
        await storageService.saveAssignmentWithLogs(assignmentToSave, logsToSave, assetToUpdate);

        // 6. RELOAD DATA FROM DB TO ENSURE SYNC (Fixes "Not saving" issues by refreshing state from source)
        await loadData();

        setShowAssignModal(false);
        setIsSaving(false);
        alert("Guardado correctamente.");

    } catch (error) {
        console.error("Error saving assignment:", error);
        alert("Ocurrió un error al guardar en base de datos. Intente de nuevo.");
        setIsSaving(false);
    }
  };

  const openHistory = (asset: Asset) => {
      setHistoryAsset(asset);
      setShowHistoryModal(true);
  };

  // --- HELPERS ---
  const handleBackup = async () => {
      const data = await storageService.getFullBackup();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MANTENTPRO_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!confirm("ADVERTENCIA: Esto borrará TODA la base de datos actual. ¿Continuar?")) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
              const data = JSON.parse(evt.target?.result as string);
              await storageService.restoreBackup(data);
              window.location.reload();
          } catch (err) { console.error(err); }
      };
      reader.readAsText(file);
  };

  const exportTableToCSV = (tableName: string, data: any[]) => {
      if (!data.length) return;
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(obj => Object.values(obj).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_EXPORT.csv`;
      a.click();
  };

  const handleCalendarDayClick = (year: number, month: number, day: number) => {
      const mStr = (month + 1).toString().padStart(2, '0');
      const dStr = day.toString().padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      setSelectedDate(dateStr);
      setShowDayDetailModal(true);
  };

  // --- CALENDAR RENDERER ---
  const renderCalendar = () => {
      const year = calendarViewDate.getFullYear();
      const month = calendarViewDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; 
      const days = [];
      for (let i = 0; i < startDayOfWeek; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(i);

      return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setCalendarViewDate(new Date(year, month - 1))} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
                      <h3 className="text-xl font-bold text-gray-800 capitalize">{calendarViewDate.toLocaleString('es', { month: 'long', year: 'numeric' })}</h3>
                      <button onClick={() => setCalendarViewDate(new Date(year, month + 1))} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight /></button>
                  </div>
                  <div className="flex gap-2 text-xs font-bold">
                      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{background: '#22c55e'}}></span> &gt;70%</div>
                      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{background: '#f97316'}}></span> 50-70%</div>
                      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{background: '#ef4444'}}></span> &lt;50%</div>
                      <div className="flex items-center gap-1 ml-2"><span className="w-3 h-3 rounded-full" style={{background: '#3b82f6'}}></span> Futuro</div>
                  </div>
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 flex-1">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (<div key={d} className="bg-gray-50 p-2 text-center font-bold text-gray-500 text-sm">{d}</div>))}
                  {days.map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} className="bg-white"></div>;
                      
                      const mStr = (month + 1).toString().padStart(2, '0');
                      const dStr = day.toString().padStart(2, '0');
                      const dateStr = `${year}-${mStr}-${dStr}`;

                      const logsForDay = dailyLogs.filter(l => l.date === dateStr);
                      const activeAssetsCount = new Set(logsForDay.map(l => l.assetId)).size;
                      const totalHours = logsForDay.reduce((acc, l) => acc + l.hours, 0);
                      
                      // Check for future
                      const isFuture = dateStr > getLocalTodayStr();
                      
                      let bg = 'bg-white';
                      let borderColor = 'transparent';
                      
                      if (activeAssetsCount > 0) {
                          if (isFuture) {
                              borderColor = '#3b82f6'; // Blue for future reserved ALWAYS
                              bg = 'bg-blue-50';
                          } else {
                              const avg = totalHours / activeAssetsCount;
                              const percent = (avg / 8) * 100;
                              borderColor = getOccupationColor(percent);
                              bg = 'bg-gray-50';
                          }
                      }

                      return (
                          <div key={dateStr} className={`${bg} p-2 min-h-[80px] cursor-pointer hover:bg-gray-100 transition-colors flex flex-col justify-between`} 
                               style={{ borderBottom: `4px solid ${borderColor}` }}
                               onClick={() => handleCalendarDayClick(year, month, day)}>
                              <span className={`text-sm font-bold ${activeAssetsCount > 0 ? 'text-gray-800' : 'text-gray-400'}`}>{day}</span>
                              {activeAssetsCount > 0 && <div className="text-xs text-right"><div className="font-bold text-slate-700">{activeAssetsCount} Eq.</div><div className="text-gray-500">{isFuture ? 'RESERVADO' : `${totalHours}h`}</div></div>}
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const globalStats = calculateOccupationStats('ALL');

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header & Tabs ... (Same as before) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ocupación y Actividad</h2>
          <p className="text-sm text-gray-500">Gestión diaria y análisis</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50"><Printer size={18} /> Informe</button>
            <button onClick={() => { setSelectedAsset(null); setEditingAssignment(null); setFormData(initialForm); setShowAssignModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Nueva Asignación</button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto print:hidden shrink-0">
         <button onClick={() => setActiveTab('CALENDAR')} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'CALENDAR' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500'}`}><CalendarIcon size={16} /> Calendario</button>
         <button onClick={() => setActiveTab('DASHBOARD')} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'DASHBOARD' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500'}`}><BarChart3 size={16} /> Dashboard</button>
         <button onClick={() => setActiveTab('ASSIGNMENTS')} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'ASSIGNMENTS' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500'}`}><List size={16} /> Lista</button>
         <button onClick={() => setActiveTab('MAP')} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'MAP' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500'}`}><MapIcon size={16} /> Mapa</button>
         <button onClick={() => setActiveTab('DATA')} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'DATA' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500'}`}><Database size={16} /> Base de Datos</button>
      </div>

      {/* --- CONTENTS --- */}
      <div className={`${activeTab === 'MAP' ? 'block' : 'hidden'} h-full relative rounded-xl overflow-hidden border border-gray-200 shadow-sm`}>
          <div className="absolute top-4 right-4 z-[400] bg-white p-2 rounded shadow-md border border-gray-200">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ver fecha:</label>
              <input type="date" value={mapDate} onChange={(e) => setMapDate(e.target.value)} className="border rounded p-1 text-sm font-bold text-gray-700" />
          </div>
          <div ref={mapRef} className="h-full w-full bg-slate-100" />
      </div>

      {activeTab === 'CALENDAR' && renderCalendar()}

      {activeTab === 'DATA' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Database size={20} /> Gestión de Datos</h3>
                  <div className="flex gap-2">
                      <input type="file" ref={backupInputRef} onChange={handleRestore} className="hidden" accept=".json" />
                      <button onClick={() => backupInputRef.current?.click()} className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-200 flex items-center gap-2"><Upload size={16}/> Restaurar Backup</button>
                      <button onClick={handleBackup} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 flex items-center gap-2"><Download size={16}/> Crear Backup (JSON)</button>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 border rounded-xl bg-gray-50">
                      <h4 className="font-bold mb-2">Exportar Tablas (Excel/CSV)</h4>
                      <div className="flex flex-wrap gap-2">
                          <button onClick={() => exportTableToCSV('Assignments', assignments)} className="px-3 py-1 bg-white border shadow-sm rounded text-xs font-bold text-gray-700 hover:bg-gray-100">Asignaciones</button>
                          <button onClick={() => exportTableToCSV('DailyLogs', dailyLogs)} className="px-3 py-1 bg-white border shadow-sm rounded text-xs font-bold text-gray-700 hover:bg-gray-100">Registros Diarios</button>
                          <button onClick={() => exportTableToCSV('Assets', assets)} className="px-3 py-1 bg-white border shadow-sm rounded text-xs font-bold text-gray-700 hover:bg-gray-100">Activos</button>
                      </div>
                  </div>
              </div>
              <div className="flex-1 overflow-auto border-t pt-4">
                  <table className="w-full text-xs text-left mb-8 border">
                      <thead className="bg-gray-100"><tr><th className="p-1">ID</th><th className="p-1">Activo</th><th className="p-1">Cliente</th><th className="p-1">Inicio</th><th className="p-1">Fin</th><th className="p-1">H. Inicio</th><th className="p-1">H. Fin</th></tr></thead>
                      <tbody>
                          {assignments.map(a => (<tr key={a.id} className="border-b hover:bg-gray-50"><td className="p-1 font-mono">{a.id.substring(0,8)}...</td><td className="p-1">{assets.find(x=>x.id===a.assetId)?.code}</td><td className="p-1">{a.client}</td><td className="p-1">{a.startDate}</td><td className="p-1">{a.endDate}</td><td className="p-1">{a.startTime}</td><td className="p-1">{a.endTime}</td></tr>))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'DASHBOARD' && (
        <div className="flex flex-col h-full gap-6 overflow-y-auto">
            <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                <div>
                    <h4 className="text-slate-400 text-xs font-bold uppercase mb-1">Ocupación Real</h4>
                    <div className="text-3xl font-bold flex items-end gap-2" style={{color: getOccupationColor(Number(globalStats.percent))}}>{globalStats.percent}% <TrendingUp size={24} /></div>
                    <p className="text-xs text-slate-400 mt-1">Horas Reales / Capacidad Teórica</p>
                </div>
                <div><h4 className="text-slate-400 text-xs font-bold uppercase mb-1">Horas Totales</h4><div className="text-3xl font-bold">{globalStats.real.toLocaleString()} h</div></div>
                <div><h4 className="text-slate-400 text-xs font-bold uppercase mb-1">Días Operativos</h4><div className="text-3xl font-bold text-slate-300">{new Set(dailyLogs.map(l=>l.date)).size} / 365</div></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Utilización por Activo (Orden por Código)</h3>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={assets.filter(a => !a.isAccessory).sort((a,b) => a.code.localeCompare(b.code)).map(a => {
                            const hours = dailyLogs.filter(l => l.assetId === a.id).reduce((sum, l) => sum + l.hours, 0);
                            return { code: a.code, name: a.name, hours, id: a.id };
                        })}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="code" />
                            <YAxis />
                            <Tooltip cursor={{fill: '#f3f4f6'}} content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (<div className="bg-white p-2 border shadow rounded"><p className="font-bold">{data.code}</p><p className="text-sm">{data.name}</p><p className="text-sm text-blue-600">{data.hours} horas</p></div>);
                                } return null;
                            }} />
                            <Bar dataKey="hours" onClick={(data) => { const asset = assets.find(a => a.id === data.id); if(asset) openHistory(asset); }}>
                                {assets.filter(a => !a.isAccessory).map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cursor="pointer" />))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'ASSIGNMENTS' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 overflow-y-auto">
           <table className="w-full text-sm text-left">
             <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b sticky top-0">
               <tr><th className="px-6 py-3">Activo</th><th className="px-6 py-3">Estado Hoy</th><th className="px-6 py-3">Cliente Actual</th><th className="px-6 py-3 text-center">Horas Hoy</th><th className="px-6 py-3 text-center">Acumulado Año</th><th className="px-6 py-3 text-center">Acción</th></tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {assets.filter(a => !a.isAccessory).map(asset => {
                 const today = getLocalTodayStr();
                 const todayLog = dailyLogs.find(l => l.assetId === asset.id && l.date === today);
                 const assign = assignments.find(a => a.id === asset.currentAssignmentId);
                 const totalHours = dailyLogs.filter(l => l.assetId === asset.id).reduce((s, l) => s + l.hours, 0);
                 return (
                   <tr key={asset.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => handleAssetClick(asset)}>
                     <td className="px-6 py-4 font-bold text-gray-800">{asset.code} - {asset.name}</td>
                     <td className="px-6 py-4">{todayLog ? <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${todayLog.status === 'TRABAJANDO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{todayLog.status}</span> : <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-200 text-gray-600 animate-pulse">SIN VERIFICAR</span>}</td>
                     <td className="px-6 py-4 text-gray-600">{assign ? assign.client : '-'}</td>
                     <td className="px-6 py-4 text-center font-mono">{todayLog ? todayLog.hours : 0}h</td>
                     <td className="px-6 py-4 text-center font-bold text-blue-600">{totalHours}h</td>
                     <td className="px-6 py-4 text-center text-gray-400 group-hover:text-blue-600"><Edit size={16}/></td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      )}

      {/* --- MODAL: ACTION CHOICE (Continue vs New) --- */}
      {showActionModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Gestionar Asignación: {selectedAsset?.code}</h3>
                  <p className="text-gray-500 mb-6">Seleccione una opción para gestionar este activo.</p>
                  <div className="flex flex-col gap-3">
                      {editingAssignment && (
                          <button onClick={() => handleActionChoice('CONTINUE')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"><Edit size={18}/> Editar Asignación Actual</button>
                      )}
                      <button onClick={() => handleActionChoice('NEW')} className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 flex items-center justify-center gap-2"><Plus size={18}/> Nueva Asignación</button>
                      <button onClick={() => setShowActionModal(false)} className="text-sm text-gray-400 mt-2 hover:text-gray-600">Cancelar</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MAIN ASSIGNMENT MODAL (USED FOR EVERYTHING) --- */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[95vh]">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">{editingAssignment ? 'Modificar Asignación / Registro Diario' : 'Nueva Asignación'}</h3>
                  <button onClick={() => setShowAssignModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              
              <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
                  {/* REMOVED FORM TAG COMPLETELY TO AVOID SUBMIT CONFLICTS */}
                  <div id="assignFormContainer" className="space-y-6">
                      {/* Asset & Responsible */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Activo *</label>
                              <select disabled={!!selectedAsset} required className="w-full border border-gray-300 rounded-lg p-3 bg-white disabled:bg-gray-100" value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})}>
                                  <option value="">Seleccione...</option>
                                  {assets.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Responsable</label>
                              <input type="text" className="w-full border border-gray-300 rounded-lg p-3" value={formData.responsiblePerson} onChange={e => setFormData({...formData, responsiblePerson: e.target.value})} />
                          </div>
                      </div>

                      {/* Location Box (Blue) */}
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                          <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider"><MapPin size={16}/> Ubicación Geográfica</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-blue-700 mb-1">Provincia</label>
                                  <select className="w-full border border-blue-200 rounded p-2 text-sm bg-white" onChange={(e) => { const p = SPANISH_LOCATIONS.find(x => x.id === e.target.value); setSelectedProvince(p || null); setFormData({...formData, province: p?.name || '', city: ''}); }} value={selectedProvince?.id || ''}>
                                      <option value="">Provincia...</option>
                                      {SPANISH_LOCATIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-blue-700 mb-1">Ciudad</label>
                                  <select className="w-full border border-blue-200 rounded p-2 text-sm bg-white" disabled={!selectedProvince} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
                                      <option value="">Ciudad...</option>
                                      {selectedProvince?.cities.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-blue-700 mb-1">CECO (Costes)</label>
                                  <input type="text" className="w-full border border-blue-200 rounded p-2 text-sm" value={formData.ceco} onChange={e => setFormData({...formData, ceco: e.target.value})} />
                              </div>
                              <div className="md:col-span-3">
                                  <label className="block text-xs font-bold text-blue-700 mb-1">Detalle Ubicación / Obra</label>
                                  <input type="text" className="w-full border border-blue-200 rounded p-2 text-sm" value={formData.locationDetails} onChange={e => setFormData({...formData, locationDetails: e.target.value})} />
                              </div>
                          </div>
                      </div>

                      {/* Job Details Box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Cliente *</label>
                              <input required type="text" className="w-full border border-gray-300 rounded-lg p-3" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Nº Oferta</label>
                              <input type="text" className="w-full border border-gray-300 rounded-lg p-3" value={formData.offerId} onChange={e => setFormData({...formData, offerId: e.target.value})} />
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-1">Descripción del Trabajo</label>
                              <input type="text" className="w-full border border-gray-300 rounded-lg p-3" value={formData.jobDescription} onChange={e => setFormData({...formData, jobDescription: e.target.value})} />
                          </div>
                      </div>

                      {/* Schedule Box (Gray) - WITH TIME INTERVALS & COUNTER */}
                      <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 relative">
                          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                              Duración Diaria: {calculatedDuration}h
                          </div>
                          <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider"><Clock size={16}/> Tiempos y Jornada</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Inicio</label>
                                  <input required type="date" className="w-full border rounded p-2 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Fin</label>
                                  <input type="date" className="w-full border rounded p-2 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Hora Inicio</label>
                                  <input type="time" className="w-full border rounded p-2 text-sm" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Hora Fin</label>
                                  <input type="time" className="w-full border rounded p-2 text-sm" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Estado</label>
                                  <select className="w-full border rounded p-2 text-sm" value={formData.status} onChange={(e:any) => setFormData({...formData, status: e.target.value})}>
                                      <option value="ACTIVA">ACTIVA (Trabajando)</option>
                                      <option value="FINALIZADA">FINALIZADA</option>
                                  </select>
                              </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-4 italic">
                              Nota: Las fechas futuras se guardarán automáticamente como <strong>RESERVADO</strong>.
                          </p>
                      </div>
                  </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                  <button onClick={() => setShowAssignModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100">Cancelar</button>
                  {/* EXPLICIT BUTTON HANDLER, NO FORM SUBMIT */}
                  <button 
                    type="button" 
                    onClick={handleSaveAssignment} 
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isSaving ? 'Guardando...' : (editingAssignment ? 'Guardar Cambios' : 'Crear Asignación')}
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* --- HISTORY MODAL --- */}
      {showHistoryModal && historyAsset && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="text-xl font-bold">Historial de Asignaciones: {historyAsset.code}</h3>
                      <button onClick={() => setShowHistoryModal(false)}><X /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                              <tr>
                                  <th className="p-3 text-left">Inicio</th>
                                  <th className="p-3 text-left">Fin</th>
                                  <th className="p-3 text-left">Cliente</th>
                                  <th className="p-3 text-left">CECO</th>
                                  <th className="p-3 text-center">Horario</th>
                                  <th className="p-3 text-center">Estado</th>
                                  <th className="p-3 text-center">Acción</th>
                              </tr>
                          </thead>
                          <tbody>
                              {assignments.filter(a => a.assetId === historyAsset.id).map(a => (
                                  <tr key={a.id} className="border-b hover:bg-gray-50">
                                      <td className="p-3">{a.startDate}</td>
                                      <td className="p-3">{a.endDate || '---'}</td>
                                      <td className="p-3 font-medium">{a.client}</td>
                                      <td className="p-3 text-gray-600">{a.ceco}</td>
                                      <td className="p-3 text-center">{a.startTime || '08:00'} - {a.endTime || '16:00'}</td>
                                      <td className="p-3 text-center"><span className={`px-2 py-1 rounded text-xs ${a.status === 'ACTIVA' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{a.status}</span></td>
                                      <td className="p-3 text-center">
                                          <button onClick={() => handleEditSpecificAssignment(a)} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- DAY DETAIL MODAL --- */}
      {showDayDetailModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[85vh]">
                  <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                      <h3 className="text-xl font-bold text-gray-800">Actividad Diaria: {new Date(selectedDate).toLocaleDateString()}</h3>
                      <button onClick={() => setShowDayDetailModal(false)} className="hover:bg-gray-200 p-1 rounded"><X /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <table className="w-full text-sm border-collapse">
                          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                              <tr>
                                  <th className="p-3 text-left">Activo</th>
                                  <th className="p-3 text-center">Estado</th>
                                  <th className="p-3 text-left">Cliente</th>
                                  <th className="p-3 text-left">CECO</th>
                                  <th className="p-3 text-center">Horario Asignado</th>
                                  <th className="p-3 text-center">Horas</th>
                                  <th className="p-3 text-center">Acción</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {assets.filter(a => !a.isAccessory).map(asset => {
                                  const log = dailyLogs.find(l => l.date === selectedDate && l.assetId === asset.id);
                                  
                                  // Find relevant assignment for this date to show theoretical data if log missing
                                  const assign = assignments.find(a => 
                                      a.assetId === asset.id && 
                                      a.startDate <= selectedDate && 
                                      (!a.endDate || a.endDate >= selectedDate)
                                  );

                                  const hasLog = !!log;
                                  
                                  // Determine status based on Date (Future vs Past/Today)
                                  const isFuture = selectedDate > getLocalTodayStr();
                                  
                                  let displayStatus = log ? log.status : (assign && assign.status === 'ACTIVA' ? 'TRABAJANDO' : 'PARADO');
                                  let displayHours: any = log ? log.hours : (assign && assign.status === 'ACTIVA' ? assign.customHours : 0);
                                  
                                  if (isFuture && assign && assign.status === 'ACTIVA') {
                                      displayStatus = 'RESERVADO';
                                      displayHours = 'Planificado'; // Show text instead of number for future
                                  }

                                  const displayStart = log?.startTime || assign?.startTime || '08:00';
                                  const displayEnd = log?.endTime || assign?.endTime || '16:00';

                                  return (
                                      <tr key={asset.id} className="hover:bg-blue-50 transition-colors">
                                          <td className="p-3">
                                              <div className="font-bold text-gray-900">{asset.code}</div>
                                              <div className="text-xs text-gray-500">{asset.name}</div>
                                          </td>
                                          <td className="p-3 text-center">
                                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                                  displayStatus === 'TRABAJANDO' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                  displayStatus === 'AVERIADO' ? 'bg-red-100 text-red-700 border-red-200' :
                                                  displayStatus === 'TALLER' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                  displayStatus === 'RESERVADO' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                  'bg-gray-100 text-gray-600 border-gray-200'
                                              }`}>
                                                  {displayStatus}
                                              </span>
                                          </td>
                                          <td className="p-3 text-gray-700 font-medium">
                                              {assign ? assign.client : <span className="text-gray-400 italic">-</span>}
                                          </td>
                                          <td className="p-3 text-gray-600 font-mono text-xs">
                                              {assign ? assign.ceco : <span className="text-gray-400 italic">-</span>}
                                          </td>
                                          <td className={`p-3 text-center font-mono ${hasLog ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                                              {assign ? `${displayStart} - ${displayEnd}` : '-'}
                                          </td>
                                          <td className={`p-3 text-center font-bold ${isFuture ? 'text-blue-500 italic' : (hasLog ? 'text-blue-700' : 'text-gray-300')}`}>
                                              {displayHours} {typeof displayHours === 'number' ? 'h' : ''}
                                          </td>
                                          <td className="p-3 text-center">
                                              {assign && (
                                                  <button 
                                                      onClick={() => handleEditDailyFromCalendar(asset, log, assign)}
                                                      className="p-1.5 bg-white border border-gray-300 text-blue-600 rounded hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                      title="Modificar Asignación Diaria"
                                                  >
                                                      <Edit size={16} />
                                                  </button>
                                              )}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OccupationView;
