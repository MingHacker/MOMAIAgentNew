import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BabySummary = {
  feeding: string;
  sleep: string;
  diaper: string;
  outside: string;
  status: string;
  tip: string;
};

export default function BabyStatusCard({ summary }: { summary: BabySummary | null }) {
  console.log("BabyStatusCard received summary:", summary); // 输出summary数据
  
  if (!summary) {
    console.log("Error: summary is null or undefined");
    return (
      <View style={styles.card}>
        <Text style={styles.title}>👶 Baby Status: Loading...</Text>
        <Text style={styles.tip}>💡 请稍候，数据正在加载。</Text>
      </View>
    );
  }

  try {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>👶 Baby Status: {summary.status}</Text>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.detail}>🍼 Feeding: {summary.feeding}</Text>
            <Text style={styles.detail}>💤 Sleep: {summary.sleep}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.detail}>🧷 Diaper: {summary.diaper}</Text>
            <Text style={styles.detail}>🌳 Outside: {summary.outside}</Text>
          </View>
        </View>
        <Text style={styles.tip}>💡 {summary.tip}</Text>
      </View>
    );
  } catch (error) {
    console.error("Error rendering BabyStatusCard:", error);
    return (
      <View style={styles.card}>
        <Text style={styles.title}>👶 Error in rendering data</Text>
        <Text style={styles.tip}>💡 There was an issue displaying the data.</Text>
      </View>
    );
  }
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
    marginRight: 10,
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
