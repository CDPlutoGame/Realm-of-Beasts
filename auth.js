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

// LOGIN (Dungeon Overlay)
const overlay = document.getElementById("loginOverlay");
const loginConfirm = document.getElementById("loginConfirm");
const loginCancel = document.getElementById("loginCancel");
const loginError = document.getElementById("loginError");

loginBtn?.addEventListener("click", () => {
  overlay.style.display = "flex";
  loginError.textContent = "";
});

loginCancel?.addEventListener("click", () => {
  overlay.style.display = "none";
});

loginConfirm?.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    loginError.textContent = "❌ Bitte Email & Passwort eingeben";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    overlay.style.display = "none";
  } catch (e) {

    if (e?.code === "auth/user-not-found" || e?.code === "auth/invalid-credential") {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        overlay.style.display = "none";
      } catch (e2) {
        loginError.textContent = "❌ Falsches Passwort";
      }
      return;
    }

    loginError.textContent = "❌ Login fehlgeschlagen";
  }
});;

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
// ===== LOGIN RESET BUTTON (Overlay) =====
const loginReset = document.getElementById("loginReset");

loginReset?.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const loginError = document.getElementById("loginError");

  if (!email) {
    loginError.textContent = "❌ Bitte zuerst Email eingeben";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    loginError.textContent = "✅ Reset-Mail gesendet (Spam prüfen)";
  } catch (e) {
    loginError.textContent = "❌ Reset fehlgeschlagen";
  }
});
