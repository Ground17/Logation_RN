// 사진을 담는 List 목록 (AddList > AddItem)
import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
  TouchableHighlight,
  PermissionsAndroid,
  Appearance,
  Animated,
  Dimensions,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import { TouchableOpacity } from 'react-native-gesture-handler';

import DraggableFlatList from "react-native-draggable-flatlist"; // important!!!

import Share from 'react-native-share';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import AsyncStorage from '@react-native-community/async-storage';

import { translate, } from '../Utils';

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height * 0.7;
const CARD_WIDTH = width * 0.8;
const SPACING_FOR_CARD_INSET = width * 0.1 - 10;

const TAB_ITEM_WIDTH = width / 5;

let showing = false; // 슬라이드쇼 진행중...
let showIndex = 0; // 슬라이드쇼 진행 index

export default class ShowScreen extends Component {
    state = {
      edit: false,
      viewcode: 0,
      list: [], // 수정할 때 사용, 사진 url 포함
      data: [], // 기본 데이터
      changed: false,
      delete: false, // true: delete, false: edit
      lat: 37,
      long: 127,
      latDelta: 0.922,
      longDelta: 0.421,
      category: 0,
      date: firestore.Timestamp.fromMillis((new Date()).getTime()),
      modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
      title: '',
      subtitle: '',
      link: '',
      liked: false,
      disliked: false,
      loading: false,
      smallLoading: false, // 좋아요 트랜잭션을 위한 것
      likeNumber: false,
      likeCount: 0,
      dislikeCount: 0,
      viewCount: 0,
      marginBottom: 1,
      thumbnail: 0,
      userUid: '',
      displayName: '',
      profileURL: '',
      preUser: [],
      _map: React.createRef(),
      _scrollView: React.createRef(),
    };

    async update() {
      // if (!this.state.edit) {
      //   return;
      // }

      if (this.state.changed) {
        this.setState({
          loading: true,
        });

        let updateData = [];

        for (var i = 0; i < this.state.list.length; i++) {
          updateData.push({
            date: this.state.list[i].date,
            title: this.state.list[i].title,
            changed: this.state.list[i].changed,
            photo: this.state.list[i].photo,
            lat: this.state.list[i].lat,
            long: this.state.list[i].long,
          });
        }

        let meRef = firestore().collection("Users").doc(auth().currentUser.uid);
        let postRef = firestore().collection("Posts").doc(this.props.route.params.itemId);

        await firestore().runTransaction(async t => {
            const me = await t.get(meRef);
            const post = await t.get(postRef);
            const log = await t.get(logRef);
            const now = firestore.Timestamp.fromMillis((new Date()).getTime());

            t.update(meRef, {
              modifyDate: now,
            });

            t.update(postRef, {
              thumbnail: 0,
              viewcode: this.state.viewcode,
              data: updateData,
              modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
            });
        })
        .then(() => {
          console.log('Transaction success!');
        })
        .catch((e) => {
          console.log('Transaction failure:', e);
        });

        this.setState({
          loading: false,
          changed: false,
          edit: false,
          data: updateData,
        });
      }
    }


    goEditList() {
      this.setState({edit: false, changed: false,});
      this.props.navigation.push('AddList', {
        edit: true,
        category: this.state.category,
        date: this.state.date.toDate(),
        title: this.state.title,
        subtitle: this.state.subtitle,
        link: this.state.link,
        photoNumber: this.state.list.length,
        itemId: this.props.route.params.itemId,
        viewcode: this.state.viewcode,
        preData: this.state.data,
        preUser: this.state.preUser,
        onPop: () => this.refresh(true),
      });
    }

    goShowItem(item, index) {
      this.setState({edit: false, changed: false,});
      this.props.navigation.push('ShowItem', {
        date: item.date.toDate(),
        title: item.title,
        userUid: this.state.userUid,
        itemId: this.props.route.params.itemId,
        url: item.url,
        lat: item.lat,
        long: item.long,
        photo: item.photo,
        index: index,
        link: this.state.link,
        list: this.state.list,
        thumbnail: this.state.thumbnail,
        changed: item.changed,
        onPop: () => this.refresh(true),
      });
    }

    alertDelete(item) {
      if (this.state.list.length < 2) {
        Alert.alert(
          translate('Alert'), //알림
          translate('EditScreenComment2'), //이 기록을 지우시겠습니까? 지우시면 다시 복구할 수 없습니다.
          [
              {text: translate('Cancel'), onPress: () => {  }},
              {text: translate('OK'), onPress: async () => {
                  this.setState({loading: true});
                  try {
                    console.log("delete");

                    let meRef = firestore().collection("Users").doc(auth().currentUser.uid);
                    let postRef = firestore().collection("Posts").doc(this.props.route.params.itemId);
                    let logRef = meRef.collection("log").doc(this.props.route.params.itemId);

                    await meRef.update({data: firestore.FieldValue.delete()});

                    let array = await storage()
                    .ref(`${auth().currentUser.uid}/${this.props.route.params.itemId}`)
                    .listAll();

                    for (let i = 0; i < array._items.length; i++) {
                      await array._items[i].delete();
                    }

                    await firestore().runTransaction(async t => {
                        const me = await t.get(meRef);
                        const post = await t.get(postRef);
                        const log = await t.get(logRef);
                        const now = firestore.Timestamp.fromMillis((new Date()).getTime());

                        t.update(meRef, {
                            logsLength: firestore.FieldValue.increment(-1),
                            modifyDate: now,
                        });

                        t.delete(postRef);
                        t.delete(logRef);
                    })
                    .then(() => {
                        console.log('Transaction success!');
                    })
                    .catch((e) => {
                      console.log('Transaction failure:', e);
                    });
                  } catch (e) {
                    console.log(e);
                  } finally {
                    this.setState({loading: false});
                    this.props.navigation.reset({
                      index: 0,
                      routes: [{name: 'Main'}]
                    });
                  }
                }
              },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          translate('Confirm'), //확인
          translate('EditScreenComment3'), // 사진을 지우시겠습니까?
          [
              {text: translate('Cancel'), onPress: () => {  }},
              {
                text: translate('OK'), onPress: async () => {
                  console.log(item);
                  this.setState({
                    list: this.state.list.filter(data => item !== data),
                    changed: true,
                  });
                }
              },
          ],
          { cancelable: false }
        );
      }
    }

    async refresh(force=false) { // 보기 모드에서만 활성화
      if (this.state.edit) {
        return;
      }

      this.setState({
        changed: false, // 변경된 사항이 있을 경우 true, 이 화면 나갈 때 Alert로 물어보기
        liked: false,
        disliked: false,
        loading: true,
        likeNumber: false,
        delete: false, // true: delete, false: edit
        edit: false,
        marginBottom: 1,
      });

      if (this.state.data.length == 0 || force) {
        let documentSnapshot = await firestore()
        .collection("Posts")
        .doc(this.props.route.params.itemId)
        .get();
        
        if (documentSnapshot.exists) {
          const data = documentSnapshot.data();
          if (data.hasOwnProperty('data') && data.data.length > 0) {

            if (data.security == 2 && data.uid != auth().currentUser.uid && !data.account.includes(auth().currentUser.uid)) { // 비공개 로그
              Alert.alert(
                translate('Alert'), // 알림
                translate('ShowScreenComment3'), // 권한이 없습니다.
                [
                    {
                      text: translate('OK'),
                      onPress: async () => {
                        console.log("OK");
                      }
                    },
                ],
                { cancelable: true }
              );
              
              this.props.navigation.pop();
              return;
            }

            this.setState({
              data: data.data,
              viewcode: data.viewcode,
              link: data.link,
              lat: data.data[0].lat,
              long: data.data[0].long,
              latDelta: 0.922,
              longDelta: 0.421,
              category: data.category,
              modifyDate: data.modifyDate,
              date: data.date,
              title: data.title,
              subtitle: data.subtitle,
              likeCount: data.likeCount,
              dislikeCount: data.dislikeCount,
              viewCount: data.viewCount,
              likeNumber: data.likeNumber,
              userUid: data.uid,
              preUser: data.account,
              thumbnail: data.thumbnail,
            });
          } else {
            this.setState({
              data: [],
            });
          }
        } else {
          Alert.alert(
            translate('Alert'), // 알림
            translate('ShowScreenComment1'), // 유효한 로그가 아닙니다.
            [
                {
                  text: translate('OK'),
                  onPress: async () => {
                    console.log("OK");
                  }
                },
            ],
            { cancelable: true }
          );
          this.props.navigation.pop();
          return;
        }
      }

      if (this.state.data.length == 0) {
        Alert.alert(
          translate('Alert'), // 알림
          translate('ShowScreenComment1'), // 유효한 로그가 아닙니다.
          [
              {
                text: translate('OK'),
                onPress: async () => {
                  console.log("OK");
                  this.alertDelete();
                }
              },
          ],
          { cancelable: true }
        );
        return;
      }

      await firestore() // view 관련
        .collection(`Users/${auth().currentUser.uid}/viewLog`)
        .doc(this.props.route.params.itemId)
        .get()
        .then(async (documentSnapshot) => {
          const now = firestore.Timestamp.fromMillis((new Date()).getTime());
          if (documentSnapshot.exists) {
            const data = documentSnapshot.data();

            if (data.date.seconds + 3600 < now.seconds) { // 1시간이 지날 때만 갱신
              await documentSnapshot.ref.set({
                date: firestore.Timestamp.fromMillis(now),
              });

              await firestore()
                .collection("Posts")
                .doc(this.props.route.params.itemId)
                .update({
                  viewCount: firestore.FieldValue.increment(1),
                });
            }
          } else {
            await documentSnapshot.ref.set({
              date: firestore.Timestamp.fromMillis(now),
            });

            await firestore()
              .collection("Posts")
              .doc(this.props.route.params.itemId)
              .update({
                viewCount: firestore.FieldValue.increment(1),
              });
          }
        });

      await firestore() // like 관련
        .collection(`Users/${auth().currentUser.uid}/like`)
        .doc(this.props.route.params.itemId)
        .get()
        .then(async (documentSnapshot) => {
          if (documentSnapshot.exists) {
            const data = documentSnapshot.data();
            let likes = false;
            let dislikes = false;

            if (data.like) {
              likes = true;
            } else {
              dislikes = true;
            }

            this.setState({
              liked: likes,
              disliked: dislikes,
            });
          }
        });

      let storageRef = storage().ref();
      let modifiedList = [];

      for (let i = 0; i < this.state.data.length; i++) {
        let URL = "";
        try {
          let photo = this.state.data[i].photo;
          photo = photo.substr(0, photo.lastIndexOf('.'));
          // URL = await storageRef.child(this.state.userUid + "/" + this.props.route.params.itemId + "/" + photo + "_1080x1080.jpeg").getDownloadURL();
          URL = `https://storage.googleapis.com/travelog-4e274.appspot.com/${this.state.userUid}/${this.props.route.params.itemId}/${photo}_1080x1080.jpeg`;
          modifiedList = modifiedList.concat({ 
            date: this.state.data[i].date,
            title: this.state.data[i].title,
            changed: this.state.data[i].changed,
            url: URL,
            photo: this.state.data[i].photo,
            lat: this.state.data[i].lat,
            long: this.state.data[i].long,
          });
        } catch (error) {
            console.log(error);
            try {
              // URL = await storageRef.child(this.state.userUid + "/" + this.props.route.params.itemId + "/" + this.state.data[i].photo).getDownloadURL();
              URL = `https://storage.googleapis.com/travelog-4e274.appspot.com/${this.state.userUid}/${this.props.route.params.itemId}/${this.state.data[i].photo}`;
              modifiedList = modifiedList.concat({ 
                date: this.state.data[i].date,
                title: this.state.data[i].title,
                changed: this.state.data[i].changed,
                url: URL,
                photo: this.state.data[i].photo,
                lat: this.state.data[i].lat,
                long: this.state.data[i].long,
              });
            } catch (error) {
                console.log(error);
                  modifiedList = modifiedList.concat({ 
                  date: this.state.data[i].date,
                  title: this.state.data[i].title,
                  changed: this.state.data[i].changed,
                  url: URL,
                  photo: this.state.data[i].photo,
                  lat: this.state.data[i].lat,
                  long: this.state.data[i].long,
                });
            }
        }
      }

      this.setState({
        list: modifiedList,
        loading: false,
      });
    }

    async componentDidMount() {
      console.log("itemId: ", this.props.route.params.itemId);

      this.setState({
        viewcode: this.props.route.params.viewcode || 0,
        list: [],
        data: this.props.route.params.data || [],
        changed: false, // 변경된 사항이 있을 경우 true, 이 화면 나갈 때 Alert로 물어보기
        link: this.props.route.params.link || "",
        lat: (this.props.route.params.data && this.props.route.params.data.length > 0) ? this.props.route.params.data[0].lat : 37,
        long: (this.props.route.params.data && this.props.route.params.data.length > 0) ? this.props.route.params.data[0].long : 127,
        latDelta: 0.922,
        longDelta: 0.421,
        category: this.props.route.params.category || 0,
        modifyDate: this.props.route.params.modifyDate || firestore.Timestamp.fromMillis((new Date()).getTime()),
        date: this.props.route.params.date || firestore.Timestamp.fromMillis((new Date()).getTime()),
        title: this.props.route.params.title || '',
        subtitle: this.props.route.params.subtitle || '',
        likeCount: this.props.route.params.likeCount || 0,
        dislikeCount: this.props.route.params.dislikeCount || 0,
        viewCount: this.props.route.params.viewCount || 0,
        displayName: this.props.route.params.displayName || '',
        profileURL: this.props.route.params.profileURL || '',
        userUid: this.props.route.params.userUid || '',
        preUser: this.props.route.params.preUser || [],
        thumbnail: this.props.route.params.thumbnail || 0,
        marginBottom: 1,
      });

      this.props.navigation.setOptions({
        title: translate("Log"),
        headerRight: () => 
        <View style={{flexDirection: 'row',}}>
          <TouchableOpacity style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 5,
            paddingRight: 5,
          }} onPress={() => { 
            if (!this.state.loading) {
              this.props.navigation.push('ShowDetail', {
                title: this.state.title,
                subtitle: this.state.subtitle,
                date: this.state.date.toDate(),
                modifyDate: this.state.modifyDate.toDate(),
                link: this.state.link,
                viewCount: this.state.viewCount,
                profileURL: this.state.profileURL,
                displayName: this.state.displayName,
                userUid: this.state.userUid,
              });
            }
          }}>
            <Icon
              name='info'
              size={24}
              color='#fff'
            />
          </TouchableOpacity>
          <TouchableOpacity style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 5,
            paddingRight: 5,
          }} onPress={() => { 
            if (this.state.viewcode > 0) {
              this.setState({
                viewcode: 0,
              });
            } else {
              this.setState({
                viewcode: 1,
              });
            }

            if (this.state.edit) {
              this.setState({
                changed: true,
              });
            }
          }}>
            <Icon
              name='tune'
              size={24}
              color='#fff'
            />
          </TouchableOpacity>
          <TouchableOpacity style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 5,
            paddingRight: 10,
          }} onPress={() => {
            showing = !showing;
            showIndex = 0;
            this.callback();
          }}>
            <Icon
              name="not-started"
              size={24}
              color='#fff'
            />
          </TouchableOpacity>
        </View>
      });

      await this.refresh();
    }

    callback = async () => {
      if (!showing || this.state.loading || this.state.edit || showIndex >= this.state.list.length) { 
        showing = false;
        showIndex = 0;
        return;
      }

      try {
        await AsyncStorage.setItem('badgePlay', 'true');
        this.state._map.current.animateCamera(
          {
            center: {
              latitude: this.state.list[showIndex].lat,
              longitude: this.state.list[showIndex].long,
            }
          },
          { 
            duration: 1000
          }
        ); 
      } catch (e) {
        console.log(e);
      }

      let x = (showIndex * CARD_WIDTH) + (showIndex * 20); 
      if (Platform.OS === 'ios') {
        x = x - SPACING_FOR_CARD_INSET;
      }

      try {
        this.state._scrollView.current.scrollTo({x: x, y: 0, animated: true});
      } catch (e) {
        console.log(e);
      }

      showIndex++;

      setTimeout(this.callback, 2500);
    };

    render() {
      return(
        <SafeAreaView style={styles.container}>
          { this.state.loading ? <View style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff', justifyContent: "center", width: "100%", height: "100%"}}>
                <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
            </View> 
            : 
          <View style={{width: "100%", height: "90%"}}> 
            { this.state.viewcode == 0 ? 
            <MapView
              ref={this.state._map}
              style={{flex: 1, width: "100%", marginBottom: this.state.marginBottom}}
              provider={PROVIDER_GOOGLE} // remove if not using Google Maps
              initialRegion={{
                latitude: this.state.list.length > 0 ? this.state.list[0].lat : 37,
                longitude: this.state.list.length > 0 ? this.state.list[0].long : 127,
                latitudeDelta: 0.922,
                longitudeDelta: 0.421,
              }}
              onMapReady={() => {
                this.setState({marginBottom: 0})
                Platform.OS === 'android' ? PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) : ''
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
            >
              <Polyline
                coordinates={this.state.list.map(data => {
                  return {latitude: data.lat, longitude: data.long}
                })}
                strokeColor="#002f6c" // fallback for when `strokeColors` is not supported by the map-provider
                strokeWidth={6}
              />
              {this.state.list.map((item, index) => (
                <Marker
                  draggable={this.state.edit}
                  coordinate={ {latitude: item.lat, longitude: item.long} }
                  anchor={{x: 0.5, y: 0}}
                  onPress={e => {
                    if (!this.state.edit) {
                      this.goShowItem(item, index);
                    } else {
                      if (this.state.delete) {
                        this.alertDelete(item);
                      } else {
                        Alert.alert(
                          translate('Confirm'), //확인
                          translate('EditScreenComment1'), //변경점을 저장하시겠습니까?
                          [
                              {text: translate('Cancel'), onPress: () => {}},
                              {text: translate('OK'), onPress: async () => {
                                await this.update();
                                this.goShowItem(item, index);
                              }},
                          ],
                          { cancelable: false }
                        );
                      }
                    }
                  }}
                  onDragEnd={(e) => {
                    console.log(e);
                    var updateList = this.state.list;
                    updateList[index].lat = e.nativeEvent.coordinate.latitude;
                    updateList[index].long = e.nativeEvent.coordinate.longitude;
                    updateList[index].changed = true; // 마커가 초기 저장 때와 달리 변경됨
                    this.setState({ 
                      list: updateList,
                      changed: true,
                      lat: e.nativeEvent.coordinate.latitude,
                      long: e.nativeEvent.coordinate.longitude,
                    });
                    return;
                  }}
                >
                  <View style={{alignItems: 'center'}}>
                    <View style={{width: 10, height: 10, backgroundColor: 'red', borderRadius: 5, marginBottom: 10}} />
                    <FastImage
                      style={{ height: height * 0.2, width: width * 0.3, borderRadius: 10 }}
                      source={item.url ? {
                          uri: item.url,
                          priority: FastImage.priority.high
                      } : require('./../../logo/ic_launcher.png')}
                    />
                    { this.state.thumbnail == index && <Icon
                      style={{position: 'absolute', bottom: 0, left: 0}}
                      name='stars'
                      size={24}
                      color='yellow'
                    /> }
                    { item.changed && <Icon
                      style={{position: 'absolute', bottom: 0, right: 0}}
                      name='edit'
                      size={24}
                      color='#002f6c'
                    /> }
                  </View>
                </Marker>
              ))}
            </MapView>
            : <View style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff", height: "100%"}}>
                <Animated.ScrollView
                  ref={this.state._scrollView}
                  horizontal
                  pagingEnabled
                  scrollEventThrottle={1}
                  snapToInterval={CARD_WIDTH + 20}
                  snapToAlignment="center"
                  style={styles.scrollView}
                  decelerationRate="fast"
                  contentOffset={{x: Platform.OS === 'ios' ? -SPACING_FOR_CARD_INSET : 0, y: 0}}
                  contentInset={{
                    top: 0,
                    left: SPACING_FOR_CARD_INSET,
                    bottom: 0,
                    right: SPACING_FOR_CARD_INSET
                  }}
                  contentContainerStyle={{
                    alignItems: 'center',
                    paddingHorizontal: Platform.OS === 'android' ? SPACING_FOR_CARD_INSET : 0
                  }}
                >
                  {this.state.list.map((item, index) => 
                    <TouchableOpacity
                      style={styles.card}
                      onPress={() => { 
                        if (!this.state.edit) {
                          this.goShowItem(item, index);
                        } else {
                          if (this.state.delete) {
                            this.alertDelete(item);
                          } else {
                            Alert.alert(
                              translate('Confirm'), //확인
                              translate('EditScreenComment1'), //변경점을 저장하시겠습니까?
                              [
                                  {text: translate('Cancel'), onPress: () => {}},
                                  {text: translate('OK'), onPress: async () => {
                                    await this.update();
                                    this.goShowItem(item, index);
                                  }},
                              ],
                              { cancelable: false }
                            );
                          }
                        }
                      }}
                    >
                      <View style={{flex:1, aspectRatio: CARD_WIDTH / CARD_HEIGHT}}>
                        <FastImage
                          style={{flex: 1}}
                          source={item.url ? {
                              uri: item.url,
                              priority: FastImage.priority.high
                          } : require('./../../logo/ic_launcher.png')}
                        />
                        { this.state.thumbnail == index && <Icon
                          style={{position: 'absolute', top: 0, right: 0}}
                          name='verified'
                          size={24}
                          color='yellow'
                        /> }
                        { item.changed && <Icon
                          style={{position: 'absolute', bottom: 0, right: 0}}
                          name='edit'
                          size={24}
                          color='#002f6c'
                        /> }
                        <View style={styles.stock}>
                          <Text style={{fontWeight: 'bold', color: '#fff', marginLeft: 10}}>
                            {item.title}
                          </Text>
                          <Text style={{color: '#fff', marginLeft: 10}}>
                            {item.subtitle}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                </Animated.ScrollView>
            </View>
            }
          </View> 
          }
          { !this.state.loading && <DraggableFlatList // 밑에 깔 것
            horizontal
            style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff", height: "3%"}}
            keyExtractor={(item, index) => `draggable-item-${index}`}
            data={this.state.list}
            extraData={this.state}
            contentContainerStyle = {{flexGrow: 1, justifyContent:'center',}}
            renderItem={({ item, index, drag, isActive }) => <View style={{width: "100%", height: "100%"}}> 
                <TouchableOpacity
                  style={{paddingLeft: 10, paddingRight: 10}}
                  onPress={() => { 
                    try {
                      this.state._map.current.animateCamera(
                        {
                          center: {
                            latitude: this.state.list[index].lat,
                            longitude: this.state.list[index].long,
                          }
                        },
                        { 
                          duration: 1000
                        }
                      ); 
                    } catch (e) {
                      console.log(e);
                    }

                    let x = (index * CARD_WIDTH) + (index * 20); 
                    if (Platform.OS === 'ios') {
                      x = x - SPACING_FOR_CARD_INSET;
                    }

                    try {
                      this.state._scrollView.current.scrollTo({x: x, y: 0, animated: true});
                    } catch (e) {
                      console.log(e);
                    }
                  }}
                  onLongPress={drag}
                >
                  <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                    { index + 1 }
                  </Text>
                </TouchableOpacity>
              </View>
            }
            onDragEnd={({ data }) => {
              if (this.state.edit) {
                this.setState({ 
                  list: data,
                  changed: true,
                });
              }
            }}
          /> }

          { !this.state.loading && <View style={styles.floatingViewStyle}>
            <TouchableOpacity onPress={async () => {
              console.log('up');

              if (this.state.smallLoading) {
                return;
              }

              this.setState({
                smallLoading: true,
              });
              let likeRef = firestore().collection("Users").doc(auth().currentUser.uid).collection("like").doc(this.props.route.params.itemId);
              let postRef = firestore().collection("Posts").doc(this.props.route.params.itemId);
              let liked = this.state.liked;
              let disliked = this.state.disliked;
              let localLikeCount = this.state.likeCount;
              let localDislikeCount = this.state.dislikeCount;

              return await firestore().runTransaction(async t => {
                  const like = await t.get(likeRef);
                  const post = await t.get(postRef);
                  const now = firestore.Timestamp.fromMillis((new Date()).getTime());

                  if (!like.exists) {
                    liked = true;
                    localLikeCount++;
                    t.set(likeRef, { like: true, datetime: now });
                    t.update(postRef, { likeCount: firestore.FieldValue.increment(1) });
                  } else {
                    const data = like.data();
                    if (data.datetime.seconds + 60 < now.seconds) { // 1분이 지날 때만 갱신
                      if (data.like) {
                        liked = false;
                        localLikeCount--;
                        t.delete(likeRef);
                        t.update(postRef, { likeCount: firestore.FieldValue.increment(-1) });
                      } else {
                        liked = true;
                        disliked = false;
                        localLikeCount++;
                        localDislikeCount--;
                        t.set(likeRef, { like: true, datetime: now });
                        t.update(postRef, { 
                          likeCount: firestore.FieldValue.increment(1),
                          dislikeCount: firestore.FieldValue.increment(-1),
                        });
                      }
                    } else {
                      throw translate('ShowScreenComment2');
                    }
                  }
              }).then(() => {
                  this.setState({
                    liked: liked, // 사용자의 좋아요 여부 확인
                    disliked: disliked, // 사용자의 싫어요 여부 확인
                    likeCount: localLikeCount,
                    dislikeCount: localDislikeCount,
                    smallLoading: false,
                  });
              }).catch((e) => {
                  this.setState({
                    liked: liked, // 사용자의 좋아요 여부 확인
                    disliked: disliked, // 사용자의 싫어요 여부 확인
                    likeCount: localLikeCount,
                    dislikeCount: localDislikeCount,
                    smallLoading: false,
                  });
                  Alert.alert(
                    translate('Alert'), //확인
                    e.toString(), // 일정시간 후 수정 가능합니다.
                    [
                        {text: translate('OK'), onPress: async () => {} },
                    ],
                    { cancelable: true }
                  );
              });
            }}>
              <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                {this.state.smallLoading ? 
                  <ActivityIndicator size="small" color='#01579b' />
                  : <Icon
                  reverse
                  name='thumb-up'
                  color={this.state.liked ? '#4f83cc' : '#bdbdbd'}
                  size={25}
                />}
                <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {this.state.likeNumber ? this.state.likeCount : translate('like')} </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              console.log('down');

              if (this.state.smallLoading) {
                return;
              }

              this.setState({
                smallLoading: true,
              });
              let likeRef = firestore().collection("Users").doc(auth().currentUser.uid).collection("like").doc(this.props.route.params.itemId);
              let postRef = firestore().collection("Posts").doc(this.props.route.params.itemId);
              let liked = this.state.liked;
              let disliked = this.state.disliked;
              let localLikeCount = this.state.likeCount;
              let localDislikeCount = this.state.dislikeCount;

              return await firestore().runTransaction(async t => {
                  const like = await t.get(likeRef);
                  const post = await t.get(postRef);
                  const now = firestore.Timestamp.fromMillis((new Date()).getTime());

                  if (!like.exists) {
                    disliked = true;
                    localDislikeCount++;
                    t.set(likeRef, { like: false, datetime: now });
                    t.update(postRef, { dislikeCount: firestore.FieldValue.increment(1) });
                  } else {
                    const data = like.data();
                    if (data.datetime.seconds + 60 < now.seconds) { // 1분이 지날 때만 갱신
                      if (!data.like) {
                        disliked = false;
                        localDislikeCount--;
                        t.delete(likeRef);
                        t.update(postRef, { dislikeCount: firestore.FieldValue.increment(-1) });
                      } else {
                        liked = false;
                        disliked = true;
                        localLikeCount--;
                        localDislikeCount++;
                        t.set(likeRef, { like: false, datetime: now });
                        t.update(postRef, { 
                          likeCount: firestore.FieldValue.increment(-1),
                          dislikeCount: firestore.FieldValue.increment(1),
                        });
                      }
                    } else {
                      throw translate('ShowScreenComment2');
                    }
                  }
              }).then(() => {
                  this.setState({
                    liked: liked, // 사용자의 좋아요 여부 확인
                    disliked: disliked, // 사용자의 싫어요 여부 확인
                    likeCount: localLikeCount,
                    dislikeCount: localDislikeCount,
                    smallLoading: false,
                  });
              }).catch((e) => {
                  this.setState({
                    liked: liked, // 사용자의 좋아요 여부 확인
                    disliked: disliked, // 사용자의 싫어요 여부 확인
                    likeCount: localLikeCount,
                    dislikeCount: localDislikeCount,
                    smallLoading: false,
                  });
                  Alert.alert(
                    translate('Alert'), //확인
                    e.toString(), // 일정시간 후 수정 가능합니다.
                    [
                        {text: translate('OK'), onPress: async () => {} },
                    ],
                    { cancelable: true }
                  );
              });
            }}>

              <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                {this.state.smallLoading ? 
                  <ActivityIndicator size="small" color='#01579b' />
                  : <Icon
                    reverse
                    name='thumb-down'
                    color={this.state.disliked ? '#bc477b' : '#bdbdbd'}
                    size={25}
                  />}
                <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {this.state.likeNumber ? this.state.dislikeCount : translate('dislike')} </Text>
              </View>
            </TouchableOpacity>
            { auth().currentUser.uid == this.state.userUid && <TouchableOpacity onPress={async () => { // EditList로 이동
                if (this.state.changed) {
                  Alert.alert(
                    translate('Confirm'), // 확인
                    translate('EditScreenComment1'), // 변경점을 저장하시겠습니까?
                    [
                        {text: translate('Cancel'), onPress: () => this.goEditList()},
                        {text: translate('OK'), onPress: async () => {
                          await this.update();
                          this.goEditList();
                        }},
                    ],
                    { cancelable: false }
                  );
                } else {
                  this.goEditList();
                }
              }}>
                <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                  <Icon
                    reverse
                    name='library-add'
                    color='#bdbdbd'
                    size={25}
                  />
                  <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("AddPhotos")} </Text>
                </View>
              </TouchableOpacity> }
            { !this.state.edit ? <TouchableOpacity onPress={async () => {
              const url = 'https://travelog-4e274.web.app/?id=' + this.props.route.params.itemId;
              const title = 'URL Content';
              const message = 'Please check this out.';
              const options = Platform.select({
                ios: {
                  activityItemSources: [
                    { // For sharing url with custom title.
                      placeholderItem: { type: 'url', content: url },
                      item: {
                        default: { type: 'url', content: url },
                      },
                      subject: {
                        default: title,
                      },
                      linkMetadata: { originalUrl: url, url, title },
                    },
                  ],
                },
                default: {
                  title,
                  subject: title,
                  message: `${message} ${url}`,
                },
              });
              Share.open(options)
                .then((res) => { console.log(res) })
                .catch((err) => { err && console.log(err); });

              await AsyncStorage.setItem('badgeShare', 'true');
              }}>
              <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                <Icon
                  reverse
                  name='share'
                  color='#bdbdbd'
                  size={25}
                />
                <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("Share")} </Text>
              </View>
            </TouchableOpacity> : <TouchableOpacity onPress={() => { 
              this.setState({
                delete: !this.state.delete,
              });
            }}>
              <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                <Icon
                  reverse
                  name={this.state.delete ? 'delete' : 'edit'}
                  color='#bdbdbd'
                  size={25}
                />
                <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("Mode") + (this.state.delete ? translate("Delete") : translate("Edit") )} </Text>
              </View>
            </TouchableOpacity> }
            { auth().currentUser.uid == this.state.userUid && <TouchableOpacity onPress={async () => {
                if (!this.state.edit) {
                  this.setState({edit: true});
                } else {
                  if (this.state.changed) {
                    Alert.alert(
                      translate('Confirm'), //확인
                      translate('EditScreenComment1'), //변경점을 저장하시겠습니까?
                      [
                          {text: translate('Cancel'), onPress: () => {}},
                          {text: translate('OK'), onPress: async () => {
                            await this.update();
                          }},
                      ],
                      { cancelable: false }
                    );
                  } 
                  this.setState({edit: false});
                }
              }}>
                <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                  <Icon
                    reverse
                    name={!this.state.edit ? 'edit' : 'check-circle'}
                    color='#bdbdbd'
                    size={25}
                  />
                  <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("EditLog")} </Text>
                </View>
              </TouchableOpacity> }
          </View> }
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
    floatingViewStyle: {
      width: "100%",
      height: "7%",
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(52, 52, 52, 0.8)',
    },
    card: {
      elevation: 2,
      backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff",
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
      marginHorizontal: 10,
      shadowColor: "#000",
      shadowRadius: 5,
      shadowOpacity: 0.3,
      shadowOffset: { x: 2, y: -2 },
      height: CARD_HEIGHT,
      width: CARD_WIDTH,
      overflow: "hidden",
    },
    scrollView: {
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: 5,
    },
    stock: { // 사진 밑 제목과 소제목
      position: 'absolute',
      bottom: 0,
      width: "100%",
      backgroundColor: 'rgba(52, 52, 52, 0.8)',
    },
});