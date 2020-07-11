// 사진을 담는 List 목록 (AddList > AddItem)
import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import DraggableFlatList from "react-native-draggable-flatlist"; /// important!!!

import ImagePicker from 'react-native-image-crop-picker';
import { Picker } from '@react-native-community/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input, CheckBox, ListItem } from 'react-native-elements';

import auth from '@react-native-firebase/auth';
import { InterstitialAd, TestIds } from '@react-native-firebase/admob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

import { translate } from '../Utils';

const adBannerUnitId = __DEV__ ? TestIds.BANNER : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3050510769' 
    : 'ca-app-pub-1477690609272793/8274029234');

const adInterstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : 
    (Platform.OS == 'ios' 
    ? 'ca-app-pub-1477690609272793/3775880012' 
    : 'ca-app-pub-1477690609272793/9626786110');

const interstitial = InterstitialAd.createForAdRequest(adInterstitialUnitId);

export default class EditList extends Component {
    state = {
        category: 'Travel',
        viewmode: 'Map',
        locationChecked: true,
        dateChecked: true,
        date: new Date(),
        show: false,
        data: [], // 추가 업로드할 사진 등 데이터
        link: '',
        title: '',
        subtitle: '',
        thumbnail: '',
        loading: false,
        preData: [], // 기존 데이터
        // totalData: [], // 최종 수정 데이터
    };

    keyExtractor = (item, index) => index.toString()

    renderItem = ({ item, index, drag, isActive }) => (
      <ListItem
        title={item.title}
        titleStyle={{ fontWeight: 'bold' }}
        subtitle={item.subtitle}
        leftAvatar={{ source: { uri: item.photo }, rounded: false}}
        onLongPress={drag}
        bottomDivider
        onPress={() => { 
            var updateData = this.state.data;
            updateData.splice(index, 1);
            this.setState({data: updateData})
        }}
      />
    )

    async componentDidMount() {
        this.props.navigation.setOptions({ title: translate("EditList") });
        if (!interstitial.loaded) {
            interstitial.load();
        }
        this.setState({
            category: this.props.route.params.category,
            date: this.props.route.params.date,
            title: this.props.route.params.title,
            subtitle: this.props.route.params.subtitle,
            link: this.props.route.params.link,
            viewmode: this.props.route.params.viewcode == 0 ? 'Map' : (this.props.route.params.viewcode == 1 ? 'List' : 'Grid'),
        });

        var storageRef = storage().ref();
      
        firestore()
            .collection(auth().currentUser.email)
            .doc(this.props.route.params.itemId)
            .get()
            .then(async (documentSnapshot) => {
            if (documentSnapshot.exists) {
                console.log('data: ', documentSnapshot.data());
                data = documentSnapshot.data();
                for (var i=0; i < data.data.length; i++) {
                    try {
                        this.setState({
                            preData: this.state.preData.concat({ 
                                date: data.data[i].date,
                                title: data.data[i].title,
                                subtitle: data.data[i].subtitle,
                                photo: data.data[i].photo,
                                lat: data.data[i].lat,
                                long: data.data[i].long,
                            }),
                        });
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        });
    }
    
    render() {
        return(
            <SafeAreaView style={styles.container}>
                {this.state.loading ? 
                <View style={styles.buttonContainer}>
                    <ActivityIndicator size="large" color="#002f6c" />
                    <Text> {translate("AddListComment1")} </Text>
                </View>
                : <ScrollView 
                    contentContainerStyle={styles.viewContainer}
                    style={{flex: 1, width: "100%"}}
                >
                    <View style={{height: 200, width: 100, alignItems: 'center', justifyContent: 'center', flexDirection: 'row'}}>
                        <Text> {translate("Category")} </Text>
                        <Picker
                            selectedValue={this.state.category}
                            style={{width: 130}}
                            onValueChange={(itemValue, itemIndex) =>
                                this.setState({category: itemValue})
                            }>
                            <Picker.Item label={translate("Travel")} value="Travel" />
                            <Picker.Item label={translate("DailyLife")} value="Daily Life" />
                            <Picker.Item label={translate("Entertainment")} value="Entertainment" />
                            <Picker.Item label={translate("Sports")} value="Sports" />
                            <Picker.Item label={translate("News")} value="News" />
                            <Picker.Item label={translate("Education")} value="Education" />
                            <Picker.Item label={translate("Other")} value="Other" />
                        </Picker>
                        <Text> {translate("ViewMode")} </Text>
                        <Picker
                            selectedValue={this.state.viewmode}
                            style={{width: 90}}
                            onValueChange={(itemValue, itemIndex) =>
                                this.setState({viewmode: itemValue})
                            }>
                            <Picker.Item label={translate("Map")} value="Map" />
                            <Picker.Item label={translate("List")} value="List" />
                            <Picker.Item label={translate("Grid")} value="Grid" />
                        </Picker>
                    </View>
                    <Text
                        onPress={() => this.setState({show: !this.state.show})}
                    > 
                        {this.state.date.toString()} 
                    </Text>
                    {this.state.show && <DateTimePicker
                        style={{width:'110%'}}
                        mode="date"
                        value={this.state.date}
                        is24Hour={true}
                        display="default"
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
                    />}
                    {this.state.show && <DateTimePicker
                        style={{width:'110%'}}
                        mode="time"
                        value={this.state.date}
                        is24Hour={true}
                        display="default"
                        onChange={ (event, selectedDate) => {
                            const currentDate = selectedDate || new Date();
                            if (Platform.OS === 'android') {
                                console.log("changed");
                                this.setState({
                                    show: false,
                                });
                            }
                            this.setState({
                                date: currentDate,
                            });
                        }}
                    /> }
                    <View style={styles.cellView}>
                        <Input
                            onChangeText = {(title) => this.setState({title})}
                            value = {this.state.title}
                            inputStyle={styles.inputs}
                            maxLength={40}
                            placeholder={translate("Title")}
                            placeholderTextColor="#bdbdbd"
                            leftIcon={
                                <Icon
                                    name='title'
                                    size={24}
                                    color='#002f6c'
                                />
                            }
                        />
                    </View>
                    <View style={styles.cellView}>
                        <Input
                            multiline
                            onChangeText = {(subtitle) => this.setState({subtitle})}
                            value = {this.state.subtitle}
                            inputStyle={styles.inputs}
                            maxLength={140}
                            placeholder={translate("Subtitle")}
                            placeholderTextColor="#bdbdbd"
                            leftIcon={
                                <Icon
                                    name='subtitles'
                                    size={24}
                                    color='#002f6c'
                                />
                            }
                        />
                    </View>
                    <View style={styles.cellView}>
                        <Input
                            autoCapitalize='none'
                            onChangeText = {(link) => this.setState({link})}
                            value = {this.state.link}
                            inputStyle={styles.inputs}
                            placeholder={translate("URLLink")}
                            placeholderTextColor="#bdbdbd"
                            leftIcon={
                                <Icon
                                    name='launch'
                                    size={24}
                                    color='#002f6c'
                                />
                            }
                        />
                    </View>
                    <Text style={{textAlign: 'center'}}> {translate("AddListComment2")} </Text>
                    <View style={{ flex: 1, width: "84%" }}>
                        <DraggableFlatList
                            keyExtractor={this.keyExtractor}
                            data={this.state.data}
                            renderItem={this.renderItem}
                            onDragEnd={({ data }) => this.setState({ 
                                data: data,
                            })}
                        />
                    </View>
                    <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5,}]} onPress={() => { 
                        ImagePicker.openPicker({
                            multiple: true,
                            mediaType: 'photo',
                            includeExif: true,
                            maxFiles: 20,
                        }).then(images => {
                            for (var i=0; i<images.length; i++) {
                                var factor = Platform.OS == 'ios' ? 1000 : 1;
                                try {
                                    if (this.state.data.length + this.props.route.params.photoNumber > 19) {
                                        continue;
                                    }
                                    console.log(images[i]);
                                    if (Platform.OS == 'ios') {
                                        this.setState({
                                            data: this.state.data.concat({ 
                                                date: firestore.Timestamp.fromMillis(parseInt(images[i].modificationDate) * factor),
                                                lat: images[i].exif["{GPS}"].LatitudeRef != "S" ? images[i].exif["{GPS}"].Latitude : -images[i].exif["{GPS}"].Latitude,
                                                long: images[i].exif["{GPS}"].LongitudeRef != "W" ? images[i].exif["{GPS}"].Longitude : -images[i].exif["{GPS}"].Longitude,
                                                photo: images[i].path,
                                                title: i.toString(),
                                                subtitle: i.toString(),
                                            }),
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

                                        this.setState({
                                            data: this.state.data.concat({ 
                                                date: firestore.Timestamp.fromMillis(parseInt(images[i].modificationDate) * factor),
                                                lat: latitude,
                                                long: longitude,
                                                photo: images[i].path,
                                                title: i.toString(),
                                                subtitle: i.toString(),
                                            }),
                                        });
                                    }
                                } catch (e) { // location data가 없는 것으로 추정
                                    console.log(e);
                                    this.setState({
                                        data: this.state.data.concat({ 
                                            date: firestore.Timestamp.fromMillis(parseInt(images[i].modificationDate) * factor),
                                            lat: 37,
                                            long: 127,
                                            photo: images[i].path,
                                            title: (i + this.props.route.params.photoNumber).toString(),
                                            subtitle: (i + this.props.route.params.photoNumber).toString(),
                                        }),
                                    });
                                } finally {
                                    if (i == 0) {
                                        this.setState({thumbnail: images[i].path});
                                    }
                                }
                            } 
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
                        title={translate("AddListComment4")} //사진의 날짜정보 포함
                        iconType='material'
                        checkedIcon='check-box'
                        uncheckedIcon='check-box-outline-blank'
                        checkedColor='#002f6c'
                        checked={this.state.dateChecked}
                        onPress={() => this.setState({dateChecked: !this.state.dateChecked})}
                    />
                    <TouchableOpacity style={[styles.buttonContainer, styles.loginButton, {height:45, width: "80%", borderRadius:5,}]} onPress={() => {
                        if (this.state.title.length < 1 || this.state.title.subtitle < 1 || this.state.title.link < 1) {
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
                        if (!this.state.locationChecked) {
                            var updateData = this.state.data;
                            for (var i = 0; i < updateData.length; i++) {
                                updateData[i].lat = 37;
                                updateData[i].long = 127;
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
                        this.setState({loading: true})
                        firestore()
                        .collection(auth().currentUser.email)
                        .doc(this.props.route.params.itemId)
                        .update({
                            category: this.state.category,
                            date: firestore.Timestamp.fromMillis(this.state.date.getTime()),
                            modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                            link: this.state.link,
                            title: this.state.title,
                            subtitle: this.state.subtitle,
                            viewcode: this.state.viewmode == 'Map' ? 0 : (this.state.viewmode == 'List' ? 1 : 2),
                        })
                        .then(async () => {
                            await firestore()
                            .collection("Users")
                            .doc(auth().currentUser.email)
                            .update({
                                modifyDate: firestore.Timestamp.fromMillis((new Date()).getTime()),
                            });
                            var updateData = this.state.data;
                            for (var i=0; i < this.state.data.length; i++) {
                                var filename = this.state.data[i].photo.split('/');
                                storageChildRef = storage().ref(`${auth().currentUser.email}/${this.props.route.params.itemId}/${filename[filename.length - 1]}`)
                                await storageChildRef.putFile(this.state.data[i].photo);

                                updateData[i].photo = filename[filename.length - 1];
                            }
                            this.setState({data: updateData});

                            await firestore()
                                .collection(auth().currentUser.email)
                                .doc(this.props.route.params.itemId)
                                .update({
                                    data: [...this.state.preData, ...this.state.data] /// this.state.preData+ this.state.data
                                });
                            Alert.alert(
                                translate("Success"),
                                translate("AddListComment7"), //성공적으로 업로드됐습니다.
                                [
                                {text: translate('OK'), onPress: () => {
                                    if (interstitial.loaded) {
                                        interstitial.show();
                                    }
                                    this.props.route.params.onPop();
                                    this.setState({loading: false});
                                    this.props.navigation.pop();
                                }},
                                ],
                                { cancelable: false }
                            );
                        });
                    }}>
                        <Text style={styles.loginText}>{translate("EditList")}</Text>
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
        backgroundColor: "#fff",
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