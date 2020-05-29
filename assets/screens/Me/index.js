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
        ads: true,
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

        if (!auth().currentUser.displayName) {
            const update = {
                displayName: auth().currentUser.email
            };

            auth().currentUser.updateProfile(update);

            firestore()
                .collection("Users")
                .add({
                    follower:[],
                    following:[],
                    view:[],
                    email: auth().currentUser.email,
                    profile: '',
                    modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                    displayName: auth().currentUser.displayName,
                });
        }

        if (Platform.OS === 'android') {
            Linking.getInitialURL().then(url => {
                this.navigate(url);
            });
        } else {
            Linking.addEventListener('url', this.handleOpenURL);
        }

        var storageRef = storage().ref();
        
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
        
        firestore()
            .collection("Users")
            .where("email", "==", auth().currentUser.email)
            .get()
            .then(async (querySnapshot) => {
                querySnapshot.forEach(async (documentSnapshot) => {
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
        );
    }

    async componentDidMount() {
        await this.getPurchases();
        await this.refresh();
    }

    componentWillUnmount() {
        Linking.removeEventListener('url', this.handleOpenURL);
    }
    handleOpenURL = (event) => {
        this.navigate(event.url);
    }

    navigate = (url) => { // url scheme settings (ex: logory://logory/hyla981020@naver.com/2EgGSgGMVzHFzq8oErBi/1/)
        const route = url.replace(/.*?:\/\//g, '');
        if (route.split('/').length < 4) {
            return;
        }
    
        this.props.navigation.push('ShowScreen', {
            itemId: route.split('/')[2],
            userEmail: route.split('/')[1],
            viewcode: route.split('/')[3] ?? 0,
            onPop: () => this.refresh(),
        })
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
                    <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                        <TouchableOpacity onPress={() => { this.refresh() }}>
                            <Icon
                                name='refresh'
                                size={36}
                                color='#00b5ec'
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { this.props.navigation.push('Notification') }}>
                            <Icon
                                name='notifications'
                                size={36}
                                color='#00b5ec'
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { this.props.navigation.push('AddList', {
                            onPop: () => this.refresh(),
                        }) }}>
                            <Icon
                                name='add-circle-outline'
                                size={36}
                                color='#00b5ec'
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginRight:10}} onPress={() => { this.props.navigation.push('Settings') }}>
                            <Icon
                                name='settings'
                                size={36}
                                color='#00b5ec'
                            />
                        </TouchableOpacity>
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
                    {this.state.ads && <View style={{alignItems: 'center',}}>
                        {this.state.ads && <BannerAd 
                            unitId={adBannerUnitId} 
                            size={BannerAdSize.BANNER}
                        />}
                    </View>}
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
        borderBottomColor: '#00b5ec',
        flex:1,
        color: "#00b5ec",
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom:5,
    },
});