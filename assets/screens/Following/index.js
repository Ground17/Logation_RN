import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';

import { Divider, Input, Avatar, SearchBar, ListItem } from 'react-native-elements';

import Icon from 'react-native-vector-icons/MaterialIcons';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import auth from '@react-native-firebase/auth';

export default class Following extends Component {
  state = {
    search: '',
    list: [],
  };

  updateSearch = search => {
    this.setState({ search });
  };

  async search() {
    this.setState({
      list: [],
    });
    var storageRef = await storage().ref();
    await firestore()
      .collection("Users")
      .orderBy("email")
      .startAt(this.state.search)
      .limit(3)
      .get()
      .then(async (querySnapshot) => {
        querySnapshot.forEach(async (documentSnapshot) => {
          console.log("email");
          var data = documentSnapshot.data();
          this.setState({
            list: this.state.list.concat({ 
              email : data.email,
              displayName : data.displayName,
              prlfileURL : await storageRef.child(data.email + "/" + data.profile).getDownloadURL(),
            })
          });
        });
      });

    await firestore()
      .collection("Users")
      .orderBy("displayName")
      .startAt(this.state.search)
      .limit(3)
      .get()
      .then(async (querySnapshot) => {
        querySnapshot.forEach(async (documentSnapshot) => {
          console.log("nickname");
          data = documentSnapshot.data();
          this.setState({
            list: this.state.list.concat({ 
              email : data.email,
              displayName : data.displayName,
              profileURL : await storageRef.child(data.email + "/" + data.profile).getDownloadURL(),
            })
          });
        });
      });
  }

  keyExtractor = (item, index) => index.toString()

  renderItem = ({ item, index }) => (
    <ListItem
      title={item.displayName}
      titleStyle={{ fontWeight: 'bold' }}
      subtitle={item.email}
      leftAvatar={{ source: { uri: item.profileURL ?? '' }, rounded: true}}
      bottomDivider
      onPress={() => { 
        if (auth().currentUser.email != item.email) {
          this.props.navigation.push('Other', {
            userEmail: item.email,
          }); 
          return;
        }
        Alert.alert(
          'My account',
          item.email,
          [
          {text: 'OK', onPress: () => console.log('OK Pressed')},
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
            lightTheme
            containerStyle={styles.cellView}
            placeholder="Type Here for search users..."
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
              data={this.state.list}
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
        backgroundColor: "#fff",
    },
    cellView: { 
      width: "84%",
    },
    buttonContainer: {
        width: "84%",
        height: "100%",
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom:5,
    },
});