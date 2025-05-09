import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { api } from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface BabyProfile {
  name: string;
  birthDate: Date;
  gender: 'male' | 'female' | '';
  weight: string;
  height: string;
  avatar: string | null;
}

export default function BabyProfileScreen() {
  const [baby, setBaby] = useState<BabyProfile>({
    name: '',
    birthDate: new Date(),
    gender: '',
    weight: '',
    height: '',
    avatar: null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBaby({ ...baby, birthDate: selectedDate });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setBaby({ ...baby, avatar: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const babyId = await AsyncStorage.getItem('baby_id');
      if (!babyId) {
        Alert.alert('Error', 'No baby ID found');
        return;
      }
      
      // 转换数据格式
      const profileData = {
        name: baby.name,
        birth_date: baby.birthDate.toISOString().split('T')[0],
        gender: baby.gender,
        birth_weight: Number(baby.weight),
        birth_height: Number(baby.height)
      };
      
      console.log('Saving baby profile with data:', {
        babyId,
        profileData
      });
      
      const response = await api.updateBabyProfile(babyId, profileData);
      if (response && response.id) {
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving baby profile:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        console.error('Error response data:', errorData);
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessage = errorData.detail.map((err: any) => err.msg || err.message).join('\n');
          Alert.alert('Error', errorMessage || 'Failed to update profile');
        } else {
          Alert.alert('Error', 'Failed to update profile');
        }
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {baby.avatar ? (
              <Image source={{ uri: baby.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="baby-face-outline" size={40} color="#8B5CF6" />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter baby's name"
              value={baby.name}
              onChangeText={(text) => setBaby({ ...baby, name: text })}
              placeholderTextColor="#A1A1AA"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {format(baby.birthDate, 'MMMM d, yyyy')}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={baby.birthDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  baby.gender === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => setBaby({ ...baby, gender: 'male' })}
              >
                <MaterialCommunityIcons
                  name="gender-male"
                  size={24}
                  color={baby.gender === 'male' ? '#FFF' : '#8B5CF6'}
                />
                <Text style={[
                  styles.genderText,
                  baby.gender === 'male' && styles.genderTextActive
                ]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  baby.gender === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => setBaby({ ...baby, gender: 'female' })}
              >
                <MaterialCommunityIcons
                  name="gender-female"
                  size={24}
                  color={baby.gender === 'female' ? '#FFF' : '#8B5CF6'}
                />
                <Text style={[
                  styles.genderText,
                  baby.gender === 'female' && styles.genderTextActive
                ]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.measurementsContainer}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={baby.weight}
                onChangeText={(text) => setBaby({ ...baby, weight: text })}
                keyboardType="decimal-pad"
                placeholderTextColor="#A1A1AA"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                value={baby.height}
                onChangeText={(text) => setBaby({ ...baby, height: text })}
                keyboardType="decimal-pad"
                placeholderTextColor="#A1A1AA"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#8B5CF6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  genderButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  genderText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  measurementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    marginHorizontal: 24,
    marginVertical: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
});