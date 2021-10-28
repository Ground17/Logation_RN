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
  Alert,
  Appearance,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import { BannerAd, TestIds, BannerAdSize } from '@react-native-firebase/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { adsFree, translate, itemSkus, adBannerUnitId } from '../Utils';

export default class Other extends Component {
    state = {
        followers: [],
        followersLength: 0,
        followings: [],
        followingsLength: 0,
        views: [],
        viewsLength: 0,
        list: [],
        follow: false,
        displayName: '',
        profileURL: '', // 사진 URL
        documentID: '',
        documentIDforMe: '',
        loading: false,
        ads: true,
    }

    async refresh() {
        this.setState({
            followers: [],
            followersLength: 0,
            followings: [],
            followingsLength: 0,
            views: [],
            viewsLength: 0,
            list: [],
            follow: false,
            displayName: '',
            profileURL: '', // 사진 URL
            loading: false,
        });
// auth().currentUser.uid => this.props.route.params.userUid
        var storageRef = storage().ref();

        await firestore()
            .collection(this.props.route.params.userUid)
            .orderBy("modifyDate", "desc")
            .get()
            .then(async (querySnapshot) => {
                for (var i=0; i < querySnapshot.docs.length; i++) {
                    console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
                    var URL = "";
                    try {
                        URL = await storageRef.child(await this.props.route.params.userUid + "/" + querySnapshot.docs[i].id + "/" + querySnapshot.docs[i].data().thumbnail).getDownloadURL();
                    } catch (e) {
                        console.log(e);
                    }
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
            });

        await firestore()
            .collection("Users")
            .doc(this.props.route.params.userUid)
            .get()
            .then(async (documentSnapshot) => {
                    data = documentSnapshot.data();
                    this.setState({
                        documentID: documentSnapshot.id,
                        followers : data.follower,
                        followersLength : data.follower.length,
                        followings : data.following,
                        followingsLength : data.following.length,
                        views : data.view,
                        viewsLength : data.view.length,
                        follow: data.follower.includes(auth().currentUser.uid),
                        displayName : data.displayName,
                    });
                    if (!data.view.includes(auth().currentUser.uid)) {
                        await documentSnapshot.ref.update({ view: data.view.concat(auth().currentUser.uid) });
                        this.setState({
                            viewsLength : this.state.viewsLength + 1,
                        });
                    }
                    var URL = "";
                    try {
                        URL = await storageRef.child(this.props.route.params.userUid + "/" + data.profile).getDownloadURL();
                    } catch (e) {
                        console.log(e);
                    }
                    this.setState({profileURL : URL,});
                });

        await firestore()
            .collection("Users")
            .doc(auth().currentUser.uid)
            .get()
            .then(async (documentSnapshot) => {
                this.setState({
                    documentIDforMe: auth().currentUser.uid,
                });
            }
        );

        this.setState({
            loading: false,
        });
    }

    async componentDidMount() {
        this.setState({
            ads: !adsFree,
        });
        this.props.navigation.setOptions({ 
            title: translate("OtherAccount"),
            headerRight: () => 
            <View style={{flexDirection: 'row',}}>
                <TouchableOpacity style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: 5,
                    paddingRight: 20,
                    }} onPress={() => { this.refresh() }}>
                    <Icon
                        name='refresh'
                        size={24}
                        color='#ffffff'
                    />
                </TouchableOpacity>
            </View>
        });
        this.refresh();
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
                userUid: this.props.route.params.userUid,
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
                <View style={[{width: '100%', height: '100%', backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff' }]}>
                    <View style={styles.buttonContainer, {marginTop: 10}}>
                        <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {marginRight: 10, alignSelf: 'flex-end', height:45, width: "30%", borderRadius:5,}]} onPress={async () => { 
                                this.setState({
                                    follow : !this.state.follow,
                                });
                                if (!this.state.loading) {
                                    try { // 오류가 많아지는 경우 firestore의 unionarray 메서드 생각해보기
                                        this.setState({loading: true});
                                        console.log(this.state.documentID);
                                        console.log(this.state.documentIDforMe);
                                        var sfDocRef = firestore().collection("Users").doc(this.state.documentID);
                                        var sfDocRefForMe = firestore().collection("Users").doc(this.state.documentIDforMe);
                                        
                                        await firestore().runTransaction(async (transaction) => {
                                            var sfDoc = await transaction.get(sfDocRef);
                                            var sfDocForMe = await transaction.get(sfDocRefForMe);

                                            if (!sfDoc.exists) {
                                                throw "Document does not exist!";
                                            }

                                            if (this.state.follow) {
                                                if (!sfDoc.data().follower.includes(auth().currentUser.uid)) {
                                                    await transaction.update(sfDocRef, { follower: sfDoc.data().follower.concat(auth().currentUser.uid) });
                                                    this.setState({
                                                        followersLength : this.state.followersLength + 1,
                                                    });
                                                }
                                            } else {
                                                if (sfDoc.data().follower.includes(auth().currentUser.uid)) {
                                                    await transaction.update(sfDocRef, { follower: sfDoc.data().follower.filter(data => auth().currentUser.uid != data) });
                                                    this.setState({
                                                        followersLength : this.state.followersLength - 1,
                                                    });
                                                }
                                            }
                                            if (!sfDocForMe.exists) {
                                                throw "Document does not exist!";
                                            }

                                            if (this.state.follow) {
                                                if (!sfDocForMe.data().following.includes(this.props.route.params.userUid)) {
                                                    await transaction.update(sfDocRefForMe, { following: sfDocForMe.data().following.concat(this.props.route.params.userUid) });
                                                }
                                            } else {
                                                if (sfDocForMe.data().following.includes(this.props.route.params.userUid)) {
                                                    await transaction.update(sfDocRefForMe, { following: sfDocForMe.data().following.filter(data => this.props.route.params.userUid != data) });
                                                }
                                            }
                                            return Promise.resolve(true);
                                        }).then(async () => {
                                            console.log("success");
                                            this.setState({loading: false});
                                        }).catch(async (err) => {
                                            console.error(err);
                                            this.setState({loading: false});
                                        });
                                        
                                        this.setState({loading: false});
                                        return Promise.reject(new Error('Task closed!'));
                                    } catch (e) {
                                        this.refresh();
                                    }
                                }
                            }}>
                                <Text style={styles.loginText}>{this.state.follow ? translate('Unfollow') : translate('Follow') }</Text>
                            </TouchableOpacity>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-around',
                            // marginTop:-30,
                        }}>
                            <View style={{flex:1/3, aspectRatio:1}}>
                                <FastImage
                                    style={{flex: 1, borderRadius: 100}}
                                    source={this.state.profileURL ? {
                                        uri:
                                        this.state.profileURL,
                                    } : require('./../../logo/ic_launcher.png')}
                                />
                            </View>
                        </View>
                        <Text style={{fontWeight: 'bold', textAlign: 'center', marginTop: 10, color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                            {this.state.displayName}
                        </Text>
                        <Text selectable style={{textAlign: 'center', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                            {this.props.route.params.userUid}
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
                            <View style={{
                                width: "30%",
                                marginTop: 15,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("Followings")} </Text>
                                <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {this.state.followingsLength} </Text>
                            </View>
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
                        <View style={{alignItems: 'center',}}>
                            {this.state.ads && <BannerAd 
                                unitId={adBannerUnitId} 
                                size={BannerAdSize.BANNER}
                            />}
                        </View>
                        <FlatList
                            style={{width: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff" }}
                            keyExtractor={this.keyExtractor}
                            data={this.state.list}
                            renderItem={this.renderItem}
                            onRefresh={() => this.refresh()}
                            refreshing={this.state.loading}
                        />
                    </View>
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
    loginText: {
        color: 'white',
    },
});