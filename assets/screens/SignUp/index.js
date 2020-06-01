import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { Divider, Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

import auth from '@react-native-firebase/auth';

export default class SignUp extends Component {
    async createEmail(email, password, passwordConfirm) {
        if (email == null || !email.includes('@')) {
            Alert.alert(
                'Invalid value',
                'Please check your email or password.',
                    [
                        {text: 'OK', onPress: () => console.log('OK Pressed')},
                    ],
                { cancelable: false }
            );
            return;
        } else if (password == null || password.length < 6) {
            Alert.alert(
                'Invalid value',
                'Please check your password is at least six digits.',
                    [
                        {text: 'OK', onPress: () => console.log('OK Pressed')},
                    ],
                { cancelable: false }
            );
            return;
        } else if (passwordConfirm == null || password != passwordConfirm) {
            Alert.alert(
                'Invalid value',
                'Please check if the password matches the confirm password.',
                    [
                        {text: 'OK', onPress: () => console.log('OK Pressed')},
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
                    'Successfully signed up!',
                    'Please sign in via ' + email + '.',
                    [
                        {text: 'OK', onPress: () => {this.props.navigation.goBack()}},
                    ],
                    { cancelable: false }
                    );
            } else {
                auth().currentUser.sendEmailVerification();
                Alert.alert(
                    'Successfully signed up!',
                    'Please check your email in ' + email + '.',
                    [
                        {text: 'OK', onPress: () => {this.props.navigation.goBack()}},
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
            <View style={styles.cellView}>
                <Input
                placeholder='Email'
                placeholderTextColor="#bdbdbd"
                onChangeText = {(email) => this.setState({email})}
                leftIcon={
                    <Icon
                    name='email'
                    size={24}
                    color='#002f6c'
                    />
                }
                inputStyle={styles.inputs}
                />
            </View>
            <View style={styles.cellView}>
                <Input
                placeholder='Password'
                placeholderTextColor="#bdbdbd"
                secureTextEntry={true}
                onChangeText = {(password) => this.setState({password})}
                leftIcon={
                    <Icon
                    name='lock'
                    size={24}
                    color='#002f6c'
                    />
                }
                inputStyle={styles.inputs}
                />
            </View>
            <View style={styles.cellView}>
                <Input
                placeholder='Confirm Password'
                placeholderTextColor="#bdbdbd"
                secureTextEntry={true}
                onChangeText = {(passwordConfirm) => this.setState({passwordConfirm})}
                leftIcon={
                    <Icon
                    name='lock'
                    size={24}
                    color='#002f6c'
                    />
                }
                inputStyle={styles.inputs}
                />
            </View>
            <TouchableOpacity style={[styles.buttonContainer, styles.signUpButton]} onPress={() => { 
                this.createEmail(this.state.email, this.state.password, this.state.passwordConfirm)
            }}>
                <Text style={styles.signUpText}>Sign up</Text>
            </TouchableOpacity>
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
        borderBottomColor: '#002f6c',
        flex:1,
        color: "#002f6c",
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