import React from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { MonthlyData } from '../data/mockData';

interface MonthlyGoalVsSalesChartProps {
  data: MonthlyData[];
  year: number;
}

export const MonthlyGoalVsSalesChart: React.FC<MonthlyGoalVsSalesChartProps> = ({ data, year }) => {
  const chartData = data.map((d) => {
    let goal = 0;
    let sales = 0;
    
    if (year === 2026) { goal = d.goal2026; sales = d.sales2026; }
    else if (year === 2025) { goal = d.goal2025; sales = d.sales2025; }
    else if (year === 2024) { goal = d.goal2024; sales = d.sales2024; }

    return {
      name: `${d.month}월`,
      goal,
      sales,
      achievement: (goal > 0 && sales > 0) ? ((sales / goal) * 100).toFixed(1) : null,
      isOver: sales >= goal && sales > 0,
    };
  });

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="name" scale="point" padding={{ left: 10, right: 10 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip 
            formatter={(value: number, name: string) => [value.toLocaleString() + 'M', name === 'goal' ? '목표' : '매출']}
            labelStyle={{ color: '#374151' }}
          />
          <Area 
            type="monotone" 
            dataKey="goal" 
            fill="#e5e7eb" 
            stroke="#d1d5db" 
            strokeWidth={2}
            fillOpacity={0.6}
          />
          <Bar dataKey="sales" barSize={40} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isOver ? '#1e3a8a' : '#b91c1c'} />
            ))}
            <LabelList 
              dataKey="achievement" 
              position="center" 
              angle={-90} 
              fill="#ffffff" 
              fontSize={12} 
              fontWeight="bold"
              formatter={(val: string | null) => val ? `${val}%` : ''}
            />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
