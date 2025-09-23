import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { CITIES, getDistrictsByCity } from '../data/turkeyData';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Category {
  id: string;
  name: string;
  icon: string;
  breeds: string[];
}

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

interface ListingFormData {
  title: string;
  description: string;
  category: string;
  price: string;
  price_type: string;
  animal_details: AnimalDetails;
  location: {
    city: string;
    district: string;
  };
  images: string[];
}

interface Props {
  navigation: any;
  route: any;
}

const CreateListingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, token } = useAuth();

  // Authentication check
  useEffect(() => {
    console.log('CreateListingScreen - User:', user?.first_name, 'Token:', token ? 'Var' : 'Yok');
    if (!user || !token) {
      console.log('❌ Authentication eksik, giriş sayfasına yönlendiriliyor');
      Alert.alert('Giriş Gerekli', 'İlan vermek için giriş yapmanız gerekiyor', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    }
  }, [user, token]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    category: '',
    price: '',
    price_type: 'fixed',
    animal_details: {
      breed: '',
      age_months: undefined,
      weight_kg: undefined,
      gender: '',
      purpose: '',
      pregnancy_status: '',
      health_status: 'healthy',
      vaccinations: [],
      certificates: [],
      ear_tag: '',
    },
    location: {
      city: user?.location?.city || '',
      district: user?.location?.district || '',
    },
    images: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [showCityModal, setShowCityModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

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

  const handleImagePicker = async () => {
    if (formData.images.length >= 5) {
      Alert.alert('Limit', 'En fazla 5 fotoğraf ekleyebilirsiniz');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri izni gerekiyor');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].base64!]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    console.log('🚀 Form submit başladı!');
    console.log('📋 Form data:', {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price: formData.price,
      location: formData.location,
      images_count: formData.images.length,
      token: token ? 'Var' : 'Yok'
    });

    // Validation
    if (!formData.title.trim()) {
      console.log('❌ Validation failed: title');
      Alert.alert('Hata', 'İlan başlığı gereklidir');
      return;
    }
    if (!formData.description.trim()) {
      console.log('❌ Validation failed: description');
      Alert.alert('Hata', 'Açıklama gereklidir');
      return;
    }
    if (!formData.category) {
      console.log('❌ Validation failed: category');
      Alert.alert('Hata', 'Kategori seçilmelidir');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      console.log('❌ Validation failed: price');
      Alert.alert('Hata', 'Geçerli bir fiyat girilmelidir');
      return;
    }
    if (!formData.location.city || !formData.location.district) {
      console.log('❌ Validation failed: location');
      Alert.alert('Hata', 'Şehir ve ilçe bilgisi gereklidir');
      return;
    }

    console.log('✅ Validation passed, starting API call...');
    if (formData.images.length === 0) {
      console.log('❌ Validation failed: images');
      Alert.alert('Hata', 'En az 1 fotoğraf eklemelisiniz');
      return;
    }

    console.log('✅ Tüm validasyonlar geçti!');

    if (!token) {
      console.log('❌ Token yok! Kullanıcı giriş yapmamış');
      Alert.alert('Giriş Gerekli', 'İlan vermek için giriş yapmanız gerekiyor');
      return;
    }

    setIsLoading(true);
    try {
      const listingData = {
        ...formData,
        price: parseFloat(formData.price),
        animal_details: {
          ...formData.animal_details,
          age_months: formData.animal_details.age_months ? parseInt(formData.animal_details.age_months.toString()) : undefined,
          weight_kg: formData.animal_details.weight_kg ? parseFloat(formData.animal_details.weight_kg.toString()) : undefined,
        }
      };

      console.log('🚀 API çağrısı yapılıyor:', `${API_BASE_URL}/api/listings`);
      console.log('📤 Gönderilen data:', listingData);

      const response = await fetch(`${API_BASE_URL}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(listingData),
      });

      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ İlan başarıyla oluşturuldu:', responseData);
        Alert.alert('Başarılı', 'İlan oluşturuldu!', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorData = await response.json();
        console.log('❌ API Error:', errorData);
        Alert.alert('Hata', errorData.detail || 'İlan oluşturulamadı');
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      Alert.alert('Hata', 'Ağ hatası');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.category);
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateAnimalDetails = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      animal_details: {
        ...prev.animal_details,
        [key]: value
      }
    }));
  };

  const updateLocation = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [key]: value
      }
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotoğraflar *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesContainer}>
                {formData.images.map((image, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image 
                      source={{ uri: `data:image/jpeg;base64,${image}` }}
                      style={styles.image}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
                {formData.images.length < 5 && (
                  <TouchableOpacity 
                    style={styles.addImageButton}
                    onPress={handleImagePicker}
                  >
                    <Ionicons name="add" size={32} color="#007AFF" />
                    <Text style={styles.addImageText}>Fotoğraf Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>İlan Başlığı *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                placeholder="Örn: 2 yaşında Holstein inek"
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Kategori *</Text>
              <TouchableOpacity 
                style={styles.categoryButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  !formData.category && styles.placeholderText
                ]}>
                  {getSelectedCategory()?.name || 'Kategori seçin'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fiyat *</Text>
              <View style={styles.priceContainer}>
                <TextInput
                  style={styles.priceInput}
                  value={formData.price}
                  onChangeText={(text) => updateFormData('price', text)}
                  placeholder="0"
                  keyboardType="numeric"
                />
                <Text style={styles.currencyText}>₺</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Açıklama *</Text>
              <TextInput
                style={styles.textArea}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="Hayvanınız hakkında detaylı bilgi verin..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>
          </View>

          {/* Animal Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hayvan Detayları</Text>

            {getSelectedCategory()?.breeds && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Irk</Text>
                <TouchableOpacity 
                  style={styles.categoryButton}
                  onPress={() => setShowBreedModal(true)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    !formData.animal_details.breed && styles.placeholderText
                  ]}>
                    {formData.animal_details.breed || 'Irk seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.halfInputContainer}>
                <Text style={styles.label}>Yaş (ay)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.animal_details.age_months?.toString() || ''}
                  onChangeText={(text) => updateAnimalDetails('age_months', text ? parseInt(text) : undefined)}
                  placeholder="24"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfInputContainer}>
                <Text style={styles.label}>Ağırlık (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.animal_details.weight_kg?.toString() || ''}
                  onChangeText={(text) => updateAnimalDetails('weight_kg', text ? parseFloat(text) : undefined)}
                  placeholder="500"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInputContainer}>
                <Text style={styles.label}>Cinsiyet</Text>
                <TouchableOpacity 
                  style={styles.categoryButton}
                  onPress={() => setShowGenderModal(true)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    !formData.animal_details.gender && styles.placeholderText
                  ]}>
                    {formData.animal_details.gender === 'male' ? 'Erkek' : 
                     formData.animal_details.gender === 'female' ? 'Dişi' : 
                     'Seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.halfInputContainer}>
                <Text style={styles.label}>Amaç</Text>
                <TouchableOpacity 
                  style={styles.categoryButton}
                  onPress={() => setShowPurposeModal(true)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    !formData.animal_details.purpose && styles.placeholderText
                  ]}>
                    {formData.animal_details.purpose === 'meat' ? 'Et' :
                     formData.animal_details.purpose === 'dairy' ? 'Süt' :
                     formData.animal_details.purpose === 'breeding' ? 'Damızlık' :
                     'Seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Küpe Numarası</Text>
              <TextInput
                style={styles.input}
                value={formData.animal_details.ear_tag || ''}
                onChangeText={(text) => updateAnimalDetails('ear_tag', text)}
                placeholder="TR123456789"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lokasyon</Text>

            <View style={styles.row}>
              <View style={styles.halfInputContainer}>
                <Text style={styles.label}>Şehir *</Text>
                <TouchableOpacity 
                  style={styles.categoryButton}
                  onPress={() => setShowCityModal(true)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    !formData.location.city && styles.placeholderText
                  ]}>
                    {formData.location.city || 'Şehir seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.halfInputContainer}>
                <Text style={styles.label}>İlçe *</Text>
                <TouchableOpacity 
                  style={styles.categoryButton}
                  onPress={() => {
                    if (!formData.location.city) {
                      Alert.alert('Uyarı', 'Önce şehir seçiniz');
                      return;
                    }
                    setAvailableDistricts(getDistrictsByCity(formData.location.city));
                    setShowDistrictModal(true);
                  }}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    !formData.location.district && styles.placeholderText
                  ]}>
                    {formData.location.district || 'İlçe seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && { opacity: 0.8 }
            ]}
            onPress={() => {
              console.log('🎯 Submit button clicked!');
              handleSubmit();
            }}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'İlan Oluşturuluyor...' : 'İlanı Yayınla'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kategori Seçin</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.doneButton}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryOption}
                onPress={() => {
                  updateFormData('category', category.id);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                {formData.category === category.id && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* City Selection Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Şehir Seçin</Text>
            <TouchableOpacity onPress={() => setShowCityModal(false)}>
              <Text style={styles.doneButton}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {CITIES.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.modalOption}
                onPress={() => {
                  updateLocation('city', city);
                  updateLocation('district', ''); // Reset district when city changes
                  setShowCityModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{city}</Text>
                {formData.location.city === city && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>İlçe Seçin</Text>
            <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
              <Text style={styles.doneButton}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {availableDistricts.map((district) => (
              <TouchableOpacity
                key={district}
                style={styles.modalOption}
                onPress={() => {
                  updateLocation('district', district);
                  setShowDistrictModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{district}</Text>
                {formData.location.district === district && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Breed Selection Modal */}
      <Modal
        visible={showBreedModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Irk Seçin</Text>
            <TouchableOpacity onPress={() => setShowBreedModal(false)}>
              <Text style={styles.doneButton}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {getSelectedCategory()?.breeds.map((breed) => (
              <TouchableOpacity
                key={breed}
                style={styles.modalOption}
                onPress={() => {
                  updateAnimalDetails('breed', breed);
                  setShowBreedModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{breed}</Text>
                {formData.animal_details.breed === breed && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cinsiyet Seçin</Text>
            <TouchableOpacity onPress={() => setShowGenderModal(false)}>
              <Text style={styles.doneButton}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                updateAnimalDetails('gender', 'male');
                setShowGenderModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>Erkek</Text>
              {formData.animal_details.gender === 'male' && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                updateAnimalDetails('gender', 'female');
                setShowGenderModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>Dişi</Text>
              {formData.animal_details.gender === 'female' && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Purpose Selection Modal */}
      <Modal
        visible={showPurposeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Amaç Seçin</Text>
            <TouchableOpacity onPress={() => setShowPurposeModal(false)}>
              <Text style={styles.doneButton}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                updateAnimalDetails('purpose', 'meat');
                setShowPurposeModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>Et</Text>
              {formData.animal_details.purpose === 'meat' && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                updateAnimalDetails('purpose', 'dairy');
                setShowPurposeModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>Süt</Text>
              {formData.animal_details.purpose === 'dairy' && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                updateAnimalDetails('purpose', 'breeding');
                setShowPurposeModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>Damızlık</Text>
              {formData.animal_details.purpose === 'breeding' && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  imageItem: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    height: 100,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  currencyText: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInputContainer: {
    flex: 1,
    marginRight: 8,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});

export default CreateListingScreen;