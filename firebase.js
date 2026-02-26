import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  query,
  orderByChild,
  limitToLast
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3Z_HFQ04XVsbAnL3XCqf_6bkX3Cc21oc",
  authDomain: "realm-of-beaasts.firebaseapp.com",
  databaseURL: "https://realm-of-beaasts-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "realm-of-beaasts",
  storageBucket: "realm-of-beaasts.firebasestorage.app",
  messagingSenderId: "723138830522",
  appId: "1:723138830522:web:b3ec8a3d8947c25ec66283",
  measurementId: "G-084J12EZHN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const firebaseRef = ref;
export const firebaseGet = get;
export const firebaseSet = set;
export const firebaseQuery = query;
export const firebaseOrderByChild = orderByChild;
export const firebaseLimitToLast = limitToLast;

// 🔥 GLOBAL verfügbar machen für game.js
window.auth = auth;
window.db = db;
window.firebaseRef = ref;
window.firebaseGet = get;
window.firebaseSet = set;
window.firebaseQuery = query;
window.firebaseOrderByChild = orderByChild;
window.firebaseLimitToLast = limitToLast;
