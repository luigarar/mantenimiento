
import React, { useState, useRef, useEffect } from 'react';
import { Asset, AssetStatus, Language, AssetDocument, AssetDocCategory } from '../types';
import { Search, Filter, MapPin, Calendar, Clock, Plus, Edit, Trash2, X, FileText, Image, Link as LinkIcon, Upload, Download, Tag, Hash, Truck, AlertCircle, Info, FileCheck, Layers, ShieldCheck, PenTool, LayoutGrid, Printer, FileSpreadsheet, Paperclip, Gauge, Factory, ShoppingBag, Eye, Mail, ChevronRight, Droplets, Wind, Scale, Container, Settings, CheckSquare, Camera } from 'lucide-react';
import { t } from '../services/translations';
import { storageService } from '../services/storage';

interface AssetListProps {
  assets: Asset[];
  currentLang: Language;
  onRefresh: () => void;
}

// Helper Categories for filtering the MAIN LIST
type AssetCategoryFilter = 'ALL' | 'VEHICULO' | 'MAQUINARIA' | 'ACCESORIO';

const OPERATIONS_CHECKLIST = [
  "LIMPIEZA EXTERIOR E INTERIOR DE INTERCAMBIADORES DE CALOR",
  "LIMPIEZA EXTERIOR E INTERIOR DE LINEAS DE PRODUCTO",
  "EXTRACCIÓN DE LODOS POR VACÍO",
  "RECOGIDA DE DERRAMES ACCIDENTALES",
  "REALIZACIÓN DE PRUEBAS HIDRÁULICAS EN REDES DE TUBERÍAS Y LÍNEAS DE PRESIÓN",
  "LIMPIEZA Y DESGASIFICACIÓN DE TANQUES DE COMBUSTIBLE, CRUDO, FUEL-OIL, GASOLINA",
  "EVACUACIÓN DE LÍQUIDOS Y LODOS POR BOMBEO",
  "VACIADO Y LIMPIEZA DE BALSAS DE ACUMULACIÓN, DEPÓSITOS DE AGUA Y TORRES DE ENFRIAMIENTO",
  "LIMPIEZA DE HORNOS (ZONAS CONVECTIVA Y RADIACIÓN) Y CALDERAS (HOGARES DE COMBUSTIÓN)",
  "VACIADO Y LIMPIEZA DE POZOS SÉPTICOS Y REDES DE SANEAMIENTO",
  "LIMPIEZAS DE TORRES Y DEPOSITOS EN PARADAS INDUSTRIALES",
  "LIMPIEZAS DE RECIPIENTES MEDIANTE CABEZALES ROTATIVOS",
  "BALDEOS Y LIMPIEZAS DE SUPERFICIES",
  "LIMPIEZAS DE EQUIPOS Y LINEAS CON MATERIAL ALTAMENTE ADHERIDO",
  "LIMPIEZA DE INTERCAMBIADORES CON EQUIPOS MULTILANZA"
];

// --- UI COMPONENTS MOVED OUTSIDE TO PREVENT RE-RENDER FOCUS LOSS ---

const FormInput = ({ label, value, onChange, type = "text", required = false, icon: Icon, placeholder = "", disabled = false }: any) => (
  <div className="mb-1">
    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    <div className="relative">
      {Icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icon className="text-gray-400 h-5 w-5" /></div>}
      <input type={type} value={value || ''} onChange={onChange} disabled={disabled} placeholder={placeholder} className={`w-full py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white outline-none transition-all shadow-sm placeholder-gray-400 ${Icon ? 'pl-10 pr-4' : 'px-4'}`} />
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon }: any) => (
    <h4 className="col-span-1 md:col-span-2 text-lg font-bold text-gray-800 border-b pb-2 mb-2 mt-4 flex items-center gap-2">
        {Icon && <Icon size={20} className="text-blue-600" />} {title}
    </h4>
);

const SelectionCard = ({ title, desc, icon: Icon, onClick, color }: any) => (
    <button 
        onClick={onClick}
        type="button"
        className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200 hover:scale-105 group h-full ${color}`}
    >
        <div className="mb-6 p-6 rounded-full bg-white shadow-md group-hover:shadow-lg transition-shadow">
            <Icon size={48} className="text-gray-700" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 text-center leading-relaxed">{desc}</p>
    </button>
);

interface AssetPrintViewProps {
  asset: Asset;
  currentLang: Language;
  companyLogo: string | null;
}

const AssetPrintView = ({ asset, currentLang, companyLogo }: AssetPrintViewProps) => (
    <div className="hidden print:block p-8 bg-white text-black max-w-4xl mx-auto text-sm">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4 mb-6">
           <div className="flex items-center gap-4">
              {companyLogo && <img src={companyLogo} alt="Logo" className="h-16 w-auto object-contain" />}
              <div>
                  <h1 className="text-2xl font-bold uppercase tracking-wider">Ficha Técnica del Equipo</h1>
                  <p className="text-xs text-gray-500 uppercase">{asset.isAccessory ? t('category_accessory', currentLang) : (asset.category === 'MAQUINARIA' ? t('category_machinery', currentLang) : t('category_vehicle', currentLang))}</p>
              </div>
           </div>
           <div className="text-right">
               <h2 className="text-xl font-mono font-bold text-gray-800">{asset.code}</h2>
               <p className="text-xs text-gray-600">{new Date().toLocaleDateString()}</p>
           </div>
        </div>

        {/* Main Info */}
        <div className="grid grid-cols-3 gap-6 mb-6">
           <div className="col-span-1 border border-gray-300 rounded overflow-hidden h-40 bg-gray-50 flex items-center justify-center">
               {asset.image ? <img src={asset.image} className="w-full h-full object-cover" /> : <span className="text-gray-400 italic">No Image</span>}
           </div>
           <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-2 align-content-start">
               <div className="col-span-2 text-lg font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1">{asset.name}</div>
               <div><span className="font-bold">Marca:</span> {asset.brand}</div>
               <div><span className="font-bold">Modelo:</span> {asset.model}</div>
               <div><span className="font-bold">Matrícula:</span> {asset.licensePlate || '-'}</div>
               <div><span className="font-bold">Bastidor:</span> {asset.vin || '-'}</div>
               <div><span className="font-bold">Ubicación:</span> {asset.location}</div>
               <div><span className="font-bold">Estado:</span> {asset.status}</div>
               {asset.vehicleConfig && <div><span className="font-bold">Config:</span> {asset.vehicleConfig}</div>}
               {asset.vehicleSeats && <div><span className="font-bold">Plazas:</span> {asset.vehicleSeats}</div>}
           </div>
        </div>

        {/* Technical Grid (Industrial) */}
        {(asset.pressurePumpBrand || asset.tankSludgeVolume || asset.vacuumPumpBrand) && (
            <div className="mb-6">
                <h3 className="font-bold bg-gray-100 p-2 mb-2 border-l-4 border-blue-600 uppercase">Especificaciones Técnicas</h3>
                <div className="grid grid-cols-2 gap-6">
                    {/* Pressure */}
                    {asset.pressurePumpBrand && (
                      <div className="border border-gray-200 p-2 rounded">
                          <h4 className="font-bold border-b mb-2 text-blue-800">Equipo Presión</h4>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                              <span>Marca: {asset.pressurePumpBrand}</span>
                              <span>Mod: {asset.pressurePumpModel}</span>
                              <span>Presión: {asset.pressureMax} Bar</span>
                              <span>Caudal: {asset.flowMax} L/m</span>
                              <span>Reg. Neum: {asset.pneumaticRegulator ? 'SÍ' : 'NO'}</span>
                          </div>
                      </div>
                    )}
                    {/* Vacuum */}
                    {asset.vacuumPumpBrand && (
                      <div className="border border-gray-200 p-2 rounded">
                          <h4 className="font-bold border-b mb-2 text-blue-800">Equipo Vacío</h4>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                              <span>Marca: {asset.vacuumPumpBrand}</span>
                              <span>Tipo: {asset.vacuumType}</span>
                              <span>Caudal: {asset.vacuumFlow}</span>
                              <span>Potencia: {asset.vacuumPower}</span>
                          </div>
                      </div>
                    )}
                    {/* Tanks */}
                    {(asset.tankSludgeVolume || asset.tankWaterVolume) && (
                      <div className="border border-gray-200 p-2 rounded">
                          <h4 className="font-bold border-b mb-2 text-blue-800">Cisternas</h4>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                              <span>Lodos: {asset.tankSludgeVolume} L</span>
                              <span>Agua: {asset.tankWaterVolume} L</span>
                              <span>Material: {asset.tankMaterial}</span>
                              <span>ADR: {asset.adr ? 'SÍ' : 'NO'}</span>
                          </div>
                      </div>
                    )}
                    {/* Weights & Other */}
                    <div className="border border-gray-200 p-2 rounded">
                        <h4 className="font-bold border-b mb-2 text-blue-800">Pesos y Varios</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                            <span>Tara: {asset.tare} Kg</span>
                            <span>PMA: {asset.pma} Kg</span>
                            <span>Basculante: {asset.tipping ? 'SÍ' : 'NO'}</span>
                            <span>Motor Aux: {asset.auxMotorBrand || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Allowed Operations Checklist */}
        {asset.allowedOperations && asset.allowedOperations.length > 0 && (
            <div className="mb-6">
                <h3 className="font-bold bg-gray-100 p-2 mb-2 border-l-4 border-green-600 uppercase">Operaciones Aptas</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {asset.allowedOperations.map((op, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <div className="mt-0.5 w-3 h-3 border border-gray-600 flex items-center justify-center">
                                <div className="w-2 h-2 bg-black"></div>
                            </div>
                            <span>{op}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Docs Footer */}
        <div className="mt-auto pt-4 border-t border-gray-400 text-xs text-gray-500 flex justify-between">
            <span>Documento generado por MantentPro Industrial</span>
            <span>Página 1 de 1</span>
        </div>
    </div>
);

const AssetList: React.FC<AssetListProps> = ({ assets, currentLang, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<AssetCategoryFilter>('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false); // Controls the selection screen
  const [vehicleSubStep, setVehicleSubStep] = useState(false); // New step for Vehicle Sub-type

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'TECHNICAL' | 'LEGAL' | 'DOCS' | 'OPERATIONS'>('GENERAL');
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  
  // Asset Modes
  const [isAccessoryMode, setIsAccessoryMode] = useState(false);
  const [isMachineryMode, setIsMachineryMode] = useState(false);
  const [isIndustrialVehicle, setIsIndustrialVehicle] = useState(false); // New: Distinguish Standard vs Industrial

  // New Document Form State (Staging)
  const [newDocData, setNewDocData] = useState<{
    file: File | null;
    name: string;
    category: AssetDocCategory;
    effectiveDate: string;
    expirationDate: string;
    noExpiry: boolean;
  }>({
    file: null,
    name: '',
    category: 'OTRO',
    effectiveDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    noExpiry: false
  });

  // Printing State
  const [printingAsset, setPrintingAsset] = useState<Asset | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
     setCompanyLogo(localStorage.getItem('app_custom_logo'));
  }, []);

  // Form State
  const initialFormState: Partial<Asset> = {
    code: '', name: '', brand: '', model: '', type: '', 
    licensePlate: '', vin: '', category: '',
    status: AssetStatus.OPERATIVO, location: '', hours: 0,
    ownership: 'PROPIO', responsible: '',
    manufactureYear: new Date().getFullYear(),
    acquisitionYear: new Date().getFullYear(),
    nextMaintenance: new Date().toISOString().split('T')[0],
    lastMaintenance: new Date().toISOString().split('T')[0],
    documents: [],
    parentId: '',
    isAccessory: false,
    reference: '', manufacturer: '', vendor: '', pressure: 0,
    allowedOperations: [],
    image: ''
  };

  const [formData, setFormData] = useState<Partial<Asset>>(initialFormState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // --- FILTER LOGIC ---
  const filteredAssets = assets.filter(asset => {
    // 1. Search Text
    const term = searchTerm.toLowerCase();
    const matchesSearch = asset.name.toLowerCase().includes(term) || 
                          asset.code.toLowerCase().includes(term) ||
                          (asset.licensePlate && asset.licensePlate.toLowerCase().includes(term)) ||
                          (asset.reference && asset.reference.toLowerCase().includes(term)) ||
                          asset.brand.toLowerCase().includes(term);

    // 2. Status
    const matchesStatus = filterStatus === 'ALL' || asset.status === filterStatus;

    // 3. Category Type
    let matchesCategory = true;
    if (filterCategory === 'VEHICULO') matchesCategory = !asset.isAccessory && asset.category !== 'MAQUINARIA';
    if (filterCategory === 'MAQUINARIA') matchesCategory = !asset.isAccessory && asset.category === 'MAQUINARIA';
    if (filterCategory === 'ACCESORIO') matchesCategory = !!asset.isAccessory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.OPERATIVO: return 'bg-green-100 text-green-800 border-green-200';
      case AssetStatus.EN_TALLER: return 'bg-amber-100 text-amber-800 border-amber-200';
      case AssetStatus.AVERIADO: return 'bg-red-100 text-red-800 border-red-200';
      case AssetStatus.BAJA: return 'bg-gray-200 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleOpenModal = (asset?: Asset) => {
    setActiveTab('GENERAL');
    setNewDocData({
        file: null, name: '', category: 'OTRO', effectiveDate: new Date().toISOString().split('T')[0], expirationDate: '', noExpiry: false
    });

    if (asset) {
      // Editing Mode
      setEditingAssetId(asset.id);
      setFormData({ ...asset });
      setIsAccessoryMode(!!asset.isAccessory);
      setIsMachineryMode(asset.category === 'MAQUINARIA');
      // Determine if it was industrial based on fields or category
      // Simple heuristic: if it has pump brand or tank volume, it's industrial
      const isInd = !!(asset.pressurePumpBrand || asset.tankSludgeVolume || asset.vacuumPumpBrand);
      setIsIndustrialVehicle(isInd);

      setShowTypeSelection(false); 
      setVehicleSubStep(false);
    } else {
      // New Asset Mode
      setEditingAssetId(null);
      setFormData({ ...initialFormState });
      setShowTypeSelection(true); // Show selection screen first
      setVehicleSubStep(false);
    }
    setIsModalOpen(true);
  };

  const handleTypeSelect = (type: 'VEHICULO' | 'MAQUINARIA' | 'ACCESORIO') => {
      if (type === 'VEHICULO') {
          setVehicleSubStep(true); // Go to sub-selection
          return;
      }

      const isAcc = type === 'ACCESORIO';
      const isMach = type === 'MAQUINARIA';
      
      setIsAccessoryMode(isAcc);
      setIsMachineryMode(isMach);
      setIsIndustrialVehicle(false); // Machinery might have ind fields but handled differently
      
      setFormData(prev => ({
          ...prev,
          isAccessory: isAcc,
          category: type
      }));
      
      setShowTypeSelection(false);
  };

  const handleVehicleSubTypeSelect = (subtype: 'STANDARD' | 'INDUSTRIAL') => {
      setIsAccessoryMode(false);
      setIsMachineryMode(false);
      setIsIndustrialVehicle(subtype === 'INDUSTRIAL');
      
      setFormData(prev => ({
          ...prev,
          isAccessory: false,
          category: 'VEHICULO',
          // Pre-fill type based on selection to help user
          type: subtype === 'STANDARD' ? 'Coche' : 'Vehículo Mixto'
      }));

      setShowTypeSelection(false);
      setVehicleSubStep(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('delete', currentLang) + '?')) {
      await storageService.deleteAsset(id);
      onRefresh();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assetToSave: Asset = {
      id: editingAssetId || crypto.randomUUID(),
      ...formData as Asset,
      isAccessory: isAccessoryMode,
      category: isAccessoryMode ? 'ACCESORIO' : (isMachineryMode ? 'MAQUINARIA' : 'VEHICULO')
    };
    await storageService.saveAsset(assetToSave);
    setIsModalOpen(false);
    onRefresh();
  };

  // --- CSV TEMPLATE IN SPANISH & UPPERCASE ---
  const downloadTemplate = () => {
    const headers = [
        "CODIGO", "NOMBRE", "ES_ACCESORIO", "CATEGORIA", "TIPO", "MARCA", "MODELO", 
        "MATRICULA", "BASTIDOR", "REFERENCIA", "PRESION_BAR",
        "UBICACION", "HORAS_KM", "ESTADO", 
        "TITULARIDAD", "ANIO_FABRICACION", "PROXIMO_MANTENIMIENTO"
    ].join(',');
    
    // Example row
    const example = [
        "ACC-001", "EJEMPLO TOBERA", "TRUE", "ACCESORIO", "Tobera", "StoneAge", "Warthog", 
        "", "", "REF-999", "1200", 
        "Taller", "100", "OPERATIVO", 
        "PROPIO", "2023", "2024-06-01"
    ].join(',');

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "PLANTILLA_ACTIVOS_MANTENTPRO.csv");
    document.body.appendChild(link);
    link.click();
  };

  // --- IMPORT CSV MAPPING ---
  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      let count = 0;
      // Skip header (Assuming it maps by index order as in template, or logic could be smarter)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        
        // Mapping from the Spanish Template order
        const newAsset: Asset = {
          id: crypto.randomUUID(),
          code: cols[0] || `IMP-${Date.now()}`,
          name: cols[1] || 'Importado',
          isAccessory: cols[2]?.toUpperCase() === 'TRUE',
          category: cols[3] || 'VEHICULO',
          type: cols[4] || 'General',
          brand: cols[5] || '',
          model: cols[6] || '',
          licensePlate: cols[7] || '',
          vin: cols[8] || '',
          reference: cols[9] || '',
          pressure: Number(cols[10]) || 0,
          location: cols[11] || 'Base',
          hours: Number(cols[12]) || 0,
          status: (cols[13] as AssetStatus) || AssetStatus.OPERATIVO,
          ownership: (cols[14] as any) || 'PROPIO',
          manufactureYear: Number(cols[15]) || new Date().getFullYear(),
          nextMaintenance: cols[16] || new Date().toISOString(),
          lastMaintenance: new Date().toISOString(),
          documents: []
        };
        await storageService.saveAsset(newAsset);
        count++;
      }
      alert(`Importados correctamente: ${count}`);
      onRefresh();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrintList = () => {
    setPrintingAsset(null);
    setTimeout(() => window.print(), 100);
  };

  const handlePrintFicha = (asset: Asset) => {
      setPrintingAsset(asset);
      setTimeout(() => {
          window.print();
      }, 500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setNewDocData(prev => ({ ...prev, file: file, name: prev.name || file.name }));
    }
  };

  const handleMainPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, image: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const addDocument = () => {
    if (!newDocData.file || !newDocData.name) {
        alert(t('upload', currentLang));
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
        const newDoc: AssetDocument = {
            id: crypto.randomUUID(),
            name: newDocData.name,
            type: newDocData.file!.type.includes('image') ? 'IMAGE' : 'PDF',
            category: newDocData.category,
            url: reader.result as string,
            uploadDate: new Date().toISOString(),
            effectiveDate: newDocData.effectiveDate,
            expirationDate: newDocData.noExpiry ? undefined : newDocData.expirationDate,
            noExpiry: newDocData.noExpiry
        };
        setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), newDoc] }));
        setNewDocData({ file: null, name: '', category: 'OTRO', effectiveDate: new Date().toISOString().split('T')[0], expirationDate: '', noExpiry: false });
        if (docInputRef.current) docInputRef.current.value = '';
    };
    reader.readAsDataURL(newDocData.file);
  };

  const removeDocument = (docId: string) => {
    setFormData(prev => ({ ...prev, documents: prev.documents?.filter(d => d.id !== docId) }));
  };

  const handleSendDocsByEmail = (asset: Partial<Asset>) => {
      if (!asset.documents || asset.documents.length === 0) {
          alert("No hay documentos para enviar.");
          return;
      }
      
      const subject = `${t('emailSubject', currentLang)} ${asset.code} - ${asset.name}`;
      let body = `${t('emailBody', currentLang)} ${asset.name} (${asset.code})\n\n`;
      asset.documents.forEach((doc, idx) => {
          body += `${idx + 1}. [${t(`doc_${doc.category.toLowerCase()}` as any, currentLang) || doc.category}] ${doc.name}\n`;
      });
      body += `\nGenerado por MantentPro Industrial.`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const toggleOperation = (op: string) => {
      const current = formData.allowedOperations || [];
      if (current.includes(op)) {
          setFormData({ ...formData, allowedOperations: current.filter(o => o !== op) });
      } else {
          setFormData({ ...formData, allowedOperations: [...current, op] });
      }
  };

  return (
    <div className="space-y-6">
      {printingAsset && (
          <style>{`@media print { body > * { display: none !important; } .print-container-ficha { display: block !important; width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: white; z-index: 9999; } }`}</style>
      )}
      <div className={`print-container-ficha ${printingAsset ? 'block' : 'hidden'}`}>{printingAsset && <AssetPrintView asset={printingAsset} currentLang={currentLang} companyLogo={companyLogo} />}</div>

      <div className={printingAsset ? 'hidden print:hidden' : ''}>
        
        {/* HEADER */}
        <div className="flex flex-col gap-6 print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{t('assets', currentLang)}</h2>
                <p className="text-sm text-gray-500">Gestión de la Flota V.1.0</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button onClick={downloadTemplate} className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50">
                   <FileSpreadsheet size={18} /> PLANTILLA CSV
                </button>
                <div className="relative">
                    <input type="file" ref={fileInputRef} accept=".csv" onChange={handleBulkImport} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50">
                        <Upload size={18} /> {t('upload', currentLang)}
                    </button>
                </div>
                <button onClick={handlePrintList} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2">
                    <Printer size={18} /> {t('printReport', currentLang)}
                </button>
                <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105">
                    <Plus size={20} /> {t('newAsset', currentLang)}
                </button>
            </div>
            </div>

            {/* CATEGORY TABS (UPDATED) */}
            <div className="flex p-1 bg-gray-200 rounded-xl w-full md:w-fit self-start overflow-x-auto">
                <button onClick={() => setFilterCategory('ALL')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filterCategory === 'ALL' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <LayoutGrid size={16} /> Todo
                </button>
                <button onClick={() => setFilterCategory('VEHICULO')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filterCategory === 'VEHICULO' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Truck size={16} /> {t('category_vehicle', currentLang)}
                </button>
                <button onClick={() => setFilterCategory('MAQUINARIA')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filterCategory === 'MAQUINARIA' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <PenTool size={16} /> {t('category_machinery', currentLang)}
                </button>
                <button onClick={() => setFilterCategory('ACCESORIO')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filterCategory === 'ACCESORIO' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Layers size={16} /> {t('category_accessory', currentLang)}
                </button>
            </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center print:hidden mt-6">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="text" placeholder={t('search', currentLang)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="text-gray-400 h-5 w-5 hidden md:block" />
                <select className="w-full md:w-48 border border-gray-200 bg-gray-50 rounded-lg py-3 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="ALL">{t('status', currentLang)}: Todo</option>
                    {Object.values(AssetStatus).map(s => <option key={s} value={s}>{t(s as any, currentLang)}</option>)}
                </select>
            </div>
        </div>

        {/* ASSET GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:hidden mt-6">
            {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all group overflow-hidden flex flex-col">
                <div className="relative h-48 bg-gray-100 border-b border-gray-100 cursor-pointer" onClick={() => asset.image && setPreviewImage(asset.image)}>
                {asset.image ? (
                    <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 flex-col bg-slate-50">
                        <Image size={48} className="mb-2 opacity-50" />
                        <span className="text-xs font-medium">No Image</span>
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border shadow-sm ${getStatusColor(asset.status)}`}>{t(asset.status as any, currentLang)}</span>
                </div>
                {asset.isAccessory && (
                    <div className="absolute bottom-3 right-3 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <Layers size={12}/> ACC
                    </div>
                )}
                {!asset.isAccessory && asset.category === 'MAQUINARIA' && (
                     <div className="absolute bottom-3 right-3 bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <PenTool size={12}/> MAQ
                     </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleOpenModal(asset)} className="p-2 bg-white text-blue-600 rounded-lg shadow-md hover:bg-blue-50 transition-colors"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(asset.id)} className="p-2 bg-white text-red-600 rounded-lg shadow-md hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">{asset.name}</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">{asset.brand} {asset.model}</p>
                        </div>
                    </div>
                    <div className="mt-auto space-y-3">
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('code', currentLang)}</span>
                            <span className="text-sm font-mono font-bold text-gray-700">{asset.code}</span>
                        </div>
                        {asset.isAccessory ? (
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2 truncate"><Gauge size={14} className="text-purple-500 shrink-0" /><span className="truncate">{asset.pressure || 0} Bar</span></div>
                                <div className="flex items-center gap-2 justify-end"><ShoppingBag size={14} className="text-blue-500 shrink-0" /><span className="truncate">{asset.vendor || '-'}</span></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2 truncate"><MapPin size={14} className="text-blue-400 shrink-0" /><span className="truncate">{asset.location}</span></div>
                                <div className="flex items-center gap-2 justify-end"><Clock size={14} className="text-amber-500 shrink-0" /><span className="font-medium text-gray-700">{asset.hours.toLocaleString()} h</span></div>
                            </div>
                        )}
                        <button onClick={() => handlePrintFicha(asset)} className="w-full mt-2 py-2 bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                            <FileText size={14} /> PDF
                        </button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* --- IMAGE MODAL --- */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl w-full max-h-screen">
            <button className="absolute -top-12 right-0 text-white hover:text-gray-300" onClick={() => setPreviewImage(null)}><X size={32} /></button>
            <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {/* --- EDIT/CREATE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
            
            {/* Header */}
            <div className="px-8 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl">{editingAssetId ? <Edit className="text-blue-600" /> : <Plus className="text-blue-600" />}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                      {showTypeSelection 
                          ? (vehicleSubStep ? t('select_vehicle_subtype', currentLang) : t('select_asset_type', currentLang))
                          : (editingAssetId ? t('edit', currentLang) : (isAccessoryMode ? t('newAccessory', currentLang) : t('newAsset', currentLang)))
                      }
                  </h3>
                  {!showTypeSelection && (
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-lg mt-1 inline-block">
                        {isAccessoryMode ? t('category_accessory', currentLang) : (isMachineryMode ? t('category_machinery', currentLang) : t('category_vehicle', currentLang))}
                        {isIndustrialVehicle && ' (Industrial)'}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            {/* --- STEP 1: TYPE SELECTION SCREEN --- */}
            {showTypeSelection && !vehicleSubStep && (
                <div className="flex-1 p-8 bg-gray-50 overflow-y-auto flex items-center justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        <SelectionCard 
                            title={t('category_vehicle', currentLang)} 
                            desc={t('desc_vehicle', currentLang)} 
                            icon={Truck} 
                            color="bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-blue-600"
                            onClick={() => handleTypeSelect('VEHICULO')}
                        />
                        <SelectionCard 
                            title={t('category_machinery', currentLang)} 
                            desc={t('desc_machinery', currentLang)} 
                            icon={PenTool} 
                            color="bg-white border-gray-200 hover:border-orange-500 hover:bg-orange-50 text-orange-600"
                            onClick={() => handleTypeSelect('MAQUINARIA')}
                        />
                        <SelectionCard 
                            title={t('category_accessory', currentLang)} 
                            desc={t('desc_accessory', currentLang)} 
                            icon={Layers} 
                            color="bg-white border-gray-200 hover:border-purple-500 hover:bg-purple-50 text-purple-600"
                            onClick={() => handleTypeSelect('ACCESORIO')}
                        />
                    </div>
                </div>
            )}
            
            {/* --- STEP 1.5: VEHICLE SUB-TYPE SELECTION --- */}
            {showTypeSelection && vehicleSubStep && (
                <div className="flex-1 p-8 bg-gray-50 overflow-y-auto flex items-center justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                        <SelectionCard 
                            title={t('subtype_standard', currentLang)} 
                            desc={t('desc_std_fleet', currentLang)} 
                            icon={Truck} 
                            color="bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-blue-600"
                            onClick={() => handleVehicleSubTypeSelect('STANDARD')}
                        />
                        <SelectionCard 
                            title={t('subtype_industrial', currentLang)} 
                            desc={t('desc_ind_fleet', currentLang)} 
                            icon={Factory} 
                            color="bg-white border-gray-200 hover:border-orange-500 hover:bg-orange-50 text-orange-600"
                            onClick={() => handleVehicleSubTypeSelect('INDUSTRIAL')}
                        />
                    </div>
                </div>
            )}

            {/* --- STEP 2: FORM CONTENT --- */}
            {!showTypeSelection && (
            <>
                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-8 bg-gray-50/50">
                    {['GENERAL', 'TECHNICAL', 'LEGAL', 'DOCS', ...(isIndustrialVehicle ? ['OPERATIONS'] : [])].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 ${activeTab === tab ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg translate-y-[1px] shadow-[0_-1px_2px_rgba(0,0,0,0.05)]' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                        {tab === 'DOCS' ? t('documents', currentLang) : 
                         tab === 'OPERATIONS' ? t('operations', currentLang) : 
                         t(tab.toLowerCase() as any, currentLang)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 bg-white">
                <form id="assetForm" onSubmit={handleSubmit} className="space-y-6">
                    {/* TAB: GENERAL */}
                    {activeTab === 'GENERAL' && (
                        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* PHOTO UPLOADER */}
                            <div className="md:col-span-2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <input type="file" ref={photoInputRef} accept="image/*" className="hidden" onChange={handleMainPhotoSelect} />
                                {formData.image ? (
                                    <div className="relative group">
                                        <img src={formData.image} alt="Asset Main" className="h-40 w-auto object-contain rounded shadow-sm" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                                            <Camera className="text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                                        <Camera className="text-gray-400 mb-2" size={32} />
                                        <span className="text-sm font-bold text-gray-500">Subir Fotografía Principal</span>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2"><FormInput label={t('name', currentLang)} value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Camión Cisterna 04" required={true} icon={Tag} /></div>
                            <FormInput label={t('code', currentLang)} value={formData.code} onChange={(e: any) => setFormData({...formData, code: e.target.value})} placeholder="Ej: CAM-001" required={true} icon={Hash} />
                            
                            {/* STANDARD VEHICLE SPECIFIC */}
                            {!isIndustrialVehicle && !isMachineryMode && !isAccessoryMode && (
                                <>
                                    <div className="mb-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('vehicleConfig', currentLang)}</label>
                                        <select className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-50" value={formData.vehicleConfig} onChange={(e) => setFormData({...formData, vehicleConfig: e.target.value})}>
                                            <option value="">Seleccione...</option>
                                            <option value="Coche">Coche</option>
                                            <option value="Furgón 5 Plazas">Furgón 5 Plazas</option>
                                            <option value="Furgón 9 Plazas">Furgón 9 Plazas</option>
                                            <option value="Camión">Camión</option>
                                        </select>
                                    </div>
                                    <FormInput label={t('seats', currentLang)} value={formData.vehicleSeats} onChange={(e: any) => setFormData({...formData, vehicleSeats: Number(e.target.value)})} type="number" />
                                </>
                            )}
                            
                            {/* ASSET TYPE (General/Industrial) */}
                            {(isMachineryMode || isAccessoryMode || isIndustrialVehicle) && (
                                <div className="mb-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('assetType', currentLang)}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{isAccessoryMode ? <Layers className="text-purple-400 h-5 w-5"/> : (isMachineryMode ? <PenTool className="text-orange-400 h-5 w-5"/> : <Factory className="text-gray-400 h-5 w-5" />)}</div>
                                        <input list="types" className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white outline-none transition-all shadow-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="Seleccione..." />
                                        <datalist id="types">
                                            <option value="Vehículo Mixto" />
                                            <option value="Vehículo Bomba Presión" />
                                            <option value="Camión Cisterna" />
                                        </datalist>
                                    </div>
                                </div>
                            )}

                            <div className="mb-1">
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('status', currentLang)}</label>
                                <select className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-50" value={formData.status} onChange={(e: any) => setFormData({...formData, status: e.target.value as any})}>
                                    {Object.values(AssetStatus).map(s => <option key={s} value={s}>{t(s as any, currentLang)}</option>)}
                                </select>
                            </div>
                            
                            {/* Accessory Link */}
                            {isAccessoryMode && (
                                <div className="mb-1 md:col-span-2 bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <label className="block text-sm font-bold text-purple-900 mb-2 ml-1">{t('linkToParent', currentLang)}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon className="text-purple-400 h-5 w-5" /></div>
                                    <select className="w-full py-3 pl-10 pr-10 border border-purple-200 rounded-lg bg-white" value={formData.parentId || ''} onChange={e => setFormData({...formData, parentId: e.target.value})}>
                                    <option value="">-- {t('category_vehicle', currentLang)} / {t('category_machinery', currentLang)} --</option>
                                    {assets.filter(a => !a.isAccessory && a.id !== editingAssetId).map(a => (<option key={a.id} value={a.id}>{a.code} - {a.name}</option>))}
                                    </select>
                                </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* TAB: TECHNICAL (Complex Layout) */}
                    {activeTab === 'TECHNICAL' && (
                        <div className="animate-fade-in space-y-6">
                            {/* Basic Tech Data */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                                <FormInput label={t('brand', currentLang)} value={formData.brand} onChange={(e: any) => setFormData({...formData, brand: e.target.value})} placeholder="Ej: MAN" icon={ShieldCheck} />
                                <FormInput label={t('model', currentLang)} value={formData.model} onChange={(e: any) => setFormData({...formData, model: e.target.value})} placeholder="Ej: TGS 33.480" icon={Layers} />
                                {!isAccessoryMode && (
                                    <>
                                        <FormInput label={t('licensePlate', currentLang)} value={formData.licensePlate} onChange={(e: any) => setFormData({...formData, licensePlate: e.target.value})} placeholder="0000-XXX" icon={Truck} />
                                        <FormInput label={t('vin', currentLang)} value={formData.vin} onChange={(e: any) => setFormData({...formData, vin: e.target.value})} icon={FileCheck} />
                                        <FormInput label={t('hours', currentLang)} value={formData.hours} onChange={(e: any) => setFormData({...formData, hours: Number(e.target.value)})} type="number" icon={Clock} />
                                    </>
                                )}
                                <FormInput label={t('location', currentLang)} value={formData.location} onChange={(e: any) => setFormData({...formData, location: e.target.value})} icon={MapPin} />
                                <FormInput label={t('year', currentLang)} value={formData.manufactureYear} onChange={(e: any) => setFormData({...formData, manufactureYear: Number(e.target.value)})} type="number" icon={Calendar} />
                                
                                <div className="mb-1">
                                    <label className="block text-sm font-bold text-amber-700 mb-2 ml-1">{t('nextMaint', currentLang)} *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="text-amber-500 h-5 w-5" /></div>
                                        <input type="date" required value={formData.nextMaintenance} onChange={e => setFormData({...formData, nextMaintenance: e.target.value})} className="w-full py-3 pl-10 pr-4 border border-amber-300 rounded-lg bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* INDUSTRIAL SPECIFIC FIELDS */}
                            {isIndustrialVehicle && (
                                <>
                                    {/* 1. Pressure Unit */}
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <SectionHeader title={t('tech_pressure_unit', currentLang)} icon={Droplets} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput label={t('tech_pump_brand', currentLang)} value={formData.pressurePumpBrand} onChange={(e: any) => setFormData({...formData, pressurePumpBrand: e.target.value})} />
                                            <FormInput label={t('tech_pump_model', currentLang)} value={formData.pressurePumpModel} onChange={(e: any) => setFormData({...formData, pressurePumpModel: e.target.value})} />
                                            <FormInput label={t('tech_power', currentLang)} value={formData.auxMotorPower} onChange={(e: any) => setFormData({...formData, auxMotorPower: e.target.value})} />
                                            <FormInput label={t('tech_flow_max', currentLang)} value={formData.flowMax} onChange={(e: any) => setFormData({...formData, flowMax: Number(e.target.value)})} type="number" />
                                            <FormInput label={t('tech_pressure_max', currentLang)} value={formData.pressureMax} onChange={(e: any) => setFormData({...formData, pressureMax: Number(e.target.value)})} type="number" />
                                            <div className="flex items-center mt-6 gap-2">
                                                <input type="checkbox" checked={formData.pneumaticRegulator} onChange={(e) => setFormData({...formData, pneumaticRegulator: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                                                <label className="text-sm font-bold text-gray-700">{t('tech_pneu_reg', currentLang)}</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Vacuum Unit */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <SectionHeader title={t('tech_vacuum_unit', currentLang)} icon={Wind} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput label={t('tech_pump_brand', currentLang)} value={formData.vacuumPumpBrand} onChange={(e: any) => setFormData({...formData, vacuumPumpBrand: e.target.value})} />
                                            <FormInput label={t('tech_pump_model', currentLang)} value={formData.vacuumPumpModel} onChange={(e: any) => setFormData({...formData, vacuumPumpModel: e.target.value})} />
                                            <FormInput label={t('tech_vac_type', currentLang)} value={formData.vacuumType} onChange={(e: any) => setFormData({...formData, vacuumType: e.target.value})} placeholder="Ej: Anillo Líquido" />
                                            <FormInput label={t('tech_vac_flow', currentLang)} value={formData.vacuumFlow} onChange={(e: any) => setFormData({...formData, vacuumFlow: Number(e.target.value)})} type="number" />
                                            <FormInput label={t('tech_power', currentLang)} value={formData.vacuumPower} onChange={(e: any) => setFormData({...formData, vacuumPower: e.target.value})} />
                                            <FormInput label={t('tech_vac_gen', currentLang)} value={formData.vacuumGenerated} onChange={(e: any) => setFormData({...formData, vacuumGenerated: Number(e.target.value)})} type="number" />
                                        </div>
                                    </div>

                                    {/* 3. Weights */}
                                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                        <SectionHeader title={t('tech_weights', currentLang)} icon={Scale} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput label={t('tech_tare', currentLang)} value={formData.tare} onChange={(e: any) => setFormData({...formData, tare: Number(e.target.value)})} type="number" />
                                            <FormInput label={t('tech_pma', currentLang)} value={formData.pma} onChange={(e: any) => setFormData({...formData, pma: Number(e.target.value)})} type="number" />
                                            <FormInput label={t('tech_payload', currentLang)} value={formData.payload} onChange={(e: any) => setFormData({...formData, payload: Number(e.target.value)})} type="number" />
                                            <FormInput label={t('tech_eq_type', currentLang)} value={formData.equipmentType} onChange={(e: any) => setFormData({...formData, equipmentType: e.target.value})} />
                                        </div>
                                    </div>

                                    {/* 4. Tanks */}
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                        <SectionHeader title={t('tech_tanks', currentLang)} icon={Container} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput label={t('tech_tank_sludge', currentLang)} value={formData.tankSludgeVolume} onChange={(e: any) => setFormData({...formData, tankSludgeVolume: Number(e.target.value)})} type="number" />
                                            <FormInput label={t('tech_tank_water', currentLang)} value={formData.tankWaterVolume} onChange={(e: any) => setFormData({...formData, tankWaterVolume: Number(e.target.value)})} type="number" />
                                            <FormInput label={t('tech_tank_mat', currentLang)} value={formData.tankMaterial} onChange={(e: any) => setFormData({...formData, tankMaterial: e.target.value})} />
                                            <FormInput label={t('tech_fill_max', currentLang)} value={formData.tankMaxFill} onChange={(e: any) => setFormData({...formData, tankMaxFill: Number(e.target.value)})} type="number" />
                                        </div>
                                    </div>

                                    {/* 5. Other */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <SectionHeader title={t('tech_other', currentLang)} icon={Settings} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-2">
                                                    <input type="checkbox" checked={formData.tipping} onChange={(e) => setFormData({...formData, tipping: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                                                    <span className="text-sm text-gray-700">{t('tech_tipping', currentLang)}</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input type="checkbox" checked={formData.adr} onChange={(e) => setFormData({...formData, adr: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                                                    <span className="text-sm text-gray-700">{t('tech_adr', currentLang)}</span>
                                                </label>
                                            </div>
                                            <FormInput label={t('tech_inclination', currentLang)} value={formData.maxInclination} onChange={(e: any) => setFormData({...formData, maxInclination: Number(e.target.value)})} type="number" />
                                            <FormInput label={t('tech_aux_motor', currentLang)} value={formData.auxMotorBrand} onChange={(e: any) => setFormData({...formData, auxMotorBrand: e.target.value})} placeholder="Marca / Modelo" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB: OPERATIONS (CHECKLIST) */}
                    {activeTab === 'OPERATIONS' && (
                        <div className="animate-fade-in p-6 bg-gray-50 rounded-xl border border-gray-200">
                             <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                 <CheckSquare className="text-green-600" /> {t('tech_operations', currentLang)}
                             </h4>
                             <div className="grid grid-cols-1 gap-2">
                                 {OPERATIONS_CHECKLIST.map((op, idx) => {
                                     const isChecked = formData.allowedOperations?.includes(op) || false;
                                     return (
                                         <label key={idx} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                             <input 
                                                 type="checkbox" 
                                                 className="mt-1 w-5 h-5 text-green-600 rounded"
                                                 checked={isChecked}
                                                 onChange={() => toggleOperation(op)}
                                             />
                                             <span className={`text-sm ${isChecked ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{op}</span>
                                         </label>
                                     );
                                 })}
                             </div>
                        </div>
                    )}

                    {/* TAB: LEGAL */}
                    {activeTab === 'LEGAL' && (
                        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="mb-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('ownership', currentLang)}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Info className="text-gray-400 h-5 w-5" /></div>
                                <select className="w-full py-3 pl-10 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white outline-none transition-all shadow-sm appearance-none" value={formData.ownership} onChange={(e: any) => setFormData({...formData, ownership: e.target.value as any})}>
                                <option value="PROPIO">Propio</option><option value="RENTING">Renting</option><option value="LEASING">Leasing</option><option value="ALQUILADO">Alquiler Temporal</option>
                                </select>
                            </div>
                            </div>
                            <FormInput label={t('acquisition', currentLang)} value={formData.acquisitionYear} onChange={(e: any) => setFormData({...formData, acquisitionYear: Number(e.target.value)})} type="number" icon={Calendar} />
                            <div className="md:col-span-2"><FormInput label={t('responsible', currentLang)} value={formData.responsible} onChange={(e: any) => setFormData({...formData, responsible: e.target.value})} placeholder="Ej: Juan Pérez" icon={Tag} /></div>
                        </div>
                    )}
                    {/* TAB: DOCS */}
                    {activeTab === 'DOCS' && (
                        <div className="animate-fade-in space-y-6">
                        
                        {/* EMAIL BUTTON */}
                        {formData.documents && formData.documents.length > 0 && (
                            <div className="flex justify-end">
                                <button type="button" onClick={() => handleSendDocsByEmail(formData)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                    <Mail size={16} /> {t('sendEmail', currentLang)}
                                </button>
                            </div>
                        )}

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Paperclip size={18} /> {t('upload', currentLang)}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                        <FormInput label={t('name', currentLang)} value={newDocData.name} onChange={(e: any) => setNewDocData({...newDocData, name: e.target.value})} placeholder="Doc Name..." required />
                                </div>
                                <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Categoría</label>
                                        <select className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-white" value={newDocData.category} onChange={(e) => setNewDocData({...newDocData, category: e.target.value as AssetDocCategory})}>
                                            {/* Dynamic Doc List based on Type (Though keeping all is simpler for user) */}
                                            <optgroup label="Vehículo / Maquinaria">
                                                <option value="SEGURO">{t('doc_seguro', currentLang)}</option>
                                                <option value="ITV">{t('doc_itv', currentLang)}</option>
                                                <option value="FICHA_TECNICA">{t('doc_ficha', currentLang)}</option>
                                                <option value="PERMISO_CIRCULACION">{t('doc_permiso', currentLang)}</option>
                                                <option value="CERTIFICADO_ATP">{t('doc_atp', currentLang)}</option>
                                            </optgroup>
                                            <optgroup label="Técnico / Pruebas">
                                                <option value="MANUAL_MANTENIMIENTO">{t('doc_manual', currentLang)}</option>
                                                <option value="MARCADO_CE">{t('doc_ce', currentLang)}</option>
                                                <option value="CHECKLIST_REVISION">{t('doc_checklist', currentLang)}</option>
                                                <option value="PRUEBA_PRESION">{t('doc_presion', currentLang)}</option>
                                                <option value="PRUEBA_VACIO">{t('doc_vacio', currentLang)}</option>
                                                <option value="REVISION_VISUAL">{t('doc_visual', currentLang)}</option>
                                            </optgroup>
                                            <optgroup label="General">
                                                <option value="FOTO">{t('doc_foto', currentLang)}</option>
                                                <option value="OTRO">{t('doc_otro', currentLang)}</option>
                                            </optgroup>
                                        </select>
                                </div>
                                <div>
                                        <FormInput type="date" label="Vigencia" value={newDocData.effectiveDate} onChange={(e: any) => setNewDocData({...newDocData, effectiveDate: e.target.value})} />
                                </div>
                                <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-bold text-gray-700 ml-1">Vencimiento</label>
                                            <label className="flex items-center text-xs text-gray-500 cursor-pointer">
                                                <input type="checkbox" className="mr-1" checked={newDocData.noExpiry} onChange={(e) => setNewDocData({...newDocData, noExpiry: e.target.checked})} />
                                                N/A
                                            </label>
                                        </div>
                                        <input type="date" className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100" value={newDocData.expirationDate} onChange={(e) => setNewDocData({...newDocData, expirationDate: e.target.value})} disabled={newDocData.noExpiry} />
                                </div>
                                <div className="flex items-end">
                                    <div className="relative w-full">
                                        <input type="file" ref={docInputRef} onChange={handleFileSelect} className="hidden" id="file-upload" />
                                        <label htmlFor="file-upload" className={`w-full py-3 px-4 border border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${newDocData.file ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                                            {newDocData.file ? <span className="truncate max-w-[200px]">{newDocData.file.name}</span> : <span><Upload size={16} className="inline mr-2"/> Seleccionar</span>}
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button type="button" onClick={addDocument} className="mt-4 w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2" disabled={!newDocData.file || !newDocData.name}>
                                <Plus size={18} /> {t('save', currentLang)}
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {formData.documents && formData.documents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                {formData.documents.map((doc, idx) => (
                                    <div key={idx} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-xl border border-gray-200 shadow-sm gap-4">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20}/></div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-500">{t(`doc_${doc.category.toLowerCase()}` as any, currentLang) || doc.category}</p>
                                        </div>
                                        </div>
                                        <div className="flex gap-2">
                                        <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Visualizar">
                                            <Eye size={18} />
                                        </a>
                                        <a href={doc.url} download={doc.name} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Descargar">
                                            <Download size={18} />
                                        </a>
                                        <button type="button" onClick={() => removeDocument(doc.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            ) : ( <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100"><p className="text-sm text-gray-400">Empty</p></div> )}
                        </div>
                        </div>
                    )}
                </form>
                </div>
                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-100 transition-all">{t('cancel', currentLang)}</button>
                <button type="submit" form="assetForm" className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">{t('save', currentLang)}</button>
                </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetList;
