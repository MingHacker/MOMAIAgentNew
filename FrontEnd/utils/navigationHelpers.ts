import { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';



type TabScreen = 'Dashboard' | 'Summary' | 'TaskManager' | 'QAChat';

/**
 * 跳转到指定 Tab 页面（Dashboard, Summary, QAChat...）
 */
export function navigateToTab(
  navigation: NavigationProp<any>,
  screen: TabScreen,
  params: any = {}
) {
  navigation.navigate('MainApp', {
    screen: 'AppMain',
    params: {
      screen,
      params,
    },
  });
}
export function goHome(navigation: NavigationProp<any>) {
  navigateToTab(navigation, 'Dashboard');
}


export async function logoutAndRestart(navigation) {
  await AsyncStorage.removeItem('userId');
  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
}