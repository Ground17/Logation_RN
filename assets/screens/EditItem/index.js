// 사진을 담는 List 목록 (AddList > AddItem)
import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Linking,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  PermissionsAndroid,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import { TouchableOpacity } from 'react-native-gesture-handler';

import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-crop-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ListItem, Avatar, Button, Input, } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { translate } from '../Utils';

const locations = [[37.551161, 126.988228], [35.658405, 139.745300], [40.689306, -74.044361], [51.500700, -0.124607], [48.858369, 2.294480], [-33.856792, 151.214657], [40.431867, 116.570375]];

export default class EditItem extends Component {
    state = {
      imgWidth: 0,
      imgHeight: 0,
      url: '', // 사진 url
      exURL: '',
      date: new Date(),
      title: '',
      subtitle: '',
      index: 0,
      lat: 37,
      long: 127,
      photo: '',
      list: [], // 전체 update용 list
      changed: false, // 변경된 사항이 있을 경우 true, 이 화면 나갈 때 Alert로 물어보기
      loading: false,
    };
    
    async componentDidMount() {
      this.props.navigation.setOptions({
        title: translate("EditItem"),
        headerRight: () => 
        <View style={{flexDirection: 'row'}}>
            <TouchableOpacity style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 4,
                paddingRight: 4,
              }} onPress={async () => { // 이 사진 삭제
                if (this.state.list.length < 2) {
                  Alert.alert(
                    translate("Alert"), //알림
                    translate("EditItemComment1"), //이 로그를 지우시겠습니까? 이 행동은 돌이킬 수 없습니다.
                    [
                    {text: translate('Cancel'), onPress: () => {  }}, //아니요
                    {text: translate('OK'), onPress: async () => {  //예
                      this.setState({loading: true});
                      try {
                        var array = await storage()
                        .ref(`${auth().currentUser.email}/${this.props.route.params.itemId}`)
                        .listAll();
                        console.log(array._items);
                        for (var i = 0; i < array._items.length; i++) {
                          await array._items[i].delete();
                        }
                        await firestore()
                          .collection(auth().currentUser.email)
                          .doc(this.props.route.params.itemId)
                          .delete();
                      } catch (e) {
                        console.log(e);
                      } finally {
                        this.setState({loading: false});
                        this.props.navigation.replace("Main");
                      }
                    }},
                    ]
                  );
                } else {
                  Alert.alert(
                    translate("Alert"), //알림
                    translate("EditItemComment2"), //이 사진을 지우시겠습니까?
                    [
                    {text: translate('Cancel'), onPress: () => console.log('Cancel Pressed')}, //아니요
                    {text: translate('OK'), onPress: async () => { //예
                      console.log('OK Pressed');
                      this.setState({loading: true});
                      try {
                        await storage()
                        .ref(`${auth().currentUser.email}/${this.props.route.params.itemId}/${this.props.route.params.photo}`)
                        .delete();
                        this.setState({
                          list: this.state.list.filter(data => this.state.list[this.state.index] !== data)
                        });
                        console.log("list", this.state.list);
                        await firestore()
                          .collection(auth().currentUser.email)
                          .doc(this.props.route.params.itemId)
                          .update({
                            data: this.state.list,
                          });
                      } catch (e) {
                        console.log(e);
                      } finally {
                        if (this.state.index == 0) {
                          await firestore()
                          .collection(auth().currentUser.email)
                          .doc(this.props.route.params.itemId)
                          .update({
                            thumbnail: this.state.list[0].photo,
                          });
                        }
                        this.setState({loading: false});
                        this.props.route.params.onPop();
                        this.props.navigation.pop();
                      }
                      }},
                    ],
                    { cancelable: false }
                  );
                }
            }}>
              <Icon
                name="delete"
                size={20}
                color='#fff'
              />
            </TouchableOpacity>
            <TouchableOpacity style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 4,
                paddingRight: 8,
              }} onPress={async () => { // 수정 완료, 기존 창 복귀
                if (this.state.title.length < 1 || this.state.title.subtitle < 1) {
                  Alert.alert(
                    translate('Error'), //오류
                    translate("EditItemComment3"), //빈칸을 채워주세요
                    [
                    {text: translate('OK'), onPress: () => console.log('OK Pressed')},
                    ],
                    { cancelable: false }
                  );
                  return;
                }
                this.setState({loading: true})
                if (this.state.changed) {
                  var updateData = this.state.list;
                  if (this.state.url != this.state.exURL) {
                    try {
                      var filename = this.state.url.split('/');
                      var storageRef = storage().ref(`${auth().currentUser.email}/${this.props.route.params.itemId}/${filename[filename.length - 1]}`);
                      await storageRef.putFile(`${this.state.url}`);
                      await storage()
                        .ref(`${auth().currentUser.email}/${this.props.route.params.itemId}/${this.props.route.params.photo}`)
                        .delete();
                      this.setState({photo: filename[filename.length - 1]});
                    } catch (e) {
                      console.log(e);
                    }
                  }

                  updateData[this.state.index] = {
                    date: this.state.date,
                    lat: this.state.lat,
                    long: this.state.long,
                    photo: this.state.photo,
                    title: this.state.title,
                    subtitle: this.state.subtitle,
                  };
                  
                  firestore()
                  .collection(auth().currentUser.email)
                  .doc(this.props.route.params.itemId)
                  .update({
                    data: updateData,
                    modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                  })
                  .then(async () => {
                    try {
                      await firestore()
                        .collection("Users")
                        .doc(auth().currentUser.email).update({
                          modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                        });

                      if (this.state.index == 0) {
                        await firestore()
                        .collection(auth().currentUser.email)
                        .doc(this.props.route.params.itemId)
                        .update({
                          thumbnail: this.state.photo,
                        });
                      }
                    } catch (e) {
                      console.log(e);
                    } finally {
                      this.props.route.params.onPop();
                      this.props.navigation.pop();
                    }
                  });
                } else {
                  this.props.navigation.pop();
                }
            }}>
              <Icon
                name="check-circle"
                size={20}
                color='#fff'
              />
            </TouchableOpacity>
        </View>
      });

      Image.getSize(this.props.route.params.url, (width, height) => {
        // calculate image width and height 
        const screenWidth = Dimensions.get('window').width
        const scaleFactor = width / screenWidth
        const imageHeight = height / scaleFactor
        this.setState({imgWidth: screenWidth * 0.8, imgHeight: imageHeight * 0.8})
      })

      this.setState({
        date: this.props.route.params.date,
        title: this.props.route.params.title,
        subtitle: this.props.route.params.subtitle,
        url: this.props.route.params.url,
        exURL: this.props.route.params.url,
        photo: this.props.route.params.photo,
        lat: this.props.route.params.lat,
        long: this.props.route.params.long,
        index: this.props.route.params.index,
      });
      
      firestore()
        .collection(auth().currentUser.email)
        .doc(this.props.route.params.itemId)
        .get()
        .then(async (documentSnapshot) => {
          if (documentSnapshot.exists) {
            try {
              console.log('data: ', documentSnapshot.data());
              var data = documentSnapshot.data();
              this.setState({
                list: data.data,
              });
            } catch (error) {
              console.log(error);
            }
          }
        });
    }
    render() {
      console.log(this.props.route.params.url);
      return(
        <SafeAreaView style={styles.container}>
        {this.state.loading ? 
          <View style={styles.buttonContainer}>
              <ActivityIndicator size="large" color="#002f6c" />
              <Text> {translate("EditItemComment4")} </Text>
          </View>
          : <ScrollView 
              contentContainerStyle={styles.viewContainer}
              style={{flex: 1, width: "100%"}}>
            <View style={styles.cellView}>
              <Input
                value = {this.state.title}
                onChangeText = {(title) => this.setState({
                  title: title,
                  changed: true,
                })}
                inputStyle={styles.inputs}
                maxLength={40}
                placeholder='Title'
                placeholderTextColor="#bdbdbd"
                leftIcon={
                  <Icon
                    name='title'
                    size={24}
                    color='#002f6c'
                  />
                }
              />
            </View>
            <Text
              onPress={() => this.setState({show: !this.state.show})}
            > 
              {this.state.date.toString()} 
            </Text>
            {this.state.show && <DateTimePicker
              style={{width: "110%"}}
              mode="date"
              value={this.state.date}
              is24Hour={true}
              display="default"
              onChange={ (event, selectedDate) => {
                var currentDate = selectedDate || new Date();
                if (Platform.OS === 'android') {
                  currentDate.setHours(this.state.date.getHours(), this.state.date.getMinutes(), this.state.date.getSeconds());
                  this.setState({
                    show: false,
                  });
                }
                this.setState({
                  changed: true,
                  date: currentDate,
                });
              }}
            />}
            {this.state.show && <DateTimePicker
              style={{width: "110%"}}
              mode="time"
              value={this.state.date}
              is24Hour={true}
              display="default"
              onChange={ (event, selectedDate) => {
                const currentDate = selectedDate || new Date();
                if (Platform.OS === 'android') {
                  this.setState({
                    show: false,
                  });
                }
                this.setState({
                  changed: true,
                  date: currentDate,
                });
              }}
            /> }
            <View style={{
                alignItems: 'center',
                justifyContent: 'center',
            }}>
              <TouchableOpacity onPress={() => {
                ImagePicker.openPicker({
                  mediaType: 'photo',
                  includeExif: true,
                }).then(image => {
                  try {
                    console.log(image);
                    if (Platform.OS == 'ios') {
                      this.setState({
                        lat: image.exif["{GPS}"].LatitudeRef != "S" ? image.exif["{GPS}"].Latitude : -image.exif["{GPS}"].Latitude,
                        long: image.exif["{GPS}"].LongitudeRef != "W" ? image.exif["{GPS}"].Longitude : -image.exif["{GPS}"].Longitude,
                        changed: true,
                        url: image.path,
                      });
                    } else {
                      // GPSLatitudeRef, GPSLongitudeRef
                      var latitudeStrings = image.exif["GPSLatitude"].split(',');
                      var longitudeStrings = image.exif["GPSLongitude"].split(',');
                      
                      var latitudeD = latitudeStrings[0].split('/');
                      var latitudeM = latitudeStrings[1].split('/');
                      var latitudeS = latitudeStrings[2].split('/');

                      var longitudeD = longitudeStrings[0].split('/');
                      var longitudeM = longitudeStrings[1].split('/');
                      var longitudeS = longitudeStrings[2].split('/');

                      var latitude = parseInt(latitudeD[0]) / parseInt(latitudeD[1]) + (parseInt(latitudeM[0]) / parseInt(latitudeM[1]) / 60) + (parseInt(latitudeS[0]) / parseInt(latitudeS[1]) / 3600);
                      var longitude = parseInt(longitudeD[0]) / parseInt(longitudeD[1]) + (parseInt(longitudeM[0]) / parseInt(longitudeM[1]) / 60) + (parseInt(longitudeS[0]) / parseInt(longitudeS[1]) / 3600);

                      if (image.exif["GPSLatitudeRef"] == "S") { latitude = -latitude; }
                      if (image.exif["GPSLongitudeRef"] == "W") { longitude = -longitude; }

                      this.setState({
                        lat: latitude,
                        long: longitude,
                        changed: true,
                        url: image.path,
                      });
                    }
                  } catch (e) { // location data가 없는 것으로 추정
                    console.log(e);
                    var random = Math.floor(Math.random() * locations.length);
                    this.setState({
                      lat: locations[random][0],
                      long: locations[random][1],
                      changed: true,
                      url: image.path,
                    });
                  } 
                });
              }}>
              <FastImage
                style={{width: this.state.imgWidth, height: this.state.imgHeight}}
                source={{ 
                  uri: this.state.url,
                  priority: FastImage.priority.high,
                  }}
              />
              </TouchableOpacity>
            </View>
            <View style={styles.cellView}>
              <Input
                multiline
                value = {this.state.subtitle}
                onChangeText = {(subtitle) => this.setState({
                  subtitle: subtitle,
                  changed: true,
                })}
                inputStyle={styles.inputs}
                maxLength={140}
                placeholder='Subtitle'
                placeholderTextColor="#bdbdbd"
                leftIcon={
                  <Icon
                    name='subtitles'
                    size={24}
                    color='#002f6c'
                  />
                }
              />
            </View>
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
                latitude: this.state.lat,
                longitude: this.state.long,
                latitudeDelta: 0.922,
                longitudeDelta: 0.421,
              }}
            >
              <Marker
                draggable
                onDragEnd={(e) => this.setState({ 
                  lat: e.nativeEvent.coordinate.latitude, 
                  long: e.nativeEvent.coordinate.longitude, 
                  changed: true,
                })}
                coordinate={ {latitude: this.state.lat, longitude: this.state.long} }
                title={this.props.route.params.title}
                onPress={e => console.log(e.nativeEvent)}
              />
            </MapView>
          </ScrollView>}
        </SafeAreaView>
      );
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      justifyContent: 'space-between',
    },
    viewContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    loginText: {
      color: 'white',
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