import React, { useState } from 'react';
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

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: 30 }]}> {/* Wrap the entire screen with SafeAreaView */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.chatBubbleWrap}>
              {submitted && answer !== '' && (
                <View style={styles.answerBubble}>
                  <Text style={styles.answerText}>{answer}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputArea}>
              <TextInput
                style={styles.input}
                placeholder="Ask anything..."
                value={question}
                onChangeText={setQuestion}
                multiline
              />

              <View style={styles.quickRow}>
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.tag}
                    onPress={() => setQuestion(item)}>
                    <Text style={styles.tagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.bottomButtons}>
                <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>＋ Image</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={askOpenAIVision} style={styles.sendButtonSoft}>
                  <Text style={styles.sendButtonSoftText}>Submit</Text>
                </TouchableOpacity>
              </View>

              {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
              {loading && <ActivityIndicator size="large" color="#999" style={{ marginTop: 20 }} />}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAF8',
    padding: 20,
    paddingTop: 40,
    flexGrow: 1,
  },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: '#4B5563',
    fontFamily: 'System',
  },
  inputArea: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    paddingBottom: 10,
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    borderRadius: 20,
    padding: 18,
    fontSize: 17,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
    color: '#333',
    height: 140,
    fontFamily: 'System',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F9F5FF',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#4C3575',
    fontFamily: 'System',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  iconButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  iconButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sendButtonSoft: {
    backgroundColor: '#F9F5FF',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonSoftText: {
    color: '#4C3575',
    fontWeight: '500',
    fontSize: 16,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
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