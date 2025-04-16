// RecommendedFeaturesScreen.tsx
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { navigateToTab } from '../utils/navigationHelpers';
import {
  getRecommendedFeatures,
  getUserFeatures,
  saveUserFeatures,
} from '../services/feature';
import { getAgeInMonths } from '../utils/ageUtils';

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth / numColumns - 30;

const RecommendedFeaturesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();

  const [userId, setUserId] = useState<string>('123');
  const [babyInfo, setBabyInfo] = useState<{ birthday: string }>({ birthday: '2023-05-01' }); // 🔁 实际项目中替换为真实数据
  const [features, setFeatures] = useState<any[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const fetchFeatures = async (uid: string, ageInMonths: number) => {
    try {
      const res = await getRecommendedFeatures(uid, ageInMonths);
      const featureList = res.features || [];
      setFeatures(featureList);

      const savedRes = await getUserFeatures(uid);
      const saved = savedRes.selectedFeatureIds || [];

      if (saved.length > 0) {
        setSelectedFeatures(saved);
      } else {
        const defaultSelected = featureList
          .filter((item) => ['feed', 'sleep', 'diaper', 'outside'].includes(item.id))
          .map((item) => item.id);
        setSelectedFeatures(defaultSelected);
      }
    } catch (err: any) {
      console.error('❌ 推荐功能加载失败:', err.message);
    }
  };

  useEffect(() => {
    if (userId && babyInfo?.birthday) {
      const ageInMonths = getAgeInMonths(babyInfo.birthday);
      console.log('👶 月龄：', ageInMonths);
  
      getRecommendedFeatures(userId, ageInMonths)
        .then((res) => {
          console.log('✅ 推荐功能卡:', res.features);
          setFeatures(res.features || []);
        })
        .catch((err) => {
          console.error('❌ 获取推荐功能失败:', err.message);
        });
    }
  }, [userId, babyInfo]);
  

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id)
        ? prev.filter((fid) => fid !== id)
        : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    try {
      const res = await saveUserFeatures({ userId, featureIds: selectedFeatures });
      console.log('🧪 后端返回完整 response:', res);
  
      if (res.data.success) {
        console.log('✅ 功能保存成功，准备跳转 Dashboard');
        navigateToTab(navigation, 'Dashboard', {
          userId,
          timestamp: Date.now(),
        });
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
