import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import { Ionicons } from '@expo/vector-icons';
import firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component{
    constructor(){
        super();
        this.state = {
            hasCameraPermissions: null,
            scanned: false,
            //scannedData: "",
            scannedBookId: "",
            scannedStudentId: "",
            buttonClick: "normal",
            transactionMessage:"",
            
        }
    }

    getCameraPermissions=async(Id)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            hasCameraPermissions: status==="granted",
            buttonClick: Id,
            scanned: false,
        })
    }

    handleBarCodeScanned=async({type,data})=>{
        const {buttonClick} = this.state
        if(buttonClick=== "bookId"){
            this.setState({
                scanned: true,
                scannedBookId: data,
                buttonClick: "normal",
            })
        }
        else if(buttonClick=== "studentId"){
            this.setState({
                scanned: true,
                scannedStudentId: data,
                buttonClick: "normal",
            })
        }
    }

    initiateBookIssue = async()=>{
        db.collection("transaction").add({
            'studentId': this.state.scannedStudentId,
            'bookId' : this.state.scannedBookId,
            "data" : firebase.firestore.Timestamp.now().toDate(),
            'transactionType' : "issue"
        })
        db.collection("books").doc(this.state.scannedBookId).update({
            'availability' : false
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberBooksIssued' : firebase.firestore.FieldValue.increment(1)
        })
        this.setState({
            scannedBookId : "",
            scannedStudentId : ""
        })
    }
    
    initiateBookReturn = async()=>{
        db.collection("transaction").add({
            'studentId': this.state.scannedStudentId,
            'bookId' : this.state.scannedBookId,
            "data" : firebase.firestore.Timestamp.now().toDate(),
            'transactionType' : "return"
        })
        db.collection("books").doc(this.state.scannedBookId).update({
            'availability' : true
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberBooksIssued' : firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({
            scannedBookId : "",
            scannedStudentId : ""
        })
    }

    checkEligibility=async()=>{
        const bookRef = await db.collection("books").where("bookId", "==", this.state.scannedStudentId).get()
        var transactionType = "";
        if(bookRef.docs.length === 0){
            transactionType = false    
        }
        else{
            bookRef.docs.map((doc)=>{
                var bookData = doc.data();
                if(bookData.availability){
                    transactionType = "issue";
                }
                else{
                    transactionType = "return";
                }
            })
        }
        return transactionType;
    }

    checkStudentEligibilityForIssue=async()=>{
        var studentRef = await db.collection("students").where("studentId","==",this.state.scannedStudentId).get();
        var isStudentEligible = "";
        if(studentRef.docs.length === 0){
            Alert.alert("The StudentId Does Not Exist In Our Database");
            this.setState({
                scannedStudentId: "",
                scannedBookId: ""
            })
            isStudentEligible = false
        }
        else{
            studentRef.docs.map((doc)=>{
                var student = doc.data()
                if(student.numberBooksIssued < 2){
                    isStudentEligible = true
                }
                else{
                    isStudentEligible = false
                    Alert.alert("The Student Has Already Issued 2 Books");
                    this.setState({
                        scannedStudentId: "",
                        scannedBookId: ""
                    })
                }
            })
        }
        return isStudentEligible;
    }
    
    checkStudentEligibilityForReturn=async()=>{
        var transactionRef = await db.collection("transaction").where("bookId","==",this.state.scannedBookId).limit(1).get();
        var isStudentEligible = "";
        if(transactionRef.docs.length === 0){
            Alert.alert("The StudentId Does Not Exist In Our Database");
            this.setState({
                scannedStudentId: "",
                scannedBookId: ""
            })
            isStudentEligible = false
        }
        else{
            transactionRef.docs.map((doc)=>{
                var lastBookTransaction = doc.data();
                if(lastBookTransaction.studentId === this.state.scannedStudentId){
                    isStudentEligible = true
                }
                else{
                    isStudentEligible = false
                    Alert.alert("The Book Was Not Issued By The Student");
                    this.setState({
                        scannedStudentId: "",
                        scannedBookId: ""
                    })
                }
            })
        }
        return isStudentEligible;
    }

    handleTransaction=async()=>{
        var transactionType = await this.checkEligibility();
        if(!transactionType){
            Alert.alert("The Book does not exist in our Database");
            this.setState({
                scannedBookId:"",
                scannedStudentId:""
            })
        }
        else if(transactionType==="issue"){
            var isStudentEligible = await this.checkStudentEligibilityForIssue();
            if(isStudentEligible){
                this.initiateBookIssue();
                Alert.alert("Book Issued To The Student");
            }
        }
        else if(transactionType==="return"){
            var isStudentEligible = await this.checkStudentEligibilityForReturn();
            if(isStudentEligible){
                this.initiateBookReturn();
                Alert.alert("Book Returned By The Student");
            }
        }
    }

    render(){
        const hasCameraPermissions = this.state.hasCameraPermissions;
        const scanned = this.state.scanned;
        const buttonClick = this.state.buttonClick;
       
        if(buttonClick!=="normal" && hasCameraPermissions){
            return(
                <BarCodeScanner 
                    onBarCodeScanned = {scanned? undefined:this.handleBarCodeScanned}
                    style = {StyleSheet.absoluteFillObject}
                />
            );
        }
        else if(buttonClick==="normal"){
            return(
                <KeyboardAvoidingView behavior = "height" enabled                
                style = {styles.container}>
                     <View>
                        <Ionicons name="book" size={60} color="black" />
                     </View>
                    <View style = {styles.container1}>
                        <TextInput 
                         value = {this.state.scannedBookId}
                         onChangeText = {(text)=>{
                            this.setState({
                                scannedBookId : text
                            })
                         }}
                         placeholder = "Book Id"
                         style = {styles.inputField}
                        />
                    <TouchableOpacity style = {styles.buttonBg}
                    onPress = {()=>{
                        this.getCameraPermissions("bookId")
                    }}
                    >
                    <Text style = {styles.textColor}>
                        scan
                    </Text>
                    </TouchableOpacity>
                    </View>

                    <View style = {styles.container1}>
                    <TextInput 
                         value = {this.state.scannedStudentId}
                         placeholder = "Student Id"
                         style = {styles.inputField}
                         onChangeText = {(text)=>{
                            this.setState({
                                scannedStudentId : text
                            })
                         }}
                        />
                    <TouchableOpacity style = {styles.buttonBg} 
                    onPress = {()=>{
                        this.getCameraPermissions("studentId")
                    }}>
                    <Text style = {styles.textColor}>
                        scan
                    </Text>
                    </TouchableOpacity>
                    </View>
                    
                    <View>
                        <TouchableOpacity style = {styles.buttonBg} onPress ={
                            async()=>{
                              var transactionMessage = await this.handleTransaction();
                            }
                        }>
                            <Text style = {styles.textColor}>
                                submit
                            </Text>
                        </TouchableOpacity>
                    </View>
                
                </KeyboardAvoidingView>
                
                
            );
        }
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonBg: {
        backgroundColor:"black",
        alignItems:"center",
        textAlign:"center",
        justifyContent:"center",
        padding:15,
        width:80,
        height:55,
        marginTop:20
    },
    textColor: {
        color:"white"
    },
    container1:{
        flexDirection: "row",
        margin: 20,
    },
    inputField:{
        width: 200,
        height: 55,
        padding: 15,
        borderWidth: 2,
        fontSize: 20,
        borderColor: "black",
        margin: 20,

    }
  });