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
  async checkAuth(): Promise<boolean> {
    // Dummy function for compatibility
    return true;
  },

  async getAuthUrl(): Promise<string> {
    // Dummy function for compatibility
    return '';
  },

  async fetchData(year: number): Promise<MonthlyData[]> {
    try {
      const response = await axios.get(CSV_URL);
      const rows = parseCSV(response.data);

      if (!rows || rows.length === 0) return [];

      const dataRows = rows.slice(1, 13); // Keep the first 12 months for numbers as per original logic
      const parseNum = (val: any, isMonth: boolean = false) => {
        if (!val) return 0;
        const cleanVal = val.toString().replace(/[^0-9.-]/g, '');
        const num = Number(cleanVal);
        if (isNaN(num)) return 0;
        if (isMonth) return num;
        return Math.round(num / 1000000);
      };

      return dataRows.map((row: any[], idx: number) => {
        const month = idx + 1;
        // Row Index = 5 + ((year - 2024) * 12) + month
        // Array Index = Row Index - 1
        const rowIndex = 4 + ((year - 2024) * 12) + month;
        const reasonRow = rows[rowIndex];
        const reason = reasonRow && reasonRow[9] ? reasonRow[9].toString() : '';

        return {
          month: parseNum(row[0], true),
          goal2024: parseNum(row[1]),
          sales2024: parseNum(row[2]),
          goal2025: parseNum(row[3]),
          sales2025: parseNum(row[4]),
          goal2026: parseNum(row[5]),
          sales2026: parseNum(row[6]),
          reason: reason,
        };
      }).filter((d: any) => d.month > 0 && d.month <= 12);
    } catch (error) {
      console.error('Failed to fetch MonthlyData', error);
      throw error;
    }
  },

  async fetchProfitabilityData(year: number, month: number): Promise<ProfitabilityData> {
    try {
      const [profRes, mainRes] = await Promise.all([
        axios.get(PROFITABILITY_CSV_URL),
        axios.get(CSV_URL)
      ]);

      const profRows = parseCSV(profRes.data);
      const mainRows = parseCSV(mainRes.data);

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

      const currentYear = year;
      const currentMonth = month;
      
      let prevYear = currentYear;
      let prevMonth = currentMonth - 1;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }

      // 1. Process main sheet for YoY targets
      const mainHeaders = mainRows[0] as string[];
      const actualPrevYear = currentYear - 1;
      const prevYearSalesColIdx = mainHeaders.findIndex(h => h.includes(`${actualPrevYear.toString().slice(-2)}년 매출`));
      const currYearTargetColIdx = mainHeaders.findIndex(h => h.includes(`${currentYear.toString().slice(-2)}년 목표`));

      let prevYearTotalSales = 0;
      let currYearTotalTarget = 0;

      for (let i = 1; i <= 12; i++) {
        if (mainRows[i]) {
          if (prevYearSalesColIdx !== -1) {
            prevYearTotalSales += parseMainNumber(mainRows[i][prevYearSalesColIdx]);
          }
          if (currYearTargetColIdx !== -1) {
            currYearTotalTarget += parseMainNumber(mainRows[i][currYearTargetColIdx]);
          }
        }
      }

      // 2. Process profitability sheet
      const getColIdx = (y: number, m: number) => {
        if (y === 2024) return 31 + (m - 1) * 2;
        if (y === 2025) return 61 + (m - 1) * 2;
        if (y === 2026) return 91 + (m - 1) * 2;
        return -1;
      };

      const currMonthCol = getColIdx(currentYear, currentMonth);
      const prevMonthCol = getColIdx(prevYear, prevMonth);

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

      const prevSales = prevMonthCol !== -1 ? parseNumber(profRows[70][prevMonthCol]) : 0;
      const currSales = currMonthCol !== -1 ? parseNumber(profRows[70][currMonthCol]) : 0;

      const targetVsActual = categories.map(cat => {
        const row = profRows[cat.rowIdx];
        const currentVal = currMonthCol !== -1 ? parseNumber(row[currMonthCol]) : 0;
        const prevVal = prevMonthCol !== -1 ? parseNumber(row[prevMonthCol]) : 0;
        
        const growthRate = cat.main === '매출'
          ? (prevVal !== 0 ? ((currentVal - prevVal) / Math.abs(prevVal)) * 100 : 0)
          : (currSales !== 0 && prevSales !== 0 ? (currentVal / currSales * 100) - (prevVal / prevSales * 100) : 0);

        return {
          mainCategory: cat.main,
          subCategory: cat.sub,
          prevValue: prevVal,
          prevPercent: prevSales !== 0 ? (prevVal / prevSales) * 100 : 0,
          currValue: currentVal,
          currPercent: currSales !== 0 ? (currentVal / currSales) * 100 : 0,
          growthRate: growthRate
        };
      });

      const yoy = categories.map(cat => {
        const row = profRows[cat.rowIdx];
        
        let currentYtd = 0;
        let prevYtd = 0;
        const actualLastYear = currentYear - 1;

        for (let m = 1; m <= currentMonth; m++) {
          const cCol = getColIdx(currentYear, m);
          const pCol = getColIdx(actualLastYear, m);
          if (cCol !== -1) currentYtd += parseNumber(row[cCol]);
          if (pCol !== -1) prevYtd += parseNumber(row[pCol]);
        }

        let prevYearTotal = 0;
        if (cat.main === '매출') {
          prevYearTotal = prevYearTotalSales;
        } else {
          for (let m = 1; m <= 12; m++) {
            const pCol = getColIdx(actualLastYear, m);
            if (pCol !== -1) prevYearTotal += parseNumber(row[pCol]);
          }
        }

        const getTargetColIdx = (y: number) => {
          if (y === 2024) return 59;
          if (y === 2025) return 89;
          if (y === 2026) return 119;
          return -1;
        };

        const targetColIdx = getTargetColIdx(currentYear);
        const currYearTarget = targetColIdx !== -1 ? parseNumber(row[targetColIdx]) : 0;
        const currYearTargetPercent = targetColIdx !== -1 ? parseNumber(row[targetColIdx + 1]) : 0;

        return {
          mainCategory: cat.main,
          subCategory: cat.sub,
          previousYearTotal: prevYearTotal,
          currentYearTarget: currYearTarget,
          currentYearTargetPercent: currYearTargetPercent,
          previousYearYTD: prevYtd,
          currentYearYTD: currentYtd,
          yoyGrowth: prevYtd !== 0 ? ((currentYtd - prevYtd) / Math.abs(prevYtd)) * 100 : 0
        };
      });

      // Row Index = 5 + ((year - 2024) * 12) + month
      // Array Index = Row Index - 1
      const rowIndex = 4 + ((year - 2024) * 12) + month;
      const savedReason = mainRows[rowIndex] && mainRows[rowIndex][9] ? mainRows[rowIndex][9].toString() : '';

      return { targetVsActual, yoy, savedReason };
    } catch (error) {
      console.error('Failed to fetch profitability data', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    // Dummy function for compatibility
  },

  async saveReason(year: number, month: number, text: string): Promise<void> {
    try {
      // Use text/plain to avoid CORS preflight issues with GAS
      await axios.post(GAS_WEBAPP_URL, JSON.stringify({
        year,
        month,
        reason: text
      }), {
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });
      console.log('Successfully saved reason to Google Sheets');
    } catch (error) {
      console.error('Failed to save reason to Google Sheets', error);
      throw error;
    }
  }
};
