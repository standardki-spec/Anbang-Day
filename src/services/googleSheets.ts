import axios from 'axios';
import { MonthlyData } from '../data/mockData';

export const googleSheetsService = {
  async checkAuth(): Promise<boolean> {
    try {
      const response = await axios.get('/api/auth/status');
      return response.data.isAuthenticated;
    } catch (error) {
      return false;
    }
  },

  async getAuthUrl(): Promise<string> {
    const response = await axios.get('/api/auth/google/url');
    return response.data.url;
  },

  async fetchData(): Promise<MonthlyData[]> {
    const response = await axios.get('/api/sheets/data');
    return response.data.data;
  },

  async logout(): Promise<void> {
    await axios.post('/api/auth/logout');
  }
};
