import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import FilterBar from '../components/FilterBar';

const CARD_MARGIN = 10;
const CARD_WIDTH = (Dimensions.get('window').width - 3 * CARD_MARGIN - 32) / 2; // 32为两侧padding

const filters = [
  { key: 'all', label: 'All' },
  { key: '2-6', label: '2-6' },
  { key: '3-8', label: '3-8' },
  { key: '6-12', label: '6-12' },
  { key: 'outdoor', label: 'Outdoor' },
  { key: 'indoor', label: 'Indoor' },
];

const mockEvents = [
  {
    id: '1',
    title: 'Family Storytime',
    time: '2024-06-15 10:00-11:30',
    forAges: '2-6',
    location: 'City Library Kids Zone',
    price: 'Free',
    description: 'Perfect for kids 2-6. Enjoy story reading and interactive games together!',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    type: 'indoor',
  },
  {
    id: '2',
    title: 'Kids Science Day',
    time: '2024-06-16 14:00-16:00',
    forAges: '3-8',
    location: 'Family Activity Center',
    price: '$8/family',
    description: 'Hands-on experiments to spark curiosity. For ages 3-8.',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    type: 'indoor',
  },
  {
    id: '3',
    title: 'Outdoor Picnic',
    time: '2024-06-18 09:30-12:00',
    forAges: 'All ages',
    location: 'Central Park Lawn',
    price: 'Bring your own food',
    description: 'Meet new friends and enjoy a sunny picnic. All ages welcome!',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    type: 'outdoor',
  },
  {
    id: '4',
    title: 'Parent-Child Yoga',
    time: '2024-06-20 15:00-16:00',
    forAges: '2-7',
    location: 'Yoga Studio',
    price: '$5/family',
    description: 'Relax and bond with your child through yoga. For ages 2-7.',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
    type: 'indoor',
  },
  {
    id: '5',
    title: 'Art & Craft Workshop',
    time: '2024-06-22 13:00-15:00',
    forAges: '4-10',
    location: 'Art Center',
    price: '$10/child',
    description: 'Creative art activities for kids. Materials provided.',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80',
    type: 'indoor',
  },
  {
    id: '6',
    title: 'Music & Dance Party',
    time: '2024-06-25 17:00-19:00',
    forAges: 'All ages',
    location: 'Community Hall',
    price: 'Free',
    description: 'Enjoy music and dance with your family. Open to all ages.',
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
    type: 'indoor',
  },
  {
    id: '7',
    title: 'STEM Robotics',
    time: '2024-06-27 10:00-12:00',
    forAges: '6-12',
    location: 'Tech Lab',
    price: '$15/child',
    description: 'Build and program simple robots. For ages 6-12.',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=400&q=80',
    type: 'indoor',
  },
  {
    id: '8',
    title: 'Family Movie Night',
    time: '2024-06-29 18:30-21:00',
    forAges: 'All ages',
    location: 'Open Air Cinema',
    price: 'Free',
    description: 'Watch a family-friendly movie under the stars. Bring your own snacks!',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80',
    type: 'outdoor',
  },
];

export default function FamilyEventsScreen() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleEventPress = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 过滤逻辑
  const filteredEvents = mockEvents.filter(event => {
    if (selectedFilter === 'all') return true;
    if (['2-6', '3-8', '6-12'].includes(selectedFilter)) {
      return event.forAges.includes(selectedFilter);
    }
    if (selectedFilter === 'outdoor') return event.type === 'outdoor';
    if (selectedFilter === 'indoor') return event.type === 'indoor';
    return true;
  });

  const renderEventItem = ({ item, index }) => (
    <View
      style={[
        styles.cardWrapper,
        { marginRight: index % 2 === 0 ? CARD_MARGIN : 0, marginLeft: index % 2 === 1 ? CARD_MARGIN : 0 }
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleEventPress(item)}
        activeOpacity={0.92}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.cardImage} />
          {/* 可选：图片加渐变遮罩 */}
          {/* <LinearGradient
            colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0)']}
            style={StyleSheet.absoluteFill}
          /> */}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>{item.time}</Text>
          <Text style={styles.cardAges} numberOfLines={1}>For ages {item.forAges}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => toggleFavorite(item.id)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18, color: favorites[item.id] ? '#4F8EF7' : '#bbb' }}>
              {favorites[item.id] ? '❤️' : '🤍'}
            </Text>
            <Text style={[styles.saveText, { color: favorites[item.id] ? '#4F8EF7' : '#888' }]}>
              {favorites[item.id] ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
          {/* 可选：分享按钮
          <TouchableOpacity style={styles.shareBtn}>
            <Text style={{ fontSize: 18, color: '#bbb' }}>🔗</Text>
            <Text style={styles.saveText}>Share</Text>
          </TouchableOpacity>
          */}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaViewRN style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      <View style={styles.container}>
        <Text style={styles.header}>Find Little Adventures Near You 🌿</Text>
        <FilterBar
          filters={filters}
          selectedFilter={selectedFilter}
          onSelect={setSelectedFilter}
        />
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: CARD_MARGIN * 2 }}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No events found.</Text>
          }
        />
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Image source={{ uri: selectedEvent?.image }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
              <Text style={styles.modalInfo}>{selectedEvent?.time}</Text>
              <Text style={styles.modalInfo}>{selectedEvent?.location}</Text>
              <Text style={styles.modalInfo}>{selectedEvent?.price}</Text>
              <Text style={styles.modalDesc}>{selectedEvent?.description}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaViewRN>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    paddingTop: 0,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6D6D80', // 柔和灰紫色调，温柔
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'left',
    letterSpacing: 0.3,
  },
  filterBar: {
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
  cardWrapper: {
    position: 'relative',
    marginBottom: 20,
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    width: '100%',
    shadowColor: '#222',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 110,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E9E9E9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: '#4F8EF7',
    marginBottom: 2,
  },
  cardAges: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F1F3',
    marginHorizontal: 12,
    marginVertical: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 2,
  },
  favoriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '85%',
    shadowColor: '#222',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
    alignItems: 'center',
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginBottom: 18,
    backgroundColor: '#E9E9E9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalInfo: {
    fontSize: 15,
    color: '#4F8EF7',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: '#4F8EF7',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 36,
    marginTop: 8,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
