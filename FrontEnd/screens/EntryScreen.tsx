import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function EntryScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          navigation.navigate('MainApp', {
            screen: 'AppMain',
            params: {
              screen: 'Dashboard',
              params: { userId }, // ✅ 正确传参写法
            },
          });
        } else {
          navigation.navigate('InitialInfo');
        }
      } catch (error) {
        navigation.navigate('InitialInfo');
      }
    };

    checkUser(); // ✅ 别忘了调用函数
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#A78BFA" />
    </View>
  );
}
