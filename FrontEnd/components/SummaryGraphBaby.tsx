import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  ScrollView, 
  Dimensions,
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { BarChart } from 'react-native-chart-kit';
import BabyStatusCard from '../components/BabyStatusCard'; 
import MomStatusCard from '../components/MomStatusCard';
import { momApi } from '../src/api';  // Make sure this is imported
import { babyApi } from '../src/api';  // Make sure this is imported
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

// 设备宽度，用于控制图表大小
const screenWidth = Dimensions.get('window').width;

// x轴标签（示例：一周）
const weekLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function HealthSummaryScreen() {
  const [babyData, setBabyData] = useState<any>(null);
  const [momData, setMomData] = useState<any>(null);
  const [babySummary, setBabySummary] = useState<string | null>(null);
  const [momSummary, setMomSummary] = useState<string | null>(null);


  // 获取宝宝的健康数据（你可以在这里保留现有的数据或使用真实API）
  useEffect(() => {
    const fetchBabyData = async () => {
      try {
        const babyId = await AsyncStorage.getItem('baby_id') || '';
        const response = await babyApi.getWeeklySummary(babyId); // 获取宝宝每周总结数据
        if (response.success && response.data) {
          setBabyData(response.data);  // 格式化后的数据
        }
      } catch (error) {
        console.error('获取宝宝的健康数据失败:', error);
      }
    };

    fetchBabyData();
  }, []);

  if (!babyData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  console.log(babyData);
  // 图表配置
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(120, 70, 250, ${opacity})`, 
    labelColor: (opacity = 1) => `rgba(60, 60, 60, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>

        
        {/* Mom HRV Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Heart Rate (HR)</Text>
            <Text style={styles.cardHeaderSubtitle}>Today {momData[6].resting_heart_rate} bpm</Text>
          </View>
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: momData.map((item) => item.resting_heart_rate) }, // 用真实数据
              ],
            }}
            width={screenWidth * 0.9}
            height={150}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            bezier
          />
        </View>

        {/* Mom Sleep Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Sleep</Text>
            <Text style={styles.cardHeaderSubtitle}>Today {momData[6].sleep_hours} hours</Text>
          </View>
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: momData.map((item) => item.sleep_hours) }, // 用真实数据
              ],
            }}
            width={screenWidth * 0.9}
            height={150}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            bezier
          />
        </View>

        {/* HRV Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>HRV</Text>
            <Text style={styles.cardHeaderSubtitle}>Today {momData[6].hrv}</Text>
          </View>
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: momData.map((item) => item.hrv) }, // 用真实数据
              ],
            }}
            width={screenWidth * 0.9}
            height={150}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            bezier
          />

        </View>

        

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cardHeader: {
    width: '90%',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chartStyle: {
    borderRadius: 8,
    marginLeft: -10,
  },
});

