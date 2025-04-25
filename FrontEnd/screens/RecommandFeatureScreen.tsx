import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getRecommendedFeatures, getUserFeatures, saveUserFeatures, Feature } from '../src/api/features';
import { getAgeInMonths } from '../utils/ageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_FEATURES = [
  {
    id: 'feeding',
    name: 'Feeding',
    description: 'Track feeding times and amounts to establish regular patterns',
    age_min: 0,
    age_max: 36
  },
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Monitor sleep patterns and quality for better routines',
    age_min: 0,
    age_max: 36
  },
  {
    id: 'vitaminD',
    name: 'Vitamin D',
    description: 'Record daily vitamin D supplement intake',
    age_min: 0,
    age_max: 36
  },
  {
    id: 'outside',
    name: 'Outdoor Time',
    description: 'Track outdoor activities and sunshine exposure',
    age_min: 0,
    age_max: 36
  },
  {
    id: 'diaper',
    name: 'Diaper Change',
    description: 'Monitor diaper changes and patterns',
    age_min: 0,
    age_max: 36
  }
];

type RootStackParamList = {
  Dashboard: undefined;
  RecommendedFeatures: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const RecommendedFeaturesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 添加调试代码，检查AsyncStorage中的所有数据
    const checkStorage = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        console.log('Available AsyncStorage keys:', keys);
        
        for (const key of keys) {
          const value = await AsyncStorage.getItem(key);
          console.log(`${key}:`, value);
        }
      } catch (e) {
        console.error('Error checking storage:', e);
      }
    };
    
    checkStorage();
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      
      // Get user ID and baby birthday from storage
      const [userId, babyBirthday] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('babyBirthday')
      ]);

      console.log('User ID:', userId);
      console.log('Baby birthday:', babyBirthday);
      
      if (!userId) {
        console.warn('User ID not found');
        throw new Error('User ID not found');
      }

      let ageInMonths = 0;
      if (!babyBirthday) {
        console.warn('Baby birthday not found, using default age of 0 months');
      } else {
        ageInMonths = getAgeInMonths(babyBirthday);
      }
      
      console.log('Age in months:', ageInMonths);
      
      // Get recommended features and user's current selections
      const [recommendedRes, userFeaturesRes] = await Promise.all([
        getRecommendedFeatures(ageInMonths),
        getUserFeatures(userId)
      ]);

      console.log('Recommended features response:', recommendedRes);
      console.log('User features response:', userFeaturesRes);

      const featureData = recommendedRes.debug_data || recommendedRes.recommended || [];
      console.log('Feature data to display:', featureData);

      setFeatures(featureData.length > 0 ? featureData : DEFAULT_FEATURES);
      setSelectedFeatures(userFeaturesRes?.featureIds || []);
    } catch (error) {
      console.error('Failed to load features:', error);
      setFeatures(DEFAULT_FEATURES);
      setSelectedFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found');

      const success = await saveUserFeatures(userId, selectedFeatures);
      if (success) {
        navigation.navigate('Dashboard');
      }
    } catch (error) {
      console.error('Failed to save features:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customize Features</Text>
        <Text style={styles.subtitle}>Select the features you want to track</Text>
      </View>

      <FlatList
        data={features}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const isSelected = selectedFeatures.includes(item.id);
          return (
            <View style={[
              styles.card,
              isSelected && styles.cardSelected,
              styles.cardShadow
            ]}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Switch
                value={isSelected}
                onValueChange={() => toggleFeature(item.id)}
                trackColor={{ false: '#E5E7EB', true: '#DDD6FE' }}
                thumbColor={isSelected ? '#6D28D9' : '#9CA3AF'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '400',
  },
  listContainer: {
    padding: 12,
    paddingTop: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginHorizontal: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#6D28D9',
    borderWidth: 0.5,
  },
  cardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardContent: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    fontWeight: '400',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  button: {
    backgroundColor: '#5B21B6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#5B21B6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default RecommendedFeaturesScreen;
