// admin.js — Admin Layout Editor (drag + resize) + global save in Firebase RTDB
(() => {
  const ADMIN_PASSWORD = "DEIN_ADMIN_PASSWORT"; // <- ändern
  const LAYOUT_PATH = "globalLayout/v1";        // <- Speicherort in RTDB

  // Welche Fenster sollen editierbar sein?
  const EDIT_IDS = ["statusPanel", "shop", "fightPanel", "log", "board", "leaderboard", "uiRow1"];

  function $(id) { return document.getElementById(id); }

  // Warten bis game.js die UI gebaut hat
  function waitForUI(cb) {
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      const ok = EDIT_IDS.some(id => $(id));
      if (ok) { clearInterval(t); cb(); }
      if (tries > 200) clearInterval(t); // ~10s
    }, 50);
  }

  function getDb() {
    if (typeof firebase === "undefined") return null;
    try { return firebase.database(); } catch { return null; }
  }

  function applyLayout(layout) {
    if (!layout) return;
    for (const id of Object.keys(layout)) {
      const el = $(id);
      if (!el) continue;
      const s = layout[id] || {};
      el.style.position = "absolute";
      if (s.left != null) el.style.left = s.left;
      if (s.top != null) el.style.top = s.top;
      if (s.width != null) el.style.width = s.width;
      if (s.height != null) el.style.height = s.height;
      el.style.zIndex = "9999";
    }
  }

  function captureLayout() {
    const out = {};
    for (const id of EDIT_IDS) {
      const el = $(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      out[id] = {
        left: (parseInt(el.style.left, 10) || Math.round(r.left)) + "px",
        top: (parseInt(el.style.top, 10) || Math.round(r.top)) + "px",
        width: (parseInt(el.style.width, 10) || Math.round(r.width)) + "px",
        height: (parseInt(el.style.height, 10) || Math.round(r.height)) + "px",
      };
    }
    return out;
  }

  function makeDraggable(el) {
    let down = false, sx = 0, sy = 0, startL = 0, startT = 0;

    el.addEventListener("pointerdown", (e) => {
      if (!window.__ADMIN_EDIT_MODE__) return;
      down = true;
      el.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY;
      startL = parseInt(el.style.left || "0", 10);
      startT = parseInt(el.style.top || "0", 10);
      // falls noch kein left/top gesetzt:
      if (!el.style.left || !el.style.top) {
        const r = el.getBoundingClientRect();
        el.style.left = Math.round(r.left) + "px";
        el.style.top = Math.round(r.top) + "px";
        startL = Math.round(r.left);
        startT = Math.round(r.top);
      }
    });

    el.addEventListener("pointermove", (e) => {
      if (!window.__ADMIN_EDIT_MODE__ || !down) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      el.style.left = (startL + dx) + "px";
      el.style.top = (startT + dy) + "px";
    });

    el.addEventListener("pointerup", () => { down = false; });
    el.addEventListener("pointercancel", () => { down = false; });
  }

  function enableEditMode() {
    window.__ADMIN_EDIT_MODE__ = true;
    for (const id of EDIT_IDS) {
      const el = $(id);
      if (!el) continue;
      // absolute + draggable + resize
      const r = el.getBoundingClientRect();
      el.style.position = "absolute";
      el.style.left = Math.round(r.left) + "px";
      el.style.top = Math.round(r.top) + "px";
      el.style.width = Math.round(r.width) + "px";
      el.style.height = Math.round(r.height) + "px";
      el.style.zIndex = "9999";
      el.style.resize = "both";
      el.style.overflow = "auto";
      el.style.outline = "2px dashed rgba(255,80,80,0.9)";
      el.style.touchAction = "none";
      makeDraggable(el);
    }
  }

  function disableEditMode() {
    window.__ADMIN_EDIT_MODE__ = false;
    for (const id of EDIT_IDS) {
      const el = $(id);
      if (!el) continue;
      el.style.outline = "";
      el.style.touchAction = "";
      // resize aus, aber Layout bleibt angewendet
      el.style.resize = "";
    }
  }

  function makeAdminBar(onSave, onToggle) {
    const bar = document.createElement("div");
    bar.id = "adminBar";
    bar.style.position = "fixed";
    bar.style.right = "10px";
    bar.style.top = "10px";
    bar.style.zIndex = "20000";
    bar.style.display = "flex";
    bar.style.gap = "8px";
    bar.style.padding = "8px";
    bar.style.borderRadius = "10px";
    bar.style.background = "rgba(0,0,0,0.6)";
    bar.style.border = "1px solid rgba(255,255,255,0.15)";

    const btnToggle = document.createElement("button");
    btnToggle.textContent = "🛠 Layout bearbeiten";
    btnToggle.onclick = onToggle;

    const btnSave = document.createElement("button");
    btnSave.textContent = "💾 Für alle speichern";
    btnSave.onclick = onSave;

    const btnExit = document.createElement("button");
    btnExit.textContent = "✅ Fertig";
    btnExit.onclick = () => disableEditMode();

    for (const b of [btnToggle, btnSave, btnExit]) {
      b.style.background = "#b22222";
      b.style.color = "#fff";
      b.style.border = "none";
      b.style.padding = "8px 10px";
      b.style.borderRadius = "10px";
      b.style.cursor = "pointer";
      b.style.fontWeight = "700";
    }

    bar.appendChild(btnToggle);
    bar.appendChild(btnSave);
    bar.appendChild(btnExit);
    document.body.appendChild(bar);
  }

  waitForUI(async () => {
    const db = getDb();

    // 1) Layout für ALLE laden/anwenden
    if (db) {
      try {
        const snap = await db.ref(LAYOUT_PATH).once("value");
        applyLayout(snap.val());
      } catch {}
    }

    // 2) Admin Login (nur wenn Passwort stimmt -> Toolbar anzeigen)
    const pw = prompt("Admin Passwort (leer = kein Admin):");
    if (!pw || pw !== ADMIN_PASSWORD) return;

    // Admin Toolbar + Edit/Save
    makeAdminBar(
      async () => {
        if (!db) return alert("Firebase DB nicht verfügbar.");
        try {
          const layout = captureLayout();
          await db.ref(LAYOUT_PATH).set(layout);
          alert("✅ Layout für alle gespeichert!");
        } catch (e) {
          alert("❌ Speichern fehlgeschlagen (Rules/Netz).");
        }
      },
      () => {
        if (window.__ADMIN_EDIT_MODE__) disableEditMode();
        else enableEditMode();
      }
    );
  });
})();
