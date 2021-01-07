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
  Dimensions,
  Animated,
  ImageBackground,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import { TouchableOpacity } from 'react-native-gesture-handler';

import DraggableFlatList from "react-native-draggable-flatlist"; /// important!!!

import Share from 'react-native-share';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { translate } from '../Utils';

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = 200;
const CARD_WIDTH = width * 0.8;
const SPACING_FOR_CARD_INSET = width * 0.1 - 10;

const TAB_ITEM_WIDTH = width / 3;

export default class EditScreen extends Component {
    state = {
      viewcode: 0,
      list: [],
      data: [],
      changed: false, // 변경된 사항이 있을 경우 true, 이 화면 나갈 때 Alert로 물어보기
      loading: false,
      delete: false, // true: delete, false: edit
      lat: 37,
      long: 127,
      latDelta: 0.922,
      longDelta: 0.421,
      category: '',
      date: new Date(),
      title: '',
      subtitle: '',
      link: '',
      photoNumber: 0,
      marginBottom: 1,
      _map: React.createRef(),
      _scrollView: React.createRef(),
      mapAnimation: new Animated.Value(0),
    };

    keyExtractor = (item, index) => index.toString()
    keyExtractorForMap = (item, index) => `M${index.toString()}`

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
    )

    renderGrid = ({ item, index }) => (
      <TouchableHighlight onPress={() => {
        if (this.state.delete) {
          this.alertDelete(item);
        } else {
          this.goEditItem(item, index);
        }
      }} 
        style={{flex:1/3, aspectRatio:1}}>
        <FastImage
          style={{flex: 1}}
          source={{ 
            uri: item.url,
            priority: FastImage.priority.high,
            }}
          resizeMode={FastImage.resizeMode.cover}
        />
      </TouchableHighlight>
    )

    async refresh() {
      this.setState({
        viewcode: 0,
        list: [],
        data: [],
        changed: false, // 변경된 사항이 있을 경우 true, 이 화면 나갈 때 Alert로 물어보기
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
        link: '',
        photoNumber: 0,
        marginBottom: 1,
      });

      var storageRef = storage().ref();
      
      await firestore()
        .collection(auth().currentUser.email)
        .doc(this.props.route.params.itemId)
        .get()
        .then(async (documentSnapshot) => {
          if (documentSnapshot.exists) {
            data = documentSnapshot.data();
            var modifiedList = [];
            for (var i=0; i < data.data.length; i++) {
              try {
                var URL = await storageRef.child(this.props.route.params.userEmail + "/" + this.props.route.params.itemId + "/" + data.data[i].photo).getDownloadURL();
                modifiedList = modifiedList.concat({ 
                  date: data.data[i].date,
                  title: data.data[i].title,
                  subtitle: data.data[i].subtitle,
                  url: URL,
                  photo: data.data[i].photo,
                  lat: data.data[i].lat,
                  long: data.data[i].long,
                });
              } catch (error) {
                  console.log(error);
              }
            }

            if (modifiedList.length > 0) {
              this.setState({ 
                list: modifiedList,
                category: data.category,
                date: data.date.toDate(),
                title: data.title,
                subtitle: data.subtitle,
                link: data.link,
                viewcode: data.viewcode,
                lat: modifiedList[0].lat,
                long: modifiedList[0].long,
                loading: false,
              });
            }

          }
      });

      await this.props.route.params.onPop();
    }

    async update() {
      if (this.state.changed) {
        this.setState({
          loading: true,
          data: [],
        });
        await firestore()
        .collection("Users")
        .doc(auth().currentUser.email)
        .update({
          modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
        });
        for (var i = 0; i < this.state.list.length; i++) {
          this.setState({
            data: this.state.data.concat({ 
              date: this.state.list[i].date,
              title: this.state.list[i].title,
              subtitle: this.state.list[i].subtitle,
              photo: this.state.list[i].photo,
              lat: this.state.list[i].lat,
              long: this.state.list[i].long,
            }),
          });
        }
        await firestore()
          .collection(auth().currentUser.email)
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
        });

        await this.props.route.params.onPop();
      }
    }

    goEditItem (item, index) {
      if (this.state.changed) {
        Alert.alert(
          translate('Confirm'), //확인
          translate('EditScreenComment1'), //변경점을 저장하시겠습니까?
          [
              {text: translate('Cancel'), onPress: () => { 
                this.props.navigation.push('EditItem', {
                  date: item.date.toDate(),
                  title: item.title,
                  subtitle: item.subtitle,
                  userEmail: this.props.route.params.userEmail,
                  itemId: this.props.route.params.itemId,
                  url: item.url,
                  lat: item.lat,
                  long: item.long,
                  photo: item.photo,
                  index: index,
                  onPop: () => {
                    this.refresh();
                  }
                });
              }},
              {text: translate('OK'), onPress: async () => {
                await this.update();
                this.props.navigation.push('EditItem', {
                  date: item.date.toDate(),
                  title: item.title,
                  subtitle: item.subtitle,
                  userEmail: this.props.route.params.userEmail,
                  itemId: this.props.route.params.itemId,
                  url: item.url,
                  lat: item.lat,
                  long: item.long,
                  photo: item.photo,
                  index: index,
                  onPop: () => {
                    this.refresh();
                  }
                });
              }},
          ],
          { cancelable: false }
        );
      } else {
        this.props.navigation.push('EditItem', {
          date: item.date.toDate(),
          title: item.title,
          subtitle: item.subtitle,
          userEmail: this.props.route.params.userEmail,
          itemId: this.props.route.params.itemId,
          url: item.url,
          lat: item.lat,
          long: item.long,
          photo: item.photo,
          index: index,
          onPop: () => {
            this.refresh();
          }
        });
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
                  .ref(`${auth().currentUser.email}/${this.props.route.params.itemId}`)
                  .listAll();
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
                  this.props.navigation.replace("Main"); //메인
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
      this.props.navigation.setOptions({
        title: translate("EditScreen"),
        headerRight: () => 
        <View style={{flexDirection: 'row',}}>
          <TouchableOpacity style={{
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
        </View>
      });
      this.refresh();

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
          this.state._map.current.animateCamera(
            {
              center: {
                latitude: this.state.list[index].lat,
                longitude: this.state.list[index].long,
              }
            },
            350
          );
        }
      });
    }

    componentWillUnmount() {
      this.state.mapAnimation.removeAllListeners();
    }

    render() {
      console.log(this.state.list);
      return(
        <SafeAreaView style={styles.container}>
          { this.state.loading ? 
            <View style={[styles.buttonContainer, {backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff', width: "100%", height: "100%"}]}>
                <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
            </View>
          : this.state.viewcode == 0 ? 
          <View style={{width: "100%", height: "91%"}}>
            <MapView
              ref={this.state._map}
              style={{flex: 1, width: "100%", marginBottom: this.state.marginBottom}}
              provider={PROVIDER_GOOGLE} // remove if not using Google Maps
              initialRegion={{
                latitude: this.props.route.params.latitude,
                longitude: this.props.route.params.longitude,
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
              // onRegionChangeComplete={(e) => {
              //   this.setState({ 
              //     lat: e.latitude,
              //     long: e.longitude,
              //     latDelta: e.latitudeDelta,
              //     longDelta: e.longitudeDelta,
              //   });
              // }}
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
                    draggable
                    title={data.title}
                    description={data.subtitle}
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
                    coordinate={ {latitude: data.lat, longitude: data.long} }
                    anchor={{x: 0.5, y: 0.5}}
                    onPress={e => {
                      let x = (index * CARD_WIDTH) + (index * 20); 
                      if (Platform.OS === 'ios') {
                        x = x - SPACING_FOR_CARD_INSET;
                      }

                      this.state._map.current.animateCamera(
                        {
                          center: {
                            latitude: data.lat,
                            longitude: data.long,
                          }
                        },
                        350
                      );
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
            <View style={[styles.scrollView, {backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}]}>
              <DraggableFlatList
                onRef={(flatList) => (this.setState({ 
                  _scrollView: flatList,
                }))}
                contentInset={{
                  top: 0,
                  left: SPACING_FOR_CARD_INSET,
                  bottom: 0,
                  right: SPACING_FOR_CARD_INSET
                }}
                contentOffset={{x: Platform.OS === 'ios' ? -SPACING_FOR_CARD_INSET : 0, y: 0}}
                contentContainerStyle={{
                  paddingHorizontal: Platform.OS === 'android' ? SPACING_FOR_CARD_INSET : 0
                }}
                snapToAlignment="center"
                decelerationRate="fast"
                pagingEnabled
                snapToInterval={CARD_WIDTH + 20}
                data={this.state.list}
                keyExtractor={this.keyExtractorForMap}
                renderItem={this.renderMap}
                onDragEnd={({ data }) => this.setState({ 
                  list: data,
                  changed: true,
                })}
                horizontal
              />
            </View>
          </View> : (
            // this.state.viewcode == 1 ? 
            <DraggableFlatList
              style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
              keyExtractor={this.keyExtractor}
              data={this.state.list}
              renderItem={this.renderItem}
              onDragEnd={({ data }) => this.setState({ 
                list: data,
                changed: true,
              })}
            />
          // : <FlatList
          //     style={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
          //     key={20}
          //     data={this.state.list}
          //     renderItem={this.renderGrid}
          //     numColumns={3}
          // />
          )}
          <View
            style={styles.floatingViewStyle}>
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
            <TouchableOpacity onPress={() => { // EditList로 이동
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
      height: CARD_HEIGHT + 10,
    },
    stock: { // 사진 밑 제목과 소제목
      position: 'absolute',
      bottom: 0,
      width: "100%",
      backgroundColor: 'rgba(52, 52, 52, 0.8)',
    },
});