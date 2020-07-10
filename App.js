import React, { useState, useEffect, useContext, Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';

import Login from './assets/screens/Login';
import SignUp from './assets/screens/SignUp';
import UserSetting from './assets/screens/UserSetting';
import ResetPassword from './assets/screens/ResetPassword';
import Home from './assets/screens/Home';
import Me from './assets/screens/Me';
import Other from './assets/screens/Other';
import Search from './assets/screens/Search';
import Notification from './assets/screens/Notification';
import ShowScreen from './assets/screens/ShowScreen';
import ShowItem from './assets/screens/ShowItem';
import AddList from './assets/screens/AddList';
import EditProfile from './assets/screens/EditProfile';
import EditScreen from './assets/screens/EditScreen';
import EditList from './assets/screens/EditList';
import EditItem from './assets/screens/EditItem';
import Following from './assets/screens/Following';
import Purchase from './assets/screens/Purchase';
import Language from './assets/screens/Language';
import { translate, LocalizationProvider, LocalizationContext } from './assets/screens/Utils';


import admob, { MaxAdContentRating } from '@react-native-firebase/admob';

import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function Main() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Me') {
              iconName = 'account-circle';
            } else if (route.name === 'Feed') {
              iconName = 'people';
            } else if (route.name === 'Search') {
              iconName = 'search';
            } 

            // You can return any component that you like here!
            return <Icon
              name={iconName}
              size={size}
              color='#002f6c'
            />;
        },
        })}
        tabBarOptions={{
          activeTintColor: '#002f6c',
          inactiveTintColor: 'gray',
        }}
    >
      <Tab.Screen 
        name="Me"
        component={Me}
        options={{
          tabBarLabel: translate("MyAccount"),
        }} />
      <Tab.Screen 
        name="Feed" 
        component={Home} 
        options={{
          tabBarLabel: translate("Feed"),
        }} />
      <Tab.Screen 
        name="Search" 
        component={Search} options={{
          tabBarLabel: translate("Search"),
        }} />
    </Tab.Navigator>
  );
}

const SplashScreen = ({navigation}) => {
  const {appLanguage, initializeAppLanguage} = useContext(LocalizationContext);

  useEffect(() => {
    initializeAppLanguage();
    const timer = setTimeout(() => {
      if (!auth().currentUser || !auth().currentUser.emailVerified) {
        navigation.replace('Login');
      } else {
        navigation.replace('Main');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation, initializeAppLanguage]);

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <ActivityIndicator size="large" color="#002f6c" />
    </View>
  );
};

export default class App extends Component {
  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    admob()
    .setRequestConfiguration({
      // Update all future requests suitable for parental guidance
      maxAdContentRating: MaxAdContentRating.T,

      // Indicates that you want your content treated as child-directed for purposes of COPPA.
      tagForChildDirectedTreatment: true,

      // Indicates that you want the ad request to be handled in a
      // manner suitable for users under the age of consent.
      tagForUnderAgeOfConsent: true,
    })
    .then(() => {
      // Request config successfully set!
    });
  }

  render() {
    return (
      <LocalizationProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="SplashScreen">
            <Stack.Screen options={{headerShown: false}} name="SplashScreen" component={SplashScreen} />
            <Stack.Screen options={{headerShown: false}} name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} options={{
              title: translate("SignUp"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="ResetPassword" component={ResetPassword}  options={{
              title: translate("ResetPassword"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen options={{headerShown: false}} name="Main" component={Main} />
            <Stack.Screen name="Notification" component={Notification} options={{
              title: translate("Notifications"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="ShowScreen" component={ShowScreen} options={{
              title: translate("ShowScreen"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="ShowItem" component={ShowItem} options={{
              title: translate("ShowItem"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="AddList" component={AddList} options={{
              title: translate("AddList"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="EditProfile" component={EditProfile} options={{
              title: translate("EditProfile"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="EditScreen" component={EditScreen} options={{
              title: translate("EditScreen"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="EditList" component={EditList} options={{
              title: translate("EditList"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="EditItem" component={EditItem} options={{
              title: translate("EditItem"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Settings" component={UserSetting} options={{
              title: translate("Settings"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Other" component={Other} options={{
              title: translate("OtherAccount"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Following" component={Following} options={{
              title: translate("Followings"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Purchase" component={Purchase} options={{
              title: translate("Purchase"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Language" component={Language} options={{
              title: translate("Language"),
              headerStyle: {
                backgroundColor: '#002f6c',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
          </Stack.Navigator>
        </NavigationContainer>
      </LocalizationProvider>
    );
  }
};