import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, ScrollView, Animated } from 'react-native';
import { momApi, MomOneSentenceResponse } from '../src/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function MomDashboardSentence() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MomOneSentenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const [heartScale] = useState(new Animated.Value(1));
  const [explosionScale] = useState(new Animated.Value(0.5));
  const [explosionOpacity] = useState(new Animated.Value(0));
  const [breathAnimation] = useState(new Animated.Value(0));
  const [breathTimer, setBreathTimer] = useState<NodeJS.Timeout | null>(null);
  const [breathActive, setBreathActive] = useState(true);

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

  const triggerLikeAnimation = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(explosionScale, {
            toValue: 2.5, // ❗炸到大概卡片区域，不超出
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(explosionOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(explosionOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const triggerBreathAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(breathAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    fetchSummary();
    triggerBreathAnimation();

    const timer = setTimeout(() => {
      setBreathActive(false);
    }, 1 * 60 * 1000); // 1分钟后停止呼吸渐变

    setBreathTimer(timer);

    return () => {
      if (breathTimer) {
        clearTimeout(breathTimer);
      }
    };
  }, []);

  const handleLike = () => {
    setLiked(true);
    triggerLikeAnimation();
    setShowOptions(true);
  };

  const handleThanks = async () => {
    try {
      await momApi.likeSentence({
        onesentence: summary?.onesentence || '',
        liked: true,
      });
    } catch (e) {
      console.error('Failed to send like:', e);
    } finally {
      setShowOptions(false);
    }
  };

  const handleRemindLater = () => {
    setShowOptions(false);
  };

  const renderCardBackground = () => {
    if (!breathActive) {
      return '#F9F7FF';
    }
    return breathAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['#F9F7FF', '#F3E8FF'],
    });
  };

  if (loading) {
    return (
      <Animated.View style={[styles.quickSummaryCard, { backgroundColor: renderCardBackground() }]}>
        <ActivityIndicator size="small" color="#D946EF" />
        <Text style={styles.summaryText}>Loading today's wellness...</Text>
      </Animated.View>
    );
  }

  if (error || !summary) {
    return (
      <Animated.View style={[styles.quickSummaryCard, { backgroundColor: renderCardBackground() }]}>
        <Text style={styles.summaryText}>🌸 Be gentle with yourself today 💜</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.quickSummaryCard, { backgroundColor: renderCardBackground() }]}>
      <Image source={require('../assets/sleepy.png')} style={styles.image} />
      <ScrollView 
        style={styles.textContainer} 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.summaryText}>{summary.onesentence}</Text>
      </ScrollView>
      <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={[
              styles.explosionCircle,
              {
                transform: [{ scale: explosionScale }],
                opacity: explosionOpacity,
              },
            ]}
          />
          <Animated.View
            style={{
              transform: [{ scale: heartScale }],
            }}
          >
            <Icon 
              name={liked ? "heart" : "heart-outline"} 
              size={26} 
              color={liked ? "#EC4899" : "#94A3B8"} 
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {showOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={handleThanks}>
            <Text style={styles.optionText}>🌸 Feeling Better</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handleRemindLater}>
            <Text style={styles.optionText}>☁️ Maybe Later</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  quickSummaryCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    margin: 16,
    alignItems: 'center',
    flexWrap: 'wrap',
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
  summaryText: {
    fontSize: 15,
    color: '#4C3575',
  },
  likeButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
  },
  explosionCircle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(249, 168, 212, 0.4)', // 轻柔半透明粉色
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#F1E7FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  optionText: {
    color: '#6B21A8',
    fontSize: 14,
    fontWeight: '500',
  },
});
