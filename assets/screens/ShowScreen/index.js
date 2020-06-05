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
  TouchableHighlight,
  PermissionsAndroid,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import { TouchableOpacity } from 'react-native-gesture-handler';

import Share from 'react-native-share';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

export default class ShowScreen extends Component {
    state = {
      viewcode: 0,
      list: [],
      link: "",
      like: {},
      view: [],
      liked: false,
      disliked: false,
      likeCount: 0,
      dislikeCount: 0,
      marginBottom: 1,
    };

    keyExtractor = (item, index) => index.toString()
    keyExtractor2 = (item, index) => {`item-${index}`}

    renderItem = ({ item, index }) => (
        <ListItem
            title={item.title}
            titleStyle={{ fontWeight: 'bold' }}
            subtitle={item.date.toDate().toString()}
            leftAvatar={{ source: { uri: item.url }, rounded: false}}
            bottomDivider
            onPress={() => { this.props.navigation.push('ShowItem', {
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
                    onPop: () => this.refresh(),
                }) 
            }}
        />
    )

    renderGrid = ({ item, index }) => (
      <TouchableHighlight onPress={() => {
        this.props.navigation.push('ShowItem', {
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
            onPop: () => this.refresh(),
        })
      }} 
        style={{flex:1/3, aspectRatio:1}}
      >
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
        link: "",
        like: {},
        view: [],
        liked: false,
        disliked: false,
        likeCount: 0,
        dislikeCount: 0,
        marginBottom: 1,
      });

      var storageRef = storage().ref();
      
      firestore()
        .collection(this.props.route.params.userEmail)
        .doc(this.props.route.params.itemId)
        .get()
        .then(async (documentSnapshot) => {
          if (documentSnapshot.exists) {
            console.log('data: ', documentSnapshot.data());
            data = documentSnapshot.data();
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
                    url: URL,
                    photo: data.data[i].photo,
                    lat: data.data[i].lat,
                    long: data.data[i].long,
                    }),
                  link: data.link,
                  like: data.like,
                  view: data.view,
                  viewcode: data.viewcode,
                });
                if (!data.view.includes(auth().currentUser.email)) {
                  documentSnapshot.ref.update({view: data.view.concat(auth().currentUser.email)});
                }
                var localLikeCount = 0;
                var localDislikeCount = 0;
                Object.keys(data.like).map((key, i) => {
                  if (key == auth().currentUser.email) {
                    this.setState({
                      liked: data.like[key],
                      disliked: !data.like[key],
                    });
                  }

                  if (data.like[key]) {
                    localLikeCount++;
                  } else {
                    localDislikeCount++;
                  }
                });
                this.setState({
                  likeCount: localLikeCount,
                  dislikeCount: localDislikeCount,
                });
              } catch (error) {
                  console.log(error);
              }
            }
          }
        });
      console.log(this.props.route.params.viewcode);
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
                  const url = 'https://footprintwithmap.site/?email=' + this.props.route.params.userEmail + '&id=' + this.props.route.params.itemId + '&viewcode=' + this.state.viewcode;
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
              <Icon
                name="share"
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
                    viewcode: 0
                  });
                } else {
                  this.setState({
                    viewcode: this.state.viewcode + 1
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
              }} onPress={async () => { 
                const supported = await Linking.canOpenURL(this.state.link);

                if (supported) {
                  // Opening the link with some app, if the URL scheme is "http" the web link should be opened
                  // by some browser in the mobile
                  await Linking.openURL(this.state.link);
                } else {
                  Alert.alert(`Don't know how to open this URL: ${this.state.link}`);
                }
              }}>
              <Icon
                name="launch"
                size={20}
                color='#fff'
              />
            </TouchableOpacity>
            {
              auth().currentUser.email == this.props.route.params.userEmail ? 
              <TouchableOpacity style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 4,
                  paddingRight: 4,
                }} onPress={() => {// 수정창(EditScreen) 열기
                  this.props.navigation.push('EditScreen', {
                    itemId: this.props.route.params.itemId,
                    userEmail: this.props.route.params.userEmail,
                    viewcode: this.props.route.params.viewcode,
                    onPop: () => this.refresh(),
                  })
              }}>
                <Icon
                  name="edit"
                  size={20}
                  color='#fff'
                />
              </TouchableOpacity>
              : <View></View>
            }
        </View>
      });
      console.log(this.props.route.params.viewcode);
      this.setState({
        viewcode: this.props.route.params.viewcode
      });

      this.refresh();
    }
    render() {
      console.log(this.state.list);
      return(
        <SafeAreaView style={styles.container}>
          { this.state.viewcode == 0 ? <MapView
            style={{flex: 1, width: "100%", marginBottom: this.state.marginBottom}}
            provider={PROVIDER_GOOGLE} // remove if not using Google Maps
            region={{
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
            showsCompass={false}
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
              coordinate={ {latitude: data.lat, longitude: data.long} }
              title={data.title}
              description={"See details"}
              onPress={e => {
                  console.log(e.nativeEvent);
                  this.props.navigation.push('ShowItem', {
                    date: data.date.toDate(),
                    title: data.title,
                    subtitle: data.subtitle,
                    userEmail: this.props.route.params.userEmail,
                    itemId: this.props.route.params.itemId,
                    url: data.url,
                    lat: data.lat,
                    long: data.long,
                    photo: data.photo,
                    index: index,
                    onPop: () => this.refresh(),
                  })
                }
              }
            />
          ))}
          </MapView>
          : (this.state.viewcode == 1 ? <FlatList
              keyExtractor={this.keyExtractor}
              data={this.state.list}
              renderItem={this.renderItem}
          />
          : <FlatList
              key={3}
              data={this.state.list}
              renderItem={this.renderGrid}
              numColumns={3}
          />)}

          <View
            style={styles.floatingViewStyle}>
            <View>
              <Icon
                reverse
                name='thumb-down'
                color={this.state.disliked ? '#bc477b' : '#bdbdbd'}
                size={50}
                onPress={async () => {
                  console.log('down');
                  var sfDocRef = firestore().collection(this.props.route.params.userEmail).doc(this.props.route.params.itemId);
                  await firestore().runTransaction(async (transaction) => {
                    var sfDoc = await transaction.get(sfDocRef);
                    if (!sfDoc.exists) {
                      throw "Document does not exist!";
                    }

                    var updateLike = data.like;
                    if (updateLike[auth().currentUser.email] == true) {
                      this.setState({
                        likeCount: this.state.likeCount - 1
                      });
                    }
                    updateLike[auth().currentUser.email] = false;
                    await transaction.update(sfDocRef, { like: updateLike });
                    this.setState({
                      like: updateLike,
                      dislikeCount: this.state.dislikeCount + 1,
                      liked: false,
                      disliked: true,
                    });
                  }).then(async () => {
                      console.log("success");
                  }).catch(async (err) => {
                      console.error(err);
                  });
                }}
              />
              <Text style={{textAlign: 'center'}}> {this.state.dislikeCount} </Text>
            </View>
            <View>
              <Icon
                reverse
                name='thumb-up'
                color={this.state.liked ? '#4f83cc' : '#bdbdbd'}
                size={50}
                onPress={async () => {
                  console.log('up');
                  var sfDocRef = firestore().collection(this.props.route.params.userEmail).doc(this.props.route.params.itemId);
                  await firestore().runTransaction(async (transaction) => {
                    var sfDoc = await transaction.get(sfDocRef);
                    if (!sfDoc.exists) {
                      throw "Document does not exist!";
                    }

                    var updateLike = data.like;
                    if (updateLike[auth().currentUser.email] == false) {
                      this.setState({
                        dislikeCount: this.state.dislikeCount - 1
                      });
                    }
                    updateLike[auth().currentUser.email] = true;
                    await transaction.update(sfDocRef, { like: updateLike });
                    this.setState({
                      like: updateLike,
                      likeCount: this.state.likeCount + 1,
                      liked: true,
                      disliked: false,
                    });
                  }).then(async () => {
                      console.log("success");
                  }).catch(async (err) => {
                      console.error(err);
                  });
                }}
              />
              <Text style={{textAlign: 'center'}}> {this.state.likeCount} </Text>
            </View>
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
      width: 110,
      height: 50,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'center',
      bottom: 50,
    },
});