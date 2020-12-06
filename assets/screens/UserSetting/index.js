import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  Appearance,
} from 'react-native';

import { Divider, Input, Avatar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';

import { translate, getlocalizedPrice } from '../Utils';

import RNIap, {
  purchaseErrorListener,
  purchaseUpdatedListener,
  type ProductPurchase,
  type PurchaseError,
} from 'react-native-iap'; // 확인 필요

const itemSkus = [
  'adfree_for_1month',
  'adfree_for_1year'
]

export default class UserSetting extends Component {
  purchaseUpdateSubscription = null
  purchaseErrorSubscription = null

  state = {
    month: null,
    year: null,
  };

  async componentDidMount() {
    this.props.navigation.setOptions({ title: translate("Settings") });
    const price = await getlocalizedPrice();
    if (price) {
      this.setState({
        month: price[month],
        year: price[year],
      });
    }
  }

  alert() {
    Alert.alert(
      translate("DeleteAccount"),
      translate("UserSettingComment1") + translate("UserSettingComment2"),
      [
          {text: translate('Cancel'), onPress: () => console.log('Cancel Pressed'),},
          {text: translate('OK'), onPress: async () => {
            await auth().currentUser.delete()
              .then(() => {
                Alert.alert(
                  translate("UserSettingComment3"),
                  translate("UserSettingComment4"),
                  [
                      {text: translate('OK'), onPress: () => this.props.navigation.replace("Login")},
                  ],
                  { cancelable: false }
                );
              })
              .catch(error => {
                Alert.alert(
                translate('Error'),
                error.toString(),
                [
                    {text: translate('OK'), onPress: () => console.log('OK Pressed')},
                ],
                { cancelable: false }
                );
              });
            }
          },
      ],
      { cancelable: false }
      );
  }

  render() {
    return(
      <SafeAreaView style={styles.container}>
        <View style={{width: "100%", height: "100%", alignItems: 'center', justifyContent: 'space-between', backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
          <View style={{width: '100%', alignItems: 'center', justifyContent: 'center', paddingTop: 30}}>
            <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5, marginBottom: 15}]} onPress={() => { 
              /// 인앱이 구현되었을시 주석 해제!!!
              // this.props.navigation.push("Purchase", {
              //   month: this.state.month,
              //   year: this.state.year,
              // });
            }}>
              <Text style={styles.loginText}>{/*translate("Purchase") /// 인앱이 구현되었을시 주석 해제!!! */}</Text>
            </TouchableOpacity>
          
          </View>
          <View style={{width: '100%', alignItems: 'center', justifyContent: 'center', paddingBottom: 30}}>
            <View style={{marginBottom: 10}}>
              <View style={{alignSelf:'center', position:'absolute', borderBottomColor:'gray', borderBottomWidth:1, height:'50%', width:'80%'}}/>
            </View>
            <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5}]} onPress={() => { this.props.navigation.push('Language') }}>
              <Text style={styles.loginText}>{translate("Language")}</Text>
            </TouchableOpacity>
            <View style={{marginTop: 5, marginBottom: 10}}>
              <View style={{alignSelf:'center', position:'absolute', borderBottomColor:'gray', borderBottomWidth:1, height:'50%', width:'80%'}}/>
            </View>
            <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5}]} onPress={() => { auth().signOut().then(() => 
              console.log('User signed out!'));
              this.props.navigation.goBack();
              this.props.navigation.replace("Login");
            }}>
              <Text style={styles.loginText}>{translate("SignOut")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttonContainer, styles.signUpButton, {height:45, width: "80%", borderRadius:5}]} onPress={() => { this.alert() }}>
              <Text style={styles.signUpText}>{translate("DeleteAccount")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
    },
    cell: { width: "80%", height: 50 },
    cellView: { 
        width: "84%",
        height: 60, 
    },
    inputs:{
        marginLeft:15,
        borderBottomColor: Appearance.getColorScheme() === 'dark' ? "#fff" : '#002f6c',
        flex:1,
        color: Appearance.getColorScheme() === 'dark' ? "#fff" : '#002f6c',
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom:5,
    },
    loginButton: {
        backgroundColor: "#002f6c",
        borderColor: "#002f6c",
        borderWidth: 1,
    },
    signUpButton: {
        backgroundColor: "#fff",
        borderColor: '#002f6c',
        borderWidth: 1,
    },
    loginText: {
        color: 'white',
    },
    signUpText: {
        color: '#002f6c',
    }
});