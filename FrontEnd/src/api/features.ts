import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../utils/axiosInstance';

function handleApiError(error: any) {
  console.error('API Error:', error);
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  age_min: number;
  age_max: number;
  created_at?: string;
}

export interface SaveFeaturesRequest {
  userId: string;
  featureIds: string[];
}

export interface FeaturesResponse {
  userId: string;
  featureIds: string[];
}

export interface RecommendedFeaturesResponse {
  recommended: string[];
  debug_data?: any[];
}

/**
 * 保存用户选择的功能特性
 */
export const saveUserFeatures = async (userId: string, featureIds: string[]): Promise<boolean> => {
  try {
    const response = await axiosInstance.post('/api/saveUserFeatures', {
      userId,
      featureIds,
    });
    return response.data.success;
  } catch (error) {
    handleApiError(error);
    return false;
  }
};

/**
 * 获取用户选择的功能特性
 */
export const getUserFeatures = async (userId: string): Promise<FeaturesResponse> => {
  try {
    const response = await axiosInstance.get(`/api/getUserFeatures?userId=${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    return { userId: '', featureIds: [] };
  }
};

/**
 * 根据宝宝月龄获取推荐的功能特性
 */
export const getRecommendedFeatures = async (ageInMonths: number): Promise<RecommendedFeaturesResponse> => {
  try {
    const response = await axiosInstance.get('/api/recommendFeatures', {
      params: { ageInMonths }
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    return { recommended: [] };
  }
};

/**
 * 从数据库获取所有可用的功能特性
 */
export const getAllFeatures = async (): Promise<Feature[]> => {
  try {
    const response = await axiosInstance.get('/api/features');
    return response.data || [];
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

/**
 * 根据ID获取功能特性详情
 */
export const getFeatureById = async (featureId: string): Promise<Feature | null> => {
  try {
    const response = await axiosInstance.get(`/api/features/${featureId}`);
    return response.data || null;
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

/**
 * 根据ID列表批量获取功能特性
 */
export const getFeaturesByIds = async (featureIds: string[]): Promise<Feature[]> => {
  try {
    if (!featureIds.length) return [];
    
    const response = await axiosInstance.get('/api/features/batch', {
      params: { ids: featureIds.join(',') }
    });
    return response.data || [];
  } catch (error) {
    handleApiError(error);
    return [];
  }
}; 