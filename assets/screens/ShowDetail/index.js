import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Appearance,
  Linking,
} from 'react-native';

import { ListItem, Divider, Input, Avatar, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';

import FastImage from 'react-native-fast-image';

import { translate } from '../Utils';

export default class ShowDetail extends Component {
  async componentDidMount() {
    this.props.navigation.setOptions({ title: "/// 세부정보 ///" });
  }

  render() {
    return(
      <SafeAreaView style={styles.container}>
        <View style={{width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
          <Text>
            {this.props.route.params.title}
          </Text>
          <Text>
            {this.props.route.params.subtitle}
          </Text>
          <Text>
            {`///날짜: ${this.props.route.params.date}`}
          </Text>
          <Text>
            {`///수정일: ${this.props.route.params.modifyDate}`}
          </Text>
          <TouchableOpacity onPress={async () => { 
            try {
              const supported = await Linking.canOpenURL(this.props.route.params.link);

              if (supported) {
                Alert.alert(
                  translate("Confirm"),
                  translate("LaunchConfirm") + this.props.route.params.link,
                  [
                  {text: translate('Cancel'), onPress: () => { }},
                  {text: translate('OK'), onPress: async () => {
                    await Linking.openURL(this.props.route.params.link);
                  }},
                  ],
                  { cancelable: false }
                );
              } else {
                Alert.alert(translate("ShowItemAndShowScreen") + (this.props.route.params.link || "undefined"));
              }
            } catch (e) {
              Alert.alert(translate("ShowItemAndShowScreen") + (this.props.route.params.link || "undefined"));
            }
            
          }}>
            <View style={{alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row',}}>
              <Text>
                {"/// 관련 링크 ///"}
              </Text>
              <Icon
                reverse
                name='launch'
                color='#bdbdbd'
                size={25}
              />
              <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("Launch")} </Text>
            </View>
          </TouchableOpacity>
          <Text>
            {this.props.route.params.viewCount}
          </Text>
          <ListItem
            containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff'}}
            onPress={() => { 
              if (this.props.route == null) {
                this.props.navigation.push('Me', {
                  other: true,
                  userUid: this.props.route.params.userUid,
                });
              }
            }}
          >
            <View style={{flex:1/5, aspectRatio:1}}>
              <FastImage
                style={{flex: 1, borderRadius: 100}}
                source={this.props.route.params.profileURL ? {
                    uri:
                    this.props.route.params.profileURL,
                } : require('./../../logo/ic_launcher.png')}
              />
            </View>
            <ListItem.Content>
              <ListItem.Title style={{fontWeight: 'bold', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                {this.props.route.params.displayName}
              </ListItem.Title>
              <ListItem.Subtitle style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                {this.props.route.params.userUid}
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
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
});