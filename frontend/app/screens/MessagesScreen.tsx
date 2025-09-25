import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import SwipeableConversationCard from '../components/SwipeableConversationCard';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Conversation {
  _id: string;
  last_message: {
    id: string;
    message: string;
    created_at: string;
    sender_id: string;
    listing_id: string;
  };
  unread_count: number;
  other_user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  listing: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

interface Props {
  navigation: any;
}

const MessagesScreen: React.FC<Props> = ({ navigation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      loadConversations();
    }
  }, [user, token]);

  const loadConversations = async () => {
    if (!user || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        Alert.alert('Hata', 'Sohbetler yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Hata', 'Ağ hatası');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} gün önce`;
    } else if (diffHours > 0) {
      return `${diffHours} saat önce`;
    } else {
      return 'Az önce';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const deleteConversation = async (conversation: Conversation) => {
    if (!token) return;

    try {
      console.log('💬 Deleting conversation:', conversation._id);
      
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversation._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✅ Conversation deleted successfully');
        // Remove from local state
        setConversations(prev => prev.filter(c => c._id !== conversation._id));
        Alert.alert('✅ Başarılı', 'Konuşma silindi');
      } else {
        console.error('❌ Failed to delete conversation:', response.status);
        Alert.alert('❌ Hata', 'Konuşma silinemedi');
      }
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      Alert.alert('❌ Hata', 'Ağ hatası');
    }
  };

  const confirmDeleteConversation = (conversation: Conversation) => {
    Alert.alert(
      'Konuşmayı Sil',
      `${conversation.other_user.first_name} ${conversation.other_user.last_name} ile olan konuşmayı silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => deleteConversation(conversation)
        }
      ]
    );
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      otherUserId: conversation.other_user.id,
      listingId: conversation.last_message.listing_id,
      otherUserName: `${conversation.other_user.first_name} ${conversation.other_user.last_name}`,
      listingTitle: conversation.listing.title,
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <SwipeableConversationCard
      conversation={item}
      onPress={handleConversationPress}
      onDelete={confirmDeleteConversation}
      formatTime={formatTime}
    />
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mesajlar</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Giriş yapmanız gerekiyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
      </View>

      <View style={styles.conversationsContainer}>
        <FlashList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item._id}
          estimatedItemSize={80}
          onRefresh={loadConversations}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Henüz mesajınız yok</Text>
              <Text style={styles.emptySubtext}>
                İlanlarla ilgili sohbet etmeye başlayın
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  conversationsContainer: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  listingTitle: {
    fontSize: 13,
    color: '#007AFF',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#333',
  },
  priceText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listingImageContainer: {
    marginLeft: 12,
  },
  listingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  listingImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MessagesScreen;