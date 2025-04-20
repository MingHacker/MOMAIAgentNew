import { StyleSheet } from 'react-native';

export const navigationStyles = StyleSheet.create({
  headerButton: {
    marginLeft: 15,
    marginTop: -5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  tabNavigator: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    borderTopWidth: 0,
    borderRadius: 15,
    marginHorizontal: 10,
  },
  headerStyle: {
    backgroundColor: '#F3E8FF',
    height: 110,
  },
  headerTitleStyle: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 18,
  },
  headerLeftContainer: {
    paddingLeft: 10,
  },
  headerRightContainer: {
    paddingRight: 10,
  },
  drawerStyle: {
    backgroundColor: '#fff',
    width: 280,
  },
  drawerLabelStyle: {
    marginLeft: -16,
    fontSize: 16,
  },
}); 