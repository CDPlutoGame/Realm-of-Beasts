// ===== ranking.js (Firebase Realtime Database) =====
(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyD3Z_HFQ04XVsbAnL3XCqf_6bkX3Cc21oc",
    authDomain: "realm-of-beaasts.firebaseapp.com",
    databaseURL: "https://realm-of-beaasts-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "realm-of-beaasts",
    storageBucket: "realm-of-beaasts.firebasestorage.app",
    messagingSenderId: "723138830522",
    appId: "1:723138830522:web:b3ec8a3d8947c25ec66283"
  };

  // Firebase libs müssen VORHER in index.html geladen sein
  if (typeof firebase === "undefined") {
    console.log("❌ firebase ist undefined (libs fehlen in index.html)");
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.log("❌ Firebase init Fehler:", e);
    return;
  }

  const db = firebase.database();

  function getName() {
    return (
      (localStorage.getItem("mbr_current_name_online_v10") || "").trim() ||
      (localStorage.getItem("mobileUser") || "").trim() ||
      (localStorage.getItem("pcUser") || "").trim() ||
      (localStorage.getItem("playerName") || "").trim()
    );
  }

  async function submitScore(payload) {
    const name = getName() || String(payload?.name || "Unknown").trim() || "Unknown";

    const data = {
      name: String(name).slice(0, 24),
      rounds: Number(payload?.rounds || 0),
      monstersKilled: Number(payload?.monstersKilled || 0),
      bossesKilled: Number(payload?.bossesKilled || 0),
      ts: Date.now()
    };

    await db.ref("ranking").push(data);
    console.log("✅ Ranking gespeichert:", data);
  }

  async function top10() {
    const snap = await db.ref("ranking")
      .orderByChild("rounds")
      .limitToLast(10)
      .once("value");

    const arr = [];
    snap.forEach(c => arr.push(c.val()));
    arr.sort((a, b) => (b.rounds || 0) - (a.rounds || 0));
    return arr;
  }

  window.__ONLINE_RANKING__ = { submitScore, top10 };
  console.log("✅ __ONLINE_RANKING__ bereit");

  // pending score nachschieben (falls game.js ihn geparkt hat)
  try {
    const pending = localStorage.getItem("mbr_pending_score");
    if (pending) {
      const payload = JSON.parse(pending);
      submitScore(payload).then(() => {
        localStorage.removeItem("mbr_pending_score");
        console.log("✅ Pending Score hochgeladen");
      }).catch((e) => console.log("❌ Pending Upload Fehler:", e));
    }
  } catch {}
})();
