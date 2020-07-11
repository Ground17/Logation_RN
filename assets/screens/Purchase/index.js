import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';

import { Divider, Input, Avatar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';

import { translate } from '../Utils';

import RNIap, {
  purchaseErrorListener,
  purchaseUpdatedListener,
  type ProductPurchase,
  type PurchaseError,
} from 'react-native-iap';

import RNRestart from 'react-native-restart';

const itemSkus = [
  'adfree_for_1month',
  'adfree_for_1year'
]

export default class Purchase extends Component {
  purchaseUpdateSubscription = null
  purchaseErrorSubscription = null

  state = {
    month: '',
    year: '',
    log: '',
  };

  async componentDidMount() {
    this.props.navigation.setOptions({ title: translate("Purchase") });
    if (this.props.route.params.month && this.props.route.params.year) {
      this.setState({
        month: this.props.route.params.month,
        year: this.props.route.params.year,
      });
    } else {
      try {
        const products: Product[] = await RNIap.getSubscriptions(itemSkus);
        for (var i=0; i<products.length; i++) {
          if (products[i].productId == 'adfree_for_1month') {
            this.setState({
              month: `${products[i].title} (${products[i].localizedPrice})`
            });
          } else {
            this.setState({
              year: `${products[i].title} (${products[i].localizedPrice})`
            });
          }
        }
      } catch(err) {
        console.warn(err); // standardized err.code and err.message available
      }
    }
    

    this.purchaseUpdateSubscription = purchaseUpdatedListener((purchase: InAppPurchase | SubscriptionPurchase | ProductPurchase ) => {
      if (purchase.transactionReceipt) {
        if (Platform.OS === 'ios') {
          console.log(purchase.transactionReceipt);
          functions()
            .httpsCallable('saveIOSReceiptIAP')({receipt: purchase.transactionReceipt})
            .then(response => {
              console.log(response);
              if (response.data.result) {
                RNIap.finishTransaction(purchase, false);
                Alert.alert(
                  translate('Success'),
                  translate('PurchaseComment2'),
                  [
                  {text: translate('Cancel'), onPress: () => {  }},
                  {text: translate('OK'), onPress: () => {
                    RNRestart.Restart();
                  }},
                  ],
                  { cancelable: false }
                );
              } else {
                this.setState({log: response.data.log});
              }
            }).catch((error) => {
              console.log(error);
              this.setState({log: error});
            });
        } else {
          functions()
            .httpsCallable('saveAOSReceiptIAP')({receipt: purchase.transactionReceipt})
            .then(response => {
              console.log(response);
              if (response.data.result) {
                RNIap.finishTransaction(purchase, false);
                Alert.alert(
                  translate('Success'),
                  translate('PurchaseComment2'),
                  [
                  {text: translate('Cancel'), onPress: () => {  }},
                  {text: translate('OK'), onPress: () => {
                    RNRestart.Restart();
                  }},
                  ],
                  { cancelable: false }
                );
              } else {
                this.setState({log: response.data.log});
              }
            }).catch((error) => {
              console.log(error);
              this.setState({log: error});
            });
        }
      } 
    });
 
    this.purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
      this.setState({log: error});
      console.warn('purchaseErrorListener', error);
    });
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
      await RNIap.requestSubscription('adfree_for_1month');
    } catch (err) {
      console.warn(err.code, err.message);
    }
  }
 
  requestSubscription12 = async () => {
    try {
      await RNIap.requestSubscription('adfree_for_1year');
    } catch (err) {
      console.warn(err.code, err.message);
    }
  }

  render() {
    return(
      <SafeAreaView style={styles.container}>
        <View style={{width: '100%', alignItems: 'center', justifyContent: 'center', paddingTop: 30}}>
          <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5,}]} onPress={() => { this.requestSubscription1() }}>
            <Text style={styles.loginText}>{this.state.month}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5, marginBottom: 15}]} onPress={() => { this.requestSubscription12() }}>
            <Text style={styles.loginText}>{this.state.year}</Text>
          </TouchableOpacity>
          <Text>{this.state.log}</Text>
        </View>
        <View style={{width: '100%', alignItems: 'center', justifyContent: 'center', paddingBottom: 30}}>
          <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5, marginBottom: 15}]} onPress={() => { 
            if (Platform.OS === 'android') {
              Linking.openURL('https://play.google.com/store/account/subscriptions')
            } else {
              Linking.openURL('https://apps.apple.com/account/subscriptions')
            }
           }}>
            <Text style={styles.loginText}>{translate("CancelSubscription")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { 
            if (Platform.OS === 'android') {
              Linking.openURL('https://apps.apple.com/account/subscriptions')
            } else {
              Linking.openURL('https://play.google.com/store/account/subscriptions')
            }
           }}>
            <Text>{translate("PurchaseComment1")}</Text>
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