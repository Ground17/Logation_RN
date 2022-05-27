import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
  Appearance,
} from 'react-native';

import FastImage from 'react-native-fast-image';

import Icon from 'react-native-vector-icons/MaterialIcons';

import DraggableFlatList from "react-native-draggable-flatlist"; // important!!!

import ImagePicker from 'react-native-image-crop-picker';

import { Picker } from '@react-native-community/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input, CheckBox, ListItem, Avatar } from 'react-native-elements';

import auth from '@react-native-firebase/auth';
import { InterstitialAd, TestIds } from '@react-native-admob/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { adsFree, translate, ProgressBar, adInterstitialUnitId } from '../Utils';

import AsyncStorage from '@react-native-community/async-storage';

import Geolocation from '@react-native-community/geolocation';

const interstitial = InterstitialAd.createAd(adInterstitialUnitId);

const locations = [[37.551161, 126.988228], [35.658405, 139.745300], [40.689306, -74.044361], [51.500700, -0.124607], [48.858369, 2.294480], [-33.856792, 151.214657], [40.431867, 116.570375]];

export default class AddList extends Component {
    state = {
        edit: false,
        category: 0, // 0: Travel, 1: Daily Life, ...
        viewcode: 0, // 0: Map, 1: Normal
        locationChecked: true,
        dateChecked: true,
        likeChecked: true,
        security: 0, // 0: public, 1: public by link, 2: private
        date: new Date(),
        show: false,
        data: [],
        users: [], // 허가받은 user: 10명 제한
        userDetail: [], // 허가받은 user의 상세정보: 10명 제한
        link: '',
        title: '',
        subtitle: '',
        littleTitle: '',
        itemId: '',
        thumbnail: 0,
        loading: false,
        preData: [], // 기존 데이터
        preUser: [],
        photoNumber: 0,
        ads: true,
        completed: 0.0,
        activeItem: -1,
    };

    keyExtractor = (item, index) => index.toString();
    keyExtractor2 = (item, index) => "avatar-" + index.toString();

    renderItem = ({ item, index, drag, isActive }) => ( // 추가할 사진 표현
        <View>
            <Avatar
                rounded
                size="large"
                source={{
                    uri: item.photo || "",
                }}
                onPress={() => {
                    this.setState({
                        activeItem: index,
                        littleTitle: item.title,
                    });
                }}
                onLongPress={drag}
                activeOpacity={1}
            >
            </Avatar>
            {(this.state.thumbnail == index + this.state.photoNumber) && <Icon
                style={{position: 'absolute', top: 0, right: 0}}
                name='stars'
                size={24}
                color='yellow'
            />}
        </View>
    )

    updateUser = (users, userDetail) => {
        if (users.length <= 10) {
            this.setState({
                users: users,
                userDetail: userDetail,
            });
        }
    }

    renderAvatar = ({ item, index }) => ( // 추가할 사용자 표현
        <View>
            <TouchableOpacity style={{marginLeft:5, marginRight:5, flex:1, aspectRatio:1}} onPress={() => {
                Alert.alert(
                    `${this.state.userDetail[index].displayName}\n${this.state.users[index]}`,
                    translate("AddListComment8"),
                    [
                    {text: translate("Cancel"), onPress: () => console.log('Cancel Pressed')},
                    {text: translate("OK"), onPress: () => {
                        this.setState({
                            users: this.state.users.filter((items, i) => i != index),
                            userDetail: this.state.userDetail.filter((items, i) => i != index),
                        });
                    }},
                    ],
                    { cancelable: true }
                );
                return;
                
                
            }}>
                <FastImage
                    style={{flex: 1, borderRadius: 100}}
                    source={this.state.userDetail[index].url ? { uri: this.state.userDetail[index].url } : require('./../../logo/ic_launcher.png')}
                    fallback
                    defaultSource={require('./../../logo/ic_launcher.png')}
                />
            </TouchableOpacity>
        </View>
    )

    async componentDidMount() {
        let locationCheck = await AsyncStorage.getItem('location');
        if(locationCheck === null) {
            await AsyncStorage.setItem('location', 'true');
            locationCheck = 'true';
        }
        let dateCheck = await AsyncStorage.getItem('date');
        if(dateCheck === null) {
            await AsyncStorage.setItem('date', 'true');
            dateCheck = 'true';
        }
        let likeCheck = await AsyncStorage.getItem('like');
        if(likeCheck === null) {
            await AsyncStorage.setItem('like', 'true');
            likeCheck = 'true';
        }
        let localCategory = await AsyncStorage.getItem('category');
        if (localCategory === null) {
            await AsyncStorage.setItem('category', '0');
            localCategory = 0;
        }
        let localViewcode = await AsyncStorage.getItem('viewcode');
        if (localViewcode === null) {
            await AsyncStorage.setItem('viewcode', '0');
            localViewcode = 0;
        }
        let localSecurity = await AsyncStorage.getItem('security');
        if (localSecurity === null) {
            await AsyncStorage.setItem('security', '0');
            localSecurity = 0;
        }

        let storageRef = await storage().ref();

        let temp = [];

        if (this.props.route.params != null) {
            for (let i = 0; i < this.props.route.params.preUser.length; i++) {
                const documentSnapshot = await firestore()
                    .collection("Users")
                    .doc(this.props.route.params.preUser[i])
                    .get();

                if (documentSnapshot.exists) {
                    const data = documentSnapshot.data();
                    let URL = '';
                    try {
                        // var URL = await storageRef.child(`${this.props.route.params.preUser[i]}/profile/profile_144x144.jpeg`).getDownloadURL();
                        URL = `https://storage.googleapis.com/travelog-4e274.appspot.com/${this.props.route.params.preUser[i]}/profile/profile_144x144.jpeg`;
                    } catch (e) {
                        console.log(e);
                    } finally {
                        temp.push({
                            displayName: data.displayName,
                            url: URL,
                        });
                    }
                }
            }
        }

        this.setState({
            category: this.props.route.params?.category || parseInt(localCategory),
            edit: this.props.route.params?.edit != null,
            date: this.props.route.params?.date || new Date(),
            title: this.props.route.params?.title || '',
            subtitle: this.props.route.params?.subtitle || '',
            link: this.props.route.params?.link || '',
            viewcode: this.props.route.params?.viewcode || parseInt(localViewcode),
            security: this.props.route.params?.security || parseInt(localSecurity),
            users: this.props.route.params?.preUser || [],
            userDetail: temp,
            ads: !adsFree,
            locationChecked: locationCheck == 'true' ? true : false,
            dateChecked: dateCheck == 'true' ? true : false,
            likeChecked: likeCheck == 'true' ? true : false,
            littleTitle: '',
            itemId: this.props.route.params?.itemId || '',
            photoNumber: this.props.route.params?.photoNumber || 0,
            preData: this.props.route.params?.preData || [],
        });

        this.props.navigation.setOptions({ title: this.props.route.params?.edit != null ? translate("EditList") : translate("AddList") });
    }


    requestLocationPermission = async (image) => {
        if (Platform.OS === 'ios') {
            this.getOneTimeLocation(image);
        } else {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Access Required',
                        message: 'This App needs to Access your location',
                    },
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    //To Check, If Permission is granted
                    this.getOneTimeLocation(image);
                }
            } catch (err) {
                Alert.alert(err.toString());

                const now = firestore.Timestamp.fromMillis((new Date()).getTime());
                let random = Math.floor(Math.random() * locations.length);
                this.setState({
                    thumbnail: 0,
                    data: this.state.data.concat({
                        date: now,
                        lat: locations[random][0],
                        long: locations[random][1],
                        photo: image.path,
                        title: '0',
                        changed: false,
                    }),
                });
            }
        }
    };

    getOneTimeLocation = (image) => {
        Geolocation.getCurrentPosition(
            //Will give you the current location
            (position) => {
                const now = firestore.Timestamp.fromMillis((new Date()).getTime());
                this.setState({
                    thumbnail: 0,
                    data: this.state.data.concat({
                        date: now,
                        lat: position.coords.latitude,
                        long: position.coords.longitude,
                        photo: image.path,
                        title: '0',
                        changed: false,
                    }),
                });
            },
            (error) => {
                Alert.alert(error.toString());
                
                const now = firestore.Timestamp.fromMillis((new Date()).getTime());
                let random = Math.floor(Math.random() * locations.length);
                this.setState({
                    thumbnail: 0,
                    data: this.state.data.concat({
                        date: now,
                        lat: locations[random][0],
                        long: locations[random][1],
                        photo: image.path,
                        title: '0',
                        changed: false,
                    }),
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 1000
            },
        );
    };
    
    render() {
        return(
            <SafeAreaView style={styles.container}>
                {this.state.loading ? 
                <View style={[styles.buttonContainer, {backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff', width: "100%", height: "100%"}]}>
                    <ActivityIndicator size="large" color={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} />
                    <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("AddListComment1")} </Text>
                    <View style={{alignItems: 'center', justifyContent: 'center', width: "90%"}}>
                        <ProgressBar bgcolor={Appearance.getColorScheme() === 'dark' ? '#01579b' : '#002f6c'} completed={this.state.completed} />
                    </View>
                </View>
                : <ScrollView 
                    contentContainerStyle={styles.viewContainer}
                    style={{flex: 1, width: "100%", backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff',}}
                >
                    <View style={{height: 200, width: "100%", alignItems: 'center', justifyContent: 'center', flexDirection: 'row'}}>
                        <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("Category")} </Text>
                        <Picker
                            selectedValue={this.state.category}
                            style={{width: 200}}
                            onValueChange={(itemValue, itemIndex) =>
                                this.setState({category: itemIndex})
                            }>
                            <Picker.Item label={translate("Travel")} value={0} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("Date")} value={1} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("DailyLife")} value={2} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("Entertainment")} value={3} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("Sports")} value={4} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("News")} value={5} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("Education")} value={6} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("Other")} value={7} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                        </Picker>
                    </View>
                    <View style={{height: 200, width: "100%", alignItems: 'center', justifyContent: 'center', flexDirection: 'row'}}>
                        <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("ViewMode")} </Text>
                        <Picker
                            selectedValue={this.state.viewcode}
                            style={{width: 100}}
                            onValueChange={(itemValue, itemIndex) =>
                                this.setState({viewcode: itemIndex})
                            }>
                            <Picker.Item label={translate("Map")} value={0} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate('Grid')} value={1} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                        </Picker>
                        <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("security")} </Text>
                        <Picker
                            selectedValue={this.state.security}
                            style={{width: 100}}
                            onValueChange={(itemValue, itemIndex) =>
                                this.setState({security: itemIndex})
                            }>
                            <Picker.Item label={translate('public')} value={0} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate('public-link') + translate('beta')} value={1} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate('private') + translate('beta')} value={2} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                        </Picker>
                    </View>

                    <View style={styles.cellView}>
                        <Input
                            onChangeText={(title) => {
                                this.setState({title});
                            }}
                            defaultValue={this.state.title}
                            inputStyle={styles.inputs}
                            maxLength={40}
                            placeholder={translate("Title")}
                            placeholderTextColor="#bdbdbd"
                            leftIcon={
                                <Icon
                                    name='title'
                                    size={24}
                                    color={Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c'}
                                />
                            }
                        />
                    </View>
                    <View style={styles.cellView}>
                        <Input
                            multiline
                            onChangeText={(subtitle) => {
                                this.setState({subtitle});
                            }}
                            defaultValue={this.state.subtitle}
                            inputStyle={styles.inputs}
                            maxLength={140}
                            placeholder={translate("Subtitle")}
                            placeholderTextColor="#bdbdbd"
                            leftIcon={
                                <Icon
                                    name='subtitles'
                                    size={24}
                                    color={Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c'}
                                />
                            }
                        />
                    </View>
                    <View style={styles.cellView}>
                        <Input
                            autoCapitalize='none'
                            onChangeText={(link) => {
                                this.setState({link});
                            }}
                            defaultValue={this.state.link}
                            inputStyle={styles.inputs}
                            placeholder={translate("URLLink")}
                            placeholderTextColor="#bdbdbd"
                            leftIcon={
                                <Icon
                                    name='launch'
                                    size={24}
                                    color={Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c'}
                                />
                            }
                        />
                    </View>
                    <Text
                        onPress={() => this.setState({show: !this.state.show})}
                        style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}
                    > 
                        {this.state.date.toString()} 
                    </Text> 
                    {this.state.show && 
                    <View style={{width: "100%", alignItems: 'center'}}>
                        <DateTimePicker
                            style={{width: "100%"}}
                            mode="date"
                            value={this.state.date}
                            is24Hour={true}
                            display={Platform.OS === 'android' ? "default" : "inline"}
                            onChange={ (event, selectedDate) => {
                                let currentDate = selectedDate || new Date();
                                if (Platform.OS === 'android') {
                                    currentDate.setHours(this.state.date.getHours(), this.state.date.getMinutes(), this.state.date.getSeconds());
                                    this.setState({
                                        show: false,
                                    });
                                }
                                this.setState({
                                    date: currentDate,
                                });
                            }}
                        />
                        <DateTimePicker
                            style={{width: "100%"}}
                            mode="time"
                            value={this.state.date}
                            is24Hour={true}
                            display={Platform.OS === 'android' ? "default" : "inline"}
                            onChange={ (event, selectedDate) => {
                                const currentDate = selectedDate || new Date();
                                if (Platform.OS === 'android') {
                                    this.setState({
                                        show: false,
                                    });
                                }
                                this.setState({
                                    date: currentDate,
                                });
                            }}
                        />
                    </View>}
                    <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000', marginTop: 10, padding: 10}}> 
                        {translate("AddListComment9")} 
                    </Text> 
                    {this.state.data.length > 0 && 
                    <View style={{width: "100%", backgroundColor: 'grey', padding: 5}}>
                        <Text style={{textAlign: 'center', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("AddListComment2")} </Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: 10}}>
                            <TouchableOpacity style={{marginRight:5}} onPress={() => {
                                if (this.state.activeItem != -1 && this.state.activeItem < this.state.data.length) {
                                    ImagePicker.openCropper({
                                        path: this.state.data[this.state.activeItem].photo,
                                    }).then(image => {
                                        console.log(image);
                                        let updateData = this.state.data;
                                        updateData[this.state.activeItem].photo = image.path;
                                        this.setState({
                                            data: updateData,
                                        });
                                    });
                                }
                             }}>
                                <Icon
                                    name='crop'
                                    size={24}
                                    color={this.state.activeItem != -1 ? (Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c') : 'grey'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={{marginRight:5}} onPress={() => {
                                this.setState({
                                    thumbnail: this.state.activeItem != -1 && this.state.activeItem < this.state.data.length ? (this.state.activeItem + this.state.photoNumber) : 0,
                                });
                             }}>
                                <Icon
                                    name='star'
                                    size={24}
                                    color={this.state.activeItem != -1 ? 'yellow' : 'grey'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={{marginRight:10}} onPress={() => { 
                                this.setState({
                                    data: this.state.data.filter((item, i) => i != this.state.activeItem),
                                    activeItem: -1,
                                    littleTitle: '',
                                });

                                if (this.state.activeItem == this.state.thumbnail) {
                                    this.setState({
                                        thumbnail: 0,
                                    });
                                }
                             }}>
                                <Icon
                                    name='delete'
                                    size={24}
                                    color={this.state.activeItem != -1 ? 'red' : 'grey'}
                                />
                            </TouchableOpacity>
                        </View>
                        <Input
                            onChangeText={(title) => {
                                let updateData = this.state.data;
                                updateData[this.state.activeItem].title = title;
                                this.setState({
                                    data: updateData
                                });
                            }}
                            defaultValue={this.state.littleTitle}
                            inputStyle={styles.inputs}
                            placeholder={translate("Title")}
                            placeholderTextColor="#bdbdbd"
                        />
                        <DraggableFlatList
                            horizontal
                            keyExtractor={this.keyExtractor}
                            data={this.state.data}
                            renderItem={this.renderItem}
                            extraData={this.state}
                            onDragEnd={({ data, from, to }) => {
                                this.setState({ 
                                    data: data,
                                });
                                if (from == this.state.thumbnail) {
                                    this.setState({
                                        thumbnail: to,
                                    });
                                    return;
                                }
                                if (from < this.state.thumbnail && to >= this.state.thumbnail) {
                                    this.setState({
                                        thumbnail: this.state.thumbnail - 1,
                                    });
                                } else if (to <= this.state.thumbnail && from > this.state.thumbnail) {
                                    this.setState({
                                        thumbnail: this.state.thumbnail + 1,
                                    });
                                }
                            }}
                        />
                    </View>}
                    <View style={{flexDirection: 'row', flex: 1, justifyContent: 'center', alignItems: 'center',}}>
                        <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {marginTop: 10, marginRight: 5, height:45, width: "40%", borderRadius:5,}]} onPress={async () => { 
                            if (this.state.data.length >= 8 || this.state.data.length + this.state.photoNumber >= 31) {
                                Alert.alert(
                                    translate("Error"),
                                    translate("AddListComment9"),
                                    [
                                    {text: translate("OK"), onPress: () => { }},
                                    ],
                                    { cancelable: true }
                                );
                                return;
                            }

                            ImagePicker.openCamera({
                                width: 1080,
                                height: 1080,
                                cropping: true,
                                forceJpg: true,
                            }).then(async image => {
                                await this.requestLocationPermission(image); // add a location in photo (no exif)
                            }).catch(async (e) => {
                                Alert.alert(translate("CameraError"));
                            });
                        }}>
                            <Text style={styles.loginText}>{translate("OpenCamera")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {marginTop: 10, marginLeft: 5, height:45, width: "40%", borderRadius:5,}]} onPress={async () => { 
                            ImagePicker.openPicker({
                                multiple: true,
                                mediaType: 'photo', //사진
                                includeExif: true,
                                maxFiles: 8,
                                forceJpg: true,
                                // cropping: true,
                                // width: 1080,
                                // height: 1080,
                                compressImageMaxWidth: 1080,
                                // compressImageMaxHeight: 1080,
                            }).then(images => {
                                let factor = Platform.OS == 'ios' ? 1000 : 1;
                                const temp = [];
                                for (let i = 0; i < images.length; i++) {
                                    try {
                                        if (this.state.data.length + temp.length >= 8 || this.state.data.length + temp.length + this.state.photoNumber >= 31) {
                                            Alert.alert(
                                                translate("Error"),
                                                translate("AddListComment9"),
                                                [
                                                {text: translate("OK"), onPress: () => { }},
                                                ],
                                                { cancelable: true }
                                            );
                                            break;
                                        }
                                        console.log(images[i]);
                                        if (Platform.OS === 'ios') {
                                            temp.push({
                                                date: firestore.Timestamp.fromMillis(parseInt(images[i].modificationDate) * factor),
                                                lat: images[i].exif["{GPS}"].LatitudeRef != "S" ? images[i].exif["{GPS}"].Latitude : -images[i].exif["{GPS}"].Latitude,
                                                long: images[i].exif["{GPS}"].LongitudeRef != "W" ? images[i].exif["{GPS}"].Longitude : -images[i].exif["{GPS}"].Longitude,
                                                photo: images[i].path,
                                                title: i.toString(),
                                                changed: false,
                                            });
                                        } else {
                                            let latitudeStrings = images[i].exif["GPSLatitude"].split(',');
                                            let longitudeStrings = images[i].exif["GPSLongitude"].split(',');

                                            let latitudeD = latitudeStrings[0].split('/');
                                            let latitudeM = latitudeStrings[1].split('/');
                                            let latitudeS = latitudeStrings[2].split('/');

                                            let longitudeD = longitudeStrings[0].split('/');
                                            let longitudeM = longitudeStrings[1].split('/');
                                            let longitudeS = longitudeStrings[2].split('/');

                                            let latitude = parseInt(latitudeD[0]) / parseInt(latitudeD[1]) + (parseInt(latitudeM[0]) / parseInt(latitudeM[1]) / 60) + (parseInt(latitudeS[0]) / parseInt(latitudeS[1]) / 3600);
                                            let longitude = parseInt(longitudeD[0]) / parseInt(longitudeD[1]) + (parseInt(longitudeM[0]) / parseInt(longitudeM[1]) / 60) + (parseInt(longitudeS[0]) / parseInt(longitudeS[1]) / 3600);

                                            if (images[i].exif["GPSLatitudeRef"] == "S") { latitude = -latitude; }
                                            if (images[i].exif["GPSLongitudeRef"] == "W") { longitude = -longitude; }

                                            temp.push({
                                                date: firestore.Timestamp.fromMillis(parseInt(images[i].modificationDate) * factor),
                                                lat: latitude,
                                                long: longitude,
                                                photo: images[i].path,
                                                title: i.toString(),
                                                changed: false,
                                            });
                                        }
                                    } catch (e) { // location data가 없는 것으로 추정
                                        console.log(e);
                                        let random = Math.floor(Math.random() * locations.length);

                                        temp.push({
                                            date: firestore.Timestamp.fromMillis(parseInt(images[i].modificationDate) * factor),
                                            lat: locations[random][0],
                                            long: locations[random][1],
                                            photo: images[i].path,
                                            title: i.toString(),
                                            changed: false,
                                        });
                                    } 

                                    this.setState({
                                        thumbnail: 0,
                                        data: this.state.data.concat(temp),
                                    });

                                } 
                            });
                        }}>
                            <Text style={styles.loginText}>{translate("AddPhotos")}</Text>
                        </TouchableOpacity>
                    </View>
                    <CheckBox
                        containerStyle={styles.cell}
                        title={translate("AddListComment3")}
                        iconType='material'
                        checkedIcon='check-box'
                        uncheckedIcon='check-box-outline-blank'
                        checkedColor='#002f6c'
                        checked={this.state.locationChecked}
                        onPress={() => this.setState({locationChecked: !this.state.locationChecked})}
                    />
                    <CheckBox
                        containerStyle={styles.cell}
                        title={translate("AddListComment4")}
                        iconType='material'
                        checkedIcon='check-box'
                        uncheckedIcon='check-box-outline-blank'
                        checkedColor='#002f6c'
                        checked={this.state.dateChecked}
                        onPress={() => this.setState({dateChecked: !this.state.dateChecked})}
                    />
                    <CheckBox
                        containerStyle={styles.cell}
                        title={translate('likeNumber')} // 좋아요/싫어요 개수 표시
                        iconType='material'
                        checkedIcon='check-box'
                        uncheckedIcon='check-box-outline-blank'
                        checkedColor='#002f6c'
                        checked={this.state.likeChecked}
                        onPress={() => this.setState({likeChecked: !this.state.likeChecked})}
                    />
                    <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5,}]} onPress={async () => {
                        // follow 창 열기
                        this.props.navigation.push('Search', {
                            add: true,
                            users: this.state.users,
                            userDetail: this.state.userDetail,
                            updateUser: this.updateUser,
                        });
                    }}>
                        <Text style={styles.loginText}>{translate("allowUser")}</Text>
                    </TouchableOpacity>
                    { this.state.users.length > 0 && <View style={{ flex: 1, width: "100%", height: 30, marginBottom: 5, backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#ffffff' }}>
                        <FlatList
                            horizontal
                            keyExtractor={this.keyExtractor2}
                            data={this.state.users}
                            renderItem={this.renderAvatar}
                        />
                    </View> }
                    <View style={{marginTop: 5, marginBottom: 5}}>
                        <View style={{alignSelf:'center', position:'absolute', borderBottomColor:'gray', borderBottomWidth:1, height:'50%', width:'80%'}}/>
                    </View>
                    <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000', marginBottom: 5, padding: 10}}> 
                        {translate("AddListComment10")} 
                    </Text> 
                    <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5,}]} onPress={async () => {
                        if (this.state.title.length < 1 || this.state.subtitle.length < 1) {
                            Alert.alert(
                                translate("Error"),
                                translate("AddListComment5"),
                                [
                                {text: translate("OK"), onPress: () => console.log('OK Pressed')},
                                ],
                                { cancelable: false }
                            );
                            return;
                        }
                        if (this.state.preData.length + this.state.data.length < 1) {
                            Alert.alert(
                                translate("Error"),
                                translate("AddListComment6"), //하나 이상의 사진을 추가해주세요.
                                [
                                {text: translate("OK"), onPress: () => console.log('OK Pressed')},
                                ],
                                { cancelable: false }
                            );
                            return;
                        }
                        if (!this.state.locationChecked) {
                            let updateData = this.state.data;
                            let random = 0;
                            for (let i = 0; i < updateData.length; i++) {
                                random = Math.floor(Math.random() * locations.length);
                                updateData[i].lat = locations[random][0];
                                updateData[i].long = locations[random][1];
                            }
                            this.setState({
                                data: updateData,
                            });
                        }
                        if (!this.state.dateChecked) {
                            let updateData = this.state.data;
                            for (let i = 0; i < updateData.length; i++) {
                                updateData[i].date = firestore.Timestamp.fromMillis((new Date()).getTime());
                            }
                            this.setState({
                                data: updateData,
                            });
                        }

                        if (this.state.link.length > 0 && this.state.link.substring(0, 4) !== 'http') {
                            this.setState({
                                link: "https://" + this.state.link,
                            });
                        }

                        await AsyncStorage.setItem('location', this.state.locationChecked ? 'true' : 'false');
                        await AsyncStorage.setItem('date', this.state.dateChecked ? 'true' : 'false');
                        await AsyncStorage.setItem('like', this.state.likeChecked ? 'true' : 'false');
                        await AsyncStorage.setItem('category', this.state.category.toString());
                        await AsyncStorage.setItem('viewcode', this.state.viewcode.toString());
                        await AsyncStorage.setItem('security', this.state.security.toString());

                        this.setState({loading: true});
                        let documentSnapshot;

                        let postId = '';
                        if (!this.state.edit) {
                            documentSnapshot = 
                            await firestore()
                                .collection("Posts")
                                .add({
                                    category: this.state.category,
                                    date: firestore.Timestamp.fromMillis(this.state.date.getTime()),
                                    modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                                    link: this.state.link,
                                    title: this.state.title,
                                    subtitle: this.state.subtitle,
                                    likeNumber: this.state.likeChecked,
                                    likeCount: 0,
                                    dislikeCount: 0,
                                    viewCount: 0,
                                    security: this.state.security,
                                    account: this.state.users,
                                    viewcode: this.state.viewcode,
                                    thumbnail: this.state.thumbnail,
                                    uid: auth().currentUser.uid,
                                });
                        } else {
                            documentSnapshot = 
                            await firestore()
                                .collection("Posts")
                                .doc(this.state.itemId)
                                .update({
                                    category: this.state.category,
                                    date: firestore.Timestamp.fromMillis(this.state.date.getTime()),
                                    modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                                    link: this.state.link,
                                    title: this.state.title,
                                    subtitle: this.state.subtitle,
                                    likeNumber: this.state.likeChecked,
                                    likeCount: 0,
                                    dislikeCount: 0,
                                    viewCount: 0,
                                    security: this.state.security,
                                    account: this.state.users,
                                    viewcode: this.state.viewcode,
                                    thumbnail: this.state.thumbnail,
                                    uid: auth().currentUser.uid,
                                });
                        }

                        postId = (this.state.edit ? this.state.itemId : documentSnapshot._documentPath._parts[1]);

                        let updateData = this.state.data;
                        for (let i = 0; i < this.state.data.length; i++) {
                            filename = this.state.data[i].photo.split('/');
                            console.log(this.state.data[i].photo);
                            let storageChildRef = storage().ref(`${auth().currentUser.uid}/${postId}/${filename[filename.length - 1]}`)
                            await storageChildRef.putFile(this.state.data[i].photo);

                            updateData[i].photo = filename[filename.length - 1];
                            this.setState({completed: Math.round((i + 1) * 1000 / this.state.data.length) / 10});
                        }

                        let meRef = firestore().collection("Users").doc(auth().currentUser.uid);
                        let postRef = firestore().collection("Posts").doc(postId);
                        let logRef = meRef.collection("log").doc(postId);
                        await firestore().runTransaction(async t => {
                            const me = await t.get(meRef);
                            const post = await t.get(postRef);
                            const log = await t.get(logRef);
                            const now = firestore.Timestamp.fromMillis((new Date()).getTime());

                            t.update(meRef, {
                                logsLength: firestore.FieldValue.increment(!this.state.edit ? 1 : 0),
                                modifyDate: now,
                            });

                            t.update(postRef, {
                                data: [...this.state.preData, ...updateData]
                            });

                            t.set(logRef, {
                                date: now,
                                security: this.state.security,
                            });
                        })
                        .then(() => {
                            console.log('Transaction success!');
                        
                            if (this.state.ads) {
                                try {
                                    interstitial?.show();
                                } catch (e) {
                                    console.log(e);
                                }
                            }
    
                            this.setState({loading: false});
                            
                            Alert.alert(
                                translate("Success"),
                                translate("AddListComment7"), //성공적으로 업로드됐습니다.
                                [
                                    {text: translate("OK"), onPress: () => console.log('OK Pressed')},
                                ],
                                { cancelable: false }
                            );
                            if (this.props.route.params.onPop) {
                                this.props.route.params.onPop();
                            }
                            this.props.navigation.pop();
                        })
                        .catch((e) => {
                            console.log('Transaction failure:', e);
                            Alert.alert(
                                translate("Error"),
                                e.toString(), // 업로드 에러
                                [
                                    {text: translate("OK"), onPress: () => console.log('OK Pressed')},
                                ],
                                { cancelable: false }
                            );
                        });
                    }}>
                        <Text style={styles.loginText}>{this.state.edit ? translate("EditList") : translate("AddList")}</Text>
                    </TouchableOpacity>
                </ScrollView>}
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Appearance.getColorScheme() === 'dark' ? "#000" : "#fff",
        width: "100%"
    },
    viewContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: Appearance.getColorScheme() === 'dark' ? "#fff" : "#002f6c",
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom:5,
    },
    loginButton: {
        backgroundColor: "#002f6c",
        borderColor: "#002f6c",
        borderWidth: 1,
    },
    loginText: {
        color: 'white',
    },
});