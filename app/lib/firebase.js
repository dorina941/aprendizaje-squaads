
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Initialize Firebase

const analytics = getAnalytics(app);

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  
 
  storageBucket: "squaads-pruebas.firebasestorage.app",
  messagingSenderId: "904597686954",
  appId: "1:904597686954:web:8a5ca1a0056f66ca7b1ed3",
  measurementId: "G-CD2517JXRH"




};

const app = initializeApp(firebaseConfig);

export default app;
