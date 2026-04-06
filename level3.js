// ═══════════════════════════════════════════════════════════════════════
// DINOWORLD — LEVEL 3: THE OCEAN
// level3.js
//
// WHERE TO ADD IN index.html:
//   Find the line:  <script src="expansion.js"></script>
//   Add AFTER it:   <script src="level3.js"></script>
//
// This file monkey-patches data.js, render.js, game.js functions.
// It never modifies any existing file.
// ═══════════════════════════════════════════════════════════════════════

// ── 1. EXTEND G STATE ──────────────────────────────────────────────────
G.l3zone            = ‘ocean’;   // ‘ocean’ | ‘underwater_cave’
G.l3caveEntranceTX  = 112;       // tile X of cave entrance on ocean map
G.l3caveEntranceTY  = 100;       // tile Y
G.l3wildcache       = [];        // stash ocean wilds when entering cave
G.l3boss1Defeated   = false;     // Leviathan (ocean)
G.l3boss2Defeated   = false;     // The Ancient (cave)
G.l3gameComplete    = false;
G.l3endingActive    = false;
G.l3endingTick      = 0;
G.l3bridgeOpen      = false;
G.l3ancientData     = { x: 0, y: 0 };

G.l3puzzleWire = {
solved: false, open: false, dragging: null, dragX: 0, dragY: 0,
wires: [
{ col: ‘#ff4444’, rSlot: 2, connected: false },
{ col: ‘#4488ff’, rSlot: 0, connected: false },
{ col: ‘#ffdd00’, rSlot: 1, connected: false }
]
};
G.l3puzzleNums = { solved: false, open: false, positions: null, clicked: [], target: 0 };
G.l3puzzleMaze = { solved: false, open: false, px: 1, py: 1 };

G.oceanMap      = [];
G.oceanTileClr  = [];
G.uwCaveMap     = [];
G.uwCaveTileClr = [];

// ── 2. OCEAN TILE COLORS ───────────────────────────────────────────────
const O_SAND  = [’#d4c090’,’#c8b080’,’#dcc898’,’#c0a870’,’#cca878’];
const O_CORAL = [’#c06028’,’#b04818’,’#cc6a30’,’#a84010’];
const O_DEEP  = [’#08406a’,’#0a4878’,’#063860’,’#0c4872’,’#0a3c68’];
const O_SHAL  = [’#1a7a9a’,’#20889e’,’#16688a’,’#1a7090’];
const C_FLOOR = [’#1a2a3a’,’#162232’,’#1e2e3e’,’#14202e’];
const C_WALL  = [’#080e14’,’#06100e’,’#0a1218’,’#060c10’];
const C_GLOW  = [’#0a2820’,’#0c2e26’,’#08241c’,’#102c22’];
const C_WATER = [’#0a3060’,’#0c3870’,’#0a2850’,’#0e3a6c’];
const C_LAVA  = [’#cc2200’,’#dd1a00’,’#bb2000’,’#e02400’];

// ── 3. DINOS ───────────────────────────────────────────────────────────
// Add zone field to all existing dinos that don’t have one
for (let k in DINOS) { if (!DINOS[k].zone) DINOS[k].zone = ‘world’; }

DINOS.dolichorhynchops = { name:‘Dolichorhynchops’, rarity:‘Common’,    col:’#4a8a9a’,acc:’#2a5a6a’,hp:100, atk:28,spd:5.0,sz:22,sp:0.14,rw:16,  em:‘🦕’,lvl:3,zone:‘ocean’ };
DINOS.archelon         = { name:‘Archelon’,          rarity:‘Common’,    col:’#4a7a5a’,acc:’#2a5a3a’,hp:140, atk:20,spd:2.0,sz:28,sp:0.12,rw:22,  em:‘🐢’,lvl:3,zone:‘ocean’ };
DINOS.nothosaurus      = { name:‘Nothosaurus’,       rarity:‘Common’,    col:’#6a7a4a’,acc:’#4a5a2a’,hp:110, atk:25,spd:4.0,sz:24,sp:0.10,rw:18,  em:‘🦎’,lvl:3,zone:‘ocean’ };
DINOS.plesiosaurus_o   = { name:‘Plesiosaurus’,      rarity:‘Rare’,      col:’#3a6a8a’,acc:’#1a4a6a’,hp:180, atk:40,spd:4.5,sz:32,sp:0.07,rw:52,  em:‘🦕’,lvl:3,zone:‘ocean’ };
DINOS.tylosaurus       = { name:‘Tylosaurus’,        rarity:‘Rare’,      col:’#5a3a6a’,acc:’#3a1a4a’,hp:200, atk:48,spd:5.0,sz:36,sp:0.06,rw:64,  em:‘🦖’,lvl:3,zone:‘ocean’ };
DINOS.kronosaurus      = { name:‘Kronosaurus’,       rarity:‘Rare’,      col:’#2a5a4a’,acc:’#1a3a2a’,hp:220, atk:52,spd:3.8,sz:38,sp:0.05,rw:72,  em:‘🦕’,lvl:3,zone:‘ocean’ };
DINOS.elasmosaurus     = { name:‘Elasmosaurus’,      rarity:‘Epic’,      col:’#2a4a7a’,acc:’#1a2a5a’,hp:260, atk:58,spd:4.2,sz:48,sp:0.03,rw:120, em:‘🦕’,lvl:3,zone:‘ocean’ };
DINOS.liopleurodon     = { name:‘Liopleurodon’,      rarity:‘Legendary’, col:’#1a2a5a’,acc:’#0a1a3a’,hp:380, atk:78,spd:4.8,sz:52,sp:0.04,rw:280, em:‘🦕’,lvl:3,zone:‘ocean’ };
DINOS.leviathan        = { name:‘Leviathan’,         rarity:‘Boss’,      col:’#0a1a2a’,acc:’#050a14’,hp:900, atk:100,spd:3.5,sz:72,sp:0,   rw:1000,em:‘🌊’,lvl:3,zone:‘ocean’ };
DINOS.ancient          = { name:‘The Ancient’,       rarity:‘Boss’,      col:’#050a14’,acc:’#02050a’,hp:1100,atk:120,spd:0,  sz:60,sp:0,   rw:1200,em:‘🔱’,lvl:3,zone:‘underwater_cave’ };

// ── 4. OCEAN WORLD GENERATION ──────────────────────────────────────────
function generateOceanWorld() {
for (let y = 0; y < WS; y++) {
worldMap[y]  = [];
tileClr[y]   = [];
for (let x = 0; x < WS; x++) {
const cx = x - WS/2, cy = y - WS/2;
const dist = Math.sqrt(cx*cx + cy*cy) / (WS * 0.46);
const lx = x + 1000, ly = y + 1000;
const n  = noise(lx, ly);
const n2 = noise(lx * 2.3, ly * 2.1);
let t = 2; // deep ocean default

```
        if (dist < 0.85) {
            const island = Math.sin(lx*0.18+1.5) * Math.cos(ly*0.16+0.8);
            if      (island > 0.72 && dist < 0.6)  t = 0;  // sandy island
            else if (island > 0.62 && dist < 0.65) t = 3;  // shallow beach
            else if (n2 > 0.70    && dist < 0.70)  t = 1;  // coral reef
            else if (n  > 0.60    && dist < 0.75)  t = 3;  // shallow water
        }

        // Clear land around cave entrance
        const caveDist = Math.hypot(x - G.l3caveEntranceTX, y - G.l3caveEntranceTY);
        if (caveDist < 4) t = 0;

        // Ensure player spawn is on land
        const spawnDist = Math.hypot(x - WS/2, y - WS/2);
        if (spawnDist < 5) t = 0;

        worldMap[y][x]  = t;
        tileClr[y][x]   = t===0 ? O_SAND [Math.abs(x*3+y*7)  % O_SAND.length]
                         : t===1 ? O_CORAL[Math.abs(x*5+y*3)  % O_CORAL.length]
                         : t===2 ? O_DEEP [Math.abs(x*7+y*11) % O_DEEP.length]
                         :         O_SHAL [Math.abs(x*11+y*5) % O_SHAL.length];
    }
}
```

}

// ── 5. UNDERWATER CAVE MAP (FIXED LAYOUT) ─────────────────────────────
const UW_W = 45;
const UW_H = 25;

function generateUWCave() {
G.uwCaveMap      = [];
G.uwCaveTileClr  = [];

```
for (let y = 0; y < UW_H; y++) {
    G.uwCaveMap[y]     = [];
    G.uwCaveTileClr[y] = [];
    for (let x = 0; x < UW_W; x++) {
        G.uwCaveMap[y][x]     = 1; // wall
        G.uwCaveTileClr[y][x] = C_WALL[Math.abs(x*3+y*7) % C_WALL.length];
    }
}

function carve(x, y, t) {
    if (x < 0 || x >= UW_W || y < 0 || y >= UW_H) return;
    G.uwCaveMap[y][x]     = t;
    G.uwCaveTileClr[y][x] = t===0 ? C_FLOOR[Math.abs(x*3+y*7)  % C_FLOOR.length]
                           : t===2 ? C_WATER[Math.abs(x*5+y*3)  % C_WATER.length]
                           : t===3 ? C_GLOW [Math.abs(x*7+y*11) % C_GLOW.length]
                           : t===5 ? C_LAVA [Math.abs(x*11+y*5) % C_LAVA.length]
                           : '#8b6914';
}

// Main corridor rows 10-14, cols 1-31
for (let y = 10; y <= 14; y++)
    for (let x = 1; x <= 31; x++)
        carve(x, y, x % 3 === 0 ? 3 : 0);

// Entrance alcove
for (let y = 11; y <= 13; y++) { carve(1, y, 0); carve(2, y, 0); }

// Puzzle 1 alcove (wire): rows 7-17, cols 4-11
for (let y = 7; y <= 17; y++)
    for (let x = 4; x <= 11; x++)
        carve(x, y, (x+y)%4===0 ? 3 : 0);

// Puzzle 2 alcove (numbers): rows 7-17, cols 14-21
for (let y = 7; y <= 17; y++)
    for (let x = 14; x <= 21; x++)
        carve(x, y, 2);
for (let y = 9; y <= 15; y++)
    for (let x = 15; x <= 20; x++)
        carve(x, y, 3);

// Puzzle 3 alcove (maze): rows 7-17, cols 23-30
for (let y = 7; y <= 17; y++)
    for (let x = 23; x <= 30; x++)
        carve(x, y, 0);

// Lava barrier: cols 32-33, rows 4-20 (impassable)
for (let y = 4; y <= 20; y++) {
    carve(32, y, 5);
    carve(33, y, 5);
}
// Bridge gap managed dynamically at runtime (cols 32-33, rows 11-13)

// Boss chamber: rows 8-16, cols 35-43
for (let y = 8; y <= 16; y++)
    for (let x = 35; x <= 43; x++)
        carve(x, y, (x*y)%5===0 ? 3 : 0);

// Water pools in corridor
for (let x = 6; x <= 30; x += 8) {
    carve(x, 9,  2);
    carve(x, 15, 2);
}

// Set Ancient boss spawn
G.l3ancientData = { x: 39*TS + TS/2, y: 12*TS };
```

}

// ── 6. FIXED MAZE GRID ─────────────────────────────────────────────────
const MAZE_GRID = [
[1,1,1,1,1,1,1,1,1,1,1],
[1,0,0,0,1,0,0,0,1,0,1],
[1,0,1,0,1,0,1,0,1,0,1],
[1,0,1,0,0,0,1,0,0,0,1],
[1,0,1,1,1,1,1,1,1,0,1],
[1,0,0,0,0,0,0,0,1,0,1],
[1,1,1,0,1,1,1,0,1,0,1],
[1,0,0,0,1,0,0,0,0,0,1],
[1,1,1,1,1,1,1,1,1,1,1]
]; // Start (1,1) Exit (9,7)

// ── 7. SPAWN FUNCTIONS ─────────────────────────────────────────────────
function spawnOceanWilds() {
G.wilds = [];
const keys = Object.keys(DINOS).filter(k => DINOS[k].lvl===3 && DINOS[k].rarity!==‘Boss’ && DINOS[k].zone===‘ocean’);
const tot  = keys.reduce((s,k) => s + DINOS[k].sp, 0);

```
for (let i = 0; i < 36; i++) {
    let chosen = keys[0], acc = 0;
    const rng = Math.random() * tot;
    for (const k of keys) { acc += DINOS[k].sp; if (rng < acc) { chosen = k; break; } }

    for (let att = 0; att < 30; att++) {
        const tx = Math.floor(Math.random() * WS);
        const ty = Math.floor(Math.random() * WS);
        if (worldMap[ty] && worldMap[ty][tx] !== undefined) {
            G.wilds.push({ key:chosen, x:tx*TS+TS/2, y:ty*TS+TS/2, anim:0, mt:Math.random()*90, dx:0, dy:0, face:1, isBoss:false });
            break;
        }
    }
}
```

}

function spawnLeviathan() {
if (G.l3boss1Defeated) return;
for (let att = 0; att < 300; att++) {
const tx = Math.floor(Math.random() * WS);
const ty = Math.floor(Math.random() * WS);
if (worldMap[ty] && worldMap[ty][tx] === 2) {
G.wilds.push({ key:‘leviathan’, x:tx*TS+TS/2, y:ty*TS+TS/2, anim:0, mt:0, dx:0, dy:0, face:1, isBoss:true });
return;
}
}
}

// ── 8. FADE SYSTEM (independent of expansion.js) ──────────────────────
let L3_fadeAlpha = 0;
let L3_fadeDir   = 0;
let L3_fadeCb    = null;

function l3StartFade(cb) {
L3_fadeAlpha = 0;
L3_fadeDir   = 1;
L3_fadeCb    = cb;
}

function l3UpdateFade() {
if (L3_fadeDir === 0) return;
L3_fadeAlpha += L3_fadeDir * 0.05;
if (L3_fadeDir === 1 && L3_fadeAlpha >= 1) {
L3_fadeAlpha = 1;
if (L3_fadeCb) { L3_fadeCb(); L3_fadeCb = null; }
L3_fadeDir = -1;
} else if (L3_fadeDir === -1 && L3_fadeAlpha <= 0) {
L3_fadeAlpha = 0;
L3_fadeDir   = 0;
}
}

// ── 9. ZONE TRANSITIONS ────────────────────────────────────────────────
function enterUWCave() {
if (G.l3zone === ‘underwater_cave’ || L3_fadeDir !== 0) return;
l3StartFade(() => {
G.l3wildcache = G.wilds.slice(); // stash ocean dinos
G.wilds       = [];              // CLEAR - prevents the freeze bug
G.l3zone      = ‘underwater_cave’;
G.player.x    = 2.5 * TS;
G.player.y    = 12  * TS;
G.cam.x       = 0;
G.cam.y       = Math.max(0, G.player.y - canvas.height/2);
});
}

function exitUWCave() {
if (G.l3zone !== ‘underwater_cave’ || L3_fadeDir !== 0) return;
l3StartFade(() => {
G.wilds       = G.l3wildcache.length ? G.l3wildcache.slice() : [];
G.l3wildcache = [];
G.l3zone      = ‘ocean’;
G.player.x    = (G.l3caveEntranceTX + 1) * TS;
G.player.y    = G.l3caveEntranceTY * TS;
G.cam.x       = Math.max(0, Math.min(WS*TS - canvas.width,  G.player.x - canvas.width/2));
G.cam.y       = Math.max(0, Math.min(WS*TS - canvas.height, G.player.y - canvas.height/2));
});
}

// ── 10. UPDATE PATCHES ─────────────────────────────────────────────────
const _uwL3 = updateWorld;
updateWorld = function () {
if (G.level !== 3) { _uwL3(); return; }

```
l3UpdateFade(); // always tick the fade

if (G.l3zone === 'underwater_cave') {
    updateUWCaveZone();
} else {
    updateOceanZone();
}
```

};

function updateOceanZone() {
const p   = G.player;
let dx    = 0, dy = 0;
const spd = pSpd();

```
if (G.keys['arrowleft']  || G.keys['a'] || G.keys['ArrowLeft'])  dx -= spd;
if (G.keys['arrowright'] || G.keys['d'] || G.keys['ArrowRight']) dx += spd;
if (G.keys['arrowup']    || G.keys['w'] || G.keys['ArrowUp'])    dy -= spd;
if (G.keys['arrowdown']  || G.keys['s'] || G.keys['ArrowDown'])  dy += spd;

if (G.joy.on) {
    const jl = Math.sqrt(G.joy.dx*G.joy.dx + G.joy.dy*G.joy.dy);
    if (jl > 12) { dx += (G.joy.dx/jl)*spd; dy += (G.joy.dy/jl)*spd; }
}
if (dx && dy) { dx *= 0.707; dy *= 0.707; }

// Ocean world — all tiles are passable (ocean level, player can swim everywhere)
const nx = p.x + dx, ny = p.y + dy;
const ttx = Math.floor(nx/TS), tty = Math.floor(ny/TS);
if (ttx >= 0 && tty >= 0 && ttx < WS && tty < WS) { p.x = nx; p.y = ny; }
p.x = Math.max(TS, Math.min((WS-1)*TS, p.x));
p.y = Math.max(TS, Math.min((WS-1)*TS, p.y));

p.moving = !!(dx || dy);
if (p.moving) { p.anim++; if (dx > 0) p.face = 1; else if (dx < 0) p.face = -1; }

// Camera
G.cam.x += (p.x - canvas.width/2  - G.cam.x) * LERP;
G.cam.y += (p.y - canvas.height/2 - G.cam.y) * LERP;
G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width,  G.cam.x));
G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.cam.y));

// Wild AI
for (const w of G.wilds) {
    w.mt--;
    if (w.mt <= 0) {
        w.mt = 50 + Math.random()*100;
        const a = Math.random()*Math.PI*2, ws2 = DINOS[w.key].spd * 0.4;
        w.dx = Math.cos(a)*ws2; w.dy = Math.sin(a)*ws2;
    }
    w.x += w.dx; w.y += w.dy;
    if (w.dx !== 0) w.face = w.dx > 0 ? 1 : -1;
    w.x = Math.max(TS, Math.min((WS-1)*TS, w.x));
    w.y = Math.max(TS, Math.min((WS-1)*TS, w.y));
    w.anim++;
}

// Cave entrance trigger
const cDist = Math.hypot(p.x - G.l3caveEntranceTX*TS - TS/2, p.y - G.l3caveEntranceTY*TS - TS/2);
if (cDist < 52 && L3_fadeDir === 0) { enterUWCave(); return; }

// Encounters
if (G.encCd <= 0) {
    for (let i = 0; i < G.wilds.length; i++) {
        const w = G.wilds[i];
        if (Math.hypot(p.x - w.x, p.y - w.y) < 38 + DINOS[w.key].sz) {
            const wasBoss = w.isBoss;
            G.wilds.splice(i, 1);
            startBattle(w.key, wasBoss);
            if (wasBoss) {
                setTimeout(() => { if (!G.l3boss1Defeated) spawnLeviathan(); }, 90000);
            } else {
                setTimeout(() => {
                    const ks  = Object.keys(DINOS).filter(k => DINOS[k].lvl===3 && DINOS[k].rarity!=='Boss' && DINOS[k].zone==='ocean');
                    const tot2 = ks.reduce((s,k) => s+DINOS[k].sp, 0);
                    let ch = ks[0], ac = 0, rng = Math.random()*tot2;
                    for (const k of ks) { ac += DINOS[k].sp; if (rng < ac) { ch = k; break; } }
                    for (let att = 0; att < 20; att++) {
                        const tx2 = Math.floor(Math.random()*WS), ty2 = Math.floor(Math.random()*WS);
                        if (worldMap[ty2] && worldMap[ty2][tx2] !== undefined) {
                            G.wilds.push({ key:ch, x:tx2*TS+TS/2, y:ty2*TS+TS/2, anim:0, mt:60, dx:0, dy:0, face:1, isBoss:false });
                            break;
                        }
                    }
                }, 5000);
            }
            break;
        }
    }
}
```

}

function updateUWCaveZone() {
// G.wilds is empty here — no wild processing, prevents the freeze

```
const p   = G.player;
let dx    = 0, dy = 0;
const spd = pSpd();

if (G.keys['arrowleft']  || G.keys['a'] || G.keys['ArrowLeft'])  dx -= spd;
if (G.keys['arrowright'] || G.keys['d'] || G.keys['ArrowRight']) dx += spd;
if (G.keys['arrowup']    || G.keys['w'] || G.keys['ArrowUp'])    dy -= spd;
if (G.keys['arrowdown']  || G.keys['s'] || G.keys['ArrowDown'])  dy += spd;

if (G.joy.on) {
    const jl = Math.sqrt(G.joy.dx*G.joy.dx + G.joy.dy*G.joy.dy);
    if (jl > 12) { dx += (G.joy.dx/jl)*spd; dy += (G.joy.dy/jl)*spd; }
}
if (dx && dy) { dx *= 0.707; dy *= 0.707; }

const nx  = p.x + dx, ny = p.y + dy;
const ttx = Math.floor(nx/TS), tty = Math.floor(ny/TS);

if (ttx >= 0 && tty >= 0 && ttx < UW_W && tty < UW_H) {
    const tile = G.uwCaveMap[tty][ttx];
    const isBridgeTile = G.l3bridgeOpen && (ttx === 32 || ttx === 33) && tty >= 11 && tty <= 13;
    if (tile !== 1 && tile !== 5 || isBridgeTile) { p.x = nx; p.y = ny; }
}
p.x = Math.max(TS,    Math.min((UW_W-1)*TS, p.x));
p.y = Math.max(TS/2,  Math.min((UW_H-1)*TS, p.y));

p.moving = !!(dx || dy);
if (p.moving) { p.anim++; if (dx > 0) p.face = 1; else if (dx < 0) p.face = -1; }

// Camera bounded to cave dimensions
G.cam.x += (p.x - canvas.width/2  - G.cam.x) * LERP;
G.cam.y += (p.y - canvas.height/2 - G.cam.y) * LERP;
G.cam.x = Math.max(0, Math.min(Math.max(0, UW_W*TS - canvas.width),  G.cam.x));
G.cam.y = Math.max(0, Math.min(Math.max(0, UW_H*TS - canvas.height), G.cam.y));

// Exit trigger — player walks left past col 2
if (p.x < 2.5*TS && L3_fadeDir === 0) { exitUWCave(); return; }

// Bridge open check
if (!G.l3bridgeOpen && G.l3puzzleWire.solved && G.l3puzzleNums.solved && G.l3puzzleMaze.solved) {
    G.l3bridgeOpen = true;
    spawnParticles(canvas.width/2, canvas.height/2, '#55ddff', 25);
    addChatMessage('System', '🌉 Bridge lowered! Cross to face The Ancient!');
    saveL3();
}

// Ancient boss trigger
if (!G.l3boss2Defeated && G.l3bridgeOpen && G.encCd <= 0) {
    const aDist = Math.hypot(p.x - G.l3ancientData.x, p.y - G.l3ancientData.y);
    if (aDist < 90) { startBattle('ancient', true); }
}
```

}

// ── 11. DRAW: OCEAN WORLD ──────────────────────────────────────────────
function drawOceanWorld() {
const sx0 = Math.floor(G.cam.x/TS)-1, sy0 = Math.floor(G.cam.y/TS)-1;
const sx1 = sx0+Math.ceil(canvas.width/TS)+2;
const sy1 = sy0+Math.ceil(canvas.height/TS)+2;

```
for (let ty = Math.max(0,sy0); ty < Math.min(WS,sy1); ty++) {
    for (let tx = Math.max(0,sx0); tx < Math.min(WS,sx1); tx++) {
        const px = tx*TS - G.cam.x, py = ty*TS - G.cam.y;
        const t  = worldMap[ty][tx];
        ctx.fillStyle = tileClr[ty][tx];
        ctx.fillRect(px, py, TS+1, TS+1);

        if (t === 2) {
            // Deep ocean — multi-layer shimmer + bioluminescence
            const w1 = Math.sin(G.tick*0.025 + tx*0.6 + ty*0.4)*0.12+0.12;
            const w2 = Math.sin(G.tick*0.018 + tx*0.3 + ty*0.7 + 1.2)*0.08+0.08;
            ctx.fillStyle = `rgba(100,200,255,${w1.toFixed(2)})`;
            ctx.fillRect(px+2, py+TS/2-3, TS-4, 3);
            ctx.fillStyle = `rgba(160,230,255,${w2.toFixed(2)})`;
            ctx.fillRect(px+8, py+TS/2+5, TS-16, 2);
            if ((tx*7 + ty*13 + Math.floor(G.tick*0.3)) % 120 < 2) {
                ctx.fillStyle = 'rgba(80,255,180,0.7)';
                ctx.beginPath();
                ctx.arc(px+((tx*17)%TS), py+((ty*23)%TS), 2, 0, Math.PI*2);
                ctx.fill();
            }
        }
        if (t === 3) {
            const w = Math.sin(G.tick*0.04 + tx*0.8 + ty*0.5)*0.15+0.2;
            ctx.fillStyle = `rgba(180,240,255,${w.toFixed(2)})`;
            ctx.beginPath(); ctx.arc(px+TS/2, py+TS/2, 10, 0, Math.PI*2); ctx.fill();
        }
        if (t === 0 && (tx*13+ty*7)%9 === 0) {
            ctx.fillStyle = '#2a7a2a';
            ctx.beginPath(); ctx.arc(px+TS/2, py+12, 8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#1a5a1a';
            ctx.fillRect(px+TS/2-1, py+12, 2, 12);
        }
        if (t === 1 && (tx*5+ty*11)%4 === 0) {
            ctx.fillStyle = '#e06030';
            ctx.beginPath(); ctx.arc(px+TS/3, py+TS/2, 5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#d04020';
            ctx.beginPath(); ctx.arc(px+2*TS/3, py+TS/3, 4, 0, Math.PI*2); ctx.fill();
        }
    }
}

// Cave entrance marker
const cex = G.l3caveEntranceTX*TS + TS/2 - G.cam.x;
const cey = G.l3caveEntranceTY*TS + TS/2 - G.cam.y;
if (cex > -90 && cex < canvas.width+90 && cey > -90 && cey < canvas.height+90) {
    const pulse = Math.sin(G.tick*0.07)*0.35+0.65;
    ctx.fillStyle   = `rgba(0,150,200,${(pulse*0.35).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(cex, cey, 50, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = `rgba(0,220,255,${(pulse*0.9).toFixed(2)})`;
    ctx.lineWidth   = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.arc(cex, cey, 50, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    rr(cex-26, cey-26, 52, 52, 10, '#0a0a16', '#00ccff', 2);
    ctx.fillStyle = '#00ccff'; ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Cave ▼', cex, cey);
    const playerDistToCave = Math.hypot(G.player.x - G.l3caveEntranceTX*TS - TS/2, G.player.y - G.l3caveEntranceTY*TS - TS/2);
    if (playerDistToCave < 180) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Courier New';
        ctx.fillText('[ Underwater Cave ]', cex, cey-66);
    }
}
```

}

// ── 12. DRAW: UNDERWATER CAVE ──────────────────────────────────────────
function drawUWCaveWorld() {
ctx.fillStyle = ‘#020810’;
ctx.fillRect(0, 0, canvas.width, canvas.height);

```
const sx0 = Math.floor(G.cam.x/TS)-1, sy0 = Math.floor(G.cam.y/TS)-1;
const sx1 = sx0+Math.ceil(canvas.width/TS)+2;
const sy1 = sy0+Math.ceil(canvas.height/TS)+2;

for (let ty = Math.max(0,sy0); ty < Math.min(UW_H,sy1); ty++) {
    for (let tx = Math.max(0,sx0); tx < Math.min(UW_W,sx1); tx++) {
        const px = tx*TS - G.cam.x, py = ty*TS - G.cam.y;
        const isBridgeTile = G.l3bridgeOpen && (tx===32||tx===33) && ty>=11 && ty<=13;
        const t  = isBridgeTile ? 6 : G.uwCaveMap[ty][tx];

        if (t === 1) {
            ctx.fillStyle = G.uwCaveTileClr[ty][tx];
            ctx.fillRect(px, py, TS+1, TS+1);
            if ((tx*5+ty*3)%7 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fillRect(px+4, py+4, TS*0.4, TS*0.3);
            }
        } else if (t === 5) {
            ctx.fillStyle = G.uwCaveTileClr[ty][tx];
            ctx.fillRect(px, py, TS+1, TS+1);
            const lp = Math.sin(G.tick*0.08+tx*0.4+ty*0.3)*0.3+0.7;
            ctx.fillStyle = `rgba(255,120,0,${(lp*0.8).toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(px+TS/2, py+TS/2+Math.sin(G.tick*0.05+tx)*4, TS*0.36, TS*0.25, 0.3, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = `rgba(255,200,50,${lp.toFixed(2)})`;
            ctx.beginPath(); ctx.arc(px+TS/2, py+TS/2, 5, 0, Math.PI*2); ctx.fill();
        } else if (t === 6) {
            ctx.fillStyle = '#8b6914'; ctx.fillRect(px, py, TS+1, TS+1);
            ctx.fillStyle = '#6b4a08';
            for (let bi = 0; bi < 3; bi++) ctx.fillRect(px+2, py+6+bi*12, TS-4, 3);
        } else if (t === 2) {
            ctx.fillStyle = G.uwCaveTileClr[ty][tx]; ctx.fillRect(px, py, TS+1, TS+1);
            const wv = Math.sin(G.tick*0.03+tx*0.5+ty*0.4)*0.15+0.15;
            ctx.fillStyle = `rgba(100,200,255,${wv.toFixed(2)})`;
            ctx.fillRect(px+3, py+TS/2-2, TS-6, 3);
        } else if (t === 3) {
            ctx.fillStyle = G.uwCaveTileClr[ty][tx]; ctx.fillRect(px, py, TS+1, TS+1);
            const glow = Math.sin(G.tick*0.04+tx*0.7+ty*0.5)*0.2+0.3;
            ctx.fillStyle = `rgba(0,255,180,${glow.toFixed(2)})`;
            ctx.beginPath(); ctx.arc(px+TS/2, py+TS/2, 8, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = G.uwCaveTileClr[ty][tx]; ctx.fillRect(px, py, TS+1, TS+1);
            if ((tx*7+ty*11)%13 === 0) {
                ctx.fillStyle = 'rgba(0,200,150,0.12)';
                ctx.fillRect(px+6, py+8, TS*0.3, 3);
            }
        }
    }
}

// Ambient darkness
ctx.fillStyle = 'rgba(0,0,0,0.32)';
ctx.fillRect(0, 0, canvas.width, canvas.height);

drawUWCavePuzzlePanels();

// Ancient boss
if (!G.l3boss2Defeated) {
    const ax = G.l3ancientData.x - G.cam.x;
    const ay = G.l3ancientData.y - G.cam.y;
    if (ax > -120 && ax < canvas.width+120 && ay > -120 && ay < canvas.height+120) {
        drawAncient(ax, ay, G.tick);
        if (!G.l3bridgeOpen) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(ax-80, ay-80, 160, 22);
            ctx.fillStyle = '#888';
            ctx.font = '10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Solve puzzles to reach', ax, ay-69);
        }
    }
}

// Exit label
const exitX = 1.5*TS - G.cam.x, exitY = 12*TS - G.cam.y;
ctx.fillStyle = '#44ff44'; ctx.font = 'bold 11px Courier New';
ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
ctx.fillText('← EXIT', exitX + TS*1.5, exitY);

// Lava label
if (!G.l3bridgeOpen) {
    const lx = 31*TS - G.cam.x, ly = 9*TS - G.cam.y;
    if (lx > 0 && lx < canvas.width) {
        ctx.fillStyle = 'rgba(255,100,0,0.9)';
        ctx.font = 'bold 11px Courier New';
        ctx.fillText('Solve all 3 puzzles to bridge the lava!', lx + 30, ly);
    }
}
```

}

function drawUWCavePuzzlePanels() {
const panels = [
{ key:‘wire’,  tx:7,  ty:12, label:‘Wire Puzzle’,  col:’#ff8844’ },
{ key:‘nums’,  tx:17, ty:12, label:‘Code Puzzle’,  col:’#4488ff’ },
{ key:‘maze’,  tx:26, ty:12, label:‘Maze Puzzle’,  col:’#aa44ff’ }
];

```
for (const pn of panels) {
    const px = pn.tx*TS - G.cam.x, py = pn.ty*TS - G.cam.y;
    if (px < -70 || px > canvas.width+70) continue;

    const solved = (pn.key==='wire'&&G.l3puzzleWire.solved)
                || (pn.key==='nums'&&G.l3puzzleNums.solved)
                || (pn.key==='maze'&&G.l3puzzleMaze.solved);
    const col = solved ? '#44ff44' : pn.col;

    rr(px-28, py-34, 56, 40, 6, 'rgba(0,0,0,0.85)', col, 2);
    ctx.fillStyle = col; ctx.font = 'bold 9px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(solved ? '✓ DONE' : '! PUZZLE', px, py-18);
    ctx.fillStyle = '#aaa'; ctx.font = '8px Courier New';
    ctx.fillText(pn.label, px, py-7);

    const dist = Math.hypot(G.player.x - pn.tx*TS - TS/2, G.player.y - pn.ty*TS - TS/2);
    if (dist < 90 && !solved) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Courier New';
        ctx.fillText('[E] Interact', px, py-52);
    }
}
```

}

// ── 13. PUZZLE DRAW FUNCTIONS ──────────────────────────────────────────

// WIRE PUZZLE PANEL
function drawWirePuzzlePanel() {
const pw = G.l3puzzleWire;
if (!pw.open) return;
const W = canvas.width, H = canvas.height;
const pw2 = 340, ph2 = 280;
const ox = (W-pw2)/2, oy = (H-ph2)/2;

```
rr(ox, oy, pw2, ph2, 12, 'rgba(5,15,30,0.97)', '#00ccff', 3);
ctx.fillStyle = '#00ccff'; ctx.font = 'bold 16px Courier New';
ctx.textAlign = 'center'; ctx.textBaseline = 'top';
ctx.fillText('⚡ WIRE PUZZLE', ox+pw2/2, oy+14);
ctx.fillStyle = '#888'; ctx.font = '11px Courier New';
ctx.fillText('Drag each wire to its matching socket', ox+pw2/2, oy+36);

const leftX  = ox + 55;
const rightX = ox + pw2 - 55;
const leftYs  = [oy+90, oy+150, oy+210];
const rightYs = [oy+90, oy+150, oy+210];

for (let i = 0; i < 3; i++) {
    const w  = pw.wires[i];
    const ly = leftYs[i];
    const ry = rightYs[w.rSlot];

    // Left socket
    ctx.fillStyle = w.col;
    ctx.beginPath(); ctx.arc(leftX, ly, 11, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

    // Right socket
    ctx.fillStyle = w.connected ? w.col : '#2a2a3a';
    ctx.beginPath(); ctx.arc(rightX, ry, 11, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = w.connected ? w.col : '#555'; ctx.lineWidth = 2; ctx.stroke();

    if (w.connected) {
        ctx.strokeStyle = w.col; ctx.lineWidth = 4;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(leftX+11, ly);
        ctx.bezierCurveTo(leftX+85, ly, rightX-85, ry, rightX-11, ry);
        ctx.stroke();
    }

    if (pw.dragging === i) {
        ctx.strokeStyle = w.col; ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(leftX+11, ly);
        ctx.lineTo(pw.dragX, pw.dragY);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

btn(ox+pw2/2-42, oy+ph2-40, 84, 28, 'Close', '#cc2222', '#fff', () => { pw.open = false; });
```

}

// NUMBER PUZZLE PANEL
function initNumberPuzzle() {
const positions = [];
const used = [];
for (let n = 0; n <= 9; n++) {
let px2, py2, tries = 0;
do {
px2 = 50 + Math.random() * 240;
py2 = 60 + Math.random() * 160;
tries++;
} while (tries < 30 && used.some(u => Math.hypot(u.x-px2, u.y-py2) < 38));
used.push({x:px2, y:py2});
positions.push({ num:n, x:px2, y:py2, clicked:false });
}
G.l3puzzleNums.positions = positions;
G.l3puzzleNums.clicked   = [];
G.l3puzzleNums.target    = 0;
}

function drawNumberPuzzlePanel() {
const pn = G.l3puzzleNums;
if (!pn.open) return;
if (!pn.positions) initNumberPuzzle();

```
const W = canvas.width, H = canvas.height;
const pw2 = 360, ph2 = 300;
const ox = (W-pw2)/2, oy = (H-ph2)/2;

rr(ox, oy, pw2, ph2, 12, 'rgba(5,15,30,0.97)', '#44aaff', 3);
ctx.fillStyle = '#44aaff'; ctx.font = 'bold 16px Courier New';
ctx.textAlign = 'center'; ctx.textBaseline = 'top';
ctx.fillText('🔢 CODE PUZZLE', ox+pw2/2, oy+12);
ctx.fillStyle = '#888'; ctx.font = '11px Courier New';
ctx.fillText(`Click numbers 0 to 9 in order  |  Next: ${pn.target}`, ox+pw2/2, oy+32);

for (const p of pn.positions) {
    const bx = ox + p.x - 18, by = oy + p.y - 18;
    const isNext    = p.num === pn.target && !p.clicked;
    const pulse     = isNext ? 0.55 + Math.sin(G.tick*0.15)*0.45 : 1;

    ctx.fillStyle   = p.clicked ? '#44ff44' : isNext ? `rgba(80,180,255,${pulse.toFixed(2)})` : 'rgba(40,60,80,0.9)';
    ctx.beginPath(); ctx.arc(ox+p.x, oy+p.y, 18, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = p.clicked ? '#00ff00' : isNext ? '#88ccff' : '#334';
    ctx.lineWidth   = 2; ctx.stroke();

    ctx.fillStyle = p.clicked ? '#002200' : '#fff';
    ctx.font = 'bold 15px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.clicked ? '✓' : p.num.toString(), ox+p.x, oy+p.y);

    if (!p.clicked) {
        btn(bx, by, 36, 36, '', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', () => {
            if (p.num === pn.target) {
                p.clicked   = true;
                pn.target++;
                if (pn.target > 9) {
                    pn.solved = true;
                    pn.open   = false;
                    spawnParticles(canvas.width/2, canvas.height/2, '#44aaff', 20);
                    addChatMessage('System', '✓ Code Puzzle solved!');
                    saveL3();
                }
            } else {
                for (const pp of pn.positions) pp.clicked = false;
                pn.target = 0;
                spawnParticles(ox+p.x, oy+p.y, '#ff4444', 8);
            }
        });
    }
}

btn(ox+pw2/2-42, oy+ph2-40, 84, 28, 'Close', '#cc2222', '#fff', () => { pn.open = false; });
```

}

// MAZE PUZZLE PANEL
function drawMazePuzzlePanel() {
const pm = G.l3puzzleMaze;
if (!pm.open) return;

```
const W = canvas.width, H = canvas.height;
const pw2 = 380, ph2 = 330;
const ox  = (W-pw2)/2, oy = (H-ph2)/2;

rr(ox, oy, pw2, ph2, 12, 'rgba(5,15,30,0.97)', '#aa44ff', 3);
ctx.fillStyle = '#aa44ff'; ctx.font = 'bold 16px Courier New';
ctx.textAlign = 'center'; ctx.textBaseline = 'top';
ctx.fillText('🌀 MAZE PUZZLE', ox+pw2/2, oy+12);
ctx.fillStyle = '#888'; ctx.font = '11px Courier New';
ctx.fillText('Click adjacent lit cells to move • Reach EXIT', ox+pw2/2, oy+32);

const cellSize  = 26;
const mazeOffX  = ox + (pw2 - MAZE_GRID[0].length*cellSize) / 2;
const mazeOffY  = oy + 58;

for (let my = 0; my < MAZE_GRID.length; my++) {
    for (let mx = 0; mx < MAZE_GRID[my].length; mx++) {
        const cx2  = mazeOffX + mx*cellSize;
        const cy2  = mazeOffY + my*cellSize;
        const cell = MAZE_GRID[my][mx];
        const isExit   = my === 7 && mx === 9;
        const isPlayer = pm.px === mx && pm.py === my;

        ctx.fillStyle = cell===1 ? '#0e141e' : isExit ? '#1a4a1a' : '#1e2e3a';
        ctx.fillRect(cx2, cy2, cellSize-1, cellSize-1);

        if (isPlayer) {
            ctx.fillStyle = '#40c4ff';
            ctx.beginPath(); ctx.arc(cx2+cellSize/2, cy2+cellSize/2, cellSize*0.33, 0, Math.PI*2); ctx.fill();
        }

        if (isExit) {
            ctx.fillStyle = '#44ff44'; ctx.font = '7px Courier New';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('EXIT', cx2+cellSize/2, cy2+cellSize/2);
        }

        const isAdjacent = cell !== 1 && (Math.abs(mx-pm.px)+Math.abs(my-pm.py) === 1);
        if (isAdjacent && !isPlayer) {
            ctx.fillStyle = 'rgba(100,200,255,0.22)';
            ctx.fillRect(cx2, cy2, cellSize-1, cellSize-1);
            btn(cx2, cy2, cellSize-1, cellSize-1, '', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', () => {
                pm.px = mx; pm.py = my;
                if (my === 7 && mx === 9) {
                    pm.solved = true; pm.open = false;
                    spawnParticles(canvas.width/2, canvas.height/2, '#aa44ff', 20);
                    addChatMessage('System', '✓ Maze solved!');
                    saveL3();
                }
            });
        }
    }
}

btn(ox+pw2/2-42, oy+ph2-40, 84, 28, 'Close', '#cc2222', '#fff', () => { pm.open = false; });
```

}

// ── 14. CUSTOM DINO DRAW FUNCTIONS ────────────────────────────────────

function drawLeviathan(cx, cy, face, sc, af) {
ctx.save();
ctx.translate(cx, cy);
ctx.scale(face, 1);
const s   = (sc||1) * (DINOS.leviathan.sz/20);
const bob = Math.sin(af*0.10)*3;

```
// Shadow
ctx.fillStyle = 'rgba(0,0,0,0.2)';
ctx.beginPath(); ctx.ellipse(0, s*36+2, s*50, 7, 0, 0, Math.PI*2); ctx.fill();

// Serpentine body segments (drawn back to front)
const segData = [
    { ox:-85, ow:16, oscale:0.45 },
    { ox:-60, ow:20, oscale:0.55 },
    { ox:-32, ow:24, oscale:0.70 },
    { ox:  0, ow:28, oscale:1.00 }
];
for (const seg of segData) {
    const sy2 = Math.sin(af*0.08 + seg.ox*0.02) * 8 + bob;
    ctx.fillStyle = '#0a1a2a';
    ctx.beginPath(); ctx.ellipse(seg.ox*s, sy2, seg.ow*s, seg.ow*s*0.52, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a3a5a';
    ctx.beginPath();
    ctx.moveTo((seg.ox - seg.ow*0.3)*s, (sy2 - seg.ow*s*0.4));
    ctx.lineTo(seg.ox*s, sy2 - seg.ow*s);
    ctx.lineTo((seg.ox + seg.ow*0.3)*s, (sy2 - seg.ow*s*0.4));
    ctx.fill();
}

// Head
ctx.fillStyle = '#080f1a';
ctx.beginPath(); ctx.ellipse(30*s, bob, 30*s, 20*s, -0.15, 0, Math.PI*2); ctx.fill();

// Eyes
ctx.fillStyle = '#ff2222'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 14*s;
ctx.beginPath(); ctx.arc(42*s, -10*s+bob, 7*s, 0, Math.PI*2); ctx.fill();
ctx.shadowBlur = 0;
ctx.fillStyle = '#000';
ctx.beginPath(); ctx.arc(43*s, -10*s+bob, 3.5*s, 0, Math.PI*2); ctx.fill();

// Teeth
ctx.fillStyle = '#ccddee';
for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo((30+i*5.5)*s, 12*s+bob);
    ctx.lineTo((30+i*5.5-3)*s, 20*s+bob);
    ctx.lineTo((30+i*5.5+3)*s, 20*s+bob);
    ctx.fill();
}

// Boss glow ring
ctx.shadowColor = '#001a44'; ctx.shadowBlur = 30;
ctx.strokeStyle = 'rgba(0,40,140,0.55)'; ctx.lineWidth = 3;
ctx.beginPath(); ctx.ellipse(0, bob, 80*s, 26*s, 0, 0, Math.PI*2); ctx.stroke();
ctx.shadowBlur = 0;

ctx.restore();
```

}

function drawAncient(cx, cy, af) {
ctx.save();
ctx.translate(cx, cy);
const s   = DINOS.ancient.sz / 20;
const bob = Math.sin(af*0.06)*4;

```
// Ambient aura
const aura = Math.sin(af*0.04)*0.15+0.28;
ctx.fillStyle = `rgba(0,100,200,${aura.toFixed(2)})`;
ctx.beginPath(); ctx.arc(0, bob, 90*s, 0, Math.PI*2); ctx.fill();

// Main body
ctx.fillStyle = '#030810';
ctx.beginPath(); ctx.ellipse(0, bob, 42*s, 30*s, 0, 0, Math.PI*2); ctx.fill();
ctx.fillStyle = '#05101e';
ctx.beginPath(); ctx.ellipse(0, bob, 37*s, 25*s, 0, 0, Math.PI*2); ctx.fill();

// Bioluminescent body markings
const bio = Math.sin(af*0.05)*0.35+0.55;
ctx.fillStyle = `rgba(0,200,255,${(bio*0.4).toFixed(2)})`;
for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.arc(i*10*s, (i%2===0?-4:4)*s+bob, 4*s, 0, Math.PI*2); ctx.fill();
}

// Anglerfish lure
ctx.strokeStyle = '#1a4a6a'; ctx.lineWidth = 3*s;
ctx.beginPath();
ctx.moveTo(0, -24*s+bob);
ctx.quadraticCurveTo(22*s, -46*s+bob, 12*s, -58*s+bob);
ctx.stroke();
const lurePulse = Math.sin(af*0.12)*0.5+0.5;
ctx.fillStyle = `rgba(0,255,180,${lurePulse.toFixed(2)})`;
ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 22*s;
ctx.beginPath(); ctx.arc(12*s, -58*s+bob, 8*s, 0, Math.PI*2); ctx.fill();
ctx.shadowBlur = 0;

// Eyes
ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 10*s;
ctx.beginPath(); ctx.arc(-15*s, -9*s+bob, 9*s, 0, Math.PI*2); ctx.fill();
ctx.beginPath(); ctx.arc( 15*s, -9*s+bob, 9*s, 0, Math.PI*2); ctx.fill();
ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
ctx.beginPath(); ctx.arc(-15*s, -9*s+bob, 4.5*s, 0, Math.PI*2); ctx.fill();
ctx.beginPath(); ctx.arc( 15*s, -9*s+bob, 4.5*s, 0, Math.PI*2); ctx.fill();

// Jaw
ctx.fillStyle = '#0a1a2a';
ctx.beginPath(); ctx.ellipse(0, 15*s+bob, 32*s, 13*s, 0, 0, Math.PI*2); ctx.fill();
ctx.fillStyle = '#ddeeff';
for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i*7.5*s, 8*s+bob);
    ctx.lineTo(i*7.5*s-3*s, 20*s+bob);
    ctx.lineTo(i*7.5*s+3*s, 20*s+bob);
    ctx.fill();
}

// Side tentacles
ctx.fillStyle = '#04101e';
for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo(side*32*s, 4*s+bob);
    ctx.quadraticCurveTo(side*54*s, 16*s+bob, side*48*s, 30*s+bob);
    ctx.quadraticCurveTo(side*38*s, 20*s+bob, side*32*s, 8*s+bob);
    ctx.fill();
}

// Name label
ctx.fillStyle = '#ff3333'; ctx.font = `bold ${12*s}px Courier New`;
ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
ctx.fillText('THE ANCIENT', 0, -72*s+bob);
ctx.fillStyle = '#888'; ctx.font = `${9*s}px Courier New`;
ctx.fillText('Boss', 0, -60*s+bob);

ctx.restore();
```

}

// ── 15. ENDING SCREEN ─────────────────────────────────────────────────
function drawEnding() {
const W = canvas.width, H = canvas.height;
ctx.fillStyle = ‘#000’;
ctx.fillRect(0, 0, W, H);

```
G.l3endingTick++;
const t  = G.l3endingTick;
const fi = Math.min(1, t / 120); // fade-in multiplier

// Stars
for (let i = 0; i < 160; i++) {
    const brt = 0.2 + ((i*31+t*0.1) % 1) * 0.6;
    ctx.fillStyle = `rgba(255,255,255,${(brt*0.7).toFixed(2)})`;
    ctx.beginPath(); ctx.arc((i*137+i*i)%W, (i*89+i*31)%H, 0.9, 0, Math.PI*2); ctx.fill();
}

ctx.globalAlpha = fi;

// "Thank you" header
ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 30;
ctx.font = `bold ${Math.min(56,W*0.055)}px Courier New`;
ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
ctx.fillText('Thank You For Playing!', W/2, H*0.24);
ctx.shadowBlur = 0;

ctx.fillStyle = 'rgba(200,230,255,0.85)';
ctx.font = `${Math.min(17,W*0.017)}px Courier New`;
ctx.fillText('DinoWorld — Open World Survival Index', W/2, H*0.24+52);

// Credits with staggered fade-in
const credits = [
    { text:'Game was made by Ben',      col:'#aaddff', delay:160 },
    { text:'Music was created by Flora', col:'#ffaadd', delay:230 },
    { text:'Join the Discord!',          col:'#dd88ff', delay:300 },
    { text:'discord.gg/8lux',            col:'#88aaff', delay:350, big:true }
];
credits.forEach((c) => {
    const alpha = Math.min(1, Math.max(0, (t - c.delay) / 60));
    ctx.globalAlpha = fi * alpha;
    ctx.fillStyle = c.col;
    ctx.shadowColor  = c.big ? c.col : 'transparent';
    ctx.shadowBlur   = c.big ? 12 : 0;
    ctx.font = c.big
        ? `bold ${Math.min(22,W*0.022)}px Courier New`
        : `${Math.min(18,W*0.018)}px Courier New`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(c.text, W/2, H*0.46 + credits.indexOf(c)*54);
    ctx.shadowBlur = 0;
});

// Dino parade
if (t > 330) {
    ctx.globalAlpha = fi * Math.min(1,(t-330)/60);
    const parade = ['raptor','trex','pterodactyl','liopleurodon','dolichorhynchops'];
    parade.forEach((dk, i) => {
        if (DINOS[dk]) drawDino(dk, W/2+(i-2)*120, H*0.82, 1, t, 0.85, 1);
    });
}

// Click prompt
if (t > 420) {
    const blink = 0.5 + Math.sin(t*0.08)*0.5;
    ctx.globalAlpha = fi * blink;
    ctx.fillStyle = '#fff'; ctx.font = `${Math.min(14,W*0.014)}px Courier New`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('[ Click anywhere to return to menu ]', W/2, H-18);

    G.btns.push({
        x:0, y:0, w:W, h:H,
        act: () => {
            G.l3endingActive = false;
            G.l3endingTick   = 0;
            G.l3boss1Defeated = false;
            G.l3boss2Defeated = false;
            G.l3gameComplete  = false;
            G.l3bridgeOpen    = false;
            G.l3puzzleWire    = { solved:false, open:false, dragging:null, dragX:0, dragY:0,
                wires:[
                    {col:'#ff4444',rSlot:2,connected:false},
                    {col:'#4488ff',rSlot:0,connected:false},
                    {col:'#ffdd00',rSlot:1,connected:false}
                ]};
            G.l3puzzleNums = { solved:false, open:false, positions:null, clicked:[], target:0 };
            G.l3puzzleMaze = { solved:false, open:false, px:1, py:1 };
            G.l3zone = 'ocean';
            G.wilds  = [];
            localStorage.removeItem('dinoworld_l3save');
            G.state = 'intro';
        }
    });
}

ctx.globalAlpha = 1;
```

}

// ── 16. RENDER PATCHES ────────────────────────────────────────────────

// Patch drawWorld
const _dwL3 = drawWorld;
drawWorld = function () {
if (G.level !== 3)                       { _dwL3(); return; }
if (G.l3zone === ‘underwater_cave’)      { drawUWCaveWorld(); return; }
drawOceanWorld();
};

// Patch drawWilds — no roaming enemies in underwater cave
const _dwwL3 = drawWilds;
drawWilds = function () {
if (G.level === 3 && G.l3zone === ‘underwater_cave’) return;
_dwwL3();
};

// Patch drawDino for Leviathan & Ancient
const _ddL3 = drawDino;
drawDino = function (key, cx, cy, face, af, sc, alpha, oc) {
if (key === ‘leviathan’) {
ctx.save();
ctx.globalAlpha = alpha != null ? alpha : 1;
drawLeviathan(cx, cy, face, sc, af);
ctx.restore();
return;
}
if (key === ‘ancient’) {
ctx.save();
ctx.globalAlpha = alpha != null ? alpha : 1;
drawAncient(cx, cy, af);
ctx.restore();
return;
}
_ddL3(key, cx, cy, face, af, sc, alpha, oc);
};

// Patch render — ending screen + puzzle overlays + fade
const _renderL3 = render;
render = function () {
if (G.l3endingActive) {
ctx.clearRect(0, 0, canvas.width, canvas.height);
G.btns = [];
drawEnding();
return;
}

```
_renderL3();

if (G.level === 3) {
    // Draw puzzle panels on top of everything
    if (G.l3puzzleWire.open) drawWirePuzzlePanel();
    if (G.l3puzzleNums.open) drawNumberPuzzlePanel();
    if (G.l3puzzleMaze.open) drawMazePuzzlePanel();

    // Fade overlay
    if (L3_fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${L3_fadeAlpha.toFixed(2)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}
```

};

// ── 17. HUD PATCH: MINIMAP & ZONE LABEL ──────────────────────────────
const _drawHUDL3 = drawHUD;
drawHUD = function () {
_drawHUDL3();
if (G.level !== 3) return;

```
const W = canvas.width, H = canvas.height;
const mm  = 90, mmx = W-mm-8, mmy = H-mm-65;

// Redraw minimap for level 3
ctx.fillStyle = 'rgba(0,0,0,0.85)';
ctx.fillRect(mmx, mmy, mm, mm);
ctx.strokeStyle = 'rgba(0,200,255,0.55)';
ctx.lineWidth   = 1;
ctx.strokeRect(mmx, mmy, mm, mm);

if (G.l3zone === 'underwater_cave') {
    // Cave minimap
    const mscX = mm / UW_W, mscY = mm / UW_H;
    for (let ty2 = 0; ty2 < UW_H; ty2++) {
        for (let tx2 = 0; tx2 < UW_W; tx2++) {
            const isBridge = G.l3bridgeOpen && (tx2===32||tx2===33) && ty2>=11 && ty2<=13;
            const t2 = isBridge ? 6 : G.uwCaveMap[ty2][tx2];
            ctx.fillStyle = t2===1?'#080e14':t2===5?'#cc2200':t2===2?'#0a3060':t2===3?'#0a2820':t2===6?'#8b6914':'#1a2a3a';
            ctx.fillRect(mmx+tx2*mscX, mmy+ty2*mscY, mscX+0.5, mscY+0.5);
        }
    }
    // Puzzle markers
    [{tx:7,ty:12,s:G.l3puzzleWire.solved},{tx:17,ty:12,s:G.l3puzzleNums.solved},{tx:26,ty:12,s:G.l3puzzleMaze.solved}]
        .forEach(pl => {
            ctx.fillStyle = pl.s ? '#44ff44' : '#ffaa00';
            ctx.beginPath(); ctx.arc(mmx+pl.tx*mscX, mmy+pl.ty*mscY, 2.5, 0, Math.PI*2); ctx.fill();
        });
    // Ancient
    if (!G.l3boss2Defeated) {
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.arc(mmx+39*mscX, mmy+12*mscY, 3, 0, Math.PI*2); ctx.fill();
    }
    // Player
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(mmx+G.player.x/TS*mscX, mmy+G.player.y/TS*mscY, 3, 0, Math.PI*2); ctx.fill();
    // Label
    ctx.fillStyle = 'rgba(0,200,255,0.65)'; ctx.font = '8px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('CAVE', mmx+mm/2, mmy-10);
} else {
    // Ocean minimap
    const msc = mm / WS;
    for (let ty2 = 0; ty2 < WS; ty2 += 2) {
        for (let tx2 = 0; tx2 < WS; tx2 += 2) {
            const tt = worldMap[ty2][tx2];
            ctx.fillStyle = tt===2?'#08406a':tt===1?'#c06028':tt===3?'#1a7a9a':'#d4c090';
            ctx.fillRect(mmx+tx2*msc, mmy+ty2*msc, msc*2+0.5, msc*2+0.5);
        }
    }
    // Cave entrance — pulsing cyan dot
    const cPulse = 0.55 + Math.sin(G.tick*0.09)*0.45;
    ctx.fillStyle   = `rgba(0,200,255,${cPulse.toFixed(2)})`;
    ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(mmx+G.l3caveEntranceTX*msc, mmy+G.l3caveEntranceTY*msc, 4, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ccff'; ctx.font = '7px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('CAVE', mmx+G.l3caveEntranceTX*msc, mmy+G.l3caveEntranceTY*msc+5);
    // Wilds
    for (const w of G.wilds) {
        ctx.fillStyle = w.isBoss ? '#ff3333' : RARITY_COLOR[DINOS[w.key].rarity];
        ctx.beginPath(); ctx.arc(mmx+w.x/TS*msc, mmy+w.y/TS*msc, w.isBoss?3:1.5, 0, Math.PI*2); ctx.fill();
    }
    // Player
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(mmx+G.player.x/TS*msc, mmy+G.player.y/TS*msc, 3, 0, Math.PI*2); ctx.fill();
    // Label
    ctx.fillStyle = 'rgba(0,200,255,0.65)'; ctx.font = '8px Courier New';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('OCEAN', mmx+mm/2, mmy-10);
}

// Zone text in HUD bar
ctx.fillStyle = '#0addff'; ctx.font = '12px Courier New';
ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
ctx.fillText(`Map: ${G.l3zone === 'underwater_cave' ? 'Underwater Cave' : 'Ocean World'}`, 16, 38);
```

};

// ── 18. BATTLE OUTCOME PATCH ──────────────────────────────────────────
const _exitBattleL3 = exitBattle;
exitBattle = function () {
const wasLeviathan = G.battle.ek === ‘leviathan’ && G.battle.res === ‘win’;
const wasAncient   = G.battle.ek === ‘ancient’   && G.battle.res === ‘win’;

```
_exitBattleL3();

if (wasLeviathan) {
    G.l3boss1Defeated = true;
    addChatMessage('System', '🌊 Leviathan has fallen! One boss remains...');
    spawnParticles(canvas.width/2, canvas.height/2, '#0088ff', 25);
    saveL3();
    checkL3Ending();
}
if (wasAncient) {
    G.l3boss2Defeated = true;
    addChatMessage('System', '🔱 The Ancient has been defeated!');
    spawnParticles(canvas.width/2, canvas.height/2, '#00ffcc', 25);
    saveL3();
    checkL3Ending();
}
```

};

function checkL3Ending() {
if (G.l3boss1Defeated && G.l3boss2Defeated && !G.l3gameComplete) {
G.l3gameComplete = true;
setTimeout(() => {
G.l3endingActive = true;
G.l3endingTick   = 0;
}, 2200);
}
}

// ── 19. WORLD/SPAWN PATCHES ───────────────────────────────────────────
const _gwL3 = generateWorld;
generateWorld = function () {
if (G.level !== 3) { _gwL3(); return; }
generateOceanWorld();
};

const _swL3 = spawnWilds;
spawnWilds = function () {
if (G.level !== 3) { _swL3(); return; }
if (G.l3zone === ‘underwater_cave’) return;
spawnOceanWilds();
};

const _smL3 = spawnMega;
spawnMega = function () {
if (G.level !== 3) { _smL3(); return; }
if (G.l3zone !== ‘ocean’) return;
spawnLeviathan();
};

// ── 20. INPUT PATCH: E KEY FOR PUZZLES ────────────────────────────────
window.addEventListener(‘keydown’, (e) => {
if (G.level !== 3 || G.state !== ‘world’) return;
if (e.key !== ‘e’ && e.key !== ‘E’) return;
if (G.l3zone !== ‘underwater_cave’) return;
if (G.l3puzzleWire.open || G.l3puzzleNums.open || G.l3puzzleMaze.open) return;

```
const p = G.player;
const panels = [
    { key:'wire', tx:7,  ty:12 },
    { key:'nums', tx:17, ty:12 },
    { key:'maze', tx:26, ty:12 }
];
for (const pn of panels) {
    const dist = Math.hypot(p.x - pn.tx*TS - TS/2, p.y - pn.ty*TS - TS/2);
    const alreadySolved = (pn.key==='wire'&&G.l3puzzleWire.solved)
                       || (pn.key==='nums'&&G.l3puzzleNums.solved)
                       || (pn.key==='maze'&&G.l3puzzleMaze.solved);
    if (dist < 90 && !alreadySolved) {
        if (pn.key === 'wire') G.l3puzzleWire.open = true;
        if (pn.key === 'nums') { G.l3puzzleNums.open = true; if (!G.l3puzzleNums.positions) initNumberPuzzle(); }
        if (pn.key === 'maze') G.l3puzzleMaze.open  = true;
        break;
    }
}
```

});

// ── 21. WIRE PUZZLE MOUSE/TOUCH DRAG ─────────────────────────────────
function getWireSocketPositions() {
const W = canvas.width, H = canvas.height;
const pw2 = 340, ph2 = 280;
const ox = (W-pw2)/2, oy = (H-ph2)/2;
return {
leftX:  ox+55,
rightX: ox+pw2-55,
leftYs: [oy+90, oy+150, oy+210],
rightYs:[oy+90, oy+150, oy+210]
};
}

canvas.addEventListener(‘mousedown’, (e) => {
if (!G.l3puzzleWire.open) return;
const r  = canvas.getBoundingClientRect();
const mx = e.clientX-r.left, my = e.clientY-r.top;
const sp = getWireSocketPositions();
for (let i = 0; i < 3; i++) {
if (!G.l3puzzleWire.wires[i].connected && Math.hypot(mx-sp.leftX, my-sp.leftYs[i]) < 15) {
G.l3puzzleWire.dragging = i;
G.l3puzzleWire.dragX   = mx;
G.l3puzzleWire.dragY   = my;
return;
}
}
});
canvas.addEventListener(‘mousemove’, (e) => {
if (G.l3puzzleWire.dragging === null) return;
const r = canvas.getBoundingClientRect();
G.l3puzzleWire.dragX = e.clientX-r.left;
G.l3puzzleWire.dragY = e.clientY-r.top;
});
canvas.addEventListener(‘mouseup’, (e) => {
if (G.l3puzzleWire.dragging === null) return;
const r  = canvas.getBoundingClientRect();
const mx = e.clientX-r.left, my = e.clientY-r.top;
const sp = getWireSocketPositions();
const wi = G.l3puzzleWire.dragging;
const correctRY = sp.rightYs[G.l3puzzleWire.wires[wi].rSlot];
if (Math.hypot(mx-sp.rightX, my-correctRY) < 22) {
G.l3puzzleWire.wires[wi].connected = true;
spawnParticles(sp.rightX, correctRY, G.l3puzzleWire.wires[wi].col, 8);
if (G.l3puzzleWire.wires.every(w => w.connected)) {
G.l3puzzleWire.solved = true;
G.l3puzzleWire.open   = false;
addChatMessage(‘System’, ‘✓ Wire Puzzle solved!’);
saveL3();
}
}
G.l3puzzleWire.dragging = null;
});
canvas.addEventListener(‘touchstart’, (e) => {
if (!G.l3puzzleWire.open) return;
const r  = canvas.getBoundingClientRect();
const t  = e.touches[0];
const mx = t.clientX-r.left, my = t.clientY-r.top;
const sp = getWireSocketPositions();
for (let i = 0; i < 3; i++) {
if (!G.l3puzzleWire.wires[i].connected && Math.hypot(mx-sp.leftX, my-sp.leftYs[i]) < 20) {
G.l3puzzleWire.dragging = i;
G.l3puzzleWire.dragX   = mx;
G.l3puzzleWire.dragY   = my;
e.preventDefault();
return;
}
}
}, {passive:false});
canvas.addEventListener(‘touchmove’, (e) => {
if (G.l3puzzleWire.dragging === null) return;
const r = canvas.getBoundingClientRect();
const t = e.touches[0];
G.l3puzzleWire.dragX = t.clientX-r.left;
G.l3puzzleWire.dragY = t.clientY-r.top;
e.preventDefault();
}, {passive:false});
canvas.addEventListener(‘touchend’, (e) => {
if (G.l3puzzleWire.dragging === null) return;
const r  = canvas.getBoundingClientRect();
const t  = e.changedTouches[0];
const mx = t.clientX-r.left, my = t.clientY-r.top;
const sp = getWireSocketPositions();
const wi = G.l3puzzleWire.dragging;
const correctRY = sp.rightYs[G.l3puzzleWire.wires[wi].rSlot];
if (Math.hypot(mx-sp.rightX, my-correctRY) < 26) {
G.l3puzzleWire.wires[wi].connected = true;
if (G.l3puzzleWire.wires.every(w => w.connected)) {
G.l3puzzleWire.solved = true;
G.l3puzzleWire.open   = false;
addChatMessage(‘System’, ‘✓ Wire Puzzle solved!’);
saveL3();
}
}
G.l3puzzleWire.dragging = null;
});

// ── 22. CHEAT CODE PATCH ──────────────────────────────────────────────
// Fully replaces doCheatPrompt so dev_lvl3 is handled without double-prompting
doCheatPrompt = function () {
const code = window.prompt(‘Secret Developer Console:\nEnter command:’);
if (!code) return;
const c = code.trim().toLowerCase();

```
if (c === 'dev_lvl3') {
    G.level            = 3;
    G.l3zone           = 'ocean';
    G.discovered       = { dolichorhynchops: true };
    G.player.dk        = 'dolichorhynchops';
    G.player.x         = WS/2 * TS;
    G.player.y         = WS/2 * TS;
    G.wilds            = [];
    G.l3wildcache      = [];
    G.l3boss1Defeated  = false;
    G.l3boss2Defeated  = false;
    G.l3gameComplete   = false;
    G.l3bridgeOpen     = false;
    G.l3puzzleWire     = { solved:false, open:false, dragging:null, dragX:0, dragY:0, wires:[
        {col:'#ff4444',rSlot:2,connected:false},
        {col:'#4488ff',rSlot:0,connected:false},
        {col:'#ffdd00',rSlot:1,connected:false}
    ]};
    G.l3puzzleNums     = { solved:false, open:false, positions:null, clicked:[], target:0 };
    G.l3puzzleMaze     = { solved:false, open:false, px:1, py:1 };
    G.playerHp         = pMaxHp();
    G.playerShield     = 0;
    G.cheatsActive     = true;
    generateOceanWorld();
    spawnOceanWilds();
    spawnLeviathan();
    G.cam.x = Math.max(0, Math.min(WS*TS-canvas.width,  G.player.x-canvas.width/2));
    G.cam.y = Math.max(0, Math.min(WS*TS-canvas.height, G.player.y-canvas.height/2));
    addChatMessage('System', 'Cheat Activated: Teleported to Ocean Map (Level 3)');
    return;
}

// Re-implement original cheat codes (since we replaced the function)
if      (c === 'dev_money') { G.wheat += 999999; G.cheatsActive=true; addChatMessage('System','Cheat Activated: +999,999 Buckets'); }
else if (c === 'dev_dinos') { for(let k in DINOS) G.discovered[k]=true; G.cheatsActive=true; addChatMessage('System','Cheat Activated: All Dinos Unlocked'); }
else if (c === 'dev_god')   { G.player.upg.hp=99;G.player.upg.atk=99;G.player.upg.spd=99;G.playerHp=pMaxHp();G.cheatsActive=true;addChatMessage('System','Cheat Activated: GOD MODE'); }
else if (c === 'dev_lvl2')  { G.level=2;G.discovered={utahraptor:true};G.player.dk='utahraptor';generateWorld();spawnWilds();spawnMega();G.playerHp=pMaxHp();G.volcanoTimer=10800;G.volcanoActive=0;G.hazards=[];G.cheatsActive=true;addChatMessage('System','Cheat Activated: Teleported to Volcano Map'); }
```

};

// ── 23. SAVE / LOAD ───────────────────────────────────────────────────
function saveL3() {
try {
localStorage.setItem(‘dinoworld_l3save’, JSON.stringify({
l3boss1Defeated: G.l3boss1Defeated,
l3boss2Defeated: G.l3boss2Defeated,
l3gameComplete:  G.l3gameComplete,
l3bridgeOpen:    G.l3bridgeOpen,
wire_solved:     G.l3puzzleWire.solved,
nums_solved:     G.l3puzzleNums.solved,
maze_solved:     G.l3puzzleMaze.solved
}));
} catch(e) {}
}

function loadL3() {
try {
const d = JSON.parse(localStorage.getItem(‘dinoworld_l3save’) || ‘{}’);
if (d.l3boss1Defeated !== undefined) {
G.l3boss1Defeated     = !!d.l3boss1Defeated;
G.l3boss2Defeated     = !!d.l3boss2Defeated;
G.l3gameComplete      = !!d.l3gameComplete;
G.l3bridgeOpen        = !!d.l3bridgeOpen;
G.l3puzzleWire.solved = !!d.wire_solved;
G.l3puzzleNums.solved = !!d.nums_solved;
G.l3puzzleMaze.solved = !!d.maze_solved;
}
} catch(e) {}
}

// ── 24. INIT ──────────────────────────────────────────────────────────
generateUWCave();
loadL3();
