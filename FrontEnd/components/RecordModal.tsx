import React from 'react';
import { Modal, View, Text, Button, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FormFields from './FormFields';

const RecordModal = ({
  visible,
  onClose,
  selectedType,
  setSelectedType,
  formData,
  setFormData,
  onSubmit,
  submitting, // 👈 新增 props
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>记录类型</Text>

          {/* 类型选择按钮 */}
          <View style={styles.typeSelectorRow}>
            {['feeding', 'sleep', 'diaper', 'outside'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                style={[styles.bubble, selectedType === type && styles.bubbleSelected]}
              >
                <Text style={selectedType === type ? styles.bubbleTextSelected : styles.bubbleText}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 表单组件 */}
          <FormFields
            selectedType={selectedType}
            formData={formData}
            setFormData={setFormData}
          />

          {/* 提交按钮 */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? '提交中...' : '提交'}
            </Text>
          </TouchableOpacity>

          {/* 关闭按钮 */}
          <View style={{ marginTop: 16 }}>
            <Button title="关闭" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#aaa',
  },
  bubbleSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  bubbleText: {
    color: '#333',
    fontWeight: '500',
  },
  bubbleTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecordModal;
