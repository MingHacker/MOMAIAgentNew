import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL} from '@env';
const baseURL = API_BASE_URL

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000, // 10秒超时
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;