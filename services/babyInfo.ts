import api from './api';

// 保存宝宝信息
export const saveBabyInfo = (data: {
  userId: string;
  name: string;
  avatar: string;
  birthDate: string;   // YYYY-MM-DD
  weight: string;
  height: string;
}) => api.post('/baby/info', data);

// 获取宝宝信息
export const getBabyInfo = (userId: string) =>
  api.get(`/baby/info?userId=${userId}`);
