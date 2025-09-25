import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { CITIES, getDistrictsByCity } from '../data/turkeyData';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Props {
  navigation: any;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, token, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    city: user?.location?.city || '',
    district: user?.location?.district || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  useEffect(() => {
    // Update editData when user data changes
    if (user) {
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        city: user.location?.city || '',
        district: user.location?.district || '',
      });
    }
  }, [user]);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri izni gerekiyor');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await updateProfile({ profile_image: result.assets[0].base64 });
    }
  };

  const updateProfile = async (data: any) => {
    if (!user || !token) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Add basic fields
      if (data.first_name && data.first_name.trim()) {
        formData.append('first_name', data.first_name.trim());
      }
      if (data.last_name && data.last_name.trim()) {
        formData.append('last_name', data.last_name.trim());
      }
      if (data.city && data.city.trim()) {
        formData.append('city', data.city.trim());
      }
      if (data.district && data.district.trim()) {
        formData.append('district', data.district.trim());
      }
      if (data.profile_image) {
        formData.append('profile_image', data.profile_image);
      }

      console.log('🔄 Updating profile with data:', {
        first_name: data.first_name,
        last_name: data.last_name,
        city: data.city,
        district: data.district,
        has_profile_image: !!data.profile_image
      });

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // FormData için Content-Type header'ını eklemiyoruz
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('📤 Profile update response:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 200)
      });

      if (response.ok) {
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          throw new Error('Server response is not valid JSON');
        }

        // Update user context with new data
        const updatedUserData: any = { ...user };
        
        if (data.first_name) updatedUserData.first_name = data.first_name;
        if (data.last_name) updatedUserData.last_name = data.last_name;
        
        // Update location if provided
        if (data.city || data.district) {
          updatedUserData.location = {
            city: data.city || user.location?.city || '',
            district: data.district || user.location?.district || '',
          };
        }
        
        if (data.profile_image) {
          updatedUserData.profile_image = data.profile_image;
        }
        
        updateUser(updatedUserData);
        Alert.alert('✅ Başarılı', 'Profil güncellendi');
        setIsEditing(false);
      } else {
        let errorMessage = 'Profil güncellenirken bir hata oluştu';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = `HTTP Error: ${response.status}`;
        }
        Alert.alert('❌ Hata', errorMessage);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('❌ Hata', `Ağ hatası: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfile(editData);
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: logout }
      ]
    );
  };

  const getUserTypeText = (type: string) => {
    switch (type) {
      case 'buyer': return 'Alıcı';
      case 'seller': return 'Satıcı';
      case 'both': return 'Alıcı & Satıcı';
      default: return type;
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons 
            name={isEditing ? "close" : "create-outline"} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Picture */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={isEditing ? handleImagePicker : undefined}
          >
            {user.profile_image ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${user.profile_image}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
            {isEditing && (
              <View style={styles.editOverlay}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.userName}>
            {user.first_name} {user.last_name}
          </Text>
          <Text style={styles.userType}>
            {getUserTypeText(user.user_type)}
          </Text>
        </View>

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ad</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editData.first_name}
                  onChangeText={(text) => setEditData(prev => ({ ...prev, first_name: text }))}
                  placeholder="Adınızı girin"
                />
              ) : (
                <Text style={styles.infoValue}>{user.first_name}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Soyad</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editData.last_name}
                  onChangeText={(text) => setEditData(prev => ({ ...prev, last_name: text }))}
                  placeholder="Soyadınızı girin"
                />
              ) : (
                <Text style={styles.infoValue}>{user.last_name}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>E-posta</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <View style={styles.phoneContainer}>
                <Text style={styles.infoValue}>{user.phone}</Text>
                {user.is_phone_verified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.verifiedText}>Doğrulandı</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.verifyButton}
                    onPress={() => navigation.navigate('SMSVerification')}
                  >
                    <Text style={styles.verifyButtonText}>Doğrula</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Lokasyon</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Şehir</Text>
              {isEditing ? (
                <TouchableOpacity 
                  style={styles.pickerContainer}
                  onPress={() => setShowCityModal(true)}
                >
                  <Text style={[
                    styles.pickerValue,
                    !editData.city && styles.placeholderText
                  ]}>
                    {editData.city || 'Şehir seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              ) : (
                <Text style={styles.infoValue}>
                  {user.location?.city || 'Belirtilmemiş'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>İlçe</Text>
              {isEditing ? (
                <TouchableOpacity 
                  style={styles.pickerContainer}
                  onPress={() => {
                    if (!editData.city) {
                      Alert.alert('Uyarı', 'Önce şehir seçiniz');
                      return;
                    }
                    setAvailableDistricts(getDistrictsByCity(editData.city));
                    setShowDistrictModal(true);
                  }}
                >
                  <Text style={[
                    styles.pickerValue,
                    !editData.district && styles.placeholderText
                  ]}>
                    {editData.district || 'İlçe seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              ) : (
                <Text style={styles.infoValue}>
                  {user.location?.district || 'Belirtilmemiş'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Yardım</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Ayarlar</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Çıkış Yap
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCityModal(false)}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Şehir Seçin</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {CITIES.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.modalItem}
                onPress={() => {
                  setEditData(prev => ({ ...prev, city, district: '' }));
                  setShowCityModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  editData.city === city && styles.selectedItemText
                ]}>
                  {city}
                </Text>
                {editData.city === city && (
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
            <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>İlçe Seçin</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {availableDistricts.map((district) => (
              <TouchableOpacity
                key={district}
                style={styles.modalItem}
                onPress={() => {
                  setEditData(prev => ({ ...prev, district }));
                  setShowDistrictModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  editData.district === district && styles.selectedItemText
                ]}>
                  {district}
                </Text>
                {editData.district === district && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
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
  editButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userType: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  infoInput: {
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    paddingVertical: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifyButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    paddingVertical: 4,
  },
  pickerValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsSection: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: '#FF3B30',
  },
  placeholderText: {
    color: '#999',
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
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItemText: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ProfileScreen;