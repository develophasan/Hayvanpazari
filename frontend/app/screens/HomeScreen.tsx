import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Colors, Typography, Spacing, BorderRadius, Shadows, ComponentStyles } from '../styles/designSystem';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

console.log('🏠 HomeScreen API_BASE_URL:', API_BASE_URL);

interface Category {
  id: string;
  name: string;
  icon: string;
}

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
  created_at: string;
}

interface Props {
  navigation: any;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  console.log('🏠 HomeScreen component rendering');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const nav = useNavigation();

  // BYPASS useEffect - direct data fetch on component mount
  const [dataLoaded, setDataLoaded] = useState(false);
  
  console.log('🏠 HomeScreen state:', { 
    categories: categories.length, 
    recentListings: recentListings.length,
    dataLoaded 
  });

  // Load data immediately if not loaded
  if (!dataLoaded && API_BASE_URL) {
    console.log('🏠 Starting immediate data load...');
    setDataLoaded(true);
    
    // Use setTimeout to avoid state update during render
    setTimeout(async () => {
      try {
        console.log('⏰ Timeout triggered - loading data');
        
        // Load categories
        console.log('📂 Fetching categories from:', `${API_BASE_URL}/api/categories`);
        const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
        console.log('📂 Categories response status:', categoriesResponse.status);
        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          console.log('📂 Categories loaded:', categoriesData.length);
          setCategories(categoriesData);
        }

        // Load recent listings
        console.log('📋 Fetching listings from:', `${API_BASE_URL}/api/listings?limit=10`);
        const listingsResponse = await fetch(`${API_BASE_URL}/api/listings?limit=10`);
        console.log('📋 Listings response status:', listingsResponse.status);
        
        if (listingsResponse.ok) {
          const listingsData = await listingsResponse.json();
          console.log('📋 Listings loaded:', listingsData.length);
          console.log('📋 First listing:', listingsData[0]?.title);
          setRecentListings(listingsData);
          setFeaturedListings(listingsData.slice(0, 3));
        }
      } catch (error) {
        console.error('❌ Data load error:', error);
      }
    }, 100);
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🏠 HomeScreen loadData started, API_BASE_URL:', API_BASE_URL);
      
      // Load categories
      console.log('📂 Fetching categories...');
      const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
      console.log('📂 Categories response status:', categoriesResponse.status);
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        console.log('📂 Categories data:', categoriesData.length, 'categories loaded');
        setCategories(categoriesData);
      }

      // Load recent listings
      console.log('📋 Fetching listings...');
      const listingsResponse = await fetch(`${API_BASE_URL}/api/listings?limit=10`);
      console.log('📋 Listings response status:', listingsResponse.status);
      
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json();
        console.log('📋 Listings data:', listingsData.length, 'listings loaded');
        console.log('📋 First listing title:', listingsData[0]?.title);
        setRecentListings(listingsData);
        // Use first 3 as featured
        setFeaturedListings(listingsData.slice(0, 3));
      }
    } catch (error) {
      console.error('❌ HomeScreen loadData error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToSearch = (category?: string) => {
    navigation.navigate('Search', { category });
  };

  const navigateToListing = (listing: Listing) => {
    navigation.navigate('ListingDetail', { listingId: listing.id });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const timeAgo = (dateString: string) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba{user?.first_name ? `, ${user.first_name}` : ''}!</Text>
            <Text style={styles.subtitle}>Hayvan pazarında neler var?</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => navigateToSearch()}
        >
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchPlaceholder}>Hangi hayvanı arıyorsun?</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => navigateToSearch(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Featured Listings */}
        {featuredListings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Öne Çıkan İlanlar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.featuredContainer}>
                {featuredListings.map((listing) => (
                  <TouchableOpacity
                    key={listing.id}
                    style={styles.featuredCard}
                    onPress={() => navigateToListing(listing)}
                  >
                    {listing.images.length > 0 ? (
                      <Image 
                        source={{ uri: `data:image/jpeg;base64,${listing.images[0]}` }}
                        style={styles.featuredImage}
                      />
                    ) : (
                      <View style={styles.noImageContainer}>
                        <Ionicons name="image-outline" size={40} color="#ccc" />
                      </View>
                    )}
                    <View style={styles.featuredInfo}>
                      <Text 
                        style={[styles.featuredTitle, { cursor: 'pointer' }]} 
                        numberOfLines={2}
                        onClick={() => {
                          console.log('🎯 Text element clicked:', listing.id);
                          navigateToListing(listing);
                        }}
                      >
                        {listing.title}
                      </Text>
                      <Text style={styles.featuredPrice}>
                        {formatPrice(listing.price)}
                      </Text>
                      <Text style={styles.featuredLocation}>
                        {listing.location.city}, {listing.location.district}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Recent Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son İlanlar</Text>
            <TouchableOpacity onPress={() => navigateToSearch()}>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          {recentListings.map((listing) => {
            if (Platform.OS === 'web') {
              return (
                <View
                  key={listing.id}
                  style={styles.listingCard}
                  onClick={() => {
                    console.log('🎯 Web listing card clicked:', listing.id);
                    navigateToListing(listing);
                  }}
                >
                  {listing.images.length > 0 ? (
                    <Image 
                      source={{ uri: `data:image/jpeg;base64,${listing.images[0]}` }}
                      style={styles.listingImage}
                    />
                  ) : (
                    <View style={styles.listingNoImage}>
                      <Ionicons name="image-outline" size={24} color="#ccc" />
                    </View>
                  )}
                  
                  <View style={styles.listingInfo}>
                    <Text 
                      style={[styles.listingTitle, { cursor: 'pointer' }]} 
                      numberOfLines={1}
                      onClick={() => {
                        console.log('🎯 Recent listing text clicked:', listing.id);
                        navigateToListing(listing);
                      }}
                    >
                      {listing.title}
                    </Text>
                    <Text style={styles.listingPrice}>
                      {formatPrice(listing.price)}
                    </Text>
                    <Text style={styles.listingLocation}>
                      {listing.location.city}, {listing.location.district}
                    </Text>
                    <Text style={styles.listingTime}>
                      {timeAgo(listing.created_at)}
                    </Text>
                  </View>
                  
                  <View style={styles.listingActions}>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
                </View>
              );
            } else {
              return (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.listingCard}
                  onPress={() => navigateToListing(listing)}
                >
                  {listing.images.length > 0 ? (
                    <Image 
                      source={{ uri: `data:image/jpeg;base64,${listing.images[0]}` }}
                      style={styles.listingImage}
                    />
                  ) : (
                    <View style={styles.listingNoImage}>
                      <Ionicons name="image-outline" size={24} color="#ccc" />
                    </View>
                  )}
                  
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle} numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text style={styles.listingPrice}>
                      {formatPrice(listing.price)}
                    </Text>
                    <Text style={styles.listingLocation}>
                      {listing.location.city}, {listing.location.district}
                    </Text>
                    <Text style={styles.listingTime}>
                      {timeAgo(listing.created_at)}
                    </Text>
                  </View>
                  
                  <View style={styles.listingActions}>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              );
            }
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {Platform.OS === 'web' ? (
            <View
              style={{
                backgroundColor: '#007AFF',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onTouchEnd={() => {
                console.log('🎯 İlan Ver web onTouchEnd triggered!');
                navigation.navigate('CreateListing');
              }}
              onClick={() => {
                console.log('🎯 İlan Ver web onClick triggered!');
                navigation.navigate('CreateListing');
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24, color: 'white' }}>+</Text>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  İlan Ver
                </Text>
              </View>
            </View>
          ) : (
            <Pressable 
              style={({ pressed }) => [
                styles.quickActionButton,
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => {
                console.log('🎯 İlan Ver native button clicked!');
                navigation.navigate('CreateListing');
              }}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.quickActionText}>İlan Ver</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notificationButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  featuredContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  featuredCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 16,
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featuredImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  noImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredInfo: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  featuredLocation: {
    fontSize: 12,
    color: '#666',
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
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
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  listingLocation: {
    fontSize: 12,
    color: '#666',
  },
  listingTime: {
    fontSize: 11,
    color: '#999',
  },
  listingActions: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActionButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeScreen;