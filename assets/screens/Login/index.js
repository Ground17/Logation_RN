import React, { Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Appearance,
} from 'react-native';

import { Divider, Input, Overlay } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';

import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-community/google-signin';
import appleAuth, {
  AppleButton,
  AppleAuthRequestScope,
  AppleAuthRequestOperation
} from '@invertase/react-native-apple-authentication';

import { InterstitialAd, BannerAd, TestIds, BannerAdSize } from '@react-native-firebase/admob';

import { adsFree, translate } from '../Utils';

import { ColorSchemeContext } from 'react-native-dynamic'

const adBannerUnitId = __DEV__ ? TestIds.BANNER : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3050510769' 
    : 'ca-app-pub-1477690609272793/8274029234');

const adInterstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3775880012' 
    : 'ca-app-pub-1477690609272793/9626786110');

export default class Login extends Component {
  state = {
    email: '',
    password: '',
    ads: true,
  }
  async appleLogin() {
    try {
      // 1). start a apple sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: AppleAuthRequestOperation.LOGIN,
        requestedScopes: [AppleAuthRequestScope.EMAIL, AppleAuthRequestScope.FULL_NAME],
      });
      // 2). if the request was successful, extract the token and nonce
      const { identityToken, nonce } = appleAuthRequestResponse;

      if (identityToken) {
        // 3). create a Firebase `AppleAuthProvider` credential
        const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

        const userCredential = await auth().signInWithCredential(appleCredential);
        // user is now signed in, any Firebase `onAuthStateChanged` listeners you have will trigger
        this.props.navigation.replace('Main');
        return;
      } 
    } catch (e) {
      Alert.alert(
        translate('LoginError'), //로그인 에러
        e.toString(),
        [
          {text: translate('OK'), onPress: () => console.log('OK Pressed')},
        ],
        { cancelable: false }
      );
    }
  }

  async googleLogin() {
    try {
      // add any configuration settings here:
      await GoogleSignin.configure();

      const data = await GoogleSignin.signIn();

      // create a new firebase credential with the token
      const credential = auth.GoogleAuthProvider.credential(data.idToken, data.accessToken)
      // login with credential
      const firebaseUserCredential = await auth().signInWithCredential(credential);

      this.props.navigation.replace('Main');
      return;
    } catch (e) {
      Alert.alert(
        translate('LoginError'), //로그인 에러
        e.toString(),
        [
          {text: translate('OK'), onPress: () => console.log('OK Pressed')},
        ],
        { cancelable: false }
      );
    }
  }
  async emailLogin(email, password) {
      if (email == null || !email.includes('@') || password == null) {
          Alert.alert(
            translate('InvalidValue'), //정확하지 않은 정보
            translate('LoginComment1'), //이메일 혹은 비밀번호를 다시 확인해주세요.
          [
              {text: translate('OK'), onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
          );
          return;
      }
      auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        if (auth().currentUser.emailVerified) {
          this.props.navigation.replace('Main');
          return;
        } else {
          console.log(auth().currentUser);
          auth().currentUser.sendEmailVerification();
          Alert.alert(
            translate('VerificationError'), //확인 오류
            translate('LoginComment2'), //이메일을 확인해주세요. 이메일을 받지 못했다면 잠시만 기다려 주세요.
            [
                {text: translate('OK'), onPress: () => {  }},
            ],
            { cancelable: false }
          );
        }
      })
      .catch(error => {
          Alert.alert(
          translate('Error'),
          error.toString(),
          [
              {text: translate('OK'), onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
          );
          return;
      });
  }

  async forgotPassword(email) {
      if (email == null || !email.includes('@')) {
          Alert.alert(
            translate('InvalidValue'), //정확하지 않은 정보
            translate('LoginComment1'), //이메일 혹은 비밀번호를 다시 확인해주세요.
          [
              {text: translate('OK'), onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
          );
          return;
      }
  }

  async componentDidMount() {
    this.setState({
      email: '',
      password: '',
      ads: !adsFree,
    });

    this.props.navigation.setOptions({ title: translate("SignIn") });
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.title}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: "100%"}}>
              <View style={{justifyContent: 'flex-start', marginLeft: 10}}>
                  <Image
                      style={{flex: 1, width: 120, height: 120, resizeMode: 'cover'}}
                      source={Appearance.getColorScheme() === 'dark' ? require('./../../logo/graphicImage2.png') : require('./../../logo/graphicImage1.png')}/>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginRight: 10}}>
                <TouchableOpacity style={{marginRight:10, }} onPress={() => { this.props.navigation.push('Language') }}>
                    <Icon
                      name='translate'
                      size={24}
                      color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                    />
                </TouchableOpacity>
              </View>
          </View>
        </View>
        <View style={{flex: 1, width: "100%", alignItems: 'center', justifyContent: 'center'}}>
          <View style={styles.cellView}>
              <Input
              autoCapitalize='none'
              placeholder={translate('Email')} //이메일
              placeholderTextColor="#bdbdbd"
              onChangeText = {(email) => this.setState({email})}
              leftIcon={
                  <Icon
                  name='email'
                  size={24}
                  color={Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c'}
                  />
              }
              inputStyle={styles.inputs}
              />
          </View>
          <View style={styles.cellView}>
              <Input
              autoCapitalize='none'
              placeholder={translate('Password')} //비밀번호
              placeholderTextColor="#bdbdbd"
              secureTextEntry={true}
              onChangeText = {(password) => this.setState({password})}
              leftIcon={
                  <Icon
                  name='lock'
                  size={24}
                  color={Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c'}
                  />
              }
              inputStyle={styles.inputs}
              />
          </View>
          <TouchableOpacity style={[styles.buttonContainer, styles.loginButton]} onPress={() => { 
            console.log(this.state.email)
            this.emailLogin(this.state.email, this.state.password) }}>
              <Text style={styles.loginText}>{translate("SignIn")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonContainer, styles.signUpButton]} onPress={() => { this.props.navigation.push('SignUp') }}>
              <Text style={styles.signUpText}>{translate("SignUp")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{marginBottom: 15}} onPress={() => { this.props.navigation.push('ResetPassword') }}>
              <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}>{translate("LoginComment3")}</Text>
          </TouchableOpacity>
          <View style={{marginBottom: 15}}>
              <View style={{alignSelf:'center', position:'absolute', borderBottomColor:'gray', borderBottomWidth:1, height:'50%', width:'80%'}}/>
              <Text style={{alignSelf:'center', paddingHorizontal:5, backgroundColor: Appearance.getColorScheme() === 'dark' ? '#002f6c' : '#fff', color: 'gray'}}>Or</Text>
          </View>
          <GoogleSigninButton
              style={styles.cell}
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={() => this.googleLogin()}
          />
          {Platform.OS == 'ios' && <AppleButton
              style={styles.cell}
              buttonStyle={AppleButton.Style.BLACK}
              buttonType={AppleButton.Type.SIGN_IN}
              onPress={() => this.appleLogin()}
          />}
          <View style={{marginTop: 10, marginBottom: 10}}>
              <View style={{alignSelf:'center', position:'absolute', borderBottomColor:'gray', borderBottomWidth:1, height:'50%', width:'80%'}}/>
          </View>
          <View style={{width: "80%", alignItems: "center"}}>
            {this.state.ads && <BannerAd 
              unitId={adBannerUnitId} 
              size={BannerAdSize.BANNER}
            />}
          </View>
        </View>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff"
  },
  cell: { width: "80%", height: 50 },
  title: { 
    width: "100%",
    height: 50,
    justifyContent: 'space-between',
    backgroundColor: Appearance.getColorScheme() === 'dark' ? "#01579b" : "#fff"
  },
  cellView: { 
    width: "84%",
    height: 60, 
  },
  inputs:{
    marginLeft:15,
    borderBottomColor: Appearance.getColorScheme() === 'dark' ? "#fff" : '#002f6c',
    flex:1,
    color: Appearance.getColorScheme() === 'dark' ? "#fff" : "#002f6c",
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
    borderColor: "#fff",
    borderWidth: 1,
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