import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  setLogLevel
} from 'firebase/firestore';

try {
  setLogLevel('silent');
} catch {
  // Silently ignore
}

const firebaseConfig = {
  projectId: "gen-lang-client-0662069262",
  appId: "1:163435125670:web:9015fc02e130869ca18d67",
  apiKey: "AIzaSyBfnDTCyD4agzEQ7AUXBXaTPC3iHPi3tJw",
  authDomain: "gen-lang-client-0662069262.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-csea32-0995860c-a7bc-4106-b8b4-a82af80b8334",
  storageBucket: "gen-lang-client-0662069262.firebasestorage.app",
  messagingSenderId: "163435125670"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs
};
export type { User };
