export interface MonthlyData {
  month: number;
  sales2024: number; // C행: 24년 매출
  goal2024: number;  // B행: 24년 목표
  sales2025: number; // E행: 25년 매출
  goal2025: number;  // D행: 25년 목표
  sales2026: number; // G행: 26년 매출
  goal2026: number;  // F행: 26년 매출 목표
  reason?: string;   // J행: 주요 변동 사유
}

export interface ProfitabilityTargetData {
  mainCategory: string;
  subCategory: string;
  prevValue: number;
  prevPercent: number;
  currValue: number;
  currPercent: number;
  growthRate: number;
}

export interface ProfitabilityYoYData {
  mainCategory: string;
  subCategory: string;
  previousYearTotal: number;
  currentYearTarget: number;
  currentYearTargetPercent?: number;
  previousYearYTD: number;
  currentYearYTD: number;
  yoyGrowth: number;
}

export interface ProfitabilityData {
  targetVsActual: ProfitabilityTargetData[];
  yoy: ProfitabilityYoYData[];
  savedReason?: string;
}

export const mockProfitabilityData: ProfitabilityData = {
  targetVsActual: [
    { mainCategory: '매출', subCategory: '매출', prevValue: 10000, prevPercent: 100, currValue: 10500, currPercent: 100, growthRate: 5 },
    { mainCategory: '변동비', subCategory: '매출원가', prevValue: 5000, prevPercent: 50, currValue: 4800, currPercent: 45.7, growthRate: -4 },
    { mainCategory: '변동비', subCategory: '물류비', prevValue: 1000, prevPercent: 10, currValue: 1100, currPercent: 10.5, growthRate: 10 },
    { mainCategory: '변동비', subCategory: '판매수수료', prevValue: 500, prevPercent: 5, currValue: 550, currPercent: 5.2, growthRate: 10 },
    { mainCategory: '변동비', subCategory: '변동비 합계', prevValue: 6500, prevPercent: 65, currValue: 6450, currPercent: 61.4, growthRate: -0.8 },
    { mainCategory: '공헌이익', subCategory: '공헌이익', prevValue: 3500, prevPercent: 35, currValue: 4050, currPercent: 38.6, growthRate: 15.7 },
    { mainCategory: '고정비', subCategory: '마케팅비', prevValue: 1000, prevPercent: 10, currValue: 1000, currPercent: 9.5, growthRate: 0 },
    { mainCategory: '고정비', subCategory: '감가상각비', prevValue: 200, prevPercent: 2, currValue: 200, currPercent: 1.9, growthRate: 0 },
    { mainCategory: '고정비', subCategory: '기타고정비', prevValue: 800, prevPercent: 8, currValue: 850, currPercent: 8.1, growthRate: 6.3 },
    { mainCategory: '고정비', subCategory: '고정비 합계', prevValue: 2000, prevPercent: 20, currValue: 2050, currPercent: 19.5, growthRate: 2.5 },
    { mainCategory: '영업외손익', subCategory: '영업외손익', prevValue: 100, prevPercent: 1, currValue: 150, currPercent: 1.4, growthRate: 50 },
    { mainCategory: '채산이익', subCategory: '채산이익', prevValue: 1600, prevPercent: 16, currValue: 2150, currPercent: 20.5, growthRate: 34.4 }
  ],
  yoy: [
    { mainCategory: '매출', subCategory: '매출', previousYearTotal: 108804, currentYearTarget: 116200, currentYearTargetPercent: 100, previousYearYTD: 8262, currentYearYTD: 9598, yoyGrowth: 16.2 },
    { mainCategory: '변동비', subCategory: '매출원가', previousYearTotal: 61257, currentYearTarget: 62748, currentYearTargetPercent: 54.0, previousYearYTD: 4503, currentYearYTD: 5507, yoyGrowth: 2.9 },
    { mainCategory: '변동비', subCategory: '물류비', previousYearTotal: 9466, currentYearTarget: 10458, currentYearTargetPercent: 9.0, previousYearYTD: 768, currentYearYTD: 854, yoyGrowth: -0.4 },
    { mainCategory: '변동비', subCategory: '판매수수료', previousYearTotal: 8596, currentYearTarget: 8947, currentYearTargetPercent: 7.7, previousYearYTD: 743, currentYearYTD: 667, yoyGrowth: -2.0 },
    { mainCategory: '변동비', subCategory: '변동비 합계', previousYearTotal: 79318, currentYearTarget: 82037, currentYearTargetPercent: 70.6, previousYearYTD: 6014, currentYearYTD: 7028, yoyGrowth: 0.4 },
    { mainCategory: '공헌이익', subCategory: '공헌이익', previousYearTotal: 29486, currentYearTarget: 34163, currentYearTargetPercent: 29.4, previousYearYTD: 2249, currentYearYTD: 2569, yoyGrowth: -0.4 },
    { mainCategory: '고정비', subCategory: '마케팅비', previousYearTotal: 0, currentYearTarget: 0, previousYearYTD: 558, currentYearYTD: 462, yoyGrowth: -1.9 },
    { mainCategory: '고정비', subCategory: '감가상각비', previousYearTotal: 0, currentYearTarget: 0, previousYearYTD: 117, currentYearYTD: 135, yoyGrowth: 0.0 },
    { mainCategory: '고정비', subCategory: '기타고정비', previousYearTotal: 0, currentYearTarget: 0, previousYearYTD: 901, currentYearYTD: 1067, yoyGrowth: 0.2 },
    { mainCategory: '고정비', subCategory: '고정비 합계', previousYearTotal: 0, currentYearTarget: 0, previousYearYTD: 1576, currentYearYTD: 1664, yoyGrowth: -1.7 },
    { mainCategory: '영업외손익', subCategory: '영업외손익', previousYearTotal: 0, currentYearTarget: 0, previousYearYTD: 141, currentYearYTD: 172, yoyGrowth: 0.1 },
    { mainCategory: '채산이익', subCategory: '채산이익', previousYearTotal: 0, currentYearTarget: 0, previousYearYTD: 813, currentYearYTD: 1078, yoyGrowth: 1.4 }
  ]
};

export const mockData: MonthlyData[] = [
  { month: 1, sales2024: 7800, goal2024: 8000, sales2025: 8262, goal2025: 8500, sales2026: 9598, goal2026: 9500 },
  { month: 2, sales2024: 8100, goal2024: 8200, sales2025: 10111, goal2025: 10000, sales2026: 0, goal2026: 9600 },
  { month: 3, sales2024: 8500, goal2024: 8600, sales2025: 10685, goal2025: 10500, sales2026: 0, goal2026: 9800 },
  { month: 4, sales2024: 8200, goal2024: 8300, sales2025: 8330, goal2025: 8500, sales2026: 0, goal2026: 9700 },
  { month: 5, sales2024: 8300, goal2024: 8400, sales2025: 8275, goal2025: 8500, sales2026: 0, goal2026: 9900 },
  { month: 6, sales2024: 8000, goal2024: 8100, sales2025: 8301, goal2025: 8500, sales2026: 0, goal2026: 9500 },
  { month: 7, sales2024: 8600, goal2024: 8700, sales2025: 8717, goal2025: 8800, sales2026: 0, goal2026: 9800 },
  { month: 8, sales2024: 8900, goal2024: 9000, sales2025: 8821, goal2025: 9000, sales2026: 0, goal2026: 10000 },
  { month: 9, sales2024: 8400, goal2024: 8500, sales2025: 7129, goal2025: 7500, sales2026: 0, goal2026: 9800 },
  { month: 10, sales2024: 8700, goal2024: 8800, sales2025: 7850, goal2025: 8000, sales2026: 0, goal2026: 9600 },
  { month: 11, sales2024: 9000, goal2024: 9200, sales2025: 8636, goal2025: 8800, sales2026: 0, goal2026: 9500 },
  { month: 12, sales2024: 9200, goal2024: 9300, sales2025: 10279, goal2025: 10500, sales2026: 0, goal2026: 9500 },
];

// Helper to get YTD Sales for a specific year
export const getYTD = (data: MonthlyData[], year: number, month: number) => {
  return data
    .filter((d) => d.month <= month)
    .reduce(
      (acc, curr) => {
        if (year === 2026) return acc + curr.sales2026;
        if (year === 2025) return acc + curr.sales2025;
        if (year === 2024) return acc + curr.sales2024;
        return acc;
      },
      0
    );
};

// Helper to get YTD Goal for a specific year
export const getGoalYTD = (data: MonthlyData[], year: number, month: number) => {
  return data
    .filter((d) => d.month <= month)
    .reduce((acc, curr) => {
      if (year === 2026) return acc + curr.goal2026;
      if (year === 2025) return acc + curr.goal2025;
      if (year === 2024) return acc + curr.goal2024;
      return acc;
    }, 0);
};

// Helper to get Total Goal for a specific year
export const getTotalGoal = (data: MonthlyData[], year: number) => {
  return data.reduce((acc, curr) => {
    if (year === 2026) return acc + curr.goal2026;
    if (year === 2025) return acc + curr.goal2025;
    if (year === 2024) return acc + curr.goal2024;
    return acc;
  }, 0);
};

// Helper to get Total Sales for 2026 (kept for compatibility if needed, but better to generalize)
export const getTotalSales2026 = (data: MonthlyData[]) => {
  return data.reduce((acc, curr) => acc + curr.sales2026, 0);
};
