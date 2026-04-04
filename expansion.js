/**
 * DinoWorld Update 1.5: The Cave & The Mountain
 * This file extends the core game functionality via monkey-patching.
 */

// --- SECTION 1: INITIALIZE NEW STATE PROPERTIES ---
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
    caveTileClr: [],
    mountainMap: [],
    mountainTileClr: [],
    mountainBosses: [],
    miniBosskBossActivated: false
});

// Initialize Wire Puzzle Wires
G.wirePanel.wires = [
    { color: '#ff4444', leftY: 0.35, rightY: 0.65, connected: false },
    { color: '#4488ff', leftY: 0.5,  rightY: 0.35, connected: false },
    { color: '#ffdd00', leftY: 0.65, rightY: 0.5,  connected: false }
];

// --- SECTION 2: DINO REGISTRY EXPANSION ---
const NEW_DINOS = {
    // CAVE DINOS
    minmi: { name:'Minmi', rarity:'Common', col:'#6a5a4a', acc:'#4a3a2a', hp:90, atk:22, spd:3.0, sz:20, sp:0.15, rw:14, em:'🦕', lvl:1, zone:'cave' },
    leaellynasaura: { name:'Leaellynasaura', rarity:'Common', col:'#3a6a5a', acc:'#2a4a3a', hp:80, atk:18, spd:4.0, sz:18, sp:0.12, rw:12, em:'🦎', lvl:1, zone:'cave' },
    scipionyx: { name:'Scipionyx', rarity:'Rare', col:'#7a4a2a', acc:'#5a2a0a', hp:130, atk:38, spd:4.2, sz:22, sp:0.09, rw:44, em:'Rex', lvl:1, zone:'cave' },
    nqwebasaurus: { name:'Nqwebasaurus', rarity:'Rare', col:'#5a6a3a', acc:'#3a4a1a', hp:120, atk:32, spd:3.8, sz:20, sp:0.07, rw:38, em:'🦎', lvl:1, zone:'cave' },
    troodon: { name:'Troodon', rarity:'Epic', col:'#2a3a5a', acc:'#1a2a4a', hp:160, atk:54, spd:5.5, sz:24, sp:0.03, rw:100, em:'🦖', lvl:1, zone:'cave' },
    dromaeosaurus: { name:'Dromaeosaurus', rarity:'Epic', col:'#6a2a3a', acc:'#4a0a1a', hp:150, atk:60, spd:5.8, sz:22, sp:0.025, rw:110, em:'🦖', lvl:1, zone:'cave' },
    arachnis: { name:'Arachnis', rarity:'Boss', col:'#2a1a2a', acc:'#1a0a1a', hp:380, atk:62, spd:2.0, sz:50, sp:0, rw:300, em:'🕷️', lvl:1, zone:'cave' },
    // MOUNTAIN DINOS
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

// --- SECTION 3: NPC REGISTRY ---
const NPCS = {
    yeahitsm3: {
        zone: 'world', x: Math.floor(WS * 0.8) * TS, y: Math.floor(WS * 0.75) * TS,
        name: 'yeahitsm3', col: '#40c4ff', acc: '#1a347a', lying: true,
        dialogue: [
            { speaker: 'yeahitsm3', text: "Yo. Watch where you step, dude. You're kicking sand on my blanket." },
            { speaker: 'YOU', text: "What are ya doing here?" },
            { speaker: 'yeahitsm3', text: "Just chilling in the sand. Ya could join me." },
            { speaker: 'YOU', text: "Sorry man, I can't stay. I have a mission to complete." },
            { speaker: 'yeahitsm3', text: "Aw, sad to hear. Well have a great time!" }
        ]
    },
    notnoob: {
        zone: 'cave', x: 6 * TS, y: Math.floor(30 * 0.6) * TS,
        name: 'notnoob', col: '#7ab648', acc: '#4a8a20', hurt: true,
        dialogue: [
            { speaker: 'notnoob', text: "W-who is there?! Stay back! I-I don't have anything left..." },
            { speaker: 'YOU', text: "Easy! I'm just exploring. What happened to you?" },
            { speaker: 'notnoob', text: "Oh... you aren't one of his minions. Y-you're just trying to survive too, huh?" },
            { speaker: 'notnoob', text: "I used to be one of them. W-we hunted anyone who disobeyed the Big Boss... It was horrible." },
            { speaker: 'notnoob', text: "I tried to quit. I t-told him I was done. But nobody just quits. He sends some crazy dinos after me." },
            { speaker: 'notnoob', text: "I hid in this cave, but the s-spiders... the evil ones... they found me. I barely escaped." },
            { speaker: 'notnoob', text: "B-be careful. If you're going deeper, the eight-legged monster is waiting... It holds the key to the peaks." }
        ]
    }
};

// --- SECTION 4: SUB-MAP GENERATION ---
function generateCaveMap() {
    const W = 40, H = 30;
    for (let y = 0; y < H; y++) {
        G.caveMap[y] = []; G.caveTileClr[y] = [];
        for (let x = 0; x < W; x++) {
            let t = 0;
            if (x === 0 || x === W - 1 || y === 0 || y === H - 1) t = 1;
            else if (x === 20) t = 2; // Waterfall/River
            else if (Math.random() < 0.1) t = 3;
            else if (Math.random() < 0.05) t = 4;
            G.caveMap[y][x] = t;
            const colors = t === 0 ? ['#3a3535','#322e2e'] : t === 1 ? ['#1a1210','#150e0d'] : t === 2 ? WCLR : t === 3 ? ['#2a2828','#252323'] : ['#1a2a1a','#152215'];
            G.caveTileClr[y][x] = colors[Math.floor(Math.random() * colors.length)];
        }
    }
}

function generateMountainMap() {
    const W = 50, H = 35;
    for (let y = 0; y < H; y++) {
        G.mountainMap[y] = []; G.mountainTileClr[y] = [];
        for (let x = 0; x < W; x++) {
            let t = 0;
            if (x === 0 || x === W - 1 || y === 0 || y === H - 1) t = 1;
            else if (Math.random() < 0.08) t = 2; // Ice
            else if (Math.random() < 0.05) t = 3; // Lava crack
            G.mountainMap[y][x] = t;
            const colors = t === 0 ? ['#6a6660','#625e58'] : t === 1 ? ['#4a3e38','#423832'] : t === 2 ? ['#b0c8d8','#a0b8c8'] : t === 3 ? ['#3a1a0a','#2a1005'] : ['#0a0808'];
            G.mountainTileClr[y][x] = colors[Math.floor(Math.random() * colors.length)];
        }
    }
    G.mountainBosses = [
        { key: 'gorath', x: 22 * TS, y: 6 * TS, hp: 420, maxHp: 420, aggro: false, defeated: false, face: 1, anim: 0 },
        { key: 'vex', x: 28 * TS, y: 6 * TS, hp: 360, maxHp: 360, aggro: false, defeated: false, face: 1, anim: 0 }
    ];
}

// --- SECTION 5: SPAWNING ---
function spawnCaveWilds() {
    G.wilds = [];
    const keys = Object.keys(DINOS).filter(k => DINOS[k].zone === 'cave' && DINOS[k].rarity !== 'Boss');
    for (let i = 0; i < 12; i++) {
        let tx = Math.floor(Math.random() * (G.puzzleSolved ? 38 : 18)) + 1;
        let ty = Math.floor(Math.random() * 28) + 1;
        G.wilds.push({ key: keys[i % keys.length], x: tx * TS + 24, y: ty * TS + 24, anim: 0, mt: Math.random() * 90, dx: 0, dy: 0, face: 1, isBoss: false });
    }
}

function spawnArachnis() {
    G.wilds.push({ key: 'arachnis', x: 32 * TS, y: 15 * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true });
}

function spawnMountainWilds() {
    G.wilds = [];
    const keys = Object.keys(DINOS).filter(k => DINOS[k].zone === 'mountain' && DINOS[k].rarity !== 'Boss');
    for (let i = 0; i < 15; i++) {
        let tx = Math.floor(Math.random() * 48) + 1;
        let ty = Math.floor(Math.random() * 33) + 1;
        G.wilds.push({ key: keys[i % keys.length], x: tx * TS + 24, y: ty * TS + 24, anim: 0, mt: Math.random() * 90, dx: 0, dy: 0, face: 1, isBoss: false });
    }
}

// --- SECTION 6: TRANSITIONS & UTILS ---
function startFade(cb) {
    G.fadeAlpha = 0; G.fadeDir = 1; G.fadeCb = cb;
}

function enterCave() {
    startFade(() => {
        G.zone = 'cave'; G.player.x = 4 * TS; G.player.y = 15 * TS;
        spawnCaveWilds(); if (!G.spiderDefeated) spawnArachnis();
    });
}

function enterMountain() {
    startFade(() => {
        G.zone = 'mountain'; G.player.x = 25 * TS; G.player.y = 32 * TS;
        spawnMountainWilds();
    });
}

function exitToWorld() {
    startFade(() => {
        const isCave = G.zone === 'cave';
        G.zone = 'world';
        G.player.x = (WS * 0.82) * TS;
        G.player.y = (isCave ? WS * 0.85 : WS * 0.18) * TS;
        spawnWilds(); spawnMega();
    });
}

// --- SECTION 7: MONKEY-PATCHING RENDERING ---
const _drawWorld = drawWorld;
drawWorld = function() {
    if (G.zone === 'cave') drawSubMap(G.caveMap, G.caveTileClr, 40, 30, true);
    else if (G.zone === 'mountain') drawSubMap(G.mountainMap, G.mountainTileClr, 50, 35, false);
    else {
        _drawWorld();
        drawMap1Landmarks();
    }
};

function drawSubMap(map, clr, w, h, isCave) {
    const sx0 = Math.floor(G.cam.x/TS)-1, sy0 = Math.floor(G.cam.y/TS)-1;
    const sx1 = sx0 + Math.ceil(canvas.width/TS)+2, sy1 = sy0 + Math.ceil(canvas.height/TS)+2;
    for(let ty=Math.max(0,sy0); ty<Math.min(h,sy1); ty++){
        for(let tx=Math.max(0,sx0); tx<Math.min(w,sx1); tx++){
            const px=tx*TS-G.cam.x, py=ty*TS-G.cam.y;
            ctx.fillStyle = clr[ty][tx]; ctx.fillRect(px,py,TS+1,TS+1);
            if (isCave && tx === 20 && !G.puzzleSolved) {
                ctx.fillStyle = `rgba(100,150,255,${0.3 + Math.sin(G.tick*0.1)*0.2})`;
                ctx.fillRect(px,py,TS,TS);
            } else if (isCave && tx === 20 && G.puzzleSolved) {
                ctx.fillStyle = '#5d4037'; ctx.fillRect(px, py+10, TS, 28);
            }
        }
    }
    if (isCave) {
        ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if (!G.puzzleSolved) {
            ctx.fillStyle = '#555'; ctx.fillRect(18.5*TS-G.cam.x, 14.5*TS-G.cam.y, 20, 30);
            if (Math.hypot(G.player.x - 18.5*TS, G.player.y - 15*TS) < 80) drawLabel("! Interact (E)", 18.5*TS-G.cam.x+10, 14.5*TS-G.cam.y-10);
        }
        if (!G.spiderDefeated) {
            ctx.strokeStyle = `rgba(180,0,255,${0.3 + Math.sin(G.tick*0.05)*0.2})`; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(32*TS-G.cam.x, 15*TS-G.cam.y, 80, 0, Math.PI*2); ctx.stroke();
        }
        drawLabel("◀ Exit", 1*TS-G.cam.x, 15*TS-G.cam.y, "#aaa");
    } else {
        if (!G.gorathDefeated || !G.vexDefeated) {
            ctx.fillStyle = '#333'; ctx.fillRect(24*TS-G.cam.x, 3*TS-G.cam.y, 2*TS, TS*1.5);
        } else {
            ctx.fillStyle = '#000'; ctx.fillRect(24*TS-G.cam.x, 3*TS-G.cam.y, 2*TS, TS*1.5);
        }
        G.mountainBosses.forEach(b => { if (!b.defeated) {
            drawDino(b.key, b.x-G.cam.x, b.y-G.cam.y, b.face, b.anim, 1.8, 1);
            if (b.aggro) hpBar(b.x-G.cam.x-30, b.y-G.cam.y-50, 60, 8, b.hp, b.maxHp, '#ff4444');
        }});
        drawLabel("Exit ▼", 25*TS-G.cam.x, 34*TS-G.cam.y, "#aaa");
    }
}

function drawMap1Landmarks() {
    const cx = (WS * 0.82) * TS - G.cam.x, cy = (WS * 0.85) * TS - G.cam.y;
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx, cy, 50, Math.PI, 0); ctx.fill();
    ctx.fillStyle = `rgba(255,0,0,${0.1 + Math.sin(G.tick*0.05)*0.1})`; ctx.beginPath(); ctx.arc(cx, cy-10, 30, 0, Math.PI*2); ctx.fill();
    drawLabel("Cave ▶", cx, cy - 60, "#aaaaaa");

    const mx = (WS * 0.82) * TS - G.cam.x, my = (WS * 0.18) * TS - G.cam.y;
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.moveTo(mx-80, my); ctx.lineTo(mx, my-120); ctx.lineTo(mx+80, my); ctx.fill();
    ctx.fillStyle = G.hasKey ? '#ffd700' : '#000'; ctx.beginPath(); ctx.arc(mx, my-20, 8, 0, Math.PI*2); ctx.fill();
    if (!G.hasKey && Math.hypot(G.player.x - (mx+G.cam.x), G.player.y - (my+G.cam.y)) < 200) drawLabel("Locked", mx, my-40, "#ff4444");
}

function drawLabel(txt, x, y, col = "#fff") {
    ctx.fillStyle = col; ctx.font = "bold 14px Courier New"; ctx.textAlign = "center"; ctx.fillText(txt, x, y);
}

const _drawDino = drawDino;
drawDino = function(key, cx, cy, face, af, sc, alpha, oc) {
    if (key === 'arachnis') { drawArachnis(cx, cy, sc, af, alpha); return; }
    _drawDino(key, cx, cy, face, af, sc, alpha, oc);
};

function drawArachnis(cx, cy, sc, af, alpha) {
    const s = (sc || 1) * 2.5, bob = Math.sin(af * 0.1) * 5;
    ctx.save(); ctx.translate(cx, cy + bob); ctx.globalAlpha = alpha || 1;
    ctx.fillStyle = '#2a1a2a'; ctx.beginPath(); ctx.ellipse(0, 0, 22*s, 14*s, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#1a0a1a'; ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
        const side = i < 4 ? 1 : -1; const ang = (i % 4) * 0.4 - 0.6;
        ctx.beginPath(); ctx.moveTo(side*10*s, 0); ctx.lineTo(side*40*s, Math.sin(af*0.2+i)*10 + ang*20); ctx.stroke();
    }
    ctx.fillStyle = '#ff2222'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(-8*s, -4*s, 3*s, 0, Math.PI*2); ctx.arc(8*s, -4*s, 3*s, 0, Math.PI*2); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;
}

const _render = render;
render = function() {
    _render();
    if (G.fadeAlpha > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fadeAlpha})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    if (G.npcDialogue) drawNpcDialogue();
    if (G.wirePanel.open) drawWirePanel();
    drawNPCs();
};

function drawNPCs() {
    for (let k in NPCS) {
        const n = NPCS[k]; if (n.zone !== G.zone) continue;
        const sx = n.x - G.cam.x, sy = n.y - G.cam.y;
        if (n.lying) {
            ctx.fillStyle = '#d32f2f'; ctx.fillRect(sx-40, sy-10, 80, 40); // Blanket
            ctx.fillStyle = '#333'; ctx.fillRect(sx+30, sy-40, 4, 40); // Parasol
            ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.ellipse(sx+32, sy-40, 30, 10, 0, 0, Math.PI*2); ctx.fill();
            ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.PI/2); drawDino('raptor', 0, 0, 1, G.tick, 0.8, 1, {body:n.col, legs:n.acc}); ctx.restore();
        } else if (n.hurt) {
            ctx.save(); ctx.translate(sx, sy); ctx.rotate(0.15); drawDino('raptor', 0, 0, 1, 0, 1, 1, {body:n.col, legs:n.acc});
            ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.stroke(); ctx.restore();
        }
        if (Math.hypot(G.player.x - n.x, G.player.y - n.y) < 80) {
            ctx.fillStyle = '#fff'; rr(sx-10, sy-60, 20, 25, 5, '#fff');
            ctx.fillStyle = '#000'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText('!', sx, sy-42);
        }
    }
}

function drawNpcDialogue() {
    const W = canvas.width, H = canvas.height; const d = G.npcDialogue;
    const line = d.lines[d.idx];
    rr(W*0.1, H-150, W*0.8, 130, 10, 'rgba(0,0,0,0.85)', '#44aa44', 2);
    ctx.fillStyle = line.speaker === 'YOU' ? '#44ff44' : '#40c4ff'; ctx.font = "bold 18px Courier New";
    ctx.textAlign = "left"; ctx.fillText(line.speaker, W*0.1+20, H-120);
    ctx.fillStyle = "#fff"; ctx.font = "16px Courier New";
    ctx.fillText(line.text, W*0.1+20, H-90, W*0.8-40);
    if (G.tick % 60 < 30) { ctx.fillStyle = "#aaa"; ctx.font = "12px Courier New"; ctx.fillText("Tap to continue...", W*0.9-140, H-35); }
}

function drawWirePanel() {
    const W = canvas.width, H = canvas.height, p = G.wirePanel;
    p.panelX = W/2 - p.panelW/2; p.panelY = H/2 - p.panelH/2;
    rr(p.panelX, p.panelY, p.panelW, p.panelH, 15, '#222', p.solved ? '#44ff44' : '#555', 4);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center'; ctx.fillText("REPAIR BRIDGE", W/2, p.panelY + 30);
    p.wires.forEach((w, i) => {
        const lx = p.panelX + 40, ly = p.panelY + p.panelH * w.leftY;
        const rx = p.panelX + p.panelW - 40, ry = p.panelY + p.panelH * w.rightY;
        ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(lx, ly, 10, 0, Math.PI*2); ctx.arc(rx, ry, 10, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = w.color; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(lx, ly);
        if (w.connected) ctx.lineTo(rx, ry);
        else if (p.dragging === i) ctx.lineTo(G.mx, G.my);
        ctx.stroke();
    });
}

// --- SECTION 8: MONKEY-PATCHING LOGIC ---
const _updateWorld = updateWorld;
updateWorld = function() {
    if (G.fadeDir !== 0) {
        G.fadeAlpha += G.fadeDir * 0.04;
        if (G.fadeAlpha >= 1 && G.fadeDir === 1) { G.fadeCb(); G.fadeDir = -1; }
        if (G.fadeAlpha <= 0 && G.fadeDir === -1) { G.fadeAlpha = 0; G.fadeDir = 0; G.fadeCb = null; }
        return;
    }
    if (G.npcDialogue || G.wirePanel.open) return;

    if (G.zone === 'world') {
        _updateWorld();
        if (Math.hypot(G.player.x - (WS*0.82)*TS, G.player.y - (WS*0.85)*TS) < 60) enterCave();
        if (G.hasKey && Math.hypot(G.player.x - (WS*0.82)*TS, G.player.y - (WS*0.18)*TS) < 60) enterMountain();
    } else {
        updateSubWorld();
    }
};

function updateSubWorld() {
    const p = G.player; let dx = 0, dy = 0; let spd = pSpd();
    const map = G.zone === 'cave' ? G.caveMap : G.mountainMap;
    const mw = G.zone === 'cave' ? 40 : 50, mh = G.zone === 'cave' ? 30 : 35;
    
    if (G.keys['a'] || G.keys['ArrowLeft']) dx -= spd;
    if (G.keys['d'] || G.keys['ArrowRight']) dx += spd;
    if (G.keys['w'] || G.keys['ArrowUp']) dy -= spd;
    if (G.keys['s'] || G.keys['ArrowDown']) dy += spd;
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }

    const tx = Math.floor((p.x + dx)/TS), ty = Math.floor((p.y + dy)/TS);
    if (tx >= 0 && ty >= 0 && tx < mw && ty < mh) {
        const t = map[ty][tx];
        if (t !== 1 && !(G.zone === 'cave' && tx === 20 && !G.puzzleSolved)) {
            p.x += dx; p.y += dy;
            if (G.zone === 'mountain' && t === 2) spd *= 0.85; 
        }
    }
    p.moving = !!(dx || dy); if(p.moving) { p.anim++; if(dx!==0) p.face = dx > 0 ? 1 : -1; }

    G.cam.x += (p.x - canvas.width/2 - G.cam.x) * LERP;
    G.cam.y += (p.y - canvas.height/2 - G.cam.y) * LERP;

    if (G.zone === 'cave' && p.x < TS) exitToWorld();
    if (G.zone === 'mountain' && p.y > (mh-2)*TS) exitToWorld();

    if (G.zone === 'mountain') updateMountainEvents();
    
    // Wild encounter logic
    G.wilds.forEach((w, i) => {
        if (Math.hypot(p.x - w.x, p.y - w.y) < 40 + DINOS[w.key].sz) {
            G.wilds.splice(i, 1); startBattle(w.key, w.isBoss);
        }
    });
}

function updateMountainEvents() {
    if (G.spikeActive <= 0) {
        G.spikeTimer--; if (G.spikeTimer <= 0) { G.spikeActive = 1200; G.camShake = 72; G.spikeTimer = 5400; addChatMessage('System', 'The mountain rumbles!'); }
    } else {
        G.spikeActive--; if (G.spikeActive % 45 === 0) {
            for (let i = 0; i < 5; i++) G.spikes.push({ x: G.cam.x + Math.random()*canvas.width, y: G.cam.y-60, vy: 4, width: 18, height: 38, hit: false });
        }
        for (let i = G.spikes.length-1; i >= 0; i--) {
            const s = G.spikes[i]; s.y += s.vy;
            if (!s.hit && Math.hypot(G.player.x - s.x, G.player.y - s.y) < 30) {
                G.playerHp = Math.max(1, G.playerHp - Math.floor(pMaxHp()*0.8)); G.lastDamageTick = G.tick; s.hit = true;
            }
            if (s.y > G.cam.y + canvas.height + 60 || s.hit) G.spikes.splice(i, 1);
        }
    }
    G.mountainBosses.forEach(b => {
        if (!b.defeated) {
            const dist = Math.hypot(G.player.x - b.x, G.player.y - b.y);
            if (dist < 180) b.aggro = true;
            if (b.aggro) { 
                const ang = Math.atan2(G.player.y - b.y, G.player.x - b.x);
                b.x += Math.cos(ang) * 1.5; b.y += Math.sin(ang) * 1.5; b.anim++; b.face = G.player.x > b.x ? 1 : -1;
            }
            if (dist < 40 + DINOS[b.key].sz) startBattle(b.key, false);
        }
    });
}

// --- SECTION 9: INPUT & DIALOGUE ---
window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'e') {
        if (G.npcDialogue) { G.npcDialogue.idx++; if (G.npcDialogue.idx >= G.npcDialogue.lines.length) G.npcDialogue = null; return; }
        if (G.wirePanel.open) { G.wirePanel.open = false; return; }
        for (let k in NPCS) {
            const n = NPCS[k]; if (n.zone === G.zone && Math.hypot(G.player.x - n.x, G.player.y - n.y) < 80) {
                G.npcDialogue = { lines: n.dialogue, idx: 0 }; return;
            }
        }
        if (G.zone === 'cave' && !G.puzzleSolved && Math.hypot(G.player.x - 18.5*TS, G.player.y - 15*TS) < 80) G.wirePanel.open = true;
    }
});

canvas.addEventListener('mousedown', () => {
    if (G.npcDialogue) { G.npcDialogue.idx++; if (G.npcDialogue.idx >= G.npcDialogue.lines.length) G.npcDialogue = null; return; }
    if (G.wirePanel.open) {
        G.wirePanel.wires.forEach((w, i) => {
            const lx = G.wirePanel.panelX + 40, ly = G.wirePanel.panelY + G.wirePanel.panelH * w.leftY;
            if (Math.hypot(G.mx - lx, G.my - ly) < 20) G.wirePanel.dragging = i;
        });
    }
});

canvas.addEventListener('mouseup', () => {
    if (G.wirePanel.dragging !== null) {
        const w = G.wirePanel.wires[G.wirePanel.dragging];
        const rx = G.wirePanel.panelX + G.wirePanel.panelW - 40, ry = G.wirePanel.panelY + G.wirePanel.panelH * w.rightY;
        if (Math.hypot(G.mx - rx, G.my - ry) < 30) w.connected = true;
        G.wirePanel.dragging = null;
        if (G.wirePanel.wires.every(wi => wi.connected)) { G.puzzleSolved = true; G.wirePanel.solved = true; G.wirePanel.open = false; spawnParticles(canvas.width/2, canvas.height/2, '#44ff44', 20); }
    }
});

// --- SECTION 10: SAVE & HUD PATCHES ---
const _exitBattle = exitBattle;
exitBattle = function() {
    const ek = G.battle.ek, res = G.battle.res === 'win';
    _exitBattle();
    if (res) {
        if (ek === 'arachnis') { G.spiderDefeated = true; G.hasKey = true; addChatMessage('System', 'You got the Golden Key!'); }
        if (ek === 'gorath') G.gorathDefeated = true;
        if (ek === 'vex') G.vexDefeated = true;
        if (ek === 'panda') G.pandaDefeated = true;
        G.mountainBosses.forEach(b => { if (b.key === ek) b.defeated = true; });
    }
};

const _drawHUD = drawHUD;
drawHUD = function() {
    _drawHUD();
    if (G.hasKey) {
        const x = 120, y = 18;
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI*2); ctx.fillRect(x+6, y-2, 18, 4);
        ctx.fillRect(x+16, y, 4, 6); ctx.fillRect(x+22, y, 4, 6); ctx.fill();
    }
    // Update minimap label
    ctx.fillStyle='rgba(0,0,0,0.82)'; ctx.fillRect(canvas.width-98, canvas.height-175, 90, 20);
    ctx.fillStyle='#fff'; ctx.font='bold 10px Courier New'; ctx.textAlign='center';
    ctx.fillText(G.zone.toUpperCase(), canvas.width-53, canvas.height-160);

    if (G.spikeActive > 1020) {
        ctx.fillStyle = (G.tick % 20 < 10) ? '#ff0000' : '#fff';
        ctx.font = 'bold 16px Courier New'; ctx.fillText('⚠ INCOMING', canvas.width/2, 80);
    }
};

const _saveGame = saveGame;
saveGame = function() {
    _saveGame();
    try {
        localStorage.setItem('dinoworld_expansion', JSON.stringify({
            zone: G.zone, hasKey: G.hasKey, puzzleSolved: G.puzzleSolved,
            gorathDefeated: G.gorathDefeated, vexDefeated: G.vexDefeated,
            spiderDefeated: G.spiderDefeated, pandaDefeated: G.pandaDefeated
        }));
    } catch(e) {}
};

// --- SECTION 11: INITIALIZATION ---
(function initExpansion() {
    generateCaveMap();
    generateMountainMap();
    try {
        const s = JSON.parse(localStorage.getItem('dinoworld_expansion') || '{}');
        if (s.hasKey !== undefined) {
            G.hasKey = s.hasKey; G.puzzleSolved = s.puzzleSolved; G.wirePanel.solved = s.puzzleSolved;
            G.gorathDefeated = s.gorathDefeated; G.vexDefeated = s.vexDefeated;
            G.spiderDefeated = s.spiderDefeated; G.pandaDefeated = s.pandaDefeated;
        }
    } catch(e) {}
})();
