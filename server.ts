import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cookieParser());
  app.use(express.json());

  // Google OAuth Configuration
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
  const REDIRECT_URI = `${APP_URL}/auth/callback`;
  
  // Public CSV URL provided by user
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1092502501&single=true&output=csv';
  
  // URL for the '목표비, 전년비' sheet
  const PROFITABILITY_CSV_URL = process.env.PROFITABILITY_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1722593857&single=true&output=csv';

  // API: Get Google OAuth URL (Kept for backward compatibility or future use)
  app.get('/api/auth/google/url', (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      access_type: 'offline',
      prompt: 'consent',
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url });
  });

  // OAuth Callback Handler
  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('No code provided');
    }

    try {
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Set secure cookie
      res.cookie('google_access_token', access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: expires_in * 1000,
      });

      if (refresh_token) {
        res.cookie('google_refresh_token', refresh_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }

      // Close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Token exchange error:', error.response?.data || error.message);
      res.status(500).send('Authentication failed');
    }
  });

  // API: Fetch Sheet Data (Modified to use Public CSV)
  app.get('/api/sheets/data', async (req, res) => {
    // We no longer require OAuth token for the public CSV
    // const accessToken = req.cookies.google_access_token;
    
    try {
      const response = await axios.get(CSV_URL);
      
      // Parse CSV data
      const rows = parse(response.data, {
        columns: false,
        skip_empty_lines: true
      });

      if (!rows || rows.length === 0) {
        return res.json({ data: [] });
      }

      // Parse rows into MonthlyData format
      // Row 1 is header, so we slice from index 1
      // A: Month (0)
      // B: 24 Goal (1)
      // C: 24 Sales (2)
      // D: 25 Goal (3)
      // E: 25 Sales (4)
      // F: 26 Goal (5)
      // G: 26 Sales (6)
      const dataRows = rows.slice(1);

      const data = dataRows.map((row: any[]) => {
        // Handle potential empty or non-numeric cells gracefully
        const parseNum = (val: any, isMonth: boolean = false) => {
            if (!val) return 0;
            // Keep only digits, decimal point, and negative sign
            // This handles "1월", "9,598M", "₩1,000", etc.
            const cleanVal = val.toString().replace(/[^0-9.-]/g, '');
            const num = Number(cleanVal);
            if (isNaN(num)) return 0;
            
            // If it's the month column, return as is
            if (isMonth) return num;

            // Otherwise, round to nearest million
            // Example: 9,597,719,864 -> 9598
            return Math.round(num / 1000000);
        };

        return {
          month: parseNum(row[0], true),
          goal2024: parseNum(row[1]),  // Column B
          sales2024: parseNum(row[2]), // Column C
          goal2025: parseNum(row[3]),  // Column D
          sales2025: parseNum(row[4]), // Column E
          goal2026: parseNum(row[5]),  // Column F
          sales2026: parseNum(row[6]), // Column G
        };
      }).filter((d: any) => d.month > 0 && d.month <= 12); // Filter out invalid rows

      res.json({ data });
    } catch (error: any) {
      console.error('CSV Fetch error:', error.message);
      res.status(500).json({ error: 'Failed to fetch sheet data' });
    }
  });

  // API: Fetch Profitability Data
  app.get('/api/sheets/profitability', async (req, res) => {
    if (!PROFITABILITY_CSV_URL) {
      return res.json({ data: null, message: "PROFITABILITY_CSV_URL is not configured. Using mock data." });
    }

    try {
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ error: 'Year and month are required' });
      }

      const currentYear = parseInt(year as string);
      const currentMonth = parseInt(month as string);
      
      let prevYear = currentYear;
      let prevMonth = currentMonth - 1;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }

      // Fetch both CSVs
      const [profRes, mainRes] = await Promise.all([
        axios.get(PROFITABILITY_CSV_URL),
        axios.get(CSV_URL)
      ]);

      const profRows = parse(profRes.data, { columns: false, skip_empty_lines: true });
      const mainRows = parse(mainRes.data, { columns: false, skip_empty_lines: true });

      const parseNumber = (val: string) => {
        if (!val) return 0;
        const num = parseFloat(val.replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
      };

      const parseMainNumber = (val: string) => {
        if (!val) return 0;
        const num = parseFloat(val.replace(/,/g, ''));
        return isNaN(num) ? 0 : Math.round(num / 1000000);
      };

      // 1. Process main sheet (앉방데이) for YoY targets
      const mainHeaders = mainRows[0] as string[];
      const prevYearSalesColIdx = mainHeaders.findIndex(h => h.includes(`${prevYear.toString().slice(-2)}년 매출`));
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

      // 2. Process profitability sheet (목표비, 전년비)
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
        
        // For '매출', use the values from '앉방데이' for prevYearTotal
        if (cat.main === '매출') {
          prevYearTotal = prevYearTotalSales;
        } else {
          // For other categories, we sum the 12 months of the previous year
          for (let m = 1; m <= 12; m++) {
            const pCol = getColIdx(actualLastYear, m);
            if (pCol !== -1) prevYearTotal += parseNumber(row[pCol]);
          }
        }

        const getTargetColIdx = (y: number) => {
          if (y === 2024) return 59; // BH
          if (y === 2025) return 89; // CL
          if (y === 2026) return 119; // DP
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

      res.json({ data: { targetVsActual, yoy } });

    } catch (error: any) {
      console.error('Profitability CSV Fetch error:', error.message);
      res.status(500).json({ error: 'Failed to fetch profitability data' });
    }
  });

  // API: Check Auth Status (Always true for public CSV)
  app.get('/api/auth/status', (req, res) => {
    // For public CSV, we are always "authenticated" or connected
    res.json({ isAuthenticated: true });
  });

  // API: Logout (No-op for public CSV)
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('google_access_token');
    res.clearCookie('google_refresh_token');
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
