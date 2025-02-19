// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBohlRZge6RBys1BhSlH1zGLLRa6tjCjIU",
  authDomain: "medical-504a6.firebaseapp.com",
  projectId: "medical-504a6",
  storageBucket: "medical-504a6.firebasestorage.app",
  messagingSenderId: "625514501361",
  appId: "1:625514501361:web:5844769cad2e22dd0a0550",
  measurementId: "G-M1V48N38KM"
};


const FirebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(FirebaseApp);
