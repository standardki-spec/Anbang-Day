import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ProfitabilityData } from '../data/mockData';
import { ProfitabilityMemo } from './ProfitabilityMemo';

interface ProfitabilityTablesProps {
  data: ProfitabilityData;
  selectedYear: number;
  selectedMonth: number;
  onSaveSuccess?: () => void;
}

export const ProfitabilityTables: React.FC<ProfitabilityTablesProps> = ({ data, selectedYear, selectedMonth, onSaveSuccess }) => {
  let prevYear = selectedYear;
  let prevMonth = selectedMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const lastYear = selectedYear - 1;

  const formatGrowth = (val: number, mainCategory: string) => {
    const suffix = mainCategory === '매출' ? '%' : '%p';
    return val.toFixed(1) + suffix;
  };

  const formatPercent = (val: number) => {
    return val.toFixed(1) + '%';
  };

  const formatNumber = (val: number) => {
    return Math.round(val).toLocaleString();
  };

  const getRowClass = (mainCategory: string, subCategory: string) => {
    if (mainCategory === subCategory || subCategory === '고정비 합계' || subCategory === '변동비 합계') {
      return 'bg-blue-50 font-semibold'; // Highlight main categories and totals
    }
    return 'bg-white';
  };

  const getGrowthColor = (val: number, mainCategory: string) => {
    if (Math.abs(val) < 0.01) return 'text-gray-600';
    
    const isExpense = mainCategory === '변동비' || mainCategory === '고정비';
    
    if (isExpense) {
      // For expenses, positive is bad (red), negative is good (blue)
      return val > 0 ? 'text-red-600' : 'text-blue-600';
    } else {
      // For others (Sales, Profit), positive is good (blue), negative is bad (red)
      return val > 0 ? 'text-blue-600' : 'text-red-600';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* 전월 비교 채산표 (MoM) & Memo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 overflow-x-auto">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-lg font-semibold">전월 비교 채산표</h2>
              <span className="text-sm text-gray-500">(단위 : 백만원)</span>
            </div>
            <table className="w-full text-sm text-center border-collapse border border-gray-300">
              <colgroup>
                <col className="w-[11%]" />
                <col className="w-[17%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" colSpan={2} className="px-4 py-3 border border-gray-300 font-semibold">구분</th>
                  <th scope="col" colSpan={2} className="px-4 py-3 border border-gray-300 border-r-2 border-r-gray-800 font-semibold">{prevYear.toString().slice(-2)}년 {prevMonth}월</th>
                  <th scope="col" colSpan={2} className="px-4 py-3 border border-gray-300 border-t-2 border-r-2 border-t-gray-800 border-r-gray-800 font-bold text-gray-900">{selectedYear.toString().slice(-2)}년 {selectedMonth}월</th>
                  <th scope="col" className="px-4 py-3 border border-gray-300 font-semibold bg-yellow-50">전월비<br/>성장율</th>
                </tr>
              </thead>
              <tbody>
                {data.targetVsActual.map((row, index) => {
                  const isMain = row.mainCategory === row.subCategory;
                  const isTotal = row.subCategory === '고정비 합계' || row.subCategory === '변동비 합계';
                  const isNonOperating = row.mainCategory === '영업외손익';
                  const isLastRow = index === data.targetVsActual.length - 1;
                  
                  // Determine if we need to render the main category cell (rowspan)
                  let renderMainCategory = false;
                  let rowSpan = 1;
                  
                  if (row.mainCategory === '변동비' && row.subCategory === '매출원가') {
                    renderMainCategory = true;
                    rowSpan = 4; // 매출원가, 물류비, 판매수수료, 변동비 합계
                  } else if (row.mainCategory === '고정비' && row.subCategory === '마케팅비') {
                    renderMainCategory = true;
                    rowSpan = 4; // 마케팅비, 감가상각비, 기타고정비, 고정비 합계
                  } else if (isMain) {
                    renderMainCategory = true;
                    rowSpan = 1;
                  }

                  // Background colors based on category
                  const getBgClass = () => {
                    if (isNonOperating) return 'bg-white';
                    if (isTotal) return 'bg-yellow-100';
                    if (isMain) return 'bg-blue-100';
                    return 'bg-white';
                  };
                  const bgClass = getBgClass();

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      {renderMainCategory && (
                        <td 
                          rowSpan={rowSpan} 
                          className={`px-4 py-2 border border-gray-300 font-medium whitespace-nowrap text-center ${isMain && !isNonOperating ? 'bg-blue-100' : 'bg-white'}`}
                          colSpan={isMain ? 2 : 1}
                        >
                          {row.mainCategory}
                        </td>
                      )}
                      {!isMain && (
                        <td className={`px-4 py-2 border border-gray-300 text-center whitespace-nowrap ${isTotal ? 'bg-yellow-100 font-semibold' : ''}`}>
                          {row.subCategory}
                        </td>
                      )}
                      
                      {/* Previous Month */}
                      <td className={`px-4 py-2 border border-gray-300 text-right ${isMain || isTotal ? bgClass : ''}`}>
                        {formatNumber(row.prevValue)}
                      </td>
                      <td className={`px-4 py-2 border border-gray-300 border-r-2 border-r-gray-800 text-right ${isMain || isTotal ? bgClass : ''}`}>
                        {formatPercent(row.prevPercent)}
                      </td>

                      {/* Current Month (Highlighted) */}
                      <td className={`px-4 py-2 border border-gray-300 text-right ${isMain || isTotal ? bgClass : ''} ${isLastRow ? 'border-b-2 border-b-gray-800' : ''} font-medium text-gray-900`}>
                        {formatNumber(row.currValue)}
                      </td>
                      <td className={`px-4 py-2 border border-gray-300 border-r-2 border-r-gray-800 text-right ${isMain || isTotal ? bgClass : ''} ${isLastRow ? 'border-b-2 border-b-gray-800' : ''}`}>
                        {formatPercent(row.currPercent)}
                      </td>

                      {/* Growth Rate */}
                      <td className={`px-4 py-2 border border-gray-300 text-right font-medium ${getGrowthColor(row.growthRate, row.mainCategory)} ${isMain || isTotal ? bgClass : ''}`}>
                        {formatGrowth(row.growthRate, row.mainCategory)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-2 lg:border-l lg:border-gray-200 lg:pl-6">
            <ProfitabilityMemo 
              year={selectedYear} 
              month={selectedMonth} 
              data={data}
              onSaveSuccess={onSaveSuccess}
            />
          </div>
        </div>
      </motion.div>
      {/* 연누계 비교 채산표 (YoY) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      >
        <div className="overflow-x-auto">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-semibold">연누계 비교 채산표</h2>
            <span className="text-sm text-gray-500">(단위 : 백만원)</span>
          </div>
          <table className="w-full text-sm text-center border-collapse border border-gray-300">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" colSpan={2} className="px-4 py-3 border border-gray-300 font-semibold">구분</th>
                <th scope="col" colSpan={2} className="px-4 py-3 border border-gray-300 border-r-2 border-r-gray-800 font-semibold">~{lastYear.toString().slice(-2)}년 {selectedMonth}월</th>
                <th scope="col" colSpan={2} className="px-4 py-3 border border-gray-300 border-t-2 border-r-2 border-t-gray-800 border-r-gray-800 font-bold text-gray-900">~{selectedYear.toString().slice(-2)}년 {selectedMonth}월</th>
                <th scope="col" className="px-4 py-3 border border-gray-300 font-semibold bg-yellow-50">전년<br/>누계비<br/>성장율</th>
                <th scope="col" className="px-4 py-3 border border-gray-300 font-semibold">{lastYear.toString().slice(-2)}년 마감</th>
                <th scope="col" className="px-4 py-3 border border-gray-300 font-semibold">{selectedYear.toString().slice(-2)}년 목표</th>
              </tr>
            </thead>
            <tbody>
              {data.yoy.map((row, index) => {
                const isMain = row.mainCategory === row.subCategory;
                const isTotal = row.subCategory === '고정비 합계' || row.subCategory === '변동비 합계';
                const isNonOperating = row.mainCategory === '영업외손익';
                const isLastRow = index === data.yoy.length - 1;
                
                // Determine if we need to render the main category cell (rowspan)
                let renderMainCategory = false;
                let rowSpan = 1;
                
                if (row.mainCategory === '변동비' && row.subCategory === '매출원가') {
                  renderMainCategory = true;
                  rowSpan = 4; // 매출원가, 물류비, 판매수수료, 변동비 합계
                } else if (row.mainCategory === '고정비' && row.subCategory === '마케팅비') {
                  renderMainCategory = true;
                  rowSpan = 4; // 마케팅비, 감가상각비, 기타고정비, 고정비 합계
                } else if (isMain) {
                  renderMainCategory = true;
                  rowSpan = 1;
                }

                // Background colors based on category
                const getBgClass = () => {
                  if (isNonOperating) return 'bg-white';
                  if (isTotal) return 'bg-yellow-100';
                  if (isMain) return 'bg-blue-100';
                  return 'bg-white';
                };
                const bgClass = getBgClass();

                // Calculate percentages for YTD
                const prevSalesYTD = data.yoy.find(r => r.mainCategory === '매출')?.previousYearYTD || 1;
                const currSalesYTD = data.yoy.find(r => r.mainCategory === '매출')?.currentYearYTD || 1;
                const prevYtdPercent = row.mainCategory === '매출' ? 100 : (row.previousYearYTD / prevSalesYTD) * 100;
                const currYtdPercent = row.mainCategory === '매출' ? 100 : (row.currentYearYTD / currSalesYTD) * 100;

                // Calculate percentages for Total/Target
                const prevSalesTotal = data.yoy.find(r => r.mainCategory === '매출')?.previousYearTotal || 1;
                const currSalesTarget = data.yoy.find(r => r.mainCategory === '매출')?.currentYearTarget || 1;
                const prevTotalPercent = (row.previousYearTotal / prevSalesTotal) * 100;
                const currTargetPercent = row.currentYearTargetPercent !== undefined 
                  ? row.currentYearTargetPercent 
                  : (row.currentYearTarget / currSalesTarget) * 100;

                // Should show total/target columns (only for 매출, 변동비, 공헌이익)
                const showTotalTarget = row.mainCategory === '매출' || row.mainCategory === '변동비' || row.mainCategory === '공헌이익';

                // Calculate YoY Growth as %p for non-sales
                const yoyGrowthValue = row.mainCategory === '매출' 
                  ? row.yoyGrowth 
                  : currYtdPercent - prevYtdPercent;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    {renderMainCategory && (
                      <td 
                        rowSpan={rowSpan} 
                        className={`px-4 py-2 border border-gray-300 font-medium whitespace-nowrap text-center ${isMain && !isNonOperating ? 'bg-blue-100' : 'bg-white'}`}
                        colSpan={isMain ? 2 : 1}
                      >
                        {row.mainCategory}
                      </td>
                    )}
                    {!isMain && (
                      <td className={`px-4 py-2 border border-gray-300 text-center whitespace-nowrap ${isTotal ? 'bg-yellow-100 font-semibold' : ''}`}>
                        {row.subCategory}
                      </td>
                    )}
                    
                    {/* Previous Year YTD */}
                    <td className={`px-4 py-2 border border-gray-300 text-right ${isMain || isTotal ? bgClass : ''}`}>
                      {formatNumber(row.previousYearYTD)}
                    </td>
                    <td className={`px-4 py-2 border border-gray-300 border-r-2 border-r-gray-800 text-right ${isMain || isTotal ? bgClass : ''}`}>
                      {formatPercent(prevYtdPercent)}
                    </td>

                    {/* Current Year YTD (Highlighted) */}
                    <td className={`px-4 py-2 border border-gray-300 text-right ${isMain || isTotal ? bgClass : ''} ${isLastRow ? 'border-b-2 border-b-gray-800' : ''} font-medium text-gray-900`}>
                      {formatNumber(row.currentYearYTD)}
                    </td>
                    <td className={`px-4 py-2 border border-gray-300 border-r-2 border-r-gray-800 text-right ${isMain || isTotal ? bgClass : ''} ${isLastRow ? 'border-b-2 border-b-gray-800' : ''}`}>
                      {formatPercent(currYtdPercent)}
                    </td>

                    {/* YoY Growth Rate */}
                    <td className={`px-4 py-2 border border-gray-300 text-right font-medium ${getGrowthColor(yoyGrowthValue, row.mainCategory)} ${isMain || isTotal ? bgClass : ''}`}>
                      {formatGrowth(yoyGrowthValue, row.mainCategory)}
                    </td>

                    {/* Previous Year Total */}
                    <td className={`px-4 py-2 text-right ${showTotalTarget ? `border border-gray-300 ${isMain || isTotal ? bgClass : ''}` : 'bg-white'}`}>
                      {showTotalTarget ? (
                        row.mainCategory === '매출' ? formatNumber(row.previousYearTotal) : formatPercent(prevTotalPercent)
                      ) : ''}
                    </td>

                    {/* Current Year Target */}
                    <td className={`px-4 py-2 text-right ${showTotalTarget ? `border border-gray-300 ${isMain || isTotal ? bgClass : ''}` : 'bg-white'}`}>
                      {showTotalTarget ? (
                        row.mainCategory === '매출' ? formatNumber(row.currentYearTarget) : formatPercent(currTargetPercent)
                      ) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
