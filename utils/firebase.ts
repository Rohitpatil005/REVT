import { initializeApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9OzzSz-CUytuDx-YP5kuk1vLYQ2ZdExs",
  authDomain: "rohit-billing.firebaseapp.com",
  projectId: "rohit-billing",
  storageBucket: "rohit-billing.firebasestorage.app",
  messagingSenderId: "334250506510",
  appId: "1:334250506510:web:d4fe77c6f6ff35fa78bf5f",
  measurementId: "G-0QB187E7TZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth: Auth = getAuth(app);

// Initialize Firestore
const db: Firestore = getFirestore(app);

export {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  type User,
};
