import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, ComponentStyles } from '../styles/designSystem';
import { useAuth } from '../contexts/AuthContext';
import SwipeableNotificationCard from '../components/SwipeableNotificationCard';
import Constants from 'expo-constants';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
  navigation: any;
}

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [swipedNotification, setSwipedNotification] = useState<string | null>(null);
  const { user, token } = useAuth();

  const deleteNotification = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        fetchUnreadCount();
        console.log('🗑️ Notification deleted:', notificationId);
      }
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      Alert.alert('Hata', 'Bildirim silinemedi. Lütfen tekrar deneyin.');
    }
  };

  const confirmDelete = (notification: Notification) => {
    Alert.alert(
      'Bildirimi Sil',
      `"${notification.title}" bildirimini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => deleteNotification(notification.id)
        }
      ]
    );
  };

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        console.log('🔔 Notifications loaded:', data.length);
      }
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('❌ Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, status: 'read', read_at: new Date().toISOString() }
              : notification
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('❌ Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            status: 'read',
            read_at: new Date().toISOString()
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
    }
  };

  const sendTestNotification = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Test bildirimi gönderildi!');
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Şimdi';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}dk önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s önce`;
    return `${Math.floor(diffInSeconds / 86400)}g önce`;
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'message':
        return 'chatbubble';
      case 'offer':
        return 'cash';
      case 'listing':
        return 'document-text';
      case 'security':
        return 'shield-checkmark';
      case 'payment':
        return 'card';
      case 'profile':
        return 'person';
      default:
        return 'notifications';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return Colors.error;
      case 'high':
        return Colors.warning;
      case 'medium':
        return Colors.info;
      case 'low':
        return Colors.subtleLight;
      default:
        return Colors.textSecondary;
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      fetchUnreadCount();
      setLoading(false);
    }
  }, [user, token]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Bildirimler</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Tümünü Okundu Olarak İşaretle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread Count Banner */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>{unreadCount} okunmamış bildirim</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Test Button - Development only */}
        <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
          <Ionicons name="flask" size={20} color={Colors.textWhite} />
          <Text style={styles.testButtonText}>Test Bildirimi Gönder</Text>
        </TouchableOpacity>

        {notifications.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={Colors.subtleLight} />
            <Text style={styles.emptyStateTitle}>Henüz bildirim yok</Text>
            <Text style={styles.emptyStateText}>
              Yeni mesajlar, teklifler ve güncellemeler burada görünecek
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <SwipeableNotificationCard
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
              onDelete={confirmDelete}
              formatTimeAgo={formatTimeAgo}
              getNotificationIcon={getNotificationIcon}
              getPriorityColor={getPriorityColor}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  
  // Header
  header: {
    ...ComponentStyles.header,
    backgroundColor: Colors.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundLight,
  },
  title: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.display,
  },
  markAllButton: {
    padding: Spacing.xs,
  },
  markAllText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
    fontFamily: Typography.fontFamily.display,
  },

  // Unread Banner
  unreadBanner: {
    backgroundColor: Colors.primary + '10',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '20',
  },
  unreadText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.display,
  },

  // Content
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  
  // Test Button
  testButton: {
    ...ComponentStyles.button.primaryButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  testButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    fontFamily: Typography.fontFamily.display,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyStateTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.display,
  },
  emptyStateText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
    fontFamily: Typography.fontFamily.display,
  },

  // Notification Cards
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
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
});

export default NotificationsScreen;