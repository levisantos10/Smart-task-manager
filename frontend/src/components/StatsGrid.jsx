import React from 'react';
import { BarChart3, AlertCircle, Clock, CheckCircle } from 'lucide-react';

// Componente StatCard
const StatCard = ({ title, value, color, icon: Icon }) => {
  const colorClasses = {
    gray: 'text-gray-600 bg-gray-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color === 'gray' ? 'text-gray-900' : `text-${color}-600`}`}>
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Componente StatsGrid
const StatsGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatCard 
        title="Total" 
        value={stats.total} 
        color="gray" 
        icon={BarChart3}
      />
      <StatCard 
        title="Pendentes" 
        value={stats.pending} 
        color="yellow" 
        icon={AlertCircle}
      />
      <StatCard 
        title="Em Progresso" 
        value={stats.in_progress} 
        color="blue" 
        icon={Clock}
      />
      <StatCard 
        title="Concluídas" 
        value={stats.completed} 
        color="green" 
        icon={CheckCircle}
      />
    </div>
  );
};

export { StatCard, StatsGrid };
