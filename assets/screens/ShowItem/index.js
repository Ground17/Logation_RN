// 사진을 담는 List 목록 (AddList > AddItem)
import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Linking,
  ScrollView,
  Image,
  Dimensions,
  PermissionsAndroid,
  Appearance,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import { TouchableOpacity } from 'react-native-gesture-handler';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button, } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { translate } from '../Utils';

export default class ShowItem extends Component {
    state = {
      imgWidth: 0,
      imgHeight: 0,
    };
    
    async componentDidMount() {
      this.props.navigation.setOptions({
        title: translate("ShowItem"),
        headerRight: () => 
        <View style={{flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',}}>
            <TouchableOpacity style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 5,
                paddingRight: 5,
              }} onPress={async () => { 
                const supported = await Linking.canOpenURL(this.props.route.params.link);

                if (supported) {
                  // Opening the link with some app, if the URL scheme is "http" the web link should be opened
                  // by some browser in the mobile
                  await Linking.openURL(this.props.route.params.link);
                } else {
                  Alert.alert(translate("ShowItemAndShowScreen") + this.props.route.params.link);
                }
              }}>
              <Icon
                name="launch"
                size={24}
                color='#fff'
              />
            </TouchableOpacity>
            {
              auth().currentUser.email == this.props.route.params.userEmail ? 
                <TouchableOpacity style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: 5,
                    paddingRight: 20,
                  }} onPress={() => {
                  this.props.navigation.push('EditItem', {
                    date: this.props.route.params.date,
                    title: this.props.route.params.title,
                    subtitle: this.props.route.params.subtitle,
                    userEmail: this.props.route.params.userEmail,
                    itemId: this.props.route.params.itemId,
                    url: this.props.route.params.url,
                    lat: this.props.route.params.lat,
                    long: this.props.route.params.long,
                    photo: this.props.route.params.photo,
                    index: this.props.route.params.index,
                    onPop: () => {
                      this.props.route.params.onPop();
                      this.props.navigation.pop();
                    },
                  });
                }}>
                  <Icon
                    name="edit"
                    size={24}
                    color='#fff'
                  />
                </TouchableOpacity>
              : <View style={{paddingRight: 15}}></View>
            }
        </View>
      });

      Image.getSize(this.props.route.params.url, (width, height) => {
        // calculate image width and height 
        const screenWidth = Dimensions.get('window').width
        const scaleFactor = width / screenWidth
        const imageHeight = height / scaleFactor
        this.setState({imgWidth: screenWidth * 0.8, imgHeight: imageHeight * 0.8})
      })

      // var storageRef = storage().ref();
      
      // firestore()
      //   .collection(auth().currentUser.email)
      //   .doc(this.props.route.params.itemId)
      //   .get()
      //   .then(async (documentSnapshot) => {
      //     if (documentSnapshot.exists) {
      //       console.log('data: ', documentSnapshot.data());
      //       data = documentSnapshot.data();
      //       for (var i=0; i < data.data.length; i++) {
      //         try {
                
      //         } catch (error) {
      //             console.log(error);
      //         }
      //       }
      //     }
      //   });
    }
    render() {
      console.log(this.props.route.params.url);
      return(
        <SafeAreaView style={styles.container}>
          <ScrollView style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
            <Text style={[styles.titleText, {color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}]}>
              {this.props.route.params.title}
            </Text>
            <Text style={[styles.text, {color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}]}>
              {this.props.route.params.date.toString()}
            </Text>
            <View style={{
                alignItems: 'center',
                justifyContent: 'center',
            }}>
              <TouchableOpacity onPress={() => {
                
              }}>
              <FastImage
                style={{width: this.state.imgWidth, height: this.state.imgHeight}}
                source={{ 
                  uri: this.props.route.params.url,
                  priority: FastImage.priority.high,
                  }}
              />
              </TouchableOpacity>
            </View>
            <Text style={[styles.text, {marginBottom: 10, marginTop: 10, fontSize: 18, color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}]}>
              {this.props.route.params.subtitle}
            </Text>
            <MapView
              style={{flex: 1, width: "100%", height: 500}}
              provider={PROVIDER_GOOGLE} // remove if not using Google Maps
              onMapReady={() => {
                Platform.OS === 'android' ? PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) : ''
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              region={{
                latitude: this.props.route.params.lat,
                longitude: this.props.route.params.long,
                latitudeDelta: 0.922,
                longitudeDelta: 0.421,
              }}
            >
              <Marker
                coordinate={ {latitude: this.props.route.params.lat, longitude: this.props.route.params.long} }
                title={this.props.route.params.title}
                onPress={e => console.log(e.nativeEvent)}
              />
            </MapView>
          </ScrollView>
        </SafeAreaView>
      );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
        justifyContent: 'space-between',
    },
    titleText: {
      fontSize: 24,
      fontWeight: "bold",
      marginLeft: 10,
      marginTop: 10,
    },
    text: {
      marginLeft: 10,
    },
});