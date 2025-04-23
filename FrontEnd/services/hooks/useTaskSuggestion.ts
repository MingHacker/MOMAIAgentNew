import { getHealthCache } from '../../utils/healthCache';
import { momApi, babyApi } from '../../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../utils/axiosInstance';

interface SuggestedItem {
  text: string;
  selected: boolean;
}

type CategoryType = 'Health' | 'Family' | 'Baby' | 'Other';

export const getTaskSuggestionsFromBackend = async (mainTaskText: string) => {
  try {
    // 获取缓存的健康数据
    let momHealth = await getHealthCache('mom_health');
    let babyHealth = await getHealthCache('baby_health');
    const babyId = await AsyncStorage.getItem('baby_id');

    if (!babyId) {
      throw new Error('No baby_id found');
    }

    // 如果缓存中没有数据，尝试获取最新数据
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
  // ✅ fallback 结构
    const safeMomHealth = momHealth && Object.keys(momHealth).length > 0
    ? momHealth
    : { status: 'ok' };

    const safeBabyHealth = babyHealth && Object.keys(babyHealth).length > 0
    ? babyHealth
    : { status: 'ok' };

    // 调用后端 API 获取任务建议（使用 axiosInstance 自动带上 token）
    try {
      const response = await axiosInstance.post('/api/task/gpt', {
        input_text: mainTaskText,
        mom_health_status: safeMomHealth,
        baby_health_status: safeBabyHealth,
      });

      console.log('API Response:', response.data);

      if (!response.data.success) {
        console.error('API Error:', response.data);
        // 返回默认建议而不是抛出错误
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
      // 返回默认建议而不是抛出错误
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
};

