/**
 * DinoWorld Update 1.5: The Cave & The Mountain (Bug Fix Edition)
 */

// --- SECTION 1: INITIAL STATE & RESET ---
function resetExpansionState() {
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
        wirePanel: { open: false, solved: false, wires: [], dragging: null, dragX: 0, dragY: 0, panelX: 0, panelY: 0, panelW: 320, panelH: 280 },
        spikeTimer: 5400,
        spikeActive: 0,
        spikes: [],
        caveMap: [],
        mountainMap: [],
        mountainBosses: [],
        miniBosskBossActivated: false
    });
    G.wirePanel.wires = [
        { color: '#ff4444', leftY: 0.35, rightY: 0.65, connected: false },
        { color: '#4488ff', leftY: 0.5,  rightY: 0.35, connected: false },
        { color: '#ffdd00', leftY: 0.65, rightY: 0.5,  connected: false }
    ];
}
resetExpansionState();

// --- SECTION 2: DINOS & FILTERING ---
const NEW_DINOS = {
    minmi: { name:'Minmi', rarity:'Common', col:'#6a5a4a', acc:'#4a3a2a', hp:90, atk:22, spd:3.0, sz:20, sp:0.15, rw:14, em:'🦕', lvl:1, zone:'cave' },
    leaellynasaura: { name:'Leaellynasaura', rarity:'Common', col:'#3a6a5a', acc:'#2a4a3a', hp:80, atk:18, spd:4.0, sz:18, sp:0.12, rw:12, em:'🦎', lvl:1, zone:'cave' },
    scipionyx: { name:'Scipionyx', rarity:'Rare', col:'#7a4a2a', acc:'#5a2a0a', hp:130, atk:38, spd:4.2, sz:22, sp:0.09, rw:44, em:'🦖', lvl:1, zone:'cave' },
    nqwebasaurus: { name:'Nqwebasaurus', rarity:'Rare', col:'#5a6a3a', acc:'#3a4a1a', hp:120, atk:32, spd:3.8, sz:20, sp:0.07, rw:38, em:'🦎', lvl:1, zone:'cave' },
    troodon: { name:'Troodon', rarity:'Epic', col:'#2a3a5a', acc:'#1a2a4a', hp:160, atk:54, spd:5.5, sz:24, sp:0.03, rw:100, em:'🦖', lvl:1, zone:'cave' },
    dromaeosaurus: { name:'Dromaeosaurus', rarity:'Epic', col:'#6a2a3a', acc:'#4a0a1a', hp:150, atk:60, spd:5.8, sz:22, sp:0.025, rw:110, em:'🦖', lvl:1, zone:'cave' },
    arachnis: { name:'Arachnis', rarity:'Boss', col:'#2a1a2a', acc:'#1a0a1a', hp:380, atk:62, spd:2.0, sz:50, sp:0, rw:300, em:'|🕷️', lvl:1, zone:'cave' },
    pachycephalosaurus_mtn: { name:'Pachycephalo', rarity:'Common', col:'#c2b280', acc:'#8a7f5c', hp:150, atk:25, spd:3.2, sz:24, sp:0.14, rw:24, em:'🦕', lvl:1, zone:'mountain' },
    iguanodon_mtn: { name:'Iguanodon', rarity:'Common', col:'#8fbc8f', acc:'#2f4f4f', hp:170, atk:28, spd:3.0, sz:26, sp:0.11, rw:28, em:'🦕', lvl:1, zone:'mountain' },
    allosaurus: { name:'Allosaurus', rarity:'Rare', col:'#8b3a2a', acc:'#6b1a0a', hp:190, atk:46, spd:4.0, sz:34, sp:0.07, rw:56, em:'🦖', lvl:1, zone:'mountain' },
    ceratosaurus: { name:'Ceratosaurus', rarity:'Rare', col:'#9a4a2a', acc:'#6a2a0a', hp:175, atk:42, spd:3.8, sz:30, sp:0.06, rw:48, em:'🦖', lvl:1, zone:'mountain' },
    carcharodontosaurus: { name:'Carcharodonto', rarity:'Epic', col:'#6a3a2a', acc:'#4a1a0a', hp:240, atk:64, spd:4.5, sz:40, sp:0.025, rw:116, em:'🦖', lvl:1, zone:'mountain' },
    gorath: { name:'Gorath', rarity:'Boss', col:'#7a7a7a', acc:'#4a4a4a', hp:420, atk:66, spd:2.5, sz:38, sp:0, rw:0, em:'🪨', lvl:1, zone:'mountain' },
    vex: { name:'Vex', rarity:'Boss', col:'#2a1a3a', acc:'#1a0a2a', hp:360, atk:80, spd:3.5, sz:34, sp:0, rw:0, em:'👁️', lvl:1, zone:'mountain' },
    panda: { name:'Panda', rarity:'Boss', col:'#ffffff', acc:'#111111', hp:700, atk:90, spd:3.8, sz:48, sp:0, rw:800, em:'🐼', lvl:1, zone:'mountain' }
};
Object.assign(DINOS, NEW_DINOS);
for (let k in DINOS) { if (!DINOS[k].zone) DINOS[k].zone = 'world'; }

// --- FIX 1: FILTER SPAWNING BY ZONE ---
const _spawnWilds = spawnWilds;
spawnWilds = function() {
    // We completely override this to ensure only "world" dinos spawn in overworld
    G.wilds = G.wilds.filter(w => w.isBoss); // Keep bosses
    const keys = Object.keys(DINOS).filter(k => DINOS[k].lvl === G.level && DINOS[k].rarity !== 'Boss' && DINOS[k].zone === G.zone);
    
    for(let i=0; i<36; i++){
        let chosen = keys[Math.floor(Math.random()*keys.length)];
        for(let attempt=0; attempt<20; attempt++){
            const tx = Math.floor(Math.random() * WS), ty = Math.floor(Math.random() * WS);
            if(worldMap[ty] && worldMap[ty][tx] !== 2){ 
                G.wilds.push({key: chosen, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: Math.random()*90, dx: 0, dy: 0, face: 1, isBoss: false}); 
                break; 
            }
        }
    }
};

// --- FIX 3: PLACEMENT LOGIC (NO WATER) ---
let cavePos = {x: WS*0.82, y: WS*0.85};
let mtnPos = {x: WS*0.82, y: WS*0.18};

function findValidGround(tx, ty) {
    tx = Math.floor(tx); ty = Math.floor(ty);
    for (let r = 0; r < 10; r++) {
        for (let ox = -r; ox <= r; ox++) {
            for (let oy = -r; oy <= r; oy++) {
                if (worldMap[ty+oy] && (worldMap[ty+oy][tx+ox] === 0 || worldMap[ty+oy][tx+ox] === 3)) {
                    return {x: tx+ox, y: ty+oy};
                }
            }
        }
    }
    return {x: tx, y: ty};
}

// --- FIX 4: MOVEMENT & SUB-WORLD LOGIC ---
function updateSubWorld() {
    const p = G.player; let dx = 0, dy = 0; let spd = pSpd();
    const map = G.zone === 'cave' ? G.caveMap : G.mountainMap;
    const mw = G.zone === 'cave' ? 40 : 50, mh = G.zone === 'cave' ? 30 : 35;

    if (G.keys['a'] || G.keys['ArrowLeft']) dx -= spd;
    if (G.keys['d'] || G.keys['ArrowRight']) dx += spd;
    if (G.keys['w'] || G.keys['ArrowUp']) dy -= spd;
    if (G.keys['s'] || G.keys['ArrowDown']) dy += spd;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }

    // Collision check using sub-map tiles
    let nx = p.x + dx, ny = p.y + dy;
    let ctx = Math.floor(nx / TS), cty = Math.floor(ny / TS);

    if (ctx >= 0 && cty >= 0 && ctx < mw && cty < mh) {
        if (map[cty][ctx] !== 1 && !(G.zone === 'cave' && ctx === 20 && !G.puzzleSolved)) {
            p.x = nx; p.y = ny;
        }
    }
    p.moving = !!(dx || dy); if(p.moving) { p.anim++; if(dx!==0) p.face = dx > 0 ? 1 : -1; }

    G.cam.x += (p.x - canvas.width/2 - G.cam.x) * LERP;
    G.cam.y += (p.y - canvas.height/2 - G.cam.y) * LERP;

    if (G.zone === 'cave' && p.x < TS/2) exitToWorld();
    if (G.zone === 'mountain' && p.y > (mh-1.5)*TS) exitToWorld();
    if (G.zone === 'mountain') updateMountainEvents();
    
    G.wilds.forEach((w, i) => {
        if (Math.hypot(p.x - w.x, p.y - w.y) < 40 + DINOS[w.key].sz) {
            G.wilds.splice(i, 1); startBattle(w.key, w.isBoss);
        }
    });
}

// --- FIX 2: MINIMAP LOGIC ---
const _drawHUD = drawHUD;
drawHUD = function() {
    _drawHUD();
    const W = canvas.width, H = canvas.height;
    const mm = 90, mmx = W - mm - 8, mmy = H - mm - 65;
    
    // Clear old minimap area to redraw
    if (G.zone !== 'world') {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(mmx, mmy, mm, mm);
        const map = G.zone === 'cave' ? G.caveMap : G.mountainMap;
        const mw = G.zone === 'cave' ? 40 : 50, mh = G.zone === 'cave' ? 30 : 35;
        const mscX = mm / mw, mscY = mm / mh;
        
        for(let ty=0; ty<mh; ty++){
            for(let tx=0; tx<mw; tx++){
                const t = map[ty][tx];
                if (t === 1) ctx.fillStyle = '#111';
                else if (t === 2) ctx.fillStyle = G.zone === 'cave' ? '#225588' : '#88ccff';
                else ctx.fillStyle = G.zone === 'cave' ? '#222' : '#555';
                ctx.fillRect(mmx + tx*mscX, mmy + ty*mscY, mscX+1, mscY+1);
            }
        }
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(mmx + (G.player.x/TS)*mscX, mmy + (G.player.y/TS)*mscY, 3, 0, Math.PI*2); ctx.fill();
    }
    
    // Draw Zone Label
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
    ctx.fillText(G.zone === 'world' ? 'MAP' : G.zone.toUpperCase(), mmx + mm/2, mmy - 10);
};

// --- FIX 4 & 5: RESTART & WORLD PATCHES ---
const _startGame = startGame;
startGame = function(isNew) {
    resetExpansionState();
    _startGame(isNew);
    // Recalculate entrance positions on map gen
    cavePos = findValidGround(WS*0.82, WS*0.85);
    mtnPos = findValidGround(WS*0.82, WS*0.18);
};

const _updateWorld = updateWorld;
updateWorld = function() {
    if (G.fadeDir !== 0) {
        G.fadeAlpha += G.fadeDir * 0.04;
        if (G.fadeAlpha >= 1 && G.fadeDir === 1) { G.fadeCb(); G.fadeDir = -1; }
        if (G.fadeAlpha <= 0 && G.fadeDir === -1) { G.fadeAlpha = 0; G.fadeDir = 0; }
        return;
    }
    if (G.npcDialogue || G.wirePanel.open) return;

    if (G.zone === 'world') {
        _updateWorld();
        if (Math.hypot(G.player.x - cavePos.x*TS, G.player.y - cavePos.y*TS) < 60) enterCave();
        if (G.hasKey && Math.hypot(G.player.x - mtnPos.x*TS, G.player.y - mtnPos.y*TS) < 60) enterMountain();
    } else {
        updateSubWorld();
    }
};

// --- HELPERS & RENDERING OVERRIDES ---
function enterCave() {
    startFade(() => {
        G.zone = 'cave'; G.player.x = 2 * TS; G.player.y = 15 * TS;
        G.wilds = []; spawnCaveWilds(); if (!G.spiderDefeated) spawnArachnis();
    });
}

function enterMountain() {
    startFade(() => {
        G.zone = 'mountain'; G.player.x = 25 * TS; G.player.y = 33 * TS;
        G.wilds = []; spawnMountainWilds();
    });
}

function exitToWorld() {
    startFade(() => {
        const isCave = G.zone === 'cave';
        G.zone = 'world';
        G.player.x = (isCave ? cavePos.x : mtnPos.x) * TS;
        G.player.y = (isCave ? cavePos.y : mtnPos.y) * TS;
        spawnWilds(); spawnMega();
    });
}

function startFade(cb) { G.fadeAlpha = 0; G.fadeDir = 1; G.fadeCb = cb; }

const _drawWorld = drawWorld;
drawWorld = function() {
    if (G.zone === 'cave') drawSubMap(G.caveMap, G.caveTileClr, 40, 30, true);
    else if (G.zone === 'mountain') drawSubMap(G.mountainMap, G.mountainTileClr, 50, 35, false);
    else { _drawWorld(); drawMap1Landmarks(); }
};

function drawSubMap(map, clr, w, h, isCave) {
    const sx0 = Math.floor(G.cam.x/TS)-1, sy0 = Math.floor(G.cam.y/TS)-1;
    const sx1 = sx0 + Math.ceil(canvas.width/TS)+2, sy1 = sy0 + Math.ceil(canvas.height/TS)+2;
    for(let ty=Math.max(0,sy0); ty<Math.min(h,sy1); ty++){
        for(let tx=Math.max(0,sx0); tx<Math.min(w,sx1); tx++){
            const px=tx*TS-G.cam.x, py=ty*TS-G.cam.y;
            ctx.fillStyle = clr[ty][tx]; ctx.fillRect(px,py,TS+1,TS+1);
            if (isCave && tx === 20 && !G.puzzleSolved) {
                ctx.fillStyle = `rgba(100,150,255,${0.4 + Math.sin(G.tick*0.1)*0.2})`; ctx.fillRect(px,py,TS,TS);
            } else if (isCave && tx === 20 && G.puzzleSolved) {
                ctx.fillStyle = '#5d4037'; ctx.fillRect(px, py+10, TS, 28);
            }
        }
    }
}

function drawMap1Landmarks() {
    const cx = cavePos.x * TS - G.cam.x, cy = cavePos.y * TS - G.cam.y;
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx, cy, 40, Math.PI, 0); ctx.fill();
    ctx.fillStyle = `rgba(255,0,0,${0.2 + Math.sin(G.tick*0.05)*0.1})`; ctx.beginPath(); ctx.arc(cx, cy-5, 20, 0, Math.PI*2); ctx.fill();
    
    const mx = mtnPos.x * TS - G.cam.x, my = mtnPos.y * TS - G.cam.y;
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.moveTo(mx-60, my); ctx.lineTo(mx, my-100); ctx.lineTo(mx+60, my); ctx.fill();
    ctx.fillStyle = G.hasKey ? '#ffd700' : '#000'; ctx.beginPath(); ctx.arc(mx, my-20, 6, 0, Math.PI*2); ctx.fill();
}

// Final Initialization
function generateCaveMap() {
    const W = 40, H = 30;
    for (let y = 0; y < H; y++) {
        G.caveMap[y] = []; G.caveTileClr[y] = [];
        for (let x = 0; x < W; x++) {
            let t = (x===0||x===W-1||y===0||y===H-1) ? 1 : (x===20?2:0);
            G.caveMap[y][x] = t;
            G.caveTileClr[y][x] = t===1?'#111':t===2?'#224488':'#2a2828';
        }
    }
}
function generateMountainMap() {
    const W = 50, H = 35;
    for (let y = 0; y < H; y++) {
        G.mountainMap[y] = []; G.mountainTileClr[y] = [];
        for (let x = 0; x < W; x++) {
            let t = (x===0||x===W-1||y===0||y===H-1) ? 1 : 0;
            G.mountainMap[y][x] = t;
            G.mountainTileClr[y][x] = t===1?'#333':'#555';
        }
    }
}

generateCaveMap();
generateMountainMap();
function spawnCaveWilds() {
    const keys = Object.keys(DINOS).filter(k => DINOS[k].zone === 'cave' && DINOS[k].rarity !== 'Boss');
    for (let i = 0; i < 12; i++) {
        G.wilds.push({ key: keys[i % keys.length], x: (Math.random()*15+2)*TS, y: (Math.random()*25+2)*TS, anim: 0, mt: 60, dx: 0, dy: 0, face: 1 });
    }
}
function spawnArachnis() { G.wilds.push({ key: 'arachnis', x: 32 * TS, y: 15 * TS, anim: 0, mt: 999, dx: 0, dy: 0, face: 1, isBoss: true }); }
function spawnMountainWilds() {
    const keys = Object.keys(DINOS).filter(k => DINOS[k].zone === 'mountain' && DINOS[k].rarity !== 'Boss');
    for (let i = 0; i < 15; i++) {
        G.wilds.push({ key: keys[i % keys.length], x: (Math.random()*40+5)*TS, y: (Math.random()*25+5)*TS, anim: 0, mt: 60, dx: 0, dy: 0, face: 1 });
    }
}
function updateMountainEvents() {} // Placeholder for spike logic
