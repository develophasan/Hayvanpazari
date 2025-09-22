import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface AnimalDetails {
  breed?: string;
  age_months?: number;
  weight_kg?: number;
  gender?: string;
  purpose?: string;
  pregnancy_status?: string;
  milk_yield?: number;
  health_status: string;
  vaccinations: string[];
  certificates: string[];
  ear_tag?: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  animal_details: AnimalDetails;
  price: number;
  price_type: string;
  images: string[];
  videos: string[];
  location: {
    city: string;
    district: string;
  };
  seller_id: string;
  status: string;
  views: number;
  favorites: number;
  created_at: string;
}

interface Seller {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  rating: number;
  total_reviews: number;
  location?: {
    city: string;
    district: string;
  };
}

interface Props {
  navigation: any;
  route: any;
}

const ListingDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { listingId } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadListingDetails();
  }, [listingId]);

  const loadListingDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/${listingId}`);
      if (response.ok) {
        const listingData = await response.json();
        setListing(listingData);
        
        // Load seller details
        const sellerResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${listingData.seller_id}`, // This is wrong but we'll fix later
          },
        });
        // For now, create mock seller data
        setSeller({
          id: listingData.seller_id,
          first_name: 'Satıcı',
          last_name: 'Kullanıcı',
          rating: 4.5,
          total_reviews: 12,
          location: listingData.location,
        });
      } else {
        Alert.alert('Hata', 'İlan yüklenirken bir hata oluştu');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading listing details:', error);
      Alert.alert('Hata', 'Ağ hatası');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Satıcı ile iletişim kurmak için giriş yapmanız gerekiyor');
      return;
    }

    if (!listing || !seller) return;

    navigation.navigate('Chat', {
      otherUserId: seller.id,
      listingId: listing.id,
      otherUserName: `${seller.first_name} ${seller.last_name}`,
      listingTitle: listing.title,
    });
  };

  const handleCall = () => {
    // In a real app, you'd have the seller's phone number
    Alert.alert('Arama', 'Satıcının telefon numarası gizlidir. Lütfen mesaj gönderin.');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getGenderText = (gender?: string) => {
    switch (gender) {
      case 'male': return 'Erkek';
      case 'female': return 'Dişi';
      default: return 'Belirtilmemiş';
    }
  };

  const getPurposeText = (purpose?: string) => {
    switch (purpose) {
      case 'meat': return 'Et';
      case 'dairy': return 'Süt';
      case 'breeding': return 'Damızlık';
      default: return 'Belirtilmemiş';
    }
  };

  const getPregnancyText = (status?: string) => {
    switch (status) {
      case 'pregnant': return 'Gebe';
      case 'not_pregnant': return 'Gebe Değil';
      default: return 'Belirtilmemiş';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>İlan bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {listing.images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
                }}
              >
                {listing.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: `data:image/jpeg;base64,${image}` }}
                    style={styles.listingImage}
                  />
                ))}
              </ScrollView>
              {listing.images.length > 1 && (
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {currentImageIndex + 1} / {listing.images.length}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={64} color="#ccc" />
              <Text style={styles.noImageText}>Fotoğraf yok</Text>
            </View>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.location}>
              {listing.location.city}, {listing.location.district}
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.statText}>{listing.views} görüntüleme</Text>
            </View>
            <Text style={styles.statSeparator}>•</Text>
            <Text style={styles.timeText}>
              {new Date(listing.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        </View>

        {/* Animal Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Hayvan Detayları</Text>
          
          <View style={styles.detailsGrid}>
            {listing.animal_details.breed && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Irk</Text>
                <Text style={styles.detailValue}>{listing.animal_details.breed}</Text>
              </View>
            )}
            
            {listing.animal_details.age_months && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Yaş</Text>
                <Text style={styles.detailValue}>{listing.animal_details.age_months} ay</Text>
              </View>
            )}
            
            {listing.animal_details.weight_kg && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Ağırlık</Text>
                <Text style={styles.detailValue}>{listing.animal_details.weight_kg} kg</Text>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cinsiyet</Text>
              <Text style={styles.detailValue}>
                {getGenderText(listing.animal_details.gender)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amaç</Text>
              <Text style={styles.detailValue}>
                {getPurposeText(listing.animal_details.purpose)}
              </Text>
            </View>
            
            {listing.animal_details.pregnancy_status && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Gebelik</Text>
                <Text style={styles.detailValue}>
                  {getPregnancyText(listing.animal_details.pregnancy_status)}
                </Text>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Sağlık</Text>
              <Text style={styles.detailValue}>{listing.animal_details.health_status}</Text>
            </View>
            
            {listing.animal_details.ear_tag && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Küpe No</Text>
                <Text style={styles.detailValue}>{listing.animal_details.ear_tag}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Açıklama</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        {/* Seller Info */}
        {seller && (
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Satıcı</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                {seller.profile_image ? (
                  <Image 
                    source={{ uri: `data:image/jpeg;base64,${seller.profile_image}` }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={24} color="#666" />
                  </View>
                )}
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>
                  {seller.first_name} {seller.last_name}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.rating}>
                    {seller.rating.toFixed(1)} ({seller.total_reviews} değerlendirme)
                  </Text>
                </View>
                {seller.location && (
                  <Text style={styles.sellerLocation}>
                    {seller.location.city}, {seller.location.district}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="white" />
          <Text style={styles.callButtonText}>Ara</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.messageButton} 
          onPress={handleContactSeller}
        >
          <Ionicons name="chatbubble" size={20} color="white" />
          <Text style={styles.messageButtonText}>Mesaj Gönder</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    height: 300,
    backgroundColor: 'white',
    position: 'relative',
  },
  listingImage: {
    width: width,
    height: 300,
  },
  noImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  noImageText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  statSeparator: {
    fontSize: 14,
    color: '#ccc',
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  descriptionSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  sellerSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 80, // Space for action bar
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  sellerLocation: {
    fontSize: 14,
    color: '#666',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  callButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default ListingDetailScreen;