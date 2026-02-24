// admin.js (type="module") — Drag (PC+Touch) + Save/Load + auto-bind for late windows

import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

console.log("✅ admin.js geladen");

const db = window.db;
const saveBtn = document.getElementById("saveLayoutBtn");

let editMode = false;
let zTop = 1000;

function ensureCSS() {
  if (document.getElementById("layoutEditCss")) return;
  const style = document.createElement("style");
  style.id = "layoutEditCss";
  style.textContent = `
    body.layoutEdit #app{
      display:block !important;
      position:relative !important;
      min-height:100vh;
    }
    body.layoutEdit .window{
      position:absolute !important;
      user-select:none;
      touch-action:none;
      cursor:move;
    }
    body.layoutEdit .window::before{
      content:"DRAG (oben ziehen)";
      position:absolute;
      left:0; top:0; right:0;
      height:34px;
      line-height:34px;
      padding-left:10px;
      font-size:12px;
      color:rgba(255,255,255,.85);
      background:rgba(178,34,34,.25);
      border-top-left-radius:12px;
      border-top-right-radius:12px;
      pointer-events:none;
      z-index:99999;
    }
  `;
  document.head.appendChild(style);
}

function show(el, yes) {
  if (!el) return;
  el.style.display = yes ? "inline-block" : "none";
}

function windows() {
  return Array.from(document.querySelectorAll(".window"));
}

function ensureKey(el) {
  if (el.id) return el.id;
  if (el.getAttribute("data-win")) return el.getAttribute("data-win");
  const gen = "win_" + Math.random().toString(36).slice(2, 10);
  el.setAttribute("data-win", gen);
  return gen;
}

/** wichtig: beim Umschalten auf absolute die aktuelle Grid-Position “einfrieren” */
function freezeWindowsToAbsolute() {
  windows().forEach((el) => {
    const r = el.getBoundingClientRect();
    el.style.left = (r.left + window.scrollX) + "px";
    el.style.top  = (r.top  + window.scrollY) + "px";
    // optional: Größe mitschreiben, damit’s stabil bleibt
    if (!el.style.width) el.style.width = Math.round(r.width) + "px";
    if (!el.style.height) el.style.height = Math.round(r.height) + "px";
  });
}

function setEditMode(on) {
  editMode = !!on;
  document.body.classList.toggle("layoutEdit", editMode);

  if (editMode) {
    // 🔥 das ist der entscheidende Schritt
    freezeWindowsToAbsolute();
    // und sicherstellen, dass alle (auch spätere) windows Listener haben
    bindAllWindows();
  }

  show(saveBtn, !!window.__IS_ADMIN__);
  console.log("🧩 Layout-Edit:", editMode ? "AN" : "AUS");
}

function applyLayout(layout) {
  if (!layout) return;
  windows().forEach((el) => {
    const key = ensureKey(el);
    const s = layout[key];
    if (!s) return;
    if (s.left) el.style.left = s.left;
    if (s.top) el.style.top = s.top;
    if (s.width) el.style.width = s.width;
    if (s.height) el.style.height = s.height;
    if (s.z) el.style.zIndex = String(s.z);
  });
}

function captureLayout() {
  const out = {};
  windows().forEach((el) => {
    const key = ensureKey(el);
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

async function loadLayout() {
  try {
    const snap = await get(ref(db, "globalLayout/v1"));
    if (snap.exists()) applyLayout(snap.val());
    console.log("✅ globalLayout geladen");
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
    console.log("❌ save:", e);
    alert("❌ Speichern fehlgeschlagen: " + (e?.code || e?.message));
  }
}

// --- DRAG (Pointer + Mouse) ---
function makeDraggable(el) {
  if (el.__dragBound) return; // ✅ nicht doppelt binden
  el.__dragBound = true;

  let dragging = false;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;

  const begin = (clientX, clientY) => {
    if (!editMode) return;
    dragging = true;

    const r = el.getBoundingClientRect();
    origX = r.left + window.scrollX;
    origY = r.top + window.scrollY;
    startX = clientX;
    startY = clientY;

    zTop += 1;
    el.style.zIndex = String(zTop);

    // beim ersten Mal sicher setzen
    el.style.left = origX + "px";
    el.style.top  = origY + "px";
  };

  const move = (clientX, clientY) => {
    if (!dragging) return;
    el.style.left = (origX + (clientX - startX)) + "px";
    el.style.top  = (origY + (clientY - startY)) + "px";
  };

  const end = () => { dragging = false; };

  // Pointer
  el.addEventListener("pointerdown", (e) => {
    const rect = el.getBoundingClientRect();
    if ((e.clientY - rect.top) > 40) return; // nur oben ziehen
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

  // Mouse fallback
  el.addEventListener("mousedown", (e) => {
    const rect = el.getBoundingClientRect();
    if ((e.clientY - rect.top) > 40) return;
    begin(e.clientX, e.clientY);
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
  window.addEventListener("mouseup", end);
}

function bindAllWindows() {
  windows().forEach(makeDraggable);
}

// 🔥 beobachtet DOM: wenn game.js später windows erstellt, werden sie automatisch draggable
function observeNewWindows() {
  const obs = new MutationObserver(() => {
    if (!editMode) return;
    bindAllWindows();
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

function init() {
  ensureCSS();

  saveBtn?.addEventListener("click", saveLayout);
  loadLayout();

  // Observer starten
  observeNewWindows();

  // Wenn Admin: Edit direkt an
  setEditMode(!!window.__IS_ADMIN__);

  console.log("✅ Drag ready | Admin:", window.__IS_ADMIN__);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
