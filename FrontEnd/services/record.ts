import api from '../src/api';
import type { RecordType } from './types/record_type';

// ========== 提交记录接口 ==========
export const submitFeedRecord = (data: {
  userId: string;
  startTime: number;
  amount: number;
}) => api.post('/api/record/feed', data);

export const submitSleepRecord = (data: {
  userId: string;
  startTime: number;
  endTime: number;
}) => api.post('/api/record/sleep', data);

export const submitDiaperRecord = (data: {
  userId: string;
  diaperTime: number;
  solid: boolean;
}) => api.post('/api/record/diaper', data);

export const submitOutsideRecord = (data: {
  userId: string;
  startTime: number;
  endTime: number;
}) => api.post('/api/record/outside', data);


// ========== 单项查询 ==========
export const getTodayRecordsByType = (userId: string, type: RecordType) =>
  api.get(`/record/${type}/today?userId=${userId}`);


// ========== 一次查全部 ==========
export const getTodayAllRecords = async (userId: string) => {
  const types: RecordType[] = [
    'feeding', 'sleep', 'diaper', 'outside',
    'nap', 'exercise', 'music', 'talking', 'vitaminD',
  ];

  const results = await Promise.all(
    types.map((type) => getTodayRecordsByType(userId, type))
  );

  return Object.fromEntries(types.map((type, i) => [type, results[i]]));
};
