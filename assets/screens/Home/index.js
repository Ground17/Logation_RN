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
} from 'react-native';

import FastImage from 'react-native-fast-image';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Button, } from 'react-native-elements';

import auth from '@react-native-firebase/auth';
import { InterstitialAd, BannerAd, TestIds, BannerAdSize } from '@react-native-firebase/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { adsFree, translate } from '../Utils';

const adBannerUnitId = __DEV__ ? TestIds.BANNER : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3050510769' 
    : 'ca-app-pub-1477690609272793/8274029234');

export default class Home extends Component {
    state = {
        list: [],
        ads: true,
        loading: true,
    }

    async refresh() {
        this.setState({
            list: [],
            loading: true,
        });

        var storageRef = await storage().ref();

        await firestore()
            .collection("Users")
            .where("follower", "array-contains", auth().currentUser.uid)
            .orderBy("modifyDate", "desc")
            .limit(20)
            .get()
            .then(async (querySnapshot) => {
                console.log("collectionPath", querySnapshot.docs);
                for (var i=0; i < querySnapshot.docs.length; i++) {
                    console.log("collectionPath", querySnapshot.docs[i].data().uid);
                    await firestore()
                    .collection(querySnapshot.docs[i].data().uid)
                    .orderBy("modifyDate", "desc")
                    .limit(3)
                    .get()
                    .then(async (querySnap) => {
                        for (var j=0; j < querySnap.docs.length; j++) {
                            var data = querySnap.docs[j].data();
                            var URL = "";
                            var profileURL = "";
                            try {
                                URL = await storageRef.child(querySnapshot.docs[i].data().uid + "/" + querySnap.docs[j].id + "/" + data.thumbnail).getDownloadURL();
                                profileURL = await storageRef.child(querySnapshot.docs[i].data().uid + "/" + querySnapshot.docs[i].data().profile).getDownloadURL();
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
                                        uid: querySnapshot.docs[i].data().uid,
                                        displayName: querySnapshot.docs[i].data().displayName,
                                        profileURL: profileURL,
                                    })
                                });
                            }
                        }
                    });
                }
            });

        this.setState({
            loading: false,
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
        this.setState({
            ads: !adsFree,
        });
        this.refresh();
    }

    componentWillUnmount() {
        Linking.removeEventListener('url', this.handleOpenURL);
    }
    handleOpenURL = (event) => {
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
        <View style={{ width: "100%", }}>
            <TouchableOpacity style={{marginRight:10, alignItems: 'center'}} onPress={() => { 
                    this.props.navigation.push('ShowScreen', {
                        itemId: item.id,
                        userUid: item.uid,
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
                containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
                bottomDivider
                onPress={() => { 
                    this.props.navigation.push('ShowScreen', {
                        itemId: item.id,
                        userUid: item.uid,
                        onPop: () => this.refresh(),
                    }) 
                }}
            >
                <TouchableOpacity style={{flex:1/7, aspectRatio:1}} onPress={() => { 
                    if (auth().currentUser.uid != item.uid) {
                        this.props.navigation.push('Other', {
                            userUid: item.uid,
                        }); 
                        return;
                    }
                    Alert.alert(
                        'My account',
                    [
                        {text: translate('OK'), onPress: () => console.log('OK Pressed')},
                    ],
                        { cancelable: false }
                    );
                }}>
                    <FastImage
                        style={{flex: 1, borderRadius: 100}}
                        source={item.profileURL ? {
                            uri:
                            item.profileURL,
                        } : require('./../../logo/ic_launcher.png')}
                    />
                </TouchableOpacity>
                <ListItem.Content>
                <ListItem.Title style={{ fontWeight: 'bold', width: '100%', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000' }}>
                    {item.name}
                </ListItem.Title>
                <ListItem.Subtitle style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                    {`${item.displayName}`}
                </ListItem.Subtitle>
                </ListItem.Content>
            </ListItem>
        </View>
    )

    render() {
        return(
            <SafeAreaView style={styles.container}>
                <View style={styles.title}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: "100%"}}>
                        <View style={{justifyContent: 'flex-start', marginLeft: 10}}>
                            <Image
                                style={{flex: 1, width: 120, height: 120,resizeMode: 'cover'}}
                                source={Appearance.getColorScheme() === 'dark' ? require('./../../logo/graphicImage2.png') : require('./../../logo/graphicImage1.png')}/>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginRight: 10}}>
                            <TouchableOpacity style={{marginRight:10}} onPress={() => { this.refresh() }}>
                                <Icon
                                    name='refresh'
                                    size={24}
                                    color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <View style={{ width: '100%' }}>
                    <View style={{alignItems: 'center', backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
                        {this.state.ads && <BannerAd 
                            style={{marginTop: 10}}
                            unitId={adBannerUnitId} 
                            size={BannerAdSize.BANNER}
                        />}
                    </View>
                </View>
                {this.state.loading ? <View style={{flex: 1, width: "100%", height: "100%", alignItems: 'center', justifyContent: 'center', backgroundColor: Appearance.getColorScheme() === 'dark' ? '#000' : '#fff'}}>
                     <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
                </View> 
                : this.state.list.length > 0 ? <FlatList
                    style={{width: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
                    keyExtractor={this.keyExtractor}
                    data={this.state.list}
                    renderItem={this.renderItem}
                    onRefresh={() => this.refresh()}
                    refreshing={this.state.loading}
                />
                : <View style={{width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
                    <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000', textAlign: 'center'}}>{translate("HomeEmpty")}</Text>
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
        backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#fff'
    },
});