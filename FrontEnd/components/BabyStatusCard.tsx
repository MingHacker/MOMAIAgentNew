import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { babyApi, BabyRawDataResponse, BabySummaryResponse } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

export default function BabyStatusCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<BabyRawDataResponse | null>(null);
  const [summaryData, setSummaryData] = useState<BabySummaryResponse | null>(null);

  const fetchBabyData = async () => {
    try {
      setLoading(true);
      const babyId = await AsyncStorage.getItem('baby_id') || '';
      if (!babyId) {
        setError('No baby info found');
        return;
      }

      const dailyResponse = await babyApi.getRawDailyData(babyId);
      setDailyData(dailyResponse);

      const summaryResponse = await babyApi.getTodaySummary(babyId);
      if (summaryResponse.success && summaryResponse.summary) {
        setSummaryData(summaryResponse);
      } else {
        console.error('Failed to fetch baby data:', summaryResponse);
        setError('Failed to fetch baby data');
      }
    } catch (error) {
      console.error('Failed to fetch baby data:', error);
      setError('Failed to fetch baby data');
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
        <ActivityIndicator size="small" color="#8B5CF6" />
        <Text style={styles.summaryText}>Loading baby status...</Text>
      </View>
    );
  }

  if (error || !dailyData?.success) {
    return (
      <View style={styles.card}>
        <Text style={styles.summaryText}> No data available today</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchBabyData}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Daily baby summary
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
      <View style={styles.row}>
        {/* Left: Baby summary message */}
        <View style={styles.left}>
          <ScrollView 
            style={styles.summaryScroll}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.summaryText}>
              {summaryData?.summary || '🩷Baby seems happy today — well fed and well rested 💫'}
            </Text>
          </ScrollView>
        </View>

        {/* Right: Data stack */}
        <View style={styles.right}>
          <Text style={styles.dataItem}>🍼 {todayData.feeding}ml</Text>
          <Text style={styles.dataItem}>💤 {todayData.sleep.toFixed(1)}h</Text>
          <Text style={styles.dataItem}>🧷 {todayData.diaper}x 😢 {todayData.cry}min</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F7FF',
    borderRadius: 16,
    paddingVertical: 12,     // ↓ from 16 → 12
    paddingHorizontal: 14,   // ↓ slightly
    marginHorizontal: 16,
    marginTop: 8,           // ↓ from 16
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
  summaryText: {
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
  refreshButton: {
    marginTop: 10,
    padding: 4,
    backgroundColor: '#EDE9FE',
    borderRadius: 4,
  },
  refreshText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'AvenirNextRounded-Regular',
      android: 'sans-serif-light',
    }),
  },
  summaryScroll: {
    maxHeight: 60,
    minHeight: 5,
  },
});
