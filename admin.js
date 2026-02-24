// admin.js — secure admin layout editor (Firebase Auth + RTDB rules)
(() => {
  const EDIT_IDS = ["statusPanel", "shop", "fightPanel", "log", "board", "leaderboard", "uiRow1"];
  const LAYOUT_PATH = "globalLayout/v1";

  const $ = (id) => document.getElementById(id);

  function waitForUI(cb) {
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (EDIT_IDS.some(id => $(id))) { clearInterval(t); cb(); }
      if (tries > 300) clearInterval(t);
    }, 50);
  }

  function getDb() {
    try { return firebase.database(); } catch { return null; }
  }
  function getAuth() {
    try { return firebase.auth(); } catch { return null; }
  }

  function applyLayout(layout) {
    if (!layout) return;
    for (const [id, s] of Object.entries(layout)) {
      const el = $(id);
      if (!el) continue;
      el.style.position = "absolute";
      if (s.left) el.style.left = s.left;
      if (s.top) el.style.top = s.top;
      if (s.width) el.style.width = s.width;
      if (s.height) el.style.height = s.height;
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
        height: (parseInt(el.style.height, 10) || Math.round(r.height)) + "px"
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
      const r = el.getBoundingClientRect();
      if (!el.style.left) el.style.left = Math.round(r.left) + "px";
      if (!el.style.top) el.style.top = Math.round(r.top) + "px";
      sx = e.clientX; sy = e.clientY;
      startL = parseInt(el.style.left, 10);
      startT = parseInt(el.style.top, 10);
    });

    el.addEventListener("pointermove", (e) => {
      if (!window.__ADMIN_EDIT_MODE__ || !down) return;
      el.style.left = (startL + (e.clientX - sx)) + "px";
      el.style.top  = (startT + (e.clientY - sy)) + "px";
    });

    el.addEventListener("pointerup", () => { down = false; });
    el.addEventListener("pointercancel", () => { down = false; });
  }

  function enableEditMode() {
    window.__ADMIN_EDIT_MODE__ = true;
    for (const id of EDIT_IDS) {
      const el = $(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      el.style.position = "absolute";
      el.style.left = Math.round(r.left) + "px";
      el.style.top  = Math.round(r.top) + "px";
      el.style.width  = Math.round(r.width) + "px";
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
      el.style.resize = "";
    }
  }

  function adminUI(onLogin, onLogout, onToggle, onSave) {
    const box = document.createElement("div");
    box.style.position = "fixed";
    box.style.right = "10px";
    box.style.top = "10px";
    box.style.zIndex = "20000";
    box.style.background = "rgba(0,0,0,0.6)";
    box.style.border = "1px solid rgba(255,255,255,0.15)";
    box.style.borderRadius = "10px";
    box.style.padding = "10px";
    box.style.display = "grid";
    box.style.gap = "8px";
    box.style.width = "260px";

    box.innerHTML = `
      <div style="font-weight:900">🛡 Admin</div>
      <input id="admEmail" type="email" placeholder="Email" style="padding:8px;border-radius:8px;border:1px solid #333;background:#111;color:#fff"/>
      <input id="admPass" type="password" placeholder="Passwort" style="padding:8px;border-radius:8px;border:1px solid #333;background:#111;color:#fff"/>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="admLogin">Login</button>
        <button id="admLogout">Logout</button>
        <button id="admEdit">Layout</button>
        <button id="admSave">Speichern</button>
      </div>
      <div id="admInfo" style="opacity:.85;font-size:12px"></div>
    `;

    const btnStyle = (b) => {
      b.style.background = "#b22222";
      b.style.color = "#fff";
      b.style.border = "none";
      b.style.padding = "8px 10px";
      b.style.borderRadius = "10px";
      b.style.cursor = "pointer";
      b.style.fontWeight = "800";
    };

    const loginBtn = box.querySelector("#admLogin");
    const logoutBtn = box.querySelector("#admLogout");
    const editBtn = box.querySelector("#admEdit");
    const saveBtn = box.querySelector("#admSave");
    [loginBtn, logoutBtn, editBtn, saveBtn].forEach(btnStyle);

    loginBtn.onclick = () => onLogin(box.querySelector("#admEmail").value, box.querySelector("#admPass").value);
    logoutBtn.onclick = onLogout;
    editBtn.onclick = onToggle;
    saveBtn.onclick = onSave;

    document.body.appendChild(box);

    return {
      setInfo: (t) => { box.querySelector("#admInfo").textContent = t; },
      setEnabled: (isAdmin) => {
        editBtn.disabled = !isAdmin;
        saveBtn.disabled = !isAdmin;
      }
    };
  }

  waitForUI(async () => {
    if (typeof firebase === "undefined") return;

    const db = getDb();
    const auth = getAuth();
    if (!db || !auth) return;

    // Layout für ALLE laden
    try {
      const snap = await db.ref(LAYOUT_PATH).once("value");
      applyLayout(snap.val());
    } catch {}

    const ui = adminUI(
      async (email, pass) => {
        try {
          await auth.signInWithEmailAndPassword(email, pass);
        } catch {
          ui.setInfo("❌ Login fehlgeschlagen");
        }
      },
      async () => {
        try { await auth.signOut(); } catch {}
      },
      () => {
        if (!window.__IS_ADMIN__) return;
        window.__ADMIN_EDIT_MODE__ ? disableEditMode() : enableEditMode();
      },
      async () => {
        if (!window.__IS_ADMIN__) return;
        try {
          await db.ref(LAYOUT_PATH).set(captureLayout());
          ui.setInfo("✅ Layout für alle gespeichert");
        } catch {
          ui.setInfo("❌ Speichern blockiert (Rules?)");
        }
      }
    );

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.__IS_ADMIN__ = false;
        ui.setEnabled(false);
        ui.setInfo("Nicht eingeloggt");
        disableEditMode();
        return;
      }

      // Admin-Check über /admins/<uid> = true
      try {
        const snap = await db.ref("admins/" + user.uid).once("value");
        window.__IS_ADMIN__ = snap.val() === true;
      } catch {
        window.__IS_ADMIN__ = false;
      }

      ui.setEnabled(window.__IS_ADMIN__);
      ui.setInfo(window.__IS_ADMIN__ ? "✅ Admin aktiv" : "ℹ️ Kein Admin");
      if (!window.__IS_ADMIN__) disableEditMode();
    });
  });
})();
