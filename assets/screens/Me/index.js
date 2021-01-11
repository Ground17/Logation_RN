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

import { adsFree, translate, LocalizationContext } from '../Utils';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import { BannerAd, TestIds, BannerAdSize } from '@react-native-firebase/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

import { TabActions } from '@react-navigation/native';

const adBannerUnitId = __DEV__ ? TestIds.BANNER : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3050510769' 
    : 'ca-app-pub-1477690609272793/8274029234');

const itemSkus = [
  'adfree_for_1month',
  'adfree_for_1year'
]

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
    static contextType = LocalizationContext

    state = {
        followers: [],
        followings: [],
        views: [],
        list: [],
        profileURL: '', // 사진 URL
        localProfileURL: '', // 상대 위치 참조 URL
        ads: true,
        loading: true,
    }

    async refresh() {
        const {initializeAppLanguage} = this.context;
        this.setState({
            followers: [],
            followings: [],
            views: [],
            list: [],
            profileURL: '', // 사진 URL
            localProfileURL: '', // 상대 위치 참조 URL
            loading: true,
        });

        await initializeAppLanguage();

        const user = await firestore().collection("Users").doc(auth().currentUser.uid);
        var storageRef = await storage().ref();
        if (!(await user.get()).exists) {
            await user.set({
                follower: [],
                following: [],
                view: [],
                uid: auth().currentUser.uid,
                profile: '',
                modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                displayName: auth().currentUser.uid,
            });

            const update = {
                displayName: auth().currentUser.uid
            };

            await auth().currentUser.updateProfile(update);

            await user.update({
                displayName: auth().currentUser.uid,
            });
        } else {
            data = (await user.get()).data();
            await this.setState({
                followers : data.follower,
                followings : data.following,
                views : data.view,
                localProfileURL : data.profile
            });

            if (!data.displayName || !auth().currentUser.displayName || data.displayName != auth().currentUser.displayName) {
                const update = {
                    displayName: auth().currentUser.uid
                };

                await auth().currentUser.updateProfile(update);

                await user.update({
                    displayName: auth().currentUser.uid,
                });
            }
            try {
                this.setState({profileURL : await storageRef.child(auth().currentUser.uid + "/" + data.profile).getDownloadURL()});
            } catch (e) {
                this.setState({profileURL : ''});
            }
        }

        await firestore()
            .collection(auth().currentUser.uid)
            .orderBy("modifyDate", "desc")
            .get()
            .then(async (querySnapshot) => {
                for (var i=0; i < querySnapshot.docs.length; i++) {
                    console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
                    var URL = "";
                    try {
                        var URL = await storageRef.child(await auth().currentUser.uid + "/" + querySnapshot.docs[i].id + "/" + querySnapshot.docs[i].data().thumbnail).getDownloadURL();
                    } catch (e) {
                        console.log(e);
                    } finally {
                        data = querySnapshot.docs[i].data();
                        this.setState({
                            list: this.state.list.concat({ 
                                name: data.title,
                                subtitle: data.subtitle,
                                url: URL,
                                id: querySnapshot.docs[i].id,
                                viewcode: data.viewcode,
                            })
                        });
                    }
                }
            });
        const jumpToAction = TabActions.jumpTo('Me');
        this.props.navigation.dispatch(jumpToAction);
        this.setState({
            loading: false,
        });
    }

    async componentDidMount() {
        console.log("adsFree: ", adsFree);
        this.setState({
            ads: !adsFree,
        });

        await this.refresh();
        await requestUserPermission();

        Linking.getInitialURL().then(url => {
            this.navigate(url);
        });
        
        Linking.addEventListener('url', this.handleOpenURL);
    }

    componentWillUnmount() {
        Linking.removeEventListener('url', this.handleOpenURL);
    }

    handleOpenURL = (event) => {
        console.log(event.url);
        this.navigate(event.url);
    }

    navigate = (url) => { // url scheme settings (ex: https://travelog-4e274.web.app/?user=j2OeONPCBnW7mc2N2gMS7FZ0ZZi2&&id=2EgGSgGMVzHFzq8oErBi)
        var regex = /[?&]([^=#]+)=([^&#]*)/g,
            params = {},
            match;
        var i = 0;
        while (match = regex.exec(url)) {
            params[match[1]] = match[2];
            i++;
        }
        console.log(params)
        if (!params['user'] || !params['id']) {
            return;
        }
        this.props.navigation.push('ShowScreen', {
            itemId: params['id'],
            userUid: params['user'],
            onPop: () => this.refresh(),
        });
    }


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
                        <TouchableOpacity style={{marginRight:5}} onPress={() => { this.refresh() }}>
                            <Icon
                                name='refresh'
                                size={24}
                                color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginRight:5}} onPress={() => { this.props.navigation.push('Notification') }}>
                            <Icon
                                name='notifications'
                                size={24}
                                color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginRight:5}} onPress={() => { this.props.navigation.push('AddList', {
                            onPop: () => this.refresh(),
                        }) }}>
                            <Icon
                                name='add-circle-outline'
                                size={24}
                                color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginRight:10}} onPress={() => { this.props.navigation.push('Settings') }}>
                            <Icon
                                name='settings'
                                size={24}
                                color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                { !this.state.loading ? 
                <View style={[{width: '100%', height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff' }]}>
                    <View style={{
                        marginTop:10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        // marginTop:-30,
                    }}>
                        <TouchableOpacity style={{flex:1/3, aspectRatio:1}} onPress={() => { 
                            this.props.navigation.push('EditProfile', {
                                profileURL: this.state.profileURL,
                                localProfileURL: this.state.localProfileURL, // 상대 위치 참조 URL
                                onPop: () => this.refresh(),
                            })
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
                        {auth().currentUser.displayName}
                    </Text>
                    <Text selectable style={{textAlign: 'center', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                        {auth().currentUser.uid}
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
                            <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {this.state.followers.length} </Text>
                        </View>
                        <TouchableOpacity 
                        style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} onPress={() => { this.props.navigation.push('Following', {
                            userUid: auth().currentUser.uid,
                            onPop: () => this.refresh(),
                        }) }}>
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("Followings")} </Text>
                                <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {this.state.followings.length} </Text>
                            </View>
                        </TouchableOpacity>
                        <View style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("Views")} </Text>
                            <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {this.state.views.length} </Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center', marginBottom: 5}}>
                        {this.state.ads && <BannerAd 
                            unitId={adBannerUnitId} 
                            size={BannerAdSize.BANNER}
                        />}
                    </View>
                    {this.state.list.length > 0 ? <FlatList
                        style={{width: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff" }}
                        keyExtractor={this.keyExtractor}
                        data={this.state.list}
                        renderItem={this.renderItem}
                        onRefresh={() => this.refresh()}
                        refreshing={this.state.loading}
                    />
                    : <View style={{width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
                        <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000', textAlign: 'center'}}>{translate("MeEmpty")}</Text>
                    </View>
                    }
                </View>
                : <View style={{flex: 1, width: "100%", height: "100%", alignItems: 'center', justifyContent: 'center', backgroundColor: Appearance.getColorScheme() === 'dark' ? '#000' : '#fff'}}>
                     <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
                </View>}
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