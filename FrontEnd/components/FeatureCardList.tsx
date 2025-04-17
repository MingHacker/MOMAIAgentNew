// FeatureCardList.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import FeatureCard from './FeatureCard'; // Ensure the import is correct


const FeatureCardList = ({ userFeatureIds}: { userFeatureIds: string[] }) => {
  return (
    <View style={styles.cardList}>
      {userFeatureIds.map((featureId) => (
        <FeatureCard key={featureId} featureId={featureId} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  cardList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default FeatureCardList;
