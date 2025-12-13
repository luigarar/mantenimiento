import React from 'react';
import { Asset, WorkOrder } from '../types';
import { Download, FileText, Database } from 'lucide-react';

interface ReportsProps {
  assets: Asset[];
  workOrders: WorkOrder[];
}

const Reports: React.FC<ReportsProps> = ({ assets, workOrders }) => {
  
  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => {
        // Escape commas and quotes
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Informes y Exportaciones</h2>
      <p className="text-gray-600">Descargue los datos del sistema en formato compatible con Excel (CSV) para análisis externo.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Assets Report */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Database className="text-blue-600 h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{assets.length}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Inventario de Activos</h3>
          <p className="text-sm text-gray-500 mb-6">Listado completo de vehículos y maquinaria, incluyendo estado, horas y ubicaciones.</p>
          <button 
            onClick={() => downloadCSV(assets, 'activos_flota')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
          >
            <Download size={16} /> Descargar Excel (CSV)
          </button>
        </div>

        {/* Work Orders Report */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <FileText className="text-amber-600 h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{workOrders.length}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Histórico de Órdenes</h3>
          <p className="text-sm text-gray-500 mb-6">Detalle de todas las órdenes de trabajo (preventivas y correctivas), tiempos y costes.</p>
          <button 
            onClick={() => downloadCSV(workOrders, 'ordenes_trabajo')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
          >
            <Download size={16} /> Descargar Excel (CSV)
          </button>
        </div>

        {/* Maintenance Plan Report */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Database className="text-green-600 h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-gray-800">Plan</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Próximos Mantenimientos</h3>
          <p className="text-sm text-gray-500 mb-6">Proyección de vencimientos de ITV y preventivos para los próximos 6 meses.</p>
          <button 
            onClick={() => {
              const maintenanceData = assets.map(a => ({
                code: a.code,
                name: a.name,
                nextDate: a.nextMaintenance,
                daysRemaining: Math.ceil((new Date(a.nextMaintenance).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
              }));
              downloadCSV(maintenanceData, 'plan_mantenimiento');
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
          >
            <Download size={16} /> Descargar Excel (CSV)
          </button>
        </div>

      </div>
    </div>
  );
};

export default Reports;