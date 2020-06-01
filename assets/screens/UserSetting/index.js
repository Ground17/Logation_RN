import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert
} from 'react-native';

import { Divider, Input, Avatar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';

import RNIap, {
  purchaseErrorListener,
  purchaseUpdatedListener,
  type ProductPurchase,
  type PurchaseError,
} from 'react-native-iap'; // 확인 필요

const itemSkus = Platform.select({
  ios: [
    'com.hyla981020.adfree1',
    'com.hyla981020.adfree12'
  ],
  android: [
    'com.hyla981020.adfree1',
    'com.hyla981020.adfree12'
  ]
});

export default class UserSetting extends Component {
  purchaseUpdateSubscription = null
  purchaseErrorSubscription = null
  async componentDidMount() {
    try {
      const products: Product[] = await RNIap.getSubscriptions(itemSkus);
    } catch(err) {
      console.warn(err); // standardized err.code and err.message available
    }

    // this.purchaseUpdateSubscription = purchaseUpdatedListener((purchase: InAppPurchase | SubscriptionPurchase | ProductPurchase ) => {
    //   console.log('purchaseUpdatedListener', purchase);
    //   const receipt = purchase.transactionReceipt;
    //   if (receipt) {
    //     yourAPI.deliverOrDownloadFancyInAppPurchase(purchase.transactionReceipt)
    //     .then((deliveryResult) => {
    //       if (isSuccess(deliveryResult)) {
    //         // Tell the store that you have delivered what has been paid for.
    //         // Failure to do this will result in the purchase being refunded on Android and
    //         // the purchase event will reappear on every relaunch of the app until you succeed
    //         // in doing the below. It will also be impossible for the user to purchase consumables
    //         // again untill you do this.
    //         if (Platform.OS == 'ios') {
    //           RNIap.finishTransactionIOS(purchase.transactionId);
    //         } else if (Platform.OS == 'android') {
    //           // If consumable (can be purchased again)
    //           RNIap.consumePurchaseAndroid(purchase.purchaseToken);
    //           // If not consumable
    //           RNIap.acknowledgePurchaseAndroid(purchase.purchaseToken);
    //         }
 
    //         // From react-native-iap@4.1.0 you can simplify above `method`. Try to wrap the statement with `try` and `catch` to also grab the `error` message.
    //         // If consumable (can be purchased again)
    //         // RNIap.finishTransaction(purchase, true);
    //         // If not consumable
    //         RNIap.finishTransaction(purchase, false);
    //       } else {
    //         // Retry / conclude the purchase is fraudulent, etc...
    //       }
    //     });
    //   }
    // });
 
    // this.purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
    //   console.warn('purchaseErrorListener', error);
    // });
  }

  componentWillUnmount() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
  }

  requestSubscription1 = async () => {
    try {
      await RNIap.requestSubscription('com.hyla981020.adfree1');
    } catch (err) {
      console.warn(err.code, err.message);
    }
  }
 
  requestSubscription12 = async () => {
    try {
      await RNIap.requestSubscription('com.hyla981020.adfree12');
    } catch (err) {
      console.warn(err.code, err.message);
    }
  }

  alert() {
    Alert.alert(
      'Delete account',
      'Are you sure you want to delete the account? This process cannot be reversed.\n' + 
      '(Undeleted data is stored for up to one year, and if you want to delete it immediately, contact your developer. If the data has not been erased, it will remain on the same email again.)',
      [
          {text: 'OK', onPress: async () => {
            await auth().currentUser.delete()
              .then(() => {
                Alert.alert(
                  'Account Deletion Successfully!',
                  'Thank you for using our application.',
                  [
                      {text: 'OK', onPress: () => this.props.navigation.replace("Login")},
                  ],
                  { cancelable: false }
                );
              })
              .catch(error => {
                Alert.alert(
                'Error',
                error.toString(),
                [
                    {text: 'OK', onPress: () => console.log('OK Pressed')},
                ],
                { cancelable: false }
                );
              });
            }
          },
          {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
      ],
      { cancelable: false }
      );
  }

  render() {
    return(
      <SafeAreaView style={styles.container}>
        {/* <View style={{width: '100%', alignItems: 'center', justifyContent: 'center', paddingTop: 30}}>
          <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5,}]} onPress={() => { this.requestSubscription1() }}>
            <Text style={styles.loginText}>Ad free for 1 month</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5, marginBottom: 15}]} onPress={() => { this.requestSubscription12() }}>
            <Text style={styles.loginText}>Ad free for 1 year</Text>
          </TouchableOpacity>
        </View> */}
        <View style={{width: '100%', alignItems: 'center', justifyContent: 'center', paddingBottom: 30}}>
          <View style={{marginBottom: 15}}>
            <View style={{alignSelf:'center', position:'absolute', borderBottomColor:'gray', borderBottomWidth:1, height:'50%', width:'80%'}}/>
          </View>
          <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5}]} onPress={() => { auth().signOut().then(() => 
            console.log('User signed out!'));
            this.props.navigation.replace("Login");
          }}>
            <Text style={styles.loginText}>Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonContainer, styles.signUpButton, {height:45, width: "80%", borderRadius:5}]} onPress={() => { this.alert() }}>
            <Text style={styles.signUpText}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: "#fff",
        justifyContent: 'space-between',
    },
    cell: { width: "80%", height: 50 },
    cellView: { 
        width: "84%",
        height: 60, 
    },
    inputs:{
        marginLeft:15,
        borderBottomColor: '#002f6c',
        flex:1,
        color: "#002f6c",
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom:5,
    },
    loginButton: {
        backgroundColor: "#002f6c",
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