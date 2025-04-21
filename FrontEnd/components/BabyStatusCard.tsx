import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { babyApi, BabyRawDataResponse } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

export default function BabyStatusCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<BabyRawDataResponse | null>(null);

  const fetchBabyData = async () => {
    try {
      setLoading(true);
      const babyId = await AsyncStorage.getItem('baby_id');
      if (!babyId) {
        setError('未找到宝宝信息');
        return;
      }

      const response = await babyApi.getRawDailyData(babyId);
      setDailyData(response);
    } catch (error) {
      console.error('获取宝宝数据失败:', error);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBabyData();
    const interval = setInterval(fetchBabyData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.tip}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>👶 宝宝今日数据</Text>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchBabyData}>
          <Text style={styles.refreshText}>刷新</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dailyData?.success) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>👶 宝宝今日数据</Text>
        <Text style={styles.tip}>暂无今日数据</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchBabyData}>
          <Text style={styles.refreshText}>刷新</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 计算今日数据
  const todayData = {
    feeding: dailyData.summary.feed.reduce((sum, item) => sum + Number(item.feedAmount || 0), 0),
    sleep: dailyData.summary.sleep.reduce((sum, item) => {
      const start = dayjs(item.sleepStart, 'HH:mm');
      const end = dayjs(item.sleepEnd, 'HH:mm');
      return sum + end.diff(start, 'hour', true);
    }, 0),
    diaper: dailyData.summary.diaper.length,
    cry: dailyData.summary.cry.reduce((sum, item) => sum + Number(item.duration || 0), 0),
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>👼 Baby's Daily Stats</Text>
        <View style={styles.headerRight}>
          <Text style={styles.time}>Updated: {dayjs().format('HH:mm')}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchBabyData}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.dataContainer}>
        <View style={styles.dataRow}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>🍶 Feeding</Text>
            <Text style={styles.dataValue}>{todayData.feeding}ml</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>💫 Sleep</Text>
            <Text style={styles.dataValue}>{todayData.sleep.toFixed(1)}hr</Text>
          </View>
        </View>
        
        <View style={styles.dataRow}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>🧸 Diaper</Text>
            <Text style={styles.dataValue}>{todayData.diaper} times</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>🌞 Outside</Text>
            <Text style={styles.dataValue}>{todayData.cry}min</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#ccc',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  dataContainer: {
    width: '100%',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dataItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  dataLabel: {
    fontSize: 14,
    color: '#4C3575',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  tip: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 4,
    backgroundColor: '#F3E8FF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  refreshText: {
    color: '#8B5CF6',
    fontSize: 12,
  },
});
