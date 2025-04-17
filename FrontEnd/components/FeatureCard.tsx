// FeatureCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

type FeatureCardProps = {
  featureId: string | { id: string; title?: string };
  reminderTime?: string;
};

const FeatureCard = ({ featureId, reminderTime }: FeatureCardProps) => {
  let displayText = '';
  let timeDiffText = '';

  if (typeof featureId === 'string') {
    displayText = featureId;
  } else if (typeof featureId === 'object' && featureId !== null) {
    displayText = featureId.title || featureId.id;
  }

  if (reminderTime) {
    const reminderDateTime = dayjs(reminderTime);
    timeDiffText = reminderDateTime.fromNow();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.text}>{displayText}</Text>
      {timeDiffText ? <Text style={styles.time}>{timeDiffText}</Text> : null}
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
  time: {
    fontSize: 12,
    color: '#717171',
    marginTop: 4,
  },
});

export default FeatureCard;
