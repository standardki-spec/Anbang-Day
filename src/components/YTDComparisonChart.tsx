import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface YTDComparisonChartProps {
  year1: number;
  year2: number;
  sales1: number;
  sales2: number;
}

export const YTDComparisonChart: React.FC<YTDComparisonChartProps> = ({ year1, year2, sales1, sales2 }) => {
  const percentageChange = sales1 > 0 ? ((sales2 - sales1) / sales1) * 100 : 0;
  const isPositive = percentageChange >= 0;
  const growthLabel = `${isPositive ? '+' : ''}${Math.round(percentageChange)}%`; // Rounded percentage

  const data = [
    { 
      name: year1.toString(), 
      value: Math.round(sales1), 
      fill: '#9ca3af', // Gray for previous year
      growth: '' 
    },
    { 
      name: year2.toString(), 
      value: Math.round(sales2), 
      fill: '#3b82f6', // Blue for current year
      growth: growthLabel 
    },
  ];

  return (
    <div className="w-full h-60 relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip 
            formatter={(value: number) => value.toLocaleString() + 'M'}
            cursor={{ fill: 'transparent' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            {/* Sales Value Inside */}
            <LabelList 
              dataKey="value" 
              position="insideTop" 
              offset={10}
              formatter={(val: number) => val.toLocaleString() + 'M'} 
              fill="#ffffff" 
              fontSize={14} 
              fontWeight="bold" 
            />
            {/* Growth Rate Above (Only for 2nd bar) */}
            <LabelList 
              dataKey="growth" 
              position="top" 
              fill={isPositive ? '#16a34a' : '#dc2626'} // Green or Red
              fontSize={14} 
              fontWeight="bold" 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
