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
  Appearance,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import Icon from 'react-native-vector-icons/MaterialIcons';

import ImagePicker from 'react-native-image-crop-picker';

import { ListItem, Button, Input } from 'react-native-elements'

import auth from '@react-native-firebase/auth';
// import { InterstitialAd, TestIds, } from '@react-native-firebase/admob';
import { AdMobInterstitial } from 'react-native-admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { adsFree, translate, adInterstitialUnitId } from '../Utils';

// const interstitial = InterstitialAd.createForAdRequest(adInterstitialUnitId);

export default class EditProfile extends Component {
    state = {
        nickname: '',
        profileURL: '',
        loading: false,
        ads: true,
    }

    async componentDidMount() {
        this.setState({
            ads: !adsFree,
            nickname: await auth().currentUser.displayName,
            profileURL: this.props.route.params.profileURL
        });
        this.props.navigation.setOptions({ title: translate("EditProfile") });
        
        // if (this.state.ads && !interstitial.loaded) {
        //     interstitial.load();
        // }
        AdMobInterstitial.setTestDevices([AdMobInterstitial.simulatorId]);
        AdMobInterstitial.setAdUnitID(adInterstitialUnitId);
        if (this.state.ads) {
            AdMobInterstitial.requestAd().catch(error => console.warn(error));
        }
    }

    render() {
      return(
        <SafeAreaView style={styles.container}>
            {this.state.loading ? 
            <View style={{
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                height: "100%",
                width: "100%", 
                marginBottom:5,}}>
                <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
                <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("EditProfileComment1")} </Text>
            </View>
            : <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                height: "100%",
                backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff',
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                }}>
                    <TouchableOpacity style={{flex:1/3, aspectRatio:1}} onPress={() => { 
                        ImagePicker.openPicker({
                            mediaType: 'photo',
                            cropping: true,
                            width: 400,
                            height: 400,
                        }).then(image => {
                            this.setState({profileURL: image.path})
                        });
                    }}>
                        <FastImage
                            style={{flex: 1, borderRadius: 100}}
                            source={this.state.profileURL ? {
                                uri:
                                this.state.profileURL,
                            } : require('./../../logo/ic_launcher.png')}
                        />
                    </TouchableOpacity>
                </View>
                <Input
                    onChangeText={(nickname) => {
                        if (nickname.length > 0) {
                            this.setState({nickname: nickname});
                        } else {
                            this.setState({nickname: this.state.nickname});
                        }
                    }}
                    defaultValue={this.state.nickname}
                    maxLength={30}
                    inputStyle={styles.inputs}
                    placeholder={translate("Nickname")}
                    placeholderTextColor="#bdbdbd"
                    leftIcon={
                        <Icon
                            name='account-circle'
                            size={24}
                            color={Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c'}
                        />
                    }
                />
                <Text style={{textAlign: 'center', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
                    {auth().currentUser.uid}
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
                        .doc(auth().currentUser.uid)
                        .update({
                            modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                            displayName: this.state.nickname,
                        });
                    } else {
                        var filename = this.state.profileURL.split('/');
                        var photoname = filename[filename.length - 1].split('.');
                        var ext = photoname[photoname.length - 1];

                        var storageRef = storage().ref(`${auth().currentUser.uid}/profile/profile.${ext}`);
                        await firestore()
                        .collection("Users")
                        .doc(auth().currentUser.uid)
                        .update({
                            modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                            displayName: this.state.nickname,
                        });
                        try {
                            // await storage().ref(`${auth().currentUser.uid}/profile`).listAll()
                            // .then((result) => {
                            //     console.log()
                            // }).catch((e) => {
                            //     console.log(e);
                            // });
                            await storageRef.putFile(`${this.state.profileURL}`);
                        } catch (e) {
                            console.log(e);
                        } finally {
                            // if (this.state.ads && interstitial.loaded) {
                            //     interstitial.show();
                            // }
                            if (this.state.ads) {
                                AdMobInterstitial.showAd().catch(error => console.warn(error));
                            }
                            this.props.navigation.replace('Main');
                        }
                    }
                    this.setState({loading: false});
                    this.props.route.params.onPop();
                }
            }}>
                <Text style={styles.loginText}> {translate("UpdateProfile")} </Text>
            </TouchableOpacity>
            </View>
            }
        </SafeAreaView>
      );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
        justifyContent: 'space-between',
    },
    inputs:{
        marginLeft:15,
        borderBottomColor: Appearance.getColorScheme() === 'dark' ? "#fff" : '#002f6c',
        flex:1,
        color: Appearance.getColorScheme() === 'dark' ? "#fff" : '#002f6c',
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
        borderColor: "#002f6c",
        borderWidth: 1,
    },
    loginText: {
        color: 'white',
    },
});