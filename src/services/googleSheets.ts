import axios from 'axios';
import Papa from 'papaparse';
import { MonthlyData, ProfitabilityData } from '../data/mockData';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1092502501&single=true&output=csv';
const PROFITABILITY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1722593857&single=true&output=csv';
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyvb-wpFaEcBpBTdqomfw8vbFySbAnjJQyg_weTBziszuHi8Ac3uPfeEZzTsbnavLLr/exec';

const parseCSV = (csvString: string): any[][] => {
  const result = Papa.parse(csvString, {
    skipEmptyLines: true,
  });
  return result.data as any[][];
};

export const googleSheetsService = {
  async checkAuth(): Promise<boolean> { return true; },
  async getAuthUrl(): Promise<string> { return ''; },

  async fetchData(year: number): Promise<MonthlyData[]> {
    try {
      // 캐시 방지를 위해 타임스탬프 추가
      const response = await axios.get(`${CSV_URL}&t=${new Date().getTime()}`);
      const rows = parseCSV(response.data);

      if (!rows || rows.length === 0) return [];

      const allDataRows = rows.slice(1); // 헤더 제외 실제 데이터 행들
      
      const parseNum = (val: any, isMonth: boolean = false) => {
        if (!val) return 0;
        const cleanVal = val.toString().replace(/[^0-9.-]/g, '');
        const num = Number(cleanVal);
        if (isNaN(num)) return 0;
        if (isMonth) return num;
        return Math.round(num / 1000000);
      };

      // 차트용 1~12월 기본 데이터 생성
      return Array.from({ length: 12 }, (_, idx) => {
        const month = idx + 1;
        
        // [수정된 계산 공식] 
        // GAS에서 (year-2024)*12 + month + 5행 위치에 저장하므로,
        // CSV(헤더제외)에서는 (year-2024)*12 + month + 3행 차이가 남을 보정
        const targetRowIndex = ((year - 2024) * 12) + month + 3; 
        const reasonRow = allDataRows[targetRowIndex];
        const reason = reasonRow && reasonRow[9] ? reasonRow[9].toString() : '';

        // 차트 숫자 데이터는 기존 로직(상단 1~12행) 유지
        const chartRow = allDataRows[idx]; 

        return {
          month: month,
          goal2024: parseNum(chartRow[1]),
          sales2024: parseNum(chartRow[2]),
          goal2025: parseNum(chartRow[3]),
          sales2025: parseNum(chartRow[4]),
          goal2026: parseNum(chartRow[5]),
          sales2026: parseNum(chartRow[6]),
          reason: reason,
        };
      });
    } catch (error) {
      console.error('Failed to fetch MonthlyData', error);
      throw error;
    }
  },

  async fetchProfitabilityData(year: number, month: number): Promise<ProfitabilityData> {
    try {
      const [profRes, mainRes] = await Promise.all([
        axios.get(`${PROFITABILITY_CSV_URL}&t=${new Date().getTime()}`),
        axios.get(`${CSV_URL}&t=${new Date().getTime()}`)
      ]);

      const profRows = parseCSV(profRes.data);
      const mainRows = parseCSV(mainRes.data);
      const allDataRows = mainRows.slice(1);

      const parseNumber = (val: string) => {
        if (!val) return 0;
        const num = parseFloat(val.toString().replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
      };

      const parseMainNumber = (val: string) => {
        if (!val) return 0;
        const num = parseFloat(val.toString().replace(/,/g, ''));
        return isNaN(num) ? 0 : Math.round(num / 1000000);
      };

      // 1. YoY targets (기존 로직 유지)
      const mainHeaders = mainRows[0] as string[];
      const actualPrevYear = year - 1;
      const prevYearSalesColIdx = mainHeaders.findIndex(h => h.includes(`${actualPrevYear.toString().slice(-2)}년 매출`));
      const currYearTargetColIdx = mainHeaders.findIndex(h => h.includes(`${year.toString().slice(-2)}년 목표`));

      let prevYearTotalSales = 0;
      let currYearTotalTarget = 0;

      for (let i = 1; i <= 12; i++) {
        if (mainRows[i]) {
          if (prevYearSalesColIdx !== -1) prevYearTotalSales += parseMainNumber(mainRows[i][prevYearSalesColIdx]);
          if (currYearTargetColIdx !== -1) currYearTotalTarget += parseMainNumber(mainRows[i][currYearTargetColIdx]);
        }
      }

      // 2. Profitability (기존 로직 유지)
      const getColIdx = (y: number, m: number) => {
        if (y === 2024) return 31 + (m - 1) * 2;
        if (y === 2025) return 61 + (m - 1) * 2;
        if (y === 2026) return 91 + (m - 1) * 2;
        return -1;
      };

      const currMonthCol = getColIdx(year, month);
      const prevMonthCol = getColIdx(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);

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

      const currSales = currMonthCol !== -1 ? parseNumber(profRows[70][currMonthCol]) : 0;
      const prevSales = prevMonthCol !== -1 ? parseNumber(profRows[70][prevMonthCol]) : 0;

      const targetVsActual = categories.map(cat => {
        const row = profRows[cat.rowIdx];
        const currentVal = currMonthCol !== -1 ? parseNumber(row[currMonthCol]) : 0;
        const prevVal = prevMonthCol !== -1 ? parseNumber(row[prevMonthCol]) : 0;
        const growthRate = cat.main === '매출'
          ? (prevVal !== 0 ? ((currentVal - prevVal) / Math.abs(prevVal)) * 100 : 0)
          : (currSales !== 0 && prevSales !== 0 ? (currentVal / currSales * 100) - (prevVal / prevSales * 100) : 0);

        return {
          mainCategory: cat.main, subCategory: cat.sub,
          prevValue: prevVal, prevPercent: prevSales !== 0 ? (prevVal / prevSales) * 100 : 0,
          currValue: currentVal, currPercent: currSales !== 0 ? (currentVal / currSales) * 100 : 0,
          growthRate: growthRate
        };
      });

      const yoy = categories.map(cat => {
        const row = profRows[cat.rowIdx];
        let currentYtd = 0, prevYtd = 0;
        for (let m = 1; m <= month; m++) {
          const cCol = getColIdx(year, m);
          const pCol = getColIdx(year - 1, m);
          if (cCol !== -1) currentYtd += parseNumber(row[cCol]);
          if (pCol !== -1) prevYtd += parseNumber(row[pCol]);
        }
        const targetColIdx = year === 2024 ? 59 : year === 2025 ? 89 : 119;
        return {
          mainCategory: cat.main, subCategory: cat.sub,
          previousYearTotal: cat.main === '매출' ? prevYearTotalSales : 0, // Simplified
          currentYearTarget: parseNumber(row[targetColIdx]),
          currentYearTargetPercent: parseNumber(row[targetColIdx + 1]),
          previousYearYTD: prevYtd, currentYearYTD: currentYtd,
          yoyGrowth: prevYtd !== 0 ? ((currentYtd - prevYtd) / Math.abs(prevYtd)) * 100 : 0
        };
      });

      // [사유 불러오기 수정]
      const targetRowIndex = ((year - 2024) * 12) + month + 3; 
      const savedReason = allDataRows[targetRowIndex] && allDataRows[targetRowIndex][9] ? allDataRows[targetRowIndex][9].toString() : '';

      return { targetVsActual, yoy, savedReason };
    } catch (error) {
      console.error('Failed to fetch profitability data', error);
      throw error;
    }
  },

  async saveReason(year: number, month: number, text: string): Promise<void> {
    try {
      await axios.post(GAS_WEBAPP_URL, JSON.stringify({ year, month, reason: text }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      console.log('Saved successfully');
    } catch (error) {
      console.error('Save failed', error);
      throw error;
    }
  },
  async logout(): Promise<void> {}
};