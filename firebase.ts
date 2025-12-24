
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// REMPLACEZ CES VALEURS PAR CELLES DE VOTRE CONSOLE FIREBASE
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Export de la base de données Firestore
export const db = getFirestore(app);

// Export du stockage (Storage) pour les fichiers
export const storage = getStorage(app);
