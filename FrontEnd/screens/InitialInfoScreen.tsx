import React, { useState } from 'react';
import { View, Text, TextInput, Button, Switch, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RecommendedFeaturesScreen from './RecommandFeatureScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';


const InitialInfoScreen = () => {
  const navigation = useNavigation();

  const [userId, setUserId] = useState('123');
  const [isPregnant, setIsPregnant] = useState(false);
  const [pregnantMonths, setPregnantMonths] = useState('');
  const [childAge, setChildAge] = useState('');

  const handleSubmit = async () => {
    try {
      const finalPregnantMonths = isPregnant ? parseInt(pregnantMonths) || 0 : null;
      const finalChildAge = !isPregnant ? parseInt(childAge) || 0 : null;

      const response = await fetch('http://10.0.0.23:3000/api/submitUserInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isPregnant,
          pregnantMonths: finalPregnantMonths,
          childAge: finalChildAge,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        //await AsyncStorage.setItem('userId', userId);
        navigation.navigate('RecommendedFeatures', {
          userId,
          timestamp: Date.now(),
        });
      } else {
        console.log('提交失败：', result.error);
      }
    } catch (error) {
      console.log('请求错误:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>User ID:</Text>
      <TextInput style={styles.input} value={userId} onChangeText={setUserId} />

      <View style={styles.switchContainer}>
        <Text>是否怀孕:</Text>
        <Switch value={isPregnant} onValueChange={setIsPregnant} />
      </View>

      {isPregnant ? (
        <>
          <Text>怀孕几个月:</Text>
          <TextInput
            style={styles.input}
            value={pregnantMonths}
            onChangeText={setPregnantMonths}
            keyboardType="numeric"
          />
        </>
      ) : (
        <>
          <Text>孩子几岁:</Text>
          <TextInput
            style={styles.input}
            value={childAge}
            onChangeText={setChildAge}
            keyboardType="numeric"
          />
        </>
      )}

      <Button title="提交信息" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 8 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
});

export default InitialInfoScreen;
