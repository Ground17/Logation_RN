import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image, 
  Linking,
  Appearance,
  ActivityIndicator,
  Alert,
} from 'react-native';

import Share from 'react-native-share';

import FastImage from 'react-native-fast-image';

import { itemSkus, adsFree, translate, adBannerUnitId } from '../Utils';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import { BannerAd, TestIds, BannerAdSize } from '@react-native-admob/admob';

import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

import AsyncStorage from '@react-native-community/async-storage';

async function requestUserPermission() { // 현재 알림기능을 다 구현하지 않았기에 사용하지 않음
  const authorizationStatus = await messaging().requestPermission();

  if (authorizationStatus) {
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    }

    messaging().onMessage(async remoteMessage => {
        Alert.alert('A new message arrived!', JSON.stringify(remoteMessage));
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message handled in the background!', remoteMessage);
    });

    const token = await messaging().getToken();

    await firestore()
        .collection('Users')
        .doc(auth().currentUser.uid)
        .update({
            tokens: token,
        });
  }
}

export default class Me extends Component {
    // static contextType = LocalizationContext

    state = {
        other: this.props.route != null,
        followersLength: 0,
        followingsLength: 0,
        viewsLength: 0,
        logsLength: 0,
        list: [],
        follow: false,
        displayName: '',
        profileURL: '', // 사진 URL
        ads: !adsFree,
        loading: false,
        initialLoading: true,
        smallLoading: false, // 팔로우 트랜잭션을 위한 것
        lazyend: false,
        endDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
    }

    lazy = async (initial = false, start = false) => {
        if (initial) {
            this.setState({
                initialLoading: true,
                loading: true,
                list: [],
                lazyend: false,
                endDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
            });
        } else if (start) {
            this.setState({
                lazyend: false,
                loading: true,
                endDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
            });
        }
        const uid = this.state.other ? this.props.route.params.userUid : auth().currentUser.uid;
        var storageRef = await storage().ref();
        if (!this.state.lazyend) {
            const temp = [];
            await firestore()
                .collection(`Users/${uid}/log`)
                .where("security", "in", this.state.other ? [0] : [0, 1, 2])
                .orderBy("date", "desc")
                .startAfter(this.state.endDate)
                .limit(10)
                .get()
                .then(async (querySnapshot) => {
                    for (var i = 0; i < querySnapshot.docs.length; i++) {
                        const post = await firestore()
                            .collection("Posts")
                            .doc(querySnapshot.docs[i].id)
                            .get();
                        
                        if (post.exists) {
                            var URL = "";
                            var data = post.data();
                            try {
                                var photo = (data.thumbnail >= 0 && data.thumbnail < data.data.length) ? data.data[data.thumbnail].photo : data.data[0].photo;
                                photo = photo.substr(0, photo.lastIndexOf('.'));
                                // URL = await storageRef.child(uid + "/" + querySnapshot.docs[i].id + "/" + photo + "_144x144.jpeg").getDownloadURL();
                                URL = `https://storage.googleapis.com/travelog-4e274.appspot.com/${uid}/${querySnapshot.docs[i].id}/${photo}_144x144.jpeg`;
                            } catch (e) {
                                console.log(e);
                            } finally {
                                temp.push({ 
                                    title: data.title,
                                    subtitle: data.subtitle,
                                    link: data.link,
                                    url: URL, // 썸네일 URL
                                    id: querySnapshot.docs[i].id, // log의 id
                                    uid: data.uid, // log의 소유자
                                    displayName: this.state.displayName,
                                    profileURL: this.state.profileURL,
                                    date: data.date,
                                    modifyDate: data.modifyDate,
                                    category: data.category,
                                    data: data.data, // 가장 중요
                                    likeNumber: data.likeNumber,
                                    likeCount: data.likeCount,
                                    dislikeCount: data.dislikeCount,
                                    viewcode: data.viewcode,
                                    viewCount: data.viewCount,
                                    thumbnail: data.thumbnail,
                                });
                            }
                        } else {
                            // delete log in User
                        }
                    }
                });
            if (temp.length > 0) {
                this.setState({
                    endDate: temp[temp.length - 1].date,
                    list: (initial || start) ? temp : this.state.list.concat(temp),
                });
            } else {
                this.setState({
                    lazyend: true,
                });
            }
        }

        if (initial) {
            this.setState({
                initialLoading: false,
                loading: false,
            });
        } else {
            this.setState({
                loading: false,
            });
        }
    }

    follow = async () => {
        if (this.state.loading || !this.state.other) {
            return;
        }

        this.setState({
            smallLoading: true,
        });

        var userRef = firestore().collection("Users").doc(this.props.route.params.userUid);
        var meRef = firestore().collection("Users").doc(auth().currentUser.uid);
        var sfDocRefForMe = meRef.collection("following").doc(this.props.route.params.userUid);
        return await firestore().runTransaction(async transaction => {
            const user = await transaction.get(userRef);
            const me = await transaction.get(meRef);
            // const othersFollower = await transaction.get(sfDocRef);
            const myFollowing = await transaction.get(sfDocRefForMe);
            const now = firestore.Timestamp.fromMillis((new Date()).getTime());

            if (me.data().followingsLength >= 1000) {
                return;
            }

            if (!myFollowing.exists) {
                // transaction.set(sfDocRef, {
                //     date: now
                // });
                transaction.set(sfDocRefForMe, {
                    date: now
                });
                transaction.update(userRef, {
                    followersLength: user.data().followersLength + 1,
                });
                transaction.update(meRef, {
                    followingsLength: me.data().followingsLength + 1,
                });
                this.setState({
                    follow: true,
                    followersLength: this.state.followersLength + 1,
                });
            } else {
                if (myFollowing.data().date.seconds + 600 < now.seconds) { // 현재 시간보다 10분 후에만 viewcount 업데이트 가능
                    // transaction.delete(sfDocRef);
                    transaction.delete(sfDocRefForMe);
                    transaction.update(userRef, {
                        followersLength: user.data().followersLength - 1,
                    });
                    transaction.update(meRef, {
                        followingsLength: me.data().followingsLength - 1,
                    });
                    this.setState({
                        follow: false,
                        followersLength: this.state.followersLength - 1,
                    });
                } else {
                    Alert.alert(translate("Alert"), "You can unfollow this account after 10 minutes."); // 10분이 지난 후 언팔로우 할 수 있습니다.
                }
            }
        }).then(() => {
            this.setState({
                smallLoading: false,
            });
        }).catch((e) => {
            this.setState({
                smallLoading: false,
            });
        });
    }

    refresh = async () =>  {
        const uid = this.props.route != null ? this.props.route.params.userUid : auth().currentUser.uid;
        this.setState({
            profileURL: '', // 사진 URL
            loading: true,
        });

        console.log("uid:", uid);

        var meRef = await firestore().collection("Users").doc(auth().currentUser.uid);
        var userRef = await firestore().collection("Users").doc(uid);
        var followRef = await meRef.collection("following").doc(uid);
        var viewRef = await meRef.collection("viewProfile").doc(uid);
        var storageRef = await storage().ref();

        await this.lazy(true);

        return firestore().runTransaction(async transaction => {
            const user = await transaction.get(userRef);
            const sub_follow = await followRef.get();
            const sub_view = await transaction.get(viewRef);
            const now = firestore.Timestamp.fromMillis((new Date()).getTime());

            if (!sub_view.exists) {
                await transaction.update(userRef, {
                    viewsLength: user.data().viewsLength + 1,
                });
                await transaction.set(viewRef, {
                    date: now
                });
            } else {
                if (sub_view.data().date.seconds + 3600 < now.seconds) { // 현재 시간보다 1시간 후에만 viewcount 업데이트 가능
                    await transaction.update(userRef, {
                        viewsLength: user.data().viewsLength + 1,
                    });
                    await transaction.update(viewRef, {
                        date: now
                    });
                }
            }

            const data = user.data();
            var URL = "";
            try {
                URL = `https://storage.googleapis.com/travelog-4e274.appspot.com/${uid}/profile/profile_144x144.jpeg`;
            } catch (e) {
                console.log(e);
            } finally {
                this.setState({
                    followersLength: data.followersLength,
                    followingsLength: data.followingsLength,
                    logsLength: data.logsLength,
                    viewsLength: data.viewsLength,
                    follow: sub_follow.exists,
                    displayName: data.displayName,
                    profileURL: URL,
                    loading: false,
                });
                console.log("follow:", this.state.follow);
            }
        });
    }

    async componentDidMount() {
        // if (Platform.OS === 'android') {
        //     Linking.getInitialURL().then(url => {
        //         this.navigate(url);
        //     });
        // } else {
        //     Linking.addEventListener('url', this.handleOpenURL);
        // }

        if (this.props.route == null) {
            // await requestUserPermission();
            // Linking.getInitialURL().then(url => {
            //     this.navigate(url);
            // });
            
            // Linking.addEventListener('url', this.handleOpenURL);
        } else {
            this.props.navigation.setOptions({ 
                title: translate("OtherAccount"),
                // headerRight: () => 
                // <View style={{flexDirection: 'row',}}>
                //     <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {marginRight: 10, alignSelf: 'flex-end', height:45, width: "40%", }]} onPress={async () => { 
                //         if (!this.state.loading) {
                //             await this.follow()
                //             .then(() => console.log('Post likes incremented via a transaction'))
                //             .catch(error => console.error(error));
                //         }
                //     }}>
                //         <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>{this.state.follow ? translate('Unfollow') : translate('Follow') }</Text>
                //     </TouchableOpacity>
                // </View>
            });
        }

        await this.refresh()
            .then(() => console.log('Post likes incremented via a transaction'))
            .catch(error => console.error(error));
    }

    // componentWillUnmount() {
    //     if (!this.state.other) {
    //         Linking.removeEventListener('url', this.handleOpenURL);
    //     }
    // }

    // handleOpenURL = (event) => {
    //     console.log(event.url);
    //     this.navigate(event.url);
    // }

    // navigate = (url) => { // url scheme settings (ex: https://travelog-4e274.web.app/?user=j2OeONPCBnW7mc2N2gMS7FZ0ZZi2&&id=2EgGSgGMVzHFzq8oErBi)
    //     var regex = /[?&]([^=#]+)=([^&#]*)/g,
    //         params = {},
    //         match;
    //     var i = 0;
    //     while (match = regex.exec(url)) {
    //         params[match[1]] = match[2];
    //         i++;
    //     }
    //     console.log(params)
    //     if (!params['user'] && !params['id']) {
    //         return;
    //     }
    //     this.props.navigation.push('ShowScreen', {
    //         itemId: params['id'],
    //         userUid: params['user'],
    //         onPop: () => this.refresh(),
    //     });
    // }

    constructor(props) {
        super(props);
    }

    keyExtractor = (item, index) => index.toString()

    renderItem = ({ item }) => (
        <ListItem
            containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff'}}
            bottomDivider
            onPress={() => { this.props.navigation.push('ShowScreen', {
                itemId: item.id,
                title: item.title,
                subtitle: item.subtitle,
                link: item.link,
                url: item.url, // 썸네일 URL
                userUid: item.uid, // log의 소유자
                displayName: this.state.displayName,
                profileURL: this.state.profileURL,
                date: item.date,
                modifyDate: item.modifyDate,
                category: item.category,
                data: item.data,
                likeNumber: item.likeNumber,
                likeCount: item.likeCount,
                dislikeCount: item.dislikeCount,
                viewcode: item.viewcode,
                viewCount: item.viewCount,
                preUser: item.account,
                thumbnail: item.thumbnail,
                onPop: () => this.refresh(),
            }) }}
        >
        <View style={{flex:1/5, aspectRatio:1}}>
          <FastImage
            style={{flex: 1}}
            source={item.url ? {
                uri: item.url,
                priority: FastImage.priority.high
            } : require('./../../logo/ic_launcher.png')}
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

    render() {
        return(
            <SafeAreaView style={styles.container}>
                {this.props.route == null && 
                <View style={styles.title}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: "100%"}}>
                        <View style={{justifyContent: 'flex-start', marginLeft: 10}}>
                            <Image
                                style={{flex: 1, width: 70, height: 70, resizeMode: 'contain'}}
                                source={require('./../../logo/graphicImage.png')}/>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginRight: 10}}>
                            { this.props.route == null ? 
                            <View style={{flexDirection: 'row'}}>
                                <TouchableOpacity style={{marginRight:5}} onPress={() => { this.props.navigation.push('Notification') }}>
                                    <Icon
                                        name='notifications'
                                        size={24}
                                        color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity style={{marginRight:5}} onPress={() => { this.props.navigation.push('Settings') }}>
                                    <Icon
                                        name='settings'
                                        size={24}
                                        color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                                    />
                                </TouchableOpacity>
                            </View> : <View></View>
                            }
                            <TouchableOpacity style={{marginRight:10}} onPress={() => { this.refresh() }}>
                                <Icon
                                    name='refresh'
                                    size={24}
                                    color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>}
                { this.state.initialLoading ? <View style={{width: "100%", height: "100%", alignItems: 'center', justifyContent: 'center', backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff'}}>
                     <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
                </View> 
                : 
                <View style={[{width: '100%', backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff' }]}>
                    <View style={{
                        marginTop:10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        // marginTop:-30,
                    }}>
                        <TouchableOpacity style={{flex:1/3, aspectRatio:1}} onPress={() => { 
                            if (this.props.route == null) {
                                this.props.navigation.push('EditProfile', {
                                    profileURL: this.state.profileURL,
                                    onPop: () => this.refresh(),
                                })
                            }
                        }}>
                            <FastImage
                                style={{flex: 1, borderRadius: 100}}
                                source={this.state.profileURL ? {
                                    uri:
                                    this.state.profileURL,
                                } : require('./../../logo/ic_launcher.png')}
                                onError={() => this.setState({profileURL: ''})}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={{justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row',}}>
                        <View style={{justifyContent: 'center', alignItems: 'center', marginLeft:15}}>
                            <Text style={{fontWeight: 'bold', textAlign: 'left', marginTop: 10, color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                                {this.props.route != null ? this.state.displayName : auth().currentUser.displayName}
                            </Text>
                            <Text selectable style={{textAlign: 'left', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                                {this.props.route != null ? this.props.route.params.userUid : auth().currentUser.uid}
                            </Text>
                        </View>
                        <TouchableOpacity style={{justifyContent: 'center', alignItems: 'center', marginRight:15}} onPress={() => { 
                            const url = 'https://travelog-4e274.web.app/?user=' + (this.props.route != null ? this.props.route.params.userUid : auth().currentUser.uid);
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
                            <Icon
                                name='share'
                                size={24}
                                color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        marginBottom: 10,
                    }}>
                        <View style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("Log")} </Text>
                            <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {this.state.logsLength} </Text>
                        </View>
                        <TouchableOpacity 
                        style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} onPress={() => { 
                            if (this.props.route == null) {
                                this.props.navigation.push('Search', {
                                    follow: true, // this.state.follow와 다름
                                });
                            } }}>
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("Followings")} </Text>
                                <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {this.state.followingsLength} </Text>
                            </View>
                        </TouchableOpacity>
                        <View style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("Views")} </Text>
                            <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {this.state.viewsLength} </Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center', marginBottom: 5}}>
                        {this.state.ads && <BannerAd
                            size={BannerAdSize.BANNER}
                            unitId={adBannerUnitId}
                        />}
                    </View>
                </View> }

                {this.state.list.length > 0 ? <FlatList
                    style={{width: "100%", height: "93%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff" }}
                    keyExtractor={this.keyExtractor}
                    data={this.state.list}
                    renderItem={this.renderItem}
                    onRefresh={() => this.lazy(false, true)}
                    onEndReached={() => this.lazy()}
                    onEndReachedThreshold={.7}
                    refreshing={this.state.loading}
                />
                : <View style={{width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
                    <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000', textAlign: 'center'}}>{translate("MeEmpty")}</Text>
                </View>
                }
                { this.state.other && <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {position: 'absolute', alignSelf: 'flex-end', top: 10, right: 10, borderRadius:5,}]} onPress={async () => { 
                    if (!this.state.loading && !this.state.smallLoading) {
                        await this.follow()
                            .then(() => console.log('Post likes incremented via a transaction'))
                            .catch(error => console.error(error));
                    }
                }}>
                    {this.state.smallLoading ? 
                    <ActivityIndicator size="small" color='#01579b' />
                    : <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000', padding: 5}}>{this.state.follow ? translate('Unfollow') : translate('Follow') }</Text>}
                </TouchableOpacity> }
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: { 
        width: "100%",
        height: 30,
        marginBottom: 10,
        justifyContent: 'space-between',
        backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#fff'
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom:5,
    },
    loginButton: {
        backgroundColor: "#002f6c",
        borderColor: "#002f6c",
        borderWidth: 1,
    },
});