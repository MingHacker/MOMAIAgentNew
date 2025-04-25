import { api } from './src/api';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationContainer, useNavigation, DrawerActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';
import { navigationStyles } from './styles/navigation';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import ChatBot from './components/ChatBot';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';

// Screens
import DashboardScreen from './screens/DashBoardScreen';
import QAChat from './screens/ChatScreen';
import TaskManagerScreen from './screens/TaskManagerScreen';
import HealthSummaryScreen from './screens/SummaryScreen';
import InitialInfoScreen from './screens/InitialInfoScreen';
import LoginScreen from './screens/LoginScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import EntryScreen from './screens/EntryScreen';
import BabyProfileScreen from './screens/BabyProfileScreen';
import RecommendedFeaturesScreen from './screens/RecommandFeatureScreen';
import TimelineScreen from './screens/TimelineScreen';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);



const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// ✅ 原始底部导航
function TabNavigator() {
  const navigation = useNavigation();
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: string = 'home';
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Summary':
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
              break;
            case 'TaskManager':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'QAChat':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }
          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: navigationStyles.tabNavigator,
        headerStyle: navigationStyles.headerStyle,
        headerTintColor: '#4C3575',
        headerTitleStyle: navigationStyles.headerTitleStyle,
        headerTitleAlign: 'center',
        headerLeftContainerStyle: navigationStyles.headerLeftContainer,
        headerRightContainerStyle: navigationStyles.headerRightContainer,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Home',
          headerLeft: () => (
            <TouchableOpacity
              style={navigationStyles.headerButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Ionicons name="menu" size={24} color="#4C3575" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen 
        name="Summary" 
        component={HealthSummaryScreen}
        options={{
          title: 'Summary',
        }}
      />
      <Tab.Screen 
        name="TaskManager" 
        component={TaskManagerScreen}
        options={{
          title: 'Tasks',
        }}
      />
      <Tab.Screen 
        name="QAChat" 
        component={QAChat}
        options={{
          title: 'Chat',
        }}
      />
    </Tab.Navigator>
  );
}

type DrawerParamList = {
  MainTabs: undefined;
  Welcome: undefined;
  Login: undefined;
  Entry: undefined;
  BabyProfile: undefined;
  RecommendedFeatures: undefined;
  Settings: undefined;
};

type DrawerNavigatorProps = {
  id?: string;
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      id={undefined}
      defaultStatus="closed"
      screenOptions={{
        drawerStyle: navigationStyles.drawerStyle,
        drawerType: 'front',
        drawerPosition: 'left',
        headerShown: false,
        drawerActiveBackgroundColor: '#F3E8FF',
        drawerActiveTintColor: '#4C3575',
        drawerInactiveTintColor: '#666',
        drawerLabelStyle: {
          ...navigationStyles.drawerLabelStyle,
          marginLeft: 32
        },
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerItemStyle: {
          paddingVertical: 8,
          marginVertical: 5,
          borderRadius: 5
        }
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ 
          title: 'Home',
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={18} color={color} />
          )
        }} 
      />
      <Drawer.Screen 
        name="BabyProfile" 
        component={BabyProfileScreen} 
        options={{ 
          title: 'Profile',
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={18} color={color} />
          )
        }} 
      />
      <Drawer.Screen 
        name="Timeline" 
        component={TimelineScreen} 
        options={{ 
          title: 'Timeline Story',
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={18} color={color} />
          )
        }} 
      />
      <Drawer.Screen 
        name="RecommendedFeatures" 
        component={RecommendedFeaturesScreen} 
        options={{ 
          title: 'Feature Card',
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'star' : 'star-outline'} size={18} color={color} />
          )
        }} 
      />
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
    try {
      const success = await api.loginWithToken();
      if (success) {
        setIsAuthenticated(true);
        await AsyncStorage.setItem('userId', email);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
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
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <>
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="InitialInfo" component={InitialInfoScreen} />
                <Stack.Screen name="RecommendedFeatures" component={RecommendedFeaturesScreen} />
              </>
            ) : (
              <Stack.Screen name="Main" component={DrawerNavigator} />
            )}
          </Stack.Navigator>
          <ChatBot />
        </NavigationContainer>
      </GestureHandlerRootView>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}