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

import RNIap, {
  purchaseErrorListener,
  purchaseUpdatedListener,
  type ProductPurchase,
  type PurchaseError
} from 'react-native-iap'; // 확인 필요

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import { InterstitialAd, BannerAd, TestIds, BannerAdSize } from '@react-native-firebase/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

const adBannerUnitId = __DEV__ ? TestIds.BANNER : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3050510769' 
    : 'ca-app-pub-1477690609272793/8274029234');

const adInterstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3775880012' 
    : 'ca-app-pub-1477690609272793/9626786110');

export default class Me extends Component {
    state = {
        followers: [],
        followings: [],
        views: [],
        list: [],
        profileURL: '', // 사진 URL
        localProfileURL: '', // 상대 위치 참조 URL
        // ads: true,
    }

    async getPurchases () {
        // try {
        // const purchases = await RNIap.getAvailablePurchases();
    
        // purchases.forEach(purchase => {
        //     switch (purchase.productId) {
        //     case 'com.hyla981020.adfree1':
        //         this.setState({ads: false});
        //         break;
    
        //     case 'com.hyla981020.adfree12':
        //         this.setState({ads: false});
        //         break;
        //     }
        // });
        // } catch(err) {
        //     console.warn(err); // standardized err.code and err.message available
        //     Alert.alert(err.message);
        // }
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

        const user = await firestore().collection("Users").where("email", "==", auth().currentUser.email).get();
        var storageRef = await storage().ref();
        if (!auth().currentUser.displayName || user.empty) {
            const update = {
                displayName: auth().currentUser.email
            };

            await auth().currentUser.updateProfile(update);

            await firestore()
                .collection("Users")
                .add({
                    follower:[],
                    following:[],
                    view:[],
                    email: auth().currentUser.email,
                    profile: '',
                    modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                    displayName: auth().currentUser.email,
                })
                .then(async (documentSnapshot) => {
                    data = documentSnapshot.data();
                    this.setState({
                        followers : data.follower,
                        followings : data.following,
                        views : data.view,
                        localProfileURL : data.profile
                    });
                    this.setState({profileURL : await storageRef.child(auth().currentUser.email + "/" + data.profile).getDownloadURL()});
                });
            
        } else {
            user.forEach(async (documentSnapshot) => {
                data = documentSnapshot.data();
                this.setState({
                    followers : data.follower,
                    followings : data.following,
                    views : data.view,
                    localProfileURL : data.profile
                });
                this.setState({profileURL : await storageRef.child(auth().currentUser.email + "/" + data.profile).getDownloadURL()});
            });
        }

        if (Platform.OS === 'android') {
            console.log("asdf");
            Linking.getInitialURL().then(url => {
                this.navigate(url);
            });
        } Linking.addEventListener('url', this.handleOpenURL);
        
        firestore()
            .collection(auth().currentUser.email)
            .orderBy("modifyDate", "desc")
            .get()
            .then(async (querySnapshot) => {
                for (var i=0; i < querySnapshot.docs.length; i++) {
                    console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
                    var URL = await storageRef.child(await auth().currentUser.email + "/" + querySnapshot.docs[i].id + "/" + querySnapshot.docs[i].data().thumbnail).getDownloadURL();
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
    }

    async componentDidMount() {
        await this.getPurchases();
        await this.refresh();
    }

    componentWillUnmount() {
        Linking.removeEventListener('url', this.handleOpenURL);
    }
    handleOpenURL = (event) => {
        console.log(event.url);
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
        <ListItem
            title={item.name}
            titleStyle={{ fontWeight: 'bold' }}
            subtitle={item.subtitle}
            leftAvatar={{ source: { uri: item.url }, rounded: false}}
            bottomDivider
            onPress={() => { this.props.navigation.push('ShowScreen', {
                itemId: item.id,
                userEmail: auth().currentUser.email,
                viewcode: item.viewcode,
                onPop: () => this.refresh(),
            }) }}
        />
    )

    render() {
        return(
            <SafeAreaView style={styles.container}>
                <View style={styles.buttonContainer, {marginTop:10}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                        <View style={{justifyContent: 'flex-start'}}>
                            <Image
                                style={{flex: 1, width: 120, height: 120,resizeMode: 'contain'}}
                                source={require('./../../logo/graphicImage1.png')}/>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                            <TouchableOpacity onPress={() => { this.refresh() }}>
                                <Icon
                                    name='refresh'
                                    size={36}
                                    color='#002f6c'
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { this.props.navigation.push('Notification') }}>
                                <Icon
                                    name='notifications'
                                    size={36}
                                    color='#002f6c'
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { this.props.navigation.push('AddList', {
                                onPop: () => this.refresh(),
                            }) }}>
                                <Icon
                                    name='add-circle-outline'
                                    size={36}
                                    color='#002f6c'
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={{marginRight:10}} onPress={() => { this.props.navigation.push('Settings') }}>
                                <Icon
                                    name='settings'
                                    size={36}
                                    color='#002f6c'
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        // marginTop:-30,
                    }}>
                        <Avatar 
                            rounded
                            size="xlarge" 
                            activeOpacity={0.7}
                            source={{
                                uri:
                                this.state.profileURL,
                            }}
                            icon={{ name: 'account-box' }} 
                            showEditButton
                            onEditPress={() => {
                                this.props.navigation.push('EditProfile', {
                                    profileURL: this.state.profileURL,
                                    localProfileURL: this.state.localProfileURL, // 상대 위치 참조 URL
                                })
                            }}
                        />
                    </View>
                    <Text style={{fontWeight: 'bold', textAlign: 'center', marginTop: 10}}>
                        {auth().currentUser.displayName}
                    </Text>
                    <Text style={{textAlign: 'center'}}>
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
                            <Text> Followers </Text>
                            <Text> {this.state.followers.length} </Text>
                        </View>
                        <View style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text> Followings </Text>
                            <Text> {this.state.followings.length} </Text>
                        </View>
                        <View style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text> Views </Text>
                            <Text> {this.state.views.length} </Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center',}}>
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