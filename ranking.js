import { db, auth } from "./firebase.js";
import { ref, set, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { meta } from "./profile.js";

export async function renderLeaderboard() {
    const lbEl = document.getElementById("leaderboard");
    if (!lbEl || !auth.currentUser) return;

    // Update eigenen Score vor dem Laden
    const myName = auth.currentUser.email.split('@')[0];
    await set(ref(db, 'ranking/' + auth.currentUser.uid), {
        name: myName,
        monstersKilled: meta.monstersKilled || 0,
        bossesKilled: meta.bossesKilled || 0
    });

    const rankingRef = query(ref(db, 'ranking'), orderByChild('monstersKilled'), limitToLast(5));
    const snapshot = await get(rankingRef);
    
    let html = "<ul>";
    const data = [];
    snapshot.forEach(child => { data.push(child.val()); });
    data.reverse().forEach((user, i) => {
        html += `<li>${i+1}. ${user.name}: 👾 ${user.monstersKilled} | 👑 ${user.bossesKilled}</li>`;
    });
    lbEl.innerHTML = html + "</ul>";
}
