import React, { useState, useEffect } from 'react';
import { User, UserRole, Language } from '../types';
import { storageService } from '../services/storage';
import { t } from '../services/translations';
import { User as UserIcon, Wrench, CheckCircle, Clock } from 'lucide-react';

interface TeamViewProps {
  currentLang: Language;
}

const TeamView: React.FC<TeamViewProps> = ({ currentLang }) => {
  const [mechanics, setMechanics] = useState<User[]>([]);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    const allUsers = await storageService.getUsers();
    setMechanics(allUsers.filter(u => u.role === UserRole.MECANICO));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t('team', currentLang)}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mechanics.map(mech => (
          <div key={mech.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
               {mech.fullName.charAt(0)}
             </div>
             <div>
               <h3 className="font-bold text-gray-800">{mech.fullName}</h3>
               <p className="text-sm text-gray-500 mb-2">@{mech.username}</p>
               <div className="flex gap-2">
                 <span className={`px-2 py-1 rounded text-xs font-bold ${mech.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mech.active ? 'Active' : 'Inactive'}
                 </span>
                 <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600">
                    Mecánico
                 </span>
               </div>
             </div>
          </div>
        ))}

        {mechanics.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 border border-dashed rounded-lg">
             No hay mecánicos registrados. Ve a "Gestión Usuarios" para añadir personal.
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamView;