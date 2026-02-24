// admin.js (type="module") — Drag & Drop + Resize + Save to RTDB (globalLayout/v1)

import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

console.log("✅ admin.js geladen");

const db = window.db;
const saveBtn = document.getElementById("saveLayoutBtn");

let editMode = false;
let zTop = 1000;

function ensureEditorCSS() {
  if (document.getElementById("layoutEditCss")) return;
  const style = document.createElement("style");
  style.id = "layoutEditCss";
  style.textContent = `
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

      /* RESIZE */
      resize: both;
      overflow: auto;
      min-width: 180px;
      min-height: 120px;
    }

    /* Drag-Zone oben */
    body.layoutEdit .window::before{
      content:"";
      position:absolute;
      left:0; top:0; right:0;
      height:26px;
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

function windows() {
  return Array.from(document.querySelectorAll(".window"));
}

function setEditMode(on) {
  editMode = !!on;
  document.body.classList.toggle("layoutEdit", editMode);
  show(saveBtn, !!window.__IS_ADMIN__);
  console.log("🧩 Layout-Edit:", editMode ? "AN" : "AUS");
}

function ensureStableKey(el) {
  if (el.id) return el.id;
  if (el.getAttribute("data-win")) return el.getAttribute("data-win");
  const gen = "win_" + Math.random().toString(36).slice(2, 10);
  el.setAttribute("data-win", gen);
  return gen;
}

function captureLayout() {
  const layout = {};
  windows().forEach((el) => {
    const key = ensureStableKey(el);
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
    const key = ensureStableKey(el);
    const s = layout[key];
    if (!s) return;
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
      applyLayout(snap.val());
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
    await set(ref(db, "globalLayout/v1"), captureLayout());
    alert("✅ Layout gespeichert");
  } catch (e) {
    alert("❌ Speichern fehlgeschlagen: " + (e?.code || e?.message));
    console.log("❌ globalLayout save:", e);
  }
}

/* ---- Drag & Resize handling ---- */
function makeInteractive(el) {
  let dragging = false;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;

  el.addEventListener("pointerdown", (e) => {
    if (!editMode) return;

    // nur Top-Bar (26px) zum Draggen – damit resize (unten rechts) nicht gestört wird
    const rect = el.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y > 26) return;

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const r = el.getBoundingClientRect();
    origX = r.left + window.scrollX;
    origY = r.top + window.scrollY;

    zTop += 1;
    el.style.zIndex = String(zTop);

    el.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = (origX + dx) + "px";
    el.style.top = (origY + dy) + "px";
    e.preventDefault();
  });

  const end = () => (dragging = false);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);

  // Beim Resize (native) nach Loslassen Größe in style schreiben (damit wir speichern können)
  el.addEventListener("pointerup", () => {
    if (!editMode) return;
    const r = el.getBoundingClientRect();
    el.style.width = Math.round(r.width) + "px";
    el.style.height = Math.round(r.height) + "px";
  });
}

/* ---- Boot ---- */
ensureEditorCSS();

function init() {
  windows().forEach(makeInteractive);

  // Layout laden (für alle)
  loadGlobalLayout();

  // Save Button
  saveBtn?.addEventListener("click", saveGlobalLayout);

  // Edit-Mode toggle: Taste "E" (nur Admin)
  window.addEventListener("keydown", (e) => {
    if (e.key?.toLowerCase() !== "e") return;
    if (!window.__IS_ADMIN__) return;
    setEditMode(!editMode);
  });

  setEditMode(false);
  console.log("✅ Layout Editor ready (Admin: 'E' zum Bewegen/Resizen)");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
