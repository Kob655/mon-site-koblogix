
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// REMPLACEZ CES VALEURS PAR CELLES DE VOTRE CONSOLE FIREBASE
const firebaseConfig = {
  apiKey: " AIzaSyCVKVZZCw87xrLyWkF1uJaqzJ1v_ZPCDf4 ",
  authDomain: "koblogix.firebaseapp.com ",
  projectId: "koblogix ",
  storageBucket: "koblogix.firebasestorage.app ",
  messagingSenderId: "1059133656016 ",
  appId: "1:1059133656016:web:684a56716bd086e6cc47d5"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Export de la base de données Firestore
export const db = getFirestore(app);

