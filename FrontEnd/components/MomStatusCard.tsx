import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { momApi, MomHealthData, MomSummaryResponse } from '../src/api';
import { Platform } from 'react-native';


export default function MomStatusCard() {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<MomHealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<MomSummaryResponse | null>(null);
  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await momApi.getTodayHealth();
      console.log('Mom health response:', response);  // 添加日志
      const summaryResponse = await momApi.getTodaySummary();
      setSummaryData(summaryResponse);

      if (response.success && response.data) {
        console.log('Mom health data:', response.data);  // 添加日志
        // 检查是否是数组
        if (Array.isArray(response.data)) {
          if (response.data.length > 0) {
            setHealthData(response.data[0]);
          } else {
            setError('No data available today');
          }
        } else {
          // 如果不是数组，直接使用数据
          setHealthData(response.data);
        }
      } else {
        console.log('No health data available:', response);  // 添加日志
        setError('No data available today');
      }
    } catch (e) {
      console.error('Error fetching health data:', e);  // 添加详细错误日志
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#D946EF" />
        <Text style={styles.moodText}>Loading today's wellness...</Text>
      </View>
    );
  }

  if (error || !healthData) {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.moodText}>🌸 Be gentle with yourself today</Text>
          </View>
          <View style={styles.right}>
            {/* 移除显示 "--" 的部分 */}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
            <Text style={styles.moodText}>
            🌸 Be gentle with yourself today
            </Text>
        </View>
        <View style={styles.right}>
          {healthData?.hrv && healthData.hrv > 0 && (
            <Text style={styles.dataItem}>💓 HRV: {healthData.hrv}</Text>
          )}
          {healthData?.sleep_hours && healthData.sleep_hours > 0 && (
            <Text style={styles.dataItem}>💤 Sleep: {healthData.sleep_hours}h</Text>
          )}
          {healthData?.steps && healthData.steps > 0 && (
            <Text style={styles.dataItem}>🚶 Steps: {healthData.steps}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F7FF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: {
    flex: 2,
    paddingRight: 12,
  },
  right: {
    flex: 1.1,
    alignItems: 'flex-end',
  },
  dataStack: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  moodText: {
    fontSize: 14,
    color: '#6B21A8',
    fontFamily: Platform.select({
      ios: 'AvenirNextRounded-Regular',
      android: 'sans-serif-light',
    }),
    lineHeight: 20,
  },
  dataItem: {
    fontSize: 13,
    color: '#8B5CF6',
    fontFamily: Platform.select({
      ios: 'AvenirNextRounded-Regular',
      android: 'sans-serif-light',
    }),
    marginBottom: 4,
  },
  retryButton: {
    marginTop: 8,
    padding: 8,
  },
  retryText: {
    fontSize: 13,
    color: '#8B5CF6',
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontFamily: Platform.select({
      ios: 'AvenirNextRounded-Regular',
      android: 'sans-serif-light',
    }),
    marginTop: 8,
    lineHeight: 18,
  },
  summaryScroll: {
    maxHeight: 60,
    minHeight: 5,
  },
});