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
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
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
  loginButton: {
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
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerLinkText: {
    fontSize: 14,
    color: '#666',
  },
  registerLinkBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default LoginScreen;