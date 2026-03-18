import React from 'react';

interface DateFilterProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({ year, month, onYearChange, onMonthChange }) => {
  return (
    <div className="flex space-x-4 items-center">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">년도:</label>
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">월:</label>
        <select
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
