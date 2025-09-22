import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { CITIES, getDistrictsByCity } from '../data/turkeyData';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Category {
  id: string;
  name: string;
  icon: string;
  breeds: string[];
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
  animal_details: {
    breed?: string;
    age_months?: number;
    gender?: string;
  };
  created_at: string;
}

interface SearchFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  city?: string;
  district?: string;
  breed?: string;
  gender?: string;
}

interface Props {
  navigation: any;
  route: any;
}

const SearchScreen: React.FC<Props> = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const turkishCities = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
    'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
    'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
    'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
    'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
    'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale',
    'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
    'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye',
    'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak',
    'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
  ];

  useEffect(() => {
    loadCategories();
    if (route.params?.category) {
      setFilters({ category: route.params.category });
    }
  }, [route.params]);

  useEffect(() => {
    searchListings();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const searchListings = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery);
      }
      if (filters.category) {
        queryParams.append('category', filters.category);
      }
      if (filters.city) {
        queryParams.append('city', filters.city);
      }
      if (filters.district) {
        queryParams.append('district', filters.district);
      }
      if (filters.min_price) {
        queryParams.append('min_price', filters.min_price.toString());
      }
      if (filters.max_price) {
        queryParams.append('max_price', filters.max_price.toString());
      }

      const response = await fetch(`${API_BASE_URL}/api/listings?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (error) {
      console.error('Error searching listings:', error);
      Alert.alert('Hata', 'Arama yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    searchListings();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
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

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === filters.category);
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
        <View style={styles.listingDetails}>
          {item.animal_details.breed && (
            <Text style={styles.listingDetail}>
              {item.animal_details.breed}
            </Text>
          )}
          {item.animal_details.age_months && (
            <Text style={styles.listingDetail}>
              • {item.animal_details.age_months} ay
            </Text>
          )}
          {item.animal_details.gender && (
            <Text style={styles.listingDetail}>
              • {item.animal_details.gender === 'male' ? 'Erkek' : 'Dişi'}
            </Text>
          )}
        </View>
        <Text style={styles.listingLocation}>
          {item.location.city}, {item.location.district}
        </Text>
        <Text style={styles.listingTime}>
          {timeAgo(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Hayvan ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Active filters */}
      {(filters.category || filters.city || filters.min_price || filters.max_price) && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersContainer}>
              {filters.category && (
                <View style={styles.filterTag}>
                  <Text style={styles.filterTagText}>
                    {categories.find(cat => cat.id === filters.category)?.name || filters.category}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setFilters(prev => ({ ...prev, category: undefined }))}
                  >
                    <Ionicons name="close" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.city && (
                <View style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{filters.city}</Text>
                  <TouchableOpacity 
                    onPress={() => setFilters(prev => ({ ...prev, city: undefined, district: undefined }))}
                  >
                    <Ionicons name="close" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.district && (
                <View style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{filters.district}</Text>
                  <TouchableOpacity 
                    onPress={() => setFilters(prev => ({ ...prev, district: undefined }))}
                  >
                    <Ionicons name="close" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              )}
              {(filters.min_price || filters.max_price) && (
                <View style={styles.filterTag}>
                  <Text style={styles.filterTagText}>
                    {filters.min_price || 0}₺ - {filters.max_price || '∞'}₺
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setFilters(prev => ({ ...prev, min_price: undefined, max_price: undefined }))}
                  >
                    <Ionicons name="close" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Temizle</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Listings */}
      <View style={styles.listingsContainer}>
        <FlashList
          data={listings}
          renderItem={renderListingItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={120}
          onRefresh={searchListings}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {isLoading ? 'Aranıyor...' : 'İlan bulunamadı'}
              </Text>
              <Text style={styles.emptySubtext}>
                Farklı filtreler deneyin
              </Text>
            </View>
          }
        />
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtreler</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.doneButton}>Tamam</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Kategori</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      filters.category === category.id && styles.categoryOptionSelected
                    ]}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      category: prev.category === category.id ? undefined : category.id
                    }))}
                  >
                    <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.categoryOptionText,
                      filters.category === category.id && styles.categoryOptionTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* City Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Şehir</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.cityContainer}>
                  {CITIES.slice(0, 20).map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.cityOption,
                        filters.city === city && styles.cityOptionSelected
                      ]}
                      onPress={() => setFilters(prev => ({
                        ...prev,
                        city: prev.city === city ? undefined : city,
                        district: prev.city === city ? prev.district : undefined
                      }))}
                    >
                      <Text style={[
                        styles.cityOptionText,
                        filters.city === city && styles.cityOptionTextSelected
                      ]}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* District Filter */}
            {filters.city && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>İlçe</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.cityContainer}>
                    {getDistrictsByCity(filters.city).slice(0, 15).map((district) => (
                      <TouchableOpacity
                        key={district}
                        style={[
                          styles.cityOption,
                          filters.district === district && styles.cityOptionSelected
                        ]}
                        onPress={() => setFilters(prev => ({
                          ...prev,
                          district: prev.district === district ? undefined : district
                        }))}
                      >
                        <Text style={[
                          styles.cityOptionText,
                          filters.district === district && styles.cityOptionTextSelected
                        ]}>
                          {district}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Price Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Fiyat Aralığı</Text>
              <View style={styles.priceContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min fiyat"
                  keyboardType="numeric"
                  value={filters.min_price?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({
                    ...prev,
                    min_price: text ? parseInt(text) : undefined
                  }))}
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max fiyat"
                  keyboardType="numeric"
                  value={filters.max_price?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({
                    ...prev,
                    max_price: text ? parseInt(text) : undefined
                  }))}
                />
              </View>
            </View>

            {/* Breed Filter */}
            {filters.category && getSelectedCategory() && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Irk</Text>
                <View style={styles.breedContainer}>
                  {getSelectedCategory()!.breeds.map((breed) => (
                    <TouchableOpacity
                      key={breed}
                      style={[
                        styles.breedOption,
                        filters.breed === breed && styles.breedOptionSelected
                      ]}
                      onPress={() => setFilters(prev => ({
                        ...prev,
                        breed: prev.breed === breed ? undefined : breed
                      }))}
                    >
                      <Text style={[
                        styles.breedOptionText,
                        filters.breed === breed && styles.breedOptionTextSelected
                      ]}>
                        {breed}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
  },
  activeFilters: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterTagText: {
    fontSize: 12,
    color: '#007AFF',
    marginRight: 4,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffebee',
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#d32f2f',
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
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  listingNoImage: {
    width: 100,
    height: 100,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  listingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  listingDetail: {
    fontSize: 12,
    color: '#666',
  },
  listingLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  listingTime: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  doneButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    margin: 4,
    minWidth: 80,
  },
  categoryOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryOptionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  categoryOptionTextSelected: {
    color: 'white',
  },
  cityContainer: {
    flexDirection: 'row',
  },
  cityOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  cityOptionSelected: {
    backgroundColor: '#007AFF',
  },
  cityOptionText: {
    fontSize: 14,
    color: '#333',
  },
  cityOptionTextSelected: {
    color: 'white',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#666',
  },
  breedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  breedOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    margin: 4,
  },
  breedOptionSelected: {
    backgroundColor: '#007AFF',
  },
  breedOptionText: {
    fontSize: 14,
    color: '#333',
  },
  breedOptionTextSelected: {
    color: 'white',
  },
});

export default SearchScreen;