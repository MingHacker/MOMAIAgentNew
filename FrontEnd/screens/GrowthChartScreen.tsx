import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { 
  whoGrowthStandards, 
  calculateAgeInMonths, 
  getStandardsForAge, 
  evaluateGrowthStatus 
} from '../data/whoGrowthStandards';
import { mockGrowthData } from '../data/mockGrowthData';

const screenWidth = Dimensions.get('window').width;

interface GrowthData {
  weight: number;
  height: number;
  date: string;
}

const GrowthChartScreen = () => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [growthHistory, setGrowthHistory] = useState(mockGrowthData[gender].growthRecords);

  // 当性别改变时更新历史数据
  useEffect(() => {
    setGrowthHistory(mockGrowthData[gender].growthRecords);
  }, [gender]);

  const weightChartData = {
    labels: growthHistory.map(record => `${record.month}m`),
    datasets: [
      {
        data: whoGrowthStandards.weightForAge[gender].p97,
        color: (opacity = 1) => `rgba(54, 162, 235, ${opacity * 0.5})`,
        strokeWidth: 1,
        dotted: true
      },
      {
        data: whoGrowthStandards.weightForAge[gender].p50,
        color: (opacity = 1) => `rgba(128, 128, 128, ${opacity * 0.5})`,
        strokeWidth: 1,
        dotted: true
      },
      {
        data: whoGrowthStandards.weightForAge[gender].p3,
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity * 0.5})`,
        strokeWidth: 1,
        dotted: true
      },
      {
        data: growthHistory.map(record => record.weight),
        color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['P97', 'P50', 'P3', 'Current']
  };

  const heightChartData = {
    labels: growthHistory.map(record => `${record.month}m`),
    datasets: [
      {
        data: whoGrowthStandards.heightForAge[gender].p97,
        color: (opacity = 1) => `rgba(54, 162, 235, ${opacity * 0.5})`,
        strokeWidth: 1,
        dotted: true
      },
      {
        data: whoGrowthStandards.heightForAge[gender].p50,
        color: (opacity = 1) => `rgba(128, 128, 128, ${opacity * 0.5})`,
        strokeWidth: 1,
        dotted: true
      },
      {
        data: whoGrowthStandards.heightForAge[gender].p3,
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity * 0.5})`,
        strokeWidth: 1,
        dotted: true
      },
      {
        data: growthHistory.map(record => record.height),
        color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['P97', 'P50', 'P3', 'Current']
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
    },
    propsForLabels: {
      fontSize: 10,
    },
    yAxisInterval: 5,
    marginLeft: 50,
    marginRight: 30,
  };

  // 添加新记录
  const addGrowthRecord = () => {
    if (weight && height) {
      const lastRecord = growthHistory[growthHistory.length - 1];
      const newRecord = {
        month: lastRecord.month + 1,
        weight: parseFloat(weight),
        height: parseFloat(height),
        date: new Date().toISOString().split('T')[0]
      };

      setGrowthHistory(prev => [...prev, newRecord]);
      setWeight('');
      setHeight('');
    }
  };

  // 添加最新记录的状态显示
  const getLatestStatus = () => {
    if (growthHistory.length === 0) return null;
    const latest = growthHistory[growthHistory.length - 1];
    return {
      age: `${latest.month} months`,
      weight: `${latest.weight} kg`,
      height: `${latest.height} cm`,
      date: new Date(latest.date).toLocaleDateString()
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 性别选择器 */}
        <View style={styles.genderSelector}>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextSelected]}>
              Boy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextSelected]}>
              Girl
            </Text>
          </TouchableOpacity>
        </View>

        {/* 最新记录显示 */}
        {getLatestStatus() && (
          <View style={styles.latestStatus}>
            <Text style={styles.latestStatusTitle}>Latest Record</Text>
            <Text style={styles.latestStatusText}>Age: {getLatestStatus()?.age}</Text>
            <Text style={styles.latestStatusText}>Weight: {getLatestStatus()?.weight}</Text>
            <Text style={styles.latestStatusText}>Height: {getLatestStatus()?.height}</Text>
            <Text style={styles.latestStatusText}>Date: {getLatestStatus()?.date}</Text>
          </View>
        )}

        {/* 输入区域 */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="Enter weight"
              placeholderTextColor="#999"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              placeholder="Enter height"
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addGrowthRecord}>
            <Text style={styles.buttonText}>Add Record</Text>
          </TouchableOpacity>
        </View>

        {/* 图表区域 */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weight Growth Chart</Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <LineChart
              data={weightChartData}
              width={screenWidth * 1.2}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              yAxisLabel=""
              yAxisSuffix=""
              margin={{
                top: 20,
                right: 30,
                bottom: 20,
                left: 50
              }}
            />
          </ScrollView>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Height Growth Chart</Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <LineChart
              data={heightChartData}
              width={screenWidth * 1.2}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              yAxisLabel=""
              yAxisSuffix=""
              margin={{
                top: 20,
                right: 30,
                bottom: 20,
                left: 50
              }}
            />
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
    paddingRight: 20,
    paddingLeft: 10,
  },
  genderSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  genderButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  genderButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  genderButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
  },
  latestStatus: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  latestStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  latestStatusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default GrowthChartScreen; 