import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "DEIN_KEY",
  authDomain: "DEIN_DOMAIN",
  databaseURL: "DEINE_DB_URL",
  projectId: "DEIN_PROJECT",
  storageBucket: "DEIN_BUCKET",
  messagingSenderId: "DEIN_ID",
  appId: "DEINE_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const firebaseRef = ref;
export const firebaseGet = get;
export const firebaseSet = set;
