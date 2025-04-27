import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { timelineApi } from "../src/api";
import { TimelineItem } from "../src/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { differenceInDays, parseISO, format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // 确保你安装了 expo-image-picker



export default function TimelineScreen() {
  const babyId = "3296e4f0-d710-44e4-80bf-570493a64d27";
  const userId = "bf3464f2-b5e0-416d-902e-c23d62f0361e";
  const birthDate = new Date("2023-04-10");

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const emojiImages = [
    { source: require('../assets/emojis/HappyE.png'), label: 'Happy', emoji: '😊' },
    { source: require('../assets/emojis/ok.png'), label: 'Neutral', emoji: '😐' },
    { source: require('../assets/emojis/Unhappy.png'), label: 'Unhappy', emoji: '😢' },
    { source: require('../assets/emojis/Cry.png'), label: 'Crying', emoji: '😭' },
    { source: require('../assets/emojis/CryOut.png'), label: 'Bawling', emoji: '😫' },
    { source: require('../assets/emojis/Sleepy.png'), label: 'Sleepy', emoji: '😴' },
    { source: require('../assets/emojis/Friendly.png'), label: 'Friendly', emoji: '🤗' },
    { source: require('../assets/emojis/Wow.png'), label: 'Surprised', emoji: '😲' },
    { source: require('../assets/emojis/No.png'), label: 'Refusal', emoji: '🙅' },
    { source: require('../assets/emojis/guai.png'), label: 'Well-behaved', emoji: '😇' },
    { source: require('../assets/emojis/noo.png'), label: 'Don\'t want', emoji: '😣' },
    { source: require('../assets/emojis/what.png'), label: 'What', emoji: '🤔' },
    { source: require('../assets/emojis/please.png'), label: 'Please', emoji: '🙏' },
    { source: require('../assets/emojis/crying.png'), label: 'Crying', emoji: '😢' },
    { source: require('../assets/emojis/okk.png'), label: 'Okay', emoji: '👌' },
    { source: require('../assets/emojis/idontwant.png'), label: 'I don\'t want', emoji: '😤' }
  ];


  const [form, setForm] = useState({
    title: "",
    emoji: "",
    description: "",
    image_url: "",
    date: new Date(),
  });

  const fetchTimeline = async () => {
    setLoading(true);
    const result = await timelineApi.getTimeline(babyId);
    const sorted = result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setTimeline(sorted);
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
  
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setForm({ ...form, image_url: uri });
    }
  };

  const handleAdd = async () => {
    if (!form.title || !form.date) {
      Alert.alert("请输入标题和日期");
      return;
    }
    const ok = await timelineApi.addTimeline({
      baby_id: babyId,
      user_id: userId,
      date: form.date.toISOString().split("T")[0],
      title: form.title,
      emoji: form.emoji,
      description: form.description,
      image_url: form.image_url,
    });
    if (ok) {
      setModalVisible(false);
      setForm({ title: "", emoji: "", description: "", image_url: "", date: new Date() });
      fetchTimeline();
    }
  };

  const calculateAgeLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    const days = differenceInDays(date, birthDate);
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    let age = "";
    if (years >= 1) {
      age += `${years}y`;
      if (remainingMonths > 0) age += ` ${remainingMonths}m`;
    } else {
      if (months > 0) age += `${months}m`;
      if (remainingDays > 0) age += ` ${remainingDays}d`;
    }
    return age.trim();
  };

  const renderSectionTitle = (age: string) => (
    <View style={styles.sectionTitleBox} key={`section-${age}`}>
      <Text style={styles.sectionTitleText}>{age}</Text>
    </View>
  );

  let currentSection = "";

  const getEmojiImage = (emojiChar: string | undefined) => {
    if (!emojiChar) return null;
    const emojiItem = emojiImages.find(item => item.emoji === emojiChar);
    return emojiItem ? emojiItem.source : null;
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#888" />
        </View>
      ) : (
        <Animated.ScrollView contentContainerStyle={styles.container} style={{ opacity: fadeAnim }}>
          <View style={styles.headerBox}>
            <View style={styles.headerCard}>
              <Image source={require('../assets/Evan.png')} style={styles.babyAvatar} />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.babyName}>Evan</Text>
                <Text style={styles.babyInfo}>Born January 2, 2024</Text>
                <Text style={styles.babyQuote}>Thanks for being my baby.</Text>
              </View>
            </View>
          </View>

          {timeline.map((item) => {
            const ageLabel = calculateAgeLabel(item.date);
            const showSection = ageLabel !== currentSection;
            currentSection = ageLabel;
            const hasImage = item.image_url && item.image_url.length > 5;
            return (
              <View key={item.id}>
                {showSection && renderSectionTitle(ageLabel)}
                <View style={styles.timelineItem}>
                  {hasImage ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.itemImage}
                    />
                  ) : (
                    <View style={styles.emojiHolder}>
                      {getEmojiImage(item.emoji) ? (
                        <Image 
                          source={getEmojiImage(item.emoji)} 
                          style={styles.timelineEmojiImage} 
                        />
                      ) : (
                        <Text style={{ fontSize: 28 }}>👶</Text>
                      )}
                    </View>
                  )}
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.eventTitle}>{item.emoji} {item.title}</Text>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                    <Text style={styles.dateSmall}>{format(parseISO(item.date), 'MMMM d, yyyy')}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </Animated.ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={{ fontSize: 30, color: "#fff" }}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Event</Text>

            <TextInput
                placeholder="Title"
                style={{ ...styles.input, fontSize: 14, fontWeight: "500",color: "#666"  }}
                value={form.title}
                onChangeText={(text) => setForm({ ...form, title: text })}
            />

            <TextInput
                placeholder="Description"
                multiline
                numberOfLines={4}
                style={{ ...styles.input, fontSize: 14, fontWeight: "500", color: "#666", height: 100, textAlignVertical: 'top' }}
                value={form.description}
                onChangeText={(text) => setForm({ ...form, description: text })}
            />

            {/* Emoji Selector */}
            <Text style={styles.emojiPickerTitle}>Pick an Emoji</Text>
            <View style={styles.emojiGrid}>
                {emojiImages.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    onPress={() => setForm({ ...form, emoji: item.emoji })}
                    style={[
                    styles.emojiButton,
                    form.emoji === item.emoji && { backgroundColor: "#DDD6F3" },
                    ]}
                >
                    <Image source={item.source} style={styles.emojiImage} />
                </TouchableOpacity>
                ))}
            </View>

            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.uploadIcon} onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color="#888" />
                  <Text style={{ marginLeft: 6, fontSize: 13, color: "#666" }}>Add Image</Text>
              </TouchableOpacity>

              <View style={styles.datePickerContainer}>
                <DateTimePicker
                    value={form.date}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) =>
                    selectedDate && setForm({ ...form, date: selectedDate })
                    }
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={{ color: "#fff" }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: "#666" }}>Cancel</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 100,
      backgroundColor: "#FAF7F0",
    },
    sectionTitleBox: {
      paddingVertical: 8,
      marginTop: 8,
      marginBottom: 4,
    },
    sectionTitleText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#6C63FF",
    },
    headerBox: {
      marginBottom: 24,
    },
    headerCard: {
      flexDirection: "row",
      backgroundColor: "#EFEFF8",
      padding: 16,
      borderRadius: 20,
      alignItems: "center",
    },
    babyAvatar: {
      width: 80,
      height: 80,
      borderRadius: 32,
    },
    babyName: {
      fontSize: 20,
      fontWeight: "600",
      color: "#333",
    },
    babyInfo: {
      fontSize: 14,
      color: "#666",
      marginTop: 2,
    },
    babyQuote: {
      fontSize: 13,
      fontStyle: "italic",
      color: "#999",
      marginTop: 4,
    },
    timelineItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 32,
      position: "relative",
    },
    itemImage: {
      width: 64,
      height: 64,
      borderRadius: 32,
      marginRight: 12,
      marginTop: 4,
      backgroundColor: "#F1E8E1",
    },
    emojiHolder: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#EFEFF8",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      marginTop: 4,
    },
    timelineLine: {
      width: 2,
      height: "100%",
      backgroundColor: "#D8D8DD",
      position: "absolute",
      left: 70,
      top: 0,
    },
    timelineContent: {
      flex: 1,
      marginLeft: 20,
    },
    eventTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: "#444",
      marginBottom: 4,
    },
    descriptionText: {
      fontSize: 14,
      fontWeight: "500",
      color: "#555",
      marginBottom: 6,
      lineHeight: 20,
    },
    dateSmall: {
      fontSize: 12,
      color: "#999",
      alignSelf: "flex-start",
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    fab: {
      position: "absolute",
      bottom: 30,
      right: 20,
      width: 56,
      height: 56,
      backgroundColor: "#C4B5D9",
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 5,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingTop: 40,
    },
    modalContent: {
      backgroundColor: "#fff",
      margin: 20,
      marginTop: 60,
      borderRadius: 20,
      padding: 24,
      paddingBottom: 40,
      maxHeight: '80%',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "600",
      marginBottom: 16,
      color: "#333",
      fontFamily: 'System',
      letterSpacing: 0.3,
    },
    input: {
      borderWidth: 1,
      borderColor: "#e0e0e0",
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 12,
      fontSize: 13,
      color: "#444",
      fontFamily: 'System',
    },
    emojiPickerTitle: {
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 6,
      color: "#555",
    },
    emojiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 4,
      marginBottom: 8,
    },
    emojiButton: {
      alignItems: "center",
      margin: 4,
      borderRadius: 12,
      backgroundColor: "#F5F3FB",
    },
    emojiImage: {
      width: 36,
      height: 36,
    },
    uploadIcon: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: "#f5f5f5",
    },
    inputRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      gap: 12,
    },
    datePickerContainer: {
      flex: 1,
      alignItems: "flex-end",
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 24,
      paddingHorizontal: 10,
      gap: 20,
    },
    cancelBtn: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: "#f5f5f5",
      alignItems: "center",
      flex: 1,
    },
    saveBtn: {
      backgroundColor: "#BDADEB",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      flex: 1,
      shadowColor: "#9B8ACE",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    timelineEmojiImage: {
      width: 40,
      height: 40,
      resizeMode: 'contain',
    },
 
});
