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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, ComponentStyles } from '../styles/designSystem';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25; // 25% of screen width
const DELETE_THRESHOLD = screenWidth * 0.5; // 50% for delete

interface Notification {
  id: string;
  user_id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  data: any;
  status: string;
  is_email_sent: boolean;
  is_push_sent: boolean;
  created_at: string;
  read_at?: string;
}

interface Props {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (notification: Notification) => void;
  formatTimeAgo: (dateString: string) => string;
  getNotificationIcon: (type: string, priority: string) => string;
  getPriorityColor: (priority: string) => string;
}

const SwipeableNotificationCard: React.FC<Props> = ({
  notification,
  onRead,
  onDelete,
  formatTimeAgo,
  getNotificationIcon,
  getPriorityColor,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderGrant: () => {
        // Haptic feedback on start
        if (Platform.OS === 'ios') {
          // Could add haptic feedback here
        }
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          const clampedDx = Math.max(gestureState.dx, -screenWidth * 0.8);
          translateX.setValue(clampedDx);
          
          // Scale effect as user swipes more
          const progress = Math.abs(clampedDx) / DELETE_THRESHOLD;
          const newScale = 1 - (progress * 0.1);
          scale.setValue(Math.max(newScale, 0.9));
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
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const deleteWithAnimation = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -screenWidth,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDelete(notification);
    });
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCardPress = () => {
    // If card is swiped, reset position
    if (translateX._value < -10) {
      resetPosition();
    } else {
      // Mark as read
      onRead(notification.id);
    }
  };

  return (
    <View style={styles.container}>
      {/* Delete Background */}
      <View style={styles.deleteBackground}>
        <Animated.View 
          style={[
            styles.deleteAction,
            {
              opacity: translateX.interpolate({
                inputRange: [-DELETE_THRESHOLD, -SWIPE_THRESHOLD, 0],
                outputRange: [1, 0.7, 0],
                extrapolate: 'clamp',
              }),
            }
          ]}
        >
          <Ionicons name="trash" size={24} color={Colors.textWhite} />
          <Text style={styles.deleteText}>Sil</Text>
        </Animated.View>
      </View>

      {/* Swipeable Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX },
              { scale },
            ],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.notificationCard,
            notification.status === 'unread' && styles.unreadCard
          ]}
          onPress={handleCardPress}
          activeOpacity={0.7}
        >
          <View style={styles.notificationLeft}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: getPriorityColor(notification.priority) + '20' }
            ]}>
              <Ionicons
                name={getNotificationIcon(notification.type, notification.priority) as any}
                size={24}
                color={getPriorityColor(notification.priority)}
              />
            </View>
          </View>
          
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationTime}>
                {formatTimeAgo(notification.created_at)}
              </Text>
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={3}>
              {notification.message}
            </Text>
            
            {notification.status === 'unread' && (
              <View style={styles.unreadIndicator} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Web-specific Delete Button */}
      {Platform.OS === 'web' && (
        <TouchableOpacity
          style={styles.webDeleteButton}
          onPress={() => onDelete(notification)}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 120,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginTop: 4,
    fontFamily: Typography.fontFamily.display,
  },
  cardContainer: {
    width: '100%',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...ComponentStyles.card,
    borderLeftWidth: 0,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.backgroundWhite,
  },
  notificationLeft: {
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
    fontFamily: Typography.fontFamily.display,
  },
  notificationTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.subtleLight,
    fontFamily: Typography.fontFamily.display,
  },
  notificationMessage: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.snug,
    fontFamily: Typography.fontFamily.display,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  webDeleteButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});

export default SwipeableNotificationCard;