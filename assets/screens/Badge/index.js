import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Appearance,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';

import { Divider, Input, Avatar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { translate } from '../Utils';

import AsyncStorage from '@react-native-community/async-storage';

export default class Badge extends Component {
  state = {
    loading: true,
    log1: false,
    log10: false,
    following1: false,
    following10: false,
    follower10: false,
    follower100: false,
    view100: false,
    view1000: false,
    profile: false,
    play: false, // badge collection in firestore
    share: false, // badge collection in firestore
    link: false, // badge collection in firestore
  }

  async componentDidMount() {
    this.props.navigation.setOptions({ title: translate("Badge") });
    this.setState({
      loading: true,
    });

    // badge와 관련된 사항들을 처리하자...
    let profileSnapshot = await firestore().doc(`Users/${auth().currentUser.uid}`).get();
    let badgeSnapshot = await firestore().doc(`Badges/${auth().currentUser.uid}`).get();
    let storageRef = await storage().ref();
    try { 
      await storageRef.child(`${auth().currentUser.uid}/profile/profile_144x144.jpeg`).getDownloadURL();
      this.setState({
        profile: true,
      });
    } catch (e) {
      console.log(e);
    }

    if (profileSnapshot.exists) {
      const data = profileSnapshot.data();
      this.setState({
        log1: data.logsLength >= 1,
        log10: data.logsLength >= 10,
        following1: data.followingsLength >= 1,
        following10: data.followingsLength >= 10,
        follower10: data.followersLength >= 10,
        follower100: data.followersLength >= 100,
        view100: data.viewsLength >= 100,
        view1000: data.viewsLength >= 1000,
      });
    }

    let badgePlay = await AsyncStorage.getItem('badgePlay');
    if (badgePlay === null) {
      await AsyncStorage.setItem('badgePlay', 'false');
    }
    let badgeShare = await AsyncStorage.getItem('badgeShare');
    if (badgeShare === null) {
      await AsyncStorage.setItem('badgeShare', 'false');
    }
    let badgeLink = await AsyncStorage.getItem('badgeLink');
    if (badgeLink === null) {
      await AsyncStorage.setItem('badgeLink', 'false');
    }

    let play = badgePlay === 'true';
    let share = badgeShare === 'true';
    let link = badgeLink === 'true';

    if (!badgeSnapshot.exists) {
      await firestore().doc(`Badges/${auth().currentUser.uid}`).set({
        play: play,
        share: share,
        link: link,
      });
    } else {
      const data = badgeSnapshot.data();
      
      if (data.play && !play) {
        await AsyncStorage.setItem('badgePlay', 'true');
        play = true;
      }

      if (data.share && !share) {
        await AsyncStorage.setItem('badgeShare', 'true');
        share = true;
      }

      if (data.link && !link) {
        await AsyncStorage.setItem('badgeLink', 'true');
        link = true;
      }

      await firestore().doc(`Badges/${auth().currentUser.uid}`).update({
        play: play,
        share: share,
        link: link,
      });
    }

    console.log(play, share, link);

    this.setState({
      play: play,
      share: share,
      link: link,
      loading: false,
    });
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        { this.state.loading ? <View style={{width: "100%", height: "100%", alignItems: 'center', justifyContent: 'center', backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff'}}>
              <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
        </View> 
        : <ScrollView contentContainerStyle={styles.viewContainer} style={styles.list} >
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.log1 ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('Log')}\n1+`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.log10 ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('Log')}\n10+`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.following1 ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('Followings')}\n1+`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.following10 ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('Followings')}\n10+`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.follower10 ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('Followers')}\n10+`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.follower100 ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('Followers')}\n100+`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.view100 ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('Views')}\n100+`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.view1000 ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('Views')}\n1000+`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.profile ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('BadgeProfile')}`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.play ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('BadgePlay')}`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.share ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('BadgeShare')}`}</Text>
              </View>
            </View>
            <View style={styles.cellView}>
              <View style={[styles.cell, {backgroundColor: this.state.link ? "#002f6c" : "grey"}]}>
                <Text style={{color: 'white', textAlign: 'center'}}>{`${translate('BadgeLink')}`}</Text>
              </View>
            </View>
        </ScrollView> }
      </SafeAreaView>
    );
  }
}

const logo = {
  uri: 'https://reactnative.dev/img/tiny_logo.png',
  width: 64,
  height: 64
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
      width: "100%",
    },
    cell: { 
      width: "100%", 
      height: "100%", 
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    cellView: { 
      width: "50%",
      height: "30%", 
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    list:{
      flex: 1,
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff",
    },
    stylegridView:{
        flex: 1,
    },
    viewContainer: {
      flexGrow: 1,
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
    },
});