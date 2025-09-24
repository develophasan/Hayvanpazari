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
    backgroundColor: Colors.backgroundLight,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundLight,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.display,
  },

  // Form Styles
  form: {
    width: '100%',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  input: {
    ...ComponentStyles.input,
    backgroundColor: Colors.inputLight,
    borderWidth: 0,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.display,
  },
  passwordToggle: {
    position: 'absolute',
    right: Spacing.md,
    top: 16,
    padding: Spacing.xs,
  },

  // Password Strength Styles
  passwordStrengthContainer: {
    marginBottom: Spacing.lg,
  },
  passwordStrengthLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.display,
  },
  passwordStrengthBar: {
    height: 8,
    backgroundColor: Colors.inputLight,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    transition: 'width 0.3s ease' as any,
  },
  passwordStrengthText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    fontFamily: Typography.fontFamily.display,
  },

  // User Type Selection Styles
  userTypeContainer: {
    marginBottom: Spacing.xl,
  },
  userTypeLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.display,
  },
  userTypeOptions: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.backgroundWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  userTypeText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.display,
  },

  // Button Styles
  registerButton: {
    ...ComponentStyles.button.primaryButton,
    height: ComponentStyles.button.height,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  registerButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamily.display,
  },

  // Login Link Styles
  loginLink: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  loginLinkText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.display,
  },
  loginLinkBold: {
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
});

export default RegisterScreen;