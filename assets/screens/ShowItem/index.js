// 사진을 담는 List 목록 (AddList > AddItem)
import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Linking,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  PermissionsAndroid,
  Appearance,
  Platform,
} from 'react-native';

// import FastImage from 'react-native-fast-image';
import ImageModal from 'react-native-image-modal';

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

export default class ShowItem extends Component {
    state = {
      edit: false,
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
      thumbnail: 0,
    };
    
    async componentDidMount() {
      this.props.navigation.setOptions({
        title: translate("ShowItem"),
        headerRight: () => 
        <View style={{flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',}}>
            { auth().currentUser.uid == this.props.route.params.userUid ?
              <TouchableOpacity style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 5,
                  paddingRight: 5,
                }} onPress={async () => { 
                  if (supported) {
                    Alert.alert(
                      translate("Confirm"),
                      translate("Thumbnail"),
                      [
                      {text: translate('Cancel'), onPress: () => { }},
                      {text: translate('OK'), onPress: async () => {
                        this.setState({
                          thumbnail: this.state.index,
                          changed: true,
                        });
                      }},
                      ],
                      { cancelable: true }
                    );
                  }
                }}>
                <Icon
                  name='face'
                  size={24}
                  color='#fff'
                />
              </TouchableOpacity>
            : <View style={{paddingRight: 15}}></View> }
            <TouchableOpacity style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 5,
                paddingRight: 5,
              }} onPress={async () => { 
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
              <Icon
                name='launch'
                size={24}
                color='#fff'
              />
            </TouchableOpacity>
            {
              auth().currentUser.uid == this.props.route.params.userUid ? 
                <TouchableOpacity style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: 5,
                    paddingRight: 20,
                  }} onPress={async () => {
                  // this.props.navigation.push('EditItem', {
                  //   date: this.props.route.params.date,
                  //   title: this.props.route.params.title,
                  //   subtitle: this.props.route.params.subtitle,
                  //   userUid: this.props.route.params.userUid,
                  //   itemId: this.props.route.params.itemId,
                  //   url: this.props.route.params.url,
                  //   lat: this.props.route.params.lat,
                  //   long: this.props.route.params.long,
                  //   photo: this.props.route.params.photo,
                  //   index: this.props.route.params.index,
                  //   onPop: () => {
                  //     this.props.route.params.onPop();
                  //     this.props.navigation.pop();
                  //   },
                  // });

                  if (!this.state.changed) {
                    if (this.state.list.length < 2) { // 삭제
                      Alert.alert(
                        translate("Alert"), //알림
                        translate("EditItemComment1"), //이 로그를 지우시겠습니까? 이 행동은 돌이킬 수 없습니다.
                        [
                        {text: translate('Cancel'), onPress: () => {  }}, //아니요
                        {text: translate('OK'), onPress: async () => {  //예
                          this.setState({loading: true});
                          try {
                            var array = await storage()
                            .ref(`${auth().currentUser.uid}/${this.props.route.params.itemId}`)
                            .listAll();
                            console.log(array._items);
                            for (var i = 0; i < array._items.length; i++) {
                              await array._items[i].delete();
                            }
                            await firestore()
                              .collection(auth().currentUser.uid)
                              .doc(this.props.route.params.itemId)
                              .delete();
                          } catch (e) {
                            console.log(e);
                          } finally {
                            this.setState({loading: false});
                            this.props.navigation.reset({
                              index: 0,
                              routes: [{name: 'Main'}]
                            });
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
                            .ref(`${auth().currentUser.uid}/${this.props.route.params.itemId}/${this.props.route.params.photo}`)
                            .delete();
                            this.setState({
                              list: this.state.list.filter(data => this.state.list[this.state.index] !== data)
                            });
                            console.log("list", this.state.list);
                            await firestore()
                              .collection(auth().currentUser.uid)
                              .doc(this.props.route.params.itemId)
                              .update({
                                data: this.state.list,
                              });
                          } catch (e) {
                            console.log(e);
                          } finally {
                            if (this.state.thumbnail == this.state.index) {
                              await firestore()
                              .collection(auth().currentUser.uid)
                              .doc(this.props.route.params.itemId)
                              .update({
                                thumbnail: 0,
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
                  } else { // 수정 저장
                    if (this.state.title.length < 1) {
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
                    var updateData = this.state.list;
                    if (this.state.url != this.state.exURL) {
                      try {
                        var filename = this.state.url.split('/');
                        var storageRef = storage().ref(`${auth().currentUser.uid}/${this.props.route.params.itemId}/${filename[filename.length - 1]}`);
                        await storageRef.putFile(`${this.state.url}`);
                        await storage()
                          .ref(`${auth().currentUser.uid}/${this.props.route.params.itemId}/${this.props.route.params.photo}`)
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
                    .collection(auth().currentUser.uid)
                    .doc(this.props.route.params.itemId)
                    .update({
                      data: updateData,
                      modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                    })
                    .then(async () => {
                      try {
                        await firestore()
                          .collection("Users")
                          .doc(auth().currentUser.uid).update({
                            modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                          });

                        if (this.state.thumbnail == this.state.index) {
                          await firestore()
                          .collection(auth().currentUser.uid)
                          .doc(this.props.route.params.itemId)
                          .update({
                            thumbnail: this.state.index,
                          });
                        }
                      } catch (e) {
                        console.log(e);
                      } finally {
                        this.props.route.params.onPop();
                      }
                    });
                  }
                  
                }}>
                  <Icon
                    name={!this.state.changed ? "delete" : "check-circle"}
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
        list: this.props.route.params.list,
      });

      // var storageRef = storage().ref();
      
      // firestore()
      //   .collection(auth().currentUser.uid)
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
          {this.state.loading ? 
            <View style={[styles.buttonContainer, {backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff', width: "100%", height: "100%"}]}>
                <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
                <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("EditItemComment4")} </Text>
            </View>
          : <ScrollView 
                contentContainerStyle={styles.viewContainer}
                style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>

              {auth().currentUser.uid != this.props.route.params.userUid ?
                <Text style={[styles.titleText, {color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}]}>
                  {this.props.route.params.title}
                </Text>
                : <View style={styles.cellView}>
                    <Input
                      multiline
                      value = {this.state.title}
                      onChangeText = {(title) => this.setState({
                        title: title,
                        changed: true,
                      })}
                      inputStyle={styles.inputs}
                      maxLength={140}
                      placeholder={translate('Title')}
                      placeholderTextColor="#bdbdbd"
                      leftIcon={
                        <Icon
                          name='title'
                          size={24}
                          color={Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c'}
                        />
                      }
                    />
                  </View>
              }
              <Text 
                style={[styles.text, {color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}]}
                onPress={() => this.setState({show: !this.state.show})}
              >
                {this.props.route.params.date.toString()}
              </Text>
              {this.state.show && <DateTimePicker
                style={{width: "100%"}}
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
                style={{width: "100%"}}
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
                  if (auth().currentUser.uid == this.props.route.params.userUid) {
                    ImagePicker.openPicker({
                      width: 1024,
                      height: 1024,
                      cropping: true,
                      mediaType: 'photo',
                      includeExif: true,
                    }).then(image => {
                      console.log(image);
                      this.setState({
                        changed: true,
                        url: image.path,
                      });
                    });
                  }
                }}>
                <ImageModal
                  imageBackgroundColor="#000000"
                  style={{width: this.state.imgWidth, height: this.state.imgHeight}}
                  source={{ 
                    uri: this.state.url,
                  }}
                />
                </TouchableOpacity>
              </View>
              <MapView
                style={{flex: 1, aspectRatio: 1, width: "100%"}}
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
                  draggable={auth().currentUser.uid == this.props.route.params.userUid}
                  onDragEnd={(e) => this.setState({ 
                    lat: e.nativeEvent.coordinate.latitude, 
                    long: e.nativeEvent.coordinate.longitude, 
                    changed: true,
                  })}
                  anchor={{x: 0.5, y: 0.5}}
                  coordinate={ {latitude: this.props.route.params.lat, longitude: this.props.route.params.long} }
                  title={this.props.route.params.title}
                  onPress={e => console.log(e.nativeEvent)}
                >
                  <View>
                    <FastImage
                      style={{ height: 75, width:75 }}
                      source={{ 
                        uri: '',
                      }}
                    />
                  </View>
                </Marker>
              </MapView>
          </ScrollView>}
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
      borderBottomColor: Appearance.getColorScheme() === 'dark' ? "#fff" : '#002f6c',
      flex:1,
      color: Appearance.getColorScheme() === 'dark' ? "#fff" : '#002f6c',
    },
    buttonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom:5,
    },
    titleText: {
      fontSize: 24,
      marginLeft: 10,
      marginTop: 10,
    },
    text: {
      marginLeft: 10,
    },
});