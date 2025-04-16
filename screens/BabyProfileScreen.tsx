import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

type BabyProfile = {
  name: string;
  birthDate: string;
  gender: '男' | '女' | '';
};

export default function BabyProfileScreen() {
  const [baby, setBaby] = useState<BabyProfile>({
    name: '',
    birthDate: '',
    gender: '',
  });

  const handleSave = () => {
    if (!baby.name || !baby.birthDate || !baby.gender) {
      Alert.alert('请填写完整信息');
      return;
    }

    console.log('宝宝信息已保存：', baby);
    Alert.alert('已保存', `名字：${baby.name}\n出生：${baby.birthDate}\n性别：${baby.gender}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>宝宝名字：</Text>
      <TextInput
        style={styles.input}
        placeholder="请输入名字"
        value={baby.name}
        onChangeText={(text) => setBaby({ ...baby, name: text })}
      />

      <Text style={styles.label}>出生日期：</Text>
      <TextInput
        style={styles.input}
        placeholder="例如 2024-08-10"
        value={baby.birthDate}
        onChangeText={(text) => setBaby({ ...baby, birthDate: text })}
      />

      <Text style={styles.label}>性别：</Text>
      <TextInput
        style={styles.input}
        placeholder="男 或 女"
        value={baby.gender}
        onChangeText={(text) => setBaby({ ...baby, gender: text as '男' | '女' })}
      />

      <Button title="保存宝宝信息" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 20, backgroundColor: '#fff'
  },
  label: {
    marginTop: 20, fontSize: 16
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginTop: 5
  }
});