
import React, { useState, useRef, useEffect } from 'react';
import { Asset, AssetStatus, Language, AssetDocument, AssetDocCategory } from '../types';
import { Search, Filter, MapPin, Calendar, Clock, Plus, Edit, Trash2, X, FileText, Image, Link as LinkIcon, Upload, Download, Tag, Hash, Truck, AlertCircle, Info, FileCheck, Layers, ShieldCheck, PenTool, LayoutGrid, Printer, FileSpreadsheet, Paperclip, Gauge, Factory, ShoppingBag, Eye, Mail, ChevronRight, Droplets, Wind, Scale, Container, Settings, CheckSquare, Camera, ArrowLeft, Table } from 'lucide-react';
import { t } from '../services/translations';
import { storageService } from '../services/storage';
import * as XLSX from 'xlsx';

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

// --- UI COMPONENTS ---

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

// --- REPORT VIEWS ---

interface ReportViewProps {
  assets?: Asset[]; // Optional for single asset view
  asset?: Asset;    // Optional for general report
  currentLang: Language;
  companyLogo: string | null;
  onClose: () => void;
}

// 1. SINGLE ASSET FICHA TÉCNICA (Existing)
const FieldBlock = ({ label, value, full = false }: { label: string, value: any, full?: boolean }) => (
    <div className={`flex flex-col border-b border-gray-200 pb-1 ${full ? 'col-span-full' : ''}`}>
        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">{label}</span>
        <span className="text-xs font-bold text-slate-800 break-words">{value !== undefined && value !== null && value !== '' ? String(value) : '-'}</span>
    </div>
);

const SectionTitle = ({ title, icon: Icon }: { title: string, icon?: any }) => (
    <div className="col-span-full bg-slate-100 border-l-4 border-slate-700 px-3 py-1.5 mt-4 mb-2 flex items-center gap-2 print:bg-gray-100">
        {Icon && <Icon size={14} className="text-slate-700" />}
        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide">{title}</h3>
    </div>
);

const AssetPrintView = ({ asset, currentLang, companyLogo, onClose }: { asset: Asset, currentLang: Language, companyLogo: string|null, onClose: () => void }) => (
    <div className="fixed inset-0 bg-white z-[9999] overflow-auto">
        <div className="print:hidden sticky top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center shadow-lg z-50">
            <div className="flex items-center gap-4">
                <button onClick={onClose} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold transition-colors">
                    <ArrowLeft size={20} /> Volver
                </button>
                <span className="font-mono text-sm text-slate-300">Vista Previa de Impresión</span>
            </div>
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2">
                <Printer size={20} /> Imprimir Ficha
            </button>
        </div>
        <div className="max-w-[210mm] mx-auto bg-white p-8 md:p-10 print:p-0 print:max-w-none text-slate-900 print:w-full">
            {/* ... Content of Single Asset Ficha ... */}
            <header className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex items-center gap-4">
                    {companyLogo ? <img src={companyLogo} alt="Logo" className="h-16 w-auto object-contain" /> : <div className="h-16 w-16 bg-slate-200 flex items-center justify-center font-bold text-xs">LOGO</div>}
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">Ficha Técnica de Activo</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gestión de Mantenimiento e Inventario</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Código de Inventario</div>
                    <div className="text-3xl font-mono font-black text-slate-900">{asset.code}</div>
                    <div className="text-[9px] text-slate-400 mt-1">{new Date().toLocaleString()}</div>
                </div>
            </header>
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
                    <div className="aspect-[4/3] w-full bg-slate-50 border border-slate-200 flex items-center justify-center relative overflow-hidden rounded-sm">
                        {asset.image ? <img src={asset.image} className="w-full h-full object-cover" alt="Asset" /> : <span className="text-slate-300 text-xs font-bold uppercase">Sin Imagen</span>}
                        <div className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase border ${asset.status === 'OPERATIVO' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>{asset.status}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 border-b border-slate-200 pb-1">Identificación Principal</h4>
                        <div className="space-y-3">
                            <FieldBlock label="Nombre / Descripción" value={asset.name} />
                            <FieldBlock label="Marca" value={asset.brand} />
                            <FieldBlock label="Modelo" value={asset.model} />
                            <FieldBlock label="Tipo / Categoría" value={`${asset.category} - ${asset.type}`} />
                            <FieldBlock label="Ubicación Actual" value={asset.location} />
                            <FieldBlock label="Horómetro / KM" value={`${asset.hours.toLocaleString()} h`} />
                        </div>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-8">
                    <div className="grid grid-cols-4 gap-x-4 gap-y-3">
                        <SectionTitle title="Especificaciones del Chasis / Vehículo" icon={Truck} />
                        <FieldBlock label="Matrícula" value={asset.licensePlate} />
                        <FieldBlock label="Nº Bastidor (VIN)" value={asset.vin} full={true} />
                        <FieldBlock label="Año Fabricación" value={asset.manufactureYear} />
                        <FieldBlock label="Año Adquisición" value={asset.acquisitionYear} />
                        <FieldBlock label="Configuración" value={asset.vehicleConfig} />
                        <FieldBlock label="Nº Plazas" value={asset.vehicleSeats} />
                        <FieldBlock label="Tara (Kg)" value={asset.tare} />
                        <FieldBlock label="P.M.A (Kg)" value={asset.pma} />
                        <FieldBlock label="Carga Útil (Kg)" value={asset.payload} />
                        <FieldBlock label="Inclinación Máx." value={asset.maxInclination ? `${asset.maxInclination}º` : ''} />
                        <FieldBlock label="Basculante" value={asset.tipping ? 'SÍ' : 'NO'} />
                        <FieldBlock label="Motor Auxiliar" value={`${asset.auxMotorBrand || ''} ${asset.auxMotorModel || ''} ${asset.auxMotorPower || ''}`} />
                        {asset.isAccessory && (
                            <>
                                <SectionTitle title="Datos de Accesorio" icon={Layers} />
                                <FieldBlock label="Referencia / Serie" value={asset.reference} />
                                <FieldBlock label="Fabricante" value={asset.manufacturer} />
                                <FieldBlock label="Proveedor" value={asset.vendor} />
                                <FieldBlock label="Presión Trabajo" value={asset.pressure ? `${asset.pressure} Bar` : ''} />
                            </>
                        )}
                        {(!asset.isAccessory && (asset.pressurePumpBrand || asset.vacuumPumpBrand || asset.tankSludgeVolume)) && (
                            <>
                                <SectionTitle title="Equipamiento Industrial (Limpieza Técnica)" icon={Factory} />
                                <div className="col-span-4 grid grid-cols-4 gap-4 bg-blue-50/50 p-2 border border-blue-100 rounded-sm">
                                    <div className="col-span-4 text-[10px] font-bold text-blue-700 uppercase mb-1">Sistema de Alta Presión</div>
                                    <FieldBlock label="Marca Bomba" value={asset.pressurePumpBrand} />
                                    <FieldBlock label="Modelo Bomba" value={asset.pressurePumpModel} />
                                    <FieldBlock label="Presión Máx (Bar)" value={asset.pressureMax} />
                                    <FieldBlock label="Caudal Máx (L/min)" value={asset.flowMax} />
                                    <FieldBlock label="Regulador Neumático" value={asset.pneumaticRegulator ? 'SÍ' : 'NO'} />
                                    <FieldBlock label="Potencia" value={asset.auxMotorPower} />
                                </div>
                                <div className="col-span-4 grid grid-cols-4 gap-4 bg-orange-50/50 p-2 border border-orange-100 rounded-sm mt-1">
                                    <div className="col-span-4 text-[10px] font-bold text-orange-700 uppercase mb-1">Sistema de Vacío / Succión</div>
                                    <FieldBlock label="Marca Depresor" value={asset.vacuumPumpBrand} />
                                    <FieldBlock label="Modelo" value={asset.vacuumPumpModel} />
                                    <FieldBlock label="Tipo" value={asset.vacuumType} />
                                    <FieldBlock label="Caudal (m³/h)" value={asset.vacuumFlow} />
                                    <FieldBlock label="Potencia Absorbida" value={asset.vacuumPower} />
                                    <FieldBlock label="Vacío Generado" value={asset.vacuumGenerated} />
                                </div>
                                <div className="col-span-4 grid grid-cols-4 gap-4 bg-green-50/50 p-2 border border-green-100 rounded-sm mt-1">
                                    <div className="col-span-4 text-[10px] font-bold text-green-700 uppercase mb-1">Capacidad de Cisternas y Carga</div>
                                    <FieldBlock label="Vol. Lodos (L)" value={asset.tankSludgeVolume} />
                                    <FieldBlock label="Vol. Agua (L)" value={asset.tankWaterVolume} />
                                    <FieldBlock label="Material" value={asset.tankMaterial} />
                                    <FieldBlock label="Certificación ADR" value={asset.adr ? 'SÍ (Mercancías Peligrosas)' : 'NO'} />
                                    <FieldBlock label="Llenado Máximo" value={asset.tankMaxFill ? `${asset.tankMaxFill}%` : ''} />
                                    <FieldBlock label="Tipo Equipo" value={asset.equipmentType} />
                                </div>
                            </>
                        )}
                        <SectionTitle title="Gestión Administrativa y Mantenimiento" icon={Info} />
                        <FieldBlock label="Titularidad" value={asset.ownership} />
                        <FieldBlock label="Responsable Asignado" value={asset.responsible} />
                        <FieldBlock label="Último Mantenimiento" value={asset.lastMaintenance} />
                        <FieldBlock label="Próximo Vencimiento" value={asset.nextMaintenance} />
                    </div>
                </div>
                <div className="col-span-12 grid grid-cols-2 gap-8 mt-4 border-t border-slate-300 pt-6">
                    <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 mb-3 flex items-center gap-2"><Paperclip size={14}/> Documentación Legal y Técnica</h4>
                        <table className="w-full text-[10px] border border-slate-200">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                                <tr>
                                    <th className="p-2 text-left">Documento / Categoría</th>
                                    <th className="p-2 text-center">Vigencia (Inicio)</th>
                                    <th className="p-2 text-center">Vencimiento</th>
                                    <th className="p-2 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {asset.documents && asset.documents.length > 0 ? asset.documents.map((doc, i) => {
                                    const isExpired = doc.expirationDate && new Date(doc.expirationDate) < new Date();
                                    return (
                                        <tr key={i}>
                                            <td className="p-2 font-medium">{doc.name} <span className="text-slate-400 block text-[9px]">{doc.category}</span></td>
                                            <td className="p-2 text-center">{doc.effectiveDate || '-'}</td>
                                            <td className="p-2 text-center font-mono">{doc.noExpiry ? 'PERMANENTE' : (doc.expirationDate || '-')}</td>
                                            <td className="p-2 text-center">
                                                {doc.noExpiry ? <span className="text-green-600 font-bold">VIGENTE</span> : 
                                                 (isExpired ? <span className="text-red-600 font-bold bg-red-50 px-1 rounded">CADUCADO</span> : <span className="text-green-600 font-bold">VIGENTE</span>)}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={4} className="p-3 text-center text-slate-400 italic">No hay documentos registrados</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 mb-3 flex items-center gap-2"><CheckSquare size={14}/> Operaciones Autorizadas</h4>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm min-h-[150px]">
                            {asset.allowedOperations && asset.allowedOperations.length > 0 ? (
                                <ul className="grid grid-cols-1 gap-1">
                                    {asset.allowedOperations.map((op, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[10px] text-slate-700">
                                            <div className="mt-0.5 w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                                            {op}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="text-slate-400 text-[10px] italic">No se han definido operaciones específicas para este equipo.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t-2 border-slate-800 mt-8 pt-4 flex justify-between items-center text-[9px] text-slate-500 print:fixed print:bottom-4 print:left-8 print:right-8 print:border-t print:bg-white">
                <div>
                    <p className="font-bold text-slate-700">MANTENTPRO INDUSTRIAL - GESTIÓN DE ACTIVOS v1.0</p>
                    <p>Informe generado automáticamente. Este documento es de uso interno exclusivo.</p>
                </div>
                <div className="text-right">
                    <p>ID Sistema: <span className="font-mono">{asset.id}</span></p>
                    <p>Página 1 de 1</p>
                </div>
            </div>
        </div>
    </div>
);

// 2. GENERAL ASSETS REPORT (New)
const AssetsGeneralReport = ({ assets, companyLogo, onClose }: { assets: Asset[], companyLogo: string|null, onClose: () => void }) => (
    <div className="fixed inset-0 bg-white z-[9999] overflow-auto">
        <div className="print:hidden sticky top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center shadow-lg z-50">
            <div className="flex items-center gap-4">
                <button onClick={onClose} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold transition-colors">
                    <ArrowLeft size={20} /> Volver
                </button>
                <span className="font-mono text-sm text-slate-300">Informe General de Flota</span>
            </div>
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2">
                <Printer size={20} /> Imprimir Informe General
            </button>
        </div>

        <div className="w-full bg-white p-8 print:p-4 print:w-full print:landscape-mode">
            {/* Header */}
            <div className="flex justify-between items-end border-b-4 border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-6">
                    {companyLogo ? <img src={companyLogo} alt="Logo" className="h-16 w-auto object-contain" /> : <div className="h-16 w-16 bg-slate-200 flex items-center justify-center font-bold text-xs">LOGO</div>}
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Listado General de Activos</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Inventario Completo de Flota y Maquinaria</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase">Fecha de Emisión</p>
                    <p className="text-xl font-mono font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-800 text-white text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-3 rounded-tl-lg">Código / ID</th>
                        <th className="p-3">Descripción Activo</th>
                        <th className="p-3">Categoría / Tipo</th>
                        <th className="p-3">Identificación</th>
                        <th className="p-3">Estado / Ubicación</th>
                        <th className="p-3 w-1/4">Especificaciones Clave</th>
                        <th className="p-3 text-center rounded-tr-lg">Admin</th>
                    </tr>
                </thead>
                <tbody className="text-[10px] text-slate-700 divide-y divide-slate-200 border-b border-slate-200">
                    {assets.map((asset, idx) => (
                        <tr key={asset.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 break-inside-avoid'}>
                            <td className="p-3 font-mono font-bold text-slate-900 align-top">{asset.code}</td>
                            <td className="p-3 align-top">
                                <div className="font-bold text-sm">{asset.name}</div>
                                <div className="text-slate-500">{asset.brand} {asset.model}</div>
                            </td>
                            <td className="p-3 align-top">
                                <span className="block font-bold">{asset.category}</span>
                                <span className="block text-slate-500 italic">{asset.type}</span>
                            </td>
                            <td className="p-3 align-top">
                                <div className="space-y-1">
                                    {asset.licensePlate && <div className="bg-yellow-50 border border-yellow-200 px-1 rounded inline-block font-mono font-bold">{asset.licensePlate}</div>}
                                    {asset.vin && <div className="text-[9px] text-slate-400">VIN: {asset.vin}</div>}
                                    {asset.reference && <div className="text-[9px] text-slate-400">Ref: {asset.reference}</div>}
                                </div>
                            </td>
                            <td className="p-3 align-top">
                                <span className={`inline-block px-2 py-0.5 rounded font-bold text-[9px] mb-1 ${
                                    asset.status === 'OPERATIVO' ? 'bg-green-100 text-green-800' : 
                                    asset.status === 'AVERIADO' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>{asset.status}</span>
                                <div className="flex items-center gap-1 text-slate-600"><MapPin size={10}/> {asset.location}</div>
                            </td>
                            <td className="p-3 align-top text-[9px] leading-tight text-slate-600">
                                {/* Smart Summary of Tech Specs */}
                                {asset.pressureMax && <div>Presión: <b>{asset.pressureMax} Bar</b> / {asset.flowMax} L/min</div>}
                                {asset.vacuumFlow && <div>Vacío: <b>{asset.vacuumFlow} m³/h</b> ({asset.vacuumType})</div>}
                                {(asset.tankSludgeVolume || asset.tankWaterVolume) && <div>Cisterna: Lodos <b>{asset.tankSludgeVolume}L</b> / Agua <b>{asset.tankWaterVolume}L</b></div>}
                                {asset.adr && <div className="text-red-600 font-bold">ADR / Mercancías Peligrosas</div>}
                                {asset.pma && <div>Pesos: Tara {asset.tare}kg / PMA {asset.pma}kg</div>}
                                {asset.pressure && <div>Presión Trabajo: {asset.pressure} Bar</div>}
                            </td>
                            <td className="p-3 align-top text-center">
                                <div className="font-bold">{asset.manufactureYear}</div>
                                <div className="text-slate-400">{asset.ownership}</div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Summary Footer */}
            <div className="mt-8 flex gap-8 border-t-2 border-slate-800 pt-4 break-inside-avoid">
                <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Total Activos</span>
                    <span className="text-2xl font-black text-slate-900">{assets.length}</span>
                </div>
                <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Operativos</span>
                    <span className="text-2xl font-black text-green-600">{assets.filter(a => a.status === AssetStatus.OPERATIVO).length}</span>
                </div>
                <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500">En Taller / Avería</span>
                    <span className="text-2xl font-black text-red-600">{assets.filter(a => a.status !== AssetStatus.OPERATIVO).length}</span>
                </div>
            </div>
            
            <div className="mt-8 text-center text-[10px] text-slate-400">
                <p>MantentPro Industrial - Informe Generado el {new Date().toLocaleString()}</p>
            </div>
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
  const [showGeneralReport, setShowGeneralReport] = useState(false); // NEW STATE FOR GENERAL REPORT
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

  // --- EXCEL TEMPLATE GENERATION ---
  const downloadTemplate = () => {
    const headers = [
        "CODIGO", "NOMBRE", "MARCA", "MODELO", "MATRICULA", "BASTIDOR", "CATEGORIA", "TIPO", 
        "ESTADO", "UBICACION", "HORAS", "TITULARIDAD", "RESPONSABLE", 
        "ANIO_FABRICACION", "ANIO_ADQUISICION", "PROXIMO_MANTENIMIENTO", 
        "ES_ACCESORIO", "REFERENCIA", "FABRICANTE", "PROVEEDOR", "PRESION_TRABAJO",
        "CONFIGURACION_VEHICULO", "PLAZAS", 
        "MARCA_BOMBA_PRESION", "MODELO_BOMBA_PRESION", "PRESION_MAX", "CAUDAL_MAX", "REGULADOR_NEUMATICO",
        "MARCA_DEPRESOR", "MODELO_DEPRESOR", "TIPO_DEPRESOR", "CAUDAL_DEPRESOR", "VACIO_GENERADO",
        "VOLUMEN_LODOS", "VOLUMEN_AGUA", "MATERIAL_CISTERNA", "ADR", "BASCULANTE",
        "TARA", "PMA", "CARGA_UTIL"
    ];

    const example = [
        "ACC-001", "EJEMPLO TOBERA", "StoneAge", "Warthog", "", "", "ACCESORIO", "Tobera",
        "OPERATIVO", "Taller", "100", "PROPIO", "Juan Perez",
        "2023", "2023", "2024-06-01",
        "TRUE", "REF-999", "StoneAge", "Proveedor X", "1200",
        "", "",
        "", "", "", "", "",
        "", "", "", "", "",
        "", "", "", "", "",
        "", "", ""
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    
    // Set some basic column widths
    ws['!cols'] = headers.map(() => ({ wch: 20 }));

    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Activos");
    XLSX.writeFile(wb, "PLANTILLA_CARGA_ACTIVOS.xlsx");
  };

  // --- EXCEL IMPORT MAPPING ---
  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Get data as array of arrays (header: 1 to ensure order)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length < 2) {
                alert("El archivo parece vacío o no tiene datos.");
                return;
            }

            let count = 0;
            // Iterate starting from row 1 (index 1), row 0 is header
            for (let i = 1; i < jsonData.length; i++) {
                const cols = jsonData[i];
                if (!cols || cols.length === 0) continue;

                // Map columns based on template order
                const newAsset: Asset = {
                  id: crypto.randomUUID(),
                  code: String(cols[0] || `IMP-${Date.now()}-${i}`),
                  name: String(cols[1] || 'Importado'),
                  brand: String(cols[2] || ''),
                  model: String(cols[3] || ''),
                  licensePlate: String(cols[4] || ''),
                  vin: String(cols[5] || ''),
                  category: String(cols[6] || 'VEHICULO'),
                  type: String(cols[7] || 'General'),
                  status: (cols[8] as AssetStatus) || AssetStatus.OPERATIVO,
                  location: String(cols[9] || 'Base'),
                  hours: Number(cols[10]) || 0,
                  ownership: (cols[11] as any) || 'PROPIO',
                  responsible: String(cols[12] || ''),
                  manufactureYear: Number(cols[13]) || new Date().getFullYear(),
                  acquisitionYear: Number(cols[14]) || new Date().getFullYear(),
                  nextMaintenance: String(cols[15] || new Date().toISOString()),
                  lastMaintenance: new Date().toISOString(),
                  
                  isAccessory: String(cols[16]).toUpperCase() === 'TRUE',
                  reference: String(cols[17] || ''),
                  manufacturer: String(cols[18] || ''),
                  vendor: String(cols[19] || ''),
                  pressure: Number(cols[20]) || 0,
                  
                  vehicleConfig: String(cols[21] || ''),
                  vehicleSeats: Number(cols[22]) || 0,
                  
                  pressurePumpBrand: String(cols[23] || ''),
                  pressurePumpModel: String(cols[24] || ''),
                  pressureMax: Number(cols[25]) || 0,
                  flowMax: Number(cols[26]) || 0,
                  pneumaticRegulator: String(cols[27]).toUpperCase() === 'TRUE',
                  
                  vacuumPumpBrand: String(cols[28] || ''),
                  vacuumPumpModel: String(cols[29] || ''),
                  vacuumType: String(cols[30] || ''),
                  vacuumFlow: Number(cols[31]) || 0,
                  vacuumGenerated: Number(cols[32]) || 0,
                  
                  tankSludgeVolume: Number(cols[33]) || 0,
                  tankWaterVolume: Number(cols[34]) || 0,
                  tankMaterial: String(cols[35] || ''),
                  adr: String(cols[36]).toUpperCase() === 'TRUE',
                  tipping: String(cols[37]).toUpperCase() === 'TRUE',
                  
                  tare: Number(cols[38]) || 0,
                  pma: Number(cols[39]) || 0,
                  payload: Number(cols[40]) || 0,

                  documents: []
                };
                await storageService.saveAsset(newAsset);
                count++;
            }
            
            alert(`Importados correctamente: ${count} activos.`);
            onRefresh();
        } catch (error) {
            console.error("Error al importar Excel:", error);
            alert("Error al procesar el archivo Excel. Asegúrese de usar la plantilla correcta.");
        }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrintList = () => {
    setShowGeneralReport(true); // Toggle the new report view instead of direct print
  };

  const handlePrintFicha = (asset: Asset) => {
      setPrintingAsset(asset);
      setTimeout(() => {
          window.print();
      }, 500);
  };

  const handleClosePrintView = () => {
      setPrintingAsset(null);
      setShowGeneralReport(false);
      onRefresh();
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
      
      {/* 1. INDIVIDUAL ASSET PRINT VIEW */}
      {printingAsset && (
          <AssetPrintView 
            asset={printingAsset} 
            currentLang={currentLang} 
            companyLogo={companyLogo} 
            onClose={handleClosePrintView} 
          />
      )}

      {/* 2. GENERAL REPORT VIEW (NEW) */}
      {showGeneralReport && (
          <AssetsGeneralReport 
            assets={filteredAssets} 
            companyLogo={companyLogo}
            onClose={handleClosePrintView}
          />
      )}

      {/* 3. MAIN CONTENT (Hidden when printing) */}
      <div className={(printingAsset || showGeneralReport) ? 'hidden' : ''}>
        
        {/* HEADER */}
        <div className="flex flex-col gap-6 print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{t('assets', currentLang)}</h2>
                <p className="text-sm text-gray-500">Gestión de la Flota V.1.0</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button onClick={downloadTemplate} className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50">
                   <FileSpreadsheet size={18} /> PLANTILLA EXCEL
                </button>
                <div className="relative">
                    <input type="file" ref={fileInputRef} accept=".xlsx, .xls" onChange={handleBulkImport} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50">
                        <Upload size={18} /> IMPORTAR EXCEL
                    </button>
                </div>
                <button onClick={handlePrintList} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2">
                    <Printer size={18} /> INFORME GENERAL
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
