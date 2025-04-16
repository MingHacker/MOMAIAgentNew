// ✅ src/health/AppleHealthScreen.tsx
import React from 'react';
import { View, Text, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useAppleHealth } from './useAppHealth';

export default function AppleHealthScreen() {
  const { data, loading, error, fetchHealthData } = useAppleHealth();

  const uploadToServer = async () => {
    if (!data) return;
    try {
      const res = await fetch('http://localhost:8000/api/mom/health/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '123',  // 👈 实际项目中应替换为动态用户 ID
          hrv: data.hrv,
          sleep: data.sleep,
          steps: data.steps,
          resting_hr: 72,
          calories: 1600,
          breathing_rate: 16,
        })
      });
      const json = await res.json();
      Alert.alert('✅ 上传成功', JSON.stringify(json));
    } catch (err) {
      Alert.alert('❌ 上传失败', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍎 Apple Health 测试</Text>
      <Button title="📥 获取 Apple Health 数据" onPress={fetchHealthData} />

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {error && <Text style={styles.error}>错误：{error}</Text>}

      {data && (
        <View style={styles.card}>
          <Text>💓 HRV: {data.hrv} ms</Text>
          <Text>🚶‍♀️ 步数: {data.steps}</Text>
          <Text>🛌 睡眠: {data.sleep} 小时</Text>
          <Button title="🚀 上传到后端" onPress={uploadToServer} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 20 },
  error: { color: 'red', marginTop: 20 },
  card: { marginTop: 30, padding: 16, backgroundColor: '#f1f1f1', borderRadius: 12 },
});
