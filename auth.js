// auth.js – Login (auto-register), reset, logout + Name in localStorage setzen
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const auth = window.auth;
const db = window.db;

const CURRENT_NAME_KEY = "mbr_current_name_online_v10";

const loginBtn = document.getElementById("loginBtn");
const resetBtn = document.getElementById("resetBtn");
const logoutBtn = document.getElementById("logoutBtn");
const saveLayoutBtn = document.getElementById("saveLayoutBtn");

function show(el, yes) {
  if (!el) return;
  el.style.display = yes ? "inline-block" : "none";
}

async function isAdmin(uid) {
  try {
    const snap = await get(ref(db, `admins/${uid}`));
    return snap.exists() && snap.val() === true;
  } catch {
    return false;
  }
}

loginBtn?.addEventListener("click", async () => {
  const email = prompt("Email:");
  if (!email) return;

  const password = prompt("Passwort:");
  if (!password) return;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    if (e?.code === "auth/user-not-found") {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("✅ Account erstellt & eingeloggt");
    } else {
      alert("❌ Login fehlgeschlagen: " + (e?.code || e?.message));
    }
  }
});

resetBtn?.addEventListener("click", async () => {
  const email = prompt("Email für Passwort-Reset:");
  if (!email) return;
  try {
    await sendPasswordResetEmail(auth, email);
    alert("✅ Reset-Mail gesendet (Spam prüfen)");
  } catch (e) {
    alert("❌ Reset fehlgeschlagen: " + (e?.code || e?.message));
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // ausgeloggt -> Name raus, Spiel zeigt "Bitte anmelden"
    localStorage.removeItem(CURRENT_NAME_KEY);
    window.__IS_ADMIN__ = false;

    show(loginBtn, true);
    show(resetBtn, true);
    show(logoutBtn, false);
    show(saveLayoutBtn, false);
    return;
  }

  // eingeloggt -> Name setzen (nimm Email-Teil vor @ als Spielername)
  const name = (user.email || "player").split("@")[0].slice(0, 24);
  localStorage.setItem(CURRENT_NAME_KEY, name);

  const admin = await isAdmin(user.uid);
  window.__IS_ADMIN__ = admin;

  show(loginBtn, false);
  show(resetBtn, false);
  show(logoutBtn, true);
  show(saveLayoutBtn, admin); // nur Admin sieht Speichern
});
