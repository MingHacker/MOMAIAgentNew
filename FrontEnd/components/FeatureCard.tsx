// FeatureCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

type FeatureCardProps = {
  featureId: string | { id: string; title?: string };
  reminderTime?: string;
  reminderType?: 'feeding' | 'diaper' | 'sleep' | 'outside';
  dailySummary?: string;
};

const FeatureCard = ({ featureId, reminderTime, reminderType, dailySummary }: FeatureCardProps) => {
  let displayText = '';
  let timeDiffText = '';

  if (typeof featureId === 'string') {
    displayText = featureId;
  } else if (typeof featureId === 'object' && featureId !== null) {
    displayText = featureId.title || featureId.id;
  }

  if (reminderTime && reminderType !== 'outside') {
    const reminderDateTime = dayjs(reminderTime);
    timeDiffText = reminderDateTime.fromNow();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.text}>{displayText}</Text>
      {timeDiffText ? <Text style={styles.time}>{timeDiffText}</Text> : null}
      {dailySummary && reminderType && (
        <View style={styles.summaryContainer}>
          {reminderType === 'sleep' && (
            <Text style={styles.summaryText}>
              Slept: {JSON.parse(dailySummary).totalmins} mins
            </Text>
          )}
          {reminderType === 'outside' && (
            <Text style={styles.summaryText}>
              Outside: {JSON.parse(dailySummary).totalmins} mins
            </Text>
          )}
          {reminderType === 'diaper' && (
            <>
              <Text style={styles.summaryText}>
                Solid: {JSON.parse(dailySummary).solid}
              </Text>
              <Text style={styles.summaryText}>
                Wet: {JSON.parse(dailySummary).wet}
              </Text>
            </>
          )}
          {reminderType === 'feeding' && (
            <Text style={styles.summaryText}>
              Fed: {JSON.parse(dailySummary).totalamountInML}ml
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F7FF',
    borderRadius: 16,
    width: '48%',
    padding: 20,
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
  summaryContainer: {
    marginTop: 8,
    width: '100%',
  },
  summaryText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
});

export default FeatureCard;
