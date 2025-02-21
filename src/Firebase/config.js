// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBYahUo9iBNRSxgEv6_SgK6svT-w2rfJk",
  authDomain: "fir-dd32d.firebaseapp.com",
  projectId: "fir-dd32d",
  storageBucket: "fir-dd32d.firebasestorage.app",
  messagingSenderId: "705822768402",
  appId: "1:705822768402:web:689e7d9d1c23edeaf607cb",
  measurementId: "G-RCD993QNPS"
};


const FirebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(FirebaseApp);
