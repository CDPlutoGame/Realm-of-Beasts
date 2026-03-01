<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Realm of Beasts</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <div id="statusPanel" class="container">Lade Status...</div>

        <div id="shop" class="container"></div>

        <div id="fightPanel" class="container"></div>

        <div id="gameLog" class="container log-container">
            <div id="logContent">🎮 Spiel bereit...</div>
        </div>

        <div id="board" class="board-container"></div>

        <div id="rankingContainer" class="container">
            <div id="leaderboard">Lade Ranking...</div>
        </div>
    </div>

    <script type="module" src="firebase.js"></script>
    <script type="module" src="game.js"></script>
</body>
</html>
