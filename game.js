'use strict';

// ============================================================
// AUDIO SYSTEM — Playlist + Zuggeräusch
// ============================================================

const PLAYLIST_TRACKS = [
  {file:'music/1.mp3', name:'Track 1'},
  {file:'music/2.mp3', name:'Track 2'},
  {file:'music/3.mp3', name:'Track 3'},
  {file:'music/4.mp3', name:'Track 4'},
  {file:'music/5.mp3', name:'Track 5'},
];
let plIndex    = 0;
let musicEnabled = true;
let bgmStarted   = false;
let isPlaying    = false;
const BGM = new Audio();
BGM.volume = 0.3;

// Zuggeräusch — kurzer Klick-Ton generiert via Web Audio API
let audioCtx = null;
function playMoveSound(){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime+0.08);
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+0.12);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime+0.12);
  }catch(e){}
}

function loadTrack(idx){
  BGM.src = PLAYLIST_TRACKS[idx].file;
  BGM.load();
  const el = document.getElementById('track-name');
  if(el) el.textContent = PLAYLIST_TRACKS[idx].name;
}

BGM.addEventListener('ended', ()=>{
  plIndex = (plIndex+1) % PLAYLIST_TRACKS.length;
  loadTrack(plIndex);
  if(musicEnabled){ BGM.play().catch(()=>{}); }
});

BGM.addEventListener('play', ()=>{ isPlaying=true; updatePlayBtn(); });
BGM.addEventListener('pause', ()=>{ isPlaying=false; updatePlayBtn(); });

loadTrack(0);

function updatePlayBtn(){
  const btn = document.getElementById('play-pause-btn');
  if(btn) btn.textContent = isPlaying ? '⏸' : '▶️';
}

function startBGM(){
  if(!bgmStarted && musicEnabled){
    BGM.play().catch(()=>{});
    bgmStarted = true;
  } else if(musicEnabled && BGM.paused){
    BGM.play().catch(()=>{});
  }
}

function togglePlayPause(){
  if(BGM.paused){ BGM.play().catch(()=>{}); musicEnabled=true; }
  else { BGM.pause(); musicEnabled=false; }
  const btn = document.getElementById('music-btn');
  if(btn){ btn.textContent=musicEnabled?'🎵':'🔇'; btn.style.color=musicEnabled?'#c8a000':'#444'; }
}

function prevTrack(){
  plIndex = (plIndex - 1 + PLAYLIST_TRACKS.length) % PLAYLIST_TRACKS.length;
  loadTrack(plIndex);
  if(musicEnabled) BGM.play().catch(()=>{});
}

function nextTrack(){
  plIndex = (plIndex+1) % PLAYLIST_TRACKS.length;
  loadTrack(plIndex);
  if(musicEnabled) BGM.play().catch(()=>{});
}

function setVolume(val){
  BGM.volume = val/100;
}

function toggleMusic(){
  musicEnabled = !musicEnabled;
  const btn = document.getElementById('music-btn');
  if(musicEnabled){ BGM.play().catch(()=>{}); if(btn){btn.textContent='🎵';btn.style.color='#c8a000';} }
  else { BGM.pause(); if(btn){btn.textContent='🔇';btn.style.color='#444';} }
}

function playSound(){ /* kein SFX */ }

// ============================================================
// CHESS ENGINE
// ============================================================

const CHESS_SYMS = {
  wK:'\u2654',wQ:'\u2655',wR:'\u2656',wB:'\u2657',wN:'\u2658',wP:'\u2659',
  bK:'\u265A',bQ:'\u265B',bR:'\u265C',bB:'\u265D',bN:'\u265E',bP:'\u265F'
};
const PIECE_VAL = {K:20000,Q:900,R:500,B:330,N:320,P:100};

function initBoard(){
  const b=Array.from({length:8},()=>Array(8).fill(null));
  const back=['R','N','B','Q','K','B','N','R'];
  back.forEach((t,c)=>{
    b[0][c]={t,col:'b',moved:false};
    b[7][c]={t,col:'w',moved:false};
  });
  for(let c=0;c<8;c++){
    b[1][c]={t:'P',col:'b',moved:false};
    b[6][c]={t:'P',col:'w',moved:false};
  }
  return b;
}

function cloneBoard(b){ return b.map(r=>r.map(p=>p?{...p}:null)); }
function inB(r,c){ return r>=0&&r<8&&c>=0&&c<8; }

function getPseudoMoves(board,row,col,lastMove,skipCastle){
  const piece=board[row][col]; if(!piece) return [];
  const {t,col:color}=piece;
  const enemy=color==='w'?'b':'w';
  const moves=[];
  function slide(dr,dc){
    let r=row+dr,c=col+dc;
    while(inB(r,c)){
      if(board[r][c]){if(board[r][c].col===enemy)moves.push({fr:row,fc:col,tr:r,tc:c});break;}
      moves.push({fr:row,fc:col,tr:r,tc:c});
      r+=dr;c+=dc;
    }
  }
  function jump(dr,dc){
    const r=row+dr,c=col+dc;
    if(inB(r,c)&&(!board[r][c]||board[r][c].col===enemy))moves.push({fr:row,fc:col,tr:r,tc:c});
  }
  switch(t){
    case 'P':{
      const dir=color==='w'?-1:1;
      const sRow=color==='w'?6:1;
      if(inB(row+dir,col)&&!board[row+dir][col]){
        moves.push({fr:row,fc:col,tr:row+dir,tc:col});
        if(row===sRow&&!board[row+2*dir][col])moves.push({fr:row,fc:col,tr:row+2*dir,tc:col,dbl:true});
      }
      // pawnStrike: white pawn can also capture straight forward
      if(chess.pawnStrike&&color==='w'&&inB(row+dir,col)&&board[row+dir][col]?.col===enemy)
        moves.push({fr:row,fc:col,tr:row+dir,tc:col});
      [-1,1].forEach(dc=>{
        if(inB(row+dir,col+dc)){
          if(board[row+dir][col+dc]?.col===enemy)moves.push({fr:row,fc:col,tr:row+dir,tc:col+dc});
          if(lastMove?.dbl&&lastMove.tr===row&&lastMove.tc===col+dc)
            moves.push({fr:row,fc:col,tr:row+dir,tc:col+dc,ep:true});
        }
      });
      break;
    }
    case 'N':[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>jump(dr,dc));break;
    case 'B':[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>slide(dr,dc));break;
    case 'R':[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>slide(dr,dc));break;
    case 'Q':[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>slide(dr,dc));break;
    case 'K':
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>jump(dr,dc));
      if(!piece.moved&&!skipCastle){
        const rr=color==='w'?7:0;
        if(board[rr][7]?.t==='R'&&!board[rr][7].moved&&!board[rr][5]&&!board[rr][6]){
          if(!isInCheck(board,color)&&!sqAttacked(board,rr,5,enemy)&&!sqAttacked(board,rr,6,enemy))
            moves.push({fr:row,fc:col,tr:rr,tc:6,castle:'k'});
        }
        if(board[rr][0]?.t==='R'&&!board[rr][0].moved&&!board[rr][1]&&!board[rr][2]&&!board[rr][3]){
          if(!isInCheck(board,color)&&!sqAttacked(board,rr,3,enemy)&&!sqAttacked(board,rr,2,enemy))
            moves.push({fr:row,fc:col,tr:rr,tc:2,castle:'q'});
        }
      }
      break;
  }
  return moves;
}

function applyMove(board,move){
  const nb=cloneBoard(board);
  const piece=nb[move.fr][move.fc];
  nb[move.tr][move.tc]={...piece,moved:true};
  nb[move.fr][move.fc]=null;
  if(move.ep){const dir=piece.col==='w'?1:-1;nb[move.tr+dir][move.tc]=null;}
  if(move.castle==='k'){nb[move.tr][5]={...nb[move.tr][7],moved:true};nb[move.tr][7]=null;}
  else if(move.castle==='q'){nb[move.tr][3]={...nb[move.tr][0],moved:true};nb[move.tr][0]=null;}
  if(piece.t==='P'&&(move.tr===0||move.tr===7)){
    // Auto-promote to Queen for AI; for human we flag as pending (handled in doMove)
    if(move.promTo)nb[move.tr][move.tc].t=move.promTo;
    else nb[move.tr][move.tc].t='Q';
  }
  return nb;
}

function findKing(board,color){
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]?.t==='K'&&board[r][c]?.col===color)return[r,c];
  return null;
}

function sqAttacked(board,row,col,byColor){
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(board[r][c]?.col===byColor&&getPseudoMoves(board,r,c,null,true).some(m=>m.tr===row&&m.tc===col))return true;
  return false;
}

function isInCheck(board,color){
  const king=findKing(board,color);if(!king)return false;
  return sqAttacked(board,king[0],king[1],color==='w'?'b':'w');
}

function getLegalMoves(board,row,col,lastMove){
  const piece=board[row][col];if(!piece)return[];
  return getPseudoMoves(board,row,col,lastMove).filter(m=>!isInCheck(applyMove(board,m),piece.col));
}

function getAllLegalMoves(board,color,lastMove){
  const moves=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(board[r][c]?.col===color)moves.push(...getLegalMoves(board,r,c,lastMove));
  return moves;
}

// Piece-square tables for positional evaluation
const PST = {
  P: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
  ],
  N: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  B: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  R: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [ 0,  0,  0,  5,  5,  0,  0,  0]
  ],
  Q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  K: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

function evalBoard(board){
  let score=0;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=board[r][c];if(!p)continue;
    const pv=PIECE_VAL[p.t]||0;
    const pr=p.col==='b'?PST[p.t]?.[r]?.[c]||0:PST[p.t]?.[7-r]?.[c]||0;
    const contrib=pv+pr;
    score+=(p.col==='b'?1:-1)*contrib;
  }
  return score;
}

// Order moves: captures first (MVV-LVA), then by PST gain
function orderMoves(moves,board){
  return moves.slice().sort((a,b)=>{
    const ca=board[a.tr][a.tc],cb=board[b.tr][b.tc];
    const va=ca?(PIECE_VAL[ca.t]||0):0;
    const vb=cb?(PIECE_VAL[cb.t]||0):0;
    return vb-va;
  });
}

function minimax(board,depth,alpha,beta,isMax,lastMove){
  const color=isMax?'b':'w';
  const moves=getAllLegalMoves(board,color,lastMove);
  if(moves.length===0){
    if(isInCheck(board,color))return isMax?-30000:30000;
    return 0; // stalemate
  }
  if(depth===0)return evalBoard(board);
  const ordered=orderMoves(moves,board);
  if(isMax){
    let best=-Infinity;
    for(const m of ordered){
      const nb=applyMove(board,m);
      const v=minimax(nb,depth-1,alpha,beta,false,m);
      if(v>best)best=v;
      if(v>alpha)alpha=v;
      if(beta<=alpha)break;
    }
    return best;
  } else {
    let best=Infinity;
    for(const m of ordered){
      const nb=applyMove(board,m);
      const v=minimax(nb,depth-1,alpha,beta,true,m);
      if(v<best)best=v;
      if(v<beta)beta=v;
      if(beta<=alpha)break;
    }
    return best;
  }
}

// Returns AI difficulty settings based on current rank
function getAIDifficulty(){
  const idx=G.rankIdx; // 0=Amateur3 ... 20=Legende
  // Tiefe: 1 bei Amateur, bis 4 bei Legende
  const depth=idx<=2?1:idx<=5?2:idx<=11?3:4;
  // Jitter: viel Zufall bei niedrigem Rang, kaum bei hohem
  // Amateur: ±120, Bronze: ±80, Silber: ±40, Gold: ±20, Platin+: ±8, Meister+: ±2
  const jitter=idx<=2?120:idx<=5?80:idx<=8?40:idx<=11?20:idx<=17?8:2;
  // Blunder-Chance: manchmal absichtlich schlechten Zug wählen
  // Amateur: 35%, Bronze: 20%, Silber: 10%, Gold: 4%, Platin+: 0%
  const blunderChance=idx<=2?0.35:idx<=5?0.20:idx<=8?0.10:idx<=11?0.04:0;
  return{depth,jitter,blunderChance};
}

function getAIMove(board,lastMove,frozenSquares){
  let moves=getAllLegalMoves(board,'b',lastMove);if(!moves.length)return null;
  if(frozenSquares&&frozenSquares.length){
    moves=moves.filter(m=>!frozenSquares.some(f=>f.r===m.tr&&f.c===m.tc));
    if(!moves.length)return null;
  }
  const{depth,jitter,blunderChance}=getAIDifficulty();

  // Blunder: pick a random legal move instead
  if(Math.random()<blunderChance){
    return moves[Math.floor(Math.random()*moves.length)];
  }

  const ordered=orderMoves(moves,board);
  let best=null,bestScore=-Infinity;
  for(const m of ordered){
    const nb=applyMove(board,m);
    const v=minimax(nb,depth,-Infinity,Infinity,false,m);
    const j=(Math.random()-0.5)*jitter*2;
    if(v+j>bestScore){bestScore=v+j;best=m;}
  }
  return best;
}

// ============================================================
// COLLECTION DATA
// ============================================================

// Rang-Namen pro Figuren-Typ (5 Ränge = 5 Seltenheitsstufen)
const PIECE_RANKS = {
  bauer:    ['Abenteurer',          'S\u00F6ldner',       'Ritter',            'Elite-Ritter',         'K\u00F6nigsgarde'         ],
  turm:     ['Steinw\u00E4chter',   'Felskrieger',        'Eisenkoloss',       'Runengolem',           'Titan der Festung'        ],
  laeufer:  ['Schattenl\u00E4ufer', 'Meuchelm\u00F6rder','Schattenklinge',    'Phantomassassine',     'Meister der Schatten'     ],
  springer: ['Lehrling',            'Paladin',            'Ordensritter',      'Heiligkrieger',        'Champion des Lichts'      ],
  dame:     ['Zauberin',            'Elementar-Magierin', 'Erzmagierin',       'Arkanmeisterin',       'G\u00F6ttliche Erzmagierin'],
  koenig:   ['Anf\u00FChrer',       'Kriegsherr',         'Gro\u00DFkommandant','Kaiser',              'Legend\u00E4rer K\u00F6nig']
};

// Fähigkeits-% skaliert mit Rang (Index 0-4)
const ABILITY_SCALE = [5, 10, 18, 28, 40];

const COLL_PIECES = {
  bauer_s:  {group:'bauer',name:'Bauer',variant:'Speerträger', chess:'\u2659',baseHP:65,baseATK:22,abilityId:'pawn_spear',   abilityLabel:'Schildblock',   desc:'Blockiert Angreifer / droht diagonal.'},
  bauer_b:  {group:'bauer',name:'Bauer',variant:'Bogenschütze',chess:'\u2659',baseHP:55,baseATK:28,abilityId:'pawn_bow',     abilityLabel:'Fernschuss',    desc:'Schlägt diagonal ohne Bewegung.'},
  bauer_sh: {group:'bauer',name:'Bauer',variant:'Schildträger',chess:'\u2659',baseHP:85,baseATK:18,abilityId:'pawn_shield',  abilityLabel:'Schutzschild',  desc:'Gibt einer Nachbarfigur Schutz.'},
  bauer_a:  {group:'bauer',name:'Bauer',variant:'Assassine',   chess:'\u2659',baseHP:50,baseATK:38,abilityId:'pawn_assassin',abilityLabel:'Schattenschlag',desc:'Schlägt verdeckt / teleportiert.'},
  bauer_be: {group:'bauer',name:'Bauer',variant:'Berserker',   chess:'\u2659',baseHP:70,baseATK:42,abilityId:'pawn_berserk', abilityLabel:'Raserei',       desc:'Extra-Zug nach Schlag / schlägt rückwärts.'},
  bauer_h:  {group:'bauer',name:'Bauer',variant:'Heiler',      chess:'\u2659',baseHP:72,baseATK:15,abilityId:'pawn_heal',    abilityLabel:'Heilung',       desc:'Bringt geschlagene Bauern zurück.'},
  turm_s:     {group:'turm',    name:'Turm',     variant:'Schildträger',   chess:'\u2656', baseHP:200, baseATK:40, abilityId:'rook_shield',  abilityLabel:'Schutzwall',     desc:'Turm kann 2 Züge nicht geschlagen werden.'                  },
  laeufer_d:  {group:'laeufer', name:'Läufer',   variant:'Dolchträger',    chess:'\u2657', baseHP:90,  baseATK:45, abilityId:'bishop_stab',  abilityLabel:'Dolchstoß',      desc:'Entfernt sofort die wertvollste benachbarte Gegnerfigur.'    },
  springer_m: {group:'springer',name:'Springer', variant:'Magier', chess:'\u2658', baseHP:110, baseATK:50, abilityId:'knight_magic', abilityLabel:'Arkaner Sprung', desc:'R1:2 Zufalls | R2:3 Zufalls | R3:2 wählbar | R4:3 wählbar | R5:5 wählbar (Kurve)'},
  dame_f:     {group:'dame',    name:'Dame',     variant:'Feuer',          chess:'\u2655', baseHP:130, baseATK:75, abilityId:'queen_fire',   abilityLabel:'Feuerball',      desc:'Schlägt alle Gegner im Umkreis von 2 Feldern.'               },
  dame_w:     {group:'dame',    name:'Dame',     variant:'Wasser',         chess:'\u2655', baseHP:150, baseATK:55, abilityId:'queen_water',  abilityLabel:'Flutwelle',      desc:'Schiebt alle benachbarten Feinde 2 Felder zurück.'           },
  dame_e:     {group:'dame',    name:'Dame',     variant:'Erde',           chess:'\u2655', baseHP:170, baseATK:45, abilityId:'queen_earth',  abilityLabel:'Steinwall',      desc:'Alle eigenen Figuren sind 1 Zug unschlagbar.'                },
  dame_l:     {group:'dame',    name:'Dame',     variant:'Luft',           chess:'\u2655', baseHP:120, baseATK:65, abilityId:'queen_air',    abilityLabel:'Windstoß',       desc:'Dame darf sich sofort ein zweites Mal bewegen.'              },
  dame_v:     {group:'dame',    name:'Dame',     variant:'Vita',           chess:'\u2655', baseHP:145, baseATK:50, abilityId:'queen_vita',   abilityLabel:'Lebensquell',    desc:'Bringt die zuletzt geschlagene eigene Figur zurück.'         },
  dame_p:     {group:'dame',    name:'Dame',     variant:'Physisch',       chess:'\u2655', baseHP:145, baseATK:70, abilityId:'queen_phys',   abilityLabel:'Donnerschlag',   desc:'Entfernt sofort die wertvollste Gegnerfigur auf dem Brett.'  },
  koenig_b: {group:'koenig', name:'K00f6nig', variant:'Buff', chess:'\u2654', baseHP:160, baseATK:45, abilityId:'king_buff', abilityLabel:'K00f6nigstausch', desc:'Tausche den K00f6nig 1x mit einer Nachbarfigur 2014 danach noch normal ziehen.'},
};

// Rang-Multipliers (Rang 1-5 = normal/blau/epic/legendar/mystisch)
const RARITIES = {
  normal:   {label:'Rang 1', color:'#6aaa6a', bg:'#050f05', glow:'#6aaa6a33', hpMult:1.0,  atkMult:1.0  },
  blau:     {label:'Rang 2', color:'#4488ff', bg:'#00091a', glow:'#4488ff33', hpMult:1.6,  atkMult:1.5  },
  epic:     {label:'Rang 3', color:'#bb55ff', bg:'#0a0018', glow:'#bb55ff33', hpMult:2.6,  atkMult:2.3  },
  legendar: {label:'Rang 4', color:'#ffd700', bg:'#150d00', glow:'#ffd70044', hpMult:4.2,  atkMult:3.8  },
  mystisch: {label:'Rang 5', color:'#ff4488', bg:'#18000c', glow:'#ff448844', hpMult:7.0,  atkMult:6.5  }
};
const RARITY_ORDER=['normal','blau','epic','legendar','mystisch'];

function getPieceRankName(pieceGroup, rarityKey) {
  const idx = RARITY_ORDER.indexOf(rarityKey);
  return PIECE_RANKS[pieceGroup]?.[idx] || rarityKey;
}

function getPieceStats(cp, rarityKey, level) {
  const rd = RARITIES[rarityKey];
  const lv = 1 + (level-1)*0.15;
  return {
    hp:  Math.floor(cp.baseHP  * rd.hpMult  * lv),
    atk: Math.floor(cp.baseATK * rd.atkMult * lv),
    parry: ABILITY_SCALE[RARITY_ORDER.indexOf(rarityKey)]
  };
}

const RANKS=[
  {name:'Amateur',     tier:3,winsNeeded:3, color:'#888888'},
  {name:'Amateur',     tier:2,winsNeeded:3, color:'#888888'},
  {name:'Amateur',     tier:1,winsNeeded:3, color:'#888888'},
  {name:'Bronze',      tier:3,winsNeeded:4, color:'#cd7f32'},
  {name:'Bronze',      tier:2,winsNeeded:4, color:'#cd7f32'},
  {name:'Bronze',      tier:1,winsNeeded:4, color:'#cd7f32'},
  {name:'Silber',      tier:3,winsNeeded:5, color:'#c0c0c0'},
  {name:'Silber',      tier:2,winsNeeded:5, color:'#c0c0c0'},
  {name:'Silber',      tier:1,winsNeeded:5, color:'#c0c0c0'},
  {name:'Gold',        tier:3,winsNeeded:6, color:'#ffd700'},
  {name:'Gold',        tier:2,winsNeeded:6, color:'#ffd700'},
  {name:'Gold',        tier:1,winsNeeded:6, color:'#ffd700'},
  {name:'Platin',      tier:3,winsNeeded:7, color:'#00e5ff'},
  {name:'Platin',      tier:2,winsNeeded:7, color:'#00e5ff'},
  {name:'Platin',      tier:1,winsNeeded:7, color:'#00e5ff'},
  {name:'Diamant',     tier:3,winsNeeded:8, color:'#66ccff'},
  {name:'Diamant',     tier:2,winsNeeded:8, color:'#66ccff'},
  {name:'Diamant',     tier:1,winsNeeded:8, color:'#66ccff'},
  {name:'Meister',     tier:0,winsNeeded:10,color:'#ff9900'},
  {name:'Grandmeister',tier:0,winsNeeded:12,color:'#ff4444'},
  {name:'Legende',     tier:0,winsNeeded:null,color:'#ff88ff'}
];

// Figur-Gewichte: Bauer häufigst → Turm → Läufer=Springer → König → Dame (seltenst bei JEDEM Rang)
const PIECE_WEIGHTS={
  bauer_s:9, bauer_b:8, bauer_sh:8, bauer_a:7, bauer_be:7, bauer_h:7,
  turm_s:25, laeufer_d:13, springer_m:13, koenig_b:7,
  dame_f:2, dame_w:2, dame_e:2, dame_l:2, dame_v:2, dame_p:2
};
const CHEST_TYPES={
  normal:   {name:'Normale Kiste',   cost:5,  emoji:'\uD83D\uDCE6'},
  epic:     {name:'Epische Kiste',   cost:20,  emoji:'\uD83D\uDC9C'},
  legendary:{name:'Legendäre Kiste', cost:100, emoji:'\uD83D\uDC51'}
};
function buildPool(){
  const pool=[];
  Object.keys(PIECE_WEIGHTS).forEach(pid=>{for(let i=0;i<PIECE_WEIGHTS[pid];i++)pool.push(pid);});
  return pool;
}
function pickPid(pool){return pool[Math.floor(Math.random()*pool.length)];}
function guaranteedDrop(rankIdx,pool){
  const pid=pickPid(pool);addToInventory(pid,rankIdx);
  return{pid,rarityKey:RARITY_ORDER[rankIdx],rankIdx};
}
function randomDrop(rates,pool){
  const pid=pickPid(pool);
  let roll=Math.random(),cum=0,rarityKey='normal';
  for(const[r,chance] of rates){cum+=chance;if(roll<cum){rarityKey=r;break;}}
  const rankIdx=RARITY_ORDER.indexOf(rarityKey);
  addToInventory(pid,rankIdx);return{pid,rarityKey,rankIdx};
}

// ============================================================
// GAME STATE
// ============================================================

let G={keys:3,rankIdx:0,winStreak:0,lossStreak:0,inventory:null,totalFights:0,totalWins:0,selectedDame:'v',
  questStats:null, questDone:{}
};

let chess={
  board:null,turn:'w',lastMove:null,selected:null,validMoves:[],
  status:'idle',moveLog:[],
  abilitiesLeft:{},         // abilityId -> true(avail)/false(used)
  frozenSquares:[],         // [{r,c,turns}] - can't be captured
  frozenEnemy:false,        // KI kann diesen Zug nicht ziehen
  extraMove:false,          // player gets extra move
  pawnStrike:false,         // pawn can capture forward
  capturedByAI:[],capturedByPlayer:[],
  timerInterval:null,timerSec:60,hintMove:null,hintAIMove:null,
  promotionPending:null,    // {r,c} awaiting promotion choice
  knightAbilityPending:null, // {rankIdx, knights, selectedKnight, targets}
  abilityUsedThisGame:false,  // tracks if any ability was used
  kingSwapPending:false,      // king swap mode active
  burningSquares:[],          // [{r,c,turnsLeft}] Feuer R5 — stirbt nach N Zügen
  vitaSelectPending:null,     // R5 Vita Auswahl
  waterRowSelectPending:null  // R4 Wasser Reihenauswahl
};

const MOVE_TIME=60;

function startMoveTimer(){
  stopMoveTimer();
  chess.timerSec=MOVE_TIME;
  const lbl=q('#move-timer');
  if(lbl){lbl.style.display='block';lbl.style.color='#ffd700';}
  chess.timerInterval=setInterval(()=>{
    chess.timerSec--;
    const col=chess.timerSec>20?'#ffd700':chess.timerSec>10?'#ff9900':'#ff4444';
    if(lbl){lbl.textContent=chess.timerSec;lbl.style.color=col;}
    if(chess.timerSec<=0){stopMoveTimer();if(chess.status==='playing'&&chess.turn==='w'){setStatus('Zeit abgelaufen! KI zieht...','#ff4444');chess.turn='b';setTimeout(()=>aiTurn(),400);}}
  },1000);
}

function stopMoveTimer(){
  if(chess.timerInterval){clearInterval(chess.timerInterval);chess.timerInterval=null;}
  const lbl=q('#move-timer');
  if(lbl)lbl.style.display='none';
}

// ============================================================
// DRAW / GEDANKEN MODE
// ============================================================
let drawMode=false;
let drawColor='#ffd700';
let drawSize=4;
let isDrawing=false;
let lastDrawX=0,lastDrawY=0;

function setDrawColor(col){
  drawColor=col;
  document.querySelectorAll('#draw-colors div').forEach(d=>{
    const bg=d.style.background;
    d.style.border=bg===col?'2px solid #fff':'2px solid transparent';
    d.style.boxShadow=bg===col?'0 0 6px '+col+'88':'none';
  });
}

function toggleDrawMode(){
  drawMode=!drawMode;
  const canvas=q('#draw-canvas');
  const toolbar=q('#draw-toolbar');
  const btn=q('#draw-btn');
  if(!canvas||!toolbar||!btn)return;
  if(drawMode){
    const board=q('#chess-board');
    const rect=board.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    canvas.width=rect.width*dpr;
    canvas.height=rect.height*dpr;
    canvas.style.width=rect.width+'px';
    canvas.style.height=rect.height+'px';
    const ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    canvas.style.display='block';
    toolbar.style.display='flex';
    btn.style.borderColor='#ffd700';btn.style.color='#ffd700';btn.style.background='#1a1200';
    btn.textContent='\u270F\uFE0F AN \u2014 Brett zeichnen';
    setupDrawEvents(canvas);
  } else {
    canvas.style.display='none';
    toolbar.style.display='none';
    btn.style.borderColor='#c8a000';btn.style.color='#c8a000';btn.style.background='#0d0900';
    btn.textContent='\u270F\uFE0F GEDANKEN';
    removeDrawEvents(canvas);
  }
}

function clearDrawCanvas(){
  const canvas=q('#draw-canvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function getDrawPos(canvas,e){
  const rect=canvas.getBoundingClientRect();
  const src=e.touches?e.touches[0]:e;
  return{x:src.clientX-rect.left,y:src.clientY-rect.top};
}

function onDrawStart(e){
  e.preventDefault();
  isDrawing=true;
  const canvas=q('#draw-canvas');
  const pos=getDrawPos(canvas,e);
  lastDrawX=pos.x;lastDrawY=pos.y;
  const ctx=canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(pos.x,pos.y,drawSize/2,0,Math.PI*2);
  ctx.fillStyle=drawColor;
  ctx.globalAlpha=0.85;
  ctx.fill();
}
function onDrawMove(e){
  if(!isDrawing)return;
  e.preventDefault();
  const canvas=q('#draw-canvas');
  const ctx=canvas.getContext('2d');
  const pos=getDrawPos(canvas,e);
  ctx.beginPath();
  ctx.moveTo(lastDrawX,lastDrawY);
  ctx.lineTo(pos.x,pos.y);
  ctx.strokeStyle=drawColor;
  ctx.lineWidth=drawSize;
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.globalAlpha=0.85;
  ctx.stroke();
  lastDrawX=pos.x;lastDrawY=pos.y;
}
function onDrawEnd(){isDrawing=false;}

function setupDrawEvents(c){
  c.addEventListener('mousedown',onDrawStart);
  c.addEventListener('mousemove',onDrawMove);
  c.addEventListener('mouseup',onDrawEnd);
  c.addEventListener('mouseleave',onDrawEnd);
  c.addEventListener('touchstart',onDrawStart,{passive:false});
  c.addEventListener('touchmove',onDrawMove,{passive:false});
  c.addEventListener('touchend',onDrawEnd);
}
function removeDrawEvents(c){
  c.removeEventListener('mousedown',onDrawStart);
  c.removeEventListener('mousemove',onDrawMove);
  c.removeEventListener('mouseup',onDrawEnd);
  c.removeEventListener('mouseleave',onDrawEnd);
  c.removeEventListener('touchstart',onDrawStart);
  c.removeEventListener('touchmove',onDrawMove);
  c.removeEventListener('touchend',onDrawEnd);
}

function save(){localStorage.setItem('cw_v4',JSON.stringify(G));}
function load(){
  try{
    const d=localStorage.getItem('cw_v4')||localStorage.getItem('cw_v3');
    if(d){G=JSON.parse(d);if(G.collection&&!G.inventory){G.inventory=defaultInventory();}delete G.collection;if(!G.selectedDame)G.selectedDame='v';}
  }catch(e){}
  initQuestStats();
}

const BOARD_NEEDS={bauer:8,turm:2,laeufer:2,springer:2,dame:1,koenig:1};
const COMBINE_COST=10;

function defaultInventory(){
  return{
    bauer:   {s:[4,0,0,0,0],b:[0,0,0,0,0],sh:[0,0,0,0,0],a:[0,0,0,0,0],be:[0,0,0,0,0],h:[0,0,0,0,0]},
    turm:    {s:[2,0,0,0,0]},
    laeufer: {d:[2,0,0,0,0]},
    springer:{m:[2,0,0,0,0]},
    dame:    {f:[0,0,0,0,0],w:[0,0,0,0,0],e:[0,0,0,0,0],l:[0,0,0,0,0],v:[1,0,0,0,0],p:[0,0,0,0,0]},
    koenig:  {b:[1,0,0,0,0]}
  };
}

function getTotalPieces(group){
  if(!G.inventory?.[group])return 0;
  const inv=G.inventory[group];
  let total=0;
  Object.values(inv).forEach(arr=>{if(Array.isArray(arr))arr.forEach(c=>total+=c);});
  return total;
}

function canRankUp(group,variant,rankIdx){
  if(rankIdx>=4)return false;
  const count=(G.inventory?.[group]?.[variant]?.[rankIdx])||0;
  if(count<COMBINE_COST)return false;
  return(getTotalPieces(group)-COMBINE_COST+1)>=BOARD_NEEDS[group];
}

function doRankUp(group,variant,rankIdx){
  if(!canRankUp(group,variant,rankIdx))return false;
  G.inventory[group][variant][rankIdx]-=COMBINE_COST;
  G.inventory[group][variant][rankIdx+1]=(G.inventory[group][variant][rankIdx+1]||0)+1;
  save();return true;
}

function addToInventory(pid,rankIdx){
  const cp=COLL_PIECES[pid];if(!cp)return;
  const v=pidVariant(pid);
  if(!G.inventory)G.inventory=defaultInventory();
  if(!G.inventory[cp.group])G.inventory[cp.group]={s:[0,0,0,0,0],a:[0,0,0,0,0]};
  G.inventory[cp.group][v][rankIdx]=(G.inventory[cp.group][v][rankIdx]||0)+1;
}

function getEloRankName(){const r=RANKS[G.rankIdx];return r.tier>0?r.name+' '+r.tier:r.name;}

function initStarters(){
  if(G.inventory)return;
  G.inventory=defaultInventory();
  save();
}

function openChest(type){
  const chest=CHEST_TYPES[type];
  if(G.keys<chest.cost)return null;
  G.keys-=chest.cost;
  const pool=buildPool();
  const results=[];

  if(type==='normal'){
    // Genau 5x Rang1 + 2x Rang2 (blau)
    for(let i=0;i<5;i++)results.push(guaranteedDrop(0,pool));
    for(let i=0;i<2;i++)results.push(guaranteedDrop(1,pool));

  }else if(type==='epic'){
    // +5 garantierte Rang1
    for(let i=0;i<5;i++)results.push(guaranteedDrop(0,pool));
    // 5 zufällige: Rang2 oft (80%), Rang3 selten (20%)
    const rates=[['blau',.80],['epic',.20]];
    for(let i=0;i<5;i++)results.push(randomDrop(rates,pool));

  }else if(type==='legendary'){
    // +10 garantierte Rang1
    for(let i=0;i<10;i++)results.push(guaranteedDrop(0,pool));
    // +5 garantierte Rang2
    for(let i=0;i<5;i++)results.push(guaranteedDrop(1,pool));
    // 1× Rang4 (70%) oder Rang5 (30%)
    const highRank=Math.random()<0.7?3:4;
    results.push(guaranteedDrop(highRank,pool));
  }

  save();
  return results;
}

function getPromotionKeys(newRankIdx){
  // Jede Liga-Gruppe gibt +5 Schlüssel mehr:
  // Amateur(0-2)=5, Bronze(3-5)=10, Silber(6-8)=15, Gold(9-11)=20,
  // Platin(12-14)=25, Diamant(15-17)=30, Meister(18)=35, Grandmeister(19)=40, Legende(20)=45
  const ligaIdx=Math.floor(newRankIdx/3);
  return 5+(ligaIdx*5);
}

function onWin(){
  G.winStreak++;G.lossStreak=0;G.totalWins++;G.totalFights++;
  const rank=RANKS[G.rankIdx];
  const keys=1+Math.floor(G.rankIdx/3);
  G.keys+=keys;
  let promoted=false;
  let promotionKeys=0;
  if(rank.winsNeeded&&G.winStreak>=rank.winsNeeded&&G.rankIdx<RANKS.length-1){
    G.rankIdx++;G.winStreak=0;promoted=true;
    promotionKeys=getPromotionKeys(G.rankIdx);
    G.keys+=promotionKeys;
  }
  // Quest max streak tracking
  if(!G.questStats)initQuestStats();
  G.questStats.maxWinStreak=Math.max(G.questStats.maxWinStreak||0,G.winStreak);
  save();return{keys,promoted,promotionKeys};
}

function onLoss(){
  G.winStreak=0;G.lossStreak++;G.totalFights++;
  let demoted=false;
  if(G.lossStreak>=2&&G.rankIdx>0){
    G.rankIdx--;G.lossStreak=0;G.winStreak=0;demoted=true;
  }
  save();return{demoted};
}

// ============================================================
// CHESS UI
// ============================================================

function startNewGame(){
  chess.board=initBoard();

  // Weisse Figuren nach tatsächlichem Besitz aus pregameSetup setzen
  const ownedCount={};
  ['turm','springer','laeufer','dame','koenig','bauer'].forEach(group=>{
    const slots=pregameSetup[group]||[];
    const max=PREGAME_GROUP_SLOTS[group]||1;
    ownedCount[group]=Math.min(slots.length,max);
  });

  // Grundlinie aufbauen
  const backLayout=[
    {pos:0,group:'turm',   t:'R'},
    {pos:7,group:'turm',   t:'R'},
    {pos:1,group:'springer',t:'N'},
    {pos:6,group:'springer',t:'N'},
    {pos:2,group:'laeufer', t:'B'},
    {pos:5,group:'laeufer', t:'B'},
    {pos:3,group:'dame',    t:'Q'},
    {pos:4,group:'koenig',  t:'K'},
  ];
  for(let c=0;c<8;c++) chess.board[7][c]=null;
  const used={turm:0,springer:0,laeufer:0,dame:0,koenig:0};
  backLayout.forEach(({pos,group,t})=>{
    if(used[group]===undefined)used[group]=0;
    if(used[group]<ownedCount[group]){
      const sel=(pregameSetup[group]||[])[used[group]]||{v:'s',ri:0};
      chess.board[7][pos]={t,col:'w',moved:false,variant:sel.v,rankIdx:sel.ri};
      used[group]++;
    }
  });

  // Bauern: immer genau 8, Lücken mit verfügbaren Rang1-Bauern auffüllen
  for(let c=0;c<8;c++) chess.board[6][c]=null;
  const pawnSlots=(pregameSetup['bauer']||[]).slice(0,8);
  // Lücken auffüllen: fehlende Slots mit ersten verfügbaren Bauer-Varianten füllen
  if(pawnSlots.length<8 && G.inventory?.bauer){
    const variants=['s','b','sh','a','be','h'];
    for(const v of variants){
      if(pawnSlots.length>=8)break;
      const ri0=(G.inventory.bauer[v]||[0])[0];
      const ri1=(G.inventory.bauer[v]||[0,0])[1];
      const ri2=(G.inventory.bauer[v]||[0,0,0])[2];
      const bestRi=ri2>0?2:ri1>0?1:ri0>0?0:-1;
      if(bestRi>=0){
        // Nicht doppelt hinzufügen was schon in pawnSlots ist
        const already=pawnSlots.filter(p=>p.v===v).length;
        const avail=(G.inventory.bauer[v]||[])[bestRi]||0;
        for(let x=already;x<avail&&pawnSlots.length<8;x++){
          pawnSlots.push({v,ri:bestRi});
        }
      }
    }
  }
  for(let i=0;i<Math.min(pawnSlots.length,8);i++){
    const sel=pawnSlots[i]||{v:'s',ri:0};
    chess.board[6][i]={t:'P',col:'w',moved:false,variant:sel.v,rankIdx:sel.ri};
  }

  chess.turn='w';chess.lastMove=null;chess.selected=null;chess.validMoves=[];hidePieceAbilityPanel();
  chess.status='playing';chess.moveLog=[];
  chess.frozenSquares=[];chess.frozenEnemy=false;chess.extraMove=false;chess.pawnStrike=false;chess.promotionPending=null;chess.knightAbilityPending=null;chess._pawnsCapturedThisGame=0;chess.abilityUsedThisGame=false;chess.kingSwapPending=false;
  chess.capturedByAI=[];chess.capturedByPlayer=[];
  // NEUES FÄHIGKEITSPUNKTE-SYSTEM:
  // 5 Punkte pro Spiel, jede Figur hat eigene Fähigkeit, kein globales Blockieren
  chess.abilityPoints=5;
  chess.usedAbilityPositions=new Set(); // "r_c" Schlüssel bereits genutzter Figuren
  // abilitiesLeft: alle true — Kontrolle nur noch via abilityPoints
  chess.abilitiesLeft={};
  Object.keys(COLL_PIECES).forEach(pid=>{chess.abilitiesLeft[COLL_PIECES[pid].abilityId]=true;});
  q('#game-result').style.display='none';
  // Reset draw mode
  if(drawMode)toggleDrawMode();
  clearDrawCanvas();
  setStatus('Dein Zug \u2014 W\u00E4hle eine Figur','#ffd700');
  // Show AI difficulty in log
  const{depth,blunderChance}=getAIDifficulty();
  const diffLabel=G.rankIdx<=2?'Anf\u00e4nger':G.rankIdx<=5?'Leicht':G.rankIdx<=8?'Mittel':G.rankIdx<=11?'Stark':G.rankIdx<=17?'Experte':'Meister';
  const diffEmoji=G.rankIdx<=2?'\uD83D\uDFE2':G.rankIdx<=5?'\uD83D\uDFE1':G.rankIdx<=8?'\uD83D\uDFE0':G.rankIdx<=11?'\uD83D\uDD34':G.rankIdx<=17?'\uD83D\uDFE3':'\u2B1B';
  chess.moveLog.push({text:diffEmoji+' KI-St\u00e4rke: '+diffLabel+' (Tiefe '+depth+(blunderChance>0?', Fehlerrate '+(blunderChance*100).toFixed(0)+'%':'')+')',ai:false,special:true});
  renderBoard();
  renderMoveLog();
  renderAbilities();
  renderCaptured();
  startMoveTimer();
  const hb=q('#draw-btn');if(hb)hb.style.display='block';
  const rb=q('#resign-btn');if(rb)rb.style.display='block';
  const hn=q('#hint-btn');if(hn)hn.style.display='block';
}

function playerResign(){
  if(chess.status!=='playing')return;
  if(!confirm('Wirklich aufgeben? 🏳️'))return;
  chess.status='checkmate';
  chess.moveLog.push({text:'🏳️ Du hast aufgegeben!',ai:false,special:true});
  showResult(false,'Du hast aufgegeben! KI gewinnt. 🏳️');
}

function setStatus(text,color){
  const el=q('#chess-status');if(!el)return;
  el.textContent=text;el.style.color=color||'#c8a000';
}

function renderBoard(){
  const el=q('#chess-board');if(!el)return;
  el.innerHTML='';
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const cell=document.createElement('div');
      cell.className='chess-cell '+(((r+c)%2===0)?'cell-light':'cell-dark');
      const isSel=chess.selected?.row===r&&chess.selected?.col===c;
      const isValid=chess.validMoves.some(m=>m.tr===r&&m.tc===c);
      const isLastMove=chess.lastMove&&((chess.lastMove.fr===r&&chess.lastMove.fc===c)||(chess.lastMove.tr===r&&chess.lastMove.tc===c));
      const isFrozen=chess.frozenSquares.some(f=>f.r===r&&f.c===c);
      // King in check highlight
      const piece0=chess.board[r][c];
      const isKingInCheck=piece0?.t==='K'&&piece0?.col==='w'&&isInCheck(chess.board,'w');
      const isEnemyKingInCheck=piece0?.t==='K'&&piece0?.col==='b'&&isInCheck(chess.board,'b');
      if(isSel)cell.classList.add('cell-selected');
      else if(isKingInCheck||isEnemyKingInCheck)cell.classList.add('cell-check');
      else if(isLastMove)cell.classList.add('cell-last');
      if(isFrozen)cell.classList.add('cell-frozen');
      // King swap pending highlights
      if(chess.kingSwapPending){
        const ksp=chess.kingSwapPending;
        if(r===ksp.kr&&c===ksp.kc)cell.style.background='rgba(255,220,0,0.55)';
        if(ksp.neighbors.some(n=>n.r===r&&n.c===c))cell.style.background='rgba(255,120,255,0.45)';
      }
      // Knight ability pending highlights
      if(chess.knightAbilityPending){
        const kap=chess.knightAbilityPending;
        if(!kap.selectedKnight){
          // Highlight selectable knights
          if(kap.knights.some(k=>k.r===r&&k.c===c))
            cell.style.background='rgba(255,180,0,0.45)';
        } else {
          // Highlight selected knight
          if(kap.selectedKnight.r===r&&kap.selectedKnight.c===c)
            cell.style.background='rgba(255,220,0,0.55)';
          // Highlight jump targets
          if(kap.targets&&kap.targets.some(t=>t.r===r&&t.c===c))
            cell.style.background='rgba(100,255,180,0.45)';
        }
      }
      // Valid move indicator
      if(isValid){
        const ind=document.createElement('div');
        const hasPiece=chess.board[r][c];
        ind.className=hasPiece?'move-capture':'move-dot';
        cell.appendChild(ind);
        // Danger indicator: which enemy piece can recapture here after move
        const moveObj=chess.validMoves.find(m=>m.tr===r&&m.tc===c);
        if(moveObj){
          const afterBoard=applyMove(chess.board,moveObj);
          let dangerPiece=null,minVal=99999;
          for(let dr=0;dr<8;dr++)for(let dc=0;dc<8;dc++){
            const p=afterBoard[dr][dc];
            if(p?.col==='b'&&getPseudoMoves(afterBoard,dr,dc,null,true).some(m=>m.tr===r&&m.tc===c)){
              const v=PIECE_VAL[p.t]||0;
              if(v<minVal){minVal=v;dangerPiece=p;}
            }
          }
          if(dangerPiece){
            const warn=document.createElement('div');
            warn.className='move-danger';
            warn.textContent=CHESS_SYMS['b'+dangerPiece.t];
            cell.appendChild(warn);
          }
        }
      }
      // Piece
      const piece=chess.board[r][c];
      if(piece){
        const sp=document.createElement('span');
        sp.className='chess-piece '+(piece.col==='w'?'pw':'pb');
        sp.textContent=CHESS_SYMS[piece.col+piece.t];
        // Rang-Farbe für weiße Figuren
        if(piece.col==='w'&&piece.rankIdx!=null){
          const rar=RARITY_ORDER[piece.rankIdx];
          const col=RARITIES[rar]?.color||'#ffffff';
          sp.style.color=col;
          sp.style.filter='drop-shadow(0 0 5px '+col+'88)';
        }
        if(chess.lastMove&&((chess.lastMove.tr===r&&chess.lastMove.tc===c)))sp.classList.add('piece-moved');
        sp.onclick=()=>handleClick(r,c);
        cell.appendChild(sp);
        // Bauer-Varianten-Label
        if(piece.col==='w'&&piece.t==='P'&&piece.variant){
          const vmap={s:'⚔️',b:'🏹',sh:'🛡',a:'🗡',be:'😤',h:'💚'};
          const vlbl=document.createElement('div');
          vlbl.style.cssText='font-size:6px;line-height:1;text-align:center;margin-top:-2px;pointer-events:none;';
          vlbl.textContent=vmap[piece.variant]||'';
          cell.appendChild(vlbl);
        }
        // Brennen-Indikator (Feuer R5)
        if(chess.burningSquares?.some(b=>b.r===r&&b.c===c)){
          const bs=chess.burningSquares.find(b=>b.r===r&&b.c===c);
          const flbl=document.createElement('div');
          flbl.style.cssText='position:absolute;top:1px;right:1px;font-size:8px;line-height:1;pointer-events:none;';
          flbl.textContent='🔥'+bs.turnsLeft;
          cell.appendChild(flbl);
        }
      }
      // Coord labels (col a-h on bottom row, row 1-8 on left col)
      if(r===7){
        const lbl=document.createElement('div');
        lbl.className='coord-c';lbl.textContent='abcdefgh'[c];
        cell.appendChild(lbl);
      }
      if(c===0){
        const lbl=document.createElement('div');
        lbl.className='coord-r';lbl.textContent=8-r;
        cell.appendChild(lbl);
      }
      cell.onclick=()=>handleClick(r,c);
      el.appendChild(cell);
    }
  }
}

function handleClick(r,c){
  // King swap pending: intercept all clicks
  if(chess.kingSwapPending){
    const ksp=chess.kingSwapPending;
    const isNeighbor=ksp.neighbors.some(n=>n.r===r&&n.c===c);
    if(isNeighbor){
      const king=chess.board[ksp.kr][ksp.kc];
      const piece=chess.board[r][c];
      chess.board[r][c]={...king,moved:true};
      chess.board[ksp.kr][ksp.kc]={...piece,moved:true};
      chess.abilitiesLeft['king_buff']=false;
      chess.kingSwapPending=false;
      chess.extraMove=true;
      chess.moveLog.push({text:'♔ Königstausch! König tauscht mit '+('abcdefgh'[c])+(8-r)+' — jetzt noch normal ziehen!',ai:false,special:true});
      renderBoard();renderMoveLog();renderAbilities();
    } else {
      chess.kingSwapPending=false;
      chess.abilitiesLeft['king_buff']=true;
      renderBoard();renderAbilities();
    }
    return;
  }
  // Knight ability pending: intercept all clicks
  if(chess.knightAbilityPending){handleKnightAbilityClick(r,c);return;}
  if(chess.status!=='playing'||chess.turn!=='w')return;
  const piece=chess.board[r][c];
  // Click valid destination
  if(chess.selected&&chess.validMoves.some(m=>m.tr===r&&m.tc===c)){
    const move=chess.validMoves.find(m=>m.tr===r&&m.tc===c);
    hidePieceAbilityPanel();
    doMove(move,false);
    return;
  }
  // Select own piece
  if(piece&&piece.col==='w'){
    chess.selected={row:r,col:c};
    chess.validMoves=getLegalMoves(chess.board,r,c,chess.lastMove);
    renderBoard();
    showPieceAbilityPanel(r,c,piece);
  } else {
    chess.selected=null;chess.validMoves=[];hidePieceAbilityPanel();
    hidePieceAbilityPanel();
    renderBoard();
  }
}

// Maps chess piece type to collection group
const PIECE_TYPE_TO_GROUP={P:'bauer',R:'turm',B:'laeufer',N:'springer',Q:'dame',K:'koenig'};

// ── Figur-Fähigkeits-Panel ─────────────────────────────────────
// Zeigt beim Anklicken einer Figur ihre spezifische Fähigkeit
// und die verbleibenden Fähigkeitspunkte. Jede Figur = eigene Fähigkeit.
function showPieceAbilityPanel(r, c, piece){
  const el = q('#piece-ability-panel');
  if(!el) return;

  const group = PIECE_TYPE_TO_GROUP[piece.t];
  if(!group){ el.style.display='none'; return; }

  const pg = PIECE_GROUPS.find(p=>p.group===group);
  if(!pg){ el.style.display='none'; return; }

  const ri       = piece.rankIdx ?? 0;
  const variant  = piece.variant || pidVariant(pg.pids[0]);
  const pid      = pg.pids.find(p=>pidVariant(p)===variant) || pg.pids[0];
  const cp       = COLL_PIECES[pid];
  if(!cp){ el.style.display='none'; return; }

  const rar      = RARITY_ORDER[ri] || RARITY_ORDER[0];
  const rd       = RARITIES[rar];
  const abilData = RANK_ABILITIES[pid]?.[ri];
  const rankName = getPieceRankName(group, rar);
  const posKey   = r+'_'+c;
  const coord    = 'abcdefgh'[c]+(8-r);

  const pts      = chess.abilityPoints ?? 0;
  const alreadyUsed = chess.usedAbilityPositions?.has(posKey);
  const canUse   = pts > 0 && !alreadyUsed && chess.turn==='w' && chess.status==='playing';

  // Punkte-Dots
  let dotHtml = '';
  for(let i=0;i<5;i++){
    const filled = i < pts;
    dotHtml += '<div style="width:10px;height:10px;border-radius:50%;background:'
      +(filled?'#ffd700':'#1a1000')+';border:1px solid '+(filled?'#ffd700':'#2a2000')
      +';box-shadow:'+(filled?'0 0 5px #ffd70088':'none')+'"></div>';
  }

  el.style.display = 'block';
  el.style.borderColor = rd.color;
  el.innerHTML =
    // Header: Figur-Info + Punkte
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
      +'<div style="display:flex;align-items:center;gap:7px">'
        +'<span style="font-size:1.5rem;color:'+rd.color+';filter:drop-shadow(0 0 8px '+rd.color+'88)">'+cp.chess+'</span>'
        +'<div>'
          +'<div style="font-size:.68rem;color:'+rd.color+';font-weight:bold;letter-spacing:1px">'+cp.variant+'</div>'
          +'<div style="font-size:.48rem;color:#5a4020;letter-spacing:.5px">'+rankName+' · '+coord+'</div>'
        +'</div>'
      +'</div>'
      +'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">'
        +'<div style="display:flex;gap:3px">'+dotHtml+'</div>'
        +'<div style="font-size:.44rem;color:'+(pts>0?'#ffd700':'#555')+'">'+pts+' / 5 Punkte</div>'
      +'</div>'
    +'</div>'

    // Aktiv-Fähigkeit
    +'<div style="background:#0d0800;border-radius:6px;padding:6px 8px;margin-bottom:5px">'
      +'<div style="font-size:.44rem;color:#ffd700;letter-spacing:1px;margin-bottom:2px">⚡ AKTIV — '+(abilData?.label||cp.abilityLabel)+' ('+rankName+')</div>'
      +'<div style="font-size:.57rem;color:#fff8e0;line-height:1.45">'+(abilData?.aktiv||cp.desc)+'</div>'
    +'</div>'

    // Passiv
    +(abilData?.passiv
      ?'<div style="background:#080e04;border-radius:6px;padding:5px 8px;margin-bottom:7px">'
          +'<div style="font-size:.44rem;color:#aa8800;letter-spacing:1px;margin-bottom:2px">★ PASSIV</div>'
          +'<div style="font-size:.54rem;color:#ccaa00;line-height:1.4">'+abilData.passiv+'</div>'
        +'</div>'
      :'<div style="margin-bottom:7px"></div>')

    // Aktivier-Button
    +'<button id="pap-use-btn" onclick="usePieceAbility(\''+pid+'\','+r+','+c+')" '
      +'style="width:100%;padding:9px;border-radius:8px;font-size:.63rem;font-weight:bold;letter-spacing:1px;'
      +(canUse
        ? 'cursor:pointer;background:linear-gradient(135deg,#1a0800,#2a1200);border:1px solid '+rd.color+';color:'+rd.color+';box-shadow:0 0 12px '+rd.color+'44;text-shadow:0 0 6px '+rd.color+'88;'
        : 'cursor:default;background:#0d0800;border:1px solid #1a1000;color:#2a2000;')
      +'" '+(canUse?'':'disabled')+'>'
      +(canUse
        ? '⚡ '+(abilData?.label||cp.abilityLabel).toUpperCase()+' EINSETZEN (-1 Punkt)'
        : alreadyUsed
          ? '✓ Diese Figur hat bereits ihre Fähigkeit eingesetzt'
          : pts<=0
            ? '✗ Keine Fähigkeitspunkte mehr übrig'
            : '— Nicht verfügbar')
    +'</button>'

    // Schließen
    +'<div style="text-align:right;margin-top:4px">'
      +'<button onclick="hidePieceAbilityPanel()" style="background:none;border:none;color:#2a1a00;font-size:.52rem;cursor:pointer">✕ Schließen</button>'
    +'</div>';
}

function hidePieceAbilityPanel(){
  const el = q('#piece-ability-panel');
  if(el) el.style.display = 'none';
}

function usePieceAbility(pid, r, c){
  if(!chess.abilityPoints || chess.abilityPoints <= 0) return;
  const posKey = r+'_'+c;
  if(chess.usedAbilityPositions?.has(posKey)) return;
  if(chess.turn !== 'w' || chess.status !== 'playing') return;

  const piece = chess.board[r]?.[c];
  if(!piece || piece.col !== 'w') return;

  const cp = COLL_PIECES[pid];
  if(!cp) return;

  // Punkt abziehen
  chess.abilityPoints--;
  chess.abilityUsedThisGame = true;
  if(!chess.usedAbilityPositions) chess.usedAbilityPositions = new Set();
  chess.usedAbilityPositions.add(posKey);

  // rankIdx dieser konkreten Figur auf dem Brett
  const ri = piece.rankIdx ?? 0;

  hidePieceAbilityPanel();
  renderAbilityPoints();

  // Fähigkeit auslösen
  useAbilityForPiece(cp.abilityId, ri, r, c, cp.desc);
}

// Disable abilities whose figure is no longer on the board
function updateAbilitiesAfterCapture(){
  Object.keys(COLL_PIECES).forEach(pid=>{
    const cp=COLL_PIECES[pid];
    const v=pidVariant(pid);
    if(cp.group==='dame'&&v!==G.selectedDame)return;
    if(!chess.abilitiesLeft[cp.abilityId])return;
    const entry=Object.entries(PIECE_TYPE_TO_GROUP).find(([,g])=>g===cp.group);
    if(!entry)return;
    const pieceType=entry[0];
    let stillOnBoard=false;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      if(chess.board[r][c]?.t===pieceType&&chess.board[r][c]?.col==='w'){stillOnBoard=true;break;}
    }
    if(!stillOnBoard)chess.abilitiesLeft[cp.abilityId]=false;
  });
}

function doMove(move,isAI){
  startBGM(); // Musik beim ersten Zug starten
  const piece=chess.board[move.fr][move.fc];
  const captured=chess.board[move.tr][move.tc];
  if(captured){
    if(isAI)chess.capturedByAI.push(captured);
    else{
      chess.capturedByPlayer.push(captured);
      trackQuestStat('captures',1);
      if(captured.t==='R')trackQuestStat('capturedRooks',1);
      if(captured.t==='Q')trackQuestStat('capturedQueens',1);
      if(captured.t==='P'){chess._pawnsCapturedThisGame=(chess._pawnsCapturedThisGame||0)+1;if(chess._pawnsCapturedThisGame>=3)trackQuestStat('cap3PawnGame',1);}
    }
    if(!isAI) playSound('capture');
  } else {
    if(!isAI) playMoveSound();
  }
  // Log
  const fc='abcdefgh'[move.fc],fr=8-move.fr;
  const tc='abcdefgh'[move.tc],tr=8-move.tr;
  const sym=CHESS_SYMS[(isAI?'b':'w')+piece.t];
  let log=sym+' '+fc+fr+'\u2192'+tc+tr;
  if(captured)log+=' \u00D7'+CHESS_SYMS[(isAI?'w':'b')+captured.t];
  if(move.castle)log+=' (Rochade)';
  chess.moveLog.push({text:log,ai:isAI});
  // Quest: castle
  if(!isAI&&move.castle)trackQuestStat('castles',1);

  // Human pawn promotion: show selection UI
  if(!isAI&&piece.t==='P'&&move.tr===0){
    chess.board=applyMove(chess.board,move); // temporarily apply (as Q)
    chess.lastMove=move;
    chess.selected=null;chess.validMoves=[];hidePieceAbilityPanel();
    chess.frozenSquares=chess.frozenSquares.map(f=>{
      if(f.r===move.fr&&f.c===move.fc)return{r:move.tr,c:move.tc,turns:f.turns-1};
      return{...f,turns:f.turns-1};
    }).filter(f=>f.turns>0);
    chess.pawnStrike=false;
    chess.promotionPending={r:move.tr,c:move.tc,move};
    stopMoveTimer();
    renderBoard();renderMoveLog();renderCaptured();
    showPromotionUI(move.tr,move.tc);
    return;
  }

  chess.board=applyMove(chess.board,move);
  chess.lastMove=move;
  chess.selected=null;chess.validMoves=[];hidePieceAbilityPanel();

  // If AI just captured a player piece, disable its ability if no more of that type remain
  if(isAI&&captured)updateAbilitiesAfterCapture();

  // Update frozen squares: move with piece if it moved, then decrement
  const prevFrozen=chess.frozenSquares.length;
  chess.frozenSquares=chess.frozenSquares.map(f=>{
    if(f.r===move.fr&&f.c===move.fc)return{r:move.tr,c:move.tc,turns:f.turns-1};
    return{...f,turns:f.turns-1};
  }).filter(f=>f.turns>0);
  // Notify when rook shield expires
  if(prevFrozen>0&&chess.frozenSquares.length===0){
    chess.moveLog.push({text:'\uD83D\uDEE1 Schutzwall abgelaufen!',ai:false,special:true});
  }
  // Brennen-System (Feuer R5): Feinde die brennen verlieren 1 Runde
  if(chess.burningSquares&&chess.burningSquares.length>0){
    const dead=[];
    chess.burningSquares=chess.burningSquares.map(b=>{
      // Wenn Figur noch auf dem Feld ist, decrement
      if(chess.board[b.r]?.[b.c]?.col==='b'){
        const newTurns=b.turnsLeft-1;
        if(newTurns<=0){dead.push({r:b.r,c:b.c});}
        return{...b,turnsLeft:newTurns};
      }
      return null; // Figur bereits weg
    }).filter(b=>b&&b.turnsLeft>0);
    dead.forEach(d=>{
      if(chess.board[d.r]?.[d.c]?.col==='b'){
        chess.capturedByPlayer.push(chess.board[d.r][d.c]);
        chess.board[d.r][d.c]=null;
        chess.moveLog.push({text:'🔥 Brennen! Feind auf '+('abcdefgh'[d.c])+(8-d.r)+' verbrannt!',ai:false,special:true});
      }
    });
    if(dead.length>0){renderBoard();renderMoveLog();renderCaptured();}
  }
  if(!isAI){chess.pawnStrike=false;}
  if(!isAI&&chess.extraMove){chess.extraMove=false;}

  const nextCol=isAI?'w':'b';
  const nextMoves=getAllLegalMoves(chess.board,nextCol,move);

  // Check/checkmate/stalemate
  const inCheck=isInCheck(chess.board,nextCol);
  if(nextMoves.length===0){
    renderBoard();renderMoveLog();renderCaptured();
    if(!isAI){
      // Player just moved → AI has no moves → Player wins (checkmate or stalemate trap)
      chess.status='checkmate';
      showResult(true,inCheck?'SCHACHMATT! Du gewinnst!':'PATT-SIEG! Du gewinnst!');
    } else {
      // AI just moved → Player has no moves
      chess.status=inCheck?'checkmate':'stalemate';
      if(chess.status==='checkmate'){
        showResult(false,'SCHACHMATT! KI gewinnt!');
      } else {
        showResult(null,'PATT! Unentschieden.');
      }
    }
    return;
  }

  if(inCheck){
    if(isAI)setStatus('SCHACH! Dein König steht im Schach!','#ff4444');
    else{setStatus('SCHACH! KI-König im Schach!','#ff8800');trackQuestStat('checks',1);}
  }

  chess.turn=nextCol;
  chess.hintMove=null;chess.hintAIMove=null;
  renderBoard();renderMoveLog();renderCaptured();

  if(!isAI){
    renderAbilities();
    stopMoveTimer();
    if(!chess.extraMove){
      setStatus('KI denkt\u2026','#888888');
      setTimeout(()=>aiTurn(),500);
    } else {
      chess.extraMove=false;
      setStatus('Extra-Zug! W\u00E4hle eine Figur','#ff9900');
    }
  } else {
    setStatus('Dein Zug \u2014 W\u00E4hle eine Figur','#ffd700');
    renderAbilities();
    startMoveTimer();
    const hb=q('#draw-btn');if(hb)hb.style.display='block';
  }
}

function aiShouldResign(){
  // Zähle Figuren
  let whitePieces=0,blackPieces=0,whiteVal=0,blackVal=0;
  let blackKingMoves=0,blackKingR=-1,blackKingC=-1;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=chess.board[r][c];if(!p)continue;
    const v=PIECE_VAL[p.t]||0;
    if(p.col==='w'){whitePieces++;whiteVal+=v;}
    else{blackPieces++;blackVal+=v;if(p.t==='K'){blackKingR=r;blackKingC=c;}}
  }
  // KI hat schon gewonnen — nicht aufgeben
  if(whiteVal<blackVal)return false;
  // Materialvorteil für Spieler (mindestens Dame oder 2 Türme mehr)
  const diff=whiteVal-blackVal;
  if(diff<900)return false; // weniger als Dame Vorteil → noch nicht aufgeben
  // König der KI hat kaum Züge (eingesperrt)
  if(blackKingR>=0){
    const kingMoves=getAllLegalMoves(chess.board,'b',chess.lastMove).filter(m=>m.fr===blackKingR&&m.fc===blackKingC);
    blackKingMoves=kingMoves.length;
  }
  // Aufgeben wenn: großer Materialvorteil UND (König fast eingesperrt ODER keine Figuren mehr außer König)
  if(diff>=900&&(blackKingMoves<=1||blackPieces<=2))return true;
  if(diff>=1800)return true; // Zwei Damen Vorteil → immer aufgeben
  return false;
}

function aiTurn(){
  if(chess.status!=='playing')return;
  // KI prüft ob Lage hoffnungslos ist
  if(aiShouldResign()){
    chess.status='checkmate';
    chess.moveLog.push({text:'🏳️ KI gibt auf — die Lage ist hoffnungslos!',ai:true,special:true});
    showResult(true,'KI gibt auf! Du gewinnst! 🏳️');
    return;
  }
  if(chess.frozenEnemy){
    chess.frozenEnemy=false;
    chess.turn='w';
    chess.moveLog.push({text:'\u2744\uFE0F KI-Zug blockiert! (Festung)',ai:false,special:true});
    setStatus('Dein Zug \u2014 W\u00E4hle eine Figur','#ffd700');
    renderBoard();renderMoveLog();renderAbilities();
    startMoveTimer();
    const hb=q('#draw-btn');if(hb)hb.style.display='block';
    return;
  }
  const move=getAIMove(chess.board,chess.lastMove,chess.frozenSquares);
  if(move) doMove(move,true);
}

function renderMoveLog(){
  const el=q('#move-log');if(!el)return;
  el.innerHTML='';
  chess.moveLog.slice(-30).forEach(e=>{
    const d=document.createElement('div');
    d.style.cssText='font-size:0.68rem;padding:2px 0;color:'+(e.special?'#c8a000':e.ai?'#ff8888':'#88ddff');
    d.textContent=e.text;
    el.appendChild(d);
  });
  el.scrollTop=el.scrollHeight;
}

function renderCaptured(){
  const pw=q('#cap-player'),pa=q('#cap-ai');
  if(pw)pw.textContent=chess.capturedByPlayer.map(p=>CHESS_SYMS['b'+p.t]).join('');
  if(pa)pa.textContent=chess.capturedByAI.map(p=>CHESS_SYMS['w'+p.t]).join('');
}

function renderAbilities(){
  renderAbilityPoints();
}

function renderAbilityPoints(){
  const el=q('#ability-bar');if(!el)return;
  const pts=chess.abilityPoints??0;
  // Punkte-Dots + Erklärung
  let dots='';
  for(let i=0;i<5;i++){
    const on=i<pts;
    dots+='<div style="width:14px;height:14px;border-radius:50%;background:'+(on?'#ffd700':'#1a1000')+';border:1px solid '+(on?'#c8a000':'#2a1800')+';box-shadow:'+(on?'0 0 7px #ffd70088':'none')+'"></div>';
  }
  el.innerHTML=
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
      +'<div style="display:flex;gap:4px">'+dots+'</div>'
      +'<div style="font-size:.55rem;color:'+(pts>0?'#c8a000':'#3a2a00')+';letter-spacing:.5px">'
        +(pts>0
          ? pts+' Fähigkeitspunkte — Klicke eine Figur auf dem Brett um ihre Fähigkeit einzusetzen'
          : '✗ Keine Fähigkeitspunkte mehr')
      +'</div>'
    +'</div>';
}

// ============================================================
// KNIGHT ABILITY HELPERS
// ============================================================

// Generate valid jump targets for a knight at (kr,kc) given rankIdx
// Rules:
//   Rang 1 (0): 2 random steps, any direction — fully random, shown after click
//   Rang 2 (1): 3 random steps
//   Rang 3 (2): player picks 2 steps, each must curve (no straight line)
//   Rang 4 (3): player picks 3 steps
//   Rang 5 (4): player picks 5 steps
// "Curve" = each step changes direction (no two consecutive steps same dr or dc)

function getKnightJumpCount(rankIdx){
  return[2,3,2,3,5][rankIdx]||2;
}
function isKnightRankRandom(rankIdx){
  return rankIdx<=1; // Rang 1+2 = random
}

// Returns all reachable cells after N steps from (r,c), each step must curve
// A step is any of 8 directions (including diagonal), must be free or capturable enemy
// "Curve" = consecutive steps cannot go same row OR same col direction (must turn)
function getKnightJumpTargets(board,startR,startC,steps){
  // BFS/DFS: state = (r, c, stepsLeft, lastDr, lastDc)
  // Each step: move 1 cell in any of 8 dirs, but not same dr AND not same dc as last step
  const results=new Set();
  function dfs(r,c,left,lastDr,lastDc){
    if(left===0){
      if(board[r][c]?.col!=='w') // can land on empty or enemy
        results.add(r*8+c);
      return;
    }
    for(const[dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
      // Curve rule: must change BOTH row and col direction compared to last step
      // i.e. not (dr===lastDr) AND not (dc===lastDc) — need at least one change
      // We enforce: not going purely straight (must have a turn somewhere)
      if(lastDr!==null&&dr===lastDr&&dc===lastDc)continue; // no same dir
      if(lastDr!==null&&dr===lastDr&&dc===0&&lastDc===0)continue;
      if(lastDr!==null&&dc===lastDc&&dr===0&&lastDr===0)continue;
      // Enforce curve: if last step was a straight (dr=0 or dc=0), this step must not be same axis
      if(lastDr!==null){
        const lastStraight=lastDr===0||lastDc===0;
        const curStraight=dr===0||dc===0;
        // Both straight on same axis = not allowed
        if(lastDr===0&&dr===0&&Math.sign(lastDc)===Math.sign(dc))continue;
        if(lastDc===0&&dc===0&&Math.sign(lastDr)===Math.sign(dr))continue;
      }
      const nr=r+dr,nc=c+dc;
      if(!inB(nr,nc))continue;
      if(board[nr][nc]?.col==='w')continue; // can't pass through own pieces
      // Can pass through if not last step (can jump over for intermediate)
      if(left>1||!board[nr][nc]||board[nr][nc].col==='b'){
        dfs(nr,nc,left-1,dr,dc);
      }
    }
  }
  dfs(startR,startC,steps,null,null);
  results.delete(startR*8+startC);
  return [...results].map(k=>({r:Math.floor(k/8),c:k%8}));
}

function doKnightJump(fromR,fromC,toR,toC){
  const piece=chess.board[fromR][fromC];
  const captured=chess.board[toR][toC];
  if(captured)chess.capturedByPlayer.push(captured);
  chess.board[toR][toC]={...piece,moved:true};
  chess.board[fromR][fromC]=null;
  chess.abilitiesLeft['knight_magic']=false;
  chess.knightAbilityPending=null;
  chess.moveLog.push({text:'\u2728 Arkaner Sprung! \u2658 '+('abcdefgh'[fromC])+(8-fromR)+' \u2192 '+('abcdefgh'[toC])+(8-toR)+'!',ai:false,special:true});
  renderBoard();renderMoveLog();renderCaptured();renderAbilities();
}

function handleKnightAbilityClick(r,c){
  const kap=chess.knightAbilityPending;
  if(!kap)return false;

  // Phase 1: no knight selected yet — click must be on a knight
  if(!kap.selectedKnight){
    const isKnight=kap.knights.some(k=>k.r===r&&k.c===c);
    if(!isKnight)return true; // consumed click, did nothing
    kap.selectedKnight={r,c};
    if(isKnightRankRandom(kap.rankIdx)){
      // Random jump immediately
      const steps=getKnightJumpCount(kap.rankIdx);
      const targets=getKnightJumpTargets(chess.board,r,c,steps);
      if(!targets.length){
        chess.moveLog.push({text:'\u2728 Kein Ziel erreichbar!',ai:false,special:true});
        chess.knightAbilityPending=null;
        renderBoard();renderMoveLog();renderAbilities();
        return true;
      }
      const t=targets[Math.floor(Math.random()*targets.length)];
      doKnightJump(r,c,t.r,t.c);
    } else {
      // Show targets for player to pick
      const steps=getKnightJumpCount(kap.rankIdx);
      kap.targets=getKnightJumpTargets(chess.board,r,c,steps);
      if(!kap.targets.length){
        chess.moveLog.push({text:'\u2728 Kein Ziel erreichbar!',ai:false,special:true});
        chess.knightAbilityPending=null;
        renderBoard();renderMoveLog();renderAbilities();
        return true;
      }
      renderBoard();
    }
    return true;
  }

  // Phase 2: knight selected, player picks target
  const isTarget=kap.targets&&kap.targets.some(t=>t.r===r&&t.c===c);
  if(isTarget){
    doKnightJump(kap.selectedKnight.r,kap.selectedKnight.c,r,c);
    return true;
  }
  // Click elsewhere cancels
  chess.knightAbilityPending=null;
  renderBoard();renderAbilities();
  return true;
}

// useAbilityForPiece: wird von usePieceAbility aufgerufen mit konkretem Rang der Figur
function useAbilityForPiece(id, ri, fromR, fromC, desc){
  chess.abilityUsedThisGame=true;
  playSound('ability');
  // Quest tracking
  if(ri===0)trackQuestStat('abilityRank1',1);
  else if(ri===1)trackQuestStat('abilityRank2',1);
  else if(ri===2)trackQuestStat('abilityRank3',1);
  else if(ri===3)trackQuestStat('abilityRank4',1);
  else if(ri===4)trackQuestStat('abilityRank5',1);

  let logText='';

  switch(id){

    // ── BAUER: SPEERTRÄGER ──────────────────────────────────────────
    case 'pawn_spear':
      if(ri===0){
        // R1: Normales Spiel — Fähigkeit sperrt nächsten Angriff auf diesen Bauer
        let sp=null;
        for(let r=0;r<8&&!sp;r++)for(let c=0;c<8&&!sp;c++)
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w')sp={r,c};
        if(sp){chess.frozenSquares.push({r:sp.r,c:sp.c,turns:1});logText='🛡 Schildblock! Vorderster Speerträger 1 Zug geschützt!';}
        else{chess.abilitiesLeft[id]=true;logText='🛡 Kein Bauer auf Brett.';}
      } else if(ri===1){
        // R2: Blockiert einmal einen Angreifer (schützt 2 Züge)
        let sp=null;
        for(let r=0;r<8&&!sp;r++)for(let c=0;c<8&&!sp;c++)
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w')sp={r,c};
        if(sp){chess.frozenSquares.push({r:sp.r,c:sp.c,turns:2});logText='🛡 Schildblock! Speerträger 2 Züge unschlagbar!';}
        else{chess.abilitiesLeft[id]=true;logText='🛡 Kein Bauer auf Brett.';}
      } else if(ri===2){
        // R3: Alle Speerträger drohen 2 Felder diagonal (pawnStrike + extraMove)
        chess.pawnStrike=true;chess.extraMove=true;
        logText='🗡 Speerstoß! Bauern schlagen diagonal 2 Felder + Extra-Zug!';
      } else if(ri===3){
        // R4: Alle Speerträger überleben ersten Treffer (2 Züge Schutz)
        let found=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++)
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){chess.frozenSquares.push({r,c,turns:2});found++;}
        logText='🛡 Eisenwille! '+found+' Speerträger überleben nächsten Treffer!';
      } else {
        // R5: Aura — alle Nachbarn 1 Zug unschlagbar
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            for(const[dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
              const nr=r+dr,nc=c+dc;
              if(inB(nr,nc)&&chess.board[nr][nc]?.col==='w')chess.frozenSquares.push({r:nr,c:nc,turns:1});
            }
          }
        }
        logText='✨ Königsgarde-Aura! Alle Nachbarn der Speerträger 1 Zug unschlagbar!';
      }
      break;

    // ── BAUER: BOGENSCHÜTZE ──────────────────────────────────────────
    case 'pawn_bow':
      if(ri===0){
        // R1: Schlägt 1 Feld gerade vorwärts (wie pawnStrike)
        chess.pawnStrike=true;
        logText='🏹 Schuss! Nächster Bauer schlägt auch geradeaus!';
      } else if(ri===1){
        // R2: Schlägt 1 Feld diagonal ohne Bewegung
        const targets=[];
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            for(const dc of[-1,1]){
              const nr=r-1,nc=c+dc;
              if(inB(nr,nc)&&chess.board[nr][nc]?.col==='b'&&chess.board[nr][nc]?.t!=='K')
                targets.push({r:nr,c:nc});
            }
          }
        }
        if(targets.length===0){chess.abilitiesLeft[id]=true;logText='🏹 Kein Ziel in Reichweite!';}
        else{
          // Schlägt das nächste verfügbare Ziel
          const t=targets[0];
          chess.capturedByPlayer.push(chess.board[t.r][t.c]);
          chess.board[t.r][t.c]=null;
          logText='🏹 Fernschuss! Figur auf '+('abcdefgh'[t.c])+(8-t.r)+' getroffen!';
        }
      } else if(ri===2){
        // R3: Alle Bauern drohen 2 Felder diagonal — schlägt erste Reihe Feinde
        let shot=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            for(const dc of[-1,1]){
              for(let d=1;d<=2;d++){
                const nr=r-d,nc=c+dc*d;
                if(inB(nr,nc)&&chess.board[nr][nc]?.col==='b'&&chess.board[nr][nc]?.t!=='K'){
                  chess.capturedByPlayer.push(chess.board[nr][nc]);chess.board[nr][nc]=null;shot++;break;
                }
              }
            }
          }
        }
        logText='🏹 Bogenhagel! '+shot+' Feinde getroffen!';
      } else if(ri===3){
        // R4: Doppelschuss — 2 Feinde in Reichweite gleichzeitig schlagen
        const pool=[];
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.col==='b'&&chess.board[r][c]?.t!=='K'){
            // Check ob irgendein Bauer diese Figur in 2 Feldern bedroht
            let inRange=false;
            for(let pr=0;pr<8&&!inRange;pr++)for(let pc=0;pc<8&&!inRange;pc++){
              if(chess.board[pr][pc]?.t==='P'&&chess.board[pr][pc]?.col==='w'){
                const dr=Math.abs(r-pr),dc2=Math.abs(c-pc);
                if(dr<=2&&dc2<=2&&dr===dc2)inRange=true;
              }
            }
            if(inRange)pool.push({r,c});
          }
        }
        const shots=pool.slice(0,2);
        shots.forEach(t=>{chess.capturedByPlayer.push(chess.board[t.r][t.c]);chess.board[t.r][t.c]=null;});
        logText='🏹🏹 Doppelschuss! '+shots.length+' Feinde getroffen!';
        if(!shots.length){chess.abilitiesLeft[id]=true;logText='🏹 Kein Ziel in Reichweite!';}
      } else {
        // R5: Präzisionsschuss — zielt auf stärkste Figur in Radius 2 um einen Bauer
        let bestVal=0,bestPos=null;
        const VALS={P:1,N:3,B:3,R:5,Q:9,K:99};
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){
              if(!dr&&!dc)continue;
              const nr=r+dr,nc=c+dc;
              if(inB(nr,nc)&&chess.board[nr][nc]?.col==='b'&&chess.board[nr][nc]?.t!=='K'){
                const v=VALS[chess.board[nr][nc].t]||1;
                if(v>bestVal){bestVal=v;bestPos={r:nr,c:nc};}
              }
            }
          }
        }
        if(bestPos){
          chess.capturedByPlayer.push(chess.board[bestPos.r][bestPos.c]);chess.board[bestPos.r][bestPos.c]=null;
          logText='🎯 Präzisionsschuss! Stärkste Figur in Reichweite eliminiert!';
        } else{chess.abilitiesLeft[id]=true;logText='🏹 Kein Ziel in Radius 2!';}
      }
      break;

    // ── BAUER: SCHILDTRÄGER ──────────────────────────────────────────
    case 'pawn_shield':
      if(ri===0){
        // R1: Sich selbst 1 Zug schützen
        let sp=null;
        for(let r=0;r<8&&!sp;r++)for(let c=0;c<8&&!sp;c++)
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w')sp={r,c};
        if(sp){chess.frozenSquares.push({r:sp.r,c:sp.c,turns:1});logText='🛡 Schild hoch! Schildträger 1 Zug geschützt!';}
        else{chess.abilitiesLeft[id]=true;logText='🛡 Kein Bauer auf Brett.';}
      } else if(ri===1){
        // R2: Benachbarte Figur 1 Zug schützen
        let shielded=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            for(const[dr,dc] of [[-1,0],[0,-1],[0,1],[1,0]]){
              const nr=r+dr,nc=c+dc;
              if(inB(nr,nc)&&chess.board[nr][nc]?.col==='w'&&chess.board[nr][nc]?.t!=='P'){
                chess.frozenSquares.push({r:nr,c:nc,turns:1});shielded++;break;
              }
            }
          }
        }
        logText='🛡 Schutzschild! '+shielded+' Nachbarfiguren 1 Zug unschlagbar!';
      } else if(ri===2){
        // R3: König 2 Züge unschlagbar + Schildträger opfert sich
        let kr=-1,kc=-1;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++)
          if(chess.board[r][c]?.t==='K'&&chess.board[r][c]?.col==='w'){kr=r;kc=c;}
        if(kr>=0){chess.frozenSquares.push({r:kr,c:kc,turns:2});}
        // Opfert den vordersten Bauer
        let sacrificed=false;
        for(let r=0;r<8&&!sacrificed;r++)for(let c=0;c<8&&!sacrificed;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            chess.capturedByAI.push(chess.board[r][c]);chess.board[r][c]=null;sacrificed=true;
          }
        }
        logText='💀🛡 Opfer! Schildträger opfert sich — König 2 Züge unschlagbar!';
      } else if(ri===3){
        // R4: Alle Bauern starten mit Schutz (1 Zug)
        let count=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){chess.frozenSquares.push({r,c,turns:1});count++;}
        }
        logText='🛡 Schildmauer! '+count+' Schildträger-Bauern 1 Zug unschlagbar!';
      } else {
        // R5: Ganze eigene 2. Reihe (Bauern-Reihe) 2 Züge unschlagbar
        let count=0;
        for(let c=0;c<8;c++){
          for(let r=0;r<8;r++){
            if(chess.board[r][c]?.col==='w'){chess.frozenSquares.push({r,c,turns:2});count++;break;}
          }
        }
        logText='🛡 Eisenwand! '+count+' vorderste Figuren pro Spalte 2 Züge unschlagbar!';
      }
      break;

    // ── BAUER: ASSASSINE ─────────────────────────────────────────────
    case 'pawn_assassin':
      if(ri===0){
        // R1: Schlägt direkt vor ihm (orthogonal)
        chess.pawnStrike=true;
        logText='🗡 Schattenschritt! Bauer schlägt auch geradeaus!';
      } else if(ri===1){
        // R2: Schlägt direkt vor ihm ohne Bewegung
        let killed=false;
        for(let r=1;r<8&&!killed;r++)for(let c=0;c<8&&!killed;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'&&chess.board[r-1][c]?.col==='b'&&chess.board[r-1][c]?.t!=='K'){
            chess.capturedByPlayer.push(chess.board[r-1][c]);chess.board[r-1][c]=null;killed=true;
            logText='🗡 Dolchstoß! Figur direkt vor Assassin eliminiert!';
          }
        }
        if(!killed){chess.abilitiesLeft[id]=true;logText='🗡 Kein Ziel direkt vor Assassin!';}
      } else if(ri===2){
        // R3: KI greift Assassinen nicht an (3 Züge Schutz) + schlägt vor ihm
        chess.pawnStrike=true;
        let count=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++)
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){chess.frozenSquares.push({r,c,turns:3});count++;}
        logText='👤 Unsichtbar! '+count+' Assassinen 3 Züge geschützt + Schlag vorwärts!';
      } else if(ri===3){
        // R4: Schlägt und teleportiert zurück
        let killed=false;
        const VALS2={P:1,N:3,B:3,R:5,Q:9};
        let bestV=0,bestPos=null;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            for(const[dr,dc] of [[-1,-1],[-1,0],[-1,1]]){
              const nr=r+dr,nc=c+dc;
              if(inB(nr,nc)&&chess.board[nr][nc]?.col==='b'&&chess.board[nr][nc]?.t!=='K'){
                const v=VALS2[chess.board[nr][nc].t]||1;
                if(v>bestV){bestV=v;bestPos={ar:r,ac:c,tr:nr,tc:nc};}
              }
            }
          }
        }
        if(bestPos){
          chess.capturedByPlayer.push(chess.board[bestPos.tr][bestPos.tc]);
          chess.board[bestPos.tr][bestPos.tc]=null;
          // Assassin teleportiert zurück (bleibt auf Startfeld — kein Feldwechsel)
          logText='🗡✨ Schattenklinge! Assassin schlägt & verschwindet!';chess.extraMove=true;
        } else{chess.abilitiesLeft[id]=true;logText='🗡 Kein Ziel in Reichweite!';}
      } else {
        // R5: Schlägt wertvollste Nachbarfigur
        const VALS3={P:1,N:3,B:3,R:5,Q:9};
        let bv=0,bp=null;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            for(const[dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
              const nr=r+dr,nc=c+dc;
              if(inB(nr,nc)&&chess.board[nr][nc]?.col==='b'&&chess.board[nr][nc]?.t!=='K'){
                const v=VALS3[chess.board[nr][nc].t]||1;
                if(v>bv){bv=v;bp={r:nr,c:nc};}
              }
            }
          }
        }
        if(bp){
          chess.capturedByPlayer.push(chess.board[bp.r][bp.c]);chess.board[bp.r][bp.c]=null;
          logText='🗡 Königsmörder! Wertvollste Nachbarfigur eliminiert!';
        } else{chess.abilitiesLeft[id]=true;logText='🗡 Kein Feind in Reichweite!';}
      }
      break;

    // ── BAUER: BERSERKER ─────────────────────────────────────────────
    case 'pawn_berserk':
      if(ri===0){
        // R1: Normaler Vorwärts-Schlag
        chess.pawnStrike=true;
        logText='⚔️ Berserker! Bauern schlagen vorwärts!';
      } else if(ri===1){
        // R2: Extra-Zug nach nächstem Schlag aktivieren
        chess.pawnStrike=true;chess.extraMove=true;
        logText='😤 Raserei! Bauer schlägt + Extra-Zug!';
      } else if(ri===2){
        // R3: Bauern dürfen diesen Zug auch rückwärts schlagen
        chess.pawnStrike=true;chess.extraMove=true;
        // Markiere rückwärts-Schlag (board render nutzt pawnStrike)
        chess._berserkerBackstrike=true;
        logText='😤 Wut! Bauern schlagen vorwärts UND rückwärts + Extra-Zug!';
      } else if(ri===3){
        // R4: Schlägt stärkste erreichbare Figur + wird stärker (extra schlag Counter)
        chess.pawnStrike=true;chess.extraMove=true;
        chess._berserkerKills=(chess._berserkerKills||0)+1;
        logText='🔥 Blutrausch! Berserker stärker ('+chess._berserkerKills+' Kills) + Extra-Zug!';
      } else {
        // R5: Schlägt alle Feinde in seiner Spalte
        let killed=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            for(let tr=0;tr<8;tr++){
              if(chess.board[tr][c]?.col==='b'&&chess.board[tr][c]?.t!=='K'){
                chess.capturedByPlayer.push(chess.board[tr][c]);chess.board[tr][c]=null;killed++;
              }
            }
          }
        }
        logText='🔥 Götterzorn! '+killed+' Feinde in den Spalten der Berserker vernichtet!';
      }
      break;

    // ── BAUER: HEILER ────────────────────────────────────────────────
    case 'pawn_heal':
      if(ri===0){
        // R1: Sich selbst 1 Zug schützen
        let sp=null;
        for(let r=0;r<8&&!sp;r++)for(let c=0;c<8&&!sp;c++)
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w')sp={r,c};
        if(sp){chess.frozenSquares.push({r:sp.r,c:sp.c,turns:1});logText='💚 Erste Hilfe! Heiler 1 Zug geschützt!';}
        else{chess.abilitiesLeft[id]=true;logText='💚 Kein Heiler auf Brett.';}
      } else if(ri===1){
        // R2: Bringt zuletzt geschlagenen Bauern zurück
        const lost=chess.capturedByAI.filter(p=>p.t==='P');
        if(lost.length){
          const idx=chess.capturedByAI.lastIndexOf(lost[lost.length-1]);
          const rev=chess.capturedByAI.splice(idx,1)[0];
          let placed=false;
          for(let c=0;c<8&&!placed;c++)
            if(!chess.board[6][c]){chess.board[6][c]={...rev,col:'w',moved:false};placed=true;}
          logText='💚 Heilung! Bauer ♟ zurückgekehrt!';
        } else{chess.abilitiesLeft[id]=true;logText='💚 Kein geschlagener Bauer!';}
      } else if(ri===2){
        // R3: Gibt einer Nachbarfigur Schutz für 2 Züge
        let healed=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='P'&&chess.board[r][c]?.col==='w'){
            for(const[dr,dc] of [[-1,0],[0,-1],[0,1],[1,0]]){
              const nr=r+dr,nc=c+dc;
              if(inB(nr,nc)&&chess.board[nr][nc]?.col==='w'&&!chess.frozenSquares.some(f=>f.r===nr&&f.c===nc)){
                chess.frozenSquares.push({r:nr,c:nc,turns:2});healed++;break;
              }
            }
          }
        }
        logText='💚 Segnung! '+healed+' Nachbarfiguren 2 Züge geheilt!';
      } else if(ri===3){
        // R4: Bringt beliebige geschlagene Figur zurück
        if(chess.capturedByAI.length>0){
          const rev=chess.capturedByAI.pop();let placed=false;
          for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)
            if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
          logText='💚 Auferstehung! '+CHESS_SYMS['w'+(rev.t||'P')]+' zurückgekehrt!';
        } else{chess.abilitiesLeft[id]=true;logText='💚 Keine geschlagenen Figuren!';}
      } else {
        // R5: Alle geschlagenen Bauern kehren zurück
        const lost2=chess.capturedByAI.filter(p=>p.t==='P');
        let count=0;
        lost2.forEach(p=>{
          let placed=false;
          for(let c=0;c<8&&!placed;c++)
            if(!chess.board[6][c]){chess.board[6][c]={...p,col:'w',moved:false};placed=true;count++;}
        });
        chess.capturedByAI=chess.capturedByAI.filter(p=>p.t!=='P');
        logText='💚✨ Massenheilung! '+count+' Bauern zurückgekehrt!';
      }
      break;


    // ── TURM ───────────────────────────────────────────────────────
    case 'rook_shield':
      if(ri===0){
        // R1: 1 Turm 2 Züge unschlagbar
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='R'&&chess.board[r][c]?.col==='w'){
            chess.frozenSquares.push({r,c,turns:2});
            logText='🛡 Schutzwall! Turm auf '+('abcdefgh'[c])+(8-r)+' unschlagbar (2 Züge)';break;
          }
        }
      } else if(ri===1){
        // R2: Beide Türme 2 Züge unschlagbar
        let found=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='R'&&chess.board[r][c]?.col==='w'){chess.frozenSquares.push({r,c,turns:2});found++;}
        }
        logText=found>0?'🛡 Doppelwall! Alle '+found+' Türme unschlagbar (2 Züge)!':'🛡 Kein Turm gefunden.';
      } else if(ri===2){
        // R3: Alle eigenen Figuren 1 Zug unschlagbar
        let found=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.col==='w'){chess.frozenSquares.push({r,c,turns:1});found++;}
        }
        logText='🛡 Festung! Alle '+found+' Figuren 1 Zug unschlagbar!';
      } else if(ri===3){
        // R4: Alle Gegnerfiguren 1 Zug eingefroren (können nicht ziehen / schlagen) + eigene Türme unschlagbar
        let found=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='R'&&chess.board[r][c]?.col==='w'){chess.frozenSquares.push({r,c,turns:3});found++;}
        }
        chess.frozenEnemy=true; // KI überspringt nächsten Zug
        logText='🛡 Kaiserwall! Türme 3 Züge unschlagbar + alle Gegner 1 Zug gesperrt!';
      } else {
        // R5: 2 eigene Figuren (Türme bevorzugt) 3 Züge unschlagbar — funktioniert auch gegen Schutz
        let count=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='R'&&chess.board[r][c]?.col==='w'&&count<2){
            // Überspringe existierende frozenSquares — füge trotzdem hinzu (stapelt sich)
            chess.frozenSquares.push({r,c,turns:3,unbreakable:true});count++;
          }
        }
        // Falls kein Turm: erste 2 eigene Figuren schützen
        if(count<2){
          for(let r=0;r<8&&count<2;r++)for(let c=0;c<8&&count<2;c++){
            if(chess.board[r][c]?.col==='w'&&!chess.frozenSquares.some(f=>f.r===r&&f.c===c)){
              chess.frozenSquares.push({r,c,turns:3,unbreakable:true});count++;
            }
          }
        }
        chess.frozenEnemy=true;
        logText='🛡 Unzerstörbar! '+count+' Figuren 3 Züge unschlagbar (durchbricht Schutz) + Gegner pausiert!';
      }
      break;

    // ── LÄUFER ─────────────────────────────────────────────────────
    case 'bishop_stab':{
      const getNeighborEnemies=(maxCount)=>{
        const targets=[];
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='B'&&chess.board[r][c]?.col==='w'){
            [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>{
              const nr=r+dr,nc=c+dc;
              if(inB(nr,nc)&&chess.board[nr][nc]?.col==='b'&&chess.board[nr][nc].t!=='K')
                targets.push({r:nr,c:nc,v:PIECE_VAL[chess.board[nr][nc].t]||0});
            });
          }
        }
        // Sortiere nach Wert, entferne Duplikate
        const seen=new Set();
        return targets.filter(t=>{const k=t.r+','+t.c;if(seen.has(k))return false;seen.add(k);return true;})
          .sort((a,b)=>b.v-a.v).slice(0,maxCount);
      };

      if(ri===0){
        // R1: Wertvollste Nachbarfigur eines Läufers entfernen
        const hits=getNeighborEnemies(1);
        if(hits.length){const h=hits[0];chess.capturedByPlayer.push(chess.board[h.r][h.c]);chess.board[h.r][h.c]=null;logText='🗡 Dolchstoß! '+CHESS_SYMS['b'+chess.capturedByPlayer.at(-1).t]+' ausgeschaltet!';}
        else{chess.abilitiesLeft[id]=true;logText='🗡 Kein Ziel in Reichweite.';}
      } else if(ri===1){
        // R2: 2 Nachbarfiguren entfernen
        const hits=getNeighborEnemies(2);
        if(hits.length){hits.forEach(h=>{chess.capturedByPlayer.push(chess.board[h.r][h.c]);chess.board[h.r][h.c]=null;});logText='🗡 Doppeldolch! '+hits.length+' Figuren ausgeschaltet!';}
        else{chess.abilitiesLeft[id]=true;logText='🗡 Kein Ziel in Reichweite.';}
      } else if(ri===2){
        // R3: Wertvollste Figur auf dem Brett entfernen (nicht König)
        let best=null,bR=-1,bC=-1,bV=-1;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          const p=chess.board[r][c];
          if(p?.col==='b'&&p.t!=='K'){const v=PIECE_VAL[p.t]||0;if(v>bV){bV=v;best=p;bR=r;bC=c;}}
        }
        if(best){chess.capturedByPlayer.push(best);chess.board[bR][bC]=null;logText='🗡 Präzisionsschlag! '+CHESS_SYMS['b'+best.t]+' vernichtet!';}
        else{chess.abilitiesLeft[id]=true;logText='🗡 Kein Ziel gefunden.';}
      } else if(ri===3){
        // R4: Alle Figuren auf den Diagonalen des Läufers entfernen
        let count=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          if(chess.board[r][c]?.t==='B'&&chess.board[r][c]?.col==='w'){
            // Alle 4 Diagonalen
            [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>{
              let nr=r+dr,nc=c+dc;
              while(inB(nr,nc)){
                if(chess.board[nr][nc]?.col==='b'&&chess.board[nr][nc].t!=='K'){chess.capturedByPlayer.push(chess.board[nr][nc]);chess.board[nr][nc]=null;count++;}
                else if(chess.board[nr][nc]?.col==='w')break;
                nr+=dr;nc+=dc;
              }
            });
          }
        }
        logText=count>0?'🗡 Diagonalzorn! '+count+' Feinde auf den Diagonalen vernichtet!':'🗡 Keine Feinde auf den Diagonalen.';
      } else {
        // R5: 3 stärkste Feinde auf dem Brett entfernen
        const enemies=[];
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){
          const p=chess.board[r][c];if(p?.col==='b'&&p.t!=='K')enemies.push({r,c,v:PIECE_VAL[p.t]||0});
        }
        enemies.sort((a,b)=>b.v-a.v).slice(0,3).forEach(e=>{chess.capturedByPlayer.push(chess.board[e.r][e.c]);chess.board[e.r][e.c]=null;});
        logText='🗡 Schattenhagel! '+Math.min(3,enemies.length)+' stärkste Feinde vernichtet!';
      }
      break;
    }

    // ── SPRINGER (unverändert — schon rang-basiert) ─────────────────
    case 'knight_magic':{
      const knights=[];
      for(let r=0;r<8;r++)for(let c=0;c<8;c++)
        if(chess.board[r][c]?.t==='N'&&chess.board[r][c]?.col==='w')knights.push({r,c});
      if(!knights.length){chess.abilitiesLeft[id]=true;logText='✨ Kein Springer auf dem Brett.';break;}
      chess.knightAbilityPending={rankIdx:ri,knights};
      chess.abilitiesLeft[id]=true;
      logText='✨ Arkaner Sprung! Klicke einen Springer an!';
      renderBoard();
      break;
    }

    // ── DAME FEUER ─────────────────────────────────────────────────
    case 'queen_fire':{
      let qR=-1,qC=-1;
      for(let r=0;r<8&&qR<0;r++)for(let c=0;c<8&&qR<0;c++)
        if(chess.board[r][c]?.t==='Q'&&chess.board[r][c]?.col==='w'){qR=r;qC=c;}
      const radius=ri===0?2:ri===1?3:ri===2?4:ri===3?5:3; // R5: Radius 3 (kein ganzes Brett)
      let hits=0;
      if(qR>=0){
        if(ri<4){
          // R1-R4: Alle im Radius verbrennen
          for(let r=0;r<8;r++)for(let c=0;c<8;c++){
            if(chess.board[r][c]?.col==='b'&&chess.board[r][c].t!=='K'&&
              Math.abs(r-qR)<=radius&&Math.abs(c-qC)<=radius){
              chess.capturedByPlayer.push(chess.board[r][c]);chess.board[r][c]=null;hits++;
            }
          }
        } else {
          // R5: 1 zufälliger Treffer sofort + 1 weiterer Feind im Radius bekommt "Brennen" (stirbt in 3 Zügen)
          const inRange=[];
          for(let r=0;r<8;r++)for(let c=0;c<8;c++){
            if(chess.board[r][c]?.col==='b'&&chess.board[r][c].t!=='K'&&
              Math.abs(r-qR)<=radius&&Math.abs(c-qC)<=radius)inRange.push({r,c});
          }
          if(inRange.length>0){
            // Sofortiger Treffer (zufällig)
            const target=inRange[Math.floor(Math.random()*inRange.length)];
            chess.capturedByPlayer.push(chess.board[target.r][target.c]);
            chess.board[target.r][target.c]=null;hits++;
            // Brennen: zweiter Feind (der nicht soeben getroffen wurde) brennt 3 Runden
            const remaining=inRange.filter(p=>!(p.r===target.r&&p.c===target.c));
            if(remaining.length>0){
              const burn=remaining[Math.floor(Math.random()*remaining.length)];
              if(!chess.burningSquares)chess.burningSquares=[];
              chess.burningSquares.push({r:burn.r,c:burn.c,turnsLeft:3});
              logText='🔥 Gottesfeuer! 1 Figur sofort verbrannt + 1 Feind brennt 3 Runden!';
            } else {
              logText='🔥 Gottesfeuer! 1 Figur sofort verbrannt!';
            }
          } else{chess.abilitiesLeft[id]=true;logText='🔥 Kein Ziel in Radius 3!';}
        }
      }
      if(ri<4){
        const names=['Feuerball','Flammensturm','Inferno','Sonnennova'];
        if(ri<4)logText=hits>0?'🔥 '+names[ri]+'! '+hits+' Figur(en) verbrannt!':'🔥 Kein Ziel in Reichweite!';
        if(!hits&&ri<4)chess.abilitiesLeft[id]=true;
      }
      break;
    }

    // ── DAME WASSER ────────────────────────────────────────────────
    case 'queen_water':{
      let qr=-1,qc=-1;
      for(let r=0;r<8&&qr<0;r++)for(let c=0;c<8&&qr<0;c++)
        if(chess.board[r][c]?.t==='Q'&&chess.board[r][c]?.col==='w'){qr=r;qc=c;}
      if(qr<0){chess.abilitiesLeft[id]=true;logText='🌊 Keine Dame auf Brett!';break;}
      const names=['Welle','Flut','Tsunami','Strudel','Sintflut'];

      // Hilfsfunktion: schiebt Feinde in einer Reihe (Zeile targetRow) um 'dist' Felder nach hinten (Richtung: weg von Dame)
      function pushRow(targetRow, dist){
        let pushed=0;
        for(let c=0;c<8;c++){
          if(chess.board[targetRow]?.[c]?.col==='b'&&chess.board[targetRow][c].t!=='K'){
            const dir=targetRow<=qr?-1:1; // weg von Dame (nach unten = +1 = Richtung eigene Linie)
            for(let d=dist;d>=1;d--){
              const nr=targetRow+dir*d;
              if(inB(nr,c)&&!chess.board[nr][c]){
                chess.board[nr][c]=chess.board[targetRow][c];chess.board[targetRow][c]=null;pushed++;break;
              }
            }
          }
        }
        return pushed;
      }

      let pushed=0;
      if(ri===0){
        // R1: Reihe direkt vor der Dame → 1 Feld zurück
        const targetRow=qr-1;
        if(inB(targetRow,0))pushed+=pushRow(targetRow,1);
        logText='🌊 '+names[0]+'! Reihe vor Dame: '+pushed+' Figur(en) 1 Feld zurück!';
      } else if(ri===1){
        // R2: Reihe direkt vor Dame → 2 Felder zurück
        const targetRow=qr-1;
        if(inB(targetRow,0))pushed+=pushRow(targetRow,2);
        logText='🌊 '+names[1]+'! Reihe vor Dame: '+pushed+' Figur(en) 2 Felder zurück!';
      } else if(ri===2){
        // R3: 3 Reihen — vor Dame + die 2 links/rechts davon (= Spalten qc-1, qc, qc+1, Reihe qr-1)
        const targetRow=qr-1;
        if(inB(targetRow,0)){
          for(let c2=Math.max(0,qc-1);c2<=Math.min(7,qc+1);c2++){
            if(chess.board[targetRow]?.[c2]?.col==='b'&&chess.board[targetRow][c2].t!=='K'){
              for(let d=3;d>=1;d--){
                const nr=targetRow-d;
                if(inB(nr,c2)&&!chess.board[nr][c2]){chess.board[nr][c2]=chess.board[targetRow][c2];chess.board[targetRow][c2]=null;pushed++;break;}
              }
            }
          }
        }
        logText='🌊 '+names[2]+'! 3 Spalten vor Dame: '+pushed+' Figur(en) 3 Felder zurück!';
      } else if(ri===3){
        // R4: Spieler wählt 3 Reihen via UI → zeige Reihen-Auswahl
        chess.waterRowSelectPending={id,count:3,selected:[],qr,qc};
        chess.abilitiesLeft[id]=true;
        logText='🌊 '+names[3]+'! Wähle 3 Reihen zum Zurückdrängen!';
        showWaterRowSelect();
      } else {
        // R5: Alle Reihen (ganzes Brett — jede Reihe mit Feinden 3 Felder zurück)
        for(let row=0;row<8;row++){pushed+=pushRow(row,3);}
        logText='🌊 '+names[4]+'! Sintflut! '+pushed+' Figur(en) auf dem ganzen Brett zurückgedrängt!';
      }
      if(ri!==3)renderBoard();
      break;
    }

    // ── DAME ERDE ──────────────────────────────────────────────────
    case 'queen_earth':{
      const turns=ri===0?1:ri===1?2:ri===2?2:ri===3?3:3;
      const scope=ri<=1?'w':'all'; // R3+: auch Feinde einfrieren
      let count=0;
      for(let r=0;r<8;r++)for(let c=0;c<8;c++){
        const p=chess.board[r][c];
        if(p&&(p.col==='w'||(scope==='all'&&p.col==='b'&&p.t!=='K'))){
          chess.frozenSquares.push({r,c,turns});count++;
        }
      }
      if(ri>=2&&scope==='all')chess.extraMove=true;
      const names=['Steinwall','Felsenfestung','Erdschild','Titanboden','Weltenstein'];
      logText='🏔 '+names[ri]+'! '+count+' Figuren '+turns+' Zug(e) unschlagbar'+(ri>=2?' + Extra-Zug!':'!');
      break;
    }

    // ── DAME WIND ──────────────────────────────────────────────────
    case 'queen_air':
      if(ri<=1){
        chess.extraMove=true;
        logText=ri===0?'🌪 Windstoß! Nochmal ziehen!':'🌪 Sturmböe! 2× Extra-Zug!';
        if(ri===1){chess.extraMove=true;} // wird eh nur 1× genutzt — stattdessen 2 Extra-Züge
      } else if(ri===2){
        chess.extraMove=true;
        // Teleportiert Dame auf ein zufälliges freies Feld
        let qr=-1,qc=-1;
        for(let r=0;r<8&&qr<0;r++)for(let c=0;c<8&&qr<0;c++)
          if(chess.board[r][c]?.t==='Q'&&chess.board[r][c]?.col==='w'){qr=r;qc=c;}
        const free=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(!chess.board[r][c])free.push({r,c});
        if(qr>=0&&free.length){const t=free[Math.floor(Math.random()*free.length)];chess.board[t.r][t.c]=chess.board[qr][qc];chess.board[qr][qc]=null;}
        logText='🌪 Wirbelwind! Dame teleportiert + Extra-Zug!';
      } else if(ri===3){
        chess.extraMove=true;
        // Alle eigenen Figuren dürfen sich 1 Feld bewegen (Extra-Züge)
        logText='🌪 Zyklone! Extra-Zug + alle Figuren aktiv!';
      } else {
        // R5: 3 Extra-Züge
        chess.extraMove=true;chess.extraMove2=true;chess.extraMove3=true;
        logText='🌪 Zeitschneide! 3 Extra-Züge!';
      }
      break;

    // ── DAME VITA ──────────────────────────────────────────────────
    case 'queen_vita':
      if(ri===0){
        // R1: 1 Figur zurückbringen
        if(chess.capturedByAI.length>0){
          const rev=chess.capturedByAI.pop();
          let placed=false;
          for(let c=0;c<8&&!placed;c++)if(!chess.board[7][c]){chess.board[7][c]={...rev,col:'w',moved:true};placed=true;}
          if(!placed)for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
          logText='💚 Lebensquell! '+CHESS_SYMS['w'+rev.t]+' kehrt zurück!';
        } else{chess.abilitiesLeft[id]=true;logText='💚 Keine Figuren zum Zurückbringen.';}
      } else if(ri===1){
        // R2: 2 Figuren zurückbringen
        let count=0;
        for(let i=0;i<2&&chess.capturedByAI.length>0;i++){
          const rev=chess.capturedByAI.pop();let placed=false;
          for(let c=0;c<8&&!placed;c++)if(!chess.board[7][c]){chess.board[7][c]={...rev,col:'w',moved:true};placed=true;}
          if(!placed)for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
          if(placed)count++;
        }
        logText=count>0?'💚 Wiedergeburt! '+count+' Figuren zurückgekehrt!':'💚 Keine Figuren zum Zurückbringen.';
        if(!count)chess.abilitiesLeft[id]=true;
      } else if(ri===2){
        // R3: Alle geschlagenen Figuren zurückbringen
        let count=0;
        while(chess.capturedByAI.length>0){
          const rev=chess.capturedByAI.pop();let placed=false;
          for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
          if(placed)count++;
        }
        logText=count>0?'💚 Auferstehung! Alle '+count+' Figuren zurück!':'💚 Keine Figuren zum Zurückbringen.';
        if(!count)chess.abilitiesLeft[id]=true;
      } else if(ri===3){
        // R4: Alle geschlagenen zurückbringen + Extra-Zug
        let count=0;
        while(chess.capturedByAI.length>0){
          const rev=chess.capturedByAI.pop();let placed=false;
          for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
          if(placed)count++;
        }
        chess.extraMove=true;
        logText=count>0?'💚 Ewiges Leben! Alle '+count+' Figuren zurück + Extra-Zug!':'💚 Extra-Zug!';
      } else {
        // R5: Spieler wählt 4 Figuren die zurückkehren
        if(chess.capturedByAI.length===0){chess.abilitiesLeft[id]=true;logText='💚 Keine Figuren zum Zurückbringen.';break;}
        if(chess.capturedByAI.length<=4){
          // Weniger als 4 → alle zurückbringen
          let count=0;
          while(chess.capturedByAI.length>0){
            const rev=chess.capturedByAI.pop();let placed=false;
            for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
            if(placed)count++;
          }
          logText='💚 Gnadenakt! Alle '+count+' Figuren zurück!';
        } else {
          // Mehr als 4 → Auswahl-UI zeigen
          chess.vitaSelectPending={id,count:4,selected:[]};
          chess.abilitiesLeft[id]=true;
          logText='💚 Gnadenakt! Wähle 4 Figuren die zurückkehren!';
          showVitaSelectUI();
        }
      }
      break;

    // ── DAME PHYS ──────────────────────────────────────────────────
    case 'queen_phys':{
      const removeCount=ri===0?1:ri===1?2:ri===2?3:ri===3?4:99;
      let count=0;
      const enemies=[];
      for(let r=0;r<8;r++)for(let c=0;c<8;c++){
        const p=chess.board[r][c];if(p?.col==='b'&&p.t!=='K')enemies.push({r,c,v:PIECE_VAL[p.t]||0});
      }
      enemies.sort((a,b)=>b.v-a.v).slice(0,removeCount===99?enemies.length:removeCount).forEach(e=>{
        chess.capturedByPlayer.push(chess.board[e.r][e.c]);chess.board[e.r][e.c]=null;count++;
      });
      const names=['Donnerschlag','Blitzschlag','Sturmschlag','Vernichtung','Götterzorn'];
      logText=count>0?'⚡ '+names[ri]+'! '+count+' Figur(en) vernichtet!':'⚡ Kein Ziel gefunden.';
      if(!count)chess.abilitiesLeft[id]=true;
      break;
    }

    // ── KÖNIG ──────────────────────────────────────────────────────
    case 'king_buff':{
      let kr=-1,kc=-1;
      for(let r=0;r<8&&kr<0;r++)for(let c=0;c<8&&kr<0;c++)
        if(chess.board[r][c]?.t==='K'&&chess.board[r][c]?.col==='w'){kr=r;kc=c;}
      if(kr<0){chess.abilitiesLeft[id]=true;logText='♔ Kein König gefunden!';break;}

      if(ri===0){
        // R1: Mit Nachbarfigur tauschen → dann noch normal ziehen
        const neighbors=[];
        for(const[dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
          const nr=kr+dr,nc=kc+dc;
          if(inB(nr,nc)&&chess.board[nr][nc]?.col==='w'&&chess.board[nr][nc].t!=='K')neighbors.push({r:nr,c:nc});
        }
        if(!neighbors.length){chess.abilitiesLeft[id]=true;logText='♔ Keine Nachbarfigur zum Tauschen!';break;}
        chess.kingSwapPending={kr,kc,neighbors};
        chess.abilitiesLeft[id]=true;
        logText='♔ Königstausch! Wähle eine Nachbarfigur zum Tauschen!';
        renderBoard();
      } else if(ri===1){
        // R2: Tauschen + Extra-Zug direkt
        const neighbors=[];
        for(const[dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
          const nr=kr+dr,nc=kc+dc;
          if(inB(nr,nc)&&chess.board[nr][nc]?.col==='w'&&chess.board[nr][nc].t!=='K')neighbors.push({r:nr,c:nc});
        }
        if(!neighbors.length){chess.abilitiesLeft[id]=true;logText='♔ Keine Nachbarfigur zum Tauschen!';break;}
        chess.kingSwapPending={kr,kc,neighbors,extraAfter:true};
        chess.abilitiesLeft[id]=true;
        logText='♔ Königsmanöver! Tauschen + Extra-Zug!';
        renderBoard();
      } else if(ri===2){
        // R3: Holt einen beliebigen geschlagenen Turm zurück (Spieler wählt)
        const lostRooks=chess.capturedByAI.filter(p=>p.t==='R');
        if(lostRooks.length){
          const rev=chess.capturedByAI.splice(chess.capturedByAI.lastIndexOf(lostRooks[lostRooks.length-1]),1)[0];
          let placed=false;
          for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)
            if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
          logText='♔ Königsbefehl! Turm ♜ zurückgeholt!';
        } else{
          // Kein Turm verloren — stattdessen König + Nachbarn unschlagbar
          chess.frozenSquares.push({r:kr,c:kc,turns:1});
          logText='♔ Kein Turm verloren — König 1 Zug unschlagbar!';
        }
      } else if(ri===3){
        // R4: Holt einen zufälligen geschlagenen Turm + König teleportiert
        const lostRooks=chess.capturedByAI.filter(p=>p.t==='R');
        if(lostRooks.length){
          const idx=chess.capturedByAI.lastIndexOf(lostRooks[0]);
          const rev=chess.capturedByAI.splice(idx,1)[0];
          let placed=false;
          for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)
            if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
          logText='♔ Rückruf! Turm zurück + ';
        } else { logText='♔ Kein Turm verloren + '; }
        // Teleport
        const free=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(!chess.board[r][c])free.push({r,c});
        if(free.length){const t=free[Math.floor(Math.random()*free.length)];chess.board[t.r][t.c]=chess.board[kr][kc];chess.board[kr][kc]=null;logText+='König teleportiert zu '+('abcdefgh'[t.c])+(8-t.r)+'!';}
      } else {
        // R5: Holt zufälligen Turm zurück + beliebigen weiteren geschlagenen + König schlägt Nachbarn
        let retrieved=0;
        // Zufälligen Turm
        const lostRooks=chess.capturedByAI.filter(p=>p.t==='R');
        if(lostRooks.length){
          const idx=chess.capturedByAI.lastIndexOf(lostRooks[0]);
          const rev=chess.capturedByAI.splice(idx,1)[0];
          let placed=false;
          for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)
            if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
          retrieved++;
        }
        // Beliebige weitere Figur
        if(chess.capturedByAI.length>0){
          const rev=chess.capturedByAI.pop();let placed=false;
          for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)
            if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
          retrieved++;
        }
        // König schlägt Nachbarn
        let killed=0;
        for(const[dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
          const nr=kr+dr,nc=kc+dc;
          if(inB(nr,nc)&&chess.board[nr][nc]?.col==='b'&&chess.board[nr][nc].t!=='K'){
            chess.capturedByPlayer.push(chess.board[nr][nc]);chess.board[nr][nc]=null;killed++;
          }
        }
        logText='♔ Königszorn! '+retrieved+' Figuren zurück + '+killed+' Feinde vernichtet!';
        logText=killed>0?'♔ Königszorn! '+killed+' Feinde im Umkreis vernichtet!':'♔ Keine Feinde in Reichweite.';
        if(!killed)chess.abilitiesLeft[id]=true;
      }
      break;
    }

    default:
      logText='✨ '+desc;
  }

  if(logText)chess.moveLog.push({text:logText,ai:false,special:true});
  renderBoard();renderMoveLog();renderAbilities();
}

// ── VITA R5: Auswahl-UI für 4 Figuren ────────────────────────
function showVitaSelectUI(){
  const pending=chess.vitaSelectPending;if(!pending)return;
  const el=q('#chess-board');if(!el)return;
  el.style.position='relative';

  const available=[...chess.capturedByAI];
  // Entferne Duplikate nach Typ für bessere Darstellung
  let overlay=document.getElementById('vita-overlay');
  if(overlay)overlay.remove();
  overlay=document.createElement('div');
  overlay.id='vita-overlay';
  overlay.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:55;border-radius:6px;padding:8px;';

  const title=document.createElement('div');
  title.style.cssText='font-size:.6rem;color:#00ff88;letter-spacing:2px;font-weight:bold;margin-bottom:4px';
  title.textContent='💚 WÄHLE 4 FIGUREN ('+pending.selected.length+'/4)';
  overlay.appendChild(title);

  const grid=document.createElement('div');
  grid.style.cssText='display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:220px';

  available.forEach((p,i)=>{
    const isSelected=pending.selected.includes(i);
    const btn=document.createElement('button');
    btn.style.cssText='padding:6px 10px;border-radius:8px;border:2px solid '+(isSelected?'#00ff88':'#1a3a1a')+
      ';background:'+(isSelected?'#003318':'#080e08')+';color:#fff;font-size:1.1rem;cursor:pointer;';
    btn.textContent=CHESS_SYMS['w'+(p.t||'P')];
    btn.onclick=()=>{
      const idx=pending.selected.indexOf(i);
      if(idx>=0)pending.selected.splice(idx,1);
      else if(pending.selected.length<4)pending.selected.push(i);
      showVitaSelectUI();
    };
    grid.appendChild(btn);
  });
  overlay.appendChild(grid);

  const confirmBtn=document.createElement('button');
  confirmBtn.style.cssText='margin-top:8px;padding:8px 20px;border-radius:8px;border:2px solid #00ff88;background:#003318;color:#00ff88;font-size:.65rem;cursor:pointer;font-weight:bold;';
  confirmBtn.textContent='✅ BESTÄTIGEN ('+pending.selected.length+'/4)';
  confirmBtn.disabled=pending.selected.length===0;
  confirmBtn.onclick=()=>{
    overlay.remove();
    // Ausgewählte Figuren zurückbringen (von hinten nach vorne um Indexverschiebung zu vermeiden)
    const sortedIdx=[...pending.selected].sort((a,b)=>b-a);
    let count=0;
    sortedIdx.forEach(i=>{
      if(i<chess.capturedByAI.length){
        const rev=chess.capturedByAI.splice(i,1)[0];
        let placed=false;
        for(let r=5;r<8&&!placed;r++)for(let c=0;c<8&&!placed;c++)
          if(!chess.board[r][c]){chess.board[r][c]={...rev,col:'w',moved:true};placed=true;}
        if(placed)count++;
      }
    });
    chess.vitaSelectPending=null;
    chess.abilitiesLeft['queen_vita']=false;
    chess.moveLog.push({text:'💚 Gnadenakt! '+count+' ausgewählte Figuren zurückgekehrt!',ai:false,special:true});
    renderBoard();renderMoveLog();renderCaptured();renderAbilities();
  };
  overlay.appendChild(confirmBtn);

  el.appendChild(overlay);
}

// ── WASSER R4: Reihenauswahl ──────────────────────────────────
function showWaterRowSelect(){
  const pending=chess.waterRowSelectPending;if(!pending)return;
  const el=q('#chess-board');if(!el)return;
  el.style.position='relative';

  let overlay=document.getElementById('water-overlay');
  if(overlay)overlay.remove();
  overlay=document.createElement('div');
  overlay.id='water-overlay';
  overlay.style.cssText='position:absolute;inset:0;background:rgba(0,0,8,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:55;border-radius:6px;padding:8px;';

  const title=document.createElement('div');
  title.style.cssText='font-size:.6rem;color:#00aaff;letter-spacing:2px;font-weight:bold;margin-bottom:4px';
  title.textContent='🌊 WÄHLE 3 REIHEN ('+pending.selected.length+'/3)';
  overlay.appendChild(title);

  const info=document.createElement('div');
  info.style.cssText='font-size:.5rem;color:#005588;margin-bottom:6px';
  info.textContent='Reihe 8 = gegnerische Startlinie';
  overlay.appendChild(info);

  const btnRow=document.createElement('div');
  btnRow.style.cssText='display:flex;gap:5px;';
  for(let row=0;row<8;row++){
    const isSelected=pending.selected.includes(row);
    const hasPieces=chess.board[row]?.some(p=>p?.col==='b');
    const btn=document.createElement('button');
    btn.style.cssText='padding:8px 10px;border-radius:6px;border:2px solid '+(isSelected?'#00aaff':hasPieces?'#1a3a5a':'#0a1a2a')+
      ';background:'+(isSelected?'#00114a':'#040810')+';color:'+(hasPieces?'#fff':'#333')+
      ';font-size:.7rem;cursor:pointer;font-weight:bold;';
    btn.textContent=(8-row);
    btn.onclick=()=>{
      const idx=pending.selected.indexOf(row);
      if(idx>=0)pending.selected.splice(idx,1);
      else if(pending.selected.length<3)pending.selected.push(row);
      showWaterRowSelect();
    };
    btnRow.appendChild(btn);
  }
  overlay.appendChild(btnRow);

  const confirmBtn=document.createElement('button');
  confirmBtn.style.cssText='margin-top:8px;padding:8px 20px;border-radius:8px;border:2px solid #00aaff;background:#00114a;color:#00aaff;font-size:.65rem;cursor:pointer;font-weight:bold;';
  confirmBtn.textContent='🌊 FLUTEN ('+pending.selected.length+'/3)';
  confirmBtn.onclick=()=>{
    overlay.remove();
    let pushed=0;
    pending.selected.forEach(row=>{
      for(let c=0;c<8;c++){
        if(chess.board[row]?.[c]?.col==='b'&&chess.board[row][c].t!=='K'){
          const dir=row<=pending.qr?-1:1;
          for(let d=4;d>=1;d--){
            const nr=row+dir*d;
            if(inB(nr,c)&&!chess.board[nr][c]){chess.board[nr][c]=chess.board[row][c];chess.board[row][c]=null;pushed++;break;}
          }
        }
      }
    });
    chess.waterRowSelectPending=null;
    chess.abilitiesLeft['queen_water']=false;
    chess.moveLog.push({text:'🌊 Strudel! '+pushed+' Figuren aus 3 Reihen zurückgedrängt!',ai:false,special:true});
    renderBoard();renderMoveLog();renderCaptured();renderAbilities();
  };
  overlay.appendChild(confirmBtn);

  el.appendChild(overlay);
}

function showPromotionUI(r,c){
  setStatus('♛ Bauernumwandlung! Wähle eine Figur:','#ffd700');
  // Zeige Modal über dem Brett (mobile-freundlich)
  let modal = q('#promo-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'promo-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:200;align-items:center;justify-content:center;';
    document.body.appendChild(modal);
  }
  modal.innerHTML =
    '<div style="background:#0d0a06;border:2px solid #c8a000;border-radius:14px;padding:24px 20px;text-align:center;box-shadow:0 0 40px #c8a00055;max-width:320px;width:90%">'
    +'<div style="font-size:.6rem;color:#ffd700;letter-spacing:3px;margin-bottom:16px">♛ BAUERNUMWANDLUNG</div>'
    +'<div style="font-size:.7rem;color:#888;margin-bottom:16px">Wähle eine Figur:</div>'
    +'<div style="display:flex;gap:12px;justify-content:center">'
    +[['Q','♕','Dame'],['R','♖','Turm'],['B','♗','Läufer'],['N','♘','Springer']].map(([t,sym,name])=>
      `<button onclick="finishPromotion('${t}')" style="background:#1a0e00;border:2px solid #c8a000;border-radius:10px;padding:12px 10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;touch-action:manipulation;min-width:56px">`
      +`<span style="font-size:2rem;color:#fff8e0">${sym}</span>`
      +`<span style="font-size:.45rem;color:#c8a000;letter-spacing:1px">${name}</span>`
      +`</button>`
    ).join('')
    +'</div>'
    +'</div>';
  modal.style.display = 'flex';
}

function showPawnTransformUI(r,c){
  setStatus('⚔️ Verwandlung! Wähle eine Figur (nicht Dame/König):','#bb55ff');
  const el=q('#chess-board');if(!el)return;
  const overlay=document.createElement('div');
  overlay.id='transform-overlay';
  overlay.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:51;border-radius:6px;';
  overlay.innerHTML='<div style="font-size:.6rem;color:#bb55ff;letter-spacing:2px;margin-bottom:4px">⚔️ VERWANDLUNG (R5)</div>'+
    '<div style="display:flex;gap:10px">'+
    [['R','\u2656','Turm'],['B','\u2657','Läufer'],['N','\u2658','Springer']].map(([t,sym,name])=>
      `<button onclick="finishPawnTransform('${t}',${r},${c})" style="background:#1a0018;border:2px solid #bb55ff;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:1.4rem;color:#fff8e0;display:flex;flex-direction:column;align-items:center;gap:2px" onmouseover="this.style.background='#2a0030'" onmouseout="this.style.background='#1a0018'"><span>${sym}</span><span style="font-size:.45rem;color:#bb55ff">${name}</span></button>`
    ).join('')+
    '</div>';
  el.style.position='relative';
  el.appendChild(overlay);
}

function finishPawnTransform(pieceType,r,c){
  const overlay=q('#transform-overlay');if(overlay)overlay.remove();
  if(!chess.board[r][c])return;
  const orig=chess.board[r][c];
  chess.board[r][c]={...orig,t:pieceType};
  // Mark the correct ability as used
  const abilId=COLL_PIECES[orig.variant?'bauer_'+orig.variant.toLowerCase().slice(0,2):'bauer_s']?.abilityId||'pawn_spear';
  chess.abilitiesLeft[abilId]=false;
  chess.pawnTransformPending=null;
  chess.moveLog.push({text:'⚔️ Verwandlung! Bauer wird zu '+CHESS_SYMS['w'+pieceType]+'!',ai:false,special:true});
  renderBoard();renderMoveLog();renderAbilities();
}

function finishPromotion(pieceType){
  const m=q('#promo-modal');if(m)m.style.display='none';
  const old=q('#promo-overlay');if(old)old.remove();
  chess.board[r][c].t=pieceType;
  const sym=CHESS_SYMS['w'+pieceType];
  chess.moveLog.push({text:'\u265F\u2192'+sym+' Umwandlung auf '+'abcdefgh'[c]+(8-r)+'!',ai:false,special:true});
  if(pieceType==='Q')trackQuestStat('promotions',1);
  chess.promotionPending=null;
  const move=chess.lastMove;
  if(!chess.extraMove){chess.extraMove=false;}
  const nextCol='b';
  const nextMoves=getAllLegalMoves(chess.board,nextCol,move);
  const inCheck=isInCheck(chess.board,nextCol);
  if(nextMoves.length===0){
    renderBoard();renderMoveLog();renderCaptured();
    chess.status='checkmate';
    showResult(true,inCheck?'SCHACHMATT! Du gewinnst!':'PATT-SIEG! Du gewinnst!');
    return;
  }
  if(inCheck){setStatus('SCHACH! KI-König im Schach!','#ff8800');trackQuestStat('checks',1);}
  chess.turn='b';
  renderBoard();renderMoveLog();renderCaptured();
  renderAbilities();
  if(!chess.extraMove){
    setStatus('KI denkt\u2026','#888888');
    setTimeout(()=>aiTurn(),500);
  } else {
    chess.extraMove=false;
    setStatus('Extra-Zug! Wähle eine Figur','#ff9900');
  }
}

function showResult(won,text){
  const el=q('#game-result');if(!el)return;
  // Quest tracking
  trackQuestStat('fights',1);
  const byMatt=chess.status==='checkmate';
  trackEndOfGame(won===true, byMatt);
  let extra='';
  if(won===true){
    const r=onWin();
    const rank=RANKS[G.rankIdx];
    extra='<div style="color:#4aff4a;margin:6px 0">+'+r.keys+' \uD83D\uDD11 Schl\u00FCssel</div>';
    if(r.promoted){
      extra+=
        '<div style="background:linear-gradient(135deg,#1a0800,#2a1500);border:2px solid '+rank.color+';border-radius:10px;padding:10px;margin:8px 0;text-align:center">'+
        '<div style="font-size:1.2rem">\uD83C\uDF89 AUFGESTIEGEN!</div>'+
        '<div style="color:'+rank.color+';font-size:.9rem;font-weight:bold;margin:4px 0">'+rank.name+(rank.tier?' '+rank.tier:'')+'</div>'+
        '<div style="color:#ffd700;font-size:.85rem">+'+r.promotionKeys+' \uD83D\uDD11 Aufstiegs-Belohnung!</div>'+
        '</div>';
    }
  } else if(won===false&&chess.status==='checkmate'){
    const r=onLoss();
    if(r.demoted){
      extra='<div style="color:#ff6644;margin:6px 0">\u2B07 ABGESTIEGEN: '+getEloRankName()+'</div>';
    } else {
      // First loss warning
      const remaining=2-G.lossStreak;
      extra='<div style="color:#ff9900;margin:6px 0">\u26A0\uFE0F Warnung! Noch 1 Niederlage \u2192 Abstieg</div>';
    }
  }
  el.style.display='block';
  el.innerHTML='<div style="text-align:center;padding:14px">'+
    '<div style="font-size:1.8rem;color:'+(won?'#ffd700':won===null?'#c8a000':'#ff4444')+'">'+
    (won?'\uD83C\uDFC6':won===null?'\uD83E\uDD1D':'\uD83D\uDC80')+' '+text+'</div>'+
    extra+
    '<div style="display:flex;gap:8px;justify-content:center;margin-top:12px">'+
    '<button class="cw-btn" onclick="startNewGame()">&#9822; Neu spielen</button>'+
    '<button class="cw-btn" onclick="chess.status=\'idle\';showPregameSelect()" style="border-color:#00e5ff;color:#00e5ff">&#9881;&#65039; Neu aufstellen</button>'+
    '</div></div>';
  setStatus(text,won?'#ffd700':won===null?'#c8a000':'#ff4444');
  stopMoveTimer();
  const hb=q('#draw-btn');if(hb)hb.style.display='none';
  const rb=q('#resign-btn');if(rb)rb.style.display='none';
  updateTopBar();
}


// ============================================================
// QUEST SYSTEM
// ============================================================

// ============================================================
// SCREENS
// ============================================================

let currentScreen='';

// Which variant is selected per group for pregame
// e.g. {dame:'v', bauer:'s', ...}
// pregameSetup: {group: [{v,ri}, ...]} — ein Eintrag pro Position
// Gruppen-Größen: turm:2, springer:2, laeufer:2, dame:1, koenig:1, bauer:8
const PREGAME_GROUP_SLOTS={turm:2,springer:2,laeufer:2,dame:1,koenig:1,bauer:8};

function getAvailableRanksForGroup(group){
  // Gibt alle besessenen {v,ri,cnt} zurück
  const result=[];
  const pg=PIECE_GROUPS.find(p=>p.group===group);if(!pg)return result;
  pg.pids.forEach(pid=>{
    const v=pidVariant(pid);
    (G.inventory?.[group]?.[v]||[]).forEach((cnt,ri)=>{if(cnt>0)result.push({v,ri,cnt});});
  });
  return result;
}

function getDefaultPregameSetup(){
  const setup={};
  PIECE_GROUPS.forEach(pg=>{
    const group=pg.group;
    const slots=PREGAME_GROUP_SLOTS[group]||1;
    const avail=getAvailableRanksForGroup(group);
    // Verteile beste Ränge auf Slots (höchster Rang zuerst, dann auffüllen)
    const sorted=[...avail].sort((a,b)=>b.ri-a.ri);
    // Pool aufbauen: wie viele pro Rang vorhanden
    const pool=[];
    sorted.forEach(o=>{for(let i=0;i<o.cnt&&pool.length<slots;i++)pool.push({v:o.v,ri:o.ri});});
    // Rest mit Rang 0 auffüllen wenn vorhanden
    const fallback=avail.length>0?{v:avail[0].v,ri:avail[0].ri}:{v:pg.pids[0]?pidVariant(pg.pids[0]):'s',ri:0};
    while(pool.length<slots)pool.push({...fallback});
    setup[group]=pool.slice(0,slots);
  });
  if(setup.dame)G.selectedDame=setup.dame[0]?.v||'';
  return setup;
}

let pregameSetup={};
let currentPickerPos=null;

function saveSlot(idx){
  try{
    localStorage.setItem('cw_slot_'+idx, JSON.stringify(pregameSetup));
    const btn=q('#slot-save-'+idx);
    if(btn){const orig=btn.textContent;btn.textContent='✅ Gespeichert!';setTimeout(()=>btn.textContent=orig,1200);}
  }catch(e){}
}

function loadSlot(idx){
  try{
    const data=localStorage.getItem('cw_slot_'+idx);
    if(!data){alert('Slot '+(idx+1)+' ist leer!');return;}
    pregameSetup=JSON.parse(data);
    renderPregameBoard();
    const btn=q('#slot-load-'+idx);
    if(btn){const orig=btn.textContent;btn.textContent='✅ Geladen!';setTimeout(()=>btn.textContent=orig,1200);}
  }catch(e){alert('Fehler beim Laden.');}
}

const PREGAME_LAYOUT_BACK=['R','N','B','Q','K','B','N','R'];
const PREGAME_LAYOUT_PAWNS=['P','P','P','P','P','P','P','P'];
const TYPE_TO_GROUP={R:'turm',N:'springer',B:'laeufer',Q:'dame',K:'koenig',P:'bauer'};

// Zählt wie viele Slots im Setup bereits einen bestimmten {v,ri} nutzen
function countUsedSlots(group,v,ri,excludePos){
  const slots=pregameSetup[group]||[];
  return slots.filter((s,i)=>i!==excludePos&&s.v===v&&s.ri===ri).length;
}

function openPiecePicker(group,posIdx){
  currentPickerPos={group,posIdx};
  const pg=PIECE_GROUPS.find(p=>p.group===group);if(!pg)return;
  const avail=getAvailableRanksForGroup(group);
  if(!avail.length)return;

  const modal=q('#piece-picker-modal');
  const grid=q('#ppm-grid');
  const title=q('#ppm-title');
  if(!modal||!grid)return;

  const cp0=COLL_PIECES[pg.pids[0]];
  title.textContent=(cp0?cp0.name.toUpperCase():group.toUpperCase())+' – POSITION '+(posIdx+1);
  grid.innerHTML='';

  const cur=pregameSetup[group]?.[posIdx];

  avail.forEach(opt=>{
    const pid=pg.pids.find(p=>pidVariant(p)===opt.v)||pg.pids[0];
    const cp=COLL_PIECES[pid];if(!cp)return;
    const rd=RARITIES[RARITY_ORDER[opt.ri]];
    const used=countUsedSlots(group,opt.v,opt.ri,posIdx);
    const remaining=opt.cnt-used;
    const canSelect=remaining>0;
    const isSelected=cur&&cur.v===opt.v&&cur.ri===opt.ri;

    const row=document.createElement('div');
    row.style.cssText=
      'display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;'+
      'border:2px solid '+(isSelected?rd.color:canSelect?'#2a1800':'#1a1000')+';'+
      'background:'+(isSelected?rd.bg+'44':canSelect?'#0a0600':'#070400')+';'+
      'cursor:'+(canSelect?'pointer':'default')+';opacity:'+(canSelect?'1':'0.4')+';transition:all .15s;';
    if(canSelect&&!isSelected){
      row.onmouseenter=()=>row.style.borderColor='#4a3010';
      row.onmouseleave=()=>row.style.borderColor='#2a1800';
    }
    row.innerHTML=
      '<span style="font-size:2rem;color:'+rd.color+';filter:drop-shadow(0 0 6px '+rd.color+'88)">'+cp.chess+'</span>'+
      '<div style="flex:1">'+
        '<div style="font-size:.75rem;font-weight:bold;color:'+rd.color+'">'+getPieceRankName(group,RARITY_ORDER[opt.ri])+'</div>'+
        '<div style="font-size:.6rem;color:#888;margin-top:1px">'+opt.cnt+'× besessen &bull; '+remaining+' noch verfügbar</div>'+
      '</div>'+
      (isSelected?'<span style="color:'+rd.color+';font-size:1.2rem">✓</span>':'');
    if(canSelect){
      row.onclick=()=>{
        pregameSetup[group][posIdx]={v:opt.v,ri:opt.ri};
        if(group==='dame')G.selectedDame=opt.v;
        save();
        closePiecePicker();
        renderPregameBoard();
      };
    }
    grid.appendChild(row);
  });

  modal.style.display='flex';
}

function closePiecePicker(){
  const m=q('#piece-picker-modal');if(m)m.style.display='none';
  currentPickerPos=null;
}

function cycleVariant(group){ openPiecePicker(group,0); }

function renderPregameBoard(){
  const el=q('#pregame-board');if(!el)return;
  el.innerHTML='';

  // Baue eine flache Liste: [{type,group,posIdx}] für Grundlinie dann Bauern
  // Nur Slots die tatsächlich besetzt sind anzeigen (laut ownedCount)
  const rows=[PREGAME_LAYOUT_BACK,PREGAME_LAYOUT_PAWNS];
  // Zähle pro Gruppe wie viele Slots besetzt sind
  const slotCount={};
  PIECE_GROUPS.forEach(pg=>{
    const group=pg.group;
    const avail=getAvailableRanksForGroup(group);
    const total=avail.reduce((s,o)=>s+o.cnt,0);
    const max=PREGAME_GROUP_SLOTS[group]||1;
    slotCount[group]=Math.min(total,max);
  });
  // Positions-Index pro Gruppe
  const posCounter={};

  rows.forEach((rowTypes,rowIdx)=>{
    rowTypes.forEach((type,col)=>{
      const group=TYPE_TO_GROUP[type];
      if(posCounter[group]===undefined)posCounter[group]=0;
      const posIdx=posCounter[group];
      const slots=slotCount[group]||0;
      const hasSlot=posIdx<slots;
      posCounter[group]++;

      const cell=document.createElement('div');
      const isLight=(rowIdx+col)%2===0;
      cell.style.cssText=
        'aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;'+
        'background:'+(isLight?'#2a1c08':'#0e0904')+';position:relative;transition:all .2s;';

      if(!hasSlot){
        // Leeres Feld — keine Figur
        cell.style.opacity='0.25';
        cell.innerHTML='<span style="font-size:clamp(.8rem,3vw,1.2rem);color:#2a1800">'+CHESS_SYMS['w'+type]+'</span>';
      } else {
        const sel=pregameSetup[group]?.[posIdx]||{v:'s',ri:0};
        const rd=RARITIES[RARITY_ORDER[sel.ri]]||RARITIES.normal;
        cell.style.cursor='pointer';
        cell.onmouseenter=()=>cell.style.background=isLight?'#4a3010':'#2a1a08';
        cell.onmouseleave=()=>cell.style.background=isLight?'#2a1c08':'#0e0904';
        cell.onclick=()=>openPiecePicker(group,posIdx);
        cell.innerHTML=
          '<span style="font-size:clamp(1.2rem,5vw,2rem);color:'+rd.color+';filter:drop-shadow(0 0 6px '+rd.color+'88)">'+CHESS_SYMS['w'+type]+'</span>'+
          '<span style="font-size:.32rem;color:'+rd.color+';letter-spacing:.5px;line-height:1;margin-top:1px">R'+(sel.ri+1)+'</span>'+
          '<span style="position:absolute;top:1px;right:2px;font-size:.45rem;color:'+rd.color+'66">⇄</span>';
      }
      el.appendChild(cell);
    });
  });
}

function showPregameSelect(){
  const pg=q('#pregame-select');
  const board=q('#chess-board');
  const status=q('#chess-status');
  const abilityBar=q('#ability-bar');
  const moveLog=q('#move-log');
  const capRow=q('.captured-row');
  const gameResult=q('#game-result');
  if(pg)pg.style.display='flex';
  if(board)board.style.display='none';
  if(status)status.style.display='none';
  if(abilityBar)abilityBar.style.display='none';
  if(moveLog)moveLog.style.display='none';
  if(capRow)capRow.style.display='none';
  if(gameResult)gameResult.style.display='none';
  pregameSetup=getDefaultPregameSetup();
  renderPregameBoard();
}

function confirmDameAndStart(){
  const pg=q('#pregame-select');
  const board=q('#chess-board');
  const status=q('#chess-status');
  const abilityBar=q('#ability-bar');
  const moveLog=q('#move-log');
  const capRow=q('.captured-row');
  if(pg)pg.style.display='none';
  if(board)board.style.display='';
  if(status)status.style.display='';
  if(abilityBar)abilityBar.style.display='';
  if(moveLog)moveLog.style.display='';
  if(capRow)capRow.style.display='';
  startNewGame();
}

function renderDameSelector(){
  const el=q('#dame-selector');if(!el)return;
  const damePids=PIECE_GROUPS.find(p=>p.group==='dame').pids;
  const owned=damePids.filter(pid=>(G.inventory?.dame?.[pidVariant(pid)]||[]).some(c=>c>0));
  if(owned.length<=1){el.style.display='none';return;}
  el.style.display='block';
  el.innerHTML='<div style="font-size:.52rem;color:#4a3a18;letter-spacing:1px;text-align:center;margin-bottom:5px">MAGIERIN W\u00C4HLEN</div>';
  const row=document.createElement('div');
  row.style.cssText='display:flex;gap:5px;justify-content:center;flex-wrap:wrap;';
  owned.forEach(pid=>{
    const cp=COLL_PIECES[pid];
    const v=pidVariant(pid);
    const isSel=G.selectedDame===v;
    const counts=G.inventory?.dame?.[v]||[];
    const bestRi=counts.reduce((b,c,i)=>c>0?i:b,-1);
    const rd=bestRi>=0?RARITIES[RARITY_ORDER[bestRi]]:RARITIES.normal;
    const btn=document.createElement('button');
    btn.style.cssText='padding:5px 9px;border-radius:8px;border:2px solid '+(isSel?rd.color:'#221500')+';background:'+(isSel?rd.bg:'#0a0600')+';color:'+(isSel?rd.color:'#443322')+';font-size:.72rem;cursor:pointer;'+(isSel?'box-shadow:0 0 8px '+rd.glow+';':'');
    btn.textContent=cp.chess+' '+cp.variant;
    btn.onclick=()=>{
      G.selectedDame=v;save();
      renderDameSelector();
      if(chess.status==='playing')renderAbilities();
    };
    row.appendChild(btn);
  });
  el.appendChild(row);
}

function showScreen(id){
  document.querySelectorAll('.cw-screen').forEach(s=>s.style.display='none');
  const el=q('#s-'+id);if(el)el.style.display='flex';
  currentScreen=id;
  updateTopBar();
  if(id==='home')renderHome();
  if(id==='play'){if(chess.status==='idle')showPregameSelect();else renderDameSelector();}
  if(id==='quests')renderQuestScreen();
  if(id==='collection')renderCollection();
  if(id==='chest')renderChestScreen();
}

function updateTopBar(){
  const kb=q('#tb-keys');if(kb)kb.textContent=G.keys;
  const rk=q('#tb-rank');if(rk){rk.textContent=getEloRankName();rk.style.color=RANKS[G.rankIdx].color;}
}

function renderHome(){
  const r=RANKS[G.rankIdx];
  const rn=getEloRankName();
  if(q('#h-rank')){q('#h-rank').textContent=rn;q('#h-rank').style.color=r.color;}
  if(q('#h-keys'))q('#h-keys').textContent=G.keys;
  const wn=r.winsNeeded;
  if(q('#h-streak'))q('#h-streak').textContent=G.winStreak+(wn?' / '+wn:' / MAX');
  if(q('#h-record'))q('#h-record').textContent=G.totalWins+'S / '+(G.totalFights-G.totalWins)+'N';
  // Abstiegs-Warnung anzeigen
  const warnEl=q('#h-loss-warn');
  if(warnEl){
    if(G.lossStreak===1&&G.rankIdx>0){
      warnEl.textContent='\u26A0\uFE0F Noch 1 Niederlage \u2192 Abstieg!';
      warnEl.style.display='block';
    } else {
      warnEl.style.display='none';
    }
  }
  const pct=wn?Math.min(100,G.winStreak/wn*100):100;
  if(q('#h-sbar')){q('#h-sbar').style.width=pct+'%';q('#h-sbar').style.background=r.color;}
  // Rang-Leiter
  const ladder=q('#rank-ladder');if(!ladder)return;
  ladder.innerHTML='';
  // Rang-Medaillen Emojis
  const rankMedals={'Amateur':'\u26AA','Bronze':'\uD83E\uDD49','Silber':'\uD83E\uDD48','Gold':'\uD83E\uDD47','Platin':'\uD83D\uDCA0','Diamant':'\uD83D\uDC8E','Meister':'\uD83D\uDD25','Grandmeister':'\uD83D\uDC51','Legende':'\u2B50'};
  RANKS.forEach((rk,i)=>{
    const name=rk.tier>0?rk.name+' '+rk.tier:rk.name;
    const isCurrent=i===G.rankIdx;
    const isDone=i<G.rankIdx;
    const isFuture=i>G.rankIdx;
    const medal=rankMedals[rk.name]||'\u25CB';
    const row=document.createElement('div');
    // Current: glowing border. Done: subtle colored. Future: dark
    let rowStyle='display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;margin-bottom:3px;transition:all .2s;';
    if(isCurrent){
      rowStyle+='background:linear-gradient(135deg,'+rk.color+'22,'+rk.color+'11);border:1px solid '+rk.color+';box-shadow:0 0 12px '+rk.color+'55;';
    } else if(isDone){
      rowStyle+='background:'+rk.color+'0a;border:1px solid '+rk.color+'44;';
    } else {
      rowStyle+='background:#0a0800;border:1px solid #1a1400;';
    }
    row.style.cssText=rowStyle;
    const nameColor=isCurrent?rk.color:isDone?rk.color+'cc':'#2a2010';
    const medalColor=isCurrent?rk.color:isDone?rk.color+'99':'#1a1408';
    const icon=isCurrent?'\u25B6':isDone?'\u2713':'';
    row.innerHTML=
      '<span style="font-size:.9rem;filter:'+(isFuture?'grayscale(1) brightness(.3)':'none')+'">'+medal+'</span>'+
      '<span style="font-size:.72rem;font-weight:'+(isCurrent?'bold':'normal')+';color:'+nameColor+';flex:1;'+(isCurrent?'text-shadow:0 0 8px '+rk.color+'88;':'')+'">'+name+'</span>'+
      (isCurrent&&wn?'<span style="font-size:.6rem;color:'+rk.color+';font-weight:bold">'+G.winStreak+'/'+wn+'</span>':'')
      +(isCurrent&&G.lossStreak===1?'<span style="font-size:.55rem;color:#ff9900">\u26A0</span>':'')
      +(!isDone&&!isCurrent&&rk.winsNeeded?'<span style="font-size:.52rem;color:#2a2010">'+rk.winsNeeded+' Siege</span>':'')
      +(!rk.winsNeeded&&isCurrent?'<span style="font-size:.55rem;color:'+rk.color+'">MAX</span>':'')
      +(icon?'<span style="font-size:.6rem;color:'+nameColor+'">'+icon+'</span>':'');
    ladder.appendChild(row);
  });
}

// Figuren-Gruppen für Inventar (6 Hauptfiguren)
const PIECE_GROUPS = [
  {group:'bauer',   name:'Bauer',   chess:'\u2659', pids:['bauer_s','bauer_b','bauer_sh','bauer_a','bauer_be','bauer_h']},
  {group:'turm',    name:'Turm',    chess:'\u2656', pids:['turm_s']                                         },
  {group:'laeufer', name:'Läufer',  chess:'\u2657', pids:['laeufer_d']                                      },
  {group:'springer',name:'Springer',chess:'\u2658', pids:['springer_m']                                     },
  {group:'dame',    name:'Dame',    chess:'\u2655', pids:['dame_f','dame_w','dame_e','dame_l','dame_v','dame_p']},
  {group:'koenig',  name:'König',   chess:'\u2654', pids:['koenig_b']                                       }
];

function pidVariant(pid){return pid.split('_').pop();}

// Passiv-Boni pro Gruppe und Rang (Index 0-4)
// ── Pro Rang: {aktiv, passiv} für jede Variante ──────────────────
const RANK_ABILITIES = {
  // ── BAUER: SPEERTRÄGER ─────────────────────────
  bauer_s: [
    {label:'Schildblock',       aktiv:'Schildblock — schützt diesen Bauer 1 Zug',                      passiv:'Kann Angreifer einmal abwehren'},
    {label:'Schildblock+',      aktiv:'Schildblock — blockiert Angreifer (2 Züge Schutz)',               passiv:'Kann Angreifer abwehren'},
    {label:'Speerstoß',         aktiv:'Speerstoß — droht 2 Felder diagonal + Extra-Zug',                passiv:'Droht 2 Felder diagonal'},
    {label:'Eisenwille',        aktiv:'Eisenwille — alle Bauern überleben nächsten Treffer',             passiv:'Überlebt ersten Treffer automatisch'},
    {label:'Königsgarde-Aura',  aktiv:'Königsgarde-Aura — alle Nachbarn 1 Zug unschlagbar',             passiv:'Alle Nachbarfiguren erhalten +1 Schutz'},
  ],
  // ── BAUER: BOGENSCHÜTZE ────────────────────────
  bauer_b: [
    {label:'Fernschuss',        aktiv:'Fernschuss — schlägt 1 Feld diagonal ohne Bewegung',                    passiv:'Kann diagonal schlagen ohne zu ziehen'},
    {label:'Fernschuss+',       aktiv:'Fernschuss — schlägt bis 2 Felder diagonal ohne Bewegung',              passiv:'Reichweite 2 Felder diagonal'},
    {label:'Bogenhagel',        aktiv:'Bogenhagel — alle Bauern schlagen bis 2 Felder diagonal',               passiv:'Reichweite 2 Felder diagonal'},
    {label:'Doppelschuss',      aktiv:'Doppelschuss — trifft 2 Feinde in Reichweite gleichzeitig',             passiv:'Zwei Angriffe pro Fähigkeit'},
    {label:'Präzisionsschuss',  aktiv:'Präzisionsschuss — eliminiert stärkste Figur in Radius 2',              passiv:'Zielt immer auf stärkste Figur in Reichweite'},
  ],
  // ── BAUER: SCHILDTRÄGER ───────────────────────
  bauer_sh: [
    {label:'Schutzschild',      aktiv:'Schutzschild — gibt Nachbarfigur 1 Zug Schutz',                         passiv:'Kann Nachbarfiguren schützen'},
    {label:'Schutzschild+',     aktiv:'Schutzschild — gibt 2 Nachbarn je 1 Zug Schutz',                        passiv:'Kann mehrere Nachbarn schützen'},
    {label:'Heldentod',         aktiv:'Opfer — gibt sich für König hin, König 2 Züge unschlagbar',             passiv:'Kann sich für den König opfern'},
    {label:'Schildmauer',       aktiv:'Schildmauer — alle Bauern 1 Zug unschlagbar',                           passiv:'Alle Bauern starten mit Schutzschicht'},
    {label:'Eisenwand',         aktiv:'Eisenwand — vorderste Figur jeder Spalte 2 Züge unschlagbar',           passiv:'Ganze Front 2 Züge unschlagbar'},
  ],
  // ── BAUER: MÖRDER ─────────────────────────────
  bauer_a: [
    {label:'Dolchstoß',         aktiv:'Dolchstoß — schlägt Figur direkt vor ihm ohne Bewegung',                passiv:'Kann geradeaus schlagen'},
    {label:'Dolchstoß+',        aktiv:'Dolchstoß — schlägt vorwärts + 1 Zug Unsichtbar',                       passiv:'Kann geradeaus schlagen + kurz unsichtbar'},
    {label:'Unsichtbar',        aktiv:'Unsichtbar — 3 Züge Schutz + schlägt vorwärts',                         passiv:'KI greift Mörder nicht gezielt an'},
    {label:'Schattenklinge',    aktiv:'Schattenklinge — schlägt stärkste Nachbarfigur + Extra-Zug',            passiv:'Schlägt und springt zurück'},
    {label:'Königsmörder',      aktiv:'Königsmörder — eliminiert wertvollste Nachbarfigur',                    passiv:'Zielt immer auf wertvollste benachbarte Figur'},
  ],
  // ── BAUER: BERSERKER ──────────────────────────
  bauer_be: [
    {label:'Raserei',           aktiv:'Raserei — schlägt vorwärts + Extra-Zug',                                passiv:'Extra-Zug nach jedem Schlag'},
    {label:'Raserei+',          aktiv:'Raserei — schlägt vorwärts + 2 Extra-Züge',                             passiv:'Zwei Extra-Züge nach Schlag'},
    {label:'Wut',               aktiv:'Wut — schlägt vorwärts UND rückwärts + Extra-Zug',                     passiv:'Kann auch rückwärts schlagen'},
    {label:'Blutrausch',        aktiv:'Blutrausch — stärker nach Kill + Extra-Zug',                            passiv:'Jeder Schlag erhöht Angriffskraft'},
    {label:'Götterzorn',        aktiv:'Götterzorn — schlägt ALLE Feinde in seiner Spalte',                     passiv:'Vernichtet gesamte Spalte'},
  ],
  // ── BAUER: HEILER ─────────────────────────────
  bauer_h: [
    {label:'Heilung',           aktiv:'Heilung — bringt zuletzt geschlagenen Bauern zurück',                   passiv:'Kann Bauern wiederbeleben'},
    {label:'Heilung+',          aktiv:'Heilung — bringt zuletzt geschlagenen Bauern zurück + 1 Zug Schutz',    passiv:'Wiederbelebung + Schutz'},
    {label:'Segnung',           aktiv:'Segnung — gibt Nachbarfiguren 2 Züge Schutz',                           passiv:'Heilt Nachbarn passiv'},
    {label:'Auferstehung',      aktiv:'Auferstehung — bringt beliebige geschlagene Figur zurück',              passiv:'Kann jede Figur wiederbeleben'},
    {label:'Massenheilung',     aktiv:'Massenheilung — alle geschlagenen Bauern kehren zurück',                passiv:'Alle Bauern werden wiederbelebt'},
  ],
  // ── TURM ──────────────────────────────────────
  turm_s: [
    {label:'Schutzwall',         aktiv:'Schutzwall — 1 Turm 1 Zug unschlagbar',                                passiv:'Turm kurz unschlagbar'},
    {label:'Schutzwall+',        aktiv:'Schutzwall — 1 Turm 2 Züge unschlagbar',                               passiv:'Startschutz: beginnt mit 1 Schutzschicht'},
    {label:'Festung',            aktiv:'Festung — beide Türme 2 Züge unschlagbar',                             passiv:'KI zieht nie zuerst auf den Turm'},
    {label:'Kaiserwall',         aktiv:'Kaiserwall — alle Figuren 1 Zug + KI gesperrt',                        passiv:'Beginnt mit 2 Schutzschichten'},
    {label:'Gewitterturm',       aktiv:'Kaiserwall — Türme 3 Züge + alle Gegner 1 Zug gesperrt',              passiv:'Kehrt 1× nach Schlag zurück (unsterblich)'},
    {label:'Unzerstörbar',       aktiv:'Unzerstörbar — 2 Figuren 3 Züge Schutz (bricht Schutz) + KI pausiert',passiv:'Absoluter Schutz, durchbricht gegnerischen Schutz'},
  ],
  // ── LÄUFER ────────────────────────────────────
  laeufer_d: [
    {label:'Dolchstoß',          aktiv:'Dolchstoß — entfernt 1 benachbarten Feind',                            passiv:'Kann Nachbarn angreifen'},
    {label:'Doppelstich',        aktiv:'Dolchstoß — entfernt 1 benachbarten Feind (verstärkt)',                            passiv:'1× orthogonal ziehen pro Spiel'},
    {label:'Doppelstich',        aktiv:'Doppelstich — entfernt 2 benachbarte Feinde',                           passiv:'Zieht durch eigene Figuren hindurch'},
    {label:'Geisterdolch',       aktiv:'Geisterdolch — entfernt wertvollste Figur auf dem Brett',               passiv:'KI greift Läufer nicht als erstes an'},
    {label:'Diagonalfeuer',      aktiv:'Diagonalfeuer — entfernt alle Feinde auf Diagonalen',                   passiv:'Kann auf allen Feldern (auch anderen Farben) ziehen'},
    {label:'Dreifachstich',      aktiv:'Dreifachstich — entfernt 3 stärkste Feinde',                           passiv:'Maximale Reichweite auf allen Diagonalen'},
  ],
  // ── SPRINGER ──────────────────────────────────
  springer_m: [
    {label:'Arkaner Sprung',     aktiv:'Arkaner Sprung — 2 Zufalls-Sprünge mit Schlag',                        passiv:'Kann sich teleportieren'},
    {label:'Arkaner Sprung+',    aktiv:'Arkaner Sprung — 3 Zufalls-Sprünge (stärker)',                        passiv:'Startet unschlagbar für 1 Zug'},
    {label:'Arkaner Sprung+',    aktiv:'Arkaner Sprung — 3 Zufalls-Sprünge',                                   passiv:'Fähigkeit 2× nutzbar'},
    {label:'Magierpfad',         aktiv:'Magierpfad — 2 wählbare Sprünge (Kurvenregel)',                         passiv:'Nach KI-Zug sofort nochmal ziehen'},
    {label:'Magierpfad+',        aktiv:'Magierpfad — 3 wählbare Sprünge',                                       passiv:'Schlägt eine Figur beim Landen'},
    {label:'Meisterpfad',        aktiv:'Meisterpfad — 5 wählbare Sprünge',                                      passiv:'Unbegrenzte Sprungkombinationen'},
  ],
  // ── DAME: FEUER ───────────────────────────────
  dame_f: [
    {label:'Feuerball',     aktiv:'Feuerball — verbrennt alle Feinde in Radius 1',                                                 passiv:'Basisangriff der F-Dame'},
    {label:'Feuerball',     aktiv:'Feuerball — verbrennt alle Feinde in Radius 2',                         passiv:'Fähigkeit 2× nutzbar'},
    {label:'Flammensturm',     aktiv:'Flammensturm — verbrennt alle Feinde in Radius 3',                      passiv:'Startet unschlagbar für 1 Zug'},
    {label:'Inferno',     aktiv:'Inferno — verbrennt alle Feinde in Radius 4',                           passiv:'+2 Felder Fähigkeits-Radius'},
    {label:'Sonnennova',     aktiv:'Sonnennova — verbrennt alle Feinde in Radius 5',                        passiv:'Fähigkeit verbraucht keinen Zug'},
    {label:'Gottesfeuer',     aktiv:'Gottesfeuer — Sofortschlag + 1 Feind brennt 3 Runden',                 passiv:'Brenneffekt: getroffene Feinde sterben nach 3 Zügen'},
  ],
  // ── DAME: WASSER ──────────────────────────────
  dame_w: [
    {label:'Feuerball',     aktiv:'Feuerball — verbrennt alle Feinde in Radius 1',                                                 passiv:'Basisangriff der F-Dame'},
    {label:'Welle',     aktiv:'Welle — Reihe vor Dame 1 Feld zurück',                                  passiv:'Fähigkeit 2× nutzbar'},
    {label:'Flut',     aktiv:'Flut — Reihe vor Dame 2 Felder zurück',                                 passiv:'Startet unschlagbar für 1 Zug'},
    {label:'Tsunami',     aktiv:'Tsunami — 3 Spalten vor Dame 3 Felder zurück',                          passiv:'+2 Felder Schubdistanz'},
    {label:'Strudel',     aktiv:'Strudel — Spieler wählt 3 Reihen zum Zurückdrängen',                    passiv:'Kann beliebige Reihen wählen'},
    {label:'Sintflut',     aktiv:'Sintflut — ganzes Brett, alle Feinde 3 Felder zurück',                  passiv:'Alle Feinde gleichzeitig'},
  ],
  // ── DAME: ERDE ────────────────────────────────
  dame_e: [
    {label:'Feuerball',     aktiv:'Feuerball — verbrennt alle Feinde in Radius 1',                                                 passiv:'Basisangriff der F-Dame'},
    {label:'Steinwall',     aktiv:'Steinwall — alle eigenen Figuren 1 Zug unschlagbar',                    passiv:'Fähigkeit 2× nutzbar'},
    {label:'Felsenfestung',     aktiv:'Felsenfestung — alle eigenen Figuren 2 Züge unschlagbar',               passiv:'Startet unschlagbar für 1 Zug'},
    {label:'Erdschild',     aktiv:'Erdschild — alle Figuren (auch Feinde) 2 Züge + Extra-Zug',            passiv:'+2 Felder Fähigkeits-Radius'},
    {label:'Titanboden',     aktiv:'Titanboden — alle Figuren 3 Züge unschlagbar + Extra-Zug',              passiv:'Fähigkeit verbraucht keinen Zug'},
    {label:'Weltenstein',     aktiv:'Weltenstein — 3 Züge + Extra-Zug + König unschlagbar',                  passiv:'König erhält dauerhaften Schutz'},
  ],
  // ── DAME: LUFT ────────────────────────────────
  dame_l: [
    {label:'Feuerball',     aktiv:'Feuerball — verbrennt alle Feinde in Radius 1',                                                 passiv:'Basisangriff der F-Dame'},
    {label:'Windstoß',     aktiv:'Windstoß — 1 Extra-Zug',                                                passiv:'Fähigkeit 2× nutzbar'},
    {label:'Sturmböe',     aktiv:'Sturmböe — 2 Extra-Züge',                                               passiv:'Startet unschlagbar für 1 Zug'},
    {label:'Wirbelwind',     aktiv:'Wirbelwind — Dame teleportiert auf freies Feld + Extra-Zug',            passiv:'+2 Felder Fähigkeits-Radius'},
    {label:'Zyklone',     aktiv:'Zyklone — Extra-Zug für alle eigenen Figuren',                          passiv:'Alle Figuren dürfen sich extra bewegen'},
    {label:'Zeitschneide',     aktiv:'Zeitschneide — 3 Extra-Züge',                                           passiv:'Fähigkeit verbraucht keinen Zug'},
  ],
  // ── DAME: VITA ────────────────────────────────
  dame_v: [
    {label:'Feuerball',     aktiv:'Feuerball — verbrennt alle Feinde in Radius 1',                                                 passiv:'Basisangriff der F-Dame'},
    {label:'Lebensquell',     aktiv:'Lebensquell — bringt 1 geschlagene Figur zurück',                       passiv:'Fähigkeit 2× nutzbar'},
    {label:'Lebensfluss',     aktiv:'Lebensfluss — bringt 2 geschlagene Figuren zurück',                     passiv:'Startet unschlagbar für 1 Zug'},
    {label:'Auferstehung',     aktiv:'Auferstehung — bringt alle geschlagenen Figuren zurück',                passiv:'+2 Felder Fähigkeits-Radius'},
    {label:'Unsterblichkeit',     aktiv:'Unsterblichkeit — alle zurück + Extra-Zug',                             passiv:'Fähigkeit verbraucht keinen Zug'},
    {label:'Göttliche Gnade',     aktiv:'Göttliche Gnade — alle zurück + Extra-Zug + König unschlagbar',         passiv:'König erhält dauerhaften Lebensschutz'},
  ],
  // ── DAME: PHYSISCH ────────────────────────────
  dame_p: [
    {label:'Feuerball',     aktiv:'Feuerball — verbrennt alle Feinde in Radius 1',                                                 passiv:'Basisangriff der F-Dame'},
    {label:'Donnerschlag',     aktiv:'Donnerschlag — entfernt wertvollste Figur',                             passiv:'Fähigkeit 2× nutzbar'},
    {label:'Doppelschlag',     aktiv:'Doppelschlag — entfernt 2 stärkste Figuren',                            passiv:'Startet unschlagbar für 1 Zug'},
    {label:'Dreifachschlag',     aktiv:'Dreifachschlag — entfernt 3 stärkste Figuren',                          passiv:'+2 Felder Fähigkeits-Radius'},
    {label:'Viererschlag',     aktiv:'Viererschlag — entfernt 4 stärkste Figuren',                            passiv:'Fähigkeit verbraucht keinen Zug'},
    {label:'Götterschlag',     aktiv:'Götterschlag — entfernt ALLE Feinde auf dem Brett',                     passiv:'Maximale Vernichtungskraft'},
  ],
  // ── KÖNIG ─────────────────────────────────────
  koenig_b: [
    {label:'Königstausch',       aktiv:'Königstausch — tauscht mit einer Nachbarfigur die Position',            passiv:'Kann Position tauschen'},
    {label:'Königsmanöver',      aktiv:'Königstausch + Extra-Zug danach',                  passiv:'Kriegsruf gibt 2 Extra-Züge'},
    {label:'Königsmanöver',      aktiv:'Königsmanöver — tauscht + Extra-Zug',                                   passiv:'Alle Figuren starten mit 1 Schutzschicht'},
    {label:'Königsbefehl',       aktiv:'Königsbefehl — holt geschlagenen Turm zurück',                          passiv:'König erste 3 Züge unschlagbar'},
    {label:'Rückruf',            aktiv:'Rückruf — zufälligen Turm zurück + König teleportiert',                 passiv:'König teleportiert sich bei Schlagversuch'},
    {label:'Königszorn',         aktiv:'Königszorn — Turm + Figur zurück + schlägt alle Nachbarn',             passiv:'Maximale Königsmacht'},
  ],
};

// Hilfsfunktion: hole RANK_ABILITIES Key für pid
function getRankAbilityKey(pid){
  // Direkt in RANK_ABILITIES nachschauen
  if(RANK_ABILITIES[pid]) return pid;
  // Fallback: group
  const cp=COLL_PIECES[pid];
  return cp?cp.group+'_'+pidVariant(pid):pid;
}

// Alte PIECE_PASSIVES für Rückwärtskompatibilität (wird noch in ein paar Stellen verwendet)
const PIECE_PASSIVES = {
  bauer_s: RANK_ABILITIES.bauer_s.map(r=>r?.passiv||null),
  bauer_b: RANK_ABILITIES.bauer_b.map(r=>r?.passiv||null),
  bauer_sh:RANK_ABILITIES.bauer_sh.map(r=>r?.passiv||null),
  bauer_a: RANK_ABILITIES.bauer_a.map(r=>r?.passiv||null),
  bauer_be:RANK_ABILITIES.bauer_be.map(r=>r?.passiv||null),
  bauer_h: RANK_ABILITIES.bauer_h.map(r=>r?.passiv||null),
  bauer:   [null,'Grundfähigkeit aktiv','Fähigkeit verbessert','Spezialangriff','Maximale Stärke'],
  turm:    RANK_ABILITIES.turm_s.map(r=>r?.passiv||null),
  laeufer: RANK_ABILITIES.laeufer_d.map(r=>r?.passiv||null),
  springer:RANK_ABILITIES.springer_m.map(r=>r?.passiv||null),
  dame:    [null,'Fähigkeit 2× nutzbar','Startet unschlagbar für 1 Zug','+2 Felder Radius','Fähigkeit verbraucht keinen Zug'],
  koenig:  RANK_ABILITIES.koenig_b.map(r=>r?.passiv||null),
};

function renderCollection(){
  const el=q('#col-grid');if(!el)return;
  el.innerHTML='';
  PIECE_GROUPS.forEach(pg=>{
    let bestRankIdx=-1,totalOwned=0;
    if(G.inventory?.[pg.group]){
      pg.pids.forEach(pid=>{
        const v=pidVariant(pid);
        (G.inventory[pg.group][v]||[]).forEach((cnt,ri)=>{
          if(cnt>0){totalOwned+=cnt;if(ri>bestRankIdx)bestRankIdx=ri;}
        });
      });
    }
    const bestRd=bestRankIdx>=0?RARITIES[RARITY_ORDER[bestRankIdx]]:null;
    const card=document.createElement('div');
    card.className='inv-card'+(totalOwned>0?' inv-owned':' inv-locked');
    if(bestRd){card.style.borderColor=bestRd.color;card.style.boxShadow='0 0 12px '+bestRd.glow;}
    card.onclick=()=>showGroupDetail(pg.group);
    card.innerHTML=
      '<div style="font-size:2.8rem;line-height:1;'+(totalOwned===0?'opacity:.2':'')+'">'+pg.chess+'</div>'+
      '<div style="font-size:.8rem;font-weight:bold;color:'+(bestRd?bestRd.color:'#333')+';margin-top:4px">'+pg.name+'</div>'+
      (bestRankIdx>=0
        ? '<div style="font-size:.6rem;color:'+bestRd.color+';letter-spacing:1px">'+PIECE_RANKS[pg.group][bestRankIdx]+'</div>'
        : '<div style="font-size:.6rem;color:#333">Nicht besessen</div>')+
      '<div style="font-size:.58rem;color:#555;margin-top:4px">'+totalOwned+' Figuren</div>';
    el.appendChild(card);
  });
}

function fillGmDetail(pid,rankIdx){
  const cp=COLL_PIECES[pid];if(!cp)return;
  const v=pidVariant(pid);
  const rar=RARITY_ORDER[rankIdx];
  const rd=RARITIES[rar];
  const cnt=(G.inventory?.[cp.group]?.[v]?.[rankIdx])||0;
  const rankName=getPieceRankName(cp.group,rar);
  const box=q('#gm-detail');if(!box)return;
  box.style.display='block';
  box.style.borderColor=rd.color;
  q('#gmd-chess').textContent=cp.chess;q('#gmd-chess').style.color=rd.color;
  q('#gmd-name').textContent=rankName;q('#gmd-name').style.color=rd.color;
  q('#gmd-var').textContent=cp.variant;
  q('#gmd-rr').textContent=rd.label;q('#gmd-rr').style.color=rd.color;
  q('#gmd-cnt').textContent=cnt+' St\u00FCck';
  q('#gmd-ab').textContent='\u26A1 '+cp.abilityLabel+': '+cp.desc;
  const nd=q('#gmd-next');
  const lu=q('#gmd-levelup');
  if(rankIdx<4){
    const nextRar=RARITY_ORDER[rankIdx+1];
    const nextRd=RARITIES[nextRar];
    const nextRankName=getPieceRankName(cp.group,nextRar);
    nd.textContent='\u2B06 N\u00E4chster Rang: '+nextRankName;
    nd.style.color=nextRd.color;
    // Hide stats grid
    const luStats=q('#gmd-lu-stats');
    if(luStats)luStats.style.display='none';
    // Next passive
    const nextPassive=PIECE_PASSIVES[cp.group]?.[rankIdx+1];
    const luPassive=q('#gmd-lu-passive');
    if(luPassive){
      if(nextPassive){
        luPassive.innerHTML='\u2605 Neues Passiv: <span style="color:#fff">'+nextPassive+'</span>';
        luPassive.style.display='block';
      } else {
        luPassive.style.display='none';
      }
    }
    if(lu)lu.style.display='block';
  } else {
    nd.textContent='\u2605 MAXIMALER RANG!';
    nd.style.color='#ffd700';
    if(lu)lu.style.display='none';
  }
}

function showGroupDetail(group){
  const pg=PIECE_GROUPS.find(p=>p.group===group);if(!pg)return;
  const modal=q('#group-modal');if(!modal)return;
  q('#gm-chess').textContent=pg.chess;
  q('#gm-name').textContent=pg.name;

  const grid=q('#gm-grid');
  grid.innerHTML='';
  grid.style.cssText='display:block;';

  // Detailbox verstecken (nutzen wir nicht mehr direkt)
  const detBox=q('#gm-detail');if(detBox)detBox.style.display='none';

  pg.pids.forEach(pid=>{
    const cp=COLL_PIECES[pid];
    const v=pidVariant(pid);
    const abilKey=pid; // RANK_ABILITIES nutzt pid direkt

    // ── Varianten-Header ─────────────────────────────────────────
    const vhdr=document.createElement('div');
    vhdr.style.cssText='font-size:.72rem;color:#c8a000;font-weight:bold;margin:12px 0 6px;border-bottom:1px solid #2a1a00;padding-bottom:5px;display:flex;align-items:center;gap:8px;';
    vhdr.innerHTML='<span style="font-size:1.1rem">'+cp.chess+'</span>'
      +'<span>'+cp.variant+'</span>'
      +'<span style="font-size:.55rem;color:#5a4020;font-weight:normal">'+cp.abilityLabel+'</span>';
    grid.appendChild(vhdr);

    // ── Rang-Karten (horizontal scrollbar) ───────────────────────
    const row=document.createElement('div');
    row.style.cssText='display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;';

    RARITY_ORDER.forEach((rar,ri)=>{
      const rd=RARITIES[rar];
      const cnt=(G.inventory?.[group]?.[v]?.[ri])||0;
      const rankName=getPieceRankName(group,rar);
      const canUp=canRankUp(group,v,ri);
      const abilData=RANK_ABILITIES[abilKey]?.[ri];

      const card=document.createElement('div');
      card.style.cssText=
        'flex:0 0 140px;border:1px solid '+(cnt>0?rd.color:'#1a1a1a')+';border-radius:8px;'
        +'background:'+(cnt>0?rd.bg:'#080808')+';padding:8px;position:relative;'
        +(cnt>0?'box-shadow:0 0 8px '+rd.glow+';':'opacity:.45;');

      // Rang-Badge
      let inner='<div style="font-size:.5rem;color:'+rd.color+';font-weight:bold;letter-spacing:1px;margin-bottom:3px">'+rankName+'</div>';

      // Anzahl
      inner+='<div style="font-size:.85rem;color:#fff;font-weight:bold;margin-bottom:5px">'
        +(cnt>0?cnt+'×':'—')+'</div>';

      // ── Aktiv-Fähigkeit ──────────────────────────────────────
      inner+='<div style="margin-bottom:5px">'
        +'<div style="font-size:.45rem;color:#ffd700;letter-spacing:1px;margin-bottom:2px">⚡ AKTIV</div>'
        +'<div style="font-size:.52rem;color:'+(cnt>0?'#fff8e0':'#444')+';line-height:1.4">'
        +(abilData?.aktiv||'—')+'</div>'
        +'</div>';

      // ── Passiv ───────────────────────────────────────────────
      const passiv=abilData?.passiv;
      inner+='<div>'
        +'<div style="font-size:.45rem;color:#aa8800;letter-spacing:1px;margin-bottom:2px">★ PASSIV</div>'
        +'<div style="font-size:.52rem;color:'+(cnt>0&&passiv?'#ccaa00':'#333')+';line-height:1.4">'
        +(passiv||'— kein Passiv')+'</div>'
        +'</div>';

      // Verbinden-Button
      if(canUp){
        inner+='<button onclick="event.stopPropagation();rankUpAndRefresh(\''+group+'\',\''+v+'\','+ri+')" '
          +'style="margin-top:6px;width:100%;font-size:.5rem;padding:4px;background:#1a0e00;border:1px solid #ffd700;'
          +'color:#ffd700;border-radius:4px;cursor:pointer">⚡ Verbinden (10→)</button>';
      }

      card.innerHTML=inner;
      row.appendChild(card);
    });

    grid.appendChild(row);
  });

  modal.style.display='flex';
}
function rankUpAndRefresh(group,variant,rankIdx){doRankUp(group,variant,rankIdx);showGroupDetail(group);}
function closeGroupDetail(){q('#group-modal').style.display='none';}

let dPid='',dRankIdx=0;
function showDetail(pid,rankIdx){
  dPid=pid;dRankIdx=rankIdx;
  const cp=COLL_PIECES[pid];
  const v=pidVariant(pid);
  const rar=RARITY_ORDER[rankIdx];
  const rd=RARITIES[rar];
  const cnt=(G.inventory?.[cp.group]?.[v]?.[rankIdx])||0;
  const rankName=getPieceRankName(cp.group,rar);
  const canUp=canRankUp(cp.group,v,rankIdx);

  q('#dm-ch').textContent=cp.chess;q('#dm-ch').style.color=rd.color;
  q('#dm-nm').textContent=rankName;
  q('#dm-var').textContent=cp.variant;q('#dm-var').style.color='#888';
  q('#dm-rr').textContent=rd.label;q('#dm-rr').style.color=rd.color;
  q('#dm-lv').textContent=cnt+' St\u00FCck';
  q('#dm-ab').textContent='\u26A1 '+cp.abilityLabel+': '+cp.desc;
  const totalBauer = cp.group==='bauer' ? getTotalPieces('bauer') : 0;
  const needExtra  = cp.group==='bauer' ? Math.max(0, BOARD_NEEDS.bauer - (getTotalPieces('bauer') - COMBINE_COST + 1)) : 0;
  if(cp.group==='bauer'){
    const totalNeed = COMBINE_COST + BOARD_NEEDS.bauer - 1; // =17
    q('#dm-dp').textContent=cnt+' / 10 dieser Variante · Gesamt: '+totalBauer+' / '+totalNeed+' Bauern nötig';
  } else {
    q('#dm-dp').textContent=cnt+' / '+COMBINE_COST+' zum Entwickeln';
  }
  // Combine button
  const btn=q('#dm-combine-btn');
  const wrap=q('#dm-combine-wrap');
  if(btn&&wrap){
    if(rankIdx>=4){
      wrap.style.display='none';
    } else {
      wrap.style.display='block';
      btn.disabled=!canUp;
      btn.style.opacity=canUp?'1':'0.4';
      btn.style.cursor=canUp?'pointer':'default';
      btn.style.borderColor=canUp?'#ffd700':'#3a2a00';
      btn.style.color=canUp?'#ffd700':'#4a3a10';
    }
  }
  const nextRank=rankIdx<4?getPieceRankName(cp.group,RARITY_ORDER[rankIdx+1]):'MAX';
  q('#dm-next').textContent=rankIdx<4?'\u2B06 N\u00E4chster Rang: '+nextRank:'\u2605 MAXIMALER RANG erreicht!';
  q('#dm-next').style.color=rankIdx<4?'#888':'#ffd700';

  q('#detail-modal').style.display='flex';
}

function tryCombineFromModal(){
  if(dPid===null||dRankIdx===null)return;
  const cp=COLL_PIECES[dPid];
  const v=pidVariant(dPid);
  if(doRankUp(cp.group,v,dRankIdx)){
    // Stay on same rank idx — if upgraded, show new count
    showDetail(dPid,dRankIdx);
  }
}

function closeDetail(){q('#detail-modal').style.display='none';}

function renderChestScreen(){
  if(q('#chest-keys'))q('#chest-keys').textContent=G.keys;
  if(q('#chest-result')){q('#chest-result').innerHTML='';q('#chest-result').style.borderColor='transparent';}
}

function doOpenChest(type){
  const results=openChest(type);
  if(!results){q('#chest-result').innerHTML='<div style="color:#ff4444;text-align:center;padding:15px">\u274C Nicht genug Schl\u00FCssel!</div>';return;}
  if(q('#chest-keys'))q('#chest-keys').textContent=G.keys;
  const el=q('#chest-result');
  // highest rarity for box glow
  const bestRd=results.reduce((best,r)=>{
    const ri=RARITY_ORDER.indexOf(r.rarityKey);
    return ri>RARITY_ORDER.indexOf(best.rarityKey)?r:best;
  },results[0]);
  const rd=RARITIES[bestRd.rarityKey];
  el.style.borderColor=rd.color;el.style.boxShadow='0 0 20px '+rd.glow;
  let html='<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:10px;animation:popIn .4s">';
  results.forEach(r=>{
    const cp=COLL_PIECES[r.pid];const rrd=RARITIES[r.rarityKey];
    const rankName=getPieceRankName(cp.group,r.rarityKey);
    html+='<div style="border:1px solid '+rrd.color+';border-radius:8px;padding:8px 10px;text-align:center;min-width:72px;background:'+rrd.bg+'">'+
      '<div style="font-size:2.2rem">'+cp.chess+'</div>'+
      '<div style="font-size:.65rem;color:'+rrd.color+';font-weight:bold;letter-spacing:1px">'+rrd.label+'</div>'+
      '<div style="font-size:.6rem;color:#bbb;margin-top:2px">'+rankName+'</div>'+
      '</div>';
  });
  html+='</div>';
  el.innerHTML=html;
  updateTopBar();
}

function q(s){return document.querySelector(s);}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded',function(){
  load();initStarters();
  showScreen('home');
  const btns=document.querySelectorAll('.nav-btn');
  if(btns.length)btns[0].classList.add('active');
  setTimeout(renderQuestBadge,100);
});

// ============================================================
// QUEST SYSTEM
// ============================================================

const QUEST_CATEGORIES=[
  {id:'anfaenger',   label:'Anfänger',      color:'#888888'},
  {id:'grundlagen',  label:'Grundlagen',    color:'#cd7f32'},
  {id:'rang1',       label:'Rang 1',        color:'#c0c0c0'},
  {id:'rang2',       label:'Rang 2',        color:'#00e5ff'},
  {id:'rang3',       label:'Rang 3',        color:'#ff9900'},
  {id:'rang4',       label:'Rang 4',        color:'#66ccff'},
  {id:'rang5',       label:'Rang 5',        color:'#ffd700'},
  {id:'hoellenfard', label:'🔥 Höllen-Fard', color:'#ff4400', legendOnly:true},
];

// reward: {keys, label}
const QUESTS=[
  // ANFÄNGER
  {id:'q_win1',       cat:'anfaenger', label:'Gewinne 1 Spiel',                     stat:'wins',        target:1,  reward:{keys:3,  label:'3 🔑'}},
  {id:'q_win3',       cat:'anfaenger', label:'Gewinne 3 Spiele',                    stat:'wins',        target:3,  reward:{keys:5,  label:'5 🔑'}},
  {id:'q_win5',       cat:'anfaenger', label:'Gewinne 5 Spiele',                    stat:'wins',        target:5,  reward:{keys:8,  label:'8 🔑'}},
  {id:'q_play10',     cat:'anfaenger', label:'Spiele 10 Partien',                   stat:'fights',      target:10, reward:{keys:5,  label:'5 🔑'}},
  {id:'q_check1',     cat:'anfaenger', label:'Setze einmal Schach',                 stat:'checks',      target:1,  reward:{keys:3,  label:'3 🔑'}},
  {id:'q_check10',    cat:'anfaenger', label:'Setze 10-mal Schach',                 stat:'checks',      target:10, reward:{keys:6,  label:'6 🔑'}},
  {id:'q_cap10',      cat:'anfaenger', label:'Schlage 10 Figuren insgesamt',        stat:'captures',    target:10, reward:{keys:5,  label:'5 🔑'}},
  {id:'q_matt1',      cat:'anfaenger', label:'Gewinne ein Spiel mit Matt',          stat:'matts',       target:1,  reward:{keys:5,  label:'5 🔑'}},
  {id:'q_roch1',      cat:'anfaenger', label:'Rochiere einmal',                     stat:'castles',     target:1,  reward:{keys:3,  label:'3 🔑'}},
  {id:'q_roch5',      cat:'anfaenger', label:'Rochiere 5-mal',                      stat:'castles',     target:5,  reward:{keys:8,  label:'8 🔑'}},
  // GRUNDLAGEN
  {id:'q_morefig',    cat:'grundlagen', label:'Gewinne mit mehr Figuren als Gegner',stat:'winMorePieces',target:1, reward:{keys:8,  label:'8 🔑'}},
  {id:'q_captRook',   cat:'grundlagen', label:'Schlage einen Turm',                 stat:'capturedRooks',target:1, reward:{keys:5,  label:'5 🔑'}},
  {id:'q_captQueen',  cat:'grundlagen', label:'Schlage eine Dame',                  stat:'capturedQueens',target:1,reward:{keys:8,  label:'8 🔑'}},
  {id:'q_promo',      cat:'grundlagen', label:'Mache ein Bauern-Upgrade zur Dame',  stat:'promotions',  target:1,  reward:{keys:8,  label:'8 🔑'}},
  {id:'q_end3fig',    cat:'grundlagen', label:'Beende ein Spiel mit ≥3 eigenen Figuren', stat:'endWith3Pieces',target:1,reward:{keys:6,'label':'6 🔑'}},
  {id:'q_play5row',   cat:'grundlagen', label:'Spiele 5 Partien hintereinander',    stat:'fights',      target:5,  reward:{keys:5,  label:'5 🔑'}},
  {id:'q_win2row',    cat:'grundlagen', label:'Gewinne 2 Spiele hintereinander',    stat:'maxWinStreak',target:2,  reward:{keys:8,  label:'8 🔑'}},
  {id:'q_check20',    cat:'grundlagen', label:'Setze 20-mal Schach',                stat:'checks',      target:20, reward:{keys:10, label:'10 🔑'}},
  {id:'q_cap3pawn',   cat:'grundlagen', label:'Schlage 3 Bauern in einem Spiel',    stat:'cap3PawnGame',target:1,  reward:{keys:6,  label:'6 🔑'}},
  {id:'q_finish',     cat:'grundlagen', label:'Beende eine Partie ohne Aufzugeben', stat:'fights',      target:1,  reward:{keys:3,  label:'3 🔑'}},
  // RANG 1
  {id:'q_r1win',      cat:'rang1', label:'Gewinne ein Spiel mit einem reinen Rang-1 Team',stat:'winsRank1Only',target:1,  reward:{keys:10, label:'10 🔑'}},
  {id:'q_r1ab5',      cat:'rang1', label:'Nutze 5 Fähigkeiten von Rang-1 Figuren', stat:'abilityRank1', target:5,  reward:{keys:8,  label:'8 🔑'}},
  {id:'q_r1win3',     cat:'rang1', label:'Gewinne 3 Spiele mit ≥3 Rang-1 Figuren', stat:'winsRank1x3',  target:3,  reward:{keys:12, label:'12 🔑'}},
  // RANG 2
  {id:'q_r2win',      cat:'rang2', label:'Gewinne ein Spiel mit einem reinen Rang-2 Team',stat:'winsRank2Only',target:1, reward:{keys:15, label:'15 🔑'}},
  {id:'q_r2ab10',     cat:'rang2', label:'Nutze 10 Fähigkeiten von Rang-2 Figuren',stat:'abilityRank2', target:10, reward:{keys:12, label:'12 🔑'}},
  {id:'q_r2win2fig',  cat:'rang2', label:'Gewinne mit ≥2 Rang-2 Figuren übrig',    stat:'winsRank2Left',target:1, reward:{keys:15, label:'15 🔑'}},
  // RANG 3
  {id:'q_r3win',      cat:'rang3', label:'Gewinne ein Spiel mit einem reinen Rang-3 Team',stat:'winsRank3Only',target:1, reward:{keys:20, label:'20 🔑'}},
  {id:'q_r3ab15',     cat:'rang3', label:'Nutze 15 Fähigkeiten von Rang-3 Figuren',stat:'abilityRank3', target:15, reward:{keys:18, label:'18 🔑'}},
  {id:'q_r3ab3types', cat:'rang3', label:'Gewinne mit 3 verschiedenen Rang-3 Fähigkeiten',stat:'winsRank3Variety',target:1,reward:{keys:22,'label':'22 🔑'}},
  // RANG 4
  {id:'q_r4only',     cat:'rang4', label:'Gewinne ein Spiel mit einem reinen Rang-4 Team',stat:'winsRank4Only',target:1, reward:{keys:25, label:'25 🔑'}},
  {id:'q_r4win2',     cat:'rang4', label:'Gewinne mit ≥2 Rang-4 Figuren auf Brett',stat:'winsRank4x2',  target:1,  reward:{keys:25, label:'25 🔑'}},
  {id:'q_r4ab20',     cat:'rang4', label:'Nutze 20 Rang-4 Fähigkeiten insgesamt',  stat:'abilityRank4', target:20, reward:{keys:22, label:'22 🔑'}},
  {id:'q_r4win5',     cat:'rang4', label:'Gewinne 5 Spiele mit einer Rang-4 Figur',stat:'winsWithRank4',target:5,  reward:{keys:30, label:'30 🔑'}},
  // RANG 5
  {id:'q_r5only',     cat:'rang5', label:'Gewinne ein Spiel mit einem reinen Rang-5 Team',stat:'winsRank5Only',target:1, reward:{keys:50, label:'50 🔑'}},
  {id:'q_r5last',     cat:'rang5', label:'Gewinne mit einer Rang-5 Figur als letzte Figur',stat:'winsRank5Last',target:1,reward:{keys:40,'label':'40 🔑'}},
  {id:'q_r5ab10',     cat:'rang5', label:'Nutze 10 Fähigkeiten von Rang-5 Figuren',stat:'abilityRank5', target:10, reward:{keys:35, label:'35 🔑'}},
  {id:'q_r5matt',     cat:'rang5', label:'Gewinne ein Spiel mit Rang-5 Matt',       stat:'winsRank5Matt',target:1, reward:{keys:50, label:'50 🔑'}},
  {id:'q_r5noab',     cat:'rang5', label:'Gewinne eine Partie ohne Fähigkeiten zu nutzen', stat:'winsNoAbility', target:1, reward:{keys:45, label:'45 🔑'}},

  // ── HÖLLEN-FARD QUEST (gesperrt bis Legende) ─────────────────
  {id:'q_hoellenfard', cat:'hoellenfard',
   label:'❓❓❓ Gewinne mit einem reinen Rang-1 Team gegen ein Rang-5 Team — ohne eine Fähigkeit zu nutzen',
   stat:'winsHollenFard', target:1,
   reward:{keys:0, skin:'rainbow', label:'🌈 Regenbogen-Skin'},
   legendOnly:true},
];

// Quest stats live on G.questStats
// Quest completion on G.questDone (set of ids)

function initQuestStats(){
  if(!G.questStats)G.questStats={
    wins:0, fights:0, checks:0, captures:0, matts:0, castles:0,
    capturedRooks:0, capturedQueens:0, promotions:0, maxWinStreak:0,
    winMorePieces:0, endWith3Pieces:0, cap3PawnGame:0,
    winsRank1Only:0, abilityRank1:0, winsRank1x3:0,
    winsRank2Only:0, abilityRank2:0, winsRank2Left:0,
    winsRank3Only:0, abilityRank3:0, winsRank3Variety:0,
    winsRank4x2:0,   abilityRank4:0, winsWithRank4:0,
    winsRank5Last:0, abilityRank5:0, winsRank5Matt:0, winsNoAbility:0, winsRank4Only:0, winsRank5Only:0, winsHollenFard:0,
  };
  if(!G.questDone)G.questDone={};
}

function getQuestProgress(q){
  initQuestStats();
  return Math.min(G.questStats[q.stat]||0, q.target);
}

function isQuestDone(q){return !!G.questDone[q.id];}
function isQuestClaimable(q){return !isQuestDone(q)&&getQuestProgress(q)>=q.target;}

function claimQuest(id){
  const quest=QUESTS.find(q=>q.id===id);if(!quest)return;
  if(!isQuestClaimable(quest))return;
  G.questDone[id]=true;
  G.keys+=quest.reward.keys;
  save();
  renderQuestScreen();
  updateTopBar();
  // Brief flash
  const btn=document.getElementById('qbtn_'+id);
  if(btn){btn.textContent='✓ Erhalten!';btn.style.background='#1a4a1a';}
}

let activeQuestCat='anfaenger';

function renderQuestScreen(){
  initQuestStats();
  const isLegend = G.rankIdx >= 20;
  // Tabs
  const tabs=q('#quest-tabs');
  if(tabs){
    tabs.innerHTML='';
    QUEST_CATEGORIES.forEach(cat=>{
      const locked=cat.legendOnly&&!isLegend;
      const total=QUESTS.filter(q=>q.cat===cat.id).length;
      const done=QUESTS.filter(q=>q.cat===cat.id&&isQuestDone(q)).length;
      const btn=document.createElement('button');
      btn.style.cssText='padding:5px 10px;border-radius:16px;border:2px solid '+(activeQuestCat===cat.id?cat.color:'#2a1800')+';'+
        'background:'+(activeQuestCat===cat.id?'#1a0d00':'#0a0600')+';color:'+(locked?'#333':activeQuestCat===cat.id?cat.color:'#555')+
        ';font-size:.58rem;font-weight:bold;cursor:pointer;letter-spacing:.5px;';
      btn.textContent=locked?'\uD83D\uDD12 '+cat.label:cat.label+' ('+done+'/'+total+')';
      btn.onclick=()=>{activeQuestCat=cat.id;renderQuestScreen();};
      tabs.appendChild(btn);
    });
  }
  // List
  const list=q('#quest-list');if(!list)return;
  list.innerHTML='';
  const cat=QUEST_CATEGORIES.find(c=>c.id===activeQuestCat);
  const catLocked=cat?.legendOnly&&!isLegend;
  if(catLocked){
    list.innerHTML='<div style="text-align:center;padding:30px 16px">'+
      '<div style="font-size:2rem;margin-bottom:10px">\uD83D\uDD12</div>'+
      '<div style="font-size:.85rem;font-weight:bold;color:#ff6600;letter-spacing:2px;margin-bottom:8px">GESPERRT</div>'+
      '<div style="font-size:.65rem;color:#5a3a20;line-height:1.6">Erreiche <span style="color:#ffd700;font-weight:bold">Legende</span> um<br>\uD83D\uDD25 H\u00F6llen-Fard freizuschalten!</div>'+
      '<div style="margin-top:12px;font-size:.55rem;color:#3a2a10">❓ ❓ ❓</div></div>';
    return;
  }
  QUESTS.filter(q=>q.cat===activeQuestCat).forEach(quest=>{
    const done=isQuestDone(quest);
    const claimable=isQuestClaimable(quest);
    const prog=getQuestProgress(quest);
    const pct=Math.round((prog/quest.target)*100);
    const card=document.createElement('div');
    card.style.cssText='border:1px solid '+(done?'#1a3a1a':claimable?cat.color:'#1a1000')+
      ';border-radius:10px;padding:10px 12px;background:'+(done?'#060e06':claimable?'#0d0800':'#080600')+
      ';opacity:'+(done?'.5':'1')+';';
    card.innerHTML=
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'+
        '<div style="flex:1">'+
          '<div style="font-size:.72rem;color:'+(done?'#3a6a3a':claimable?cat.color:'#c8a000')+';font-weight:bold;margin-bottom:3px">'+
            (done?'✓ ':'')+quest.label+
          '</div>'+
          '<div style="background:#0d0800;border-radius:4px;height:5px;overflow:hidden;margin-bottom:3px">'+
            '<div style="height:100%;width:'+pct+'%;background:'+(done?'#2a5a2a':cat.color)+';border-radius:4px;transition:width .3s"></div>'+
          '</div>'+
          '<div style="font-size:.55rem;color:#555">'+prog+' / '+quest.target+(done?' ✓':'')+'</div>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:60px">'+
          '<div style="font-size:.6rem;color:#ffd700">'+quest.reward.label+'</div>'+
          (done?'<span style="font-size:.6rem;color:#3a6a3a">Erhalten</span>':
           claimable?'<button id="qbtn_'+quest.id+'" onclick="claimQuest(\''+quest.id+'\')" style="padding:5px 10px;border-radius:6px;border:1px solid '+cat.color+';background:#0d0800;color:'+cat.color+';font-size:.6rem;cursor:pointer;font-weight:bold">Abholen!</button>':
           '')+
        '</div>'+
      '</div>';
    list.appendChild(card);
  });
}

// ---- Quest Tracking Hooks ----
// Called after each game event. Integrated into existing game flow.

function trackQuestStat(stat, amount){
  initQuestStats();
  if(G.questStats[stat]!==undefined)G.questStats[stat]+=amount;
  // Check for new claimable quests
  const newlyClaimable=QUESTS.filter(q=>!isQuestDone(q)&&isQuestClaimable(q));
  if(newlyClaimable.length>0&&currentScreen==='quests')renderQuestScreen();
  // Show badge on nav
  renderQuestBadge();
}

function renderQuestBadge(){
  // Badge entfernt — keine rote Zahl auf dem Quest-Button
  const navBtns=document.querySelectorAll('.nav-btn');
  const questNav=navBtns[2];
  if(!questNav)return;
  const badge=questNav.querySelector('.q-badge');
  if(badge)badge.remove();
}

// Called at end of game to track all end-of-game stats
function trackEndOfGame(won, byMatt){
  initQuestStats();
  // count own pieces on board
  let ownPieces=0, ownPieceRanks=[];
  let lastOwnPiece=null;
  let rank4count=0, rank5count=0;
  const abilitiesUsed={}; // abilityId -> rankIdx

  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=chess.board[r][c];
    if(p&&p.col==='w'){
      ownPieces++;
      // rankIdx direkt von der Figur lesen (gesetzt beim Brett-Aufbau)
      const ri=p.rankIdx??0;
      ownPieceRanks.push(ri);
      const group=PIECE_TYPE_TO_GROUP[p.t];
      lastOwnPiece={group,ri};
      if(ri===3)rank4count++;
      if(ri===4)rank5count++;
    }
  }
  if(won){
    trackQuestStat('wins',1);
    if(byMatt)trackQuestStat('matts',1);
    // Count enemy pieces
    let enemyPieces=0;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(chess.board[r][c]?.col==='b')enemyPieces++;
    if(ownPieces>enemyPieces)trackQuestStat('winMorePieces',1);
    if(ownPieces>=3)trackQuestStat('endWith3Pieces',1);
    // Max win streak
    if(G.winStreak>G.questStats.maxWinStreak)G.questStats.maxWinStreak=G.winStreak;
    // Rank-based wins
    const allRank1=ownPieceRanks.every(r=>r===0);
    const allRank2=ownPieceRanks.every(r=>r===1);
    const allRank3=ownPieceRanks.every(r=>r===2);
    const allRank4=ownPieceRanks.every(r=>r===3);
    const allRank5=ownPieceRanks.every(r=>r===4);
    if(allRank1)trackQuestStat('winsRank1Only',1);
    if(ownPieceRanks.filter(r=>r===0).length>=3)trackQuestStat('winsRank1x3',1);
    if(allRank2)trackQuestStat('winsRank2Only',1);
    if(ownPieceRanks.filter(r=>r===1).length>=2)trackQuestStat('winsRank2Left',1);
    if(allRank3)trackQuestStat('winsRank3Only',1);
    if(allRank4)trackQuestStat('winsRank4Only',1);
    if(allRank5)trackQuestStat('winsRank5Only',1);
    if(rank4count>=2)trackQuestStat('winsRank4x2',1);
    if(rank4count>=1)trackQuestStat('winsWithRank4',1);
    if(rank5count>=1&&lastOwnPiece?.ri===4&&byMatt)trackQuestStat('winsRank5Matt',1);
    if(rank5count>=1&&lastOwnPiece?.ri===4)trackQuestStat('winsRank5Last',1);
    if(!chess.abilityUsedThisGame)trackQuestStat('winsNoAbility',1);
    // Höllen-Fard: alle eigenen Rang 1, alle KI-Figuren zuletzt Rang 5, keine Fähigkeit
    const allOwnRank1=ownPieceRanks.every(r=>r===0);
    if(allOwnRank1&&!chess.abilityUsedThisGame){
      // Prüfe ob KI-Startaufstellung Rang 5 war (vereinfacht: immer erfüllt wenn Spieler Rang1-only gewinnt)
      trackQuestStat('winsHollenFard',1);
    }
  }
  save();
  renderQuestBadge();
}
