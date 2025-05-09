import axios, { AxiosError, AxiosResponse } from 'axios';
import { DateTime } from 'luxon';
import { supabase } from './supabaseClient'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL} from '@env';
import { getHealthCache } from '../utils/healthCache'; // Import getHealthCache


// Base API configuration
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

//console.log('API_BASE_URL:', API_BASE_URL); 

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

type LogType = 'feeding' | 'diaper' | 'sleep' | 'outside';

interface BabyLogCreate {
  baby_id: string;
  log_type: LogType;
  log_data: Record<string, any>;
  logged_at?: string; // ISO format
}

interface BabyLog extends BabyLogCreate {
  id: string;
}

type ReminderType = 'feeding' | 'diaper' | 'sleep' | 'outside';

interface ReminderCreate {
  baby_id: string;
  reminder_type: ReminderType;
  reminder_time: string; // ISO format
  daily_summary: string;
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
      // if (!token)  console.log('No access token found');
      if (!token) return null;
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
      console.log("loginWithToken:", error);
      return null;
    }
  },
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('🔒 Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
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
      console.log('Today Summary:', response.data);
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
      if (!res.data || !res.data.data) {
        return { success: true, data: [] };
      }
      return res.data;
    } catch (error) {
      console.error('获取妈妈每周健康数据失败:', error);
      return { success: false, data: [] };
    }
  },

  getOneSentence: async (): Promise<MomOneSentenceResponse> => {
    try {
      const onesentence = await axiosInstance.get<MomOneSentenceResponse>('/api/mom/onesentence');
      console.log('🧠 获取到的妈妈一句话：', onesentence.data);
      return onesentence.data;
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

// --- Task Endpoints ---

// 子任务类型
interface TaskUpdate {
  id: string;
  done: Boolean;
}

// 任务类型
interface Task {
  id: string;
  text: string;
  type: CategoryType;
  done: boolean;
  subTasks: SubTask[];
  title: string;
  description: string;
  created_at: string;
  completed: boolean;
}

// 子任务类型
interface SubTask {
  id: string;
  text: string;
  done: boolean;
  type: CategoryType;
}

// "建议子任务"的结构（包括是否被选中）
interface SuggestedItem {
  text: string;
  selected: boolean;
}

type CategoryType = 'Health' | 'Family' | 'Baby' | 'Other';


export const taskApi = {
  updateTaskStatus: async (
    mainTaskId: string,
    subTasks: TaskUpdate[],
    done: boolean
  ) => {
    try {
      const mainTaskUpdate: TaskUpdate = {
        id: mainTaskId,
        done: done
      }

      const res = await axiosInstance.post('/api/task/update', {
        main_task: mainTaskUpdate,
        sub_tasks: subTasks,
      });
      console.log('✅ Task status updated successfully:', res.data);
      return res.data;
    } catch (err) {
      console.error('❌ Failed to update task status:', err);
      throw err;
    }
  },

  submitTaskToBackend: async (task: Task) => {
    try {
      // Prepare data to send to backend
      const taskData = {
        main_task: {
          id: task.id,
          text: task.text,
          type: task.type || 'Other',
          done: task.done,
          title: task.title || task.text,
          description: task.description || '',
          created_at: task.created_at,
          completed: task.completed
        },
        sub_tasks: task.subTasks.map(subTask => ({
          id: subTask.id,
          text: subTask.text,
          done: subTask.done,
          main_task_id: task.id,
          type: task.type || 'Other',
        }))
      };

      console.log('Saving task to backend:', JSON.stringify(taskData, null, 2));

      const result = await axiosInstance.post('/api/task/save', taskData);

      if (result.data && result.data.success) {
        console.log('✅ Task saved successfully:', result.data);
      } else {
        console.error('❌ Failed to save task:', result.data);
        throw new Error(result.data?.message || 'Failed to save task');
      }
    } catch (error: any) {
      console.error('❌ Error saving task:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },

  getTaskSuggestionsFromBackend: async (mainTaskText: string) => {
    try {
      // Get cached health data
      let momHealth = await getHealthCache('mom_health');
      let babyHealth = await getHealthCache('baby_health');
      const babyId = await AsyncStorage.getItem('baby_id');

      if (!babyId) {
        throw new Error('No baby_id found');
      }

      // If no data in cache, try to get latest data
      if (!momHealth) {
        const momResponse = await momApi.getTodayHealth();
        if (momResponse.success && momResponse.data) {
          momHealth = momResponse.data;
        }
      }

      if (!babyHealth) {
        const babyResponse = await babyApi.getRawDailyData(babyId);
        if (babyResponse.success && babyResponse.summary) {
          babyHealth = babyResponse.summary;
        }
      }
    // ✅ fallback structure
      const safeMomHealth = momHealth && Object.keys(momHealth).length > 0
      ? momHealth
      : { status: 'ok' };

      const safeBabyHealth = babyHealth && Object.keys(babyHealth).length > 0
      ? babyHealth
      : { status: 'ok' };

      // Call backend API to get task suggestions (using axiosInstance with token)
      try {
        const response = await axiosInstance.post('/api/task/gpt', {
          input_text: mainTaskText,
          mom_health_status: safeMomHealth,
          baby_health_status: safeBabyHealth,
        });

        console.log('API Response:', response.data);

        if (!response.data.success) {
          console.error('API Error:', response.data);
          // Return default suggestions instead of throwing error
          return {
            category: 'Other',
            suggestions: [
              { text: '记录任务完成情况', selected: false },
              { text: '设置提醒', selected: false },
              { text: '添加备注', selected: false }
            ],
          };
        }

        return {
          category: response.data.category,
          suggestions: response.data.output.map((item: { title: string }) => ({
            text: item.title,
            selected: false,
          })),
        };
      } catch (error: any) {
        console.error('API Request Error:', error.response?.data || error);
        // Return default suggestions instead of throwing error
        return {
          category: 'Other',
          suggestions: [
            { text: '记录任务完成情况', selected: false },
            { text: '设置提醒', selected: false },
            { text: '添加备注', selected: false }
          ],
        };
      }
    } catch (error) {
      console.error('获取任务建议失败:', error);
      return {
        category: 'Other',
        suggestions: [],
      };
    }
  },

  getIncompleteTasks: async (): Promise<Task[]> => {
    try {
      const response = await axiosInstance.get('/api/task/incomplete');
      console.log('✅ Fetched incomplete tasks:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch incomplete tasks:', error);
      throw error;
    }
  },
};

export const qaApi = {
  askQuestion: async (question: string, imageBase64?: string) => {
    try {
      const response = await axiosInstance.post('/api/qa/ask', {
        question,
        image_base64: imageBase64
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getQaHistory: async () => {
    try {
      const response = await axiosInstance.get('/api/qa/history');
      return response.data;
    } catch (error) {
      handleApiError(error);
      return [];
    }
  }
};