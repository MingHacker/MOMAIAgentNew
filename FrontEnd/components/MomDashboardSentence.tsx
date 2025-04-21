import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';

export default function MomDashboardSentence() {
  return (
    <View style={styles.quickSummaryCard}>
      <Image source={require('../assets/sleepy.png')} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Mom's Daily Insight</Text>
        <Text style={styles.summaryText}>You slept only 6.0h. Be gentle with yourself today 💜</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F7FF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    margin: 16,
    alignItems: 'center',
  },
  image: {
    width: 62,
    height: 62,
    marginRight: 12,
    borderRadius: 12,
  },
  title: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 15,
    color: '#4C3575',
  },
});