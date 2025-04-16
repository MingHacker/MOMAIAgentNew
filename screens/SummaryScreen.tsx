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
// 如果用react-native-health或react-native-apple-healthkit，请在此处import

// 设备宽度，用于控制图表大小
const screenWidth = Dimensions.get('window').width;

// 假装这是从HealthKit获取数据的函数

async function fetchHealthDataFromApple() {
  // 在这里用 react-native-apple-healthkit 或 react-native-health
  // 请求权限并查询数据...
  // 这里只是示例写死
  return {
    baby: {
      feeding: [100, 120, 80, 150, 90, 110, 140], // 每日ml
      sleep: [10, 13, 9, 12, 14, 11, 13],         // 小时
      diaper: [4, 5, 3, 6, 5, 4, 5],             // 数量
      cry: [5, 10, 8, 15, 7, 12, 9],             // 分钟
    },
    mom: {
      hr: [72, 68, 70, 66, 74, 71, 69],          // 心率
      sleep: [6, 7.5, 6.5, 8, 7, 7.2, 7.5],      // 小时
      hrv: [30, 34, 29, 35, 33, 31, 34],         // HRV
      steps: 2131,                               // 当天步数
      temperatureDiff: 0.2,                     // 相比昨天下降或上升0.2℃ 
    }
  };
}

export default function HealthSummaryScreen() {
  const [babyData, setBabyData] = useState<any>(null);
  const [momData, setMomData] = useState<any>(null);
  const [babySummary, setBabySummary] = useState<string | null>(null);
  const [momSummary, setMomSummary] = useState<string | null>(null);
  useEffect(() => {
    // 原本的数据获取（比如 babyData、momData）
    (async () => {
      const data = await fetchHealthDataFromApple();
      setBabyData(data.baby);
      setMomData(data.mom);
    })();
  }, []);
  
  // ✅ 新增一个新的 useEffect，用于定时请求 summary 数据
  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res1 = await fetch('http://10.0.0.23:8000/api/summary');
        const json1 = await res1.json();
        setBabySummary(json1.summary);
  
        const res2 = await fetch('http://10.0.0.23:8000/api/mom_summary');
        const json2 = await res2.json();
        setMomSummary(json2.summary);
      } catch (e) {
        console.error('❌ 获取分析失败', e);
      }
    };
  
    fetchSummaries();
  
    const interval = setInterval(() => {
      fetchSummaries();
    }, 2 * 60 * 60 * 1000); // 2小时刷新一次
  
    return () => clearInterval(interval); // 卸载清除
  }, []);

  if (!babyData || !momData) {
    // 数据没取到前简单做个loading
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>正在加载健康数据...</Text>
      </SafeAreaView>
    );
  }

  // x轴标签（示例：一周）
  const weekLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <BabyStatusCard summary={babySummary} />
        <MomStatusCard summary={momSummary} />

        <Text style={styles.headerTitle}>Baby Summary</Text>
        
        {/* Baby Feeding Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Feeding</Text>
            <Text style={styles.cardHeaderSubtitle}>Today {babyData.feeding[3]}ml</Text>
            {/* 这里假设第4天是今天(Thu) */}
          </View>
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: babyData.feeding },
              ],
            }}
            width={screenWidth * 0.9}   // 图表宽度(可根据布局需要微调)
            height={150}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            bezier
          />
        </View>

        {/* Baby Sleep Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Sleep</Text>
            <Text style={styles.cardHeaderSubtitle}>Today {babyData.sleep[3]}hr</Text>
          </View>
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: babyData.sleep },
              ],
            }}
            width={screenWidth * 0.9}
            height={150}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            bezier
          />
        </View>

        {/* Baby Diaper Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Diaper</Text>
            <Text style={styles.cardHeaderSubtitle}>Today {babyData.diaper[3]} times</Text>
          </View>
          <BarChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: babyData.diaper },
              ],
            }}
            width={screenWidth * 0.9}
            height={150}
            chartConfig={chartConfig}
            style={styles.chartStyle}
          />
        </View>

        {/* Baby Cry Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Cry</Text>
            <Text style={styles.cardHeaderSubtitle}>Today {babyData.cry[3]}min</Text>
          </View>

          <BarChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: babyData.cry },
              ],
            }}
            width={screenWidth * 0.9}
            height={150}
            chartConfig={chartConfig}
            style={styles.chartStyle}
          />
        </View>

        <Text style={styles.headerTitle}>MOM Summary</Text>

        {/* Mom HRV Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Heart Rate (HR)</Text>
            <Text style={styles.cardHeaderSubtitle}>Today {momData.hr[3]} bpm</Text>
          </View>
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: momData.hr },
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
            <Text style={styles.cardHeaderSubtitle}>Today {momData.sleep[3]}hr</Text>
          </View>
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: momData.sleep },
              ],
            }}
            width={screenWidth * 0.9}
            height={150}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            bezier
          />
        </View>

        {/* Mom HRV Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>HRV</Text>
            <Text style={styles.cardHeaderSubtitle}>Today {momData.hrv[3]}</Text>
          </View>
          <LineChart
            data={{
              labels: weekLabels,
              datasets: [
                { data: momData.hrv },
              ],
            }}
            width={screenWidth * 0.9}
            height={150}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            bezier
          />
        </View>

        {/* 底部两个圆环：Steps / Temperature Diff */}
        <View style={styles.footerCircleContainer}>
          <View style={styles.footerCircle}>
            <Text style={styles.footerCircleValue}>{momData.steps}</Text>
            <Text style={styles.footerCircleLabel}>Steps</Text>
          </View>
          <View style={styles.footerCircle}>
            <Text style={styles.footerCircleValue}>
              {momData.temperatureDiff > 0 ? `+${momData.temperatureDiff}°C` : `${momData.temperatureDiff}°C`}
            </Text>
            <Text style={styles.footerCircleLabel}>Temperature</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ========== 图表配置(react-native-chart-kit) ==========
const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(120, 70, 250, ${opacity})`, 
  labelColor: (opacity = 1) => `rgba(60, 60, 60, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
};

// ========== 样式 ==========
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 4,
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
    marginLeft: -10, // chart默认会有点空白，可根据需要调整
  },
  footerCircleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 30,
  },
  footerCircle: {
    width: 120,
    height: 120,
    borderWidth: 8,
    borderColor: '#c5b5f5',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerCircleValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  footerCircleLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
});
