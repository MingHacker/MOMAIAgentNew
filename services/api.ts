import axios, { AxiosError, AxiosResponse } from 'axios';
import { DateTime } from 'luxon';
import { supabase } from '../utils/supabaseClient'
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API configuration
const API_BASE_URL = 'http://192.168.56.1:8000';
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth types
interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
}

// Type definitions matching backend models
interface BabyProfileCreate {
  name: string;
  birth_date: string; // ISO format
  gender: 'male' | 'female' | 'other';
  birth_weight: number;
  birth_height: number;
}

export interface BabyProfile extends BabyProfileCreate { // Added export
  id: string;
  user_id: string;
}

type LogType = 'feeding' | 'diaper' | 'sleep' | 'cry' | 'bowel';

interface BabyLogCreate {
  baby_id: string;
  log_type: LogType;
  log_data: Record<string, any>;
  logged_at?: string; // ISO format
}

interface BabyLog extends BabyLogCreate {
  id: string;
}

type ReminderType = 'feed' | 'diaper' | 'sleep';

interface ReminderCreate {
  baby_id: string;
  reminder_type: ReminderType;
  reminder_time: string; // ISO format
  notes?: string;
}

interface Reminder extends ReminderCreate {
  id: string;
  is_completed: boolean;
}

interface HealthPredictionCreate {
  baby_id: string;
  prediction_type: string;
  description: string;
  recommended_action: Record<string, any>;
}

interface HealthPrediction extends HealthPredictionCreate {
  id: string;
  user_id: string;
  predicted_on: string; // ISO format
}

// API Client
export const api = {
  // --- Auth Endpoints ---
  login: async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error || !data.session || !data.user) {
        throw error || new Error('Invalid login response')
      }

      const access_token = data.session.access_token;
      const refresh_token = data.session.refresh_token;

      console.log('Email:', credentials.email);
      console.log('Password:', credentials.password);
      console.log('Access token:', access_token);
      console.log('Refresh token:', refresh_token);
      // Save token locally
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('refresh_token', refresh_token);

      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  },
  loginWithToken: async (): Promise<AuthResponse | null> => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        throw error || new Error('Token invalid or expired');
      }

      return {
        access_token: token,
        refresh_token: (await AsyncStorage.getItem('refresh_token')) || '',
        user: {
          id: data.user.id,
          email: data.user.email!,
        },
      };
    } catch (error) {
      console.error("loginWithToken error:", error);
      return null;
    }
  },

  // --- Baby Profile Endpoints ---
  createBabyProfile: async (baby: BabyProfileCreate): Promise<BabyProfile> => {
    try {
      const response = await axiosInstance.post<BabyProfile>('/babies', baby);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getBabyProfile: async (babyId: string): Promise<BabyProfile> => {
    try {
      const response = await axiosInstance.get<BabyProfile>(`/babies/${babyId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getAllBabies: async (): Promise<BabyProfile[]> => {
    try {
      const response = await axiosInstance.get<BabyProfile[]>('/babies');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // --- Baby Log Endpoints ---
  createBabyLog: async (log: BabyLogCreate): Promise<BabyLog> => {
    try {
      const response = await axiosInstance.post<BabyLog>('/baby_logs', {
        ...log,
        logged_at: log.logged_at || DateTime.now().toISO()
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getBabyLogs: async (
    babyId: string,
    options?: {
      logType?: LogType;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<BabyLog[]> => {
    try {
      const params = new URLSearchParams();
      params.append('baby_id', babyId);
      if (options?.logType) params.append('log_type', options.logType);
      if (options?.startDate) params.append('start_date', options.startDate);
      if (options?.endDate) params.append('end_date', options.endDate);

      const response = await axiosInstance.get<BabyLog[]>('/baby_logs', { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // --- Reminder Endpoints ---
  createReminder: async (reminder: ReminderCreate): Promise<Reminder> => {
    try {
      const response = await axiosInstance.post<Reminder>('/reminders', reminder);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateReminderStatus: async (reminderId: string): Promise<Reminder> => {
    try {
      const response = await axiosInstance.patch<Reminder>(`/reminders/${reminderId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getReminders: async (
    babyId: string,
    upcomingOnly: boolean = false
  ): Promise<Reminder[]> => {
    try {
      const response = await axiosInstance.get<Reminder[]>('/reminders', {
        params: {
          baby_id: babyId,
          upcoming: upcomingOnly
        }
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // --- Health Prediction Endpoints ---
  createHealthPrediction: async (
    prediction: HealthPredictionCreate
  ): Promise<HealthPrediction> => {
    try {
      const response = await axiosInstance.post<HealthPrediction>(
        '/health_predictions',
        prediction
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // --- Health Check ---
  healthCheck: async (): Promise<{ status: string }> => {
    try {
      const response = await axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // --- Agent Trigger ---
  triggerReminderGeneration: async (babyId: string): Promise<{ message: string; created_reminders_count: number }> => {
    try {
      const response = await axiosInstance.post(`/babies/${babyId}/generate-reminders`);
      // Assuming the backend returns a specific structure on success
      return response.data; 
    } catch (error) {
      handleApiError(error);
    }
  }
};

// Error handling utility
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(
        `API Error: ${axiosError.response.status} - ${JSON.stringify(
          axiosError.response.data
        )}`
      );
    } else if (axiosError.request) {
      // The request was made but no response was received
      throw new Error('API Error: No response received from server');
    }
  }
  throw new Error(`API Error: ${(error as Error).message}`);
}
