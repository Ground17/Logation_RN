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
} from 'react-native';

import { Divider, Input, Avatar, SearchBar, ListItem } from 'react-native-elements';

import Icon from 'react-native-vector-icons/MaterialIcons';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import { translate } from '../Utils';

export default class Following extends Component {
  state = {
    search: '',
    following: [],
    searching: [],
  };

  updateSearch = search => {
    this.setState({ search });
    console.log(this.state.search);
    if (!this.state.search || this.state.search.length < 2) {
      this.search();
    }
  };

  async search() {
    if (!this.state.search) {
      this.setState({
        searching: this.state.following,
      });
    } else {
      this.setState({
        searching: this.state.following.filter(data => data.email.includes(this.state.search) || data.displayName.includes(this.state.search)),
      });
    }
  }

  async initial() {
    this.setState({
      search: '',
      following: [],
      searching: [],
    });
    var storageRef = await storage().ref();
    const user = await firestore().collection("Users").doc(auth().currentUser.email);
    if ((await user.get()).exists) {
      data = (await user.get()).data();
      for (var i = 0; i<data.following.length; i++) {
        const other = await firestore().collection("Users").doc(data.following[i]);
        item = (await other.get()).data();
        try {
          var URL = await storageRef.child(item.email + "/" + item.profile).getDownloadURL();
        } catch (e) {
          var URL = '';
        } finally {
          this.setState({
            following: this.state.following.concat({ 
              email : item.email,
              displayName : item.displayName,
              profileURL : URL,
            })
          });
        }
      }
      this.setState({
        searching: this.state.following,
      });
    }
  }

  async componentDidMount() {
    this.props.navigation.setOptions({
      title: translate("Followings"),
      headerRight: () => 
      <View style={{flexDirection: 'row'}}>
        <TouchableOpacity style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 5,
            paddingRight: 20,
          }} onPress={async () => { // 이 사진 삭제
            await this.initial();
        }}>
          <Icon
            name="refresh"
            size={24}
            color='#fff'
          />
        </TouchableOpacity>
      </View>
    });
    await this.initial();
  }

  keyExtractor = (item, index) => index.toString()

  renderItem = ({ item, index }) => (
    <ListItem
      title={item.displayName}
      titleStyle={{ fontWeight: 'bold', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000' }}
      subtitle={item.email}
      subtitleStyle={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}
      leftAvatar={{ source: item.profileURL ? { uri: item.profileURL } : require('./../../logo/ic_launcher.png'), rounded: true}}
      containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#fff'}}
      bottomDivider
      onPress={() => { 
        if (auth().currentUser.email != item.email) {
          this.props.navigation.push('Other', {
            userEmail: item.email,
          }); 
          return;
        }
        Alert.alert(
          translate('MyAccount'),
          item.email,
          [
          {text: translate('OK'), onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
        );
      }}
    />
  )

  render() {
    return(
      <SafeAreaView style={styles.container}>
        <SearchBar
            platform={Platform.OS}
            autoCapitalize='none'
            containerStyle={styles.cellView}
            placeholder={translate("SearchComment1")} //사용자의 이름을 입력해주세요...
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
          <View style={styles.buttonContainer}>
            <FlatList
              style={{width: "100%"}}
              keyExtractor={this.keyExtractor}
              data={this.state.searching}
              renderItem={this.renderItem}
            />
          </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
    },
    cellView: { 
      backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
      width: "95%",
    },
    buttonContainer: {
        width: "100%",
        height: "100%",
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom:5,
    },
});