
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs'; 

import BabyInfoCard from '../components/BabyInfoCard';
import FeatureCard from '../components/FeatureCard';
import RecordModal from '../components/RecordModal';
import FeatureCardList from '../components/FeatureCardList';


import { getUserFeatures } from '../services/feature';
import { api } from '../services/api';

import { useApiRequest } from '../services/hooks/useAPIRequest';
import { usePostRequest } from '../services/hooks/usePostRequest';
import { validateFormData } from '../utils/validateForms';
import { formDataToPayload } from '../utils/formPayload';

const DashboardScreen = () => {
  const route = useRoute<any>();
  const userId = route?.params?.userId || '123';

  const [userFeatureIds, setUserFeatureIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<'feed' | 'sleep' | 'diaper' | 'outside' | null>(null);
  const [formData, setFormData] = useState<any>({});
  const payload = formDataToPayload(selectedType, formData, userId);
  console.log('🔥 Dashboard 接收到功能卡片:', userFeatureIds);
  // 加载功能卡片
  const { run: loadFeatures, loading: loadingFeatures } = useApiRequest(
    () => getUserFeatures(userId),
    {
      onSuccess: (res: any) => {
        console.log('🔥 Dashboard 接收到功能卡片:', res?.selectedFeatureIds);
        setUserFeatureIds(res?.selectedFeatureIds || []);
      },
      onError: () => {
        Toast.show({ type: 'error', text1: '❌ 加载功能卡片失败' });
      }
    }
  );
  useFocusEffect(
    useCallback(() => {
      loadFeatures();
    }, [userId, loadFeatures])
  );

  // 提交记录
  const { run: submitDataRecord, loading: submitting } = usePostRequest(
    async () => {
      if (!selectedType) throw new Error('记录类型为空');

      let logType: 'feeding' | 'diaper' | 'sleep' | 'cry' | 'bowel';
      switch (selectedType) {
        case 'feed': logType = 'feeding'; break;
        case 'sleep': logType = 'sleep'; break;
        case 'diaper': logType = 'diaper'; break;
        case 'outside': logType = 'cry'; break; // Assuming 'outside' maps to 'cry'
        default: throw new Error('未知记录类型');
      }

      const log = {
        baby_id: userId,
        log_type: logType,
        log_data: formData,
      };
      const response = await api.createBabyLog(log);
      return { data: response };
    },
    {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: '✅ 记录成功' });
        setModalVisible(false);
        setFormData({});
      },
      onError: (err) => {
        console.error('提交出错：', err);
        Toast.show({ type: 'error', text1: '❌ 提交失败', text2: err?.message || '请重试' });
      },
      debounceTime: 1500,
    }
  );

  const submitRecord = () => {
    if (!validateFormData(selectedType, formData)) {
      Toast.show({ type: 'error', text1: '请填写完整信息 ✅' });
      return;
    }
    submitDataRecord(formData);
  };

  if (loadingFeatures) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <BabyInfoCard userId={undefined} />
        <FeatureCardList userFeatureIds={['feed', 'sleep', 'diaper', 'outside']} />
        {userFeatureIds.length > 0 ? (
          userFeatureIds.reduce((rows, _, idx) => {
            if (idx % 2 === 0) {
              const first = <FeatureCard featureId={userFeatureIds[idx]} key={`${idx}-1`} />;
              const second = userFeatureIds[idx + 1]
                ? <FeatureCard featureId={userFeatureIds[idx + 1]} key={`${idx}-2`} />
                : <View style={{ width: '48%' }} />;
              rows.push(
                <View style={styles.cardRow} key={idx}>
                  {first}
                  {second}
                </View>
              );
            }
            return rows;
          }, [])
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>暂无功能卡片</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fabCenterButton} onPress={() => setModalVisible(true)}>
        <Text style={{ color: '#fff', fontSize: 24 }}>+</Text>
      </TouchableOpacity>

      <RecordModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedType(null);
        }}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        formData={formData}
        setFormData={setFormData}
        onSubmit={submitRecord}
        submitting={submitting}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  fabCenterButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#bfb2d4',
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  },
});

export default DashboardScreen;
