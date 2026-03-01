import { auth } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const provider = new GoogleAuthProvider();

export const login = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login Fehler:", error);
    }
};

export const logout = async () => {
    await signOut(auth);
    location.reload();
};

window.login = login;
window.logout = logout;
