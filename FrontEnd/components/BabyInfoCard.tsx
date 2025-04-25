import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';

interface BabyInfo {
  name: string;
  avatar: string;
  weight: string;
  height: string;
  age: string;
}

interface BabyInfoCardProps {
  babyInfo: BabyInfo;
}

const BabyInfoCard: React.FC<BabyInfoCardProps> = ({ babyInfo }) => {
  babyInfo.avatar = 'https://www.petlandtexas.com/wp-content/uploads/2016/08/Red_Bunny_Petland_Puppy.jpg'; // Fallback to a default avatar if none is provided
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Image source={{ uri: babyInfo.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{babyInfo.name}</Text>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Age: {babyInfo.age} </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Weight: {babyInfo.weight} </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Height: {babyInfo.height} </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFF',
    borderRadius: 16,
    paddingVertical: 12,     // ↓ from 16 → 12
    paddingHorizontal: 14,   // ↓ slightly
    marginHorizontal: 16,
    marginTop: 8,           // ↓ from 16
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
    letterSpacing: 0.2,
  },
  statItem: {
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default BabyInfoCard;
