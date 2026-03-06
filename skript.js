const GAME_VERSION = "1.0.1";

// SPIEL-ZUSTAND
let state = {
  beast: 0,
  gold: 0,
  diamonds: 0,
  // ... alle weiteren Variablen
};

// Hier folgen alle deine Funktionen (updateUI, clickBeast, saveGame, etc.)

function updateUI() {
  // ...
}

// Initialisierung am Ende
window.onload = () => {
  loadGame();
  updateUI();
  // ...
};
