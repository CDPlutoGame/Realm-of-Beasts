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

  if (typeof firebase === "undefined") {
    console.log("❌ Firebase libs fehlen (firebase ist undefined)");
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.log("❌ Firebase init Fehler", e);
    return;
  }

  const db = firebase.database();

  // game.js wartet auf window.__ONLINE_RANKING__
  window.__ONLINE_RANKING__ = {
    async submitScore(payload) {
      const p = {
        name: String(payload?.name || "Unknown").slice(0, 24),
        rounds: Number(payload?.rounds || 0),
        monstersKilled: Number(payload?.monstersKilled || 0),
        bossesKilled: Number(payload?.bossesKilled || 0),
        ts: Date.now()
      };

      // Pfad muss zu deinen Rules passen: /ranking
      await db.ref("ranking").push(p);
    },

    async top10() {
      const snap = await db
        .ref("ranking")
        .orderByChild("rounds")
        .limitToLast(10)
        .once("value");

      const arr = [];
      snap.forEach(c => arr.push(c.val()));
      arr.sort((a, b) => (b.rounds || 0) - (a.rounds || 0));
      return arr;
    }
  };

  console.log("✅ __ONLINE_RANKING__ bereit");
})();
