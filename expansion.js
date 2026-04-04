/**
 * DinoWorld Update 1.5: The Cave & The Mountain
 * Full Implementation with Bug Fixes for Placement, Minimap, and Movement.
 */

// --- SECTION 0: STATE INITIALIZATION ---
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
    ], dragging: null, dragX: 0, dragY: 0, panelX: 0, panelY: 0, panelW: 320, panelH: 280 },
    spikeTimer: 5400,
    spikeActive: 0,
    spikes: [],
    caveMap: [],
    caveTileClr: [],
    mountainMap: [],
    mountainTileClr: [],
    mountainBosses: [],
    miniBosskBossActivated: false
});

// --- SECTION 1: DINOS ADDITION ---
const NEW_DINOS = {
    minmi: { name:'Minmi', rarity:'Common', col:'#6a5a4a', acc:'#4a3a2a', hp:90,  atk:22, spd:3.0, sz:20, sp:0.15, rw:14,  em:'🦕', lvl:1, zone:'cave' },
    leaellynasaura: { name:'Leaellynasaura',  rarity:'Common', col:'#3a6a5a', acc:'#2a4a3a', hp:80,  atk:18, spd:4.0, sz:18, sp:0.12, rw:12,  em:'🦎', lvl:1, zone:'cave' },
    scipionyx: { name:'Scipionyx',       rarity:'Rare',   col:'#7a4a2a', acc:'#5a2a0a', hp:130, atk:38, spd:4.2, sz:22, sp:0.09, rw:44,  em:'🦖', lvl:1, zone:'cave' },
    nqwebasaurus: { name:'Nqwebasaurus',    rarity:'Rare',   col:'#5a6a3a', acc:'#3a4a1a', hp:120, atk:32, spd:3.8, sz:20, sp:0.07, rw:38,  em:'🦎', lvl:1, zone:'cave' },
    troodon: { name:'Troodon',         rarity:'Epic',   col:'#2a3a5a', acc:'#1a2a4a', hp:160, atk:54, spd:5.5, sz:24, sp:0.03, rw:100, em:'🦖', lvl:1, zone:'cave' },
    dromaeosaurus: { name:'Dromaeosaurus',   rarity:'Epic',   col:'#6a2a3a', acc:'#4a0a1a', hp:150, atk:60, spd:5.8, sz:22, sp:0.025,rw:110, em:'🦖', lvl:1, zone:'cave' },
    arachnis: { name:'Arachnis',       rarity:'Boss',   col:'#2a1a2a', acc:'#1a0a1a', hp:380, atk:62, spd:2.0, sz:50, sp:0,    rw:300, em:'🕷️', lvl:1, zone:'cave' },
    pachycephalosaurus_mtn: { name:'Pachycephalo', rarity:'Common', col:'#c2b280', acc:'#8a7f5c', hp:150, atk:25, spd:3.2, sz:24, sp:0.14, rw:24,  em:'🦕', lvl:1, zone:'mountain' },
    iguanodon_mtn: { name:'Iguanodon', rarity:'Common', col:'#8fbc8f', acc:'#2f4f4f', hp:170, atk:28, spd:3.0, sz:26, sp:0.11, rw:28,  em:'🦕', lvl:1, zone:'mountain' },
    allosaurus: { name:'Allosaurus', rarity:'Rare',   col:'#8b3a2a', acc:'#6b1a0a', hp:190, atk:46, spd:4.0, sz:34, sp:0.07, rw:56,  em:'🦖', lvl:1, zone:'mountain' },
    ceratosaurus: { name:'Ceratosaurus', rarity:'Rare',   col:'#9a4a2a', acc:'#6a2a0a', hp:175, atk:42, spd:3.8, sz:30, sp:0.06, rw:48,  em:'🦖', lvl:1, zone:'mountain' },
    carcharodontosaurus: { name:'Carcharodonto', rarity:'Epic',   col:'#6a3a2a', acc:'#4a1a0a', hp:240, atk:64, spd:4.5, sz:40, sp:0.025,rw:116, em:'🦖', lvl:1, zone:'mountain' },
    gorath: { name:'Gorath', rarity:'Boss',   col:'#7a7a7a', acc:'#4a4a4a', hp:420, atk:66, spd:2.5, sz:38, sp:0,    rw:0,   em:'🪨', lvl:1, zone:'mountain' },
    vex: { name:'Vex', rarity:'Boss',   col:'#2a1a3a', acc:'#1a0a2a', hp:360, atk:80, spd:3.5, sz:34, sp:0,    rw:0,   em:'👁️', lvl:1, zone:'mountain' },
    panda: { name:'Panda', rarity:'Boss',   col:'#ffffff', acc:'#111111', hp:700, atk:90, spd:3.8, sz:48, sp:0,    rw:800, em:'🐼', lvl:1, zone:'mountain' }
};
Object.assign(DINOS, NEW_DINOS);
for (let k in DINOS) { if (!DINOS[k].zone) DINOS[k].zone = 'world'; }

// --- SECTION 2: MAP PLACEMENT & LANDMARK DATA ---
let caveEnt = { tx: 0, ty: 0 };
let mtnEnt = { tx: 0, ty: 0 };

function findValidLandmarkTile(targetX, targetY) {
    // Search spiral around target to find ground (type 0 or 3)
    for (let r = 0; r < 20; r++) {
        for (let x = targetX - r; x <= targetX + r; x++) {
            for (let y = targetY - r; y <= targetY + r; y++) {
                if (worldMap[y] && (worldMap[y][x] === 0 || worldMap[y][x] === 3)) return { tx: x, ty: y };
            }
        }
    }
    return { tx: targetX, ty: targetY };
}

// --- SECTION 3: SUB-MAP GENERATION ---
function generateExpansionMaps() {
    // Cave: 40x30
    for (let y = 0; y < 30; y++) {
        G.caveMap[y] = []; G.caveTileClr[y] = [];
        for (let x = 0; x < 40; x++) {
            let t = (x === 0 || x === 39 || y === 0 || y === 29) ? 1 : 0;
            if (x === 20) t = 2; // River/Gap
            if (t === 0 && Math.random() < 0.1) t = 3; // Wet
            if (t === 0 && Math.random() < 0.05) t = 4; // Moss
            G.caveMap[y][x] = t;
            const clrs = [ ['#3a3535','#322e2e'], ['#1a1210','#150e0d'], WCLR, ['#2a2828','#252323'], ['#1a2a1a','#152215'] ];
            G.caveTileClr[y][x] = clrs[t][Math.floor(Math.random() * clrs[t].length)];
        }
    }
    // Mountain: 50x35
    for (let y = 0; y < 35; y++) {
        G.mountainMap[y] = []; G.mountainTileClr[y] = [];
        for (let x = 0; x < 50; x++) {
            let t = (x === 0 || x === 49 || y === 0 || y === 34) ? 1 : 0;
            if (t === 0 && Math.random() < 0.1) t = 2; // Ice
            if (t === 0 && Math.random() < 0.05) t = 3; // Lava
            G.mountainMap[y][x] = t;
            const clrs = [ ['#6a6660','#625e58'], ['#4a3e38','#423832'], ['#b0c8d8','#a0b8c8'], ['#3a1a0a','#2a1005'] ];
            G.mountainTileClr[y][x] = clrs[t][Math.floor(Math.random() * clrs[t].length)];
        }
    }
    G.mountainBosses = [
        { key: 'gorath', x: 22 * TS, y: 5 * TS, hp: 420, maxHp: 420, aggro: false, defeated: false, face: 1, anim: 0 },
        { key: 'vex', x: 28 * TS, y: 5 * TS, hp: 360, maxHp: 360, aggro: false, defeated: false, face: 1, anim: 0 }
    ];
}

// --- SECTION 4: SPAWNING LOGIC ---
const _spawnWilds = spawnWilds;
spawnWilds = function() {
    if (G.zone !== 'world') return; // Prevent overworld dinos in sub-maps
    _spawnWilds();
    // Filter out expansion dinos from the overworld list if they accidentally got in
    G.wilds = G.wilds.filter(w => DINOS[w.key].zone === 'world');
};

function spawnSubWilds() {
    G.wilds = [];
    const keys = Object.keys(DINOS).filter(k => DINOS[k].zone === G.zone && DINOS[k].rarity !== 'Boss');
    const count = G.zone === 'cave' ? 12 : 15;
    const mw = G.zone === 'cave' ? 40 : 50;
    const mh = G.zone === 'cave' ? 30 : 35;

    for (let i = 0; i < count; i++) {
        let tx = Math.floor(Math.random() * (mw - 2)) + 1;
        let ty = Math.floor(Math.random() * (mh - 2)) + 1;
        // Cave restriction
        if (G.zone === 'cave' && !G.puzzleSolved && tx > 18) tx = Math.floor(Math.random() * 17) + 1;
        G.wilds.push({ key: keys[i % keys.length], x: tx * TS + TS/2, y: ty * TS + TS/2, anim: 0, mt: Math.random() * 90, dx: 0, dy: 0, face: 1, isBoss: false });
    }
    if (G.zone === 'cave' && !G.spiderDefeated) {
        G.wilds.push({ key: 'arachnis', x: 32 * TS, y: 15 * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true });
    }
}

// --- SECTION 5: ZONE SWITCHING ---
function startFade(cb) { G.fadeAlpha = 0; G.fadeDir = 1; G.fadeCb = cb; }

function enterCave() {
    startFade(() => {
        G.zone = 'cave'; G.player.x = 3 * TS; G.player.y = 15 * TS;
        spawnSubWilds();
    });
}

function enterMountain() {
    startFade(() => {
        G.zone = 'mountain'; G.player.x = 25 * TS; G.player.y = 33 * TS;
        spawnSubWilds();
    });
}

function exitExpansion() {
    startFade(() => {
        const wasCave = G.zone === 'cave';
        G.zone = 'world';
        G.player.x = (wasCave ? caveEnt.tx : mtnEnt.tx) * TS;
        G.player.y = (wasCave ? caveEnt.ty : mtnEnt.ty) * TS;
        spawnWilds(); spawnMega();
    });
}

// --- SECTION 6: UPDATE LOOP PATCHES ---
const _updateWorld = updateWorld;
updateWorld = function() {
    // Fade Logic
    if (G.fadeDir !== 0) {
        G.fadeAlpha += G.fadeDir * 0.04;
        if (G.fadeAlpha >= 1 && G.fadeDir === 1) { if(G.fadeCb) G.fadeCb(); G.fadeDir = -1; }
        if (G.fadeAlpha <= 0 && G.fadeDir === -1) { G.fadeAlpha = 0; G.fadeDir = 0; }
        return;
    }
    if (G.npcDialogue || (G.wirePanel && G.wirePanel.open)) return;

    if (G.zone === 'world') {
        _updateWorld();
        if (Math.hypot(G.player.x - caveEnt.tx*TS, G.player.y - caveEnt.ty*TS) < 64) enterCave();
        if (G.hasKey && Math.hypot(G.player.x - mtnEnt.tx*TS, G.player.y - mtnEnt.ty*TS) < 64) enterMountain();
    } else {
        updateExpansionZone();
    }
};

function updateExpansionZone() {
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
            if (G.zone === 'mountain' && map[ty][tx] === 2) p.x -= dx * 0.2, p.y -= dy * 0.2; // Ice friction
        }
    }
    p.moving = !!(dx || dy); if(p.moving) { p.anim++; if(dx!==0) p.face = dx > 0 ? 1 : -1; }

    G.cam.x += (p.x - canvas.width/2 - G.cam.x) * LERP;
    G.cam.y += (p.y - canvas.height/2 - G.cam.y) * LERP;

    // Exit Checks
    if (G.zone === 'cave' && p.x < TS) exitExpansion();
    if (G.zone === 'mountain' && p.y > (mh - 1.5) * TS) exitExpansion();

    // Mountain Spikes
    if (G.zone === 'mountain') {
        if (G.spikeActive > 0) {
            G.spikeActive--; if (G.spikeActive % 40 === 0) G.spikes.push({x: G.cam.x + Math.random()*canvas.width, y: G.cam.y-50, vy: 5, hit: false});
            G.spikes.forEach(s => { 
                s.y += s.vy; 
                if (!s.hit && Math.hypot(p.x - s.x, p.y - s.y) < 30) { G.playerHp = Math.max(1, G.playerHp - 40); s.hit = true; G.lastDamageTick = G.tick; }
            });
            G.spikes = G.spikes.filter(s => s.y < G.cam.y + canvas.height && !s.hit);
        } else {
            G.spikeTimer--; if (G.spikeTimer <= 0) { G.spikeActive = 1200; G.spikeTimer = 5400; G.camShake = 60; }
        }
        // Mini bosses
        G.mountainBosses.forEach(b => {
            if (!b.defeated) {
                const dist = Math.hypot(p.x - b.x, p.y - b.y);
                if (dist < 180) b.aggro = true;
                if (b.aggro) { let a = Math.atan2(p.y-b.y, p.x-b.x); b.x += Math.cos(a)*1.5; b.y += Math.sin(a)*1.5; b.face = p.x > b.x ? 1 : -1; b.anim++; }
                if (dist < 80) startBattle(b.key, false);
            }
        });
    }

    // Wilds
    G.wilds.forEach((w, i) => {
        if (Math.hypot(p.x - w.x, p.y - w.y) < 40 + DINOS[w.key].sz) {
            let k = w.key, b = w.isBoss; G.wilds.splice(i, 1); startBattle(k, b);
        }
    });
}

// --- SECTION 7: RENDER PATCHES ---
const _drawWorld = drawWorld;
drawWorld = function() {
    if (G.zone === 'world') {
        _drawWorld();
        // Cave
        let cx = caveEnt.tx * TS - G.cam.x, cy = caveEnt.ty * TS - G.cam.y;
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx, cy, 48, Math.PI, 0); ctx.fill();
        ctx.fillStyle = `rgba(255,0,0,${0.2 + Math.sin(G.tick*0.05)*0.1})`; ctx.beginPath(); ctx.arc(cx, cy-10, 20, 0, Math.PI*2); ctx.fill();
        // Mountain
        let mx = mtnEnt.tx * TS - G.cam.x, my = mtnEnt.ty * TS - G.cam.y;
        ctx.fillStyle = '#555'; ctx.beginPath(); ctx.moveTo(mx-60, my); ctx.lineTo(mx, my-100); ctx.lineTo(mx+60, my); ctx.fill();
        ctx.fillStyle = G.hasKey ? '#ffd700' : '#000'; ctx.beginPath(); ctx.arc(mx, my-20, 8, 0, Math.PI*2); ctx.fill();
    } else {
        const mw = G.zone === 'cave' ? 40 : 50, mh = G.zone === 'cave' ? 30 : 35;
        const map = G.zone === 'cave' ? G.caveMap : G.mountainMap;
        const clr = G.zone === 'cave' ? G.caveTileClr : G.mountainTileClr;
        for (let y = 0; y < mh; y++) {
            for (let x = 0; x < mw; x++) {
                const px = x*TS - G.cam.x, py = y*TS - G.cam.y;
                if (px < -TS || px > canvas.width || py < -TS || py > canvas.height) continue;
                ctx.fillStyle = clr[y][x]; ctx.fillRect(px, py, TS+1, TS+1);
                if (G.zone === 'cave' && x === 20) {
                    if (!G.puzzleSolved) { ctx.fillStyle = `rgba(100,200,255,${0.4+Math.sin(G.tick*0.1)*0.2})`; ctx.fillRect(px,py,TS,TS); }
                    else { ctx.fillStyle = '#5d4037'; ctx.fillRect(px, py+10, TS, 28); }
                }
            }
        }
        if (G.zone === 'cave') { 
            ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0,0,canvas.width,canvas.height); 
            if(!G.puzzleSolved) { ctx.fillStyle = '#444'; ctx.fillRect(18.5*TS-G.cam.x, 14*TS-G.cam.y, 20, 40); }
        }
        if (G.zone === 'mountain') {
            G.spikes.forEach(s => { ctx.fillStyle = '#444'; ctx.beginPath(); ctx.moveTo(s.x-G.cam.x, s.y-G.cam.y+30); ctx.lineTo(s.x-G.cam.x-10, s.y-G.cam.y); ctx.lineTo(s.x-G.cam.x+10, s.y-G.cam.y); ctx.fill(); });
            if(G.gorathDefeated && G.vexDefeated) { ctx.fillStyle = '#000'; ctx.fillRect(24*TS-G.cam.x, 2*TS-G.cam.y, 2*TS, TS*2); }
        }
    }
};

const _drawHUD = drawHUD;
drawHUD = function() {
    _drawHUD();
    const W = canvas.width, H = canvas.height, mm = 90, mmx = W - mm - 8, mmy = H - mm - 65;
    if (G.zone !== 'world') {
        // Redraw minimap for expansion
        ctx.fillStyle = '#000'; ctx.fillRect(mmx, mmy, mm, mm);
        const map = G.zone === 'cave' ? G.caveMap : G.mountainMap;
        const mw = G.zone === 'cave' ? 40 : 50, mh = G.zone === 'cave' ? 30 : 35;
        for(let y=0; y<mh; y+=2) {
            for(let x=0; x<mw; x+=2) {
                const t = map[y][x];
                ctx.fillStyle = t===1 ? '#111' : t===2 ? '#225588' : '#333';
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
    if (G.npcDialogue) drawNpcDialogue();
    if (G.wirePanel.open) drawWirePanel();
};

// --- SECTION 8: CUSTOM RENDERING (ARACHNIS/NPC) ---
const _drawDino = drawDino;
drawDino = function(key, cx, cy, face, af, sc, alpha, oc) {
    if (key === 'arachnis') {
        const s = (sc||1)*2.5, bob = Math.sin(af*0.1)*5;
        ctx.save(); ctx.translate(cx, cy+bob); ctx.globalAlpha = alpha||1;
        ctx.fillStyle = '#2a1a2a'; ctx.beginPath(); ctx.ellipse(0, 0, 22*s, 14*s, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#1a0a1a'; ctx.lineWidth = 3;
        for(let i=0; i<8; i++) { 
            const side = i < 4 ? 1 : -1;
            ctx.beginPath(); ctx.moveTo(side*10*s, 0); ctx.lineTo(side*35*s, 15*s + Math.sin(af*0.2+i)*5); ctx.stroke();
        }
        ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(-8*s, -4*s, 2*s, 0, Math.PI*2); ctx.arc(8*s, -4*s, 2*s, 0, Math.PI*2); ctx.fill();
        ctx.restore(); return;
    }
    _drawDino(key, cx, cy, face, af, sc, alpha, oc);
};

function drawNpcDialogue() {
    const W = canvas.width, H = canvas.height, d = G.npcDialogue;
    const line = d.lines[d.idx];
    rr(W*0.1, H-140, W*0.8, 120, 10, 'rgba(0,0,0,0.85)', '#4a4', 2);
    ctx.fillStyle = line.speaker === 'YOU' ? '#4f4' : '#4cf'; ctx.font = 'bold 16px Courier';
    ctx.textAlign = 'left'; ctx.fillText(line.speaker + ':', W*0.1+20, H-110);
    ctx.fillStyle = '#fff'; ctx.fillText(line.text, W*0.1+20, H-80, W*0.8-40);
}

function drawNPCs() {
    if (G.zone === 'world') {
        const sx = (WS*0.8)*TS - G.cam.x, sy = (WS*0.75)*TS - G.cam.y;
        ctx.fillStyle = '#d32'; ctx.fillRect(sx-40, sy-10, 80, 40); // Blanket
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.PI/2); drawDino('raptor', 0, 0, 1, G.tick, 0.8, 1, {body:'#4cf', legs:'#137'}); ctx.restore();
    } else if (G.zone === 'cave') {
        const sx = 6*TS - G.cam.x, sy = (30*0.6)*TS - G.cam.y;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(0.15); drawDino('raptor', 0, 0, 1, 0, 1, 1, {body:'#7b4', legs:'#482'}); ctx.restore();
    }
}

function drawWirePanel() {
    const W = canvas.width, H = canvas.height, p = G.wirePanel;
    p.panelX = W/2 - p.panelW/2; p.panelY = H/2 - p.panelH/2;
    rr(p.panelX, p.panelY, p.panelW, p.panelH, 15, '#222', '#555', 4);
    p.wires.forEach((w, i) => {
        const lx = p.panelX + 40, ly = p.panelY + p.panelH * w.leftY;
        const rx = p.panelX + p.panelW - 40, ry = p.panelY + p.panelH * w.rightY;
        ctx.strokeStyle = w.color; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(lx, ly);
        if (w.connected) ctx.lineTo(rx, ry); else if (p.dragging === i) ctx.lineTo(G.mx, G.my); ctx.stroke();
        ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(lx, ly, 8, 0, Math.PI*2); ctx.arc(rx, ry, 8, 0, Math.PI*2); ctx.fill();
    });
}

// --- SECTION 9: INTERACTION ---
window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'e') {
        if (G.npcDialogue) { G.npcDialogue.idx++; if (G.npcDialogue.idx >= G.npcDialogue.lines.length) G.npcDialogue = null; return; }
        if (G.wirePanel.open) { G.wirePanel.open = false; return; }
        // NPC triggers
        if (G.zone === 'world' && Math.hypot(G.player.x - (WS*0.8)*TS, G.player.y - (WS*0.75)*TS) < 80) G.npcDialogue = { lines: [
            {speaker:'yeahitsm3', text:"Yo. Watch where you step, dude."}, {speaker:'YOU', text:"What are ya doing here?"}, {speaker:'yeahitsm3', text:"Just chilling. Join me?"}
        ], idx: 0 };
        if (G.zone === 'cave' && Math.hypot(G.player.x - 6*TS, G.player.y - 18*TS) < 80) G.npcDialogue = { lines: [
            {speaker:'notnoob', text:"W-who is there?!"}, {speaker:'notnoob', text:"Be careful... the eight-legged monster holds the key."}
        ], idx: 0 };
        if (G.zone === 'cave' && !G.puzzleSolved && Math.hypot(G.player.x - 18.5*TS, G.player.y - 15*TS) < 80) G.wirePanel.open = true;
    }
});

canvas.addEventListener('mousedown', () => {
    if (G.wirePanel.open) {
        G.wirePanel.wires.forEach((w, i) => {
            if (Math.hypot(G.mx - (G.wirePanel.panelX + 40), G.my - (G.wirePanel.panelY + G.wirePanel.panelH * w.leftY)) < 20) G.wirePanel.dragging = i;
        });
    }
});
canvas.addEventListener('mouseup', () => {
    if (G.wirePanel.dragging !== null) {
        const w = G.wirePanel.wires[G.wirePanel.dragging];
        if (Math.hypot(G.mx - (G.wirePanel.panelX + G.wirePanel.panelW - 40), G.my - (G.wirePanel.panelY + G.wirePanel.panelH * w.rightY)) < 30) w.connected = true;
        G.wirePanel.dragging = null;
        if (G.wirePanel.wires.every(wi => wi.connected)) { G.puzzleSolved = true; G.wirePanel.open = false; spawnParticles(canvas.width/2, canvas.height/2, '#4f4', 20); }
    }
});

// --- SECTION 10: STATE SAVING & RESTART FIX ---
const _startGame = startGame;
startGame = function(isNew) {
    _startGame(isNew);
    // Expansion State Reset
    G.zone = 'world'; G.fadeAlpha = 0; G.fadeDir = 0;
    // Recalculate positions based on world generation
    caveEnt = findValidLandmarkTile(Math.floor(WS * 0.82), Math.floor(WS * 0.85));
    mtnEnt = findValidLandmarkTile(Math.floor(WS * 0.82), Math.floor(WS * 0.18));
    generateExpansionMaps();
};

const _exitBattle = exitBattle;
exitBattle = function() {
    const k = G.battle.ek, res = G.battle.res === 'win';
    _exitBattle();
    if (res) {
        if (k === 'arachnis') { G.spiderDefeated = true; G.hasKey = true; addChatMessage('System', 'Obtained Golden Key!'); }
        if (k === 'gorath') G.gorathDefeated = true; if (k === 'vex') G.vexDefeated = true;
    }
};

// Start logic
generateExpansionMaps();
// Set initial positions in case world is already generated
if(worldMap.length > 0) {
    caveEnt = findValidLandmarkTile(Math.floor(WS * 0.82), Math.floor(WS * 0.85));
    mtnEnt = findValidLandmarkTile(Math.floor(WS * 0.82), Math.floor(WS * 0.18));
}
