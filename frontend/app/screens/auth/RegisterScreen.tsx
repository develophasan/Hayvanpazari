import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, ComponentStyles } from '../../styles/designSystem';

interface Props {
  navigation: any;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');

  const { register } = useAuth();

  const handleRegister = async () => {
    const { first_name, last_name, email, phone, password, confirmPassword } = formData;

    if (!first_name.trim() || !last_name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    // Phone validation (Turkish format)
    const phoneRegex = /^5[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası girin (5xxxxxxxxx)');
      return;
    }

    setIsLoading(true);
    const result = await register({
      first_name,
      last_name,
      email,
      phone: phone.replace(/\s/g, ''),
      password,
    });
    setIsLoading(false);

    if (result.success) {
      navigation.navigate('SMSVerification');
    } else {
      Alert.alert('Kayıt Hatası', result.error || 'Kayıt oluşturulamadı');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/) || password.match(/[^a-zA-Z0-9]/)) strength += 25;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 25) return 'Zayıf';
    if (strength <= 50) return 'Orta';
    if (strength <= 75) return 'İyi';
    return 'Güçlü';
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 25) return Colors.error;
    if (strength <= 50) return Colors.warning;
    if (strength <= 75) return Colors.info;
    return Colors.success;
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Kayıt Ol</Text>
          </View>

          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ad"
                placeholderTextColor={Colors.textSecondary}
                value={formData.first_name}
                onChangeText={(value) => updateFormData('first_name', value)}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Soyad"
                placeholderTextColor={Colors.textSecondary}
                value={formData.last_name}
                onChangeText={(value) => updateFormData('last_name', value)}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="E-posta"
                placeholderTextColor={Colors.textSecondary}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Telefon"
                placeholderTextColor={Colors.textSecondary}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Parola"
                placeholderTextColor={Colors.textSecondary}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {formData.password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <Text style={styles.passwordStrengthLabel}>Parola gücü</Text>
                <View style={styles.passwordStrengthBar}>
                  <View 
                    style={[
                      styles.passwordStrengthFill, 
                      { 
                        width: `${passwordStrength}%`,
                        backgroundColor: getPasswordStrengthColor(passwordStrength)
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.passwordStrengthText,
                  { color: getPasswordStrengthColor(passwordStrength) }
                ]}>
                  {getPasswordStrengthText(passwordStrength)}
                </Text>
              </View>
            )}

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Parola Tekrarı"
                placeholderTextColor={Colors.textSecondary}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeLabel}>Kullanıcı Tipi:</Text>
              <View style={styles.userTypeOptions}>
                <TouchableOpacity
                  style={styles.userTypeOption}
                  onPress={() => setUserType('buyer')}
                >
                  <View style={[
                    styles.radioButton,
                    userType === 'buyer' && styles.radioButtonSelected
                  ]}>
                    {userType === 'buyer' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.userTypeText}>Alıcı</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.userTypeOption}
                  onPress={() => setUserType('seller')}
                >
                  <View style={[
                    styles.radioButton,
                    userType === 'seller' && styles.radioButtonSelected
                  ]}>
                    {userType === 'seller' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.userTypeText}>Satıcı</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Zaten hesabın var mı? <Text style={styles.loginLinkBold}>Giriş yap</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default RegisterScreen;