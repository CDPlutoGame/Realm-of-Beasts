let meta = {
    name:"",
    hp:20,
    maxHp:20,
    attack:5,
    gold:0,
    round:1,
    autoRun:0,
    kills:0,
    bestRound:1
};

let board=[];
let pos=0;
let inFight=false;
let monster=null;
let autoInterval=null;

let bgMusic = new Audio("sounds/music/bg1.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

const monsters=[
    {name:"frog",hp:10,atk:3,gold:5},
    {name:"wolf",hp:15,atk:4,gold:8},
    {name:"bear",hp:25,atk:6,gold:15}
];

function log(msg){
    const l=document.getElementById("log");
    l.innerHTML+=msg+"<br>";
    l.scrollTop=l.scrollHeight;
}

function startGame(){
    const name=document.getElementById("nameInput").value.trim();
    if(!name) return alert("Name eingeben!");
    meta.name=name;
    document.getElementById("loginOverlay").style.display="none";
    bgMusic.play().catch(()=>{});
    generateBoard();
    updateUI();
    log("Willkommen im Realm...");
}

function generateBoard(){
    board=[];
    for(let i=0;i<29;i++){
        board.push(Math.random()<0.4?"monster":"empty");
    }
    board.push("boss");
    drawBoard();
}

function drawBoard(){
    const b=document.getElementById("board");
    b.innerHTML="";
    board.forEach((e,i)=>{
        const d=document.createElement("div");
        d.className="cell";

        if(i===pos){
            d.innerText="🧙";
        }else{
            if(board[i]==="monster") d.innerText="👹";
            else if(board[i]==="boss") d.innerText="👑";
            else d.innerText="⬛";
        }

        b.appendChild(d);
    });
}

function handleAction(){
    if(inFight){
        attack();
        return;
    }

    pos++;

    if(pos>=board.length){
        log("Runde geschafft!");
        meta.round++;
        pos=0;
        generateBoard();
        return;
    }

    if(board[pos]==="monster") startFight(false);
    if(board[pos]==="boss") startFight(true);

    drawBoard();
    updateUI();
}

function startFight(isBoss){
    inFight=true;

    if(isBoss){
        monster={name:"boss",hp:40+meta.round*10,atk:8,gold:50};
    }else{
        const m=monsters[Math.floor(Math.random()*monsters.length)];
        monster={...m};
        monster.hp+=meta.round*3;
    }

    renderFight();
    log("Ein "+monster.name+" erscheint!");
}

function renderFight(){
    const panel=document.getElementById("battlePanel");
    panel.innerHTML=`
        <h3>${monster.name.toUpperCase()}</h3>
        <img src="images/${monster.name}.png">
        <p>HP: ${monster.hp}</p>
    `;
}

function attack(){
    monster.hp-=meta.attack;
    log("Du triffst für "+meta.attack);

    if(monster.hp<=0){
        log("Monster besiegt!");
        meta.gold+=monster.gold;
        meta.kills++;
        inFight=false;
        monster=null;
        updateUI();
        return;
    }

    meta.hp-=monster.atk;
    log(monster.name+" trifft dich für "+monster.atk);

    if(meta.hp<=0){
        log("Du bist gefallen... Neue Runde beginnt!");
        meta.hp = meta.maxHp;
        meta.round++;
        pos = 0;
        inFight = false;
        monster = null;
        generateBoard();
        drawBoard();
        updateUI();
        return;
    }

    renderFight();
    updateUI();
}

function updateUI(){

    if(meta.round > meta.bestRound){
        meta.bestRound = meta.round;
    }

    document.getElementById("statusPanel").innerHTML=`
<b>STATUS</b><br>
<span style="color:lime">${meta.name}</span> |
<span style="color:red">HP: ${meta.hp}/${meta.maxHp}</span> |
<span style="color:gold">Gold: ${meta.gold}</span> |
<span style="color:red">Angriff: ${meta.attack}</span> |
<span style="color:red">Runde: ${meta.round}</span> |
<span style="color:red">Kills: ${meta.kills}</span> |
<span style="color:red">Best: ${meta.bestRound}</span>
`;

    renderShop();
}

function renderShop(){
    document.getElementById("shop").innerHTML=`
        <button onclick="buyHp()">+5 Max HP (50G)</button>
        <button onclick="buyAtk()">+2 Angriff (50G)</button>
        <button onclick="buyAuto()">AutoRun Upgrade (1000G)</button>
    `;
}

function buyHp(){
    if(meta.gold<50)return;
    meta.gold-=50;
    meta.maxHp+=5;
    meta.hp+=5;
    updateUI();
}

function buyAtk(){
    if(meta.gold<50)return;
    meta.gold-=50;
    meta.attack+=2;
    updateUI();
}

function buyAuto(){
    if(meta.gold<1000)return;
    meta.gold-=1000;
    meta.autoRun++;
    startAutoRun();
    updateUI();
}

function startAutoRun(){
    if(autoInterval) clearInterval(autoInterval);
    autoInterval=setInterval(()=>{
        handleAction();
    },1000-Math.min(meta.autoRun*150,700));
}
