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


export default function TimelineScreen() {
  const babyId = "3296e4f0-d710-44e4-80bf-570493a64d27";
  const userId = "bf3464f2-b5e0-416d-902e-c23d62f0361e";
  const birthDate = new Date("2023-04-10");

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

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
              <Image source={require('../assets/neutral.png')} style={styles.babyAvatar} />
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
                      <Text style={{ fontSize: 28 }}>{item.emoji || "👶"}</Text>
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
            <Text style={styles.modalTitle}>添加成长记录</Text>
            <TextInput placeholder="标题" style={styles.input} value={form.title} onChangeText={(text) => setForm({ ...form, title: text })} />
            <TextInput placeholder="Emoji (可选)" style={styles.input} value={form.emoji} onChangeText={(text) => setForm({ ...form, emoji: text })} />
            <TextInput placeholder="描述" style={styles.input} multiline value={form.description} onChangeText={(text) => setForm({ ...form, description: text })} />
            <TextInput placeholder="图片链接 (可选)" style={styles.input} value={form.image_url} onChangeText={(text) => setForm({ ...form, image_url: text })} />
            <DateTimePicker value={form.date} mode="date" display="default" onChange={(_, selectedDate) => { if (selectedDate) setForm({ ...form, date: selectedDate }); }} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>保存</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ marginTop: 10, color: "#888" }}>取消</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
    borderRadius: 60,
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
    backgroundColor: "#00000099",
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#6C63FF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
