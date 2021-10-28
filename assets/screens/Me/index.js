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

import FastImage from 'react-native-fast-image';

import { itemSkus, adsFree, translate, adBannerUnitId } from '../Utils';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
// import { BannerAd, TestIds, BannerAdSize } from '@react-native-firebase/admob';
import { AdMobBanner } from 'react-native-admob';

import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
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
        other: false,
        followersLength: 0,
        followingsLength: 0,
        viewsLength: 0,
        list: [],
        follow: false,
        displayName: '',
        profileURL: '', // 사진 URL
        localProfileURL: '', // 상대 위치 참조 URL
        ads: true,
        loading: true,
        lazyend: false,
        endDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
    }

    lazy = async () => {
        const uid = this.state.other ? this.props.route.params.userUid : auth().currentUser.uid;
        
        if (!this.state.lazyend && !this.state.loading) {
            const temp = [];
            await firestore()
                .collection(uid)
                .orderBy("modifyDate", "desc")
                .startAfter(this.state.endDate)
                .limit(10)
                .get()
                .then(async (querySnapshot) => {
                    for (var i = 0; i < querySnapshot.docs.length; i++) {
                        const data = querySnapshot.docs[i].data();
                        var URL = "";
                        try {
                            var URL = await storageRef.child(uid + "/" + querySnapshot.docs[i].id + "/" + data.data[data.thumbnail].photo).getDownloadURL();
                        } catch (e) {
                            console.log(e);
                        } finally {
                            temp.push({ 
                                name: data.title,
                                subtitle: data.subtitle,
                                url: URL,
                                id: querySnapshot.docs[i].id,
                                viewcode: data.viewcode,
                                data: data.data, // 가장 중요
                            });
                        }
                    }
                });

            if (temp.length != 10) {
                this.setState({
                    lazyend: true,
                    endDate: temp[temp.length - 1].data.modifyDate,
                    list: this.state.list.concat(temp),
                });
            } else { 
                this.setState({
                    endDate: temp[temp.length - 1].data.modifyDate,
                    list: this.state.list.concat(temp),
                });
            }
        }
    }

    follow = async () => {
        if (this.state.loading || !this.state.other) {
            return;
        }

        var userRef = await firestore().collection("Users").doc(this.props.route.params.userUid);
        var meRef = await firestore().collection("Users").doc(auth().currentUser.uid);
        var sfDocRef = await userRef.collection("follower").doc(auth().currentUser.uid);
        var sfDocRefForMe = await meRef.collection("following").doc(this.props.route.params.userUid);
        return firestore().runTransaction(async transaction => {
            const user = await transaction.get(userRef);
            const me = await transaction.get(userRef);
            const othersFollower = await transaction.get(sfDocRef);
            const myFollowing = await transaction.get(sfDocRefForMe);
            const now = firestore.Timestamp.fromMillis((new Date()).getTime());

            if (!myFollowing.exists) {
                transaction.set(sfDocRef, {
                    date: now
                });
                transaction.set(sfDocRefForMe, {
                    date: now
                });
                transaction.update(user, {
                    followersLength: user.data().followersLength + 1,
                });
                transaction.update(me, {
                    followingsLength: me.data().followingsLength + 1,
                });
            } else {
                if (myFollowing.data().date + 600000 > now) { // 현재 시간보다 1시간 후에만 viewcount 업데이트 가능
                    transaction.delete(sfDocRef);
                    transaction.delete(sfDocRefForMe);
                    transaction.update(user, {
                        followersLength: user.data().followersLength - 1,
                    });
                    transaction.update(me, {
                        followingsLength: me.data().followingsLength - 1,
                    });
                } else {
                    Alert.alert(translate("Alert"), "You can unfollow this account after 10 minutes."); /// 10분이 지난 후 언팔로우 할 수 있습니다.
                }
            }
        });
    }

    refresh = async () =>  {
        if (this.state.loading) {
            return;
        }

        const uid = this.state.other ? this.props.route.params.userUid : auth().currentUser.uid;
        this.setState({
            list: [],
            profileURL: '', // 사진 URL
            localProfileURL: '', // 상대 위치 참조 URL
            loading: true,
            lazyend: false,
            endDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
        });

        await this.lazy();

        var userRef = await firestore().collection("Users").doc(uid);
        var followRef = await firestore().collection("Users").doc(auth().currentUser.uid).collection("following").doc(this.props.route.params.userUid);
        var viewRef = await firestore().collection("Users").doc(auth().currentUser.uid).collection("view").doc(this.props.route.params.userUid);
        var storageRef = await storage().ref();

        return firestore().runTransaction(async transaction => {
            const user = await transaction.get(userRef);
            const sub_follow = await followRef.get();
            const sub_view = await transaction.get(viewRef);
            const now = firestore.Timestamp.fromMillis((new Date()).getTime());

            if (uid == auth().currentUser.uid) {
                if (!user.exists) {
                    await user.set({
                        followersLength: 0,
                        followingsLength: 0,
                        viewsLength: 1,
                        profile: '',
                        modifyDate: now,
                        displayName: auth().currentUser.uid,
                    });

                    await user.collection("following").doc(uid).set({date: now});
                    await user.collection("follower").doc(uid).set({date: now});
                    await user.collection("view").doc(uid).set({date: now});

                    const update = {
                        displayName: auth().currentUser.uid
                    };

                    await auth().currentUser.updateProfile(update);
                } 
            }
            
            data = user.data();

            if (!sub_view.exists) {
                transaction.update(user, {
                    viewsLength: user.data().viewsLength + 1,
                });
                transaction.set(sub_view, {
                    date: now
                });
            } else {
                if (sub_view.data().date + 3600000 < now) { // 현재 시간보다 1시간 후에만 viewcount 업데이트 가능
                    transaction.update(user, {
                        viewsLength: user.data().viewsLength + 1,
                    });
                    transaction.update(sub_view, {
                        date: now
                    });
                }
            }

            var URL = "";
            try {
                var URL = storageRef.child(uid + "/" + data.profile).getDownloadURL() || '';
            } catch (e) {
                console.log(e);
            } finally {
                this.setState({
                    followersLength : data.followersLength,
                    followingsLength : data.followingsLength,
                    viewsLength : data.viewsLength,
                    localProfileURL : data.profile,
                    follow: sub_follow.exists,
                    displayName: data.displayName,
                    profileURL: URL,
                    loading: false,
                });
            }
        });
    }

    async componentDidMount() {
        console.log("adsFree: ", adsFree);

        this.setState({
            ads: !adsFree,
            other: this.props.route != null,
        });

        // if (Platform.OS === 'android') {
        //     Linking.getInitialURL().then(url => {
        //         this.navigate(url);
        //     });
        // } else {
        //     Linking.addEventListener('url', this.handleOpenURL);
        // }

        if (!this.state.other) {
            await requestUserPermission();
            Linking.getInitialURL().then(url => {
                this.navigate(url);
            });
            
            Linking.addEventListener('url', this.handleOpenURL);
        } else {
            this.props.navigation.setOptions({ 
                title: translate("OtherAccount"),
                headerRight: () => 
                <View style={{flexDirection: 'row',}}>
                    <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {marginRight: 10, alignSelf: 'flex-end', height:45, width: "30%", borderRadius:5,}]} onPress={async () => { 
                        if (!this.state.loading) {
                            await this.follow()
                            .then(() => console.log('Post likes incremented via a transaction'))
                            .catch(error => console.error(error));
                        }
                    }}>
                        <Text style={styles.loginText}>{this.state.follow ? translate('Unfollow') : translate('Follow') }</Text>
                    </TouchableOpacity>
                </View>
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
    //     if (!params['user'] || !params['id']) {
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
                userUid: auth().currentUser.uid,
                onPop: () => this.refresh(),
            }) }}
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
            {item.name}
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
                <View style={styles.title}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: "100%"}}>
                        <View style={{justifyContent: 'flex-start', marginLeft: 10}}>
                            <Image
                                style={{flex: 1, width: 120, height: 120, resizeMode: 'cover'}}
                                source={Appearance.getColorScheme() === 'dark' ? require('./../../logo/graphicImage2.png') : require('./../../logo/graphicImage1.png')}/>
                        </View>
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginRight: 10}}>
                        { !this.state.other ? 
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
                <View style={[{width: '100%', height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff' }]}>
                    <View style={{
                        marginTop:10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        // marginTop:-30,
                    }}>
                        <TouchableOpacity style={{flex:1/3, aspectRatio:1}} onPress={() => { 
                            if (!this.state.other) {
                                this.props.navigation.push('EditProfile', {
                                    profileURL: this.state.profileURL,
                                    localProfileURL: this.state.localProfileURL, // 상대 위치 참조 URL
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
                            />
                        </TouchableOpacity>
                    </View>
                    <Text style={{fontWeight: 'bold', textAlign: 'center', marginTop: 10, color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                        {this.state.other ? this.state.displayName : auth().currentUser.displayName}
                    </Text>
                    <Text selectable style={{textAlign: 'center', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                        {this.state.other ? this.props.route.params.userUid : auth().currentUser.uid}
                    </Text>
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
                            <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("Followers")} </Text>
                            <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {this.state.followersLength} </Text>
                        </View>
                        <TouchableOpacity 
                        style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} onPress={() => { 
                            if (!this.state.other) {
                                this.props.navigation.push('Following', {
                                    userUid: auth().currentUser.uid,
                                    onPop: () => this.refresh(),
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
                        {this.state.ads && <AdMobBanner
                            adSize="banner"
                            adUnitID={adBannerUnitId}
                            testDevices={[AdMobBanner.simulatorId]}
                            onAdFailedToLoad={error => console.error(error)}
                        />}
                    </View>
                    {this.state.list.length > 0 ? <FlatList
                        style={{width: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff" }}
                        keyExtractor={this.keyExtractor}
                        data={this.state.list}
                        renderItem={this.renderItem}
                        onRefresh={() => this.refresh}
                        onEndReached={this.lazy}
                        onEndReachedThreshold={.7}
                        refreshing={this.state.loading}
                    />
                    : <View style={{width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
                        <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000', textAlign: 'center'}}>{translate("MeEmpty")}</Text>
                    </View>
                    }
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
        alignItems: 'center',
    },
    title: { 
        width: "100%",
        height: 50,
        justifyContent: 'space-between',
        flexDirection: 'row',
        backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#fff'
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom:5,
    },
});