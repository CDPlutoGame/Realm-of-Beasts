(function(){

  function getStoredName(){
    return localStorage.getItem("mobileUser");
  }

  function askForName(){
    const name = prompt("Gib deinen Namen ein:");
    if(name){
      localStorage.setItem("mobileUser", name);
      showName(name);
    }
  }

  function showName(name){
    const el = document.getElementById("playerName");
    if(el){
      el.textContent = "Spieler: " + name;
    }
  }

  function init(){
    const name = getStoredName();

    if(name){
      showName(name);
    } else {
      askForName();
    }
  }

  document.addEventListener("DOMContentLoaded", init);

})();
