import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LabelList } from 'recharts';

interface SalesTrendChartProps {
  data: {
    month: number;
    salesPrev: number | null;
    salesCurrent: number | null;
  }[];
  currentYear: number;
  prevYear: number;
}

const CustomLabel = (props: any) => {
  const { x, y, value, index, data, isCurrent } = props;
  
  if (value === null || value === undefined) return null;

  const currentData = data[index];
  const prevVal = currentData.salesPrev;
  const currentVal = currentData.salesCurrent;
  
  // Default to top
  let dy = -10; 
  
  // Logic to avoid overlap:
  // If rendering Current Year label:
  //   - If Current < Prev, put Current at bottom (dy = 20)
  //   - Else (Current >= Prev or Prev is null), put Current at top (dy = -10)
  // If rendering Prev Year label:
  //   - If Prev < Current, put Prev at bottom (dy = 20)
  //   - Else (Prev >= Current or Current is null), put Prev at top (dy = -10)
  
  if (isCurrent) {
    if (prevVal !== null && currentVal !== null && currentVal < prevVal) {
       dy = 20; 
    }
  } else {
    if (currentVal !== null && prevVal !== null && prevVal < currentVal) {
       dy = 20;
    }
  }

  return (
    <text 
      x={x} 
      y={y} 
      dy={dy} 
      fill={isCurrent ? "#1e3a8a" : "#6b7280"} 
      fontSize={11} 
      textAnchor="middle" 
      fontWeight={isCurrent ? "bold" : "normal"}
    >
      {value.toLocaleString()}
    </text>
  );
};

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, currentYear, prevYear }) => {
  const chartData = data.map((d) => ({
    name: `${d.month}월`,
    '전년도 매출': d.salesPrev,
    '선택년도 매출': d.salesCurrent,
    // Pass original data for custom label logic
    salesPrev: d.salesPrev,
    salesCurrent: d.salesCurrent,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip 
            formatter={(value: number) => value.toLocaleString() + 'M'}
            labelStyle={{ color: '#374151' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="전년도 매출" 
            name={`${prevYear}년 매출`}
            stroke="#9ca3af" 
            strokeWidth={2} 
            dot={{ r: 4 }} 
            activeDot={{ r: 6 }}
            connectNulls={false}
          >
            <LabelList content={<CustomLabel data={data} isCurrent={false} />} />
          </Line>
          <Line 
            type="monotone" 
            dataKey="선택년도 매출" 
            name={`${currentYear}년 매출`}
            stroke="#1e3a8a" 
            strokeWidth={3} 
            dot={{ r: 4 }} 
            activeDot={{ r: 6 }}
            connectNulls={false}
          >
            <LabelList content={<CustomLabel data={data} isCurrent={true} />} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
