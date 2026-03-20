import React, { useState, useMemo, useEffect } from 'react';
import { getYTD, getGoalYTD, getTotalGoal, MonthlyData, ProfitabilityData } from '../data/mockData';
import { DateFilter } from './DateFilter';
import { GoalVsSalesChart } from './GoalVsSalesChart';
import { MonthlyProgressChart } from './MonthlyProgressChart';
import { YTDComparisonChart } from './YTDComparisonChart';
import { MonthlyGoalVsSalesChart } from './MonthlyGoalVsSalesChart';
import { SalesTrendChart } from './SalesTrendChart';
import { ProfitabilityTables } from './ProfitabilityTables';
import { motion } from 'motion/react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheets';

export const Dashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    return currentMonth === 0 ? 12 : currentMonth;
  });

  // 초기 데이터를 빈 상태로 설정하여 로딩 중 Mock Data 노출 방지
  const [data, setData] = useState<MonthlyData[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = await googleSheetsService.checkAuth();
    setIsConnected(authenticated);
  };

  useEffect(() => {
    if (isConnected) {
      fetchSheetData();
    }
  }, [isConnected, selectedYear, selectedMonth]);

  const fetchSheetData = async () => {
    setIsLoading(true);
    try {
      const [mainData, profData] = await Promise.all([
        googleSheetsService.fetchData(selectedYear),
        googleSheetsService.fetchProfitabilityData(selectedYear, selectedMonth)
      ]);
      
      if (mainData && mainData.length > 0) {
        setData(mainData);
      }
      if (profData) {
        setProfitabilityData(profData);
      }
    } catch (error) {
      console.error('Failed to fetch sheet data', error);
    } finally {
      // 데이터가 스테이트에 반영될 시간을 벌기 위해 미세한 지연 후 로딩 해제
      setTimeout(() => setIsLoading(false), 100);
    }
  };

  // 계산 로직 (데이터가 없을 경우를 대비해 기본값 0 설정)
  const currentYearGoal = data.length > 0 ? getTotalGoal(data, selectedYear) : 0;
  const currentYearSales = data.length > 0 ? getYTD(data, selectedYear, selectedMonth) : 0;
  const currentYearLabel = `${selectedYear}년`;
  const ytdGoal = data.length > 0 ? getGoalYTD(data, selectedYear, selectedMonth) : 0;
  const ytdSales = data.length > 0 ? getYTD(data, selectedYear, selectedMonth) : 0;
  const prevYear = selectedYear - 1;
  const ytdSalesPrev = data.length > 0 ? getYTD(data, prevYear, selectedMonth) : 0;

  const trendData = useMemo(() => {
    if (data.length === 0) return [];
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

  // 로딩 화면 정의
  if (isLoading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">데이터 로딩 중</h2>
        <p className="text-gray-400 mt-2">잠시만 기다려 주세요...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-4 z-50 flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex flex-col md:flex-row justify-between items-center w-full">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">앉방데이 대시보드</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <GoalVsSalesChart goal={currentYearGoal} current={currentYearSales} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center"
          >
            <h2 className="text-lg font-semibold mb-4 text-center">당월 누계 목표비 매출 누계</h2>
            <MonthlyProgressChart goal={ytdGoal} sales={ytdSales} />
          </motion.div>

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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold mb-4">월별 목표비 매출 달성율</h2>
          <MonthlyGoalVsSalesChart data={data} year={selectedYear} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold mb-4">2개년 월별 매출 추이</h2>
          <SalesTrendChart data={trendData} currentYear={selectedYear} prevYear={prevYear} />
        </motion.div>

        {profitabilityData && (
          <ProfitabilityTables 
            data={profitabilityData} 
            selectedYear={selectedYear} 
            selectedMonth={selectedMonth} 
            onSaveSuccess={fetchSheetData}
          />
        )}
      </div>
    </div>
  );
};