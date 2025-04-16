import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type MomSummary = {
  sleep: string;          // e.g. "7.5hr"
  status: string;         // e.g. "Stable"
  hrv: string;            // e.g. "30"
  temperature: string;    // e.g. "0.2"
  steps: string;          // e.g. "2000"
  tip: string;            // e.g. "休息一下，状态良好"
};

export default function MomStatusCard({ summary }: { summary: MomSummary | null }) {
  if (!summary) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>数据加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Mom Status: {summary.status}</Text>

      {/* Two-column layout */}
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.detail}>💤 Sleep: {summary.sleep}</Text>
          <Text style={styles.detail}>🧘 HRV: {summary.hrv}</Text>
        </View>

        <View style={styles.column}>
          <Text style={styles.detail}>🌡️ Temp: {summary.temperature}</Text>
          <Text style={styles.detail}>🚶‍♀️ Steps: {summary.steps}</Text>
        </View>
      </View>

      <Text style={styles.tip}>💡{summary.tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#ccc',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  column: {
    flex: 1,
    marginRight: 10,  // Adjust for spacing
  },
  detail: {
    fontSize: 14,
    marginBottom: 4,
  },
  tip: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
  },
});
