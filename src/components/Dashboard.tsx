import React, { useState, useMemo, useEffect } from 'react';
import { mockData, getYTD, getGoalYTD, getTotalGoal, MonthlyData, mockProfitabilityData, ProfitabilityData } from '../data/mockData';
import { DateFilter } from './DateFilter';
import { GoalVsSalesChart } from './GoalVsSalesChart';
import { MonthlyProgressChart } from './MonthlyProgressChart';
import { YTDComparisonChart } from './YTDComparisonChart';
import { MonthlyGoalVsSalesChart } from './MonthlyGoalVsSalesChart';
import { SalesTrendChart } from './SalesTrendChart';
import { ProfitabilityTables } from './ProfitabilityTables';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheets';

export const Dashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2026);
  // Default to previous month. If current month is Jan (0), set to Dec (12).
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    return currentMonth === 0 ? 12 : currentMonth;
  });
  const [data, setData] = useState<MonthlyData[]>(mockData);
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData>(mockProfitabilityData);
  const [isConnected, setIsConnected] = useState(true); // Default to true for public CSV
  const [isLoading, setIsLoading] = useState(false);

  // Check Auth Status on Mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = await googleSheetsService.checkAuth();
    setIsConnected(authenticated);
  };

  // Fetch data whenever isConnected becomes true or selected date changes
  useEffect(() => {
    if (isConnected) {
      fetchSheetData();
    }
  }, [isConnected, selectedYear, selectedMonth]);

  const fetchSheetData = async () => {
    setIsLoading(true);
    try {
      const [mainData, profitabilityData] = await Promise.all([
        googleSheetsService.fetchData(selectedYear),
        googleSheetsService.fetchProfitabilityData(selectedYear, selectedMonth)
      ]);
      
      if (mainData && mainData.length > 0) {
        setData(mainData);
      }
      if (profitabilityData) {
        setProfitabilityData(profitabilityData);
      }
    } catch (error) {
      console.error('Failed to fetch sheet data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    // No-op for public CSV
  };

  // 1. 26년 목표 매출액 대비 26년 누계 매출액 차트
  // Determine goal and sales based on selected year
  const currentYearGoal = getTotalGoal(data, selectedYear);
  const currentYearSales = getYTD(data, selectedYear, selectedMonth);
  const currentYearLabel = `${selectedYear}년`;

  // 2. 당월 누계 목표비 매출 누계 매출 차트
  const ytdGoal = getGoalYTD(data, selectedYear, selectedMonth);
  const ytdSales = getYTD(data, selectedYear, selectedMonth);

  // 3. 2개년 누계 매출 YTD (Compare Selected Year vs Previous Year)
  const prevYear = selectedYear - 1;
  const ytdSalesPrev = getYTD(data, prevYear, selectedMonth);

  // 5. 2개년 월별 매출 추이 (Selected Year vs Previous Year)
  const trendData = useMemo(() => {
    return data.map((d) => {
      let salesPrev = 0;
      let salesCurrent = 0;

      if (prevYear === 2025) salesPrev = d.sales2025;
      else if (prevYear === 2024) salesPrev = d.sales2024;
      
      if (selectedYear === 2026) salesCurrent = d.sales2026;
      else if (selectedYear === 2025) salesCurrent = d.sales2025;
      else if (selectedYear === 2024) salesCurrent = d.sales2024;

      return {
        month: d.month,
        salesPrev: salesPrev === 0 ? null : salesPrev,
        salesCurrent: salesCurrent === 0 ? null : salesCurrent,
      };
    });
  }, [data, selectedYear, prevYear]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-4 z-50 flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex flex-col md:flex-row justify-between items-center w-full">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">매출 대시보드</h1>
              <span className="text-sm text-green-600 font-medium flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                연동됨 (Public CSV)
              </span>
              <button
                onClick={fetchSheetData}
                disabled={isLoading}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="데이터 새로고침"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <DateFilter
              year={selectedYear}
              month={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
            />
          </div>
        </motion.div>

        {/* Top Row: 3 Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart 1: Goal vs Cumulative */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center"
          >
            <h2 className="text-lg font-semibold mb-2 text-center">{currentYearLabel} 누계 매출액</h2>
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-blue-600">{currentYearSales.toLocaleString()}M</p>
              <p className="text-sm text-gray-500">목표: {currentYearGoal.toLocaleString()}M</p>
            </div>
            <GoalVsSalesChart 
              goal={currentYearGoal} 
              current={currentYearSales} 
            />
          </motion.div>

          {/* Chart 2: Current Month Cumulative Goal vs Sales */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center"
          >
            <h2 className="text-lg font-semibold mb-4 text-center">당월 누계 목표비 매출 누계</h2>
            <MonthlyProgressChart 
              goal={ytdGoal} 
              sales={ytdSales} 
            />
          </motion.div>

          {/* Chart 3: 2-Year YTD Comparison */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col"
          >
            <h2 className="text-lg font-semibold mb-4 text-center">2개년 누계 매출 YTD</h2>
            <YTDComparisonChart 
              year1={prevYear}
              year2={selectedYear}
              sales1={ytdSalesPrev} 
              sales2={currentYearSales} 
            />
          </motion.div>
        </div>

        {/* Middle Row: Monthly Goal vs Sales Achievement */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold mb-4">월별 목표비 매출 달성율</h2>
          <MonthlyGoalVsSalesChart data={data} year={selectedYear} />
        </motion.div>

        {/* Bottom Row: 2-Year Sales Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold mb-4">2개년 월별 매출 추이</h2>
          <SalesTrendChart data={trendData} currentYear={selectedYear} prevYear={prevYear} />
        </motion.div>

        {/* Profitability Tables */}
        <ProfitabilityTables 
          data={profitabilityData} 
          selectedYear={selectedYear} 
          selectedMonth={selectedMonth} 
          onSaveSuccess={fetchSheetData}
        />
      </div>
    </div>
  );
};
