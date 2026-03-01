import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3Z_HfQO4XVsbAnL3XCqf_6bkX3Cc21oc",
  authDomain: "realm-of-beasts.firebaseapp.com",
  databaseURL: "https://realm-of-beasts-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "realm-of-beasts",
  storageBucket: "realm-of-beasts.appspot.com",
  messagingSenderId: "723138830522",
  appId: "1:723138830522:web:b3ec8a3d8947c25ec66283",
  measurementId: "G-Q84J12EZHN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
