import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { ImageBackground } from 'react-native';
import { api } from '../src/api';
import { useAuth } from '../App';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async () => {
    try {
      const success = await api.login({ email, password });
      if (success) {
        await login(email);
      } else {
        Alert.alert('Login failed', 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/backgroundwithicon3.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <View style={styles.topSection}>
            <Image
              //source={require('../assets/loginicon4.png')}
              //style={styles.logo}
            />
          </View>

          <View style={styles.whiteBackground}>
            <View style={styles.middleSection}>
              <View style={styles.formContainer}>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#A1A1A1"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#A1A1A1"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  whiteBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  topSection: {
    alignItems: 'center',
    marginTop: '85%',
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  middleSection: {
    width: '100%',
    paddingHorizontal: 28,
    paddingTop: 10,
    marginTop: -5,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  bottomSection: {
    height: 60,
    backgroundColor: '#FFFFFF',
    marginTop: -1,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#3A3A3A',
    marginBottom: 28,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0DED9',
  },
  button: {
    backgroundColor: '#7C9EE1',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#6B8ACB",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});