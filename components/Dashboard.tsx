import React from 'react';
import { Asset, AssetStatus, WorkOrder, WorkOrderPriority } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';

interface DashboardProps {
  assets: Asset[];
  workOrders: WorkOrder[];
}

const Dashboard: React.FC<DashboardProps> = ({ assets, workOrders }) => {
  // KPI Calculations
  const totalAssets = assets.length;
  const operationalAssets = assets.filter(a => a.status === AssetStatus.OPERATIVO).length;
  const inRepairAssets = assets.filter(a => a.status === AssetStatus.EN_TALLER || a.status === AssetStatus.AVERIADO).length;
  const availability = ((operationalAssets / totalAssets) * 100).toFixed(1);

  const pendingOTs = workOrders.filter(ot => ot.status !== 'TERMINADA' && ot.status !== 'CERRADA').length;
  const criticalOTs = workOrders.filter(ot => ot.priority === WorkOrderPriority.CRITICA).length;

  // Chart Data
  const statusData = [
    { name: 'Operativo', value: operationalAssets, color: '#22c55e' }, // Green
    { name: 'Taller', value: assets.filter(a => a.status === AssetStatus.EN_TALLER).length, color: '#f59e0b' }, // Amber
    { name: 'Averiado', value: assets.filter(a => a.status === AssetStatus.AVERIADO).length, color: '#ef4444' }, // Red
  ];

  const costData = [
    { month: 'Ene', preventivo: 4000, correctivo: 2400 },
    { month: 'Feb', preventivo: 3000, correctivo: 1398 },
    { month: 'Mar', preventivo: 2000, correctivo: 9800 }, // Peak failure
    { month: 'Abr', preventivo: 2780, correctivo: 3908 },
    { month: 'May', preventivo: 1890, correctivo: 4800 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cuadro de Mando Operativo</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Disponibilidad Flota</p>
            <p className={`text-2xl font-bold ${Number(availability) > 90 ? 'text-green-600' : 'text-red-500'}`}>
              {availability}%
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-full">
            <CheckCircle className="text-green-600 h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Equipos en Taller</p>
            <p className="text-2xl font-bold text-amber-600">{inRepairAssets}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-full">
            <Wrench className="text-amber-600 h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">OTs Pendientes</p>
            <p className="text-2xl font-bold text-blue-600">{pendingOTs}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            <Clock className="text-blue-600 h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">OTs Críticas</p>
            <p className="text-2xl font-bold text-red-600">{criticalOTs}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-full">
            <AlertTriangle className="text-red-600 h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Availability Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Estado Actual de la Flota</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                {entry.name}: {entry.value}
              </div>
            ))}
          </div>
        </div>

        {/* Cost Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Costes de Mantenimiento (YTD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="preventivo" stackId="a" fill="#0ea5e9" name="Preventivo" />
                <Bar dataKey="correctivo" stackId="a" fill="#ef4444" name="Correctivo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Alerts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700">Alertas de Mantenimiento Preventivo</h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {assets.filter(a => new Date(a.nextMaintenance) < new Date()).map(asset => (
            <li key={asset.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="text-amber-500 h-5 w-5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{asset.name} ({asset.code})</p>
                  <p className="text-xs text-gray-500">Mantenimiento vencido: {asset.nextMaintenance}</p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Crear OT
              </button>
            </li>
          ))}
          {assets.filter(a => new Date(a.nextMaintenance) >= new Date()).length === assets.length && (
            <li className="px-6 py-4 text-sm text-gray-500 text-center">No hay alertas pendientes. ¡Buen trabajo!</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
