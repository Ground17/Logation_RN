import React, { Component, createContext, useState, useEffect,}  from 'react';
import * as RNLocalize from 'react-native-localize';
import i18n from 'i18n-js';
import memoize from 'lodash.memoize';
import { SafeAreaView, StyleSheet, View, Text, Alert, Platform, Appearance, Dimensions, } from 'react-native';
import RNIap, {
  purchaseErrorListener,
  purchaseUpdatedListener,
  type ProductPurchase,
  type PurchaseError
} from 'react-native-iap';

import AsyncStorage from '@react-native-community/async-storage';

import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';

const itemSkus = [
  'adfree_for_1month',
  'adfree_for_1year'
]

const APP_LANGUAGE = 'appLanguage';
const DEFAULT_LANGUAGE = 'en';

var adsFree = false;

// const adBannerUnitId = __DEV__ ? TestIds.BANNER : 
//     (Platform.OS == 'ios' 
//     ? 'ca-app-pub-1477690609272793/3050510769' 
//     : 'ca-app-pub-1477690609272793/8274029234');

// const adInterstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : 
//     (Platform.OS == 'ios' 
//     ? 'ca-app-pub-1477690609272793/3775880012' 
//     : 'ca-app-pub-1477690609272793/9626786110');

const adBannerUnitId = Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3050510769' 
    : 'ca-app-pub-1477690609272793/8274029234';

const adInterstitialUnitId = Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3775880012' 
    : 'ca-app-pub-1477690609272793/9626786110';

const translationGetters = {
  en: () => require('../../translations/en.json'), // 영어
  ko: () => require('../../translations/ko.json'), // 한국어
  ja: () => require('../../translations/ja.json'), // 일본어
  zh: () => require('../../translations/zh.json'), // 중국어
  es: () => require('../../translations/es.json'), // 스페인어
  pt: () => require('../../translations/pt.json'), // 포르투갈어
  fr: () => require('../../translations/fr.json'), // 프랑스어
  de: () => require('../../translations/de.json') // 독일어
};

const translate = memoize(
  (key, config) => i18n.t(key, config),
  (key, config) => (config ? key + JSON.stringify(config) : key)
);

const LocalizationContext = createContext({
  setAppLanguage: () => {},
  appLanguage: DEFAULT_LANGUAGE,
  initializeAppLanguage: () => {},
});

const LocalizationProvider = ({ children }) => {
  const [appLanguage, setAppLanguage] = useState(DEFAULT_LANGUAGE);

  const setLanguage = async language => {
    console.log("language", language);
    setAppLanguage(language);
    translate.cache.clear();
    i18n.translations = { [language]: translationGetters[language]() };
    i18n.locale = language;
    await AsyncStorage.setItem(APP_LANGUAGE, language);
    await messaging().subscribeToTopic(language).then(() => console.log('Subscribed to topic!'));
    // adsFree = await getPurchases(); /// 인앱이 구현되었을시 주석 해제!!!
  };

  const initializeAppLanguage = async () => {
    const currentLanguage = await AsyncStorage.getItem(APP_LANGUAGE);

    if (!currentLanguage) {
      const fallback = { languageTag: DEFAULT_LANGUAGE };
      const { languageTag } =
        RNLocalize.findBestAvailableLanguage(Object.keys(translationGetters)) ||
        fallback;
      setLanguage(languageTag);
    } else {
      setLanguage(currentLanguage);
    }
  };

  return (
    <LocalizationContext.Provider
      value={{
        setAppLanguage: setLanguage,
        appLanguage,
        initializeAppLanguage,
      }}>
      {children}
    </LocalizationContext.Provider>
  );
};

const getPurchases = async () => {
  var result = false;

  try {
    /// check android below
    if (Platform.OS === 'android') {
      const purchases = await RNIap.getAvailablePurchases();
      console.log("purchases", purchases);

      for (var i=0; i < purchases.length; i++) {
        if (purchases[i].productId == itemSkus[0] || purchases[i].productId == itemSkus[1]) {
          await functions()
            .httpsCallable('validateReceiptIAP')({receipt: purchases[i].transactionReceipt})
            .then(async response => {
              console.log(response);
              if (response.data.result) {
                result = true;
              } else {
                result = result || false;
              }
            }).catch((error) => {
              console.log(error);
            });
        }
      }
    } else {
      await functions()
        .httpsCallable('validateReceiptIAP')()
        .then(async response => {
          console.log(response);
          if (response.data.result) {
            result = true;
          } else {
            result = result || false;
          }
        }).catch((error) => {
          console.log(error);
        });
    }
    
  } catch (e) {
    console.log(e);
  } finally {
    console.log("result", result);
    return result;
  }
};

const getlocalizedPrice = async () => {
  try {
    const products: Product[] = await RNIap.getSubscriptions(itemSkus);
    var local = { month: '', year: '' };
    for (var i=0; i<products.length; i++) {
      if (products[i].productId == 'adfree_for_1month') {
        local.month = `${products[i].title} (${products[i].localizedPrice})`;
      } else {
        local.year = `${products[i].title} (${products[i].localizedPrice})`;
      }
    }
    return local;
  } catch(err) {
    console.warn(err);
  }
};

const ProgressBar = (props) => {
  const { bgcolor, completed } = props;

  const containerStyles = {
    height: 20,
    width: '100%',
    backgroundColor: "#e0e0de",
    borderRadius: 50,
    margin: 50
  }

  const fillerStyles = {
    height: '100%',
    width: `${completed}%`,
    backgroundColor: bgcolor,
    borderRadius: 50,
  }

  const labelStyles = {
    padding: 5,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'right'
  }

  return (
    <View style={containerStyles}>
      <View style={fillerStyles}>
        <Text style={labelStyles}>{`${completed}%`}</Text>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = 200;
const CARD_WIDTH = width * 0.8;
const SPACING_FOR_CARD_INSET = width * 0.1 - 10;

const TAB_ITEM_WIDTH = width / 5;

const Style = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
      justifyContent: 'space-between',
    },
    floatingViewStyle: {
      width: "100%",
      height: "9%",
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(52, 52, 52, 0.8)',
    },
});

export {
  translationGetters,
  translate,
  getPurchases,
  getlocalizedPrice,
  LocalizationContext,
  LocalizationProvider,
  adsFree,
  ProgressBar,
  adBannerUnitId,
  adInterstitialUnitId,
  TAB_ITEM_WIDTH,
  Style,
}
