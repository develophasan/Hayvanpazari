import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, ComponentStyles } from '../../styles/designSystem';

interface Props {
  navigation: any;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    console.log('🔥 handleLogin triggered!', { email, password });
    
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    console.log('✅ Starting login process...');
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    console.log('📊 Login result:', result);

    if (!result.success) {
      Alert.alert('Giriş Hatası', result.error || 'Giriş yapılamadı');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo and Brand */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="leaf" size={64} color={Colors.primary} />
            </View>
            <Text style={styles.title}>HayvanPazarı</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="E-posta"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Parola"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
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

            {/* Forgot Password Link */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Şifremi unuttum</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Pressable 
              style={({ pressed }) => [
                styles.loginButton,
                pressed && { opacity: 0.9 }
              ]}
              onPress={() => {
                console.log('🎯 Login button pressed!');
                handleLogin();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
              )}
            </Pressable>
          </View>

          {/* Register Link */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerLinkText}>
                Hesabın yok mu? <Text style={styles.registerLinkBold}>Kayıt ol</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  
  // Header - Logo & Brand
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.display,
  },

  // Form Styles
  form: {
    width: '100%',
    marginBottom: Spacing.xl,
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
  
  // Forgot Password
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.display,
  },

  // Login Button
  loginButton: {
    ...ComponentStyles.button.primaryButton,
    height: ComponentStyles.button.height,
    marginTop: Spacing.sm,
  },
  loginButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamily.display,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  registerLink: {
    paddingVertical: Spacing.sm,
  },
  registerLinkText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.display,
  },
  registerLinkBold: {
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
});

export default LoginScreen;