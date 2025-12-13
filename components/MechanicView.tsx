import React from 'react';
import { WorkOrder, WorkOrderStatus, Asset } from '../types';
import { Play, Pause, CheckSquare, Camera, Upload } from 'lucide-react';

interface MechanicViewProps {
  workOrders: WorkOrder[];
  assets: Asset[];
}

const MechanicView: React.FC<MechanicViewProps> = ({ workOrders, assets }) => {
  // Filter for assigned OTs (in a real app, filter by current user ID)
  // Here we just show "En Progreso" or "Pendiente" to simulate workload
  const myTasks = workOrders.filter(wo => wo.status !== WorkOrderStatus.CERRADA);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Mi Trabajo de Hoy</h2>

      <div className="grid gap-6">
        {myTasks.map(wo => {
          const asset = assets.find(a => a.id === wo.assetId);
          return (
            <div key={wo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{asset?.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{asset?.code}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${wo.status === WorkOrderStatus.EN_PROGRESO ? 'bg-green-100 text-green-800 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                    {wo.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-gray-700 font-medium">{wo.description}</p>
                </div>
              </div>

              <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Actions */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Acciones</h4>
                  <div className="flex gap-3">
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm">
                      <Play size={20} /> Iniciar
                    </button>
                    <button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm">
                      <Pause size={20} /> Pausar
                    </button>
                  </div>
                  <button className="w-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                    <CheckSquare size={20} /> Checklist Seguridad
                  </button>
                </div>

                {/* Evidence */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Evidencias</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors bg-gray-50">
                    <Camera size={32} className="mb-2" />
                    <span className="text-sm font-medium">Tomar Foto / Subir</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MechanicView;
