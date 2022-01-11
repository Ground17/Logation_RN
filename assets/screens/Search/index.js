import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  Appearance,
  Platform,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import { Divider, Input, SearchBar, ListItem } from 'react-native-elements';

import Icon from 'react-native-vector-icons/MaterialIcons';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import auth from '@react-native-firebase/auth';

import { translate } from '../Utils';


export default class Search extends Component {
  state = {
    search: '',
    list: [],
    users: [],
    userDetail: [],
    following: [],
  };

  renderAvatar = ({ item, index }) => ( // 추가할 사용자 표현
    <View>
        <TouchableOpacity style={{marginLeft:5, marginRight:5, flex:1, aspectRatio:1}} onPress={() => {
            this.setState({
                users: this.state.users.filter((items, i) => i != index),
                userDetail: this.state.userDetail.filter((items, i) => i != index),
            });
        }}>
            <FastImage
                style={{flex: 1, borderRadius: 100}}
                source={this.state.userDetail[index].url ? { uri: this.state.userDetail[index].url } : require('./../../logo/ic_launcher.png')}
            />
        </TouchableOpacity>
    </View>
  )

  updateSearch = search => {
    this.setState({ search });
  };

  // async lazy() {

  // }

  async search() {
    if (this.state.search.length < 1) {
      return;
    }

    this.setState({
      list: [],
    });

    var storageRef = await storage().ref();

    if (this.props.route.params) {
      await firestore()
        .collection("Users")
        .where("uid", "in", this.state.following)
        .where("uid", ">=", this.state.search)
        .orderBy("uid", "asc")
        .limit(2)
        .get()
        .then(async (querySnapshot) => {
          for (var i = 0; i < querySnapshot.docs.length; i++) {
            console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
            var data = querySnapshot.docs[i].data();
            try {
              var URL = await storageRef.child(`${data.uid}/profile/profile_144x144.jpeg`).getDownloadURL();
            } catch (e) {
              var URL = '';
            } finally {
              this.setState({
                list: this.state.list.concat({ 
                  uid : data.uid,
                  displayName : data.displayName,
                  profileURL : URL,
                })
              });
            }
          }
        });

      await firestore()
        .collection("Users")
        .where("uid", "in", this.state.following)
        .where("displayName", ">=", this.state.search)
        .orderBy("displayName", "asc")
        .limit(5)
        .get()
        .then(async (querySnapshot) => {
          for (var i = 0; i < querySnapshot.docs.length; i++) {
            console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
            var data = querySnapshot.docs[i].data();
            try {
              var URL = await storageRef.child(`${data.uid}/profile/profile_144x144.jpeg`).getDownloadURL();
            } catch (e) {
              var URL = '';
            } finally {
              this.setState({
                list: this.state.list.concat({ 
                  uid : data.uid,
                  displayName : data.displayName,
                  profileURL : URL,
                })
              });
            }
          }
        });
    } else {
      var regex = /[?&]([^=#]+)=([^&#]*)/g,
      params = {},
      match;
      // var i = 0;
      
      while (match = regex.exec(this.state.search)) {
          params[match[1]] = match[2];
          // i++;
      }
      console.log(params);

      // 'https://travelog-4e274.web.app/?id=' + this.props.route.params.itemId;
      // 'https://travelog-4e274.web.app/?user=' + this.props.route.params.userUid;
      if (params['id']) {
        this.props.navigation.push('ShowScreen', {
          itemId: params['id'],
          onPop: () => { /* 검색을 통한 게시글 검색은 새로고침 기능 없음 */ },
        });
        return;
      } else if (params['user']) {
        if (params['user'] == auth().currentUser.uid) {
          Alert.alert(
            translate('MyAccount'),
            [
            {text: translate('OK'), onPress: () => console.log('OK Pressed')},
            ],
            { cancelable: false }
          );
        } else {
          this.props.navigation.push('Me', { // Other
            other: true,
            userUid: params['user'],
          });
        }
        return; 
      }

      await firestore()
        .collection("Users")
        .where("uid", ">=", this.state.search)
        .orderBy("uid", "asc")
        .limit(2)
        .get()
        .then(async (querySnapshot) => {
          for (var i = 0; i < querySnapshot.docs.length; i++) {
            console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
            var data = querySnapshot.docs[i].data();
            try {
              var URL = await storageRef.child(`${data.uid}/profile/profile_144x144.jpeg`).getDownloadURL();
            } catch (e) {
              var URL = '';
            } finally {
              this.setState({
                list: this.state.list.concat({ 
                  uid : data.uid,
                  displayName : data.displayName,
                  profileURL : URL,
                })
              });
            }
          }
        });

      await firestore()
        .collection("Users")
        .where("displayName", ">=", this.state.search)
        .orderBy("displayName", "asc")
        .limit(5)
        .get()
        .then(async (querySnapshot) => {
          for (var i = 0; i < querySnapshot.docs.length; i++) {
            console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
            var data = querySnapshot.docs[i].data();
            try {
              var URL = await storageRef.child(`${data.uid}/profile/profile_144x144.jpeg`).getDownloadURL();
            } catch (e) {
              var URL = '';
            } finally {
              this.setState({
                list: this.state.list.concat({ 
                  uid : data.uid,
                  displayName : data.displayName,
                  profileURL : URL,
                })
              });
            }
          }
        });
    }
  }

  check (uid) {
    if (uid == auth().currentUser.uid) {
      return false;
    }
    for (var i = 0; i < this.state.users.length; i++) {
      if (this.state.users[i] == uid) {
        return true;
      }
    }
    return false;
  }

  keyExtractor = (item, index) => index.toString()

  renderItem = ({ item, index }) => (
    <ListItem
      containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
      bottomDivider
      onPress={() => { 
        if (auth().currentUser.uid != item.uid) {
          this.props.navigation.push('Me', {
            other: true,
            userUid: item.uid,
          }); 
          return;
        }
        Alert.alert(
          translate('MyAccount'),
          [
          {text: translate('OK'), onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
        );
      }}
    >
      <View style={{flex:1/7, aspectRatio:1}}>
        <FastImage
          style={{flex: 1, borderRadius: 100}}
          source={item.profileURL ? { uri: item.profileURL } : require('./../../logo/ic_launcher.png')}
        />
      </View>
      <ListItem.Content>
        <ListItem.Title style={{fontWeight: 'bold', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
          {item.displayName ?? ''}
        </ListItem.Title>
        <ListItem.Subtitle style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>
          {item.uid}
        </ListItem.Subtitle>
      </ListItem.Content>
      {(this.props.route.params && this.props.route.params.add) && <TouchableOpacity style={{marginRight:5}} onPress={() => {
          if (this.state.users.length < 10 && !this.check(item.uid)) {
            this.setState({
              users: this.state.users.concat(item.uid),
              userDetail: this.state.userDetail.concat({
                displayName: item.displayName,
                url: item.profileURL,
              }),
            });
          } else {
            Alert.alert(
              translate("Error"),
              translate("SearchComment2"),
              [
              {text: translate("OK"), onPress: () => console.log('OK Pressed')},
              ],
              { cancelable: false }
            );
          }
          console.log("users: ", this.state.users);
        }}>
            <Icon
                name='add-circle-outline'
                size={24}
                color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
            />
        </TouchableOpacity>}
      
    </ListItem>
  )

  async componentDidMount() {
    if (this.props.route.params) { // Me의 follow나 AddList의 add user만 팔로우한 사람 검색
      await firestore()
        .collection("Users")
        .doc(auth().currentUser.uid)
        .collection("following")
        .get()
        .then(async (querySnapshot) => {
          const temp = [];
          for (var i = 0; i < querySnapshot.docs.length; i++) {
            // await firestore().collection("Users").doc(querySnapshot.docs[i].id).get();
            temp.push(querySnapshot.docs[i].id.replace(/ /g,''));
          }
          this.setState({
            following: temp,
          });
        });
      if (this.props.route.params.add) {
        this.setState({
          users: this.props.route.params.users,
          userDetail: this.props.route.params.userDetail,
        });
      }

      if (this.state.following.length == 0) {
        Alert.alert(
          translate("Error"),
          translate("SearchComment3"),
          [
          {text: translate("OK"), onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
        );
        this.props.navigation.pop();
      }
    }
  }

  render() {
    return(
      <SafeAreaView style={styles.container}>
        <SearchBar
            style={{height: "10%"}}
            platform={Platform.OS}
            autoCapitalize='none'
            containerStyle={styles.cellView}
            placeholder={translate("SearchComment1")} // 사용자의 이름을 입력해주세요...
            onChangeText={this.updateSearch}
            value={this.state.search}
            searchIcon={false}
            clearIcon={
              <Icon
                onPress={() => {
                  this.search();
                }}
                name='search'
                size={30}
                color='#002f6c'
              />
            }
          />
          <View style={{ flex: 1, width: "100%", height: "10%", backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#ffffff', flexDirection: 'row',}}>
              <FlatList
                  horizontal
                  keyExtractor={(item, index) => {(index + 20).toString()}}
                  data={this.state.users}
                  renderItem={this.renderAvatar}
                  extraData={this.state}
              />
              {(this.props.route.params && this.props.route.params.add) && <TouchableOpacity style={{marginRight:5}} onPress={() => {
                this.props.route.params.updateUser(this.state.users, this.state.userDetail);
                this.props.navigation.pop();
              }}>
                <Icon
                  name='check-circle'
                  size={24}
                  color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                />
              </TouchableOpacity>}
          </View>
          <FlatList
            style={{width: "100%", height: "80%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
            keyExtractor={this.keyExtractor}
            data={this.state.list}
            renderItem={this.renderItem}
          />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // alignItems: 'center',
        // justifyContent: 'space-between',
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
    },
    cellView: {
      backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff",
      width: "100%",
      height: "10%",
    },
});