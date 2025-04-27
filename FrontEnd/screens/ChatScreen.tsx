import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { OPENAI_API_KEY } from '@env';
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView

export default function QAScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImageBase64(asset.base64 || null);
      setImageUri(asset.uri);
    }
  };

  const askOpenAIVision = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                ...(imageBase64
                  ? [
                      {
                        type: 'image_url',
                        image_url: {
                          url: `data:image/jpeg;base64,${imageBase64}`,
                        },
                      },
                    ]
                  : []),
                { type: 'text', text: question },
              ],
            },
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );
      const reply = res.data.choices[0].message.content;
      setAnswer(reply);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setAnswer('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setImageBase64(null);
      setImageUri(null);
      setQuestion('');
    }
  };

  const suggestions = [
    'Is this diaper rash?',
    'My baby has red spots',
    'Is this eczema?',
    'My baby cries every night',
    'Can I give vitamin D and go outside on the same day?',
  ];

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }}
        onLayout={() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }}
      >
        <View style={styles.chatBubbleWrap}>
          {submitted && answer !== '' && (
            <View style={styles.answerBubble}>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          )}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputWrapper}>
          {selectedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity onPress={() => setSelectedImage(null)}>
                <Text style={styles.removeImage}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask me anything..."
              multiline
            />
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, !question && styles.submitButtonDisabled]}
              onPress={askOpenAIVision}
              disabled={!question}
            >
              <Text style={styles.submitButtonText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  imageButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    fontSize: 24,
    color: '#666',
  },
  submitButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  imagePreview: {
    padding: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeImage: {
    position: 'absolute',
    top: 0,
    right: 5,
    backgroundColor: '#FF4444',
    color: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  chatBubbleWrap: {
    marginBottom: 16,
    minHeight: '30%',
    justifyContent: 'flex-start',
  },
  answerBubble: {
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 20,
    alignSelf: 'flex-start',
    maxWidth: '95%',
  },
  answerText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    fontFamily: 'System',
  },
});