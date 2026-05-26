import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* Firebase 설정 */

const firebaseConfig = {

  apiKey: "AIzaSyCWkdmvAy12oKDVbi8Zq96InS1VEHwozOc",

  authDomain: "astro-bugil.firebaseapp.com",

  projectId: "astro-bugil",

  storageBucket: "astro-bugil.firebasestorage.app",

  messagingSenderId: "840698290502",

  appId: "1:840698290502:web:fc65100c4c8ac3bf5ec547",

  measurementId: "G-JVTQGN1W9S"

};

/* Firebase 초기화 */

const app = initializeApp(firebaseConfig);

/* Auth */

export const auth = getAuth(app);

export const provider =
new GoogleAuthProvider();

/* Firestore */

export const db =
getFirestore(app);

/* export */

export {
  signInWithPopup,
  signOut,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
};
