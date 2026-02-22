// ranking-online.js — FINAL (Auth + RTDB + Top10 + Basis Anti-Cheat)
// ✅ Username + Passwort (intern Fake-Email)
// ✅ Kein Auto-Login nach Reload (inMemoryPersistence)
// ✅ window.__ONLINE_AUTH__ + window.__ONLINE_RANKING__

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  get,
  set,
  query,
  orderByChild,
  limitToLast,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

import {
  getAuth,
  setPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// ✅ Deine Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyD3Z_HFQ04XVsbAnL3XCqf_6bkX3Cc21oc",
  authDomain: "realm-of-beaasts.firebaseapp.com",
  databaseURL: "https://realm-of-beaasts-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "realm-of-beaasts",
  storageBucket: "realm-of-beaasts.firebasestorage.app",
  messagingSenderId: "723138830522",
  appId: "1:723138830522:web:b3ec8a3d8947c25ec66283",
  measurementId: "G-084J12EZHN",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ✅ Kein Auto-Login nach Reload (Login nur solange Tab offen ist)
setPersistence(auth, inMemoryPersistence).catch((e) => {
  console.warn("Auth persistence konnte nicht gesetzt werden:", e);
});

// Pfade
const BASE_LEADERBOARD = "leaderboard";
const BASE_USERS = "users";
const BASE_USERS_BY_NAME = "usersByName";

// -------- Helpers --------
function toNum(v) {
  v = Number(v);
  return Number.isFinite(v) ? v : 0;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, toNum(n)));
}
function cleanNameForDisplay(s) {
  s = String(s || "Unknown").trim();
  s = s.replace(/[^a-zA-Z0-9 äöüÄÖÜß_\-]/g, "");
  return s.slice(0, 24) || "Unknown";
}
function makeNameKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-]/g, "")
    .slice(0, 24);
}
function emailFromNameKey(nameKey) {
  return `${nameKey}@realm.local`;
}
function scoreKey(rounds, monstersKilled, bossesKilled) {
  return toNum(rounds) * 1_000_000 + toNum(monstersKilled) * 1_000 + toNum(bossesKilled);
}

// Login-State
let __loginNameKey = "";
let __loginUid = "";

onAuthStateChanged(auth, (u) => {
  __loginUid = u?.uid || "";
  __loginNameKey = u?.email ? String(u.email).split("@")[0] : "";
  console.log("Auth:", __loginUid ? `eingeloggt als ${__loginNameKey}` : "nicht eingeloggt");
});

// Rate-Limit fürs Score submit
let __lastSubmitAt = 0;

// -------- Auth API --------
window.__ONLINE_AUTH__ = {
  get status() {
    return {
      loggedIn: !!auth.currentUser,
      uid: __loginUid,
      nameKey: __loginNameKey,
    };
  },

  async register(name, password) {
    const nameKey = makeNameKey(name);
    if (nameKey.length < 3) throw new Error("Name zu kurz (min 3).");
    if (!password || String(password).length < 6) throw new Error("Passwort zu kurz (min 6).");

    const email = emailFromNameKey(nameKey);
    await createUserWithEmailAndPassword(auth, email, password);

    const uid = auth.currentUser.uid;

    await set(ref(db, `${BASE_USERS_BY_NAME}/${nameKey}`), { uid, createdAt: Date.now() });
    await set(ref(db, `${BASE_USERS}/${uid}`), {
      name: cleanNameForDisplay(name),
      nameKey,
      createdAt: Date.now(),
    });

    return { uid, nameKey };
  },

  async login(name, password) {
    const nameKey = makeNameKey(name);
    if (nameKey.length < 3) throw new Error("Name zu kurz (min 3).");
    if (!password || String(password).length < 6) throw new Error("Passwort zu kurz (min 6).");

    const email = emailFromNameKey(nameKey);
    await signInWithEmailAndPassword(auth, email, password);

    const uid = auth.currentUser.uid;
    await set(ref(db, `${BASE_USERS}/${uid}`), {
      name: cleanNameForDisplay(name),
      nameKey,
      createdAt: Date.now(),
    });

    return { uid, nameKey };
  },

  async logout() {
    await signOut(auth);
  },
};

// -------- Ranking API --------
window.__ONLINE_RANKING__ = {
  async submitScore({ rounds, gold, hp, monstersKilled, bossesKilled }) {
    if (!auth.currentUser || !__loginNameKey) return;

    const now = Date.now();
    if (now - __lastSubmitAt < 5000) return;
    __lastSubmitAt = now;

    const r = clamp(rounds, 0, 500);
    const g = clamp(gold, 0, 1_000_000);
    const h = clamp(hp, 0, 500);
    const mk = clamp(monstersKilled, 0, 1_000_000);
    const bk = clamp(bossesKilled, 0, 100_000);

    const data = {
      name: __loginNameKey,
      rounds: r,
      gold: g,
      hp: h,
      monstersKilled: mk,
      bossesKilled: bk,
      scoreKey: scoreKey(r, mk, bk),
      time: now,
      uid: auth.currentUser.uid,
    };

    await push(ref(db, BASE_LEADERBOARD), data);
  },

  async top10() {
    const q = query(ref(db, BASE_LEADERBOARD), orderByChild("scoreKey"), limitToLast(10));
    const snap = await get(q);
    if (!snap.exists()) return [];
    const arr = Object.values(snap.val());
    arr.sort((a, b) => (b.scoreKey || 0) - (a.scoreKey || 0));
    return arr;
  },
};

console.log("✅ ranking-online.js geladen", {
  auth: window.__ONLINE_AUTH__,
  ranking: window.__ONLINE_RANKING__,
});