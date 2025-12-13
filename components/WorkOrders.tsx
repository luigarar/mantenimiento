
import React, { useState, useEffect } from 'react';
import { WorkOrder, WorkOrderPriority, WorkOrderStatus, Asset, Language, WorkOrderType, WorkOrderOrigin, SparePart, User, UserRole, AssetStatus } from '../types';
import { analyzeFault } from '../services/geminiService';
import { Plus, X, Sparkles, ChevronRight, ChevronLeft, Calendar, User as UserIcon, Wrench, ShoppingCart, Clock, Camera, FileCheck, DollarSign } from 'lucide-react';
import { t } from '../services/translations';
import { storageService } from '../services/storage';

interface WorkOrdersProps {
  workOrders: WorkOrder[];
  assets: Asset[];
  addWorkOrder: (wo: WorkOrder) => void;
  currentLang: Language;
  onRefresh: () => void;
}

const WorkOrders: React.FC<WorkOrdersProps> = ({ workOrders, assets, addWorkOrder, currentLang, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PLAN' | 'EXEC' | 'CLOSE'>('GENERAL');
  
  // Data for Selectors
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  
  // Form State (Single source of truth for creating/editing)
  const initialFormState: Partial<WorkOrder> = {
    id: '', assetId: '', description: '', priority: WorkOrderPriority.MEDIA,
    status: WorkOrderStatus.PENDIENTE, type: 'CORRECTIVO', origin: 'CONDUCTOR',
    createdAt: new Date().toISOString().split('T')[0], estimatedHours: 0, estimatedCost: 0,
    assignedMechanics: [], laborLogs: [], partsUsed: [], photosBefore: [], photosAfter: []
  };
  const [formData, setFormData] = useState<Partial<WorkOrder>>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  // Execution Helpers
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [laborLogData, setLaborLogData] = useState({ mechId: '', hours: 0 });

  // AI State
  const [aiDiagnosis, setAiDiagnosis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load Dependencies
  useEffect(() => {
    const loadDeps = async () => {
        const users = await storageService.getUsers();
        setMechanics(users.filter(u => u.role === UserRole.MECANICO));
        const sp = await storageService.getSpareParts();
        setParts(sp);
    };
    loadDeps();
  }, [isModalOpen]);

  // --- CRUD HANDLERS ---
  const handleOpenCreate = () => {
      setFormData({ ...initialFormState, id: `OT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}` });
      setIsEditing(false);
      setActiveTab('GENERAL');
      setIsModalOpen(true);
  };

  const handleOpenEdit = (wo: WorkOrder) => {
      setFormData({ ...wo });
      setIsEditing(true);
      setActiveTab('GENERAL');
      setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId || !formData.description) return;

    // Calculate Final Cost on Close
    let finalData = { ...formData };
    if (activeTab === 'CLOSE') {
        const laborCost = (finalData.laborLogs?.reduce((acc, log) => acc + log.hours, 0) || 0) * 45; // 45€/h standard rate
        const partsCost = finalData.partsUsed?.reduce((acc, part) => acc + part.totalPrice, 0) || 0;
        finalData.totalCostLabor = laborCost;
        finalData.totalCostParts = partsCost;
    }

    const woToSave = finalData as WorkOrder;
    await storageService.saveWorkOrder(woToSave, false); // Assume online
    addWorkOrder(woToSave); // Update parent state optimistically
    setIsModalOpen(false);
    onRefresh();
  };

  const runDiagnosis = async () => {
    if (!formData.description || !formData.assetId) return;
    setIsAnalyzing(true);
    const asset = assets.find(a => a.id === formData.assetId);
    const result = await analyzeFault(formData.description!, asset?.model || 'Generic Machine');
    setAiDiagnosis(result);
    setIsAnalyzing(false);
  };

  // --- EXECUTION HANDLERS ---
  const addPart = () => {
      const part = parts.find(p => p.id === selectedPartId);
      if (part && partQty > 0) {
          const newItem = {
              partId: part.id,
              partName: part.name,
              quantity: partQty,
              unitPrice: part.price,
              totalPrice: part.price * partQty
          };
          setFormData(prev => ({
              ...prev,
              partsUsed: [...(prev.partsUsed || []), newItem]
          }));
          setSelectedPartId('');
          setPartQty(1);
      }
  };

  const removePart = (index: number) => {
      setFormData(prev => ({
          ...prev,
          partsUsed: prev.partsUsed?.filter((_, i) => i !== index)
      }));
  };

  const addLabor = () => {
      const mech = mechanics.find(m => m.id === laborLogData.mechId);
      if (mech && laborLogData.hours > 0) {
          const newLog = {
              mechanicId: mech.id,
              mechanicName: mech.fullName,
              hours: laborLogData.hours,
              date: new Date().toISOString().split('T')[0]
          };
          setFormData(prev => ({
              ...prev,
              laborLogs: [...(prev.laborLogs || []), newLog]
          }));
          setLaborLogData({ mechId: '', hours: 0 });
      }
  };

  const removeLabor = (index: number) => {
      setFormData(prev => ({
          ...prev,
          laborLogs: prev.laborLogs?.filter((_, i) => i !== index)
      }));
  };

  // --- RENDER HELPERS ---
  const getPriorityColor = (p: WorkOrderPriority) => {
    switch(p) {
      case WorkOrderPriority.CRITICA: return 'text-red-600 bg-red-50 border-red-200';
      case WorkOrderPriority.ALTA: return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderColumn = (status: WorkOrderStatus, title: string) => {
    const orders = workOrders.filter(wo => wo.status === status);
    return (
      <div className="flex-1 min-w-[300px] bg-gray-100 rounded-lg p-3">
        <h3 className="text-sm font-bold text-gray-600 uppercase mb-3 flex justify-between">
          {title}
          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{orders.length}</span>
        </h3>
        <div className="space-y-3">
          {orders.map(wo => {
            const asset = assets.find(a => a.id === wo.assetId);
            return (
              <div key={wo.id} onClick={() => handleOpenEdit(wo)} className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-gray-500">{wo.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(wo.priority)}`}>{wo.priority}</span>
                </div>
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{asset?.name || 'Activo Desconocido'}</h4>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{wo.description}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                   <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{wo.type}</span>
                   <span className="text-xs text-gray-400">{wo.createdAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('workOrders', currentLang)}</h2>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          {t('newOT', currentLang)}
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {renderColumn(WorkOrderStatus.PENDIENTE, t('pendingOTs', currentLang))}
          {renderColumn(WorkOrderStatus.EN_PROGRESO, t('workshop', currentLang))}
          {renderColumn(WorkOrderStatus.ESPERA_REPUESTO, 'Repuesto')}
          {renderColumn(WorkOrderStatus.TERMINADA, 'Terminada')}
          {renderColumn(WorkOrderStatus.CERRADA, 'Cerrada')}
        </div>
      </div>

      {/* --- SUPER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Wrench className="text-blue-600" />
                      {isEditing ? `Editar ${formData.id}` : 'Nueva Orden de Trabajo'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Gestión integral del mantenimiento</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            {/* Stepper / Tabs */}
            <div className="flex border-b border-gray-200 bg-white">
                <button onClick={() => setActiveTab('GENERAL')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'GENERAL' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}>1. Datos Generales</button>
                <button onClick={() => setActiveTab('PLAN')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'PLAN' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}>2. Planificación</button>
                <button onClick={() => setActiveTab('EXEC')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'EXEC' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}>3. Ejecución</button>
                <button onClick={() => setActiveTab('CLOSE')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'CLOSE' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}>4. Cierre y Costes</button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <form id="otForm" onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
                
                {/* --- TAB 1: GENERAL --- */}
                {activeTab === 'GENERAL' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      {/* Asset & Desc */}
                      <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Activo Afectado *</label>
                          <select className="w-full border border-gray-300 rounded-lg p-3 bg-white" value={formData.assetId} onChange={(e) => setFormData({...formData, assetId: e.target.value})} required>
                            <option value="">Seleccionar Equipo...</option>
                            {assets.map(a => (<option key={a.id} value={a.id}>{a.code} - {a.name}</option>))}
                          </select>
                      </div>

                      {/* Classifications */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Orden</label>
                            <select className="w-full border border-gray-300 rounded-lg p-3" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as WorkOrderType})}>
                                <option value="CORRECTIVO">Correctivo</option><option value="PREVENTIVO">Preventivo</option><option value="LEGAL">Legal / ITV</option><option value="MEJORA">Mejora</option><option value="INSPECCION">Inspección</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Origen</label>
                            <select className="w-full border border-gray-300 rounded-lg p-3" value={formData.origin} onChange={(e) => setFormData({...formData, origin: e.target.value as WorkOrderOrigin})}>
                                <option value="CONDUCTOR">Reporte Conductor</option><option value="CHECKLIST">Checklist</option><option value="OPERACIONES">Aviso Operaciones</option><option value="PLANIFICACION">Planificación</option>
                            </select>
                          </div>
                      </div>

                      {/* Priority & Date */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Prioridad</label>
                            <select className="w-full border border-gray-300 rounded-lg p-3" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as WorkOrderPriority})}>
                                {Object.values(WorkOrderPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">Fecha Apertura</label>
                             <input type="datetime-local" className="w-full border border-gray-300 rounded-lg p-3" value={formData.createdAt} onChange={(e) => setFormData({...formData, createdAt: e.target.value})} />
                          </div>
                      </div>

                      {/* Description & AI */}
                      <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Descripción de la Avería / Tarea *</label>
                          <textarea className="w-full border border-gray-300 rounded-lg p-4 h-32" placeholder="Describa el problema..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                          
                          {/* AI Assistant */}
                          <div className="mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2"><Sparkles size={16} /> Diagnóstico Inteligente (AI)</h4>
                                  <button type="button" onClick={runDiagnosis} disabled={isAnalyzing || !formData.description} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                      {isAnalyzing ? 'Analizando...' : 'Analizar'}
                                  </button>
                              </div>
                              {aiDiagnosis && <div className="text-xs text-indigo-900 bg-white p-3 rounded border border-indigo-100 whitespace-pre-line">{aiDiagnosis}</div>}
                          </div>
                      </div>
                  </div>
                )}

                {/* --- TAB 2: PLANNING --- */}
                {activeTab === 'PLAN' && (
                   <div className="space-y-6 animate-fade-in">
                       <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                           <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><UserIcon size={18}/> Asignación de Mecánicos</h4>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                               {mechanics.map(mech => (
                                   <label key={mech.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.assignedMechanics?.includes(mech.id) ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'}`}>
                                       <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={formData.assignedMechanics?.includes(mech.id) || false} 
                                          onChange={(e) => {
                                              const current = formData.assignedMechanics || [];
                                              setFormData({...formData, assignedMechanics: e.target.checked ? [...current, mech.id] : current.filter(id => id !== mech.id)});
                                          }} 
                                       />
                                       <div>
                                           <div className="text-sm font-bold text-gray-800">{mech.fullName}</div>
                                           <div className="text-xs text-gray-500">{mech.role}</div>
                                       </div>
                                   </label>
                               ))}
                           </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                               <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={18}/> Agenda</h4>
                               <div className="space-y-4">
                                   <div><label className="text-xs font-bold text-gray-500 uppercase">Inicio Previsto</label><input type="datetime-local" className="w-full mt-1 border rounded p-2 text-sm" value={formData.scheduledStartDate || ''} onChange={(e) => setFormData({...formData, scheduledStartDate: e.target.value})} /></div>
                                   <div><label className="text-xs font-bold text-gray-500 uppercase">Fin Previsto</label><input type="datetime-local" className="w-full mt-1 border rounded p-2 text-sm" value={formData.scheduledEndDate || ''} onChange={(e) => setFormData({...formData, scheduledEndDate: e.target.value})} /></div>
                               </div>
                           </div>
                           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                               <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><DollarSign size={18}/> Estimaciones</h4>
                               <div className="space-y-4">
                                   <div><label className="text-xs font-bold text-gray-500 uppercase">Tiempo Est. (Horas)</label><input type="number" className="w-full mt-1 border rounded p-2 text-sm" value={formData.estimatedHours} onChange={(e) => setFormData({...formData, estimatedHours: Number(e.target.value)})} /></div>
                                   <div><label className="text-xs font-bold text-gray-500 uppercase">Coste Est. (€)</label><input type="number" className="w-full mt-1 border rounded p-2 text-sm" value={formData.estimatedCost} onChange={(e) => setFormData({...formData, estimatedCost: Number(e.target.value)})} /></div>
                               </div>
                           </div>
                       </div>
                   </div>
                )}

                {/* --- TAB 3: EXECUTION --- */}
                {activeTab === 'EXEC' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Parts */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingCart size={18}/> Repuestos y Consumibles</h4>
                            <div className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-lg">
                                <select className="flex-1 border border-gray-300 rounded p-2 text-sm" value={selectedPartId} onChange={(e) => setSelectedPartId(e.target.value)}>
                                    <option value="">Seleccionar Repuesto...</option>
                                    {parts.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (Stock: {p.stock})</option>)}
                                </select>
                                <input type="number" className="w-20 border border-gray-300 rounded p-2 text-sm" min="1" value={partQty} onChange={(e) => setPartQty(Number(e.target.value))} />
                                <button type="button" onClick={addPart} className="bg-blue-600 text-white px-4 rounded text-sm font-bold">Añadir</button>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500"><tr><th className="p-2 text-left">Ref</th><th className="p-2 text-left">Repuesto</th><th className="p-2">Cant</th><th className="p-2">Coste</th><th></th></tr></thead>
                                <tbody>
                                    {formData.partsUsed?.map((p, idx) => (
                                        <tr key={idx} className="border-t"><td className="p-2 font-mono text-xs">{idx+1}</td><td className="p-2">{p.partName}</td><td className="p-2 text-center">{p.quantity}</td><td className="p-2 text-center">{p.totalPrice}€</td><td className="p-2 text-right"><button type="button" onClick={() => removePart(idx)} className="text-red-500"><X size={16}/></button></td></tr>
                                    ))}
                                    {(!formData.partsUsed || formData.partsUsed.length === 0) && <tr><td colSpan={5} className="p-4 text-center text-gray-400">Sin consumo registrado</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        {/* Labor */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                             <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={18}/> Registro de Tiempos (Mano de Obra)</h4>
                             <div className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-lg">
                                <select className="flex-1 border border-gray-300 rounded p-2 text-sm" value={laborLogData.mechId} onChange={(e) => setLaborLogData({...laborLogData, mechId: e.target.value})}>
                                    <option value="">Seleccionar Mecánico...</option>
                                    {mechanics.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                                </select>
                                <input type="number" className="w-24 border border-gray-300 rounded p-2 text-sm" placeholder="Horas" step="0.5" value={laborLogData.hours} onChange={(e) => setLaborLogData({...laborLogData, hours: Number(e.target.value)})} />
                                <button type="button" onClick={addLabor} className="bg-blue-600 text-white px-4 rounded text-sm font-bold">Imputar</button>
                             </div>
                             <ul className="space-y-2">
                                 {formData.laborLogs?.map((log, idx) => (
                                     <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 text-sm">
                                         <div><span className="font-bold">{log.mechanicName}</span> <span className="text-gray-500 text-xs">({log.date})</span></div>
                                         <div className="flex items-center gap-4"><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border">{log.hours}h</span> <button type="button" onClick={() => removeLabor(idx)} className="text-red-500"><X size={16}/></button></div>
                                     </li>
                                 ))}
                             </ul>
                        </div>
                    </div>
                )}

                {/* --- TAB 4: CLOSING --- */}
                {activeTab === 'CLOSE' && (
                     <div className="space-y-6 animate-fade-in">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4">Resumen Económico (Pre-Cierre)</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span>Mano de Obra ({formData.laborLogs?.reduce((a,b)=>a+b.hours,0)}h x 45€):</span> <span className="font-bold">{(formData.laborLogs?.reduce((a,b)=>a+b.hours,0) || 0) * 45} €</span></div>
                                    <div className="flex justify-between"><span>Repuestos:</span> <span className="font-bold">{formData.partsUsed?.reduce((a,b)=>a+b.totalPrice,0)} €</span></div>
                                    <div className="flex justify-between pt-2 border-t text-base font-bold text-blue-700"><span>TOTAL ESTIMADO:</span> <span>{((formData.laborLogs?.reduce((a,b)=>a+b.hours,0) || 0) * 45) + (formData.partsUsed?.reduce((a,b)=>a+b.totalPrice,0) || 0)} €</span></div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4">Estado Final</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Estado de la OT</label>
                                        <select className="w-full border border-gray-300 rounded p-2" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as WorkOrderStatus})}>
                                            <option value={WorkOrderStatus.EN_PROGRESO}>En Progreso</option>
                                            <option value={WorkOrderStatus.ESPERA_REPUESTO}>Espera Repuesto</option>
                                            <option value={WorkOrderStatus.TERMINADA}>Terminada</option>
                                            <option value={WorkOrderStatus.CERRADA}>Cerrada (Definitivo)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Estado Final del Activo</label>
                                        <select className="w-full border border-gray-300 rounded p-2" onChange={(e) => setFormData({...formData, finalAssetStatus: e.target.value as AssetStatus})}>
                                            <option value="">-- Seleccionar --</option>
                                            <option value="OPERATIVO">Operativo</option>
                                            <option value="AVERIADO">Sigue Averiado</option>
                                            <option value="BAJA">Baja</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FileCheck size={18}/> Firma Digital</h4>
                                <div className="bg-gray-50 p-4 rounded border border-gray-200 flex items-center gap-4">
                                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" required id="signCheck" />
                                    <label htmlFor="signCheck" className="text-sm text-gray-600">
                                        Certifico que los trabajos han sido realizados correctamente y el equipo ha sido verificado.
                                    </label>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Firmado por:</label>
                                    <input type="text" className="w-full border border-gray-300 rounded p-2" placeholder="Nombre del Responsable" value={formData.signature?.signedBy || ''} onChange={(e) => setFormData({...formData, signature: { signedBy: e.target.value, timestamp: new Date().toISOString(), digitalSign: 'valid' }})} />
                                </div>
                            </div>
                         </div>
                     </div>
                )}

              </form>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-500 italic">
                  {isEditing ? `Editando OT: ${formData.id}` : 'Nueva Orden Borrador'}
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-100">Cancelar</button>
                  <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-lg">Guardar Cambios</button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
