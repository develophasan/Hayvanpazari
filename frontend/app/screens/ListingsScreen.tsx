import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: {
    city: string;
    district: string;
  };
  category: string;
  status: string;
  views: number;
  created_at: string;
}

interface Props {
  navigation: any;
}

const ListingsScreen: React.FC<Props> = ({ navigation }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user?.user_type === 'seller' || user?.user_type === 'both') {
      loadUserListings();
    }
  }, [user]);

  const loadUserListings = async () => {
    if (!user || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/listings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data);
      } else {
        Alert.alert('Hata', 'İlanlar yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error loading user listings:', error);
      Alert.alert('Hata', 'Ağ hatası');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    console.log('🗑️ handleDeleteListing called for:', listingId);
    Alert.alert(
      'İlanı Sil',
      'Bu ilanı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ User confirmed delete for listing:', listingId);
            try {
              console.log('🔥 Sending DELETE request to:', `${API_BASE_URL}/api/listings/${listingId}`);
              const response = await fetch(`${API_BASE_URL}/api/listings/${listingId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              console.log('🔥 Delete response:', response.status, response.statusText);
              if (response.ok) {
                console.log('✅ Listing deleted successfully');
                setListings(listings.filter(listing => listing.id !== listingId));
                Alert.alert('Başarılı', 'İlan silindi');
              } else {
                const errorText = await response.text();
                console.error('❌ Delete failed:', errorText);
                Alert.alert('Hata', 'İlan silinirken bir hata oluştu');
              }
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Hata', 'Ağ hatası');
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'sold': return 'Satıldı';
      case 'inactive': return 'Pasif';
      case 'pending': return 'Onay Bekliyor';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'sold': return '#9E9E9E';
      case 'inactive': return '#FF9800';
      case 'pending': return '#2196F3';
      default: return '#666';
    }
  };

  const handleBecomeSeller = async () => {
    if (!user || !token) return;

    Alert.alert(
      'Satıcı Ol',
      'Satıcı olmak için profil tipiniz değiştirilecek. Onaylıyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              const formData = new FormData();
              formData.append('user_type', 'both');

              const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                body: formData,
              });

              if (response.ok) {
                // Update local user state
                navigation.navigate('Profile');
                Alert.alert('Başarılı', 'Artık ilan verebilirsiniz!');
              } else {
                Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
              }
            } catch (error) {
              console.error('Error updating profile:', error);
              Alert.alert('Hata', 'Ağ hatası');
            }
          }
        }
      ]
    );
  };

  const renderListingItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
    >
      <View style={styles.listingImageContainer}>
        {item.images.length > 0 ? (
          <Image 
            source={{ uri: `data:image/jpeg;base64,${item.images[0]}` }}
            style={styles.listingImage}
          />
        ) : (
          <View style={styles.listingNoImage}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
          </View>
        )}
      </View>
      
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.listingPrice}>
          {formatPrice(item.price)}
        </Text>
        <Text style={styles.listingLocation}>
          {item.location.city}, {item.location.district}
        </Text>
        <View style={styles.listingStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.views} görüntüleme</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.listingActions}>
        {Platform.OS === 'web' ? (
          <>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#007AFF20',
                border: '1px solid #007AFF40',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('✏️ Web edit button clicked for listing:', item.id, item.title);
                navigation.navigate('CreateListing', { editListing: item });
              }}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </button>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#FF3B3020',
                border: '1px solid #FF3B3040',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ Web delete button clicked for listing:', item.id, item.title);
                handleDeleteListing(item.id);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </button>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('✏️ Mobile edit button pressed for listing:', item.id, item.title);
                navigation.navigate('CreateListing', { editListing: item });
              }}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('🗑️ Mobile delete button pressed for listing:', item.id, item.title);
                handleDeleteListing(item.id);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Giriş yapmanız gerekiyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (user.user_type === 'buyer') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>İlanlarım</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Henüz satıcı değilsiniz</Text>
          <Text style={styles.emptySubtext}>
            İlan verebilmek için satıcı olmanız gerekiyor
          </Text>
          <TouchableOpacity 
            style={styles.becomeSellerButton}
            onPress={handleBecomeSeller}
          >
            <Text style={styles.becomeSellerButtonText}>Satıcı Ol</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>İlanlarım</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateListing')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.listingsContainer}>
        <FlashList
          data={listings}
          renderItem={renderListingItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={120}
          onRefresh={loadUserListings}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Henüz ilan vermediniz</Text>
              <Text style={styles.emptySubtext}>
                İlk ilanınızı oluşturun ve satışa başlayın
              </Text>
              <TouchableOpacity 
                style={styles.createListingButton}
                onPress={() => navigation.navigate('CreateListing')}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.createListingButtonText}>İlan Oluştur</Text>
              </TouchableOpacity>
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
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingsContainer: {
    flex: 1,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listingImageContainer: {
    marginRight: 12,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  listingNoImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  listingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  listingActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginVertical: 4,
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
  becomeSellerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  becomeSellerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createListingButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  createListingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ListingsScreen;