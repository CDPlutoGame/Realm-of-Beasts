function fillNameIntoGame() {
  const st = window.__ONLINE_AUTH__?.status;
  if (!st || !st.loggedIn || !st.nameKey) return;

  // Name speichern
  localStorage.setItem("mbr_current_name_online_v10", st.nameKey);

  // Ins Spiel einsetzen
  const nameInput = document.getElementById("nameInput");
  const nameBtn = document.getElementById("nameConfirmButton");

  if (nameInput) {
    nameInput.value = st.nameKey;
  }

  if (nameBtn) {
    nameBtn.click();
  }
}