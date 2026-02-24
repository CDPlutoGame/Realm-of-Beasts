import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

loginBtn?.addEventListener("click", async () => {
  const email = prompt("Email:");
  if (!email) return;

  const password = prompt("Passwort:");
  if (!password) return;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return;
  } catch (e) {
    // Firebase liefert oft "auth/invalid-credential" bei falschem PW ODER nicht existierendem User
    if (e?.code === "auth/user-not-found" || e?.code === "auth/invalid-credential") {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("✅ Account erstellt & eingeloggt");
        return;
      } catch (e2) {
        if (e2?.code === "auth/email-already-in-use") {
          alert("❌ Falsches Passwort. Nutze 'Passwort zurücksetzen'.");
          return;
        }
        alert("❌ Registrieren fehlgeschlagen: " + (e2?.code || e2?.message));
        return;
      }
    }

    alert("❌ Login fehlgeschlagen: " + (e?.code || e?.message));
  }
});
