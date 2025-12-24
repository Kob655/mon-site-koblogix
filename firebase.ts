
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// REMPLACEZ CES VALEURS PAR CELLES DE VOTRE CONSOLE FIREBASE
// Si vous ne le faites pas, l'upload affichera "Patientez..." indéfiniment.
const firebaseConfig = {
  apiKey: "AIzaSyCVKVZZCw87xrLyWkF1uJaqzJ1v_ZPCDf4 ",
  authDomain: "koblogix.firebaseapp.com ",
  projectId: "koblogix ",
  storageBucket: "koblogix.firebasestorage.app ",
  messagingSenderId: "1059133656016 ",
  appId: "1:1059133656016:web:684a56716bd086e6cc47d5"
};

const app = initializeApp(firebaseConfig);

// Export des instances modulaires
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
