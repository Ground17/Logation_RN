import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image, 
  Linking
} from 'react-native';

import FastImage from 'react-native-fast-image'

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button, } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import { InterstitialAd, BannerAd, TestIds, BannerAdSize } from '@react-native-firebase/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { translate } from '../Utils';

const adBannerUnitId = __DEV__ ? TestIds.BANNER : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3050510769' 
    : 'ca-app-pub-1477690609272793/8274029234');

const adInterstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3775880012' 
    : 'ca-app-pub-1477690609272793/9626786110');

export default class Home extends Component {
    state = {
        list: [],
    }

    async refresh() {
        this.setState({
            list: [],
        });

        var storageRef = await storage().ref();

        await firestore()
            .collection("Users")
            .where("follower", "array-contains", auth().currentUser.email)
            .orderBy("modifyDate", "desc")
            .limit(7)
            .get()
            .then(async (querySnapshot) => {
                console.log("collectionPath", querySnapshot.docs);
                for (var i=0; i < querySnapshot.docs.length; i++) {
                    console.log("collectionPath", querySnapshot.docs[i].data().email);
                    await firestore()
                    .collection(querySnapshot.docs[i].data().email)
                    .orderBy("modifyDate", "desc")
                    .limit(3)
                    .get()
                    .then(async (querySnap) => {
                        for (var j=0; j < querySnap.docs.length; j++) {
                            var data = querySnap.docs[j].data();
                            var URL = "";
                            var profileURL = "";
                            try {
                                URL = await storageRef.child(querySnapshot.docs[i].data().email + "/" + querySnap.docs[j].id + "/" + data.thumbnail).getDownloadURL();
                                profileURL = await storageRef.child(querySnapshot.docs[i].data().email + "/" + querySnapshot.docs[i].data().profile).getDownloadURL();
                            } catch (e) {
                                console.log(e);
                            } finally {
                                this.setState({
                                    list: this.state.list.concat({ 
                                        name: data.title,
                                        subtitle: data.subtitle,
                                        url: URL,
                                        id: querySnap.docs[j].id,
                                        viewcode: data.viewcode,
                                        email: querySnapshot.docs[i].data().email,
                                        displayName: querySnapshot.docs[i].data().displayName,
                                        profileURL: profileURL,
                                    })
                                });
                            }
                        }
                    });
                }
            });

        if (Platform.OS === 'android') {
            Linking.getInitialURL().then(url => {
                this.navigate(url);
            });
        } else {
            Linking.addEventListener('url', this.handleOpenURL);
        }
    }

    async componentDidMount() {
        this.refresh();
    }

    componentWillUnmount() {
        Linking.removeEventListener('url', this.handleOpenURL);
    }
    handleOpenURL = (event) => {
        this.navigate(event.url);
    }

    navigate = (url) => { // url scheme settings (ex: https://travelog-4e274.web.app/?email=hyla981020@naver.com&&id=2EgGSgGMVzHFzq8oErBi&&viewcode=1)
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
            viewcode: params['viewcode'] ? parseInt(params['viewcode']) : 0,
            onPop: () => this.refresh(),
        });
    }

    constructor(props) {
        super(props);
    }

    keyExtractor = (item, index) => index.toString()

    renderItem = ({ item }) => (
        <View style={{ width: "100%", }}>
            <TouchableOpacity style={{marginRight:10, alignItems: 'center'}} onPress={() => { 
                    this.props.navigation.push('ShowScreen', {
                        itemId: item.id,
                        userEmail: item.email,
                        viewcode: item.viewcode,
                        onPop: () => this.refresh(),
                    }) 
                }}>
                <FastImage
                    style={{ width: 200, height: 200 }}
                    source={{
                        uri: item.url,
                        priority: FastImage.priority.high,
                    }}
                    resizeMode={FastImage.resizeMode.contain}
                />
            </TouchableOpacity>
            <ListItem
                title={item.name}
                titleStyle={{ fontWeight: 'bold', width: '100%' }}
                subtitle={`${item.displayName}\n${item.email}`}
                leftAvatar={{ 
                    size: "small", 
                    source: { uri: item.profileURL }, 
                    rounded: true,
                    onPress: () => {
                        if (auth().currentUser.email != item.email) {
                            this.props.navigation.push('Other', {
                                userEmail: item.email,
                            }); 
                            return;
                        }
                        Alert.alert(
                            'My account',
                            item.email,
                        [
                            {text: translate('OK'), onPress: () => console.log('OK Pressed')},
                        ],
                            { cancelable: false }
                        );
                    },
                }}
                bottomDivider
                onPress={() => { 
                    this.props.navigation.push('ShowScreen', {
                        itemId: item.id,
                        userEmail: item.email,
                        viewcode: item.viewcode,
                        onPop: () => this.refresh(),
                    }) 
                }}
            />
        </View>
    )

    render() {
        console.log(this.state.list);
        return(
            <SafeAreaView style={styles.container}>
                <View style={styles.buttonContainer, {marginTop:10, width: '84%' }}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                        <View style={{justifyContent: 'flex-start'}}>
                            <Image
                                style={{flex: 1, width: 120, height: 120,resizeMode: 'contain'}}
                                source={require('./../../logo/graphicImage1.png')}/>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                            <TouchableOpacity style={{marginRight:10}} onPress={() => { this.refresh() }}>
                                <Icon
                                    name='refresh'
                                    size={36}
                                    color='#002f6c'
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{alignItems: 'center'}}>
                        <BannerAd 
                            unitId={adBannerUnitId} 
                            size={BannerAdSize.BANNER}
                        />
                    </View>
                </View>
                <FlatList
                    style={{width: "100%"}}
                    keyExtractor={this.keyExtractor}
                    data={this.state.list}
                    renderItem={this.renderItem}
                />
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    item: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cell: { width: "90%", height: 50 },
    cellView: { 
        width: "100%",
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
});