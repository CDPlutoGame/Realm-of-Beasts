<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>CDPluto RPG - Realm</title>
    <style>
        body { 
            background: #000 url('images/dungeon.png') no-repeat center center fixed; 
            background-size: cover; color: #fff; font-family: 'Segoe UI', Arial, sans-serif; 
            text-align: center; margin: 0; padding: 10px; padding-bottom: 220px; overflow-x: hidden;
        }
        #loginOverlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.95); display: flex; justify-content: center; align-items: center; z-index: 10000;
        }
        #loginBox {
            background: #000; border: 3px solid #ff0000; border-radius: 20px;
            box-shadow: 0 0 40px #ff0000, inset 0 0 20px #ff0000; padding: 40px 20px; width: 85%; max-width: 400px;
        }
        .realm-title {
            color: #ff0000; font-size: 32px; font-weight: bold; text-transform: uppercase;
            margin-bottom: 25px; letter-spacing: 5px; text-shadow: 0 0 20px #ff0000;
        }
        #playerNameInput {
            width: 85%; padding: 15px; background: #111; border: 2px solid #ff0000;
            color: #fff; text-align: center; font-size: 20px; border-radius: 10px; margin-bottom: 25px; outline: none;
        }
        #statusPanel { 
            background: rgba(0, 0, 0, 0.85); border: 2px solid #ff0000; border-radius: 12px; 
            padding: 12px; margin-bottom: 10px; box-shadow: 0 0 15px #ff0000;
        }
        #musicControl { background: rgba(0, 0, 0, 0.8); border: 1px solid #444; border-radius: 10px; padding: 8px; margin-bottom: 10px; display: flex; align-items:
