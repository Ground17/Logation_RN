import React, { useState, useEffect, Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';

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


import admob, { MaxAdContentRating } from '@react-native-firebase/admob';

import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import auth from '@react-native-firebase/auth';

import * as RNIap from 'react-native-iap';

import Icon from 'react-native-vector-icons/MaterialIcons';

// const itemSkus = Platform.select({
//   ios: [
//     'com.hyla981020.adfree1'
//   ],
//   android: [
//     'com.hyla981020.adfree12'
//   ]
// });

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
              color='#00b5ec'
            />;
        },
        })}
        tabBarOptions={{
          activeTintColor: '#00b5ec',
          inactiveTintColor: 'gray',
        }}
    >
      <Tab.Screen name="Me" component={Me} />
      <Tab.Screen name="Feed" component={Home} />
      <Tab.Screen name="Search" component={Search} />
    </Tab.Navigator>
  );
}

export default class App extends Component {
  render() {
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
    if (!auth().currentUser || !auth().currentUser.emailVerified) {
      return (
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen options={{headerShown: false}} name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
            <Stack.Screen options={{headerShown: false}} name="Main" component={Main} />
            <Stack.Screen name="Notification" component={Notification} />
            <Stack.Screen name="ShowScreen" component={ShowScreen} />
            <Stack.Screen name="ShowItem" component={ShowItem} />
            <Stack.Screen name="AddList" component={AddList} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="EditScreen" component={EditScreen} />
            <Stack.Screen name="EditList" component={EditList} />
            <Stack.Screen name="EditItem" component={EditItem} />
            <Stack.Screen name="Settings" component={UserSetting} />
            <Stack.Screen name="Other" component={Other} />
            <Stack.Screen name="Following" component={Following} />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }

    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen options={{headerShown: false}} name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
          <Stack.Screen options={{headerShown: false}} name="Main" component={Main} />
          <Stack.Screen name="Notification" component={Notification} />
          <Stack.Screen name="ShowScreen" component={ShowScreen} />
          <Stack.Screen name="ShowItem" component={ShowItem} />
          <Stack.Screen name="AddList" component={AddList} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="EditScreen" component={EditScreen} />
          <Stack.Screen name="EditList" component={EditList} />
          <Stack.Screen name="EditItem" component={EditItem} />
          <Stack.Screen name="Settings" component={UserSetting} />
          <Stack.Screen name="Other" component={Other} />
          <Stack.Screen name="Following" component={Following} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
};