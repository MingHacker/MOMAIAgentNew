import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, StyleSheet, ScrollView } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const FormFields = ({ selectedType }) => {
  const [formData, setFormData] = useState({
    feedTime: '',
    feedAmount: '',
    sleepStart: '',
    sleepEnd: '',
    diaperTime: '',
    diaperSolid: false,
    outsideDuration: '',
  });
  const [iosPickerField, setIosPickerField] = useState<string | null>(null);
  const [androidPickerField, setAndroidPickerField] = useState<string | null>(null);

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
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const timeValue = `${hh}:${mm}`;
    if (iosPickerField || androidPickerField) {
      const key = iosPickerField || androidPickerField;
      setFormData((prev) => ({ ...prev, [key]: timeValue }));
    }
    setIosPickerField(null);
    setAndroidPickerField(null);
  };

  const renderTimePicker = (fieldKey: string) => {
    const isVisible = iosPickerField === fieldKey || androidPickerField === fieldKey;
    if (!isVisible) return null;
    return (
      <DateTimePicker
        value={new Date()}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
        onChange={onPickerChange}
        style={{ marginTop: 10 }}
      />
    );
  };

  const renderFormFields = () => {
    switch (selectedType) {
      case 'feed':
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
            <TouchableOpacity onPress={() => handleShowIOSPicker('sleepStart')} style={styles.timeButton}>
              <Text>{formData.sleepStart || 'Select'}</Text>
            </TouchableOpacity>
            {renderTimePicker('sleepStart')}

            <Text style={styles.formLabel}>End Time</Text>
            <TouchableOpacity onPress={() => handleShowIOSPicker('sleepEnd')} style={styles.timeButton}>
              <Text>{formData.sleepEnd || 'Select'}</Text>
            </TouchableOpacity>
            {renderTimePicker('sleepEnd')}
          </>
        );

      case 'diaper':
        return (
          <>
            <Text style={styles.formLabel}>Change Time</Text>
            <TouchableOpacity onPress={() => handleShowIOSPicker('diaperTime')} style={styles.timeButton}>
              <Text>{formData.diaperTime || 'Select'}</Text>
            </TouchableOpacity>
            {renderTimePicker('diaperTime')}

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.formLabel}>Solid?</Text>
              <TouchableOpacity
                onPress={() =>
                  setFormData((prev) => ({
                    ...prev,
                    diaperSolid: !prev.diaperSolid,
                  }))
                }
              >
                <Text style={{ fontSize: 18 }}>{formData.diaperSolid ? '✅' : '⬜'}</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'outside':
        return (
          <>
            <Text style={styles.formLabel}>Duration (min)</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Enter minutes"
              value={formData.outsideDuration}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, outsideDuration: text }))
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
  },
  timeButton: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    backgroundColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    fontSize: 14,
  },
});

export default FormFields;
