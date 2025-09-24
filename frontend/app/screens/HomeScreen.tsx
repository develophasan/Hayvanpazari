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
        {/* Header - New Design */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Merhaba{user?.first_name ? `, ${user.first_name}` : ''}!</Text>
            <Text style={styles.subtitle}>Hayvan pazarında neler var?</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            {Platform.OS === 'web' ? (
              <View
                style={styles.addListingButtonWeb}
                onClick={() => {
                  console.log('🎯 İlan Ver header button clicked!');
                  navigation.navigate('CreateListing');
                }}
              >
                <Ionicons name="add" size={20} color={Colors.textWhite} />
                <Text style={styles.addListingButtonText}>İlan Ver</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addListingButton}
                onPress={() => {
                  console.log('🎯 İlan Ver header button pressed!');
                  navigation.navigate('CreateListing');
                }}
              >
                <Ionicons name="add" size={20} color={Colors.textWhite} />
                <Text style={styles.addListingButtonText}>İlan Ver</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories - Updated Design */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => navigateToSearch(category.id)}
              >
                <View style={styles.categoryIconContainer}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>12 ilan</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Listings - Updated Design */}
        {featuredListings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Öne Çıkan İlanlar</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScrollContainer}
            >
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
                      <Ionicons name="image-outline" size={40} color={Colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
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
            </ScrollView>
          </View>
        )}

        {/* Recent Listings - Updated Design */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son İlanlar</Text>
            <TouchableOpacity onPress={() => navigateToSearch()}>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentListingsContainer}>
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
                        <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
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
                      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
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
                        <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
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
                      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  
  // Header Styles - New Design
  header: {
    ...ComponentStyles.header,
    backgroundColor: Colors.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.display,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Typography.fontFamily.display,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addListingButton: {
    ...ComponentStyles.button.primaryButton,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  addListingButtonWeb: {
    ...ComponentStyles.button.primaryButton,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    cursor: 'pointer' as any,
  },
  addListingButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    fontFamily: Typography.fontFamily.display,
  },

  // Section Styles
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...ComponentStyles.sectionTitle,
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.fontFamily.display,
  },
  seeAllText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
    fontFamily: Typography.fontFamily.display,
  },

  // Categories - Updated Design
  categoriesScrollContainer: {
    paddingHorizontal: Spacing.md,
  },
  categoryCard: {
    ...ComponentStyles.categoryCard,
    backgroundColor: Colors.backgroundWhite,
    ...Shadows.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  categoryIconContainer: {
    ...ComponentStyles.categoryIcon,
    backgroundColor: Colors.backgroundLight,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.display,
  },
  categoryCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: Typography.fontFamily.display,
  },

  // Featured Listings - Updated Design
  featuredScrollContainer: {
    paddingHorizontal: Spacing.md,
  },
  featuredCard: {
    ...ComponentStyles.listingCard,
    width: width * 0.75,
    backgroundColor: Colors.backgroundWhite,
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  noImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.backgroundLight,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredInfo: {
    padding: Spacing.md,
  },
  featuredTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.display,
  },
  featuredPrice: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.display,
  },
  featuredLocation: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.display,
  },

  // Recent Listings - Updated Design
  recentListingsContainer: {
    paddingHorizontal: Spacing.md,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
    alignItems: 'center',
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
  },
  listingNoImage: {
    width: 80,
    height: 80,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  listingTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.display,
  },
  listingPrice: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.display,
  },
  listingLocation: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontFamily: Typography.fontFamily.display,
  },
  listingTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.subtleLight,
    fontFamily: Typography.fontFamily.display,
  },
  listingActions: {
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
  },
});

export default HomeScreen;