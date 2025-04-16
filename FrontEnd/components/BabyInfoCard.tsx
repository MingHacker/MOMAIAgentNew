import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const BabyInfoCard = ({ userId }) => {
  const babyInfo = {
    name: 'Baby Evan',
    avatar: 'https://www.petlandtexas.com/wp-content/uploads/2016/08/Red_Bunny_Petland_Puppy.jpg',
    weight: '10kg',
    height: '81cm',
    age: '2',
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: babyInfo.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{babyInfo.name}</Text>
      </View>
      <View style={styles.stats}>
        <Text>Weight: {babyInfo.weight}</Text>
        <Text>Height: {babyInfo.height}</Text>
        <Text>Age: {babyInfo.age}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  stats: {
    marginTop: 10,
  },
});

export default BabyInfoCard;
