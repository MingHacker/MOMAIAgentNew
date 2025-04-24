import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../src/api';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { momApi } from '../src/api';
import { babyApi } from '../src/api';


const { height } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  message: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface ChatMessageCreate {
    message: string;
    role: 'user' | 'assistant';
    emotion_label?: string;
    source?: string; // 默认为 "chatbot"
  }

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const QUICK_BUBBLES = [
  { text: 'Mom Today', action: 'mom_today', icon: 'heart-pulse' },
  { text: 'Baby Today', action: 'baby_today', icon: 'baby-carriage' },
  { text: 'How are you?', action: 'greeting', icon: 'emoticon-happy' },
  { text: 'Tomorrow', action: 'Tomorrow', icon: 'weather-sunny' },
];

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${AsyncStorage.getItem('access_token')}`
  }
});

const ChatBot = () => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);

  useEffect(() => {
    loadChatHistory();
    setupGentleMessageTimer();
  }, []);

  const setupGentleMessageTimer = () => {
    const checkTime = () => {
      const now = dayjs();
      const targetTime = dayjs().hour(20).minute(0).second(0);
      
      if (now.isSame(targetTime, 'minute')) {
        fetchGentleMessage();
      }
    };

    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  };

  const fetchGentleMessage = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return;
      }
      const response = await api.getEmotion();
      if (response.success && response.gentle_message) {
        addMessage(response.gentle_message, false);
        if (!visible) {
          setHasUnreadMessage(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch gentle message:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return;
      }
  
      const history = await api.getChatHistory();
      if (history && Array.isArray(history)) {
        const formattedMessages = history.map((msg: ChatMessage) => {
          const raw = msg.timestamp;
          const isValid = raw && dayjs(raw).isValid();
  
          // console.log('🕒 Incoming timestamp:', raw, '| Valid:', isValid);
  
          const timestamp = isValid
            ? dayjs(raw).format('HH:mm')
            : '🕒';
  
          return {
            id: msg.id,
            text: msg.message,
            isUser: msg.role === 'user',
            timestamp,
          };
        });
        // console.log('🐣 Chat history raw response:', history);
        setMessages(formattedMessages.reverse());
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      addMessage('Failed to load chat history. Please try again later.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessage = async (text: string, isUser: boolean) => {
    try {
      await api.saveChatMessage(text, isUser);
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const addMessage = async (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: dayjs().format('HH:mm'),
    };
    setMessages(prev => [...prev, newMessage]);
    await saveMessage(text, isUser);
  };

  const handleQuickBubble = async (action: string) => {
    switch (action) {
        case 'mom_today':
            try {
              const response = await momApi.getTodaySummary();
              console.log('📦 mom summary response:', response);
          
              if (response.success && response.summary) {
                addMessage(response.summary, false);
              } else {
                addMessage('Sorry, I couldn’t fetch mom’s summary right now.', false);
              }
            } catch (error) {
              console.error('Failed to fetch mom summary:', error);
              addMessage('Sorry, I couldn’t fetch mom’s summary right now.', false);
            }
            break;
        case 'baby_today':
            try {
                const babyId = await AsyncStorage.getItem('baby_id') || '';
                const response = await babyApi.getTodaySummary(babyId);
                console.log('📦 baby summary response:', response);
            
                if (response.success && response.summary) {
                addMessage(response.summary, false);
                } else {
                // 👶 Friendly fallback if no summary available
                addMessage("Looks like there's no baby record for today yet. Maybe you can start by logging a feed or a nap 🐣", false);
                }
            } catch (error) {
                console.error('Failed to fetch baby summary:', error);
                addMessage("Hmm… I couldn’t reach baby’s data right now. Want to try again later? ☁️", false);
            }
            break;
        
      case 'greeting':
        addMessage('Hello! How can I help you today?', false);
        break;
      case 'Tomorrow':
        addMessage('Any plans for tomorrow?', false);
        break;
    }
  };

  const handleSend = async () => {
    if (inputText.trim()) {
      const message = inputText.trim();
      try {
        addMessage(message, true); // ✅ 会自动保存到 chat_logs 表
  
        const response = await api.sendChatMessage(message);
        if (response.success) {
          addMessage(response.message, false); // 同样保存 AI 回复
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        addMessage('Sorry, I couldn\'t process your message right now.', false);
      }
      setInputText('');
    }
  };
  
  const handleModalOpen = () => {
    setVisible(true);
    setHasUnreadMessage(false);
  };

  const handleModalClose = () => {
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleModalOpen}
      >
        <Icon name="robot" size={24} color="#8B5CF6" />
        {hasUnreadMessage && (
          <View style={styles.unreadBadge}>
            <View style={styles.unreadDot} />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}
        >
        <View style={styles.modalContainer}>
            <View style={styles.chatContainer}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                <Icon name="robot-happy" size={24} color="#8B5CF6" />
                <Text style={styles.headerText}>MOM AI Assistant</Text>
                </View>
                <TouchableOpacity onPress={handleModalClose}>
                <Icon name="close" size={24} color="#8B5CF6" />
                </TouchableOpacity>
            </View>

            <View style={styles.quickBubblesContainer}>
                <FlatList
                data={QUICK_BUBBLES}
                numColumns={2}
                keyExtractor={(item) => item.action}
                renderItem={({ item }) => (
                    <TouchableOpacity
                    style={styles.quickBubble}
                    onPress={() => handleQuickBubble(item.action)}
                    >
                    <Icon name={item.icon} size={24} color="#8B5CF6" style={styles.bubbleIcon} />
                    <Text style={styles.quickBubbleText}>{item.text}</Text>
                    </TouchableOpacity>
                )}
                />
            </View>

            <View style={styles.messagesContainer}>
                <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View
                    style={[
                        styles.messageBubble,
                        item.isUser ? styles.userBubble : styles.botBubble,
                    ]}
                    >
                    <Text style={styles.messageText}>{item.text}</Text>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                    </View>
                )}
                contentContainerStyle={styles.messagesList}
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    placeholderTextColor="#999"
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSend}
                    disabled={isLoading}
                >
                    <Icon name="send" size={20} color="#8B5CF6" />
                </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            </View>
        </View>
        </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 140,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: height * 0.75,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  quickBubblesContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    maxHeight: 180,
  },
  quickBubble: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 16,
    borderRadius: 40,
    margin: 8,
    minWidth: '45%',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleIcon: {
    marginRight: 12,
  },
  quickBubbleText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Rounded' : 'Roboto',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  messagesList: {
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    maxHeight: 110,
    overflow: 'hidden',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#F3E8FF',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8F8FF',
  },
  messageText: {
    color: '#4C3575',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Rounded' : 'Roboto',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
    color: '#4C3575',
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4B4B',
  },
});

export default ChatBot; 