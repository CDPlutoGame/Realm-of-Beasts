// admin.js (type="module") — Drag (Mouse+Touch+Pointer) + Save/Load

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
      content:"DRAG";
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

function setEditMode(on) {
  editMode = !!on;
  document.body.classList.toggle("layoutEdit", editMode);
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

// --- DRAG (Pointer + Mouse + Touch Fallback) ---
function makeDraggable(el) {
  let dragging = false;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;

  const begin = (clientX, clientY) => {
    if (!editMode) return;
    dragging = true;
    startX = clientX;
    startY = clientY;
    const r = el.getBoundingClientRect();
    origX = r.left + window.scrollX;
    origY = r.top + window.scrollY;

    zTop += 1;
    el.style.zIndex = String(zTop);
    // wichtig: beim ersten Drag absolute Koordinaten setzen
    el.style.left = origX + "px";
    el.style.top = origY + "px";
  };

  const move = (clientX, clientY) => {
    if (!dragging) return;
    el.style.left = (origX + (clientX - startX)) + "px";
    el.style.top  = (origY + (clientY - startY)) + "px";
  };

  const end = () => { dragging = false; };

  // Pointer (modern)
  el.addEventListener("pointerdown", (e) => {
    // Drag nur in oberem Bereich (Header)
    const rect = el.getBoundingClientRect();
    if ((e.clientY - rect.top) > 40) return;
    el.setPointerCapture?.(e.pointerId);
    begin(e.clientX, e.clientY);
    e.preventDefault();
  });
  el.addEventListener("pointermove", (e) => { move(e.clientX, e.clientY); if (dragging) e.preventDefault(); });
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

  // Touch fallback
  el.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    const rect = el.getBoundingClientRect();
    if ((t.clientY - rect.top) > 40) return;
    begin(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive:false });
  window.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (!t) return;
    move(t.clientX, t.clientY);
    if (dragging) e.preventDefault();
  }, { passive:false });
  window.addEventListener("touchend", end);
}

function init() {
  ensureCSS();
  windows().forEach(makeDraggable);
  saveBtn?.addEventListener("click", saveLayout);
  loadLayout();

  // ✅ WICHTIG: wenn Admin -> Edit sofort AN (damit du nicht erst "E" drücken musst)
  if (window.__IS_ADMIN__) setEditMode(true);
  else setEditMode(false);

  console.log("✅ Drag ready | Admin:", window.__IS_ADMIN__);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
