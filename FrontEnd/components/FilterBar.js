// components/FilterBar.js
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export default function FilterBar({ filters, selectedFilter, onSelect }) {
  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 6, paddingLeft: 0 }}
      >
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterBubble,
              selectedFilter === f.key && styles.filterBubbleActive
            ]}
            onPress={() => onSelect(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === f.key && styles.filterTextActive
            ]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  filterBubble: {
    backgroundColor: '#F0F1F3',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginRight: 10,
  },
  filterBubbleActive: {
    backgroundColor: '#4F8EF7',
  },
  filterText: {
    color: '#555',
    fontWeight: '500',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
  },
});