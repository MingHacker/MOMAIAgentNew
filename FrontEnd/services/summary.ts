import api from '../src/api';

// 获取宝宝的健康总结（调用 GPT）
export const getBabySummary = (userId: string) =>
  api.get(`/summary/baby?userId=${userId}`);

// 获取妈妈的健康总结（调用 GPT）
export const getMomSummary = (userId: string) =>
  api.get(`/summary/mom?userId=${userId}`);

