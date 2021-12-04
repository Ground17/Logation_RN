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
// import { BannerAd, TestIds, BannerAdSize } from '@react-native-firebase/admob';
import { AdMobBanner } from 'react-native-admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { adsFree, translate, adBannerUnitId } from '../Utils';

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
        const userList = [];

        await firestore()
            .collection(`Users/${auth().currentUser.uid}/following`)
            .get()
            .then(async (querySnapshot) => {
                for (var i=0; i < querySnapshot.docs.length; i++) {
                    userList.push(querySnapshot.docs[i].id);
                }
            }).catch((e) => {
                console.log(e);
            });

        if (userList.length > 0) {
            await firestore()
                .collection("Users")
                .where("uid", "in", userList)
                .orderBy("modifyDate", "desc")
                .limit(10)
                .get()
                .then(async (querySnapshot) => {
                    console.log("collectionPath", querySnapshot.docs);
                    const temp = [];
                    for (var i=0; i < querySnapshot.docs.length; i++) {
                        console.log("collectionPath", querySnapshot.docs[i].data().uid);
                        await firestore()
                        .collection(querySnapshot.docs[i].data().uid)
                        // .where("uid", "in", userList)
                        .where("security", "==", 0)
                        .orderBy("modifyDate", "desc")
                        .limit(2)
                        .get()
                        .then(async (querySnap) => {
                            for (var j=0; j < querySnap.docs.length; j++) {
                                var data = querySnap.docs[j].data();
                                var URL = "";
                                var profileURL = "";
                                try {
                                    URL = await storageRef.child(querySnapshot.docs[i].data().uid + "/" + querySnap.docs[j].id + "/" + (data.thumbnail >= 0 && data.thumbnail < data.data.length ? data.data[data.thumbnail].photo : data.data[0].photo)).getDownloadURL();
                                    profileURL = await storageRef.child(querySnapshot.docs[i].data().uid + "/" + querySnapshot.docs[i].data().profile).getDownloadURL();
                                } catch (e) {
                                    console.log(e);
                                } finally {
                                    temp.push({
                                        title: data.title,
                                        subtitle: data.subtitle,
                                        url: URL,
                                        id: querySnap.docs[j].id,
                                        uid: querySnapshot.docs[i].data().uid,
                                        displayName: querySnapshot.docs[i].data().displayName,
                                        profileURL: profileURL,
                                        date: data.date,
                                        link: data.link,
                                        category: data.category,
                                        data: data.data,
                                        likenumber: data.likenumber,
                                        viewcode: data.viewcode,
                                        viewcount: data.viewcount,
                                    });
                                }
                            }
                        });
                    }
                    this.setState({
                        list: temp,
                    });
                });
        }
        
        this.setState({
            loading: false,
        });
    }

    async componentDidMount() {
        this.setState({
            ads: !adsFree,
        });

        await this.refresh();
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
                    {item.title}
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
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: "100%", }}>
                        <View style={{justifyContent: 'flex-start', marginLeft: 10}}>
                            <Image
                                style={{flex: 1, width: 70, height: 70, resizeMode: 'contain'}}
                                source={require('./../../logo/graphicImage.png')}/>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginRight: 10}}>
                            <TouchableOpacity style={{marginRight:5}} onPress={() => { 
                                this.props.navigation.push('Search') }}>
                                <Icon
                                    name='search'
                                    size={24}
                                    color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                                />
                            </TouchableOpacity>
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
                        {this.state.ads && <AdMobBanner
                            adSize="banner"
                            adUnitID={adBannerUnitId}
                            testDevices={[AdMobBanner.simulatorId]}
                            onAdFailedToLoad={error => console.error(error)}
                        />}
                    </View>
                </View>
                {this.state.loading ? <View style={{flex: 1, width: "100%", height: "100%", alignItems: 'center', justifyContent: 'center', backgroundColor: Appearance.getColorScheme() === 'dark' ? '#000' : '#fff'}}>
                     <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
                </View> 
                : this.state.list.length > 0 ? <FlatList
                    style={{width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
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
        height: 30,
        marginBottom: 10,
        justifyContent: 'space-between',
        backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#fff'
    },
});