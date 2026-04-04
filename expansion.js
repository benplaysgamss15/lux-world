/**
 * DinoWorld Update 1.5: The Cave & The Mountain
 * Full Implementation with Overworld Minimap Icons and Fixed Sub-map Physics.
 */

// --- SECTION 1: STATE & DINOS ---
Object.assign(G, {
    zone: 'world',
    hasKey: false,
    puzzleSolved: false,
    gorathDefeated: false,
    vexDefeated: false,
    spiderDefeated: false,
    pandaDefeated: false,
    fadeAlpha: 0,
    fadeDir: 0,
    fadeCb: null,
    npcDialogue: null,
    wirePanel: { open: false, solved: false, wires: [
        { color: '#ff4444', leftY: 0.35, rightY: 0.65, connected: false },
        { color: '#4488ff', leftY: 0.5,  rightY: 0.35, connected: false },
        { color: '#ffdd00', leftY: 0.65, rightY: 0.5,  connected: false }
    ], dragging: null, panelX: 0, panelY: 0, panelW: 320, panelH: 280 },
    spikeTimer: 5400,
    spikeActive: 0,
    spikes: [],
    caveMap: [],
    caveTileClr: [],
    mountainMap: [],
    mountainTileClr: [],
    mountainBosses: []
});

const EX_DINOS = {
    minmi: { name:'Minmi', rarity:'Common', col:'#6a5a4a', acc:'#4a3a2a', hp:90, atk:22, spd:3.0, sz:20, sp:0.15, rw:14, em:'🦕', lvl:1, zone:'cave' },
    leaellynasaura: { name:'Leaellynasaura', rarity:'Common', col:'#3a6a5a', acc:'#2a4a3a', hp:80, atk:18, spd:4.0, sz:18, sp:0.12, rw:12, em:'🦎', lvl:1, zone:'cave' },
    scipionyx: { name:'Scipionyx', rarity:'Rare', col:'#7a4a2a', acc:'#5a2a0a', hp:130, atk:38, spd:4.2, sz:22, sp:0.09, rw:44, em:'🦖', lvl:1, zone:'cave' },
    nqwebasaurus: { name:'Nqwebasaurus', rarity:'Rare', col:'#5a6a3a', acc:'#3a4a1a', hp:120, atk:32, spd:3.8, sz:20, sp:0.07, rw:38, em:'🦎', lvl:1, zone:'cave' },
    troodon: { name:'Troodon', rarity:'Epic', col:'#2a3a5a', acc:'#1a2a4a', hp:160, atk:54, spd:5.5, sz:24, sp:0.03, rw:100, em:'🦖', lvl:1, zone:'cave' },
    dromaeosaurus: { name:'Dromaeosaurus', rarity:'Epic', col:'#6a2a3a', acc:'#4a0a1a', hp:150, atk:60, spd:5.8, sz:22, sp:0.025, rw:110, em:'🦖', lvl:1, zone:'cave' },
    arachnis: { name:'Arachnis', rarity:'Boss', col:'#2a1a2a', acc:'#1a0a1a', hp:380, atk:62, spd:2.0, sz:50, sp:0, rw:300, em:'🕷️', lvl:1, zone:'cave' },
    pachycephalosaurus_mtn: { name:'Pachycephalo', rarity:'Common', col:'#c2b280', acc:'#8a7f5c', hp:150, atk:25, spd:3.2, sz:24, sp:0.14, rw:24, em:'🦕', lvl:1, zone:'mountain' },
    iguanodon_mtn: { name:'Iguanodon', rarity:'Common', col:'#8fbc8f', acc:'#2f4f4f', hp:170, atk:28, spd:3.0, sz:26, sp:0.11, rw:28, em:'🦕', lvl:1, zone:'mountain' },
    allosaurus: { name:'Allosaurus', rarity:'Rare', col:'#8b3a2a', acc:'#6b1a0a', hp:190, atk:46, spd:4.0, sz:34, sp:0.07, rw:56, em:'🦖', lvl:1, zone:'mountain' },
    ceratosaurus: { name:'Ceratosaurus', rarity:'Rare', col:'#9a4a2a', acc:'#6a2a0a', hp:175, atk:42, spd:3.8, sz:30, sp:0.06, rw:48, em:'🦖', lvl:1, zone:'mountain' },
    carcharodontosaurus: { name:'Carcharodonto', rarity:'Epic', col:'#6a3a2a', acc:'#4a1a0a', hp:240, atk:64, spd:4.5, sz:40, sp:0.025, rw:116, em:'🦖', lvl:1, zone:'mountain' },
    gorath: { name:'Gorath', rarity:'Boss', col:'#7a7a7a', acc:'#4a4a4a', hp:420, atk:66, spd:2.5, sz:38, sp:0, rw:0, em:'🪨', lvl:1, zone:'mountain' },
    vex: { name:'Vex', rarity:'Boss', col:'#2a1a3a', acc:'#1a0a2a', hp:360, atk:80, spd:3.5, sz:34, sp:0, rw:0, em:'👁️', lvl:1, zone:'mountain' },
    panda: { name:'Panda', rarity:'Boss', col:'#ffffff', acc:'#111111', hp:700, atk:90, spd:3.8, sz:48, sp:0, rw:800, em:'🐼', lvl:1, zone:'mountain' }
};
Object.assign(DINOS, EX_DINOS);
for (let k in DINOS) { if (!DINOS[k].zone) DINOS[k].zone = 'world'; }

// --- SECTION 2: POSITIONING & SUB-MAPS ---
let cavePos = { tx: Math.floor(WS * 0.72), ty: Math.floor(WS * 0.75) }; // Moved further inland
let mtnPos = { tx: Math.floor(WS * 0.82), ty: Math.floor(WS * 0.22) };

function fixLandmarkPos() {
    function findLand(p) {
        for (let r=0; r<15; r++) {
            for (let x=p.tx-r; x<=p.tx+r; x++) {
                for (let y=p.ty-r; y<=p.ty+r; y++) {
                    if (worldMap[y] && (worldMap[y][x] === 0 || worldMap[y][x] === 3)) return {tx:x, ty:y};
                }
            }
        }
        return p;
    }
    cavePos = findLand(cavePos);
    mtnPos = findLand(mtnPos);
}

function generateSubMaps() {
    for (let y=0; y<30; y++) {
        G.caveMap[y]=[]; G.caveTileClr[y]=[];
        for (let x=0; x<40; x++) {
            let t = (x===0||x===39||y===0||y===29)?1 : (x===20?2 : 0);
            G.caveMap[y][x]=t; G.caveTileClr[y][x] = t===1?'#151210':t===2?'#1a3a5a':'#2a2828';
        }
    }
    for (let y=0; y<35; y++) {
        G.mountainMap[y]=[]; G.mountainTileClr[y]=[];
        for (let x=0; x<50; x++) {
            let t = (x===0||x===49||y===0||y===34)?1 : 0;
            G.mountainMap[y][x]=t; G.mountainTileClr[y][x] = t===1?'#3a3e38':'#6a6660';
        }
    }
    G.mountainBosses = [
        { key: 'gorath', x: 22*TS, y: 5*TS, hp: 420, maxHp: 420, aggro: false, defeated: false, face: 1, anim: 0 },
        { key: 'vex', x: 28*TS, y: 5*TS, hp: 360, maxHp: 360, aggro: false, defeated: false, face: 1, anim: 0 }
    ];
}

// --- SECTION 3: CORE LOGIC PATCHES ---
const _updateWorld = updateWorld;
updateWorld = function() {
    if (G.fadeDir !== 0) {
        G.fadeAlpha += G.fadeDir * 0.04;
        if (G.fadeAlpha >= 1 && G.fadeDir === 1) { if(G.fadeCb) G.fadeCb(); G.fadeDir = -1; }
        if (G.fadeAlpha <= 0 && G.fadeDir === -1) { G.fadeAlpha = 0; G.fadeDir = 0; }
        return;
    }
    if (G.npcDialogue || G.wirePanel.open) return;

    if (G.zone === 'world') {
        _updateWorld();
        if (Math.hypot(G.player.x - cavePos.tx*TS, G.player.y - cavePos.ty*TS) < 60) enterCave();
        if (G.hasKey && Math.hypot(G.player.x - mtnPos.tx*TS, G.player.y - mtnPos.ty*TS) < 60) enterMountain();
    } else {
        updateExpansionLoop();
    }
};

function updateExpansionLoop() {
    const p = G.player; let dx = 0, dy = 0; let spd = pSpd();
    const mw = G.zone === 'cave' ? 40 : 50, mh = G.zone === 'cave' ? 30 : 35;
    const map = G.zone === 'cave' ? G.caveMap : G.mountainMap;

    if (G.keys['a'] || G.keys['ArrowLeft']) dx -= spd;
    if (G.keys['d'] || G.keys['ArrowRight']) dx += spd;
    if (G.keys['w'] || G.keys['ArrowUp']) dy -= spd;
    if (G.keys['s'] || G.keys['ArrowDown']) dy += spd;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }

    let nx = p.x + dx, ny = p.y + dy;
    let tx = Math.floor(nx / TS), ty = Math.floor(ny / TS);

    if (tx >= 0 && ty >= 0 && tx < mw && ty < mh) {
        if (map[ty][tx] !== 1 && !(G.zone === 'cave' && tx === 20 && !G.puzzleSolved)) {
            p.x = nx; p.y = ny;
        }
    }
    p.moving = !!(dx || dy); if(p.moving) { p.anim++; if(dx!==0) p.face = dx > 0 ? 1 : -1; }

    G.cam.x += (p.x - canvas.width/2 - G.cam.x) * LERP;
    G.cam.y += (p.y - canvas.height/2 - G.cam.y) * LERP;

    if (G.zone === 'cave' && p.x < TS/2) exitToWorld();
    if (G.zone === 'mountain' && p.y > (mh-1)*TS) exitToWorld();

    // Dinos movement in sub-maps
    G.wilds.forEach(w => {
        w.mt--; if(w.mt <= 0) { w.mt = 60+Math.random()*60; let a=Math.random()*Math.PI*2; w.dx=Math.cos(a)*1.5; w.dy=Math.sin(a)*1.5; }
        let nwx = w.x + w.dx, nwy = w.y + w.dy;
        let ntx = Math.floor(nwx/TS), nty = Math.floor(nwy/TS);
        if (ntx>0 && nty>0 && ntx<mw-1 && nty<mh-1 && map[nty][ntx] !== 1) { w.x = nwx; w.y = nwy; }
        w.anim++; if(w.dx!==0) w.face = w.dx > 0 ? 1 : -1;
        if (Math.hypot(p.x - w.x, p.y - w.y) < 40 + DINOS[w.key].sz) { startBattle(w.key, w.isBoss); }
    });
}

// --- SECTION 4: RENDER OVERRIDES ---
const _drawWorld = drawWorld;
drawWorld = function() {
    if (G.zone === 'world') {
        _drawWorld();
        let cx = cavePos.tx*TS - G.cam.x, cy = cavePos.ty*TS - G.cam.y;
        ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(cx, cy, 45, Math.PI, 0); ctx.fill();
        ctx.fillStyle='rgba(255,0,0,0.3)'; ctx.beginPath(); ctx.arc(cx, cy-5, 20, 0, Math.PI*2); ctx.fill();
        let mx = mtnPos.tx*TS - G.cam.x, my = mtnPos.ty*TS - G.cam.y;
        ctx.fillStyle='#555'; ctx.beginPath(); ctx.moveTo(mx-60, my); ctx.lineTo(mx, my-100); ctx.lineTo(mx+60, my); ctx.fill();
    } else {
        const map = G.zone === 'cave' ? G.caveMap : G.mountainMap;
        const clr = G.zone === 'cave' ? G.caveTileClr : G.mountainTileClr;
        const mw = G.zone === 'cave' ? 40 : 50, mh = G.zone === 'cave' ? 30 : 35;
        for (let y=0; y<mh; y++) {
            for (let x=0; x<mw; x++) {
                const px = x*TS - G.cam.x, py = y*TS - G.cam.y;
                if (px < -TS || px > canvas.width || py < -TS || py > canvas.height) continue;
                ctx.fillStyle = clr[y][x]; ctx.fillRect(px, py, TS+1, TS+1);
                if (G.zone === 'cave' && x === 20 && !G.puzzleSolved) {
                    ctx.fillStyle = `rgba(80,180,255,${0.4 + Math.sin(G.tick*0.1)*0.2})`; ctx.fillRect(px,py,TS,TS);
                }
            }
        }
        if (G.zone === 'cave') { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0,0,canvas.width,canvas.height); }
    }
};

const _drawHUD = drawHUD;
drawHUD = function() {
    _drawHUD();
    const W = canvas.width, H = canvas.height, mm = 90, mmx = W - mm - 8, mmy = H - mm - 65;
    
    if (G.zone === 'world') {
        // Cave Icon on Overworld minimap
        ctx.fillStyle = '#f33'; ctx.beginPath(); ctx.arc(mmx + (cavePos.tx/WS)*mm, mmy + (cavePos.ty/WS)*mm, 3, 0, Math.PI*2); ctx.fill();
        // Mountain Icon on Overworld minimap
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mmx + (mtnPos.tx/WS)*mm, mmy + (mtnPos.ty/WS)*mm, 3, 0, Math.PI*2); ctx.fill();
    } else {
        // Redraw expansion map on HUD
        ctx.fillStyle = '#000'; ctx.fillRect(mmx, mmy, mm, mm);
        const map = G.zone === 'cave' ? G.caveMap : G.mountainMap;
        const mw = G.zone === 'cave' ? 40 : 50, mh = G.zone === 'cave' ? 30 : 35;
        for(let y=0; y<mh; y+=2) {
            for(let x=0; x<mw; x+=2) {
                const t = map[y][x];
                ctx.fillStyle = t===1 ? '#111' : t===2 ? '#258' : '#333';
                ctx.fillRect(mmx + (x/mw)*mm, mmy + (y/mh)*mm, (2/mw)*mm+1, (2/mh)*mm+1);
            }
        }
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mmx + (G.player.x/(mw*TS))*mm, mmy + (G.player.y/(mh*TS))*mm, 3, 0, Math.PI*2); ctx.fill();
    }
    if (G.hasKey) { ctx.fillStyle = '#ffd700'; ctx.font = '20px Arial'; ctx.fillText('🔑', 120, 25); }
};

const _render = render;
render = function() {
    _render();
    if (G.fadeAlpha > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fadeAlpha})`; ctx.fillRect(0,0,canvas.width,canvas.height); }
};

// --- SECTION 5: UTILS & INITIALIZATION ---
function enterCave() { startFade(() => { G.zone = 'cave'; G.player.x = 3*TS; G.player.y = 15*TS; spawnExpansionWilds(); }); }
function enterMountain() { startFade(() => { G.zone = 'mountain'; G.player.x = 25*TS; G.player.y = 33*TS; spawnExpansionWilds(); }); }
function exitToWorld() { startFade(() => { const wasCave = G.zone === 'cave'; G.zone = 'world'; G.player.x = (wasCave?cavePos.tx:mtnPos.tx)*TS; G.player.y = (wasCave?cavePos.ty:mtnPos.ty)*TS; spawnWilds(); spawnMega(); }); }

function spawnExpansionWilds() {
    G.wilds = [];
    const keys = Object.keys(DINOS).filter(k => DINOS[k].zone === G.zone && DINOS[k].rarity !== 'Boss');
    const count = G.zone === 'cave' ? 12 : 15;
    for (let i=0; i<count; i++) {
        let tx = Math.floor(Math.random()*30)+5, ty = Math.floor(Math.random()*20)+5;
        G.wilds.push({ key: keys[i%keys.length], x: tx*TS, y: ty*TS, anim: 0, mt: 60, dx: 0, dy: 0, face: 1 });
    }
}

function startFade(cb) { G.fadeAlpha = 0; G.fadeDir = 1; G.fadeCb = cb; }

const _startGame = startGame;
startGame = function(isNew) {
    _startGame(isNew);
    G.zone = 'world'; G.fadeAlpha = 0; G.fadeDir = 0;
    generateSubMaps();
    fixLandmarkPos();
};

// Start logic
generateSubMaps();
if(worldMap.length > 0) fixLandmarkPos();
