import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import SMSVerificationScreen from './screens/auth/SMSVerificationScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ListingsScreen from './screens/ListingsScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import ListingDetailScreen from './screens/ListingDetailScreen';
import CreateListingScreen from './screens/CreateListingScreen';
import ChatScreen from './screens/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="SMSVerification" component={SMSVerificationScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Listings') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'Ana Sayfa' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ tabBarLabel: 'Arama' }}
      />
      <Tab.Screen 
        name="Listings" 
        component={ListingsScreen} 
        options={{ tabBarLabel: 'İlanlarım' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen} 
        options={{ tabBarLabel: 'Mesajlar' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ListingDetail" 
        component={ListingDetailScreen}
        options={{
          title: 'İlan Detayı',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="CreateListing" 
        component={CreateListingScreen}
        options={{
          title: 'İlan Oluştur',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          title: 'Mesajlaşma',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: 'white',
        }}
      />
    </Stack.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const { user, isLoading } = useAuth();

  console.log('RootNavigator - User:', user?.first_name, 'Loading:', isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}