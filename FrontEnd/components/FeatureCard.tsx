// FeatureCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type FeatureCardProps = {
  featureId: string | { id: string; title?: string };
};

const FeatureCard = ({ featureId }: FeatureCardProps) => {
  let displayText = '';

  if (typeof featureId === 'string') {
    displayText = featureId;
  } else if (typeof featureId === 'object' && featureId !== null) {
    displayText = featureId.title || featureId.id;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.text}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F7FF',
    borderRadius: 16,
    width: '48%',
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
});

export default FeatureCard;
