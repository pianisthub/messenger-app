import firebase from 'firebase';

const firebaseApp = firebase.initializeApp({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: "G-4VW3RS8WVW"
});

const db = firebaseApp.firestore();

export default db;
