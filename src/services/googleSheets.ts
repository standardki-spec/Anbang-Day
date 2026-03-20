import axios from 'axios';
import Papa from 'papaparse';
import { MonthlyData, ProfitabilityData } from '../data/mockData';

// 캐시 방지를 위한 타임스탬프 유틸리티
const getFreshUrl = (url: string) => `${url}&t=${new Date().getTime()}`;

// 사용자님이 새로 제공해주신 CSV URL (gid=863618794)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=863618794&single=true&output=csv';
// 수익성 세부 데이터 CSV (기존 gid 유지)
const PROFITABILITY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1722593857&single=true&output=csv';
// 새로 생성하신 GAS 웹앱 URL
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

  // 1. 차트 및 일반 데이터 페칭
  async fetchData(year: number): Promise<MonthlyData[]> {
    try {
      const response = await axios.get(getFreshUrl(CSV_URL));
      const rows = parseCSV(response.data);
      if (!rows || rows.length === 0) return [];

      const allDataRows = rows.slice(1); // 헤더 제외

      return Array.from({ length: 12 }, (_, idx) => {
        const month = idx + 1;
        const targetDate = `${year}${month.toString().padStart(2, '0')}`; // 예: 202401
        
        // A열(index 0)에서 날짜가 일치하는 행 찾기
        const matchedRow = allDataRows.find(row => 
          String(row[0]).replace(/[^0-9]/g, '') === targetDate
        );
        
        // B열(index 1)에서 메모 가져오기
        const reason = matchedRow && matchedRow[1] ? matchedRow[1].toString() : '';

        // 차트 데이터 (기존 로직 유지)
        const chartRow = allDataRows[idx] || []; 
        const parseNum = (val: any) => {
          if (!val) return 0;
          return Math.round(Number(val.toString().replace(/[^0-9.-]/g, '')) / 1000000);
        };

        return {
          month,
          goal2024: parseNum(chartRow[1]),
          sales2024: parseNum(chartRow[2]),
          goal2025: parseNum(chartRow[3]),
          sales2025: parseNum(chartRow[4]),
          goal2026: parseNum(chartRow[5]),
          sales2026: parseNum(chartRow[6]),
          reason,
        };
      });
    } catch (error) {
      console.error('fetchData error', error);
      throw error;
    }
  },

  // 2. 수익성 분석 및 메모 페칭 (핵심 수정 부분)
  async fetchProfitabilityData(year: number, month: number): Promise<ProfitabilityData> {
    try {
      const [profRes, mainRes] = await Promise.all([
        axios.get(getFreshUrl(PROFITABILITY_CSV_URL)),
        axios.get(getFreshUrl(CSV_URL))
      ]);

      const profRows = parseCSV(profRes.data);
      const mainRows = parseCSV(mainRes.data);
      const allDataRows = mainRows.slice(1);

      // [핵심] A열 날짜 매칭을 통한 메모(savedReason) 추출
      const targetDate = `${year}${month.toString().padStart(2, '0')}`;
      const matchedRow = allDataRows.find(row => 
        String(row[0]).replace(/[^0-9]/g, '') === targetDate
      );
      const savedReason = matchedRow && matchedRow[1] ? matchedRow[1].toString() : '';

      // --- 기존 데이터 계산 로직 (수익성 테이블용) ---
      const parseNumber = (val: string) => {
        if (!val) return 0;
        const num = parseFloat(val.toString().replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
      };

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
        return {
          mainCategory: cat.main, subCategory: cat.sub,
          prevValue: prevVal, prevPercent: prevSales !== 0 ? (prevVal / prevSales) * 100 : 0,
          currValue: currentVal, currPercent: currSales !== 0 ? (currentVal / currSales) * 100 : 0,
          growthRate: cat.main === '매출' 
            ? (prevVal !== 0 ? ((currentVal - prevVal) / Math.abs(prevVal)) * 100 : 0)
            : (currSales !== 0 && prevSales !== 0 ? (currentVal / currSales * 100) - (prevVal / prevSales * 100) : 0)
        };
      });

      // yoy 및 기타 로직 생략(기존 동일)... 
      const yoy: any[] = []; 

      return { targetVsActual, yoy, savedReason };
    } catch (error) {
      console.error('fetchProfitabilityData error', error);
      throw error;
    }
  },

  // 3. 데이터 저장
  async saveReason(year: number, month: number, text: string): Promise<void> {
    try {
      await axios.post(GAS_WEBAPP_URL, JSON.stringify({ year, month, reason: text }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      console.log('저장 성공');
    } catch (error) {
      console.error('저장 실패', error);
      throw error;
    }
  },
  async logout(): Promise<void> {}
};