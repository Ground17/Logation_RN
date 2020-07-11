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

import { translate } from '../Utils';

export default class ResetPassword extends Component {
    async componentDidMount() {
        this.props.navigation.setOptions({ title: translate("ResetPassword") });
    }

    async createEmail(email, password, passwordConfirm) {
        if (email == null || !email.includes('@')) {
            Alert.alert(
                translate("InvalidValue"), //정확하지 않은 정보
                translate("ResetPasswordComment1"), //이메일을 확인해주세요.
                    [
                        {text: translate('OK'), onPress: () => console.log('OK Pressed')},
                    ],
                { cancelable: false }
            );
            return;
        }
        auth()
        .sendPasswordResetEmail(email)
        .then(() => {
            Alert.alert(
                translate('ResetPasswordComment2'), //초기화를 위한 이메일을 전송했습니다.
                translate("ResetPasswordComment3") + email, //이메일을 확인해주세요
                [
                    {text: translate('OK'), onPress: () => {this.props.navigation.goBack()}},
                ],
                { cancelable: false }
            );
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
    }

    render() {
        return (
        <SafeAreaView style={styles.container}>
            <View style={styles.cellView}>
                <Input
                placeholder={translate('Email')}
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
            <TouchableOpacity style={[styles.buttonContainer, styles.signUpButton]} onPress={() => { 
                this.createEmail(this.state.email, this.state.password, this.state.passwordConfirm)
            }}>
                <Text style={styles.signUpText}>{translate("ResetPasswordComment4")}</Text>
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