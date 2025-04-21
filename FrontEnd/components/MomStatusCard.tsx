import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { momApi, MomHealthResponse } from '../src/api';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

export default function MomStatusCard() {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await momApi.getTodayHealth();
      if (response.success && response.summary?.data) {
        setHealthData(response.summary.data);
      } else {
        setError('No data available today');
      }
    } catch (e) {
      setError('Something went wrong.');
      console.error(e);
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
        <Text style={styles.moodText}>Loading today’s wellness...</Text>
      </View>
    );
  }

  if (error || !healthData) {
    return (
      <View style={styles.card}>
        <Text style={styles.moodText}>🌸 Data not available today</Text>
      </View>
    );
  }

  return (

  <View style={styles.card}>
    <View style={styles.row}>
      {/* 左边 summary */}
      <View style={styles.left}>
        <Text style={styles.moodText}>
        🩷 You're doing great today, mama! Be gentle with yourself 🌿
        </Text>
      </View>

      {/* 右边垂直数据列表 */}
      <View style={styles.right}>
        <View style={styles.dataStack}>
          <Text style={styles.dataItem}>💓 {healthData.hrv}</Text>
          <Text style={styles.dataItem}>💤 {healthData.sleep_hours.toFixed(1)}h</Text>
          <Text style={styles.dataItem}>🚶 {healthData.steps}</Text>
        </View>
      </View>
    </View>
  </View>
  );
}


export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F7FF',
    borderRadius: 16,
    paddingVertical: 12,     // ↓ from 16 → 12
    paddingHorizontal: 14,   // ↓ slightly
    marginHorizontal: 16,
    marginTop: 12,           // ↓ from 16
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
    flex: 1.7,
    paddingRight: 8,
  },
  right: {
    flex: 1,
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
});