import axios, { AxiosError, AxiosResponse } from 'axios';
import { DateTime } from 'luxon';
import { supabase } from './supabaseClient'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL} from '@env';
// Base API configuration
export const axiosInstance = axios.create({
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

type ReminderType = 'feeding' | 'diaper' | 'sleep';

interface ReminderCreate {
  baby_id: string;
  reminder_type: ReminderType;
  reminder_time: string; // ISO format
  notes?: string;
}

export interface Reminder extends ReminderCreate {
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

  completeReminderByLog: async (babyId: string, logType: string): Promise<{ message: string }> => {
    try {
      const response = await axiosInstance.post<{ message: string }>('/reminders/complete_by_log', {
        baby_id: babyId,
        log_type: logType,
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
  },

  getEmotion: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emotion/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching emotion:', error);
      throw error;
    }
  },

  // Chat History--------------------------------------------
  getChatHistory: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }
      const response = await axiosInstance.get('/chat/history');
      if (!response.data) {
        return [];
      }
      // console.log('chat history from api ts:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return [];
    }
  },

  sendChatMessage: async (message: string) => {
    try {
      const response = await axiosInstance.post('/chat/send', {
        message,
        role: 'user',
        source: 'chatbot'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      return { success: false, message: 'Failed to send message' };
    }
  },

  saveChatMessage: async (message: string, isUser: boolean) => {
    try {
      const response = await axiosInstance.post('/chat/save', {
        message,
        role: isUser ? 'user' : 'assistant',
        source: 'chatbot'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to save chat message:', error);
      return { success: false };
    }
  },
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

// --- Mom Endpoints ---

export type MomSummaryResponse = {
  success: boolean;
  summary: string;
};

export type MomHealthData = {
  date: string;
  hrv: number;
  sleep_hours: number;
  resting_heart_rate: number;
  steps: number;
  breathing_rate: number;
  mood: string;
  calories_burned: number;
  stress_level: string;
};

export type MomHealthResponse = {
  success: boolean;
  data: MomHealthData[];
};

export type MomOneSentenceResponse = {
  success: boolean;
  onesentence: string;
};

export const momApi = {
  getTodaySummary: async (): Promise<MomSummaryResponse> => {
    try {
      const response = await axiosInstance.get('/api/mom/summary');
      return response.data;
    } catch (error) {
      handleApiError(error);
      return { success: false, summary: '' };
    }
  },

  getTodayHealth: async (): Promise<MomHealthResponse> => {
    try {
      const res = await axiosInstance.get<MomHealthResponse>('/api/mom/health/daily');
      return res.data;
    } catch (error) {
      handleApiError(error);
      return { success: false, data: [] };
    }
  },

  getWeeklyHealth: async (): Promise<MomHealthResponse> => {
    try {
      const res = await axiosInstance.get<MomHealthResponse>('/api/mom/health/weekly');
      return res.data;
    } catch (error) {
      handleApiError(error);
      return { success: false, data: [] };
    }
  },

  getOneSentence: async (): Promise<MomOneSentenceResponse> => {
    try {
      const res = await axiosInstance.get<MomOneSentenceResponse>('/api/mom/onesentence');
      console.log('🧠 获取到的妈妈一句话：', res.data);
      return res.data;
    } catch (error) {
      handleApiError(error);
      return { success: false, onesentence: '' };
    }
  }
};

// --- Baby Endpoints ---

export type BabySummaryResponse = {
  success: boolean;
  summary: string;
  next_action: string;
};

export type BabyWeeklyItem = {
  date: string;
  feed_total_ml: number;
  sleep_total_hours: number;
  diaper_count: number;
  bowel_count: number;
  outside_total_minutes: number;
  cry_total_minutes: number;
};

export type BabyWeeklySummaryResponse = {
  success: boolean;
  data: BabyWeeklyItem[];
};

export type BabyRawDataResponse = {
  success: boolean;
  summary: {
    babyName: string;
    feed: any[];
    sleep: any[];
    diaper: any[];
    cry: any[];
    bowel: any[];
    outside: any[];
  };
};

export const babyApi = {
  // ✅ 获取今天的宝宝总结分析
  getTodaySummary: async (babyId: string): Promise<BabySummaryResponse> => {
    try {
      const res = await axiosInstance.get<BabySummaryResponse>(
        `/api/baby/summary`, {
          params: { baby_id: babyId }
        }
      );
      return res.data;
    } catch (error) {
      handleApiError(error);
      return { success: false, summary: '', next_action: '' };
    }
  },

  // ✅ 获取宝宝一周总结
  getWeeklySummary: async (babyId: string): Promise<BabyWeeklySummaryResponse> => {
    try {
      const res = await axiosInstance.get<BabyWeeklySummaryResponse>(
        `/api/baby/summary/week`, {
          params: { baby_id: babyId }
        }
      );
      return res.data;
    } catch (error) {
      handleApiError(error);
      return { success: false, data: [] };
    }
  },

  // ✅ 获取宝宝的原始 daily 数据（睡眠、喝奶等）
  getRawDailyData: async (babyId: string): Promise<BabyRawDataResponse> => {
    try {
      const res = await axiosInstance.get<BabyRawDataResponse>(
        `/api/baby/health/daily`, {
          params: { baby_id: babyId }
        }
      );
      return res.data;
    } catch (error) {
      handleApiError(error);
      return {
        success: false,
        summary: {
          babyName: '',
          feed: [],
          sleep: [],
          diaper: [],
          cry: [],
          bowel: [],
          outside: []
        }
      };
    }
  }
};


// --- Emotion Endpoints ---

export type EmotionTodayResponse = {
  success: boolean;
  summary: string;
  emotion_label: string;
  suggestions: string[];
  gentle_message: string;
};

const emotionApi = {
  getTodayEmotion: async (babyId: string): Promise<EmotionTodayResponse> => {
    try {
      const res = await axiosInstance.get<EmotionTodayResponse>(
        `/api/emotion/today?baby_id=${babyId}`
      );
      return res.data;
    } catch (error) {
      handleApiError(error);
      return {
        success: false,
        summary: '',
        emotion_label: '',
        suggestions: [],
        gentle_message: ''
      };
    }
  }
};

// --- Timeline Endpoints ---

export interface TimelineItem {
  id: string;
  baby_id: string;
  user_id: string;
  date: string;
  title: string;
  emoji?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export const timelineApi = {
  getTimeline: async (babyId: string): Promise<TimelineItem[]> => {
    try {
      const response = await axiosInstance.get(`/api/timeline`, {
        params: { baby_id: babyId }
      });
      return response.data;
    } catch (error) {
      console.error('获取时间线失败:', error);
      return [];
    }
  },

  addTimeline: async (data: {
    baby_id: string;
    user_id: string;
    date: string;
    title: string;
    emoji?: string;
    description?: string;
    image_url?: string;
  }): Promise<boolean> => {
    try {
      const response = await axiosInstance.post('/api/timeline', data);
      return response.data.success;
    } catch (error) {
      console.error('添加时间线失败:', error);
      return false;
    }
  }
};