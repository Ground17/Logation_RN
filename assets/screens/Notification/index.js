import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert
} from 'react-native';

import { Divider, Input, Avatar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';

export default class Notification extends Component {

  render() {
    return(
      <SafeAreaView style={styles.container}>
        <View style={styles.buttonContainer, {marginTop:10}}>
          
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
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
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom:5,
    },
    loginButton: {
      backgroundColor: "#002f6c",
    },
    signUpButton: {
      backgroundColor: "#fff",
      borderColor: '#002f6c',
      borderWidth: 1,
    },
    loginText: {
      color: 'white',
    },
    signUpText: {
      color: '#002f6c',
    }
});