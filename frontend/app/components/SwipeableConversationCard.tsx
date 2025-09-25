import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;
const DELETE_THRESHOLD = screenWidth * 0.5;

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
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
  onDelete: (conversation: Conversation) => void;
  formatTime: (dateString: string) => string;
}

const SwipeableConversationCard: React.FC<Props> = ({
  conversation,
  onPress,
  onDelete,
  formatTime,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe
        if (gestureState.dx < 0) {
          const clampedDx = Math.max(gestureState.dx, -screenWidth * 0.8);
          translateX.setValue(clampedDx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeDistance = Math.abs(gestureState.dx);
        
        if (swipeDistance > DELETE_THRESHOLD) {
          // Delete with animation
          deleteWithAnimation();
        } else if (swipeDistance > SWIPE_THRESHOLD) {
          // Show delete option
          Animated.spring(translateX, {
            toValue: -120,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const deleteWithAnimation = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -screenWidth,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDelete(conversation);
    });
  };

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (translateX._value < -10) {
      resetPosition();
    } else {
      onPress(conversation);
    }
  };

  return (
    <View style={styles.container}>
      {/* Delete Background */}
      <View style={styles.deleteBackground}>
        <View style={styles.deleteAction}>
          <Ionicons name="trash" size={24} color="#ffffff" />
          <Text style={styles.deleteText}>Sil</Text>
        </View>
      </View>

      {/* Swipeable Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ translateX }],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.conversationCard}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {conversation.other_user.profile_image ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${conversation.other_user.profile_image}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.avatarText}>
                  {conversation.other_user.first_name[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            {conversation.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.header}>
              <Text style={styles.userName}>
                {conversation.other_user.first_name} {conversation.other_user.last_name}
              </Text>
              <Text style={styles.time}>
                {formatTime(conversation.last_message.created_at)}
              </Text>
            </View>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {conversation.last_message.message}
            </Text>
            <Text style={styles.listingTitle} numberOfLines={1}>
              📋 {conversation.listing.title}
            </Text>
          </View>

          {/* Web Delete Button */}
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.webDeleteButton}
              onPress={() => onDelete(conversation)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 1,
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 120,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  cardContainer: {
    width: '100%',
  },
  conversationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4338ca',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  listingTitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  webDeleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
});

export default SwipeableConversationCard;