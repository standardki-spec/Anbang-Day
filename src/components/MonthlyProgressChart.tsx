import React from 'react';

interface MonthlyProgressChartProps {
  goal: number;
  sales: number;
}

export const MonthlyProgressChart: React.FC<MonthlyProgressChartProps> = ({ goal, sales }) => {
  const actualPercentage = goal > 0 ? (sales / goal) * 100 : 0;
  const visualPercentage = Math.min(100, Math.max(0, actualPercentage));
  const isOverGoal = sales > goal;

  return (
    <div className="w-full flex flex-col items-center justify-center h-48">
      <div className="w-full bg-gray-200 rounded-full h-12 relative overflow-hidden">
        <div
          className={`h-full rounded-full flex items-center justify-center text-white font-bold transition-all duration-500 ${
            isOverGoal ? 'bg-blue-600' : 'bg-blue-500'
          }`}
          style={{ width: `${visualPercentage}%` }}
        >
          {visualPercentage > 15 && `${actualPercentage.toFixed(1)}%`}
        </div>
        {visualPercentage <= 15 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-800 font-bold">
            {actualPercentage.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="flex justify-between w-full mt-2 text-sm text-gray-600">
        <span>매출: {sales.toLocaleString()}M</span>
        <span>목표: {goal.toLocaleString()}M</span>
      </div>
    </div>
  );
};
