// admin.js (type="module")

import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

console.log("✅ admin.js geladen");

const db = window.db;
const saveBtn = document.getElementById("saveLayoutBtn");

let editMode = false;
let zTop = 1000;

/* ================= CSS ================= */

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
      cursor:move;
      user-select:none;
    }

    body.layoutEdit .window::before{
      content:"DRAG (oben ziehen)";
      position:absolute;
      left:0; top:0; right:0;
      height:34px;
      line-height:34px;
      padding-left:10px;
      font-size:12px;
      background:rgba(178,34,34,.25);
      color:#fff;
      pointer-events:none;
    }
  `;
  document.head.appendChild(style);
}

/* ================= Layout Mode ================= */

function setEditMode(on) {
  editMode = !!on;
  document.body.classList.toggle("layoutEdit", editMode);
  if (saveBtn) saveBtn.style.display = editMode ? "inline-block" : "none";

  if (editMode) freezeWindowsToAbsolute();

  console.log("🧩 Layout-Edit:", editMode ? "AN" : "AUS");
}

function freezeWindowsToAbsolute() {
  document.querySelectorAll(".window").forEach((el) => {
    const r = el.getBoundingClientRect();
    el.style.left = r.left + "px";
    el.style.top  = r.top + "px";
    el.style.width = r.width + "px";
    el.style.height = r.height + "px";
  });
}

/* ================= Save / Load ================= */

function captureLayout() {
  const layout = {};
  document.querySelectorAll(".window").forEach((el) => {
    const id = el.id || (el.dataset.win ||= "win_" + Math.random().toString(36).slice(2));
    layout[id] = {
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height,
      z: el.style.zIndex || 1
    };
  });
  return layout;
}

function applyLayout(layout) {
  if (!layout) return;
  document.querySelectorAll(".window").forEach((el) => {
    const id = el.id || el.dataset.win;
    if (!id || !layout[id]) return;
    const s = layout[id];
    el.style.left = s.left;
    el.style.top = s.top;
    el.style.width = s.width;
    el.style.height = s.height;
    el.style.zIndex = s.z;
  });
}

async function loadLayout() {
  try {
    const snap = await get(ref(db, "globalLayout/v1"));
    if (snap.exists()) {
      applyLayout(snap.val());
      console.log("✅ globalLayout geladen");
    }
  } catch (e) {
    console.log("❌ load:", e);
  }
}

async function saveLayout() {
  if (!window.__IS_ADMIN__) return alert("❌ Kein Admin");

  try {
    await set(ref(db, "globalLayout/v1"), captureLayout());
    alert("✅ Layout gespeichert");
  } catch (e) {
    console.log("❌ save:", e);
  }
}

/* ================= Drag ================= */

function makeDraggable(el) {
  if (el.__dragBound) return;
  el.__dragBound = true;

  let dragging = false;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;

  el.addEventListener("mousedown", (e) => {
    if (!editMode) return;

    const rect = el.getBoundingClientRect();
    if (e.clientY - rect.top > 40) return;

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = rect.left;
    origY = rect.top;

    zTop++;
    el.style.zIndex = zTop;
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    el.style.left = origX + (e.clientX - startX) + "px";
    el.style.top  = origY + (e.clientY - startY) + "px";
  });

  window.addEventListener("mouseup", () => dragging = false);
}

function bindWindows() {
  document.querySelectorAll(".window").forEach(makeDraggable);
}

/* ================= Admin Wait ================= */

function waitForAdminReady() {
  const check = () => {
    if (typeof window.__IS_ADMIN__ !== "undefined") {
      console.log("🟢 Admin erkannt:", window.__IS_ADMIN__);
      setEditMode(!!window.__IS_ADMIN__);
    } else {
      setTimeout(check, 200);
    }
  };
  check();
}

/* ================= Init ================= */
function init() {
  ensureCSS();

  bindWindows();
  loadLayout();

  saveBtn?.addEventListener("click", saveLayout);

  const toggleBtn = document.getElementById("toggleEditBtn");

  function refreshAdminButtons() {
    const isAdmin = !!window.__IS_ADMIN__;
    if (toggleBtn) toggleBtn.style.display = isAdmin ? "inline-block" : "none";
    if (saveBtn) saveBtn.style.display = (isAdmin && editMode) ? "inline-block" : "none";
  }

  toggleBtn?.addEventListener("click", () => {
    setEditMode(!editMode);
    refreshAdminButtons();
  });

  function waitForAdminReady() {
    const check = () => {
      if (typeof window.__IS_ADMIN__ !== "undefined") {
        console.log("🟢 Admin erkannt:", window.__IS_ADMIN__);
        setEditMode(false); // Start mit Edit AUS
        refreshAdminButtons();
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  }

  waitForAdminReady();

  console.log("✅ Drag ready");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
