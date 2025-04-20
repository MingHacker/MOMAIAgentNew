import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getRecommendedFeatures, getUserFeatures, saveUserFeatures } from '../services/feature';
import { getAgeInMonths } from '../utils/ageUtils';

type RootStackParamList = {
  Main: undefined;
  Welcome: undefined;
  Login: undefined;
  InitialInfo: undefined;
  RecommendedFeatures: {
    userId: string;
    timestamp: number;
  };
  Dashboard: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth / numColumns - 30;

interface Feature {
  id: string;
  title: string;
}

const RecommendedFeaturesScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  // ✅ 默认的 userId 和 baby 生日
  const userId = '123';
  const babyInfo = { birthday: '2023-05-01' };

  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const ageInMonths = getAgeInMonths(babyInfo.birthday);

      try {
        const res = await getRecommendedFeatures(userId, ageInMonths);
        const featureList = res.features || [];
        setFeatures(featureList);

        // 默认选择喂奶/睡觉/尿布/外出
        const defaultSelected = featureList
          .filter((item: Feature) => ['feeding', 'sleep', 'diaper', 'outside'].includes(item.id))
          .map((item: Feature) => item.id);
        setSelectedFeatures(defaultSelected);
      } catch (err: any) {
        console.error('❌ 推荐功能加载失败:', err.message);
      }
    };

    load();
  }, []);

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    try {
      const res = await saveUserFeatures({ userId, featureIds: selectedFeatures });
      if (res.data.success) {
        navigation.navigate('Dashboard');
      } else {
        console.warn('❌ 后端返回 success: false');
      }
    } catch (err: any) {
      console.error('❌ 保存失败:', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>为宝宝选择功能卡片：</Text>
        <FlatList
          data={features}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => {
            const selected = selectedFeatures.includes(item.id);
            return (
              <View style={[styles.card, selected && styles.cardSelected]}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Switch
                  value={selected}
                  onValueChange={() => toggleFeature(item.id)}
                  thumbColor={selected ? '#fff' : '#ccc'}
                  trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
                />
              </View>
            );
          }}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="确定选择" onPress={handleConfirm} color="#8B5CF6" />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#4B5563',
  },
  card: {
    width: cardWidth,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  cardSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
});

export default RecommendedFeaturesScreen;
