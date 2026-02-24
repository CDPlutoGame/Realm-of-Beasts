// admin.js (type="module") — Drag & Drop Layout Editor + Save to RTDB

import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

console.log("✅ admin.js geladen");

const db = window.db;
const auth = window.auth;

const saveBtn = document.getElementById("saveLayoutBtn");
const windows = () => Array.from(document.querySelectorAll(".window"));

let editMode = false;

function ensureEditorCSS() {
  if (document.getElementById("layoutEditCss")) return;
  const style = document.createElement("style");
  style.id = "layoutEditCss";
  style.textContent = `
    /* Layout Edit Mode */
    body.layoutEdit #app{
      display:block !important;     /* grid aus */
      position:relative !important;
      min-height:100vh;
    }
    body.layoutEdit .window{
      position:absolute !important; /* frei bewegbar */
      cursor:move;
      user-select:none;
      touch-action:none;
    }
    body.layoutEdit .window::before{
      content:"";
      position:absolute;
      left:0; top:0; right:0;
      height:22px;                 /* Drag-Zone oben */
      background:rgba(178,34,34,0.18);
      border-top-left-radius:12px;
      border-top-right-radius:12px;
      pointer-events:none;
    }
  `;
  document.head.appendChild(style);
}

function show(el, yes) {
  if (!el) return;
  el.style.display = yes ? "inline-block" : "none";
}

function setEditMode(on) {
  editMode = !!on;
  document.body.classList.toggle("layoutEdit", editMode);
  // Button nur sichtbar wenn Admin
  show(saveBtn, !!window.__IS_ADMIN__);
  console.log("🧩 Layout-Edit:", editMode ? "AN" : "AUS");
}

function captureLayout() {
  const layout = {};
  windows().forEach((el) => {
    const id = el.id || el.getAttribute("data-win") || null;
    // wenn kein id vorhanden: gib ihm eins (damit es stabil speichert)
    if (!id) {
      const gen = "win_" + Math.random().toString(36).slice(2, 8);
      el.setAttribute("data-win", gen);
    }
    const key = el.id || el.getAttribute("data-win");
    layout[key] = {
      left: el.style.left || "",
      top: el.style.top || "",
      width: el.style.width || "",
      height: el.style.height || "",
      z: Number(el.style.zIndex || 1),
    };
  });
  return layout;
}

function applyLayout(layout) {
  if (!layout) return;
  windows().forEach((el) => {
    const key = el.id || el.getAttribute("data-win");
    if (!key || !layout[key]) return;
    const s = layout[key];
    if (s.left) el.style.left = s.left;
    if (s.top) el.style.top = s.top;
    if (s.width) el.style.width = s.width;
    if (s.height) el.style.height = s.height;
    if (s.z) el.style.zIndex = String(s.z);
  });
}

async function loadGlobalLayout() {
  try {
    const snap = await get(ref(db, "globalLayout/v1"));
    if (snap.exists()) {
      const layout = snap.val();
      applyLayout(layout);
      console.log("✅ globalLayout geladen");
    } else {
      console.log("ℹ️ globalLayout leer");
    }
  } catch (e) {
    console.log("❌ globalLayout load:", e?.code || e?.message);
  }
}

async function saveGlobalLayout() {
  try {
    if (!window.__IS_ADMIN__) {
      alert("❌ Kein Admin");
      return;
    }
    const layout = captureLayout();
    await set(ref(db, "globalLayout/v1"), layout);
    alert("✅ Layout gespeichert");
  } catch (e) {
    alert("❌ Speichern fehlgeschlagen: " + (e?.code || e?.message));
    console.log("❌ globalLayout save:", e);
  }
}

/* --- Drag logic (Mouse + Touch/Pointer) --- */
let zTop = 1000;

function makeDraggable(el) {
  let dragging = false;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;

  const onDown = (clientX, clientY) => {
    if (!editMode) return;
    dragging = true;
    startX = clientX;
    startY = clientY;

    const r = el.getBoundingClientRect();
    origX = r.left + window.scrollX;
    origY = r.top + window.scrollY;

    zTop += 1;
    el.style.zIndex = String(zTop);
  };

  const onMove = (clientX, clientY) => {
    if (!dragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    el.style.left = (origX + dx) + "px";
    el.style.top  = (origY + dy) + "px";
  };

  const onUp = () => { dragging = false; };

  // Pointer Events (best)
  el.addEventListener("pointerdown", (e) => {
    // nur obere 26px als Drag-Zone
    const rect = el.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y > 26) return;

    el.setPointerCapture?.(e.pointerId);
    onDown(e.clientX, e.clientY);
    e.preventDefault();
  });

  el.addEventListener("pointermove", (e) => {
    onMove(e.clientX, e.clientY);
    if (dragging) e.preventDefault();
  });

  el.addEventListener("pointerup", () => onUp());
  el.addEventListener("pointercancel", () => onUp());
}

/* --- Boot --- */
ensureEditorCSS();

function init() {
  // draggable vorbereiten
  windows().forEach(makeDraggable);

  // Layout laden (immer, auch für Nicht-Admins)
  loadGlobalLayout();

  // Save Button
  saveBtn?.addEventListener("click", saveGlobalLayout);

  // Hotkey: E toggelt Edit-Mode (nur Admin)
  window.addEventListener("keydown", (e) => {
    if (e.key?.toLowerCase() !== "e") return;
    if (!window.__IS_ADMIN__) return;
    setEditMode(!editMode);
  });

  // Startzustand: Edit aus
  setEditMode(false);

  console.log("✅ Layout Editor ready (Admin: drück 'E' zum Bewegen)");
}

// Warten bis DOM da ist
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
