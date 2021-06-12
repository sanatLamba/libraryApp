import firebase from 'firebase';
require('@firebase/firestore');

var firebaseConfig = {
    apiKey: "AIzaSyB0jLLGf32noSXy0ov-dUnMCz_voWxdTYk",
    authDomain: "wily-c71-2ca26.firebaseapp.com",
    projectId: "wily-c71-2ca26",
    storageBucket: "wily-c71-2ca26.appspot.com",
    messagingSenderId: "307171526366",
    appId: "1:307171526366:web:9fda2e4c96b69c78d7644f"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

export default firebase.firestore();