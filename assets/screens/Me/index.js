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
} from 'react-native';

import { adsFree, translate, screenId, screenEmail, } from '../Utils';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import { BannerAd, TestIds, BannerAdSize } from '@react-native-firebase/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

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
    console.log('Permission status:', authorizationStatus);

    messaging().onMessage(async remoteMessage => {
        Alert.alert('A new message arrived!', JSON.stringify(remoteMessage));
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message handled in the background!', remoteMessage);
    });

    const token = await messaging().getToken();

    await firestore()
        .collection('Users')
        .doc(auth().currentUser.email)
        .update({
            tokens: firestore.FieldValue.arrayUnion(token),
        });
  }
}

export default class Me extends Component {
    state = {
        followers: [],
        followings: [],
        views: [],
        list: [],
        profileURL: '', // 사진 URL
        localProfileURL: '', // 상대 위치 참조 URL
        ads: true,
    }

    async refresh() {
        this.setState({
            followers: [],
            followings: [],
            views: [],
            list: [],
            profileURL: '', // 사진 URL
            localProfileURL: '', // 상대 위치 참조 URL
        });

        const user = await firestore().collection("Users").doc(auth().currentUser.email);
        var storageRef = await storage().ref();
        if (!(await user.get()).exists) {
            await user.set({
                follower: [],
                following: [],
                view: [],
                email: auth().currentUser.email,
                profile: '',
                modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                displayName: auth().currentUser.email,
            });

            const update = {
                displayName: auth().currentUser.email
            };

            await auth().currentUser.updateProfile(update);

            await user.update({
                displayName: auth().currentUser.email,
            });
        } else {
            data = (await user.get()).data();
            this.setState({
                followers : data.follower,
                followings : data.following,
                views : data.view,
                localProfileURL : data.profile
            });

            if (!data.displayName || !auth().currentUser.displayName || data.displayName != auth().currentUser.displayName) {
                const update = {
                    displayName: auth().currentUser.email
                };

                await auth().currentUser.updateProfile(update);

                await user.update({
                    displayName: auth().currentUser.email,
                });
            }

            try {
                this.setState({profileURL : await storageRef.child(auth().currentUser.email + "/" + data.profile).getDownloadURL()});
            } catch (e) {
                this.setState({profileURL : ''});
            }
        }

        // Linking.getInitialURL().then(url => {
        //     this.navigate(url);
        // });
        
        Linking.addEventListener('url', this.handleOpenURL);
        
        await firestore()
            .collection(auth().currentUser.email)
            .orderBy("modifyDate", "desc")
            .get()
            .then(async (querySnapshot) => {
                for (var i=0; i < querySnapshot.docs.length; i++) {
                    console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
                    var URL = "";
                    try {
                        var URL = await storageRef.child(await auth().currentUser.email + "/" + querySnapshot.docs[i].id + "/" + querySnapshot.docs[i].data().thumbnail).getDownloadURL();
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
    }

    async componentDidMount() {
        console.log("adsFree: ", adsFree);
        this.setState({
            ads: !adsFree,
        });
        await requestUserPermission();
        await this.refresh();

        if (screenId != '' && screenEmail != '') {
            this.props.navigation.push('ShowScreen', {
                itemId: screenId,
                userEmail: screenEmail,
                onPop: () => this.refresh(),
            });
        }
    }

    componentWillUnmount() {
        Linking.removeEventListener('url', this.handleOpenURL);
    }
    handleOpenURL = (event) => {
        console.log(event.url);
        this.navigate(event.url);
    }

    navigate = (url) => { // url scheme settings (ex: https://travelog-4e274.web.app/?email=hyla981020@naver.com&&id=2EgGSgGMVzHFzq8oErBi)
        var regex = /[?&]([^=#]+)=([^&#]*)/g,
            params = {},
            match;
        var i = 0;
        while (match = regex.exec(url)) {
            params[match[1]] = match[2];
            i++;
        }
        console.log(params)
        if (!params['email'] || !params['id']) {
            return;
        }
        this.props.navigation.push('ShowScreen', {
            itemId: params['id'],
            userEmail: params['email'],
            onPop: () => this.refresh(),
        });
    }


    constructor(props) {
        super(props);
    }

    keyExtractor = (item, index) => index.toString()

    renderItem = ({ item }) => (
        <ListItem
            title={item.name}
            titleStyle={{ fontWeight: 'bold', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000' }}
            subtitle={item.subtitle}
            subtitleStyle={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}
            leftAvatar={{ source: { uri: item.url }, rounded: false}}
            containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff'}}
            bottomDivider
            onPress={() => { this.props.navigation.push('ShowScreen', {
                itemId: item.id,
                userEmail: auth().currentUser.email,
                onPop: () => this.refresh(),
            }) }}
        />
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
                <View style={[{width: '100%', backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff' }]}>
                    <View style={{
                        marginTop:10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        // marginTop:-30,
                    }}>
                        <Avatar 
                            rounded
                            size="xlarge" 
                            activeOpacity={0.7}
                            source={this.state.profileURL ? {
                                uri:
                                this.state.profileURL,
                            } : require('./../../logo/ic_launcher.png')}
                            icon={{ name: 'account-box' }} 
                            onPress={() => {
                                this.props.navigation.push('EditProfile', {
                                    profileURL: this.state.profileURL,
                                    localProfileURL: this.state.localProfileURL, // 상대 위치 참조 URL
                                    onPop: () => this.refresh(),
                                })
                            }}
                        />
                    </View>
                    <Text style={{fontWeight: 'bold', textAlign: 'center', marginTop: 10, color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                        {auth().currentUser.displayName}
                    </Text>
                    <Text style={{textAlign: 'center', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                        {auth().currentUser.email}
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
                            userEmail: auth().currentUser.email,
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
                </View>
                <FlatList
                    style={{width: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff" }}
                    keyExtractor={this.keyExtractor}
                    data={this.state.list}
                    renderItem={this.renderItem}
                />
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