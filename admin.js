// admin.js (type="module") — Layout Editor (Drag) + Save/Load (RTDB)
import { ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

console.log("✅ admin.js geladen");

const db = window.db;
const saveBtn = document.getElementById("saveLayoutBtn");
const toggleBtn = document.getElementById("toggleEditBtn");

let editMode = false;
let zTop = 1000;

/* ================= CSS (nur im Edit-Mode absolut!) ================= */
function ensureCSS() {
  if (document.getElementById("layoutEditCss")) return;
  const style = document.createElement("style");
  style.id = "layoutEditCss";
  style.textContent = `
body.layoutEdit #app{
  position:relative !important;
}
body.layoutEdit .window,
body.layoutEdit .admin-draggable{
  position:absolute !important;
  box-sizing: border-box;
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
  return Array.from(document.querySelectorAll(".window, .admin-draggable"));
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
    el.style.left = Math.round(r.left - appRect.left) + "px";
    el.style.top  = Math.round(r.top  - appRect.top)  + "px";
    el.style.width  = Math.round(r.width) + "px";
    el.style.height = Math.round(r.height) + "px";
  });
}

function clearInlineLayout() {
  winList().forEach((el) => {
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.height = "";
    // el.style.zIndex = ""; // optional
  });
}

function setEditMode(on) {
  editMode = !!on;

  if (editMode) {
    document.body.classList.add("layoutEdit");
    freezeWindowsToAbsolute();
    bindWindows();
    loadLayout(); // nur im Edit Mode anwenden
  } else {
    document.body.classList.remove("layoutEdit");
    clearInlineLayout(); // zurück ins normale Grid/CSS
  }

  refreshAdminButtons?.();
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
    if (!key || !layout[key]) return;
    const s = layout[key];
    if (s.left) el.style.left = s.left;
    if (s.top) el.style.top = s.top;
    if (s.width) el.style.width = s.width;
    if (s.height) el.style.height = s.height;
    if (s.z) el.style.zIndex = String(s.z);
  });
}

async function loadLayout() {
  if (!editMode) return; // ✅ wichtig: normal modus niemals “festnageln”
  try {
    const snap = await get(ref(db, "globalLayout/v1"));
    if (snap.exists()) {
      applyLayout(snap.val());
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

// optional: Reset Button (falls du mal brauchst)
// async function resetLayout() {
//   if (!window.__IS_ADMIN__) return alert("❌ Kein Admin");
//   await remove(ref(db, "globalLayout/v1"));
//   alert("✅ Layout zurückgesetzt");
// }

/* ================= Drag ================= */
function makeDraggable(el) {
  if (el.__dragBound) return;
  el.__dragBound = true;

  let dragging = false;
  let startX = 0, startY = 0;
  let origLeft = 0, origTop = 0;

  const isUiControl = (target) =>
    !!target?.closest?.("button, a, input, textarea, select, label");

  const begin = (clientX, clientY) => {
    if (!editMode) return;
    dragging = true;

    const left = parseFloat(el.style.left || "0");
    const top  = parseFloat(el.style.top  || "0");
    origLeft = left;
    origTop  = top;

    startX = clientX;
    startY = clientY;

    zTop += 1;
    el.style.zIndex = String(zTop);
  };

  const move = (clientX, clientY) => {
    if (!dragging) return;
    el.style.left = (origLeft + (clientX - startX)) + "px";
    el.style.top  = (origTop  + (clientY - startY)) + "px";
  };

  const end = () => (dragging = false);

  el.addEventListener("pointerdown", (e) => {
    if (!editMode) return;
    if (isUiControl(e.target)) return;

    const rect = el.getBoundingClientRect();
    if ((e.clientY - rect.top) > 40) return; // nur Drag-Zone

    el.setPointerCapture?.(e.pointerId);
    begin(e.clientX, e.clientY);
    e.preventDefault();
  });

  el.addEventListener("pointermove", (e) => {
    if (!editMode) return;
    move(e.clientX, e.clientY);
    if (dragging) e.preventDefault();
  });

  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

function bindWindows() {
  winList().forEach(makeDraggable);
}

/* ================= Observe New Windows ================= */
function observeNewWindows() {
  const obs = new MutationObserver(() => {
    if (!editMode) return;
    freezeWindowsToAbsolute();
    bindWindows();
    loadLayout();
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

/* ================= Admin Ready ================= */
function waitForAdminReady() {
  const check = () => {
    if (typeof window.__IS_ADMIN__ !== "undefined") {
      console.log("🟢 Admin erkannt:", window.__IS_ADMIN__);
      refreshAdminButtons();
      setEditMode(false); // Start: Edit AUS
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
  toggleBtn?.addEventListener("click", () => setEditMode(!editMode));

  bindWindows();        // bindet (harmlos) – wirkt nur wenn editMode true
  observeNewWindows();
  waitForAdminReady();

  console.log("✅ admin init done");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
