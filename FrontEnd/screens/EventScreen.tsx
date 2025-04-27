import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Platform } from 'react-native';

// mock event 数据
const mockEvents = [
  {
    id: '1',
    title: '亲子绘本故事会',
    time: '2024-06-15 10:00-11:30',
    location: '市图书馆儿童区',
    price: '免费',
    description: '适合2-6岁宝宝，专业老师带领亲子共读绘本，互动游戏丰富。',
  },
  {
    id: '2',
    title: '儿童科学实验日',
    time: '2024-06-16 14:00-16:00',
    location: '亲子活动中心',
    price: '50元/家庭',
    description: '动手做实验，激发孩子科学兴趣，适合3-8岁。',
  },
  {
    id: '3',
    title: '户外亲子野餐',
    time: '2024-06-18 09:30-12:00',
    location: '城市公园草坪',
    price: '自带餐食',
    description: '妈妈们带娃一起户外野餐，结识新朋友，适合所有年龄段。',
  },
  {
    id: '4',
    title: '亲子瑜伽体验课',
    time: '2024-06-20 15:00-16:00',
    location: '瑜伽生活馆',
    price: '30元/家庭',
    description: '亲子互动瑜伽，舒缓身心，适合2-7岁宝宝和妈妈。',
  },
];

export default function FamilyEventsScreen() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleEventPress = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity style={styles.eventItem} onPress={() => handleEventPress(item)}>
      <Text style={styles.eventTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>附近亲子活动推荐</Text>
      <FlatList
        data={mockEvents}
        renderItem={renderEventItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
            <Text style={styles.modalInfo}>🕒 {selectedEvent?.time}</Text>
            <Text style={styles.modalInfo}>📍 {selectedEvent?.location}</Text>
            <Text style={styles.modalInfo}>💰 {selectedEvent?.price}</Text>
            <Text style={styles.modalDesc}>{selectedEvent?.description}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7FF',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B21A8',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 1,
  },
  eventItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 16,
    color: '#4C3575',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B21A8',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalInfo: {
    fontSize: 15,
    color: '#4C3575',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 28,
  },
  closeBtnText: {
    color: '#6B21A8',
    fontSize: 15,
    fontWeight: '600',
  },
});
