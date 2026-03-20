import axios from 'axios';
import Papa from 'papaparse';
import { MonthlyData, ProfitabilityData } from '../data/mockData';

const getFreshUrl = (url: string) => `${url}&t=${new Date().getTime()}`;

const CHART_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1092502501&single=true&output=csv';
const MEMO_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=863618794&single=true&output=csv';
const PROFITABILITY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1722593857&single=true&output=csv';
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzEw7HtLkv5jGLBeObReEbAq9wOqOVknXpeBe8spE516NXGn53_qZwRjFWFS2MhENVz/exec';

const parseCSV = (csvString: string): any[][] => {
  const result = Papa.parse(csvString, { skipEmptyLines: true });
  return result.data as any[][];
};

export const googleSheetsService = {
  async checkAuth(): Promise<boolean> { return true; },
  async getAuthUrl(): Promise<string> { return ''; },

  async fetchData(year: number): Promise<MonthlyData[]> {
    try {
      const [chartRes, memoRes] = await Promise.all([
        axios.get(getFreshUrl(CHART_DATA_URL)),
        axios.get(getFreshUrl(MEMO_DATA_URL))
      ]);
      const chartRows = parseCSV(chartRes.data).slice(1);
      const memoRows = parseCSV(memoRes.data).slice(1);

      const parseNum = (val: any) => {
        if (!val) return 0;
        const cleanVal = val.toString().replace(/[^0-9.-]/g, '');
        return Math.round(Number(cleanVal) / 1000000);
      };

      return Array.from({ length: 12 }, (_, idx) => {
        const month = idx + 1;
        const targetDate = `${year}${month.toString().padStart(2, '0')}`;
        const matchedMemo = memoRows.find(r => String(r[0]).replace(/[^0-9]/g, '') === targetDate);
        const reason = matchedMemo && matchedMemo[1] ? matchedMemo[1].toString() : '';
        const row = chartRows[idx] || [];

        return {
          month,
          goal2024: parseNum(row[1]),
          sales2024: parseNum(row[2]),
          goal2025: parseNum(row[3]),
          sales2025: parseNum(row[4]),
          goal2026: parseNum(row[5]),
          sales2026: parseNum(row[6]),
          reason,
        };
      });
    } catch (error) {
      console.error('fetchData error', error);
      throw error;
    }
  },

  async fetchProfitabilityData(year: number, month: number): Promise<ProfitabilityData> {
    try {
      const [profRes, memoRes] = await Promise.all([
        axios.get(getFreshUrl(PROFITABILITY_CSV_URL)),
        axios.get(getFreshUrl(MEMO_DATA_URL))
      ]);

      const profRows = parseCSV(profRes.data);
      const memoRows = parseCSV(memoRes.data).slice(1);

      const targetDate = `${year}${month.toString().padStart(2, '0')}`;
      const matchedMemo = memoRows.find(r => String(r[0]).replace(/[^0-9]/g, '') === targetDate);
      const savedReason = matchedMemo && matchedMemo[1] ? matchedMemo[1].toString() : '';

      const parseNumber = (val: any) => {
        if (!val) return 0;
        return parseFloat(val.toString().replace(/,/g, '')) || 0;
      };

      const getColIdx = (y: number, m: number) => {
        if (y === 2024) return 31 + (m - 1) * 2;
        if (y === 2025) return 61 + (m - 1) * 2;
        if (y === 2026) return 91 + (m - 1) * 2;
        return -1;
      };

      const currMonthCol = getColIdx(year, month);
      const prevMonthCol = getColIdx(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);
      
      const currSales = currMonthCol !== -1 ? parseNumber(profRows[70][currMonthCol]) : 0;
      const prevSales = prevMonthCol !== -1 ? parseNumber(profRows[70][prevMonthCol]) : 0;

      const categories = [
        { main: '매출', sub: '매출', rowIdx: 70 },
        { main: '변동비', sub: '매출원가', rowIdx: 74 },
        { main: '변동비', sub: '물류비', rowIdx: 77 },
        { main: '변동비', sub: '판매수수료', rowIdx: 82 },
        { main: '변동비', sub: '변동비 합계', rowIdx: 83 },
        { main: '공헌이익', sub: '공헌이익', rowIdx: 84 },
        { main: '고정비', sub: '마케팅비', rowIdx: 85 },
        { main: '고정비', sub: '감가상각비', rowIdx: 86 },
        { main: '고정비', sub: '기타고정비', rowIdx: 87 },
        { main: '고정비', sub: '고정비 합계', rowIdx: 88 },
        { main: '영업외손익', sub: '영업외손익', rowIdx: 89 },
        { main: '채산이익', sub: '채산이익', rowIdx: 90 }
      ];

      const targetVsActual = categories.map(cat => {
        const row = profRows[cat.rowIdx];
        const cv = currMonthCol !== -1 ? parseNumber(row[currMonthCol]) : 0;
        const pv = prevMonthCol !== -1 ? parseNumber(row[prevMonthCol]) : 0;
        return {
          mainCategory: cat.main, subCategory: cat.sub,
          prevValue: pv, prevPercent: prevSales !== 0 ? (pv / prevSales) * 100 : 0,
          currValue: cv, currPercent: currSales !== 0 ? (cv / currSales) * 100 : 0,
          growthRate: cat.main === '매출' 
            ? (pv !== 0 ? ((cv - pv) / Math.abs(pv)) * 100 : 0)
            : (currSales !== 0 && prevSales !== 0 ? (cv / currSales * 100) - (pv / prevSales * 100) : 0)
        };
      });

      const yoy = categories.map(cat => {
        const row = profRows[cat.rowIdx];
        const prevYear = year - 1;
        let prevYearTotal = 0;
        let currentYtd = 0, prevYtd = 0;

        // 선택된 연도의 전년도 전체(1~12월) 합계 계산
        for (let m = 1; m <= 12; m++) {
          const colIdx = getColIdx(prevYear, m);
          if (colIdx !== -1) {
            prevYearTotal += parseNumber(row[colIdx]);
          }
        }

        // 현재 및 전년 동기 누계(YTD) 계산
        for (let m = 1; m <= month; m++) {
          const cCol = getColIdx(year, m);
          const pCol = getColIdx(year - 1, m);
          if (cCol !== -1) currentYtd += parseNumber(row[cCol]);
          if (pCol !== -1) prevYtd += parseNumber(row[pCol]);
        }

        const targetColIdx = year === 2024 ? 59 : year === 2025 ? 89 : 119;
        
        return {
          mainCategory: cat.main, subCategory: cat.sub,
          previousYearTotal: prevYearTotal, 
          currentYearTarget: parseNumber(row[targetColIdx]),
          currentYearTargetPercent: parseNumber(row[targetColIdx + 1]),
          previousYearYTD: prevYtd, currentYearYTD: currentYtd,
          yoyGrowth: prevYtd !== 0 ? ((currentYtd - prevYtd) / Math.abs(prevYtd)) * 100 : 0
        };
      });

      return { targetVsActual, yoy, savedReason };
    } catch (error) {
      console.error('fetchProfitabilityData error', error);
      throw error;
    }
  },

  async saveReason(year: number, month: number, text: string): Promise<void> {
    try {
      await axios.post(GAS_WEBAPP_URL, JSON.stringify({ year, month, reason: text }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
    } catch (error) {
      console.error('saveReason error', error);
      throw error;
    }
  },
  async logout(): Promise<void> {}
};