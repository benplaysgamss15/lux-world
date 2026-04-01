const canvas = document.getElementById('gc');
const ctx = canvas.getContext('2d');

function resize(){
    if(document.activeElement && (document.activeElement.id === 'chatInp' || document.activeElement.id === 'mpUserInp' || document.activeElement.id === 'mpRoomInp')) return;
    canvas.width = Math.min(window.innerWidth, 1280);
    canvas.height = Math.min(window.innerHeight, 800);
}
resize();
window.addEventListener('resize', resize);

const TS = 48;
const WS = 160;
const LERP = 0.1;
const RARITY_COLOR = {Common:'#aaaaaa',Rare:'#4488ff',Epic:'#cc44ff',Legendary:'#ffaa00',Boss:'#ff3333'};
const R_MULT = {Common: 1, Rare: 1.25, Epic: 1.5, Legendary: 1.85, Boss: 1.5};

const PALETTES =[
    { id:'blue', name:'Blue', oc:{body:'#40c4ff',legs:'#1a347a',head:'#ffd700',neck:'#ffd700',tail:'#2a5acc'} },
    { id:'red', name:'Red', oc:{body:'#ff4040',legs:'#7a1a1a',head:'#ffd700',neck:'#ffd700',tail:'#cc2a2a'} },
    { id:'green', name:'Green', oc:{body:'#40ff40',legs:'#1a7a1a',head:'#ffd700',neck:'#ffd700',tail:'#2acc2a'} },
    { id:'purple', name:'Purple', oc:{body:'#c440ff',legs:'#4a1a7a',head:'#ffd700',neck:'#ffd700',tail:'#9a2acc'} },
    { id:'dark', name:'Dark', oc:{body:'#444444',legs:'#111111',head:'#aa0000',neck:'#aa0000',tail:'#222222'} }
];

function getOC(cId) {
    return PALETTES.find(p=>p.id===cId)?.oc || PALETTES[0].oc;
}

const DINOS = {
    // LEVEL 1 DINOS
    raptor: {name:'Raptor', rarity:'Common', col:'#7ab648',acc:'#4a8a20',hp:80, atk:25,spd:4.2,sz:20,sp:0.15, rw:13, em:'🦖', lvl:1},
    triceratops: {name:'Triceratops', rarity:'Common', col:'#9b7924',acc:'#6b4a0a',hp:130,atk:18,spd:2.8,sz:28,sp:0.12, rw:21, em:'🦕', lvl:1},
    stegosaurus: {name:'Stegosaurus', rarity:'Common', col:'#6b9e4e',acc:'#4a7a2e',hp:110,atk:22,spd:2.5,sz:26,sp:0.10, rw:19, em:'🦕', lvl:1},
    parasaurolophus:{name:'Parasaurolophus',rarity:'Common', col:'#ba7040',acc:'#8a4a1a',hp:90, atk:20,spd:3.5,sz:24,sp:0.09, rw:16, em:'🦕', lvl:1},
    ankylosaurus: {name:'Ankylosaurus', rarity:'Rare', col:'#7a6030',acc:'#5a4010',hp:170,atk:24,spd:1.8,sz:32,sp:0.07, rw:40, em:'🦕', lvl:1},
    trex: {name:'T-Rex', rarity:'Rare', col:'#8b2500',acc:'#6b1000',hp:160,atk:42,spd:3.2,sz:36,sp:0.055,rw:59, em:'🦖', lvl:1},
    dilophosaurus:{name:'Dilophosaurus', rarity:'Rare', col:'#b87020',acc:'#885010',hp:100,atk:35,spd:4.5,sz:22,sp:0.06, rw:48, em:'🦖', lvl:1},
    brachiosaurus:{name:'Brachiosaurus', rarity:'Rare', col:'#5a9a5a',acc:'#3a7a3a',hp:220,atk:14,spd:1.4,sz:42,sp:0.045,rw:53, em:'🦕', lvl:1},
    spinosaurus: {name:'Spinosaurus', rarity:'Epic', col:'#4a6a9a',acc:'#2a4a7a',hp:200,atk:48,spd:3.8,sz:38,sp:0.028,rw:101, em:'🦖', lvl:1},
    pterodactyl: {name:'Pterodactyl', rarity:'Epic', col:'#9a7a5a',acc:'#7a5a3a',hp:130,atk:52,spd:6.0,sz:30,sp:0.022,rw:112, em:'🦅', lvl:1},
    carnotaurus: {name:'Carnotaurus', rarity:'Epic', col:'#9a3a4a',acc:'#7a1a2a',hp:175,atk:58,spd:5.0,sz:34,sp:0.018,rw:128, em:'🦖', lvl:1},
    indoraptor: {name:'Indoraptor', rarity:'Legendary', col:'#1a1020',acc:'#3a1040',hp:280,atk:72,spd:5.5,sz:36,sp:0.035,rw:240, em:'🦖', lvl:1},
    therizinosaurus:{name:'Therizinosaurus',rarity:'Legendary',col:'#2a5a4a',acc:'#1a3a2a',hp:320,atk:62,spd:2.8,sz:44,sp:0.025,rw:293,em:'🦕', lvl:1},
    megalodon: {name:'Megalodon', rarity:'Boss', col:'#1a3060',acc:'#0a1540',hp:525,atk:55,spd:3.5,sz:64,sp:0, rw:667,em:'🦈', lvl:1},

    // LEVEL 2 DINOS
    utahraptor: {name:'Utahraptor', rarity:'Common', col:'#8b5a2b',acc:'#5c3a21',hp:120,atk:30,spd:4.8,sz:22,sp:0.15, rw:20, em:'🦖', lvl:2},
    pachycephalosaurus: {name:'Pachycephalo', rarity:'Common', col:'#c2b280',acc:'#8a7f5c',hp:150,atk:25,spd:3.2,sz:24,sp:0.12, rw:24, em:'🦕', lvl:2},
    dimetrodon: {name:'Dimetrodon', rarity:'Common', col:'#556b2f',acc:'#2e8b57',hp:140,atk:28,spd:2.5,sz:20,sp:0.10, rw:27, em:'🦎', lvl:2},
    iguanodon: {name:'Iguanodon', rarity:'Rare', col:'#8fbc8f',acc:'#2f4f4f',hp:180,atk:32,spd:3.0,sz:28,sp:0.08, rw:47, em:'🦕', lvl:2},
    baryonyx: {name:'Baryonyx', rarity:'Rare', col:'#4682b4',acc:'#191970',hp:200,atk:45,spd:4.0,sz:32,sp:0.06, rw:60, em:'🦖', lvl:2},
    diplodocus: {name:'Diplodocus', rarity:'Rare', col:'#2e8b57',acc:'#006400',hp:300,atk:20,spd:1.2,sz:48,sp:0.05, rw:67, em:'🦕', lvl:2},
    mosasaurus: {name:'Mosasaurus', rarity:'Epic', col:'#008b8b',acc:'#000080',hp:250,atk:60,spd:4.5,sz:44,sp:0.03, rw:120, em:'🦈', lvl:2},
    giganotosaurus: {name:'Giganotosaurus',rarity:'Legendary',col:'#cd5c5c',acc:'#8b0000',hp:350,atk:75,spd:4.2,sz:40,sp:0.05,rw:267,em:'🦖', lvl:2},
    quetzalcoatlus: {name:'Quetzalcoatlus',rarity:'Legendary',col:'#d2b48c',acc:'#8b4513',hp:220,atk:68,spd:6.5,sz:38,sp:0.05,rw:293,em:'🦅', lvl:2},
    indominus: {name:'Indominus Rex', rarity:'Boss', col:'#f8f8ff',acc:'#c0c0c0',hp:600,atk:85,spd:4.5,sz:55,sp:0, rw:1333,em:'🦖', lvl:2}
};

const worldMap=[], tileClr=[];
const GCLR=['#4a7c3f','#528942','#3d6b35','#6a9c5f','#508240'];
const FCLR=['#2d5a27','#3a6b33','#254c20','#1e4518'];
const WCLR=['#1a6b8a','#1e7a9f','#157a9a','#0d6080','#246090'];
const SCLR=['#c8a85a','#d4b46a','#bc9e4e','#c4a456'];

const VGCLR=['#3a2e28','#42352e','#332722','#4a3a31','#3b2b25'];
const VFCLR=['#221612','#2c1c17','#1a100d','#261814'];
const VWCLR=['#8a251a','#9f2b1e','#9a2215','#80190d','#902214'];
const VSCLR=['#5a3a2a','#664433','#4d3020','#5c3d2b'];
const VRED=['#ff2a00','#e62600','#ff3300','#cc2200'];

const G = {
    state:'intro',
    level: 1,
    wheat:60, tick:0,
    cam:{x:0,y:0},
    player:{x:WS/2*TS, y:WS/2*TS, dk:'raptor', face:1, anim:0, moving:false, upg:{hp:0,atk:0,spd:0}, hat:'bucket', oc: {body:'#40c4ff',legs:'#1a347a',head:'#ffd700',neck:'#ffd700',tail:'#2a5acc'}},
    custPart: 'body',
    playerHp:80,
    playerShield: 0,
    lastDamageTick: 0,
    discovered:{raptor:true},
    wilds:[],
    
    // Updated Battle State to include Co-op Partner variables
    battle:{isPvP:false, isCoop:false, opId:null, ek:null, ehp:0, emhp:0, eatk:0, eshield:0, emshield:0, ename:'', eoc:null, ehat:'', php:0, pmhp:0, php_shield:0, pmhp_shield:0, cpHp:0, cpMhp:0, cpShield:0, cpDk:'raptor', cpName:'', cpOc:null, cpHat:'bucket', turn:'player', log:[], anim:false, res:null, eshake:0, pshake:0, cshake:0, dnums:[]},
    
    pvp: { closeId: null, reqTo: null, reqFrom: null, reqFromName: '', reqFromStats: null, cd: 0, msgTimer: 0, opponentId: null },
    
    // NEW CO-OP STATE
    coop: { partnerId: null, partnerName: '', reqTo: null, reqFrom: null, reqFromName: '' },

    keys:{},
    joy:{on:false,sx:0,sy:0,dx:0,dy:0},
    btns:[],
    encCd:0,
    idxPage:0,
    mx:-1,my:-1,
    particles:[],
    swapCd:0,
    cheatsActive:false,  

    peer: null,
    conns: {}, 
    isHost: false,
    peerId: null,
    otherPlayers: {}, 
    username: null, 
    sessionTimer: null, 

    volcanoTimer: 10800,
    volcanoActive: 0,
    camShake: 0,
    hazards:[],

    megaTimer: 3600,
    megaOnLand: false
};

let syncInterval = null;
let chatFadeTimer = null;

// The Co-op Modifiers (0.9x HP/ATK if bonded)
function pDino(){ return DINOS[G.player.dk]; }
function pMaxHp(){ 
    let m = Math.floor((pDino().hp + G.player.upg.hp*28) * R_MULT[pDino().rarity]); 
    return G.coop.partnerId ? Math.floor(m * 0.9) : m;
}
function pAtk(){ 
    let a = Math.floor((pDino().atk + G.player.upg.atk*5) * R_MULT[pDino().rarity]); 
    return G.coop.partnerId ? Math.floor(a * 0.9) : a;
}
function pSpd(){ return pDino().spd + G.player.upg.spd*0.5; }
