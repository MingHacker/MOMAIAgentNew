import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs'; 
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';

import BabyInfoCard from '../components/BabyInfoCard';
import FeatureCard from '../components/FeatureCard';
import RecordModal from '../components/RecordModal';
import FeatureCardList from '../components/FeatureCardList';


import { getUserFeatures } from '../services/feature';
import { api, Reminder } from '../src/api';

import { useApiRequest } from '../services/hooks/useAPIRequest';
import { usePostRequest } from '../services/hooks/usePostRequest';
import { validateFormData } from '../utils/validateForms';
import { formDataToPayload } from '../utils/formPayload';
import { BabyInfo, mapBabyProfileToBabyInfo } from '../src/mappers'; // Import mapper and BabyInfo type

type RootParamList = {
  MainTabs: undefined;
  Initial: undefined;
};

const DashboardScreen = () => {

  const [babyInfo, setBabyInfo] = useState<BabyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const route = useRoute<any>();
  const [userFeatureIds, setUserFeatureIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<'feeding' | 'sleep' | 'diaper' | 'outside' | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);

  const navigation = useNavigation<DrawerNavigationProp<RootParamList>>();

  const fetchReminders = useCallback(async (babyId: string | null) => {
    try {
      if (babyId) {
        const reminders = await api.getReminders(babyId, true);
        console.log(reminders)
        setUpcomingReminders(reminders);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      Toast.show({ type: 'error', text1: '❌ 加载提醒失败' });
    }
  }, []);

  useEffect(() => {
    const fetchBabyData = async () => {
      setIsLoading(true);
      try {
        const babies = await api.getAllBabies();
        if (babies && babies.length > 0) {
          // Assuming we display the first baby for now
          const mappedInfo = mapBabyProfileToBabyInfo(babies[0]);
          setBabyInfo(mappedInfo);
          fetchReminders(mappedInfo.id);
        } else {
          // Handle case with no babies - maybe set a default state or show a message
          setBabyInfo(mapBabyProfileToBabyInfo(null)); // Use mapper's null handling
          console.log('No baby profiles found for this user.');
        }
      } catch (error) {
        console.error('Failed to fetch baby data:', error);
        // Optionally set an error state to display to the user
        setBabyInfo(mapBabyProfileToBabyInfo(null)); // Show default on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBabyData();
  }, [fetchReminders]);

  console.log('🔥 Dashboard 接收到功能卡片:', userFeatureIds);
  // 加载功能卡片
  const { run: loadFeatures, loading: loadingFeatures } = useApiRequest(
    () => getUserFeatures("123"),
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
    }, ["123", loadFeatures])
  );

  // 提交记录
  const { run: submitDataRecord, loading: submitting } = usePostRequest(
    async () => {
      if (!selectedType) throw new Error('记录类型为空');

      let logType: 'feeding' | 'diaper' | 'sleep' | 'cry' | 'bowel';
      switch (selectedType) {
        case 'feeding': logType = 'feeding'; break;
        case 'sleep': logType = 'sleep'; break;
        case 'diaper': logType = 'diaper'; break;
        case 'outside': logType = 'cry'; break;
        default: throw new Error('未知记录类型');
      }

      const log = {
        baby_id: babyInfo.id,
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
        completeRelatedReminder(babyInfo.id, selectedType);
      },
      onError: (err) => {
        console.error('提交出错：', err);
        Toast.show({ type: 'error', text1: '❌ 提交失败', text2: err?.message || '请重试' });
      },
      debounceTime: 1500,
    }
  );

  const completeRelatedReminder = async (babyId: string, logType: string) => {
    try {
      const response = await api.completeReminderByLog(babyId, logType);
      if (response.message) {
        console.log(response.message);
      }
    } catch (error) {
      console.error('Failed to complete reminder:', error);
      Toast.show({ type: 'error', text1: '❌ 完成提醒失败' });
    }
  };

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
        {babyInfo && <BabyInfoCard babyInfo={babyInfo} />}
        {upcomingReminders.length > 0 ? (
          upcomingReminders.reduce((rows, reminder, index) => {
            if (index % 2 === 0) {
              rows.push(
                <View style={styles.cardRow} key={index}>
                  <FeatureCard
                    key={reminder.id}
                    featureId={reminder.reminder_type}
                    reminderTime={reminder.reminder_time}
                  />
                  {upcomingReminders[index + 1] ? (
                    <FeatureCard
                      key={upcomingReminders[index + 1].id}
                      featureId={upcomingReminders[index + 1].reminder_type}
                      reminderTime={upcomingReminders[index + 1].reminder_time}
                    />
                  ) : null}
                </View>
              );
            }
            return rows;
          }, [])
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>暂无提醒</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    paddingBottom: 90,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  fabCenterButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#bfb2d4',
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  drawerButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 999,
    width: 40,
    height: 40,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default DashboardScreen;
