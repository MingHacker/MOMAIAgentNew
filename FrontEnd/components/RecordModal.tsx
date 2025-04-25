import React from 'react';
import { Modal, View, Text, Button, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FormFields from './FormFields';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const RecordModal = ({
  visible,
  onClose,
  selectedType,
  setSelectedType,
  formData,
  setFormData,
  onSubmit,
  submitting,
}) => {
  const typeIcons = {
    feeding: 'baby-bottle',
    sleep: 'sleep',
    diaper: 'baby-face-outline',
    outside: 'baby-carriage',
  };

  const typeLabels = {
    feeding: 'Feeding',
    sleep: 'Sleep',
    diaper: 'Diaper',
    outside: 'Activity',
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Record Type</Text>

          {/* Type selection buttons */}
          <View style={styles.typeSelectorRow}>
            {['feeding', 'sleep', 'diaper', 'outside'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                style={[styles.bubble, selectedType === type && styles.bubbleSelected]}
              >
                <MaterialCommunityIcons 
                  name={typeIcons[type]} 
                  size={24} 
                  color={selectedType === type ? '#fff' : '#8B5CF6'} 
                  style={styles.bubbleIcon}
                />
                <Text style={selectedType === type ? styles.bubbleTextSelected : styles.bubbleText}>
                  {typeLabels[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form component */}
          <FormFields
            selectedType={selectedType}
            formData={formData}
            setFormData={setFormData}
          />

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Saving...' : 'Save Record'}
            </Text>
          </TouchableOpacity>

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#4B5563',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    minWidth: 75,
    marginHorizontal: 2,
  },
  bubbleSelected: {
    backgroundColor: '#F3E8FF',
  },
  bubbleIcon: {
    marginBottom: 4,
  },
  bubbleText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 13,
  },
  bubbleTextSelected: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: '#F3E8FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F3E8FF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default RecordModal;
