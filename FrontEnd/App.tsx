import { api } from './src/api';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DashboardScreen from './screens/DashBoardScreen';
import QAChat from './screens/ChatScreen';
import TaskManagerScreen from './screens/TaskManagerScreen';
import HealthSummaryScreen from './screens/SummaryScreen';
import InitialInfoScreen from './screens/InitialInfoScreen';
import LoginScreen from './screens/LoginScreen';
import { createDrawerNavigator } from '@react-navigation/drawer';




type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator(); // ✅ 添加 Drawer

// ✅ 原始底部导航
function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="QAChat" component={QAChat} />
      <Tab.Screen name="TaskManager" component={TaskManagerScreen} />
      <Tab.Screen name="Summary" component={HealthSummaryScreen} />
      <Tab.Screen
        name="Initial"
        component={InitialInfoScreen}
        initialParams={{ userId: '123' }}
      />
    </Tab.Navigator>
  );
}

// ✅ 新增：Drawer 包住 Tab + Dashboard
function DrawerNavigator() {
  return (
    <Drawer.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.loginWithToken();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string) => {
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator>
            {isAuthenticated ? (
              <Stack.Screen
                name="Main"
                component={DrawerNavigator} // ✅ 使用 DrawerNavigator 替代 TabNavigator
                options={{ headerShown: false }}
              />
            ) : (
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}