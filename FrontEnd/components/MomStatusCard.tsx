import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { momApi, MomHealthResponse } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

export default function MomStatusCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<MomHealthResponse | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await momApi.getTodayHealth();
      if (!response.success || !response.summary?.data) {
        setError('Oops, we couldn’t load your data. Please try again in a bit.');
        return;
      }
      setHealthData({ success: true, data: response.summary.data });
      console.log('📦 Mom Health Data:', response);
    } catch (error) {
      console.error('Failed to fetch mom health data:', error);
      setError('Something went wrong while fetching your data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.tip}>Loading your wellness info...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>👩 Mom’s Wellness</Text>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchHealthData}>
          <Text style={styles.refreshText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!healthData?.success || !healthData?.data) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>👩 Mom’s Wellness</Text>
        <Text style={styles.tip}>No data available at the moment.</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchHealthData}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const todayData = healthData.data;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>👩 Mom’s Wellness</Text>
        <View style={styles.headerRight}>
          <Text style={styles.time}>Updated: {dayjs().format('HH:mm')}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchHealthData}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dataContainer}>
        <View style={styles.dataRow}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>💤 Sleep</Text>
            <Text style={styles.dataValue}>{todayData.sleep_hours.toFixed(1)} hrs</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>💓 HRV</Text>
            <Text style={styles.dataValue}>{todayData.hrv}</Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>🚶 Steps</Text>
            <Text style={styles.dataValue}>{todayData.steps}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>✨ Status</Text>
            <Text style={styles.dataValue}>Looking good 💜</Text>
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
