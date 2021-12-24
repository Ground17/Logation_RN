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

import DraggableFlatList from "react-native-draggable-flatlist"; /// important!!!

import ImagePicker from 'react-native-image-crop-picker';
import { Picker } from '@react-native-community/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input, CheckBox, ListItem, Avatar } from 'react-native-elements';

import auth from '@react-native-firebase/auth';
// import { InterstitialAd, TestIds } from '@react-native-firebase/admob';
import { AdMobInterstitial } from 'react-native-admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { adsFree, translate, ProgressBar, adInterstitialUnitId } from '../Utils';

import AsyncStorage from '@react-native-community/async-storage';

// const interstitial = InterstitialAd.createForAdRequest(adInterstitialUnitId);

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

    // renderItem = ({ item, index, drag, isActive }) => (
    //   <ListItem
    //     title={
    //         <TextInput
    //             defaultValue={item.title}
    //             style={{
    //                 fontWeight: 'bold', 
    //                 borderBottomColor: Appearance.getColorScheme() === 'dark' ? "#fff" : '#000',
    //                 flex:1,
    //                 color: Appearance.getColorScheme() === 'dark' ? "#fff" : "#000",
    //             }}
    //             maxLength={40}
    //             onChangeText={(title) => {
    //                 if (title.length < 1) {
    //                     return;
    //                 }
    //                 var updateData = this.state.data;
    //                 updateData[index].title = title;
    //                 this.setState({data: updateData});
    //             }}
    //         />  
    //     }
    //     subtitle={
    //         <TextInput
    //             defaultValue={item.subtitle}
    //             style={{
    //                 borderBottomColor: Appearance.getColorScheme() === 'dark' ? "#fff" : '#000',
    //                 flex:1,
    //                 color: Appearance.getColorScheme() === 'dark' ? "#fff" : "#000",
    //             }}
    //             maxLength={40}
    //             onChangeText = {(subtitle) => {
    //                 if (subtitle.length < 1) {
    //                     return;
    //                 }
    //                 var updateData = this.state.data;
    //                 updateData[index].subtitle = subtitle;
    //                 this.setState({data: updateData});
    //             }}
    //         />  
    //     }
    //     leftAvatar={{ source: { uri: item.photo }, rounded: false}}
    //     containerStyle={{backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#fff'}}
    //     onLongPress={drag}
    //     rightElement={
    //         <TouchableOpacity style={{marginRight:5}} onPress={() => { 
    //             var updateData = this.state.data;
    //             updateData.splice(index, 1);
    //             this.setState({data: updateData}); }}>
    //             <Icon
    //                 name='cancel'
    //                 size={24}
    //                 color='#ff0000'
    //             />
    //         </TouchableOpacity>
    //     }
    //     bottomDivider
    //     onPress={() => {}}
    //   />
    // )

    renderItem = ({ item, index, drag, isActive }) => ( // 추가할 사진 표현
        <View style={{backgroundColor: this.state.thumbnail == index ? 'yellow' : null}}>
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
                    "/// 이 유저를 삭제하시겠습니까?",
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
                />
            </TouchableOpacity>
        </View>
    )

    async componentDidMount() {
        var locationCheck = await AsyncStorage.getItem('location');
        if(locationCheck === null) {
            await AsyncStorage.setItem('location', 'true');
            locationCheck = 'true';
        }
        var dateCheck = await AsyncStorage.getItem('date');
        if(dateCheck === null) {
            await AsyncStorage.setItem('date', 'true');
            dateCheck = 'true';
        }
        var likeCheck = await AsyncStorage.getItem('like');
        if(likeCheck === null) {
            await AsyncStorage.setItem('like', 'true');
            likeCheck = 'true';
        }
        var localCategory = await AsyncStorage.getItem('category');
        if (localCategory === null) {
            await AsyncStorage.setItem('category', '0');
            localCategory = 0;
        }
        var localViewcode = await AsyncStorage.getItem('viewcode');
        if (localViewcode === null) {
            await AsyncStorage.setItem('viewcode', '0');
            localViewcode = 0;
        }
        var localSecurity = await AsyncStorage.getItem('security');
        if (localSecurity === null) {
            await AsyncStorage.setItem('security', '0');
            localSecurity = 0;
        }

        var storageRef = await storage().ref();

        var temp = [];

        if (this.props.route.params.preUser) {
            for (var i = 0; i < this.props.route.params.preUser.length; i++) {
                const documentSnapshot = await firestore()
                    .collection("Users")
                    .doc(this.props.route.params.preUser[i])
                    .get();

                if (documentSnapshot.exists) {
                    const data = documentSnapshot.data();
                    try {
                        var URL = await storageRef.child(`${this.props.route.params.preUser[i]}/profile/profile_144x144.jpeg`).getDownloadURL();
                    } catch (e) {
                        var URL = '';
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
            category: this.props.route.params.category || parseInt(localCategory),
            edit: this.props.route.params.edit != null,
            date: this.props.route.params.date || '',
            title: this.props.route.params.title || '',
            subtitle: this.props.route.params.subtitle || '',
            link: this.props.route.params.link || '',
            viewcode: this.props.route.params.viewcode || parseInt(localViewcode),
            security: this.props.route.params.security || parseInt(localSecurity),
            users: this.props.route.params.preUser || [],
            userDetail: temp,
            ads: !adsFree,
            locationChecked: locationCheck == 'true' ? true : false,
            dateChecked: dateCheck == 'true' ? true : false,
            likeChecked: likeCheck == 'true' ? true : false,
            littleTitle: '',
            photoNumber: this.props.route.params.photoNumber || 0,
            preData: this.props.route.params.data || [],
        });

        this.props.navigation.setOptions({ title: this.state.edit ? translate("EditList") : translate("AddList") });
        // if (this.state.ads && !interstitial.loaded) {
        //     interstitial.load();
        // }

        AdMobInterstitial.setTestDevices([AdMobInterstitial.simulatorId]);
        AdMobInterstitial.setAdUnitID(adInterstitialUnitId);
        if (this.state.ads) {
            AdMobInterstitial.requestAd().catch(error => console.warn(error));
        }
    }
    
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
                    <View style={{height: 200, width: "100%", alignItems: 'center', justifyContent: 'center', flexDirection: 'row'}}>
                        <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("Category")} </Text>
                        <Picker
                            selectedValue={this.state.category}
                            style={{width: 200}}
                            onValueChange={(itemValue, itemIndex) =>
                                this.setState({category: itemIndex})
                            }>
                            <Picker.Item label={translate("Travel")} value={0} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("DailyLife")} value={1} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("Entertainment")} value={2} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("Sports")} value={3} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("News")} value={4} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("Education")} value={5} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={translate("Other")} value={6} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
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
                            <Picker.Item label={"///translate('Grid')///"} value={1} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                        </Picker>
                        <Text style={{color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {"///공개 범위///"} </Text>
                        <Picker
                            selectedValue={this.state.security}
                            style={{width: 100}}
                            onValueChange={(itemValue, itemIndex) =>
                                this.setState({security: itemIndex})
                            }>
                            <Picker.Item label={"///공개"} value={0} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={"///일부 공개"} value={1} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                            <Picker.Item label={"///비공개"} value={2} color={Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'} />
                        </Picker>
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
                                var currentDate = selectedDate || new Date();
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
                    {this.state.data.length > 0 && 
                    <View style={{width: "100%", backgroundColor: 'gray'}}>
                        <Text style={{textAlign: 'center', color: Appearance.getColorScheme() === 'dark' ? '#fff' : '#000'}}> {translate("AddListComment2")} </Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: 10}}>
                            <TouchableOpacity style={{marginRight:5}} onPress={() => {
                                if (this.state.activeItem != -1 && this.state.activeItem < this.state.data.length) {
                                    ImagePicker.openCropper({
                                        path: this.state.data[this.state.activeItem].photo,
                                    }).then(image => {
                                        console.log(image);
                                        var updateData = this.state.data;
                                        updateData[this.state.activeItem].photo = image.path;
                                        this.setState({
                                            data: updateData,
                                        });
                                    });
                                }
                             }}>
                                <Icon
                                    name='edit'
                                    size={24}
                                    color={ Appearance.getColorScheme() === 'dark' ? '#ffffff' : '#002f6c' }
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={{marginRight:5}} onPress={() => {
                                this.setState({
                                    thumbnail: this.state.activeItem != -1 && this.state.activeItem < this.state.data.length ? this.state.activeItem : 0,
                                });
                             }}>
                                <Icon
                                    name='star'
                                    size={24}
                                    color='yellow'
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
                                    color='red'
                                />
                            </TouchableOpacity>
                        </View>
                        <Input
                            onChangeText={(title) => {
                                var updateData = this.state.data;
                                updateData[this.state.activeItem].title = title;
                                this.setState({
                                    data: updateData
                                });
                            }}
                            defaultValue={this.state.littleTitle}
                            inputStyle={styles.inputs}
                            placeholder={"///title///"}
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
                    <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {marginTop: 10, height:45, width: "80%", borderRadius:5,}]} onPress={() => { 
                        ImagePicker.openPicker({
                            multiple: true,
                            mediaType: 'photo', //사진
                            includeExif: true,
                            maxFiles: 20,
                        }).then(images => {
                            var factor = Platform.OS == 'ios' ? 1000 : 1;
                            const temp = [];
                            for (var i = 0; i<images.length; i++) {
                                try {
                                    if (i + this.state.data.length + this.state.photoNumber > 19) {
                                        continue;
                                    }
                                    console.log(images[i]);
                                    if (Platform.OS == 'ios') {
                                        temp.push({
                                            date: firestore.Timestamp.fromMillis(parseInt(images[i].modificationDate) * factor),
                                            lat: images[i].exif["{GPS}"].LatitudeRef != "S" ? images[i].exif["{GPS}"].Latitude : -images[i].exif["{GPS}"].Latitude,
                                            long: images[i].exif["{GPS}"].LongitudeRef != "W" ? images[i].exif["{GPS}"].Longitude : -images[i].exif["{GPS}"].Longitude,
                                            photo: images[i].path,
                                            title: i.toString(),
                                            changed: false,
                                        });
                                    } else {
                                        var latitudeStrings = images[i].exif["GPSLatitude"].split(',');
                                        var longitudeStrings = images[i].exif["GPSLongitude"].split(',');

                                        var latitudeD = latitudeStrings[0].split('/');
                                        var latitudeM = latitudeStrings[1].split('/');
                                        var latitudeS = latitudeStrings[2].split('/');

                                        var longitudeD = longitudeStrings[0].split('/');
                                        var longitudeM = longitudeStrings[1].split('/');
                                        var longitudeS = longitudeStrings[2].split('/');

                                        var latitude = parseInt(latitudeD[0]) / parseInt(latitudeD[1]) + (parseInt(latitudeM[0]) / parseInt(latitudeM[1]) / 60) + (parseInt(latitudeS[0]) / parseInt(latitudeS[1]) / 3600);
                                        var longitude = parseInt(longitudeD[0]) / parseInt(longitudeD[1]) + (parseInt(longitudeM[0]) / parseInt(longitudeM[1]) / 60) + (parseInt(longitudeS[0]) / parseInt(longitudeS[1]) / 3600);

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
                                    var random = Math.floor(Math.random() * locations.length);

                                    temp.push({
                                        date: firestore.Timestamp.fromMillis(parseInt(images[i].modificationDate) * factor),
                                        lat: locations[random][0],
                                        long: locations[random][1],
                                        photo: images[i].path,
                                        title: i.toString(),
                                        changed: false,
                                    });
                                } 
                            } 
                            this.setState({
                                thumbnail: 0,
                                data: this.state.data.concat(temp),
                            });
                        });
                    }}>
                        <Text style={styles.loginText}>{translate("AddPhotos")}</Text>
                    </TouchableOpacity>
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
                        title={"/// 좋아요 숨기기"} /// edit
                        iconType='material'
                        checkedIcon='check-box'
                        uncheckedIcon='check-box-outline-blank'
                        checkedColor='#002f6c'
                        checked={this.state.likeChecked}
                        onPress={() => this.setState({likeChecked: !this.state.likeChecked})}
                    />
                    <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5,}]} onPress={async () => {
                        /// follow 창 열기
                        this.props.navigation.push('Search', {
                            add: true,
                            users: this.state.users,
                            userDetail: this.state.userDetail,
                            updateUser: this.updateUser,
                        });
                    }}>
                        <Text style={styles.loginText}>{"/// 비공개일 때 접근 허용 유저 (최대 10명) ///"}</Text>
                    </TouchableOpacity>
                    { this.state.users.length > 0 && <View style={{ flex: 1, width: "100%", height: 30, marginBottom: 5, backgroundColor: Appearance.getColorScheme() === 'dark' ? '#121212' : '#ffffff' }}>
                        <FlatList
                            horizontal
                            keyExtractor={this.keyExtractor2}
                            data={this.state.users}
                            renderItem={this.renderAvatar}
                        />
                    </View> }
                    <View style={{marginTop: 5, marginBottom: 10}}>
                        <View style={{alignSelf:'center', position:'absolute', borderBottomColor:'gray', borderBottomWidth:1, height:'50%', width:'80%'}}/>
                    </View>
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
                            var updateData = this.state.data;
                            var random = 0;
                            for (var i = 0; i < updateData.length; i++) {
                                random = Math.floor(Math.random() * locations.length);
                                updateData[i].lat = locations[random][0];
                                updateData[i].long = locations[random][1];
                            }
                            this.setState({
                                data: updateData,
                            });
                        }
                        if (!this.state.dateChecked) {
                            var updateData = this.state.data;
                            for (var i = 0; i < updateData.length; i++) {
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

                        this.setState({loading: true})
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
                        })
                        .then(async (documentSnapshot) => {
                            await firestore()
                            .collection("Users")
                            .doc(auth().currentUser.uid)
                            .update({
                                logsLength: firestore.FieldValue.increment(1),
                                modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                            });
                            // var filename = this.state.thumbnail.split('/');

                            // var storageRef = storage().ref(`${auth().currentUser.uid}/${documentSnapshot._documentPath._parts[1]}/${filename[filename.length - 1]}`);
                            // await storageRef.putFile(this.state.thumbnail);

                            // this.setState({thumbnail: filename[filename.length - 1]})

                            var updateData = this.state.data;
                            for (var i=0; i < this.state.data.length; i++) {
                                filename = this.state.data[i].photo.split('/');
                                storageChildRef = storage().ref(`${auth().currentUser.uid}/${documentSnapshot._documentPath._parts[1]}/${filename[filename.length - 1]}`)
                                await storageChildRef.putFile(this.state.data[i].photo);

                                updateData[i].photo = filename[filename.length - 1];
                                this.setState({completed: Math.round((i + 1) * 1000 / this.state.data.length) / 10});
                            }
                            // this.setState({data: updateData});

                            await firestore()
                                .collection("Posts")
                                .doc(documentSnapshot._documentPath._parts[1])
                                .update({
                                    data: [...this.state.preData, ...updateData]
                                })
                            await firestore()
                                .collection("Users")
                                .doc(auth().currentUser.uid)
                                .collection("log")
                                .doc(documentSnapshot._documentPath._parts[1])
                                .set({
                                    date: firestore.Timestamp.fromMillis(this.state.date.getTime()),
                                    security: this.state.security,
                                });
                            Alert.alert(
                                translate("Success"),
                                translate("AddListComment7"), //성공적으로 업로드됐습니다.
                                [
                                {text: translate("OK"), onPress: () => console.log('OK Pressed')},
                                ],
                                { cancelable: false }
                            );
                            // if (this.state.ads && interstitial.loaded) {
                            //     interstitial.show();
                            // }
                            if (this.state.ads) {
                                AdMobInterstitial.showAd().catch(error => console.warn(error));
                            }
                            this.setState({loading: false});
                            // this.props.route.params.onPop();
                            this.props.navigation.pop();
                        });
                    }}>
                        <Text style={styles.loginText}>{translate("AddList")}</Text>
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