// auth.js  (muss als <script type="module" src="auth.js"> eingebunden sein)

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

console.log("✅ auth.js geladen");

// kommt aus index.html (da setzt du window.auth / window.db)
const auth = window.auth;
const db = window.db;

const CURRENT_NAME_KEY = "mbr_current_name_online_v10";

// Buttons aus index.html
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
  } catch (e) {
    console.log("Admin-check Fehler:", e?.code || e?.message);
    return false;
  }
}

// LOGIN (auto-register)
loginBtn?.addEventListener("click", async () => {
  const email = (prompt("Email:") || "").trim();
  if (!email) return;

  const password = prompt("Passwort:") || "";
  if (!password) return;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    // oft kommt invalid-credential auch wenn user nicht existiert ODER falsches Passwort
    if (e?.code === "auth/user-not-found" || e?.code === "auth/invalid-credential") {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("✅ Account erstellt & eingeloggt");
      } catch (e2) {
        if (e2?.code === "auth/email-already-in-use") {
          alert("❌ Falsches Passwort. Nutze 'Passwort zurücksetzen'.");
          return;
        }
        alert("❌ Registrieren fehlgeschlagen: " + (e2?.code || e2?.message));
      }
      return;
    }
    alert("❌ Login fehlgeschlagen: " + (e?.code || e?.message));
  }
});

// PASSWORT RESET
resetBtn?.addEventListener("click", async () => {
  const email = (prompt("Email für Reset:") || "").trim();
  if (!email) return;
  try {
    await sendPasswordResetEmail(auth, email);
    alert("✅ Reset-Mail gesendet (Spam prüfen).");
  } catch (e) {
    alert("❌ Reset fehlgeschlagen: " + (e?.code || e?.message));
  }
});

// LOGOUT
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

// UI + Name fürs Spiel setzen
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    localStorage.removeItem(CURRENT_NAME_KEY);
    window.__IS_ADMIN__ = false;

    show(loginBtn, true);
    show(resetBtn, true);
    show(logoutBtn, false);
    show(saveLayoutBtn, false);
    return;
  }

  // Name fürs Spiel (Email vor dem @)
  const name = (user.email || "player").split("@")[0].slice(0, 24);
  localStorage.setItem(CURRENT_NAME_KEY, name);

  const admin = await isAdmin(user.uid);
  window.__IS_ADMIN__ = admin;

  show(loginBtn, false);
  show(resetBtn, false);
  show(logoutBtn, true);
  show(saveLayoutBtn, admin);
});
