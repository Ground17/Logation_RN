import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Alert, Appearance } from 'react-native';
import { translationGetters, LocalizationContext, translate } from '../Utils';
// import * as RNLocalize from 'react-native-localize';
import { ListItem } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import RNRestart from 'react-native-restart';

export default Language = ({navigation}) => {
  const {appLanguage, setAppLanguage} = useContext(
    LocalizationContext,
  );

  const handleSetLanguage = async language => {
    await setAppLanguage(language);
    RNRestart.Restart();
  };

  useEffect(() => {
    navigation.setOptions({ title: translate("Language") });
  }, []);

  const alert = language => {
    Alert.alert(
      translate("Confirm"),
      translate("LanguageComment1") + translate(language),
      [
          {text: translate('Cancel'), onPress: () => {}},
          {text: translate('OK'), onPress: () => { handleSetLanguage(language); }},
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
        {Object.keys(translationGetters).map(item => (
          <View key={item} style={{width: "100%"}}>
            <ListItem
              containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
              title={translate(item)}
              titleStyle={{ fontWeight: 'bold', color: Appearance.getColorScheme() === 'dark' ? "#fff" : "#000" }}
              rightIcon={appLanguage == item ? (
                <Icon 
                name='check-circle'
                size={24}
                color={Appearance.getColorScheme() === 'dark' ? "#fff" : '#002f6c'} />
              ) : null}
              bottomDivider
              onPress={() => { 
                alert(item);
              }}
            />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
    },
});