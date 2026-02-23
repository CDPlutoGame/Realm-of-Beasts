// ===== ONLINE RANKING (FIREBASE REALTIME DATABASE) =====
(function () {
  const firebaseConfig = {
    apiKey: "DEIN_KEY",
    authDomain: "DEIN_PROJECT.firebaseapp.com",
    databaseURL: "https://DEIN_PROJECT-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "DEIN_PROJECT",
    storageBucket: "DEIN_PROJECT.appspot.com",
    messagingSenderId: "…",
    appId: "…"
  };

  try {
    if (typeof firebase === "undefined") {
      console.log("Firebase libs nicht geladen");
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.log("Firebase init Fehler", e);
    return;
  }

  const db = firebase.database();

  function getCurrentUser() {
    return localStorage.getItem("mobileUser") || localStorage.getItem("pcUser");
  }

  async function submitScore(score) {
    const name = getCurrentUser();
    if (!name) return;

    try {
      const ref = db.ref("ranking").push();
      await ref.set({ name, score: Number(score) || 0, ts: Date.now() });
    } catch (e) {
      console.log("Ranking Upload Fehler", e);
    }
  }

  async function loadRanking() {
    try {
      const snap = await db.ref("ranking")
        .orderByChild("score")
        .limitToLast(10)
        .once("value");

      const list = [];
      snap.forEach(c => list.push(c.val()));
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
      showRanking(list);
    } catch (e) {
      console.log("Ranking Laden Fehler", e);
      showRanking([]);
    }
  }

  function showRanking(list) {
    let box = document.getElementById("rankingBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "rankingBox";
      box.style.position = "fixed";
      box.style.bottom = "20px";
      box.style.left = "20px";
      box.style.background = "#111";
      box.style.padding = "15px";
      box.style.color = "white";
      box.style.width = "220px";
      box.style.borderRadius = "12px";
      box.style.fontSize = "14px";
      box.style.zIndex = "9999";
      document.body.appendChild(box);
    }
    box.innerHTML = "<b>🏆 Top 10</b><br><br>";
    if (!list.length) {
      box.innerHTML += "Keine Daten / offline<br>";
      return;
    }
    list.forEach((e, i) => {
      box.innerHTML += `${i + 1}. ${e.name} - ${e.score}<br>`;
    });
  }

  window.RANKING = { submitScore, loadRanking };

  // direkt beim Start laden
  document.addEventListener("DOMContentLoaded", () => loadRanking());
})();
