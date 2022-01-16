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
import { BannerAd, TestIds, BannerAdSize } from '@react-native-admob/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { adsFree, translate, adBannerUnitId } from '../Utils';

import { requestTrackingPermission } from 'react-native-tracking-transparency';

export default class Home extends Component {
    state = {
        list: [],
        ads: true,
        loading: false,
        initialLoading: true,
        endDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
    }

    async refresh(initial = false) {
        if (initial) {
            this.setState({
                initialLoading: true,
                list: [],
                endDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
            });
        } else {
            this.setState({
                loading: true,
            });
        }

        var storageRef = await storage().ref();
        const userList = [];

        await firestore()
            .collection(`Users/${auth().currentUser.uid}/following`)
            .get()
            .then(async (querySnapshot) => {
                for (var i = 0; i < querySnapshot.docs.length; i++) {
                    userList.push(querySnapshot.docs[i].id);
                }
            }).catch((e) => {
                console.log(e);
            });

        if (userList.length > 0) {
            const temp = [];
            await firestore()
                .collection("Posts")
                .where("uid", "in", userList)
                .where("security", "==", 0)
                .orderBy("modifyDate", "desc")
                .startAfter(this.state.endDate)
                .limit(15)
                .get()
                .then(async (querySnap) => {
                    for (var j = 0; j < querySnap.docs.length; j++) {
                        var data = querySnap.docs[j].data();
                        var displayName = data.uid;
                        var URL = "";
                        var profileURL = "";
                        try {
                            const user = await firestore().collection("Users").doc(data.uid).get();
                            if (user.exists) {
                                displayName = user.data().displayName;
                            }
                            var photo = (data.thumbnail >= 0 && data.thumbnail < data.data.length) ? data.data[data.thumbnail].photo : data.data[0].photo;
                            photo = photo.substr(0, photo.lastIndexOf('.'));
                            URL = await storageRef.child(data.uid + "/" + querySnap.docs[j].id + "/" + photo + "_1080x1080.jpeg").getDownloadURL();
                            profileURL = await storageRef.child(`${data.uid}/profile/profile_144x144.jpeg`).getDownloadURL() || '';
                        } catch (e) {
                            console.log(e);
                        } finally {
                            temp.push({
                                title: data.title,
                                subtitle: data.subtitle,
                                link: data.link,
                                url: URL, // 썸네일 URL
                                id: querySnap.docs[j].id, // log의 id
                                uid: data.uid, // log의 소유자
                                displayName: displayName,
                                profileURL: profileURL,
                                date: data.date,
                                modifyDate: data.modifyDate,
                                category: data.category,
                                data: data.data,
                                likeCount: data.likeCount,
                                dislikeCount: data.dislikeCount,
                                likeNumber: data.likeNumber,
                                viewcode: data.viewcode,
                                viewCount: data.viewCount,
                            });
                        }
                    }
                });
            if (temp.length > 0) {
                this.setState({
                    endDate: temp[temp.length - 1].modifyDate,
                    list: this.state.list.concat(temp),
                });
            }
        }

        if (initial) {
            this.setState({
                initialLoading: false,
            });
        } else {
            this.setState({
                loading: false,
            });
        }
    }

    async componentDidMount() {
        const trackingStatus = await requestTrackingPermission();
        console.log(trackingStatus);

        this.setState({
            ads: !adsFree,
        });

        await this.refresh(true);
    }

    constructor(props) {
        super(props);
    }

    keyExtractor = (item, index) => index.toString()

    renderItem = ({ item }) => (
        <View style={{ width: "100%", }}>
            <TouchableOpacity style={{alignItems: 'center'}} onPress={() => { 
                    this.props.navigation.push('ShowScreen', {
                        itemId: item.id,
                        title: item.title,
                        subtitle: item.subtitle,
                        link: item.link,
                        url: item.url, // 썸네일 URL
                        userUid: item.uid, // log의 소유자
                        displayName: item.displayName,
                        profileURL: item.profileURL,
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
                        onPop: () => this.refresh(),
                    }) 
                }}>
                <FastImage
                    style={{ width: "100%", height: 200 }}
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
                        title: item.title,
                        subtitle: item.subtitle,
                        link: item.link,
                        url: item.url, // 썸네일 URL
                        userUid: item.uid, // log의 소유자
                        displayName: item.displayName,
                        profileURL: item.profileURL,
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
                        onPop: () => this.refresh(),
                    }) 
                }}
            >
                <TouchableOpacity style={{flex:1/7, aspectRatio:1}} onPress={() => { 
                    if (auth().currentUser.uid != item.uid) {
                        this.props.navigation.push('Me', {
                            other: true,
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
                            <TouchableOpacity style={{marginRight:10}} onPress={() => { this.refresh(true) }}>
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
                            size={BannerAdSize.BANNER}
                            unitId={adBannerUnitId}
                            onAdFailedToLoad={(error) => console.log(error)}
                        />}
                    </View>
                </View>
                {this.state.initialLoading ? <View style={{width: "100%", height: "100%", alignItems: 'center', justifyContent: 'center', backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff'}}>
                     <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
                </View> 
                : this.state.list.length > 0 ? <FlatList
                    style={{width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
                    keyExtractor={this.keyExtractor}
                    data={this.state.list}
                    renderItem={this.renderItem}
                    onRefresh={() => this.refresh(true)}
                    onEndReached={() => this.refresh()}
                    onEndReachedThreshold={.7}
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