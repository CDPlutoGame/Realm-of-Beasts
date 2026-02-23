// ranking.js — BEST per Name (ranking_best) + Fallback (ranking)
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
    console.log("❌ Firebase libs fehlen (firebase undefined)");
    return;
  }
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const db = firebase.database();
  const toNum = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  };
  const safeKey = (name) =>
    String(name || "Unknown")
      .trim()
      .slice(0, 24)
      .replace(/[.#$\[\]\/]/g, "_");

  async function submitScore(payload) {
    const nameRaw = String(payload?.name || "Unknown").trim() || "Unknown";
    const name = nameRaw.slice(0, 24);

    const data = {
      name,
      rounds: toNum(payload?.rounds),
      monstersKilled: toNum(payload?.monstersKilled),
      bossesKilled: toNum(payload?.bossesKilled),
      ts: Date.now()
    };

    // 1) Historie (damit immer was drin ist)
    await db.ref("ranking").push(data);

    // 2) Best-Score pro Name
    const key = safeKey(name);
    const ref = db.ref("ranking_best/" + key);
    const snap = await ref.once("value");
    const old = snap.val();
    const oldRounds = toNum(old?.rounds);

    if (!old || data.rounds > oldRounds) {
      await ref.set(data);
      return true;
    }
    return false;
  }

  async function top10_from(path) {
    const snap = await db
      .ref(path)
      .orderByChild("rounds")
      .limitToLast(10)
      .once("value");

    const arr = [];
    snap.forEach((c) => arr.push(c.val()));
    arr.sort((a, b) => toNum(b.rounds) - toNum(a.rounds));
    return arr;
  }

  async function top10() {
    const best = await top10_from("ranking_best");
    if (best.length) return best;
    return await top10_from("ranking");
  }

  window.__ONLINE_RANKING__ = { submitScore, top10 };
  console.log("✅ Ranking ready (best+fallback)");

  // pending score nachschieben
  try {
    const pending = localStorage.getItem("mbr_pending_score");
    if (pending) {
      const payload = JSON.parse(pending);
      submitScore(payload).then(() => {
        localStorage.removeItem("mbr_pending_score");
      }).catch(()=>{});
    }
  } catch {}
})();
