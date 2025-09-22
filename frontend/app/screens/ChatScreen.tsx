import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: string;
  offer_amount?: number;
  is_read: boolean;
  created_at: string;
}

interface Props {
  navigation: any;
  route: any;
}

const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { otherUserId, listingId, otherUserName, listingTitle } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();
  const flashListRef = useRef<FlashList<Message>>(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherUserName,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('ListingDetail', { listingId })}
        >
          <Ionicons name="information-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
    
    loadMessages();
  }, [otherUserId, listingId]);

  const loadMessages = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/${otherUserId}/${listingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        // Scroll to bottom
        setTimeout(() => {
          flashListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Hata', 'Mesajlar yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Hata', 'Ağ hatası');
    }
  };

  const sendMessage = async (messageText: string, messageType = 'text', amount?: number) => {
    if (!user || !token || !messageText.trim()) return;

    setIsLoading(true);
    try {
      const messageData = {
        listing_id: listingId,
        receiver_id: otherUserId,
        message: messageText,
        message_type: messageType,
        offer_amount: amount || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const newMessageData = await response.json();
        setMessages(prev => [...prev, newMessageData]);
        setNewMessage('');
        setOfferAmount('');
        setShowOfferInput(false);
        
        // Scroll to bottom
        setTimeout(() => {
          flashListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Hata', 'Mesaj gönderilemedi');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Hata', 'Ağ hatası');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
    }
  };

  const handleSendOffer = () => {
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      Alert.alert('Hata', 'Geçerli bir teklif miktarı girin');
      return;
    }

    const offerText = `${parseFloat(offerAmount).toLocaleString('tr-TR')} ₺ teklif ediyorum`;
    sendMessage(offerText, 'offer', parseFloat(offerAmount));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;
    const isOffer = item.message_type === 'offer';

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          isOffer && styles.offerBubble
        ]}>
          {isOffer && (
            <View style={styles.offerHeader}>
              <Ionicons name="pricetag" size={16} color={isMyMessage ? 'white' : '#007AFF'} />
              <Text style={[
                styles.offerLabel,
                { color: isMyMessage ? 'white' : '#007AFF' }
              ]}>
                Teklif
              </Text>
            </View>
          )}
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText,
            isOffer && styles.offerText
          ]}>
            {item.message}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          isMyMessage ? styles.myMessageTime : styles.otherMessageTime
        ]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Giriş yapmanız gerekiyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Listing Info Header */}
      <View style={styles.listingHeader}>
        <Text style={styles.listingTitle} numberOfLines={1}>
          {listingTitle}
        </Text>
      </View>

      {/* Messages List */}
      <View style={styles.messagesContainer}>
        <FlashList
          ref={flashListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          estimatedItemSize={80}
          onContentSizeChange={() => flashListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Henüz mesaj yok</Text>
              <Text style={styles.emptySubtext}>
                Konuşmaya başlamak için bir mesaj gönderin
              </Text>
            </View>
          }
        />
      </View>

      {/* Offer Input */}
      {showOfferInput && (
        <View style={styles.offerContainer}>
          <View style={styles.offerInputContainer}>
            <TextInput
              style={styles.offerInput}
              value={offerAmount}
              onChangeText={setOfferAmount}
              placeholder="Teklif miktarı"
              keyboardType="numeric"
            />
            <Text style={styles.currencyText}>₺</Text>
          </View>
          <TouchableOpacity
            style={styles.sendOfferButton}
            onPress={handleSendOffer}
            disabled={isLoading}
          >
            <Text style={styles.sendOfferButtonText}>Gönder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelOfferButton}
            onPress={() => setShowOfferInput(false)}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.offerButton}
            onPress={() => setShowOfferInput(!showOfferInput)}
          >
            <Ionicons name="pricetag" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Mesaj yazın..."
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={isLoading || !newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? '#007AFF' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerButton: {
    padding: 8,
  },
  listingHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listingTitle: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  offerBubble: {
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  offerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  offerText: {
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
  },
  myMessageTime: {
    color: '#666',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999',
    textAlign: 'left',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  offerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  offerInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  offerInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  currencyText: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 12,
  },
  sendOfferButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendOfferButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelOfferButton: {
    padding: 8,
  },
  inputContainer: {
    backgroundColor: 'white',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  offerButton: {
    padding: 8,
    marginRight: 8,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;