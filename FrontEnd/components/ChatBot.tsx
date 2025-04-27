import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  PanResponder,
  Animated,
  Keyboard,
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

const generateUniqueId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const ChatBot = () => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);
  const [shouldShowIcon, setShouldShowIcon] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const MESSAGES_PER_PAGE = 20;
  const [iconPosition, setIconPosition] = useState({
    x: Dimensions.get('window').width - 68,
    y: Dimensions.get('window').height - 400
  });
  
  const pan = useRef(new Animated.ValueXY()).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        Animated.event(
          [
            null,
            { dy: pan.y }
          ],
          { useNativeDriver: false }
        )(_, gesture);
      },
      onPanResponderRelease: (_, gesture) => {
        const screenHeight = Dimensions.get('window').height;
        const rightPadding = 8;
        
        const newY = Math.max(100, Math.min(iconPosition.y + gesture.dy, screenHeight - 200));
        
        setIconPosition({
          x: Dimensions.get('window').width - 68 - rightPadding,
          y: newY
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        pan.setValue({ x: 0, y: 0 });
      }
    })
  ).current;

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        setShouldShowIcon(!!token);
      } catch (error) {
        console.error('Failed to check login status:', error);
      }
    };

    checkLoginStatus();
    loadChatHistory();
    setupGentleMessageTimer();
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;
    const rightPadding = 8;
    
    setIconPosition({
      x: screenWidth - 68 - rightPadding,
      y: screenHeight - 400
    });
  }, []);

  // 监听 token 变化
  useEffect(() => {
    const checkTokenInterval = setInterval(async () => {
      const token = await AsyncStorage.getItem('access_token');
      setShouldShowIcon(!!token);
    }, 1000);

    return () => clearInterval(checkTokenInterval);
  }, []);

  useEffect(() => {
    if (visible && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible, messages]);

  useEffect(() => {
    const keyboardWillShow = (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);
    };

    let keyboardWillShowListener: any;
    let keyboardWillHideListener: any;

    if (Platform.OS === 'ios') {
      keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
      keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', keyboardWillHide);
    } else {
      keyboardWillShowListener = Keyboard.addListener('keyboardDidShow', keyboardWillShow);
      keyboardWillHideListener = Keyboard.addListener('keyboardDidHide', keyboardWillHide);
    }

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
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

  const loadChatHistory = async (offset = 0) => {
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

        // 检查是否还有更多消息
        setHasMoreMessages(formattedMessages.length > offset + MESSAGES_PER_PAGE);
        
        // 获取指定范围的消息
        const recentMessages = formattedMessages.slice(-MESSAGES_PER_PAGE - offset);
        
        if (offset === 0) {
          setMessages(recentMessages);
        } else {
          setMessages(prev => [...recentMessages, ...prev]);
        }
        setMessageOffset(offset);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      addMessage('Failed to load chat history. Please try again later.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMoreMessages) {
      loadChatHistory(messageOffset + MESSAGES_PER_PAGE);
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
      id: generateUniqueId(),
      text,
      isUser,
      timestamp: dayjs().format('HH:mm'),
    };
    setMessages(prev => {
      const updatedMessages = [...prev, newMessage];
      return updatedMessages.slice(-20);
    });
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
                addMessage('Sorry, I couldn\'t fetch mom\'s summary right now.', false);
              }
            } catch (error) {
              console.error('Failed to fetch mom summary:', error);
              addMessage('Sorry, I couldn\'t fetch mom\'s summary right now.', false);
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
                addMessage("Hmm… I couldn't reach baby's data right now. Want to try again later? ☁️", false);
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
        addMessage("Sorry, I couldn't process your message right now.", false);
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

  const renderBotIcon = (type: 'float' | 'header') => {
    const useCustomIcon = true;
    
    if (useCustomIcon) {
      const iconSource = type === 'float' 
        ? require('../assets/bubbletea.png')
        : require('../assets/bubbletea.png');
      
      return (
        <Image 
          source={iconSource}
          style={[
            type === 'float' ? styles.customFloatingIcon : styles.customHeaderIcon,
            { resizeMode: 'contain' }
          ]}
        />
      );
    }
    
    return (
      <Icon
        name="robot"
        size={type === 'float' ? 28 : 24}
        color={type === 'float' ? '#4C3575' : '#4C3575'}
      />
    );
  };

  return (
    <>
      {shouldShowIcon && (
        <Animated.View
          style={[
            styles.floatingButton,
            {
              transform: [{ translateY: pan.y }],
              left: iconPosition.x,
              top: iconPosition.y,
            }
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity 
            onPress={handleModalOpen}
            style={styles.touchableArea}
          >
            {renderBotIcon('float')}
            {hasUnreadMessage && (
              <View style={styles.unreadBadge}>
                <View style={styles.unreadDot} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      <Modal
        visible={visible}
        animationType="none"
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalDismissArea}
              activeOpacity={1} 
              onPress={handleModalClose}
            />
            <View style={styles.chatContainer}>
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  {renderBotIcon('header')}
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
                  keyExtractor={(item, index) => `quick_bubble_${item.action}_${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.quickBubble}
                      onPress={() => handleQuickBubble(item.action)}
                    >
                      <Icon name={item.icon} size={20} color="#8B5CF6" style={styles.bubbleIcon} />
                      <Text style={styles.quickBubbleText}>{item.text}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              <View style={styles.messagesContainer}>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item) => item?.id || generateUniqueId()}
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
                  onContentSizeChange={() => {
                    if (messages.length > 0) {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type a message..."
                  placeholderTextColor="#999"
                  multiline={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSend}
                  disabled={isLoading}
                >
                  <Icon name="send" size={20} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  modalDismissArea: {
    flex: 1,
  },
  chatContainer: {
    height: Platform.OS === 'ios' ? height * 0.5 : height * 0.55,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    marginBottom: -20,
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
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    maxHeight: 80,
  },
  quickBubble: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 40,
    margin: 4,
    minWidth: '45%',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleIcon: {
    marginRight: 8,
  },
  quickBubbleText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Rounded' : 'Roboto',
  },
  messagesContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
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
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
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
  customFloatingIcon: {
    width: 48,
    height: 48,
    margin: 0,
  },
  customHeaderIcon: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  loadMoreButton: {
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  loadMoreText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  touchableArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatBot; 