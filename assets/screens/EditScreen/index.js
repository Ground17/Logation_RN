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
    };

    keyExtractor = (item, index) => index.toString()

    renderItem = ({ item, index, drag, isActive }) => (
      <ListItem
        title={item.title}
        titleStyle={{ fontWeight: 'bold' }}
        subtitle={item.date.toDate().toString()}
        leftAvatar={{ source: { uri: item.url }, rounded: false}}
        onLongPress={drag}
        bottomDivider
        onPress={() => { 
          if (this.state.delete) {
            this.alertDelete(item);
          } else {
            this.goEditItem(item, index);
          }
        }}
      />
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
      });

      var storageRef = storage().ref();
      
      await firestore()
        .collection(auth().currentUser.email)
        .doc(this.props.route.params.itemId)
        .get()
        .then(async (documentSnapshot) => {
          if (documentSnapshot.exists) {
            console.log('data: ', documentSnapshot.data());
            data = documentSnapshot.data();
            this.setState({
              category: data.category,
              date: data.date.toDate(),
              title: data.title,
              subtitle: data.subtitle,
              link: data.link,
            });
            for (var i=0; i < data.data.length; i++) {
              try {
                var URL = await storageRef.child(this.props.route.params.userEmail + "/" + this.props.route.params.itemId + "/" + data.data[i].photo).getDownloadURL();
                // console.log(data.data);
                // console.log(i);
                console.log(data.data[i].date.toDate());
                this.setState({
                  list: this.state.list.concat({ 
                    date: data.data[i].date,
                    title: data.data[i].title,
                    subtitle: data.data[i].subtitle,
                    photo: data.data[i].photo,
                    url: URL,
                    lat: data.data[i].lat,
                    long: data.data[i].long,
                  }),
                });
                if (this.state.list.length > 0) {
                  this.setState({ 
                    lat: this.state.list[0].lat,
                    long: this.state.list[0].long,
                  });
                }
              } catch (error) {
                  console.log(error);
              }
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
        .where("email", "==", auth().currentUser.email)
        .get()
        .then(async (querySnapshot) => {
          querySnapshot.forEach(async (documentSnapshot) => {
            await documentSnapshot.ref.update({
              modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
            });
          });
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
          'Confirm', //확인
          'Will you save the changes?', //변경점을 저장하시겠습니까?
          [
              {text: 'Cancel', onPress: () => { 
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
              {text: 'OK', onPress: async () => {
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
          'Alert', //알림
          'Are you sure you want to delete this log? This behavior is irreversible.', //이 기록을 지우시겠습니까? 지우시면 다시 복구할 수 없습니다.
          [
              {text: 'Cancel', onPress: () => {  }},
              {text: 'OK', onPress: async () => {
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
                  this.props.navigation.replace("Main"); //메인
                }
                }
              },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          'Confirm', //확인
          'Are you sure you want to delete this image?', // 사진을 지우시겠습니까?
          [
              {text: 'Cancel', onPress: () => {  }},
              {
                text: 'OK', onPress: async () => {
                  console.log(item);
                  this.setState({
                    list: this.state.list.filter(data => item !== data),
                    chagned: true,
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
        headerRight: () => 
        <View style={{flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',}}>
            <TouchableOpacity style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 4,
                paddingRight: 4,
              }} onPress={() => {
              this.setState({
                delete: !this.state.delete,
              });
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
                paddingRight: 4,
              }} onPress={() => { // EditList로 이동
                    if (this.state.changed) {
                      Alert.alert(
                        'Confirm',
                        'Will you save the changes?',
                        [
                            {text: 'Cancel', onPress: () => this.goEditList()},
                            {text: 'OK', onPress: async () => {
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
              <Icon
                name="library-add"
                size={20}
                color='#fff'
              />
            </TouchableOpacity>
            <TouchableOpacity style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 4,
                paddingRight: 4,
              }} onPress={() => { 
                  if (this.state.viewcode > 1) {
                    this.setState({
                      viewcode: 0,
                      changed: true,
                    });
                  } else {
                    this.setState({
                      viewcode: this.state.viewcode + 1,
                      changed: true,
                    });
                  }
                }}>
              <Icon
                name="tune"
                size={20}
                color='#fff'
              />
            </TouchableOpacity>
            <TouchableOpacity style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 4,
                paddingRight: 4,
              }} onPress={() => {
              if (this.state.changed) {
                Alert.alert(
                  'Confirm', //확인
                  'Will you save the changes?', //변경점을 저장하시겠습니까?
                  [
                      {text: 'Cancel', onPress: () => {  }},
                      {text: 'OK', onPress: async () => {
                        await this.update();
                      }},
                  ],
                  { cancelable: false }
                );
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
      this.setState({
        viewcode: this.props.route.params.viewcode,
      });
      this.refresh();
    }
    render() {
      console.log(this.state.list);
      return(
        <SafeAreaView style={styles.container}>
          { this.state.loading ? 
            <View style={styles.buttonContainer}>
                <ActivityIndicator size="large" color="#002f6c" />
                <Text> The more pictures you have, the more time it can take to upload. </Text>
            </View>
          : this.state.viewcode == 0 ? <MapView
            style={{flex: 1, width: "100%", marginBottom: this.state.marginBottom}}
            provider={PROVIDER_GOOGLE} // remove if not using Google Maps
            region={{
              latitude: this.state.lat,
              longitude: this.state.long,
              latitudeDelta: this.state.latDelta,
              longitudeDelta: this.state.longDelta,
            }}
            onMapReady={() => {
              this.setState({marginBottom: 0})
              Platform.OS === 'android' ? PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) : ''
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            onRegionChangeComplete={(e) => {
              this.setState({ 
                lat: e.latitude,
                long: e.longitude,
                latDelta: e.latitudeDelta,
                longDelta: e.longitudeDelta,
              });
            }}
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
              title={data.title}
              description={"See details"}
              onPress={e => {
                  console.log(e.nativeEvent);
                  if (this.state.delete) {
                    this.alertDelete(data);
                  } else {
                    this.goEditItem(data, index);
                  }
                }
              }
            />
          ))}
          </MapView>
          : (this.state.viewcode == 1 ? <DraggableFlatList
              keyExtractor={this.keyExtractor}
              data={this.state.list}
              renderItem={this.renderItem}
              onDragEnd={({ data }) => this.setState({ 
                list: data,
                changed: true,
              })}
          />
          : <FlatList
              key={3}
              data={this.state.list}
              renderItem={this.renderGrid}
              numColumns={3}
          />)}
          <View
            style={styles.floatingViewStyle}>
            <Text style={{fontSize: 18, textAlign: 'center', width: 160}}> {"Mode: " + (this.state.delete ? "delete" : "edit" )} </Text>
          </View>
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
    floatingViewStyle: {
      position: 'absolute',
      height: 50,
      flexDirection: 'row',
      alignSelf: 'center',
      bottom: 15,
    },
});