import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

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
            <Text style={styles.statLabel}>Age: {babyInfo.age} days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Weight: {babyInfo.weight} kg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Height: {babyInfo.height} cm</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 16,
    elevation: 1,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statItem: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default BabyInfoCard;
