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

import { Divider, Input, Avatar, SearchBar, ListItem } from 'react-native-elements';

import Icon from 'react-native-vector-icons/MaterialIcons';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import auth from '@react-native-firebase/auth';

import { translate } from '../Utils';

export default class Search extends Component {
  state = {
    search: '',
    list: [],
  };

  updateSearch = search => {
    this.setState({ search });
  };

  async search() {
    if (this.state.search.length < 1) {
      return;
    }

    this.setState({
      list: [],
    });

    var storageRef = await storage().ref();
    await firestore()
      .collection("Users")
      .where("email", ">=", this.state.search)
      .orderBy("email", "asc")
      .limit(3)
      .get()
      .then(async (querySnapshot) => {
        for (var i = 0; i < querySnapshot.docs.length; i++) {
          console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
          var data = querySnapshot.docs[i].data();
          try {
            var URL = await storageRef.child(data.email + "/" + data.profile).getDownloadURL();
          } catch (e) {
            var URL = '';
          } finally {
            this.setState({
              list: this.state.list.concat({ 
                email : data.email,
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
      .limit(3)
      .get()
      .then(async (querySnapshot) => {
        for (var i = 0; i < querySnapshot.docs.length; i++) {
          console.log('data: ', querySnapshot.docs[i].id, querySnapshot.docs[i].data());
          var data = querySnapshot.docs[i].data();
          try {
            var URL = await storageRef.child(data.email + "/" + data.profile).getDownloadURL();
          } catch (e) {
            var URL = '';
          } finally {
            this.setState({
              list: this.state.list.concat({ 
                email : data.email,
                displayName : data.displayName,
                profileURL : URL,
              })
            });
          }
        }
      });
  }

  keyExtractor = (item, index) => index.toString()

  renderItem = ({ item, index }) => (
    <ListItem
      title={item.displayName ?? ''}
      titleStyle={{ fontWeight: 'bold', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000' }}
      subtitle={item.email}
      subtitleStyle={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}
      leftAvatar={{ source: item.profileURL ? { uri: item.profileURL } : require('./../../logo/ic_launcher.png'), rounded: true}}
      containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
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
          <FlatList
            style={{width: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
    },
    cellView: {
      backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff",
      width: "100%",
    },
});