import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

// 可爱的心情表情图片，你可以替换成你喜欢的表情图片
const moodImages = {
  happy: require('../assets/happy.png'),  // 你可以把这换成自己喜欢的图片路径
  sad: require('../assets/sad.png'),
  neutral: require('../assets/neutral.png'),
};

export default function MoodSelector({ onMoodSelect }: { onMoodSelect: (mood: string) => void }) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    onMoodSelect(mood); // 将选择的心情传给父组件或后端
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      
      <View style={styles.moodContainer}>
        <TouchableOpacity onPress={() => handleMoodSelect('happy')}>
          <Image source={moodImages.happy} style={styles.moodImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMoodSelect('neutral')}>
          <Image source={moodImages.neutral} style={styles.moodImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMoodSelect('sad')}>
          <Image source={moodImages.sad} style={styles.moodImage} />
        </TouchableOpacity>
      </View>

      {selectedMood && <Text style={styles.selectedMoodText}>How are you feeling today: {selectedMood}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',  // ← 更均匀分布
    width: '100%',                  // ← 用满整个宽度
  },
  moodImage: {
    width: 80,
    height: 80,
    marginHorizontal: 6,
  },
  selectedMoodText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
});
