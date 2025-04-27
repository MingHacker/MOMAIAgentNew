import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

const FormFields = ({ selectedType, formData, setFormData }) => {
  const [iosPickerField, setIosPickerField] = useState<string | null>(null);
  const [androidPickerField, setAndroidPickerField] = useState<string | null>(null);
  
  // 添加日期时间状态
  const [sleepStartDateTime, setSleepStartDateTime] = useState(new Date());
  const [sleepEndDateTime, setSleepEndDateTime] = useState(new Date());

  const handleShowIOSPicker = (fieldKey: string) => {
    setIosPickerField(fieldKey);
    setAndroidPickerField(fieldKey);
  };

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (!date || event.type === 'dismissed') {
      setIosPickerField(null);
      setAndroidPickerField(null);
      return;
    }

    const key = iosPickerField || androidPickerField;
    if (!key) return;

    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const timeValue = `${hh}:${mm}`;

    if (key === 'sleepStart') {
      // 设置开始时间
      setSleepStartDateTime(date);
      setFormData(prev => ({ ...prev, sleepStart: timeValue }));
      
      // 如果结束时间早于开始时间，自动调整结束时间
      if (sleepEndDateTime < date) {
        const newEndDate = new Date(date);
        newEndDate.setHours(date.getHours() + 1); // 默认设置为开始时间后1小时
        setSleepEndDateTime(newEndDate);
        setFormData(prev => ({
          ...prev,
          sleepEnd: `${newEndDate.getHours().toString().padStart(2, '0')}:${newEndDate.getMinutes().toString().padStart(2, '0')}`
        }));
      }
    } else if (key === 'sleepEnd') {
      // 检查结束时间是否早于开始时间
      if (date < sleepStartDateTime) {
        // 如果选择的结束时间早于开始时间，将其设置为第二天的同一时间
        date.setDate(date.getDate() + 1);
        Alert.alert('提示', '已自动调整为第二天的时间');
      }
      setSleepEndDateTime(date);
      setFormData(prev => ({ ...prev, sleepEnd: timeValue }));
    } else {
      setFormData(prev => ({ ...prev, [key]: timeValue }));
    }

    setIosPickerField(null);
    setAndroidPickerField(null);
  };

  const renderTimePicker = (fieldKey: string) => {
    const isVisible = iosPickerField === fieldKey || androidPickerField === fieldKey;
    if (!isVisible) return null;

    const minimumDate = fieldKey === 'sleepEnd' ? sleepStartDateTime : undefined;
    const initialDate = fieldKey === 'sleepStart' ? sleepStartDateTime : 
                       fieldKey === 'sleepEnd' ? sleepEndDateTime : 
                       new Date();

    return (
      <DateTimePicker
        value={initialDate}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
        onChange={onPickerChange}
        style={{ marginTop: 10 }}
        minimumDate={minimumDate}
      />
    );
  };

  const renderFormFields = () => {
    switch (selectedType) {
      case 'feeding':
        return (
          <>
            <Text style={styles.formLabel}>Feed Time</Text>
            <TouchableOpacity onPress={() => handleShowIOSPicker('feedTime')} style={styles.timeButton}>
              <Text>{formData.feedTime || 'Select Time'}</Text>
            </TouchableOpacity>
            {renderTimePicker('feedTime')}

            <Text style={styles.formLabel}>Amount (ml)</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Enter amount"
              value={formData.feedAmount}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, feedAmount: text }))}
              style={styles.input}
            />
          </>
        );

      case 'sleep':
        return (
          <>
            <Text style={styles.formLabel}>Start Time</Text>
            <TouchableOpacity 
              onPress={() => handleShowIOSPicker('sleepStart')} 
              style={styles.timeButton}
            >
              <Text style={styles.timeButtonText}>
                {formData.sleepStart || 'Select Start Time'}
              </Text>
            </TouchableOpacity>
            {renderTimePicker('sleepStart')}

            <Text style={styles.formLabel}>End Time</Text>
            <TouchableOpacity 
              onPress={() => handleShowIOSPicker('sleepEnd')} 
              style={styles.timeButton}
            >
              <Text style={styles.timeButtonText}>
                {formData.sleepEnd || 'Select End Time'}
              </Text>
            </TouchableOpacity>
            {renderTimePicker('sleepEnd')}
          </>
        );

      case 'diaper':
        return (
          <>
            <Text style={styles.formLabel}>Change Time</Text>
            <TouchableOpacity onPress={() => handleShowIOSPicker('diaperTime')} style={styles.timeButton}>
              <Text>{formData.diaperTime || 'Select Time'}</Text>
            </TouchableOpacity>
            {renderTimePicker('diaperTime')}

            <Text style={styles.formLabel}>Solid?</Text>
            <TouchableOpacity
              style={[styles.timeButton, { alignItems: 'center' }]}
              onPress={() =>
                setFormData((prev) => ({
                  ...prev,
                  diaperSolid: !prev.diaperSolid
                }))
              }
            >
              <Text>{formData.diaperSolid ? 'Yes ✅' : 'No ⬜'}</Text>
            </TouchableOpacity>
          </>
        );

      case 'outside':
        return (
          <>
            <Text style={styles.formLabel}>Duration (minutes)</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Enter minutes"
              value={formData.outsideDuration}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  outsideDuration: text
                }))
              }
              style={styles.input}
            />
          </>
        );

      default:
        return null;
    }
  };

  return <ScrollView>{renderFormFields()}</ScrollView>;
};

const styles = StyleSheet.create({
  formLabel: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000', // 文字颜色改为黑色
  },
  timeButton: {
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeButtonText: {
    color: '#000000', // 按钮文字颜色改为黑色
    fontSize: 14,
    fontWeight: '400',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    fontSize: 14,
    color: '#000000', // 输入框文字颜色改为黑色
  },
});

export default FormFields;
