import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface GoalVsSalesChartProps {
  goal: number;
  current: number;
}

export const GoalVsSalesChart: React.FC<GoalVsSalesChartProps> = ({ goal, current }) => {
  const percentage = Math.min(100, Math.max(0, (current / goal) * 100));
  const remaining = Math.max(0, goal - current);

  const data = [
    { name: '달성', value: current },
    { name: '잔여', value: remaining },
  ];

  const COLORS = ['#3b82f6', '#e5e7eb']; // Blue-500, Gray-200

  return (
    <div className="w-full h-48 relative flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            <Label
              value={`${percentage.toFixed(1)}%`}
              position="center"
              className="text-2xl font-bold fill-gray-800"
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
