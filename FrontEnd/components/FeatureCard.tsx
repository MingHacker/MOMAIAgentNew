// FeatureCard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
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
  const [cardColor, setCardColor] = useState('#F9F7FF'); // Default color

  let displayText: React.ReactNode = '';
  let timeDiffText = '';

  if (typeof featureId === 'string') {
    displayText = featureId;
  } else if (typeof featureId === 'object' && featureId !== null) {
    displayText = featureId.title || featureId.id;
  }

  if (reminderType === 'feeding') {
    displayText = <Image source={require('../assets/cardemoji/feed.png')} style={{ width: 24, height: 24, transform: [{ scale: 0.9 }], margin: 2 }} />;
  } else if (reminderType === 'diaper') {
    displayText = <Image source={require('../assets/cardemoji/diaper.png')} style={{ width: 24, height: 24 }} />;
  } else if (reminderType === 'sleep') {
    displayText = <Image source={require('../assets/cardemoji/sleep.png')} style={{ width: 24, height: 24 }} />;
  } else if (reminderType === 'outside') {
    displayText = <Image source={require('../assets/cardemoji/outside.png')} style={{ width: 24, height: 24 }} />;
  }

  useEffect(() => {
    if (reminderTime && reminderType !== 'outside') {
      const reminderDateTime = dayjs(reminderTime);
      const now = dayjs();
      const diffInHours = reminderDateTime.diff(now, 'hour');

      if (reminderDateTime.isBefore(now)) {
        setCardColor('#FFCDD2'); // Mild Red (Past)
      } else if (diffInHours > 2) {
        setCardColor('#F9F7FF'); // 浅灰色
        styles.text.color = '#A0A0A0';
      } else if (diffInHours < 0.5) {
        setCardColor('#FFF9C4'); // Mild Yellow
        styles.text.color = '#4B5563';
      } else {
        setCardColor('#F9F7FF');
      }
      timeDiffText = reminderDateTime.fromNow();
    }
  }, [reminderTime, reminderType]);


  // if (reminderTime && reminderType !== 'outside') {
  //   const reminderDateTime = dayjs(reminderTime);
  //   const diffInHours = reminderDateTime.diff(dayjs(), 'hour');
  //   timeDiffText = `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'}`;
  // }
  
  if (reminderTime && reminderType !== 'outside') {
    const reminderDateTime = dayjs(reminderTime);
    timeDiffText = reminderDateTime.fromNow();
  }

  return (
    <View style={[styles.card, { backgroundColor: cardColor }]}>
      <Text style={[styles.text, { alignSelf: 'flex-start', marginTop: -15 }]}>{displayText}</Text>
      {timeDiffText ? <Text style={[styles.time, { fontSize: 18, fontWeight: 'bold' }]}>{timeDiffText}</Text> : null}
      {dailySummary && reminderType && (
        <View style={styles.summaryContainer}>
          {reminderType === 'sleep' && (
            <Text style={styles.summaryText}>
              Slept: {Math.floor(JSON.parse(dailySummary).totalmins / 60)}hr {JSON.parse(dailySummary).totalmins % 60}min
            </Text>
          )}
          {reminderType === 'outside' && (
            <Text style={styles.summaryText}>
              Outside: {JSON.parse(dailySummary).totalmins} mins
            </Text>
          )}
          {reminderType === 'diaper' && (
            <Text style={styles.summaryText}>
              Solid: {JSON.parse(dailySummary).solid}   Wet: {JSON.parse(dailySummary).wet}
            </Text>
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
    fontSize: 16,
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
