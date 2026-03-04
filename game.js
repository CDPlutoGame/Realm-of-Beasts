let meta = {
    name:"",
    hp:20,
    maxHp:20,
    attack:5,
    gold:0,
    round:1,
    kills:0,
    bestRound:1
};

let board=[];
let pos=0;
let inFight=false;
let monstersInFight=[];
let autoInterval=null;

let bgMusic = new Audio("sounds/music/bg1.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

function changeVolume(val){
    bgMusic.volume = val/100;
}

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
}

function generateBoard(){
    board=[];
    for(let i=0;i<25;i++){

        let roll=Math.random();

        if(roll<0.4){
            board.push("monster");
        }
        else if(roll<0.55){
            board.push("gold");
        }
        else{
            board.push("empty");
        }
    }
    drawBoard();
}

function drawBoard(){
    const b=document.getElementById("board");
    b.innerHTML="";
    board.forEach((e,i)=>{
        const d=document.createElement("div");
        d.className="cell";

        if(i===pos) d.innerText="🧙";
        else if(e==="gold") d.innerText="💰";
        else if(e==="monster"){

            if(meta.round<=15) d.innerText="🐸";
            else if(meta.round<=25) d.innerText="🐺";
            else d.innerText="🐻";
        }
        else d.innerText="⬛";

        b.appendChild(d);
    });
}

function handleAction(){

    if(inFight){
        attack();
        return;
    }

    let steps = Math.floor(Math.random()*4)+1;
    log("Du bewegst dich "+steps+" Felder vorwärts.");
    pos+=steps;

    if(pos>=board.length){
        meta.round++;
        pos=0;
        generateBoard();
        log("Neue Runde beginnt!");
        updateUI();
        return;
    }

    if(board[pos]==="gold"){
        let g=Math.floor(Math.random()*4)+6;
        meta.gold+=g;
        log("Gold gefunden: "+g);
        board[pos]="empty";
    }

    if(board[pos]==="monster"){
        startFight();
    }

    drawBoard();
    updateUI();
}

function createMonster(type){

    let baseHp=10;
    let baseAtk=3;
    let gold=5;

    if(type==="frog"){
        baseHp=10;
        baseAtk=3;
        gold=5;
    }
    if(type==="wolf"){
        baseHp=20;
        baseAtk=6;
        gold=10;
    }
    if(type==="bear"){
        baseHp=35;
        baseAtk=10;
        gold=15;
    }

    let scale = (meta.round-1)*2;

    return {
        type:type,
        hp:baseHp+scale,
        atk:baseAtk+scale,
        gold:gold
    };
}

function startFight(){

    inFight=true;
    monstersInFight=[];

    if(meta.round<=15){

        if(meta.round>=5){
            monstersInFight.push(createMonster("frog"));
            monstersInFight.push(createMonster("frog"));
        }else{
            monstersInFight.push(createMonster("frog"));
        }

    }
    else if(meta.round<=25){

        if(meta.round>=15){
            monstersInFight.push(createMonster("wolf"));
            monstersInFight.push(createMonster("wolf"));
        }else{
            if(Math.random()<0.5){
                monstersInFight.push(createMonster("wolf"));
            }else{
                monstersInFight.push(createMonster("frog"));
                monstersInFight.push(createMonster("frog"));
            }
        }

    }
    else{

        if(meta.round>=22){
            monstersInFight.push(createMonster("bear"));
            monstersInFight.push(createMonster("bear"));
        }else{
            monstersInFight.push(createMonster("bear"));
        }
    }

    renderFight();
}

function renderFight(){

    let html="";

    monstersInFight.forEach(m=>{
        html+=`
        <div>
            <img src="images/${m.type}.png" width="120">
            <p>HP: ${m.hp}</p>
            <p>Kraft: ${m.atk}</p>
        </div>
        `;
    });

    document.getElementById("battlePanel").innerHTML=html;
}

function attack(){

    if(monstersInFight.length===0) return;

    let target=monstersInFight[0];
    target.hp-=meta.attack;
    log("Du triffst "+target.type+" für "+meta.attack);

    if(target.hp<=0){
        log(target.type+" besiegt!");
        meta.gold+=target.gold;
        meta.kills++;
        monstersInFight.shift();
    }

    if(monstersInFight.length===0){
        inFight=false;
        min-height:200px;
        board[pos]="empty";
        document.getElementById("battlePanel").innerHTML=
        "<h3>Die Reise geht weiter...</h3>";
        updateUI();
        return;
    }

    monstersInFight.forEach(m=>{
        meta.hp-=m.atk;
        log(m.type+" trifft dich für "+m.atk);
    });

    if(meta.hp<=0){
        log("Du bist gefallen... Neue Runde beginnt!");
        meta.hp=meta.maxHp;
        meta.round++;
        pos=0;
        inFight=false;
        monstersInFight=[];
        generateBoard();
        updateUI();
        return;
    }

    renderFight();
    updateUI();
}

function updateUI(){

    if(meta.round>meta.bestRound){
        meta.bestRound=meta.round;
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
}
