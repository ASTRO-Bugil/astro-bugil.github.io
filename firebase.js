// firebase.js

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* Firebase config */

const firebaseConfig = {

  apiKey: "AIzaSyCWkdmvAy12oKDVbi8Zq96InS1VEHwozOc",

  authDomain: "astro-bugil.firebaseapp.com",

  projectId: "astro-bugil",

  storageBucket: "astro-bugil.firebasestorage.app",

  messagingSenderId: "840698290502",

  appId: "1:840698290502:web:fc65100c4c8ac3bf5ec547",

  measurementId: "G-JVTQGN1W9S"

};

/* initialize */

const app = initializeApp(firebaseConfig);

/* auth */

const auth = getAuth(app);

const provider =
new GoogleAuthProvider();

/* firestore */

const db =
getFirestore(app);

export {

  auth,
  provider,
  db,

  signInWithPopup,
  signOut,
  onAuthStateChanged,

  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp

};
