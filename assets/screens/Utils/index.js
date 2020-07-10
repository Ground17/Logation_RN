import React, { Component, createContext, useState, useEffect }  from 'react';
import * as RNLocalize from 'react-native-localize';
import i18n from 'i18n-js';
import memoize from 'lodash.memoize';
import { SafeAreaView, StyleSheet, Text, Alert, Platform } from 'react-native';
import RNIap, {
  purchaseErrorListener,
  purchaseUpdatedListener,
  type ProductPurchase,
  type PurchaseError
} from 'react-native-iap';

import AsyncStorage from '@react-native-community/async-storage';

import functions from '@react-native-firebase/functions';

const itemSkus = [
  'adfree_for_1month',
  'adfree_for_1year'
]

const APP_LANGUAGE = 'appLanguage';
const DEFAULT_LANGUAGE = 'en';

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

  const setLanguage = language => {
    console.log("language", language);
    setAppLanguage(language);
    translate.cache.clear();
    i18n.translations = { [language]: translationGetters[language]() };
    i18n.locale = language;
    AsyncStorage.setItem(APP_LANGUAGE, language);
  };

  const initializeAppLanguage = async () => {
    console.log("language");
    const currentLanguage = await AsyncStorage.getItem(APP_LANGUAGE);

    if (!currentLanguage) {
      const fallback = { languageTag: DEFAULT_LANGUAGE };
      const { languageTag } =
        RNLocalize.findBestAvailableLanguage(Object.keys(translationGetters)) ||
        fallback;
      // let localeCode = DEFAULT_LANGUAGE;
      // const supportedLocaleCodes = Object.keys(translationGetters);
      // const phoneLocaleCodes = RNLocalize.getLocales().map(
      //   locale => locale.languageCode,
      // );
      // phoneLocaleCodes.some(code => {
      //   if (supportedLocaleCodes.includes(code)) {
      //     localeCode = code;
      //     return true;
      //   }
      // });
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
  try {
    /// check anroid below
    // await RNIap.getSubscriptions(itemSkus);
    // const purchases = await RNIap.getAvailablePurchases();

    var result = false;

    functions()
      .httpsCallable('validateReceiptIAP')()
      .then(response => {
        console.log(response);
        if (response.result) {
          result = true;
        } else {
          result = result || false;
        }
      }).catch((error) => {
        console.log(error);
      });
  } catch (e) {
    console.log(e);
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

export {
  translationGetters,
  translate,
  getPurchases,
  getlocalizedPrice,
  LocalizationContext,
  LocalizationProvider
}