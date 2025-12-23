import React from 'react';

const TailwindStatCard = ({
  title,
  value,
  change,
  changeType = 'positive',
  color = 'indigo',
  subtitle,
  icon: Icon,
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getChangePrefix = () => {
    if (changeType === 'positive') return '+';
    if (changeType === 'negative') return '-';
    return '';
  };

  const getColorClasses = () => {
    const colorMap = {
      indigo: 'bg-indigo-500 text-white',
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      red: 'bg-red-500 text-white',
      blue: 'bg-blue-500 text-white',
    };
    return colorMap[color] || colorMap.indigo;
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-white px-5 pb-20 pt-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
      <div className="mb-4">
        <div className={`absolute rounded-lg p-3 shadow-lg ${getColorClasses()}`}>
          {Icon ? <Icon className="h-6 w-6" aria-hidden="true" /> : null}
        </div>
        <p className="ml-16 truncate text-sm font-medium text-gray-600">{title}</p>
        <p className="ml-16 text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-r from-gray-50 to-gray-100/50 px-5 py-4 sm:px-6 border-t border-gray-200">
        <div className="text-sm">
          {subtitle && <p className="text-gray-700 font-medium mb-1.5">{subtitle}</p>}
          {change !== undefined && (
            <div className="flex items-center">
              <span className={`font-semibold ${getChangeColor()}`}>
                {getChangePrefix()}
                {change}
              </span>
              <span className="ml-2 text-gray-500 text-xs">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TailwindStatCard;
