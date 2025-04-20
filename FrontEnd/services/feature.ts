import { axiosInstance } from '../src/api';

// 保存用户选择的功能卡片（比如 feed/sleep 等）
export const saveUserFeatures = (data: {
  userId: string;
  featureIds: string[];
}) => {
  console.log('📡 POST /api/saveUserFeatures:', data);
  return axiosInstance.post('/api/saveUserFeatures', data);
};

// 获取用户已保存的功能卡片
export const getUserFeatures = (userId: string) => {
  console.log('📡 GET /api/getUserFeatures?userId=' + userId);
  return axiosInstance.get(`/api/getUserFeatures?userId=${userId}`);
};

export const getRecommendedFeatures = async (userId: string, ageInMonths: number) => {
  const res = await axiosInstance.get(`/api/recommendFeatures?userId=${userId}&ageInMonths=${ageInMonths}`);
  return res.data;
};