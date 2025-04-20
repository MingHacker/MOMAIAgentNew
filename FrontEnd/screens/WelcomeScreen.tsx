import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useNavigation, StackActions } from '@react-navigation/native';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 动画：文字淡入
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // 3 秒后跳转到 Login
    const timer = setTimeout(() => {
      navigation.dispatch(StackActions.replace('Login'));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        🎀 ˖⁺‧₊˚ ♡ ˚₊‧⁺˖
      </Animated.Text>
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        Welcome to Mom AI
      </Animated.Text>
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        ₊˚⊹♡ ˚₊‧⁺˖ 🌸
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F3E8FF',
  },
  text: {
    fontSize: 28, 
    fontWeight: '600', 
    color: '#4C3575',
    marginVertical: 5,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
