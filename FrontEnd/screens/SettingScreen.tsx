import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { logoutAndRestart } from '../utils/navigationHelpers';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const storedId = await AsyncStorage.getItem('userId');
      const storedName = await AsyncStorage.getItem('nickname');
      if (storedId) setUserId(storedId);
      if (storedName) setNickname(storedName);
    };
    fetchData();
  }, []);

  const handleSaveNickname = async () => {
    await AsyncStorage.setItem('nickname', nickname);
    alert('昵称已保存');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>⚙️ 设置中心</Text>

      <View style={styles.section}>
        <Text style={styles.label}>👶 当前用户 ID：</Text>
        <Text style={styles.value}>{userId || '未登录'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>📝 昵称修改：</Text>
        <TextInput
          style={styles.input}
          placeholder="输入昵称"
          value={nickname}
          onChangeText={setNickname}
        />
        <Button title="保存昵称" onPress={handleSaveNickname} />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => logoutAndRestart(navigation)}>
        <Text style={styles.logoutText}>🚪 退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  section: { marginBottom: 25 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  value: { fontSize: 16, color: '#444' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 12,
    backgroundColor: '#FECACA',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '600',
  },
});
