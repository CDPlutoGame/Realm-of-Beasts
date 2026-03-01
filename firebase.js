import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3Z_HFQ04XVsbAnL3XCqf_6bkX3Cc21oc",
  authDomain: "realm-of-beaasts.firebaseapp.com",
  databaseURL: "https://realm-of-beaasts-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "realm-of-beaasts",
  storageBucket: "realm-of-beaasts.firebasestorage.app",
  messagingSenderId: "723138830522",
  appId: "1:723138830522:web:b3ec8a3d8947c25ec66283"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
