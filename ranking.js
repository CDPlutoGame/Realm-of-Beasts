import { db } from "./firebase.js";
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Holt die Top 5 Spieler aus Firebase und rendert sie in den #leaderboard Container.
 * Sortiert nach besiegten Bossen, dann nach normalen Monstern.
 */
export async function renderLeaderboard() {
    const leaderboardEl = document.getElementById("leaderboard");
    if (!leaderboardEl) return;

    try {
        // 1. Abfrage: Top 5 Spieler (Sortiert nach Bossen, dann Monstern)
        const q = query(
            collection(db, "users"),
            orderBy("bossesKilled", "desc"),
            orderBy("monstersKilled", "desc"),
            limit(5)
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            leaderboardEl.innerHTML = "<p style='color:#888;'>Noch keine Helden eingetragen.</p>";
            return;
        }

        let html = `
            <table style="width:100%; border-collapse:collapse; font-size:0.9em;">
                <tr style="border-bottom:1px solid #444; color:#aaa; text-align:left;">
                    <th style="padding:5px;">Spieler</th>
                    <th style="padding:5px; text-align:right;">🐲</th>
                    <th style="padding:5px; text-align:right;">⚔️</th>
                </tr>
        `;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Email kürzen (z.B. p...e@gmail.com) für mobiles Design
            const rawName = data.email || "Anonym";
            const displayName = rawName.includes("@") 
                ? rawName.split("@")[0] 
                : rawName;

            html += `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:8px 5px; color:lime; font-weight:bold;">${displayName}</td>
                    <td style="padding:8px 5px; text-align:right;">${data.bossesKilled || 0}</td>
                    <td style="padding:8px 5px; text-align:right; color:#aaa;">${data.monstersKilled || 0}</td>
                </tr>
            `;
        });

        html += `</table>`;
        leaderboardEl.innerHTML = html;

    } catch (error) {
        console.error("Ranking-Fehler:", error);
        leaderboardEl.innerHTML = "<p style='color:red; font-size:0.8em;'>Ranking momentan nicht verfügbar.</p>";
    }
}
