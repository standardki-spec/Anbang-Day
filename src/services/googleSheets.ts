import axios from 'axios';
import Papa from 'papaparse';
import { MonthlyData, ProfitabilityData } from '../data/mockData';

/**
 * [핵심] 구글 시트 웹 게시(CSV)의 지연 현상을 최소화하기 위해 
 * 매 요청마다 고유한 타임스탬프를 쿼리 파라미터로 붙입니다.
 */
const getFreshUrl = (url: string) => `${url}&t=${new Date().getTime()}`;

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1092502501&single=true&output=csv';
const PROFITABILITY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1722593857&single=true&output=csv';
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzEw7HtLkv5jGLBeObReEbAq9wOqOVknXpeBe8spE516NXGn53_qZwRjFWFS2MhENVz/exec';

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
      const response = await axios.get(getFreshUrl(CSV_URL));
      const rows = parseCSV(response.data);

      if (!rows || rows.length === 0) return [];

      const allDataRows = rows.slice(1); // 헤더(1행) 제외
      
      const parseNum = (val: any, isMonth: boolean = false) => {
        if (!val) return 0;
        const cleanVal = val.toString().replace(/[^0-9.-]/g, '');
        const num = Number(cleanVal);
        if (isNaN(num)) return 0;
        if (isMonth) return num;
        return Math.round(num / 1000000);
      };

      return Array.from({ length: 12 }, (_, idx) => {
        const month = idx + 1;
        
        /**
         * [데이터 매칭 로직 개선]
         * A열(index 0)에서 YYYYMM 형식의 날짜를 찾아 매칭합니다.
         * 사유(reason)는 B열(index 1)에서 가져옵니다.
         */
        const targetYYYYMM = `${year}${month.toString().padStart(2, '0')}`;
        const matchedRow = allDataRows.find(row => row[0]?.toString().trim() === targetYYYYMM);
        const reason = matchedRow && matchedRow[1] ? matchedRow[1].toString() : '';

        const chartRow = allDataRows[idx] || []; 

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
        axios.get(getFreshUrl(PROFITABILITY_CSV_URL)),
        axios.get(getFreshUrl(CSV_URL))
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

      // 1. YoY targets
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

      // 2. Profitability
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
          previousYearTotal: cat.main === '매출' ? prevYearTotalSales : 0,
          currentYearTarget: parseNumber(row[targetColIdx]),
          currentYearTargetPercent: parseNumber(row[targetColIdx + 1]),
          previousYearYTD: prevYtd, currentYearYTD: currentYtd,
          yoyGrowth: prevYtd !== 0 ? ((currentYtd - prevYtd) / Math.abs(prevYtd)) * 100 : 0
        };
      });

      /**
       * [데이터 매칭 로직 개선]
       * A열(index 0)에서 YYYYMM 형식의 날짜를 찾아 매칭합니다.
       * 사유(savedReason)는 B열(index 1)에서 가져옵니다.
       */
      const targetYYYYMM = `${year}${month.toString().padStart(2, '0')}`;
      const matchedRow = allDataRows.find(row => row[0]?.toString().trim() === targetYYYYMM);
      const savedReason = matchedRow && matchedRow[1] ? matchedRow[1].toString() : '';

      return { targetVsActual, yoy, savedReason };
    } catch (error) {
      console.error('Failed to fetch profitability data', error);
      throw error;
    }
  },

  async saveReason(year: number, month: number, text: string): Promise<void> {
    try {
      // GAS 웹앱 URL로 POST 요청 전송
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