// ===== ONLINE RANKING SYSTEM =====
(function(){

  const API_URL = "https://deine-api-url.com/ranking"; 
  // ← HIER später deine echte URL einsetzen

  function getCurrentUser(){
    return localStorage.getItem("mobileUser") ||
           localStorage.getItem("pcUser");
  }

  async function submitScore(score){

    const user = getCurrentUser();
    if(!user) return;

    try{
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user, score: score })
      });
    }catch(e){
      console.log("Ranking Upload Fehler", e);
    }
  }

  async function loadRanking(){

    try{
      const res = await fetch(API_URL);
      const data = await res.json();

      showRanking(data);
    }catch(e){
      console.log("Ranking Laden Fehler", e);
    }
  }

  function showRanking(list){

    let box = document.getElementById("rankingBox");

    if(!box){
      box = document.createElement("div");
      box.id = "rankingBox";
      box.style.position = "fixed";
      box.style.bottom = "20px";
      box.style.left = "20px";
      box.style.background = "#111";
      box.style.padding = "15px";
      box.style.color = "white";
      box.style.width = "220px";
      box.style.borderRadius = "12px";
      box.style.fontSize = "14px";
      document.body.appendChild(box);
    }

    box.innerHTML = "<b>🏆 Top 10</b><br><br>";

    list
      .sort((a,b)=> b.score - a.score)
      .slice(0,10)
      .forEach((entry,i)=>{
        box.innerHTML +=
          `${i+1}. ${entry.name} - ${entry.score}<br>`;
      });
  }

  // Globale Funktionen für dein Game
  window.RANKING = {
    submitScore,
    loadRanking
  };

})();