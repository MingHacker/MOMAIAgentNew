import { momApi, babyApi } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 设置健康数据缓存
export const setHealthCache = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    console.log(`✅ 成功缓存 ${key} 数据`);
  } catch (error) {
    console.error(`❌ 缓存 ${key} 数据失败:`, error);
  }
};

// 获取健康数据缓存
export const getHealthCache = async (key: string) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`❌ 获取 ${key} 缓存失败:`, error);
    return null;
  }
};

export const initHealthCache = async () => {
  try {
    const babyId = await AsyncStorage.getItem('baby_id');
    if (!babyId) throw new Error('No baby_id found');

    // ✅ 1. 获取妈妈健康数据
    const momHealth = await momApi.getTodayHealth();
    if (momHealth.success && momHealth.data) {
      await setHealthCache('mom_health', momHealth.data);
    } else {
      console.warn('👩 mom_health 数据为空，将跳过缓存');
    }

    // ✅ 2. 获取宝宝健康数据
    const babyHealth = await babyApi.getRawDailyData(babyId);
    if (babyHealth.success && babyHealth.summary) {
      await setHealthCache('baby_health', babyHealth.summary);
    } else {
      console.warn('👶 baby_health 数据为空，将跳过缓存');
    }

    console.log('✅ 健康数据缓存完成');
  } catch (error) {
    console.error('❌ 健康数据缓存失败:', error);
  }
};
