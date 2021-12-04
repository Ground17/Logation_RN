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
  ImageBackground,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import { TouchableOpacity } from 'react-native-gesture-handler';

import DraggableFlatList from "react-native-draggable-flatlist"; /// important!!!

import Share from 'react-native-share';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { translate, } from '../Utils';

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = 200;
const CARD_WIDTH = width * 0.8;
const SPACING_FOR_CARD_INSET = width * 0.1 - 10;

const TAB_ITEM_WIDTH = width / 5;

export default class ShowScreen extends Component {
    state = {
      edit: false,
      viewcode: 0,
      list: [],
      data: [],
      changed: false,
      delete: false, // true: delete, false: edit
      lat: 37,
      long: 127,
      latDelta: 0.922,
      longDelta: 0.421,
      category: 0,
      date: new Date(),
      title: '',
      subtitle: '',
      link: '',
      liked: false,
      disliked: false,
      loading: false,
      likeCount: 0,
      dislikeCount: 0,
      marginBottom: 1,
      thumbnail: 0,
      _map: React.createRef(),
      _scrollView: React.createRef(),
      mapAnimation: new Animated.Value(0),
    };

    keyExtractorForMap = (item, index) => `M${index.toString()}`;
    keyExtractor = (item, index) => index.toString();

    renderItem = ({ item, index, drag, isActive }) => (
      <ListItem
        containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff'}}
        onLongPress={drag}
        bottomDivider
        onPress={() => { 
          if (this.state.delete) {
            this.alertDelete(item);
          } else {
            this.goEditItem(item, index);
          }
        }}
      >
        <View style={{flex:1/5, aspectRatio:1}}>
          <FastImage
            style={{flex: 1}}
            source={{ 
              uri: item.url,
              priority: FastImage.priority.high,
              }}
          />
        </View>
        <ListItem.Content>
          <ListItem.Title style={{fontWeight: 'bold', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
            {item.title}
          </ListItem.Title>
          <ListItem.Subtitle style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
            {item.subtitle}
          </ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>
    );

    renderMap = ({ item, index, drag, isActive }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { 
          if (this.state.delete) {
            this.alertDelete(item);
          } else {
            this.goEditItem(item, index);
          }
        }}
        onLongPress={drag}
      >
        <View style={{flex:1, aspectRatio: CARD_WIDTH / CARD_HEIGHT}}>
          <FastImage
            style={{flex: 1}}
            source={{ 
              uri: item.url,
              priority: FastImage.priority.high,
              }}
          />
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
    )

    // renderGrid = ({ item, index }) => (
    //   <TouchableHighlight onPress={() => {
    //     this.props.navigation.push('ShowItem', {
    //         date: item.date.toDate(),
    //         title: item.title,
    //         subtitle: item.subtitle,
    //         userUid: this.props.route.params.userUid,
    //         itemId: this.props.route.params.itemId,
    //         url: item.url,
    //         lat: item.lat,
    //         long: item.long,
    //         photo: item.photo,
    //         index: index,
    //         link: this.state.link,
    //         onPop: () => this.refresh(),
    //     })
    //   }} 
    //     style={{flex:1/3, aspectRatio:1}}
    //   >
    //     <View style={{flex: 1}}>
    //       <FastImage
    //         style={{flex: 1}}
    //         source={{ 
    //           uri: item.url,
    //           priority: FastImage.priority.high,
    //           }}
    //         resizeMode={FastImage.resizeMode.cover}
    //       />
    //       <View style={styles.stock}>
    //         <Text style={{fontWeight: 'bold', color: '#fff', marginLeft: 3}}>
    //           {item.title}
    //         </Text>
    //       </View>
    //     </View>
    //   </TouchableHighlight>
    // )

    async refresh() { // 보기 모드에서만 활성화
      if (this.state.edit) {
        return;
      }
      this.setState({
        viewcode: 0,
        list: [],
        data: [],
        changed: false, // 변경된 사항이 있을 경우 true, 이 화면 나갈 때 Alert로 물어보기
        link: "",
        liked: false,
        disliked: false,
        loading: true,
        delete: false, // true: delete, false: edit
        lat: 37,
        long: 127,
        latDelta: 0.922,
        longDelta: 0.421,
        category: '',
        date: new Date(),
        title: '',
        subtitle: '',
        likeCount: 0,
        dislikeCount: 0,
        marginBottom: 1,
      });

      var storageRef = storage().ref();
      
      await firestore()
        .collection(this.props.route.params.userUid)
        .doc(this.props.route.params.itemId)
        .get()
        .then(async (documentSnapshot) => {
          if (documentSnapshot.exists) {
            data = documentSnapshot.data();
            var modifiedList = [];
            var localLikeCount = 0;
            var localDislikeCount = 0;
            var likes = false;
            var dislikes = false;

            for (var i=0; i < data.data.length; i++) {
              try {
                var URL = await storageRef.child(this.props.route.params.userUid + "/" + this.props.route.params.itemId + "/" + data.data[i].photo).getDownloadURL();
                modifiedList = modifiedList.concat({ 
                  date: data.data[i].date,
                  title: data.data[i].title,
                  changed: data.data[i].changed,
                  url: URL,
                  photo: data.data[i].photo,
                  lat: data.data[i].lat,
                  long: data.data[i].long,
                });
                if (!data.view.includes(auth().currentUser.uid)) {
                  documentSnapshot.ref.update({view: data.view.concat(auth().currentUser.uid)});
                }
              } catch (error) {
                  console.log(error);
              }
            }

            Object.keys(data.like).map((key, i) => {
              if (key == auth().currentUser.uid) {
                likes = data.like[key];
                dislikes = !data.like[key];
              }

              if (data.like[key]) {
                localLikeCount++;
              } else {
                localDislikeCount++;
              }
            });

            this.setState({
              category: data.category,
              date: data.date.toDate(),
              title: data.title,
              subtitle: data.subtitle,
              liked: likes,
              disliked: dislikes,
              list: modifiedList,
              link: data.link,
              viewcode: data.viewcode,
              likeCount: localLikeCount,
              dislikeCount: localDislikeCount,
              loading: false,
              thumbnail: data.thumbnail,
              lat: modifiedList[0].lat,
              long: modifiedList[0].long,
            });
          }
        });
    }

    async update() {
      if (!this.state.edit) {
        return;
      }

      if (this.state.changed) {
        this.setState({
          loading: true,
          data: [],
        });
        await firestore()
        .collection("Users")
        .doc(auth().currentUser.uid)
        .update({
          modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
        });
        for (var i = 0; i < this.state.list.length; i++) {
          this.setState({
            data: this.state.data.concat({ 
              date: this.state.list[i].date,
              title: this.state.list[i].title,
              changed: this.state.list[i].changed,
              photo: this.state.list[i].photo,
              lat: this.state.list[i].lat,
              long: this.state.list[i].long,
            }),
          });
        }
        await firestore()
          .collection(auth().currentUser.uid)
          .doc(this.props.route.params.itemId)
          .update({
              thumbnail: this.state.list[0].photo,
              viewcode: this.state.viewcode,
              data: this.state.data,
              modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
          });
        this.setState({
          loading: false,
          changed: false,
          edit: false,
        });

        // await this.props.route.params.onPop();
      }
    }


    goEditList() {
      this.props.navigation.push('EditList', {
        category: this.state.category,
        date: this.state.date,
        title: this.state.title,
        subtitle: this.state.subtitle,
        link: this.state.link,
        photoNumber: this.state.list.length,
        itemId: this.props.route.params.itemId,
        viewcode: this.state.viewcode,
        onPop: () => this.refresh(),
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
                  var array = await storage()
                  .ref(`${auth().currentUser.uid}/${this.props.route.params.itemId}`)
                  .listAll();
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
    
    async componentDidMount() {
      console.log("itemId: ", this.props.route.params.itemId);
      console.log("userUid: ", this.props.route.params.userUid);

      // data length가 0일 경우 delete 기능 작동

      this.refresh();
      this.props.navigation.setOptions({
        title: this.state.edit ? translate("EditScreen") : translate("ShowScreen"),
        headerRight: () => 
        <View style={{flexDirection: 'row',}}>
            { auth().currentUser.uid == this.props.route.params.userUid ?
               !this.state.edit ?
                <TouchableOpacity style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 5,
                  paddingRight: 20,
                }} onPress={() => {// 수정창(EditScreen) 열기
                  // this.props.navigation.push('EditScreen', {
                  //   itemId: this.props.route.params.itemId,
                  //   userUid: this.props.route.params.userUid,
                  //   latitude: this.state.list[0].lat,
                  //   longitude: this.state.list[0].long,
                  //   onPop: () => this.refresh(),
                  // })
                  this.setState({edit: true});
                }}>
                  <Icon
                    name="edit"
                    size={24}
                    color='#fff'
                  />
                </TouchableOpacity>
                : <TouchableOpacity style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: 5,
                    paddingRight: 20,
                  }} onPress={() => {
                  if (this.state.changed) {
                    Alert.alert(
                      translate('Confirm'), //확인
                      translate('EditScreenComment1'), //변경점을 저장하시겠습니까?
                      [
                          {text: translate('Cancel'), onPress: () => {}},
                          {text: translate('OK'), onPress: async () => {
                            await this.update();
                            this.props.navigation.pop();
                          }},
                      ],
                      { cancelable: false }
                    );
                  } else {
                    this.props.navigation.pop();
                  }
                }}>
                  <Icon
                    name="check-circle"
                    size={24}
                    color='#fff'
                  />
                </TouchableOpacity>
               : <View></View> }
        </View>
      });
      
      this.state.mapAnimation.addListener(({ value }) => {
        let index = Math.floor(value / CARD_WIDTH + 0.3); // animate 30% away from landing on the next item
        if (index >= this.state.list.length) {
          index = this.state.list.length - 1;
        }
        if (index <= 0) {
          index = 0;
        }

        if( this.state.mapIndex !== index ) {
          this.setState({mapIndex: index});
          try {
            this.state._map.current.animateCamera(
              {
                center: {
                  latitude: this.state.list[index].lat,
                  longitude: this.state.list[index].long,
                }
              },
              350
            );
          } catch (e) {
            console.log(e);
          }
        }
      });
    }

    componentWillUnmount() {
      this.state.mapAnimation.removeAllListeners();
    }

    render() {
      return(
        <SafeAreaView style={styles.container}>
          { this.state.loading ? <View style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff', justifyContent: "center", width: "100%", height: "100%"}}>
                <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
            </View> 
            : 
          <View style={{width: "100%", height: "91%"}}> 
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
                {this.state.list.map((data, index) => (
                  <Marker
                    draggable={this.state.edit}
                    coordinate={ {latitude: data.lat, longitude: data.long} }
                    anchor={{x: 0.5, y: 0.5}}
                    onPress={e => {
                      let x = (index * CARD_WIDTH) + (index * 20); 
                      if (Platform.OS === 'ios') {
                        x = x - SPACING_FOR_CARD_INSET;
                      }
                      try {
                        this.state._map.current.animateCamera(
                          {
                            center: {
                              latitude: data.lat,
                              longitude: data.long,
                            }
                          },
                          350
                        ); 
                      } catch (e) {
                        console.log(e);
                      }

                      this.state._scrollView.current.scrollTo({x: x, y: 0, animated: true});
                    }}
                    onDragEnd={(e) => {
                      console.log(e);
                      var updateList = this.state.list;
                      updateList[index].lat = e.nativeEvent.coordinate.latitude;
                      updateList[index].long = e.nativeEvent.coordinate.longitude;
                      this.setState({ 
                        list: updateList,
                        changed: true,
                        lat: e.nativeEvent.coordinate.latitude,
                        long: e.nativeEvent.coordinate.longitude,
                      });
                      return;
                    }}
                  >
                    <View>
                        <ImageBackground source={require('./../../logo/marker.png')} style={{height:64, width:64, justifyContent:'center'}}>
                            <Text style={{textAlign: 'center', fontWeight: 'bold', fontSize: 20}}>{index + 1}</Text>
                        </ImageBackground>
                    </View>
                  </Marker>
                ))}
            </MapView>
            : <View style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
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
                    paddingHorizontal: Platform.OS === 'android' ? SPACING_FOR_CARD_INSET : 0
                  }}
                  onScroll={Animated.event(
                    [
                      {
                        nativeEvent: {
                          contentOffset: {
                            x: this.state.mapAnimation,
                          }
                        },
                      },
                    ],
                    {useNativeDriver: true}
                  )}
                >
                  {this.state.list.map((data, index) => (
                    <TouchableOpacity
                      style={styles.card}
                      onPress={() => { this.props.navigation.push('ShowItem', {
                          date: data.date.toDate(),
                          title: data.title,
                          subtitle: data.subtitle,
                          userUid: this.props.route.params.userUid,
                          itemId: this.props.route.params.itemId,
                          url: data.url,
                          lat: data.lat,
                          long: data.long,
                          photo: data.photo,
                          index: index,
                          link: this.state.link,
                          list: this.state.list,
                          thumbnail: this.state.thumbnail,
                          onPop: () => this.refresh(),
                        }) 
                      }}
                    >
                      <View style={{flex:1, aspectRatio: CARD_WIDTH / CARD_HEIGHT}}>
                        <FastImage
                          style={{flex: 1}}
                          source={{ 
                            uri: data.url,
                            priority: FastImage.priority.high,
                            }}
                        />
                        <View style={styles.stock}>
                          <Text style={{fontWeight: 'bold', color: '#fff', marginLeft: 10}}>
                            {data.title}
                          </Text>
                          <Text style={{color: '#fff', marginLeft: 10}}>
                            {data.subtitle}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </Animated.ScrollView>
            </View>
            }
          </View> 
          }
          {!this.state.loading && <DraggableFlatList /// 밑에 깔 것
            horizontal
            style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
            keyExtractor={(item, index) => `draggable-item-${item.key}`}
            data={this.state.list}
            renderItem={this.renderItem}
            onDragEnd={({ data }) => this.setState({ 
              list: data,
              changed: true,
            })}
          />}

          { this.state.edit ? 
            <View style={styles.floatingViewStyle}>
                <TouchableOpacity onPress={() => { 
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
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => { // EditList로 이동
                if (this.state.changed) {
                  Alert.alert(
                    translate('Confirm'), //확인
                    translate('EditScreenComment1'), //변경점을 저장하시겠습니까?
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
                  <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("EditList")} </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { 
                if (this.state.viewcode > 0) {
                  this.setState({
                    viewcode: 0,
                    changed: true,
                  });
                } else {
                  this.setState({
                    viewcode: 1,
                    changed: true,
                  });
                }
              }}>
                <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                  <Icon
                    reverse
                    name='tune'
                    color='#bdbdbd'
                    size={25}
                  />
                  <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("Change")} </Text>
                </View>
              </TouchableOpacity>
            </View>
            :
            <View style={styles.floatingViewStyle}>
              <TouchableOpacity onPress={async () => {
                console.log('up');
                var sfDocRef = firestore().collection(this.props.route.params.userUid).doc(this.props.route.params.itemId);
                await firestore().runTransaction(async (transaction) => {
                  var sfDoc = await transaction.get(sfDocRef);
                  if (!sfDoc.exists) {
                    throw "Document does not exist!";
                  }

                  var updateLike = this.state.like;
                  if (updateLike.hasOwnProperty(auth().currentUser.uid) && updateLike[auth().currentUser.uid]) {
                    delete updateLike[auth().currentUser.uid];
                  } else {
                    updateLike[auth().currentUser.uid] = true;
                  }
                  await transaction.update(sfDocRef, { like: updateLike });
                  var localLikeCount = 0;
                  var localDislikeCount = 0;

                  this.setState({
                    liked: false,
                    disliked: false,
                  });
                  Object.keys(updateLike).map((key, i) => {
                    if (key == auth().currentUser.uid) {
                      this.setState({
                        liked: updateLike[key],
                        disliked: !updateLike[key],
                      });
                    }

                    if (updateLike[key]) {
                      localLikeCount++;
                    } else {
                      localDislikeCount++;
                    }
                  });
                  this.setState({
                    like: updateLike,
                    likeCount: localLikeCount,
                    dislikeCount: localDislikeCount,
                  });
                }).then(async () => {
                    console.log("success");
                }).catch(async (err) => {
                    console.error(err);
                });
              }}>
              <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                <Icon
                  reverse
                  name='thumb-up'
                  color={this.state.liked ? '#4f83cc' : '#bdbdbd'}
                  size={25}
                />
                <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {this.state.likeCount} </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              console.log('down');
              var sfDocRef = firestore().collection(this.props.route.params.userUid).doc(this.props.route.params.itemId);
              await firestore().runTransaction(async (transaction) => {
                var sfDoc = await transaction.get(sfDocRef);
                if (!sfDoc.exists) {
                  throw "Document does not exist!";
                }

                var updateLike = this.state.like;
                if (updateLike.hasOwnProperty(auth().currentUser.uid) && !updateLike[auth().currentUser.uid]) {
                  delete updateLike[auth().currentUser.uid];
                } else {
                  updateLike[auth().currentUser.uid] = false;
                }
                await transaction.update(sfDocRef, { like: updateLike });
                var localLikeCount = 0;
                var localDislikeCount = 0;

                this.setState({
                  liked: false,
                  disliked: false,
                });
                Object.keys(updateLike).map((key, i) => {
                  if (key == auth().currentUser.uid) {
                    this.setState({
                      liked: updateLike[key],
                      disliked: !updateLike[key],
                    });
                  }

                  if (updateLike[key]) {
                    localLikeCount++;
                  } else {
                    localDislikeCount++;
                  }
                });
                this.setState({
                  like: updateLike,
                  likeCount: localLikeCount,
                  dislikeCount: localDislikeCount,
                });
              }).then(async () => {
                  console.log("success");
              }).catch(async (err) => {
                  console.error(err);
              });
            }}>
              <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                <Icon
                  reverse
                  name='thumb-down'
                  color={this.state.disliked ? '#bc477b' : '#bdbdbd'}
                  size={25}
                />
                <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {this.state.dislikeCount} </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              const url = 'https://travelog-4e274.web.app/?user=' + this.props.route.params.userUid + '&id=' + this.props.route.params.itemId;
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
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              if (this.state.viewcode > 0) {
                this.setState({
                  viewcode: 0
                });
              } else {
                this.setState({
                  viewcode: this.state.viewcode + 1
                });
              }
            }}>
              <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                <Icon
                  reverse
                  name='tune'
                  color='#bdbdbd'
                  size={25}
                />
                <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("Change")} </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => { 
              try {
                const supported = await Linking.canOpenURL(this.state.link);

                if (supported) {
                  Alert.alert(
                    translate("Confirm"),
                    translate("LaunchConfirm") + this.state.link,
                    [
                    {text: translate('Cancel'), onPress: () => { }},
                    {text: translate('OK'), onPress: async () => {
                      await Linking.openURL(this.state.link);
                    }},
                    ],
                    { cancelable: false }
                  );
                } else {
                  Alert.alert(translate("ShowItemAndShowScreen") + (this.state.link || "undefined"));
                }
              } catch (e) {
                Alert.alert(translate("ShowItemAndShowScreen") + (this.state.link || "undefined"));
              }
              
            }}>
              <View style={{alignItems: 'center', justifyContent: 'space-around', height: "100%", width: TAB_ITEM_WIDTH}}>
                <Icon
                  reverse
                  name='launch'
                  color='#bdbdbd'
                  size={25}
                />
                <Text style={{textAlign: 'center', color: "#fff", fontSize: 10}}> {translate("Launch")} </Text>
              </View>
            </TouchableOpacity>

          </View>
        }
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
      height: "9%",
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