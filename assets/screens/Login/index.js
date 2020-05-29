import React, { Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
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

const adBannerUnitId = __DEV__ ? TestIds.BANNER : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3050510769' 
    : 'ca-app-pub-1477690609272793/8274029234');

const adInterstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3775880012' 
    : 'ca-app-pub-1477690609272793/9626786110');

export default class Login extends Component {
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
        'Login Error',
        e.toString(),
        [
          {text: 'OK', onPress: () => console.log('OK Pressed')},
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
        'Login Error',
        e.toString(),
        [
          {text: 'OK', onPress: () => console.log('OK Pressed')},
        ],
        { cancelable: false }
      );
    }
  }
  async emailLogin(email, password) {
      if (email == null || !email.includes('@') || password == null) {
          Alert.alert(
          'Invalid value',
          'Please check your email or password.',
          [
              {text: 'OK', onPress: () => console.log('OK Pressed')},
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
            'Verification error',
            'Please check your email in ' + email + '.\nIf you do not receive an email, please wait a moment.',
            [
                {text: 'OK', onPress: () => {  }},
            ],
            { cancelable: false }
          );
        }
      })
      .catch(error => {
          Alert.alert(
          'Error',
          error.toString(),
          [
              {text: 'OK', onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
          );
          return;
      });
  }

  async forgotPassword(email) {
      if (email == null || !email.includes('@')) {
          Alert.alert(
          'Invalid value',
          'Please check your email',
          [
              {text: 'OK', onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
          );
          return;
      }
      auth().sendPasswordResetEmail(email)
      .then(() => {
          Alert.alert(
          'Password reset',
          'Sent a password reset email to ' + email + '.',
          [
              {text: 'OK', onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
          );
      })
      .catch(error => {
          Alert.alert(
          'Error',
          error.toString(),
          [
              {text: 'OK', onPress: () => console.log('OK Pressed')},
          ],
          { cancelable: false }
          );
      });
  }
  state = {
    email: '',
    password: '',
  }

  constructor(props) {
      super(props);
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cellView}>
            <Input
            placeholder='Email'
            onChangeText = {(email) => this.setState({email})}
            leftIcon={
                <Icon
                name='email'
                size={24}
                color='#00b5ec'
                />
            }
            inputStyle={styles.inputs}
            />
        </View>
        <View style={styles.cellView}>
            <Input
            placeholder='Password'
            secureTextEntry={true}
            onChangeText = {(password) => this.setState({password})}
            leftIcon={
                <Icon
                name='lock'
                size={24}
                color='#00b5ec'
                />
            }
            inputStyle={styles.inputs}
            />
        </View>
        <TouchableOpacity style={[styles.buttonContainer, styles.loginButton]} onPress={() => { 
          console.log(this.state.email)
          this.emailLogin(this.state.email, this.state.password) }}>
            <Text style={styles.loginText}>Sign in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buttonContainer, styles.signUpButton]} onPress={() => { this.props.navigation.push('SignUp') }}>
            <Text style={styles.signUpText}>Sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginBottom: 15}} onPress={() => { this.props.navigation.push('ResetPassword') }}>
            <Text>Forgot your password?</Text>
        </TouchableOpacity>
        <View style={{marginBottom: 15}}>
            <View style={{alignSelf:'center', position:'absolute', borderBottomColor:'gray', borderBottomWidth:1, height:'50%', width:'80%'}}/>
            <Text style={{alignSelf:'center', paddingHorizontal:5, backgroundColor: "#fff", color: 'gray'}}>Or</Text>
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
        <View style={{marginTop: 15, width: "80%", alignItems: "center"}}>
          <BannerAd 
            unitId={adBannerUnitId} 
            size={BannerAdSize.BANNER}
          />
        </View>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#fff",
  },
  cell: { width: "80%", height: 50 },
  cellView: { 
    width: "84%",
    height: 60, 
  },
  inputs:{
      marginLeft:15,
      borderBottomColor: '#00b5ec',
      flex:1,
      color: "#00b5ec",
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
    backgroundColor: "#00b5ec",
  },
  signUpButton: {
    backgroundColor: "#fff",
    borderColor: '#00b5ec',
    borderWidth: 1,
  },
  loginText: {
    color: 'white',
  },
  signUpText: {
    color: '#00b5ec',
  }
});