import React, { useState, useEffect, useContext, Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Appearance,
  Linking,
} from 'react-native';
// import { useNavigation } from '@react-navigation/native';

import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';

import Login from './assets/screens/Login';
import SignUp from './assets/screens/SignUp';
import UserSetting from './assets/screens/UserSetting';
import ResetPassword from './assets/screens/ResetPassword';
import Home from './assets/screens/Home';
import Me from './assets/screens/Me';
import Search from './assets/screens/Search';
import Notification from './assets/screens/Notification';
import ShowScreen from './assets/screens/ShowScreen';
import ShowItem from './assets/screens/ShowItem';
import AddList from './assets/screens/AddList';
import EditProfile from './assets/screens/EditProfile';
import Following from './assets/screens/Following';
import Purchase from './assets/screens/Purchase';
import Language from './assets/screens/Language';
import { translate, LocalizationProvider, LocalizationContext, Style, TAB_ITEM_WIDTH, } from './assets/screens/Utils';

// import admob, { MaxAdContentRating } from '@react-native-firebase/admob';

import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

import i18n from 'i18n-js';

const Stack = createStackNavigator();

function Main({ navigation }) {
  const [screen, setScreen] = useState(0);
  const [feed, setFeed] = useState("");
  const [me, setMe] = useState("");
  const { initializeAppLanguage } = useContext(LocalizationContext);

  useEffect(() => {
    function handleStatusChange(status) {
      this.navigate(event.url);
    }

    function navigate(url) {
      var regex = /[?&]([^=#]+)=([^&#]*)/g,
          params = {},
          match;
      // var i = 0;
      
      while (match = regex.exec(url)) {
          params[match[1]] = match[2];
          // i++;
      }
      console.log(params)
      if (!params['user'] || !params['id']) {
          return;
      }
      navigation.push('ShowScreen', {
          itemId: params['id'],
          userUid: params['user'],
          onPop: () => this.refresh(),
      });
    }
    if (Platform.OS === 'android') {
        Linking.getInitialURL().then(url => {
            this.navigate(url);
        });
    } else {
        Linking.addEventListener('url', this.handleOpenURL);
    }
    // effect 이후에 어떻게 정리(clean-up)할 것인지 표시합니다.
    return function cleanup() {
      if (Platform.OS !== 'android') {
        Linking.removeEventListener('url', this.handleOpenURL);
      }
    };
  }, [screen]);
  
  initializeAppLanguage().then(() => {
    navigation.setOptions({
      title: translate("Main"),
    });
    setFeed(translate("Feed"));
    setMe(translate("MyAccount"));
  });

  const tabList = {
    0: <Home navigation={navigation}/>,
    1: <Me navigation={navigation}/>,
  };

        
  return (
    <SafeAreaView style={Style.container}>
      <View style={{width: "100%", height: "91%"}}> 
        {tabList[screen]}
      </View>
      <View style={Style.floatingViewStyle}>
        <TouchableOpacity onPress={async () => { 
          setScreen(0);
        }}>
          <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
            <Icon
              reverse
              name='people'
              color='#bdbdbd'
              size={25}
            />
            <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {feed} </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => { 
          navigation.push('AddList');
        }}>
          <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
            <Icon
              reverse
              name='add-circle-outline'
              color='#bdbdbd'
              size={25}
            />
            {/* <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("Launch")} </Text> */}
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => { 
          setScreen(1);
        }}>
          <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
            <Icon
              reverse
              name='account-circle'
              color='#bdbdbd'
              size={25}
            />
            <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {me} </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    // <Tab.Navigator
    //     screenOptions={({ route }) => ({
    //     tabBarIcon: ({ focused, color, size }) => {
    //         let iconName;

    //         if (route.name === 'Me') {
    //           iconName = 'account-circle';
    //         } else if (route.name === 'Feed') {
    //           iconName = 'people';
    //         } else if (route.name === 'Search') {
    //           iconName = 'search';
    //         }

    //         // You can return any component that you like here!
    //         return <Icon
    //           name={iconName}
    //           size={size}
    //           color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#002f6c'}
    //         />;
    //     },
    //     })}
    //     tabBarOptions={{
    //       activeTintColor: Appearance.getColorScheme() === 'dark' ? '#fff' : '#002f6c',
    //       inactiveTintColor: 'gray',
    //       style: {backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#fff',},
    //     }}
    // >
    //   <Tab.Screen 
    //     name="Me"
    //     component={Me}
    //     options={{
    //       tabBarLabel: Object.keys(i18n.translations).length === 0 ? "" : translate("MyAccount"),
    //     }} />
    //   <Tab.Screen 
    //     name="Feed" 
    //     component={Home} 
    //     options={{
    //       tabBarLabel: Object.keys(i18n.translations).length === 0 ? "" : translate("Feed"),
    //     }} />
    //   <Tab.Screen 
    //     name="Search" 
    //     component={Search} options={{
    //       tabBarLabel: Object.keys(i18n.translations).length === 0 ? "" : translate("Search"),
    //     }} />
    // </Tab.Navigator>
  );
}

export default class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <LocalizationProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={!auth().currentUser || !auth().currentUser.emailVerified ? 'Login' : 'Main'}>
            <Stack.Screen options={{headerShown: false}} name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="ResetPassword" component={ResetPassword}  options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen options={{headerShown: false}} name="Main" component={Main} />
            <Stack.Screen name="Notification" component={Notification} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="ShowScreen" component={ShowScreen} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="ShowItem" component={ShowItem} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="AddList" component={AddList} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="EditProfile" component={EditProfile} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Settings" component={UserSetting} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Following" component={Following} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Purchase" component={Purchase} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Language" component={Language} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Search" component={Search} options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}/>
            <Stack.Screen name="Other" component={Me}  options={{
              headerStyle: {
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#01579b',
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