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

import { Divider, Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';

import { translate } from '../Utils';

export default class SignUp extends Component {
    async componentDidMount() {
        this.props.navigation.setOptions({ title: translate("SignUp") });
    }

    async createEmail(email, password, passwordConfirm) {
        if (email == null || !email.includes('@')) {
            Alert.alert(
                translate('InvalidValue'),
                translate('SignUpComment1'),
                    [
                        {text: translate('OK'), onPress: () => console.log('OK Pressed')},
                    ],
                { cancelable: false }
            );
            return;
        } else if (password == null || password.length < 6) {
            Alert.alert(
                translate('InvalidValue'),
                translate('SignUpComment2'),
                    [
                        {text: translate('OK'), onPress: () => console.log('OK Pressed')},
                    ],
                { cancelable: false }
            );
            return;
        } else if (passwordConfirm == null || password != passwordConfirm) {
            Alert.alert(
                translate('InvalidValue'),
                translate('SignUpComment3'),
                    [
                        {text: translate('OK'), onPress: () => console.log('OK Pressed')},
                    ],
                { cancelable: false }
            );
            return;
        }
        auth()
        .createUserWithEmailAndPassword(email, password)
        .then(() => {
            if (auth().currentUser.emailVerified) {
                Alert.alert(
                    translate('SignUpComment4'),
                    translate('SignUpComment5') + email,
                    [
                        {text: translate('OK'), onPress: () => {this.props.navigation.goBack()}},
                    ],
                    { cancelable: false }
                    );
            } else {
                auth().currentUser.sendEmailVerification();
                Alert.alert(
                    translate('SignUpComment4'),
                    translate('SignUpComment6') + email,
                    [
                        {text: translate('OK'), onPress: () => {this.props.navigation.goBack()}},
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
        });
    }

    static navigationOptions = {
        header: null,
    };

    constructor(props) {
        super(props);
    }

    state = {
        email: '',
        password: '',
        passwordConfirm: '',
    }

    render() {
        return (
        <SafeAreaView style={styles.container}>
            <View style={{justifyContent: 'center', alignItems: 'center', width: "100%", height: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? "#121212" : "#fff"}}>
                <View style={styles.cellView}>
                    <Input
                    placeholder={translate('Email')}
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
                    placeholder={translate('Password')}
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
                <View style={styles.cellView}>
                    <Input
                    placeholder={translate('ConfirmPassword')}
                    placeholderTextColor="#bdbdbd"
                    secureTextEntry={true}
                    onChangeText = {(passwordConfirm) => this.setState({passwordConfirm})}
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
                <TouchableOpacity style={[styles.buttonContainer, styles.signUpButton]} onPress={() => { 
                    this.createEmail(this.state.email, this.state.password, this.state.passwordConfirm)
                }}>
                    <Text style={styles.signUpText}>{translate('SignUp')}</Text>
                </TouchableOpacity>
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
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#002f6c" : "#fff"
    },
    cell: { width: "80%", height: 50 },
    cellView: { 
        width: "84%",
        height: 60, 
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
    signUpButton: {
        backgroundColor: "#fff",
        borderColor: '#002f6c',
        borderWidth: 1,
    },
    signUpText: {
        color: '#002f6c',
    }
});