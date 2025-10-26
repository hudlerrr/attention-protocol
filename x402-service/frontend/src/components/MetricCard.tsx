import React from 'react';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
  iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, subtitle, gradient, iconColor }) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} border border-opacity-30 p-6 rounded-xl backdrop-blur-sm hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-12 h-12 rounded-xl bg-opacity-20 flex items-center justify-center`}>
          {React.cloneElement(icon as React.ReactElement, { className: `${iconColor} w-8 h-8` })}
        </div>
        <span className="text-xs text-gray-400">{title}</span>
      </div>
      <div className="text-4xl font-bold mb-1 text-gray-100">{value}</div>
      <div className="text-sm text-gray-400">{subtitle}</div>
    </div>
  );
};

export default MetricCard;
