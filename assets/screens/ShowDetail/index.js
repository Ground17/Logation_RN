import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Appearance,
} from 'react-native';

import { Divider, Input, Avatar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';

import { translate } from '../Utils';

export default class ShowDetail extends Component {
  async componentDidMount() {
    this.props.navigation.setOptions({ title: "/// 세부정보 ///" });
  }

  render() {
    return(
      <SafeAreaView style={styles.container}>
        <View style={{width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
          <Text>
            {제목}
          </Text>
          <Text>
            {부제목}
          </Text>
          <Text>
            {날짜}
          </Text>
          <Text>
            {수정 날짜}
          </Text>
          <Text>
            {관련 링크}
          </Text>
          <Text>
            {조회수}
          </Text>
          <Text>
            {프로필}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff",
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
});