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
  ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import ImagePicker from 'react-native-image-crop-picker';

import { ListItem, Avatar, Button, Input } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
import { InterstitialAd, TestIds, } from '@react-native-firebase/admob';
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

const interstitial = InterstitialAd.createForAdRequest(adInterstitialUnitId);

export default class EditProfile extends Component {
    state = {
        nickname: '',
        profileURL: '',
        loading: false,
    }

    async componentDidMount() {
        this.setState({nickname: await auth().currentUser.displayName});
        this.setState({profileURL: this.props.route.params.profileURL});
        if (!interstitial.loaded) {
            interstitial.load();
        }
    }

    render() {
      return(
        <SafeAreaView style={styles.container}>
            {this.state.loading ? 
            <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom:5,}}>
                <ActivityIndicator size="large" color="#002f6c" />
                <Text> The more pictures you have, the more time it can take to upload. </Text>
            </View>
            : <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginTop:10}}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
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
                            ImagePicker.openPicker({
                                mediaType: 'photo',
                            }).then(image => {
                                this.setState({profileURL: image.path})
                            });
                        }}
                    />
                </View>
                <Input
                    onChangeText = {(nickname) => this.setState({nickname})}
                    value = {this.state.nickname}
                    maxLength = {40}
                    inputStyle={styles.inputs}
                    placeholder='URL Link'
                    placeholderTextColor="#bdbdbd"
                    leftIcon={
                        <Icon
                            name='account-circle'
                            size={24}
                            color='#002f6c'
                        />
                    }
                />
                <Text style={{textAlign: 'center'}}>
                    {auth().currentUser.email}
                </Text>
                <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {marginTop: 70, height:45, width: "80%", borderRadius:5,}]} onPress={async () => { 
                if (this.state.nickname.length > 0) {
                    this.setState({loading: true});
                    const update = {
                        displayName: this.state.nickname,
                    };

                    await auth().currentUser.updateProfile(update);

                    console.log('params', this.props.route.params);

                    if (this.props.route.params.profileURL == this.state.profileURL) {
                        await firestore()
                        .collection("Users")
                        .where("email", "==", auth().currentUser.email)
                        .get()
                        .then(async (querySnapshot) => {
                            querySnapshot.forEach(async (documentSnapshot) => {
                                await documentSnapshot.ref.update({
                                    modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                                    displayName: this.state.nickname,
                                });
                            });
                        });
                    } else {
                        var filename = this.state.profileURL.split('/');

                        var storageRef = storage().ref(`${auth().currentUser.email}/${filename[filename.length - 1]}`);
                        await firestore()
                        .collection("Users")
                        .where("email", "==", auth().currentUser.email)
                        .get()
                        .then(async (querySnapshot) => {
                            querySnapshot.forEach(async (documentSnapshot) => {
                                await documentSnapshot.ref.update({
                                    profile: filename[filename.length - 1],
                                    modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                                    displayName: this.state.nickname,
                                });
                            });
                        });
                        console.log('delete url: ', this.props.route.params.localProfileURL);
                        try {
                            await storageRef.putFile(`${this.state.profileURL}`);
                            await storage().ref(`${auth().currentUser.email}/${this.props.route.params.localProfileURL}`).delete();
                        } catch (e) {
                            console.log(e);
                        } finally {
                            if (interstitial.loaded) {
                                interstitial.show();
                            }
                            this.props.navigation.replace('Main');
                        }
                    }
                    this.setState({loading: false});
                }
            }}>
                <Text style={styles.loginText}>Update Profile</Text>
            </TouchableOpacity>
            </View>
            }
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
        height:45,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom:5,
        width: "80%",
        borderRadius:5,
    },
    loginButton: {
        backgroundColor: "#002f6c",
    },
    loginText: {
        color: 'white',
    },
});