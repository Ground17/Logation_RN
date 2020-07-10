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
  Alert
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { ListItem, Avatar, Button } from 'react-native-elements'

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
// auth().currentUser.email => this.props.route.params.userEmail
        var storageRef = storage().ref();

        firestore()
            .collection(this.props.route.params.userEmail)
            .orderBy("modifyDate", "desc")
            .get()
            .then(async (querySnapshot) => {
                for (var i=0; i < querySnapshot.docs.length; i++) {
                    console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
                    var URL = "";
                    try {
                        URL = await storageRef.child(await this.props.route.params.userEmail + "/" + querySnapshot.docs[i].id + "/" + querySnapshot.docs[i].data().thumbnail).getDownloadURL();
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

        firestore()
            .collection("Users")
            .doc(this.props.route.params.userEmail)
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
                        follow: data.follower.includes(auth().currentUser.email),
                        displayName : data.displayName,
                    });
                    if (!data.view.includes(auth().currentUser.email)) {
                        await documentSnapshot.ref.update({ view: data.view.concat(auth().currentUser.email) });
                        this.setState({
                            viewsLength : this.state.viewsLength + 1,
                        });
                    }
                    var URL = "";
                    try {
                        URL = await storageRef.child(this.props.route.params.userEmail + "/" + data.profile).getDownloadURL();
                    } catch (e) {
                        console.log(e);
                    }
                    this.setState({profileURL : URL,});
                });

        firestore()
            .collection("Users")
            .doc(auth().currentUser.email)
            .get()
            .then(async (documentSnapshot) => {
                this.setState({
                    documentIDforMe: auth().currentUser.email,
                });
            }
        );

        if (this.props.route.params.itemId) {
            this.props.navigation.push('ShowScreen', {
                itemId: this.props.route.params.itemId,
                userEmail: this.props.route.params.userEmail,
                viewcode: this.props.route.params.viewcode ?? 0,
                onPop: () => this.refresh(),
            });
        }
    }

    async componentDidMount() {
        this.refresh();
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
                userEmail: this.props.route.params.userEmail,
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
                        <TouchableOpacity onPress={() => { this.refresh() }}>
                            <Icon
                                name='refresh'
                                size={36}
                                color='#002f6c'
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "30%", borderRadius:5,}]} onPress={async () => { 
                            this.setState({
                                follow : !this.state.follow,
                            });
                            if (!this.state.loading) {
                                try {
                                    this.setState({loading: true});
                                    var sfDocRef = firestore().collection("Users").doc(this.state.documentID);
                                    var sfDocRefForMe = firestore().collection("Users").doc(this.state.documentIDforMe);
                                    
                                    await firestore().runTransaction(async (transaction) => {
                                        var sfDoc = await transaction.get(sfDocRef);
                                        var sfDocForMe = await transaction.get(sfDocRefForMe);

                                        if (!sfDoc.exists) {
                                            throw "Document does not exist!";
                                        }

                                        if (this.state.follow) {
                                            if (!sfDoc.data().follower.includes(auth().currentUser.email)) {
                                                await transaction.update(sfDocRef, { follower: sfDoc.data().follower.concat(auth().currentUser.email) });
                                                this.setState({
                                                    followersLength : this.state.followersLength + 1,
                                                });
                                            }
                                        } else {
                                            if (sfDoc.data().follower.includes(auth().currentUser.email)) {
                                                await transaction.update(sfDocRef, { follower: sfDoc.data().follower.filter(data => auth().currentUser.email != data) });
                                                this.setState({
                                                    followersLength : this.state.followersLength - 1,
                                                });
                                            }
                                        }
                                        if (!sfDocForMe.exists) {
                                            throw "Document does not exist!";
                                        }

                                        if (this.state.follow) {
                                            if (!sfDocForMe.data().following.includes(this.props.route.params.userEmail)) {
                                                await transaction.update(sfDocRefForMe, { following: sfDocForMe.data().following.concat(this.props.route.params.userEmail) });
                                            }
                                        } else {
                                            if (sfDocForMe.data().following.includes(this.props.route.params.userEmail)) {
                                                await transaction.update(sfDocRefForMe, { following: sfDocForMe.data().following.filter(data => this.props.route.params.userEmail != data) });
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
                        />
                    </View>
                    <Text style={{fontWeight: 'bold', textAlign: 'center', marginTop: 10}}>
                        {this.state.displayName}
                    </Text>
                    <Text style={{textAlign: 'center'}}>
                        {this.props.route.params.userEmail}
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
                            <Text> {translate("Followers")} </Text>
                            <Text> {this.state.followersLength} </Text>
                        </View>
                        <View style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text> {translate("Followings")} </Text>
                            <Text> {this.state.followingsLength} </Text>
                        </View>
                        <View style={{
                            width: "30%",
                            marginTop: 15,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text> {translate("Views")} </Text>
                            <Text> {this.state.viewsLength} </Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center',}}>
                        <BannerAd 
                            unitId={adBannerUnitId} 
                            size={BannerAdSize.BANNER}
                        />
                    </View>
                    <FlatList
                        keyExtractor={this.keyExtractor}
                        data={this.state.list}
                        renderItem={this.renderItem}
                    />
                </View>
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
    cell: { width: "80%", height: 50 },
    cellView: { 
        width: "84%",
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
    loginButton: {
        backgroundColor: "#002f6c",
    },
    loginText: {
        color: 'white',
    },
});