import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
import { momApi, MomOneSentenceResponse } from '../src/api';
import { Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function MomDashboardSentence() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MomOneSentenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await momApi.getOneSentence();
      setSummary(res);
    } catch (e) {
      setError('Something went wrong.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleLike = () => {
    setLiked(!liked);
    // TODO: 可以在这里添加点赞的 API 调用
  };

  if (loading) {
    return (
      <View style={styles.quickSummaryCard}>
        <ActivityIndicator size="small" color="#D946EF" />
        <Text style={styles.summaryText}>Loading today's wellness...</Text>
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={styles.quickSummaryCard}>
        <Text style={styles.summaryText}>🌸 Be gentle with yourself today 💜</Text>
      </View>
    );
  }

  return (
    <View style={styles.quickSummaryCard}>
      <Image source={require('../assets/sleepy.png')} style={styles.image} />
      <ScrollView 
        style={styles.textContainer} 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.summaryText}>{summary.onesentence}</Text>
      </ScrollView>
      <TouchableOpacity 
        style={styles.likeButton} 
        onPress={handleLike}
      >
        <Icon 
          name={liked ? "heart" : "heart-outline"} 
          size={22} 
          color={liked ? "#D946EF" : "#94A3B8"} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  quickSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F7FF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    margin: 16,
    alignItems: 'center',
  },
  image: {
    width: 62,
    height: 62,
    marginRight: 12,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
    maxHeight: 40,
    minHeight: 28,
  },
  title: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 15,
    color: '#4C3575',
  },
  likeButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
  },
});