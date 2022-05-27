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

import Share from 'react-native-share';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Button, } from 'react-native-elements';

import auth from '@react-native-firebase/auth';
import { BannerAd, TestIds, BannerAdSize } from '@react-native-admob/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import AsyncStorage from '@react-native-community/async-storage';

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

        let storageRef = await storage().ref();
        const userList = [];
        let query = firestore()
            .collection("Posts")
            .where("security", "==", 0)
            .orderBy("modifyDate", "desc")
            .startAfter(this.state.endDate)
            .limit(15);

        if (this.props.follow) { // follow (1번째 화면)
            await firestore()
                .collection(`Users/${auth().currentUser.uid}/following`)
                .get()
                .then(async (querySnapshot) => {
                    for (let i = 0; i < querySnapshot.docs.length; i++) {
                        userList.push(querySnapshot.docs[i].id);
                    }
                }).catch((e) => {
                    console.log(e);
                });

            query = query.where("uid", "in", userList);
        }

        const temp = [];
        await query.get()
            .then(async (querySnap) => {
                for (let j = 0; j < querySnap.docs.length; j++) {
                    let data = querySnap.docs[j].data();
                    let displayName = data.uid;
                    let URL = "";
                    let profileURL = "";
                    try {
                        const user = await firestore().collection("Users").doc(data.uid).get();
                        if (user.exists) {
                            displayName = user.data().displayName;
                        }
                        let photo = (data.thumbnail >= 0 && data.thumbnail < data.data.length) ? data.data[data.thumbnail].photo : data.data[0].photo;
                        photo = photo.substr(0, photo.lastIndexOf('.'));
                        // URL = await storageRef.child(data.uid + "/" + querySnap.docs[j].id + "/" + photo + "_1080x1080.jpeg").getDownloadURL();
                        // profileURL = await storageRef.child(`${data.uid}/profile/profile_144x144.jpeg`).getDownloadURL() || '';
                        URL = `https://storage.googleapis.com/travelog-4e274.appspot.com/${data.uid}/${querySnap.docs[j].id}/${photo}_1080x1080.jpeg`;
                        profileURL = `https://storage.googleapis.com/travelog-4e274.appspot.com/${data.uid}/profile/profile_144x144.jpeg`;
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
                            thumbnail: data.thumbnail,
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
                        thumbnail: item.thumbnail,
                        onPop: () => this.refresh(),
                    }) 
                }}>
                <FastImage
                    style={{ width: "100%", height: 200 }}
                    source={item.url ? {
                        uri: item.url,
                        priority: FastImage.priority.high
                    } : require('./../../logo/ic_launcher.png')}
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
                        thumbnail: item.thumbnail,
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
                    Alert.alert(translate('MyAccount'));
                }}>
                    <FastImage
                        style={{flex: 1, borderRadius: 100}}
                        source={item.profileURL ? {
                            uri:
                            item.profileURL,
                        } : require('./../../logo/ic_launcher.png')}
                        fallback
                        defaultSource={require('./../../logo/ic_launcher.png')}
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
                <TouchableOpacity style={{marginRight:5}} onPress={() => { 
                    Alert.alert(
                        item.title,
                        item.displayName,
                        [
                            {text: translate("Report"), onPress: async () => {
                                await firestore()
                                    .doc(`Reports/${item.uid}`)
                                    .get()
                                    .then(async (documentSnapshot) => {
                                        if (documentSnapshot.exists) {
                                            await documentSnapshot.ref.update({count: documentSnapshot.data().count + 1});
                                        } else {
                                            await documentSnapshot.ref.set({count: 1});
                                        }
                                    }).catch((e) => {
                                        console.log(e);
                                    });
                            }},
                            {text: translate("Share"), onPress: async () => {
                                const url = `https://travelog-4e274.web.app/?id=${item.id}`;
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
                            }},
                            {text: translate("Cancel"), onPress: () => console.log('Cancel Pressed')},
                        ],
                        { cancelable: true }
                    );
                }}>
                    <Icon
                        name='more-vert'
                        size={24}
                        color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                    />
                </TouchableOpacity>
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
                    onRefresh={() => this.refresh()}
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