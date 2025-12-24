import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Vos vraies clés Firebase (à récupérer sur console.firebase.google.com)
const firebaseConfig = {
  apiKey: " AIzaSyCVKVZZCw87xrLyWkF1uJaqzJ1v_ZPCDf4",
  authDomain: "koblogix.firebaseapp.com",
  projectId: "koblogix",
  storageBucket: "koblogix.firebasestorage.app",
  messagingSenderId: "1059133656016",
  appId: "1:1059133656016:web:684a56716bd086e6cc47d5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);