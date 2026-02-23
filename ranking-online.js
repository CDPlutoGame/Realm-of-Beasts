// ===== ONLINE RANKING (FIREBASE REALTIME DATABASE) =====
(function () {

  // ✅ HIER DEINE FIREBASE CONFIG EINTRAGEN
  const firebaseConfig = {
    apiKey: "…",
    authDomain: "…",
    databaseURL: "…",   // <- wichtig!
    projectId: "…",
    storageBucket: "…",
    messagingSenderId: "…",
    appId: "…"
  };

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  function getCurrentUser() {
    return localStorage.getItem("mobileUser") || localStorage.getItem("pcUser");
  }

  async function submitScore(score) {
    const name = getCurrentUser();
    if (!name) return;

    // Speichert Score als Eintrag (Top 10 machen wir beim Laden)
    const ref = db.ref("ranking").push();
    await ref.set({
      name,
      score: Number(score) || 0,
      ts: Date.now()
    });
  }

  async function loadRanking() {
    const snap = await db.ref("ranking")
      .orderByChild("score")
      .limitToLast(10)
      .once("value");

    const list = [];
    snap.forEach(child => list.push(child.val()));
    list.sort((a, b) => (b.score || 0) - (a.score || 0));
    showRanking(list);
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
      document.body.appendChild(box);
    }

    box.innerHTML = "<b>🏆 Top 10</b><br><br>";
    list.forEach((e, i) => {
      box.innerHTML += `${i + 1}. ${e.name} - ${e.score}<br>`;
    });
  }

  window.RANKING = { submitScore, loadRanking };
})();
