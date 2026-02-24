// admin.js (type="module") — Layout Editor (Drag) + Save/Load (RTDB)

import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

console.log("✅ admin.js geladen");

const db = window.db;

const saveBtn = document.getElementById("saveLayoutBtn");
const toggleBtn = document.getElementById("toggleEditBtn");

let editMode = false;
let zTop = 1000;

/* ================= CSS ================= */

function ensureCSS() {
  if (document.getElementById("layoutEditCss")) return;

  const style = document.createElement("style");
  style.id = "layoutEditCss";
 style.textContent = `
body.layoutApplied #app{
  position:relative !important;
}
body.layoutApplied .window,
body.layoutApplied .admin-draggable{
  position:absolute !important;
}

  /* Fenster + Admin-Leiste */
  body.layoutEdit .window,
  body.layoutEdit .admin-draggable{
    position:absolute !important;
    cursor:move;
    user-select:none;
    touch-action:none;

    /* Resize aktivieren */
    resize: both;
    overflow: auto;
    min-width:120px;
    min-height:60px;
  }

  /* Drag-Zone oben */
  body.layoutEdit .window::before,
  body.layoutEdit .admin-draggable::before{
    content:"DRAG (oben ziehen)";
    position:absolute;
    left:0; top:0; right:0;
    height:34px;
    line-height:34px;
    padding-left:10px;
    font-size:12px;
    color:rgba(255,255,255,.9);
    background:rgba(178,34,34,.22);
    border-top-left-radius:12px;
    border-top-right-radius:12px;
    pointer-events:none;
    z-index:99999;
  }
`;
  document.head.appendChild(style);
}

/* ================= Helpers ================= */

function winList() {
  return Array.from(
    document.querySelectorAll(".window, .admin-draggable")
  );
}

function ensureKey(el) {
  if (el.id) return el.id;
  if (el.dataset.win) return el.dataset.win;
  el.dataset.win = "win_" + Math.random().toString(36).slice(2, 10);
  return el.dataset.win;
}

function refreshAdminButtons() {
  const isAdmin = !!window.__IS_ADMIN__;

  if (toggleBtn) toggleBtn.style.display = isAdmin ? "inline-block" : "none";
  if (saveBtn) saveBtn.style.display = (isAdmin && editMode) ? "inline-block" : "none";
}
/* ================= Layout Mode ================= */

function freezeWindowsToAbsolute() {
  const app = document.getElementById("app");
  if (!app) return;

  const appRect = app.getBoundingClientRect();

  winList().forEach((el) => {
    const r = el.getBoundingClientRect();

    // RELATIV zu #app (wichtig!)
    el.style.left = Math.round(r.left - appRect.left) + "px";
    el.style.top  = Math.round(r.top  - appRect.top)  + "px";

    // Größe festhalten
    el.style.width  = Math.round(r.width) + "px";
    el.style.height = Math.round(r.height) + "px";
  });
}

function setEditMode(on) {
  editMode = !!on;

  if (editMode) {
    // erst messen, dann absolute aktivieren
    freezeWindowsToAbsolute();
    document.body.classList.add("layoutEdit");
    bindWindows(); // sicherheitshalber nochmal binden
  } else {
    document.body.classList.remove("layoutEdit");
  }

  console.log("🧩 Layout-Edit:", editMode ? "AN" : "AUS");
  refreshAdminButtons();
}

/* ================= Save / Load ================= */

function captureLayout() {
  const out = {};
  winList().forEach((el) => {
    const key = el.id;
    if (!key) return;

    out[key] = {
      left: el.style.left || "",
      top: el.style.top || "",
      width: el.style.width || "",
      height: el.style.height || "",
      z: Number(el.style.zIndex || 1),
    };
  });
  return out;
}

function applyLayout(layout) {
  if (!layout) return;

  winList().forEach((el) => {
    const key = el.id;
    if (!layout[key]) return;

    const s = layout[key];

    if (s.left) el.style.left = s.left;
    if (s.top) el.style.top = s.top;
    if (s.width) el.style.width = s.width;
    if (s.height) el.style.height = s.height;
    if (s.z) el.style.zIndex = String(s.z);
  });
}

async function loadLayout() {
  try {
    const snap = await get(ref(db, "globalLayout/v1"));
    if (snap.exists()) {
      const layout = snap.val();
      applyLayout(layout);

      // ✅ sorgt dafür, dass Positionen auch außerhalb Edit-Mode gelten
      document.body.classList.add("layoutApplied");

      console.log("✅ globalLayout geladen");
    } else {
      console.log("ℹ️ globalLayout leer");
    }
  } catch (e) {
    console.log("❌ globalLayout load:", e?.code || e?.message);
  }
}

async function saveLayout() {
  try {
    if (!window.__IS_ADMIN__) return alert("❌ Kein Admin");
    await set(ref(db, "globalLayout/v1"), captureLayout());
    alert("✅ Layout gespeichert");
  } catch (e) {
    console.log("❌ globalLayout save:", e?.code || e?.message);
    alert("❌ Speichern fehlgeschlagen");
  }
}

/* ================= Drag ================= */
function makeDraggable(el) {
  if (el.__dragBound) return;
  el.__dragBound = true;

  let dragging = false;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;

  const isUiControl = (target) =>
    !!target?.closest?.("button, a, input, textarea, select, label");

  const begin = (clientX, clientY) => {
    if (!editMode) return;
    dragging = true;

    const r = el.getBoundingClientRect();
    origX = r.left;
    origY = r.top;
    startX = clientX;
    startY = clientY;

    zTop += 1;
    el.style.zIndex = String(zTop);
  };

  const move = (clientX, clientY) => {
    if (!dragging) return;
    el.style.left = (origX + (clientX - startX)) + "px";
    el.style.top  = (origY + (clientY - startY)) + "px";
  };

  const end = () => (dragging = false);

  el.addEventListener("pointerdown", (e) => {
    if (!editMode) return;
    if (isUiControl(e.target)) return;

    const rect = el.getBoundingClientRect();
    if ((e.clientY - rect.top) > 40) return;

    el.setPointerCapture?.(e.pointerId);
    begin(e.clientX, e.clientY);
    e.preventDefault();
  });

  el.addEventListener("pointermove", (e) => {
    move(e.clientX, e.clientY);
    if (dragging) e.preventDefault();
  });

  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);

  el.addEventListener("mousedown", (e) => {
    if (!editMode) return;
    if (isUiControl(e.target)) return;

    const rect = el.getBoundingClientRect();
    if ((e.clientY - rect.top) > 40) return;

    begin(e.clientX, e.clientY);
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
  window.addEventListener("mouseup", end);
}

function bindWindows() {
  winList().forEach(makeDraggable);
}
/* ================= Observe New Windows ================= */
function observeNewWindows() {
  const obs = new MutationObserver(() => {
    // ✅ wenn game.js neue Panels/Buttons reinrendert: Layout wieder anwenden
    loadLayout();

    // Drag nur im Edit-Mode neu binden
    if (!editMode) return;
    freezeWindowsToAbsolute();
    bindWindows();
  });

  obs.observe(document.body, { childList: true, subtree: true });
}
/* ================= Admin Ready ================= */

function waitForAdminReady() {
  const check = () => {
    if (typeof window.__IS_ADMIN__ !== "undefined") {
      console.log("🟢 Admin erkannt:", window.__IS_ADMIN__);
      refreshAdminButtons();
      setEditMode(false); // Start: Edit AUS (du schaltest per Button an)
    } else {
      setTimeout(check, 200);
    }
  };
  check();
}

/* ================= Init ================= */

function init() {
  ensureCSS();

  saveBtn?.addEventListener("click", saveLayout);

  toggleBtn?.addEventListener("click", () => {
    setEditMode(!editMode);
  });

  loadLayout();
  bindWindows();
  observeNewWindows();
  waitForAdminReady();

  console.log("✅ admin init done");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
