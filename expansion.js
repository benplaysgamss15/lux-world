// ==========================================
// 🦖 DINOWORLD RPG EXPANSION SCRIPT
// ==========================================
console.log("Loading DinoWorld RPG Expansion...");

// ── 1. ADD NEW STATE VARIABLES ──
G.room = 'main';
G.fade = { active: false, opacity: 0, targetRoom: null, targetX: 0, targetY: 0, phase: 'out' };
G.story = { cavePuzzleSolved: false, mountainKey: false, miniBoss1: false, miniBoss2: false, mainBossDefeated: false };
G.overworldX = WS/2 * TS;
G.overworldY = WS/2 * TS;
G.nearNPC = null;
G.dialogue = { active: false, queue: [], step: 0, speaker: '', text: '' };
G.mountainTimer = 90 * 60; 

// NEW: Wire Puzzle State
G.wirePuzzle = {
    active: false,
    nodes: [
        { id: 0, col: '#ff3333', ly: 40, ry: 120, connected: false },
        { id: 1, col: '#33ff33', ly: 90, ry: 40, connected: false },
        { id: 2, col: '#3333ff', ly: 140, ry: 90, connected: false }
    ],
    selected: null
};

// ── 2. INJECT NEW DINOS INTO THE INDEX ──
for (let key in DINOS) {
    if (DINOS[key].lvl === 1) {
        DINOS[key].zone = 'main';
    }
}

Object.assign(DINOS, {
    troodon: {name:'Troodon', rarity:'Common', col:'#3a3a3a', acc:'#111111', hp:110, atk:35, spd:4.8, sz:18, sp:0.1, rw:20, em:'🦖', lvl:1, zone:'cave'},
    arthropleura: {name:'Arthropleura', rarity:'Rare', col:'#4a2a1a', acc:'#2a1a0a', hp:160, atk:45, spd:2.5, sz:22, sp:0.08, rw:35, em:'🐛', lvl:1, zone:'cave'},
    spider_boss: {name:'Cave Spider', rarity:'Boss', col:'#111111', acc:'#880000', hp:450, atk:60, spd:3.8, sz:45, sp:0, rw:600, em:'🕷️', lvl:1, zone:'cave'},
    
    cryolophosaurus: {name:'Cryolopho', rarity:'Rare', col:'#88ccff', acc:'#4488cc', hp:180, atk:45, spd:3.8, sz:28, sp:0.08, rw:45, em:'🦖', lvl:1, zone:'mountain'},
    yutyrannus: {name:'Yutyrannus', rarity:'Epic', col:'#eeeeff', acc:'#aabbcc', hp:260, atk:65, spd:3.2, sz:38, sp:0.04, rw:110, em:'🦖', lvl:1, zone:'mountain'},
    miniboss_1: {name:'Ice Guard', rarity:'Boss', col:'#aaddff', acc:'#ffffff', hp:350, atk:55, spd:3.0, sz:40, sp:0, rw:200, em:'🛡️', lvl:1, zone:'mountain'},
    miniboss_2: {name:'Frost Guard', rarity:'Boss', col:'#aaddff', acc:'#ffffff', hp:350, atk:55, spd:3.0, sz:40, sp:0, rw:200, em:'🛡️', lvl:1, zone:'mountain'},
    panda: {name:'Panda', rarity:'Boss', col:'#ffffff', acc:'#111111', hp:850, atk:110, spd:4.5, sz:60, sp:0, rw:2000, em:'🐼', lvl:1, zone:'mountain'}
});

// ── 3. SETUP NPCS & LORE ──
const NPCS = [
    {
        id: 'notnoob',
        room: 'cave',
        x: (WS/2 - 12) * TS, // Moved to bottom left corner
        y: (WS/2 + 12) * TS, 
        name: 'notnoob',
        oc: {body:'#ffcc00', head:'#ffcc00', legs:'#ccaa00', neck:'#ffcc00', tail:'#ffcc00'},
        hat: 'rabbit_bucket',
        dialogue: [
            {speaker: 'notnoob', text: "W-who is there?! Stay back! I-I don't have anything left..."},
            {speaker: 'You', text: "Easy! I'm just exploring. What happened to you?"},
            {speaker: 'notnoob', text: "Oh... you aren't one of his minions. Y-you're just trying to survive too, huh?"},
            {speaker: 'notnoob', text: "I used to be one of them. W-we hunted anyone who disobeyed the Big Boss... It was horrible."},
            {speaker: 'notnoob', text: "I tried to quit. I t-told him I was done. But nobody just quits. He sent some crazy Dino’s after me."},
            {speaker: 'notnoob', text: "I hid in this cave, but the s-spiders... the evil ones... they found me. I barely escaped."},
            {speaker: 'notnoob', text: "B-be careful. If you're going deeper, the eight-legged monster is waiting... It holds the key to the peaks."}
        ]
    },
    {
        id: 'yeahitsm3',
        room: 'main',
        x: 0, y: 0, // Dynamically placed safely on the sand later
        name: 'yeahitsm3',
        oc: {body:'#44aaee', head:'#ffeebb', legs:'#111111', neck:'#ffeebb', tail:'#44aaee'},
        hat: 'bucket', 
        dialogue: [
            {speaker: 'yeahitsm3', text: "Yo. Watch where you step, dude. You're kicking sand on my blanket."},
            {speaker: 'You', text: "What are ya doing here?"},
            {speaker: 'yeahitsm3', text: "Just chilling in the sand, ya could join me."},
            {speaker: 'You', text: "Sorry man, I can't stay. I have a mission to complete."},
            {speaker: 'yeahitsm3', text: "Aw sad to hear. Well have a great time!"}
        ]
    }
];


// ── 4. OVERRIDE WORLD GENERATION ──
const origGenerateWorld = generateWorld;

generateWorld = function() {
    if (G.room === 'main') {
        origGenerateWorld(); 
        
        const mid = Math.floor(WS/2);
        
        // 1. Force Mountain (Top-Left)
        const mx = mid - 25;
        const my = mid - 25;
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                worldMap[my+dy][mx+dx] = 0; 
                tileClr[my+dy][mx+dx] = '#4a7c3f';
            }
        }
        worldMap[my][mx] = 6; 
        G.mountX = mx * TS;
        G.mountY = my * TS;
        
        // 2. Force Cave (Bottom-Right)
        const cx = mid + 25;
        const cy = mid + 25;
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                worldMap[cy+dy][cx+dx] = 0; 
                tileClr[cy+dy][cx+dx] = '#4a7c3f';
            }
        }
        worldMap[cy][cx] = 5; 
        G.caveX = cx * TS;
        G.caveY = cy * TS;
        
        // 3. Force yeahitsm3 onto Sand
        const nx = mid + 35;
        const ny = mid;
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                worldMap[ny+dy][nx+dx] = 3; 
                tileClr[ny+dy][nx+dx] = '#c8a85a';
            }
        }
        NPCS[1].x = nx * TS;
        NPCS[1].y = ny * TS;

    } else if (G.room === 'cave') {
        buildCaveMap();
    } else if (G.room === 'mountain') {
        buildMountainMap();
    }
};

function buildCaveMap() {
    for (let y = 0; y < WS; y++) {
        worldMap[y] = []; 
        tileClr[y] = [];
        for (let x = 0; x < WS; x++) {
            const cx = x - WS/2; 
            const cy = y - WS/2; 
            const dist = Math.sqrt(cx*cx + cy*cy) / (WS*0.46);
            
            if (dist > 0.4) {
                worldMap[y][x] = 10; // Rock Wall
                tileClr[y][x] = '#3a3a3a'; 
            } else {
                worldMap[y][x] = 8; // Cave Floor
                tileClr[y][x] = '#1a1a1a'; 
            }
            
            // WIDE WATERFALL! (3 blocks thick)
            if (y >= Math.floor(WS/2)-1 && y <= Math.floor(WS/2)+1 && dist <= 0.4) {
                if (G.story.cavePuzzleSolved) {
                    worldMap[y][x] = 13; // Bridge
                    tileClr[y][x] = '#5c4033'; 
                } else {
                    worldMap[y][x] = 17; // Waterfall Tile
                    tileClr[y][x] = '#1a6b8a'; 
                }
            }
        }
    }
    
    // Terminal
    worldMap[Math.floor(WS/2) - 3][Math.floor(WS/2)] = 16; 
    tileClr[Math.floor(WS/2) - 3][Math.floor(WS/2)] = '#aaaaaa';
    
    // Exit
    worldMap[Math.floor(WS/2) + 15][Math.floor(WS/2)] = 12; 
    tileClr[Math.floor(WS/2) + 15][Math.floor(WS/2)] = '#000000';
}

function buildMountainMap() {
    for (let y = 0; y < WS; y++) {
        worldMap[y] = []; 
        tileClr[y] = [];
        for (let x = 0; x < WS; x++) {
            const cx = x - WS/2; 
            const cy = y - WS/2; 
            const dist = Math.sqrt(cx*cx + cy*cy) / (WS*0.46);
            
            if (dist > 0.4) {
                worldMap[y][x] = 15; 
                tileClr[y][x] = '#88aadd'; 
            } else {
                worldMap[y][x] = 9; 
                tileClr[y][x] = '#ffffff'; 
            }
        }
    }
    worldMap[Math.floor(WS/2) + 15][Math.floor(WS/2)] = 12; 
    tileClr[Math.floor(WS/2) + 15][Math.floor(WS/2)] = '#000000';
}


// ── 5. OVERRIDE SPAWNS & KEY DROP ──
const origSpawnWilds = spawnWilds;

spawnWilds = function() {
    G.wilds = [];
    
    if (G.room === 'main') {
        const keys = Object.keys(DINOS).filter(k => DINOS[k].lvl === G.level && DINOS[k].rarity !== 'Boss' && DINOS[k].zone === 'main');
        for (let i = 0; i < 36; i++) {
            let chosen = keys[Math.floor(Math.random() * keys.length)];
            for (let attempt = 0; attempt < 20; attempt++) {
                const tx = Math.floor(Math.random() * WS);
                const ty = Math.floor(Math.random() * WS);
                if (worldMap[ty] && worldMap[ty][tx] !== 2 && worldMap[ty][tx] !== 5 && worldMap[ty][tx] !== 6) {
                    G.wilds.push({key: chosen, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: Math.random()*90, dx: 0, dy: 0, face: 1, isBoss: false});
                    break;
                }
            }
        }
    } else if (G.room === 'cave') {
        for (let i = 0; i < 25; i++) { // Increased spawn count!
            const tx = Math.floor(Math.random() * WS); 
            const ty = Math.floor(Math.random() * WS);
            if (worldMap[ty] && worldMap[ty][tx] === 8) { 
                const key = Math.random() > 0.5 ? 'troodon' : 'arthropleura';
                G.wilds.push({key: key, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: 60, dx: 0, dy: 0, face: 1, isBoss: false});
            }
        }
        if (!G.story.mountainKey) { // Spider stays in his arena at the top
            G.wilds.push({key: 'spider_boss', x: WS/2 * TS, y: (WS/2 - 15) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        }
    } else if (G.room === 'mountain') {
        for (let i = 0; i < 20; i++) {
            const tx = Math.floor(Math.random() * WS); 
            const ty = Math.floor(Math.random() * WS);
            if (worldMap[ty] && worldMap[ty][tx] === 9) { 
                const key = Math.random() > 0.5 ? 'cryolophosaurus' : 'yutyrannus';
                G.wilds.push({key: key, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: 60, dx: 0, dy: 0, face: 1, isBoss: false});
            }
        }
        if (!G.story.miniBoss1) G.wilds.push({key: 'miniboss_1', x: (WS/2 - 5) * TS, y: (WS/2 - 5) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        if (!G.story.miniBoss2) G.wilds.push({key: 'miniboss_2', x: (WS/2 + 5) * TS, y: (WS/2 - 5) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        if (G.story.miniBoss1 && G.story.miniBoss2 && !G.story.mainBossDefeated) {
            G.wilds.push({key: 'panda', x: WS/2 * TS, y: (WS/2 - 15) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        }
    }
};

// Override Exit Battle to drop the key!
const origExitBattle = exitBattle;
exitBattle = function() {
    if (G.state === 'battle' && G.battle.ehp <= 0) {
        if (G.battle.ek === 'spider_boss') {
            G.story.mountainKey = true;
            addChatMessage('System', 'You obtained the MOUNTAIN KEY! The Mountain Entrance is now unlocked.');
        }
    }
    origExitBattle();
};


// ── 6. OVERRIDE MOVEMENT & FADES ──
function triggerFade(roomName, targetX, targetY) {
    G.fade.active = true; G.fade.opacity = 0; G.fade.phase = 'out';
    G.fade.targetRoom = roomName; G.fade.targetX = targetX; G.fade.targetY = targetY;
}

const origUpdate = update;
update = function() {
    if (G.fade.active) {
        if (G.fade.phase === 'out') {
            G.fade.opacity += 0.05;
            if (G.fade.opacity >= 1) {
                G.fade.opacity = 1;
                try {
                    G.room = G.fade.targetRoom; G.player.x = G.fade.targetX; G.player.y = G.fade.targetY;
                    G.wilds = []; G.hazards = [];
                    generateWorld(); spawnWilds();
                    G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width, G.player.x - canvas.width/2)); 
                    G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.player.y - canvas.height/2));
                } catch(e) { console.error(e); }
                G.fade.phase = 'in';
            }
        } else if (G.fade.phase === 'in') {
            G.fade.opacity -= 0.05;
            if (G.fade.opacity <= 0) { G.fade.opacity = 0; G.fade.active = false; }
        }
    }
    
    origUpdate();
    
    // Respawn Cave Dinos automatically if they drop below 15!
    if (G.room === 'cave' && G.tick % 180 === 0) {
        const caveDinos = G.wilds.filter(w => w.key === 'troodon' || w.key === 'arthropleura');
        if (caveDinos.length < 15) {
            for(let attempt=0; attempt<20; attempt++){
                const tx = Math.floor(Math.random() * WS); const ty = Math.floor(Math.random() * WS);
                if (worldMap[ty] && worldMap[ty][tx] === 8) { 
                    const key = Math.random() > 0.5 ? 'troodon' : 'arthropleura';
                    G.wilds.push({key: key, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: 60, dx: 0, dy: 0, face: 1, isBoss: false});
                    break;
                }
            }
        }
    }
    
    if (G.room === 'mountain') {
        G.mountainTimer--;
        if (G.mountainTimer <= 120 && G.mountainTimer % 10 === 0) G.camShake = 15;
        if (G.mountainTimer <= 0) {
            G.mountainTimer = 90 * 60; 
            addChatMessage('System', 'The mountain rumbles! Watch out for falling spikes!');
            for (let i = 0; i < 30; i++) { G.hazards.push({x: G.player.x + (Math.random()-0.5)*800, y: G.player.y + (Math.random()-0.5)*800, life: 100, maxLife: 100}); }
        }
    }
};

const origUpdateWorld = updateWorld;
updateWorld = function() {
    if (G.fade.active || G.dialogue.active || G.wirePuzzle.active) return; 

    origUpdateWorld();

    const tx = Math.floor(G.player.x / TS);
    const ty = Math.floor(G.player.y / TS);
    
    if (worldMap[ty] && worldMap[ty][tx] === 5 && G.room === 'main') {
        G.overworldX = G.player.x; G.overworldY = G.player.y - TS * 2; 
        triggerFade('cave', WS/2 * TS, (Math.floor(WS/2) + 12) * TS);
    }
    else if (worldMap[ty] && worldMap[ty][tx] === 6 && G.room === 'main') {
        if (!G.story.mountainKey) {
            G.player.y += TS; 
            if (G.tick % 60 === 0) addChatMessage('System', 'Locked! Defeat the Cave Spider to get the key.');
        } else {
            G.overworldX = G.player.x; G.overworldY = G.player.y + TS * 2; 
            triggerFade('mountain', WS/2 * TS, (Math.floor(WS/2) + 12) * TS);
        }
    }
    else if (worldMap[ty] && worldMap[ty][tx] === 12) { 
        triggerFade('main', G.overworldX, G.overworldY);
    }
    
    G.nearNPC = null;
    for (const npc of NPCS) {
        if (npc.room === G.room) {
            if (Math.hypot(G.player.x - npc.x, G.player.y - npc.y) < 100) G.nearNPC = npc;
        }
    }
    if (worldMap[ty] && worldMap[ty][tx] === 16) { G.nearNPC = 'terminal'; }
};


// ── 7. OVERRIDE RENDER ──
const origDrawDino = drawDino;
drawDino = function(key, cx, cy, face, af, sc, alpha, oc) {
    if (key === 'spider_boss') {
        const s = (sc || 1);
        const bob = Math.sin(af * 0.18) * 2.5;
        
        ctx.save();
        ctx.globalAlpha = alpha != null ? alpha : 1;
        ctx.translate(cx, cy);
        
        ctx.fillStyle = '#111'; // Spider Body
        ctx.beginPath(); ctx.arc(0, bob, 25*s, 0, Math.PI*2); ctx.fill(); 
        ctx.beginPath(); ctx.arc(0, 20*s+bob, 15*s, 0, Math.PI*2); ctx.fill(); 
        
        ctx.fillStyle = '#ff0000'; // 8 Red Eyes
        for(let i=0; i<4; i++) { 
            ctx.fillRect(-12*s + i*6*s, -10*s+bob, 4*s, 4*s); 
            ctx.fillRect(-12*s + i*6*s, -4*s+bob, 4*s, 4*s); 
        }
        
        ctx.strokeStyle = '#111'; ctx.lineWidth = 4*s; // 8 Legs
        for(let i=-1; i<=1; i+=2) {
            for(let j=0; j<4; j++) {
                ctx.beginPath(); 
                ctx.moveTo(i*20*s, bob); 
                ctx.lineTo(i*40*s, -10*s + j*10*s + bob); 
                ctx.lineTo(i*50*s, 10*s + j*10*s + bob); 
                ctx.stroke();
            }
        }
        ctx.restore();
        return; // Don't draw normal dino body!
    }
    origDrawDino(key, cx, cy, face, af, sc, alpha, oc);
};

const origDrawWorld = drawWorld;
drawWorld = function() {
    origDrawWorld(); 
    
    const sx0 = Math.floor(G.cam.x / TS) - 1; const sy0 = Math.floor(G.cam.y / TS) - 1;
    const sx1 = sx0 + Math.ceil(canvas.width / TS) + 2; const sy1 = sy0 + Math.ceil(canvas.height / TS) + 2;
    
    for (let ty = Math.max(0, sy0); ty < Math.min(WS, sy1); ty++) {
        for (let tx = Math.max(0, sx0); tx < Math.min(WS, sx1); tx++) {
            const px = tx * TS - G.cam.x; const py = ty * TS - G.cam.y;
            const t = worldMap[ty][tx];
            
            if (t >= 5) {
                ctx.fillStyle = tileClr[ty][tx] || '#000';
                ctx.fillRect(px, py, TS + 1, TS + 1);
                
                // Add Pebble Textures to Cave Floor
                if (t === 8 && (tx * 17 + ty * 23) % 7 === 0) {
                    ctx.fillStyle = '#111';
                    ctx.beginPath(); ctx.arc(px + 10, py + 10, 3, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(px + 30, py + 25, 2, 0, Math.PI*2); ctx.fill();
                }
                
                if (t === 5) { 
                    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(px + TS/2, py + TS, TS, Math.PI, 0); ctx.fill();
                    ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.arc(px + TS/2, py + TS, TS*0.8, Math.PI, 0); ctx.fill();
                    ctx.fillStyle = '#888'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.fillText('CAVE', px + TS/2, py - 5);
                } 
                else if (t === 6) { 
                    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(px - TS/2, py + TS); ctx.lineTo(px + TS/2, py - TS); ctx.lineTo(px + TS*1.5, py + TS); ctx.fill();
                    if (!G.story.mountainKey) {
                        ctx.fillStyle = '#222'; ctx.fillRect(px, py, TS, TS); ctx.strokeStyle = '#880000'; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px+TS, py+TS); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(px+TS, py); ctx.lineTo(px, py+TS); ctx.stroke();
                    } else { ctx.fillStyle = '#050505'; ctx.fillRect(px + 5, py + 5, TS - 10, TS - 10); }
                }
                else if (t === 12) { 
                    ctx.fillStyle = '#dddddd'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.fillText('EXIT', px + TS/2, py + TS/2);
                }
                else if (t === 16) { 
                    ctx.fillStyle = '#44aaff'; ctx.fillRect(px + 10, py + 10, TS - 20, TS - 20);
                }
                // Draw 3-Block thick Animated Waterfall!
                else if (t === 17) {
                    ctx.fillStyle = '#1a6b8a'; ctx.fillRect(px, py, TS+1, TS+1);
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    const dropY = (G.tick * 2 + tx * 15) % TS;
                    ctx.fillRect(px + 10, py + dropY, 4, 15);
                    ctx.fillRect(px + 30, py + (dropY + 20) % TS, 3, 10);
                }
            }
        }
    }
};

const origDrawHat = drawHat;
drawHat = function(type, cx, cy, sc) {
    const s = sc || 1;
    if (type === 'rabbit_bucket') {
        origDrawHat('bucket', cx, cy, sc); 
        ctx.save(); ctx.translate(cx, cy);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(-6*s, -28*s, 3*s, 10*s, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6*s, -28*s, 3*s, 10*s, 0.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#00aaff';
        ctx.beginPath(); ctx.ellipse(-6*s, -28*s, 1.5*s, 7*s, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6*s, -28*s, 1.5*s, 7*s, 0.2, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    } else {
        origDrawHat(type, cx, cy, sc);
    }
};

const origRender = render;
render = function() {
    origRender();
    
    if (G.state === 'world') {
        const W = canvas.width; const H = canvas.height;
        ctx.save(); ctx.translate(-G.cam.x, -G.cam.y);
        
        for (const npc of NPCS) {
            if (npc.room === G.room) {
                if (npc.id === 'yeahitsm3') {
                    ctx.fillStyle = '#cc4444'; ctx.fillRect(npc.x - 30, npc.y - 10, 60, 40);
                    ctx.fillStyle = '#ffffff'; ctx.fillRect(npc.x - 15, npc.y - 10, 10, 40); ctx.fillRect(npc.x + 5, npc.y - 10, 10, 40);
                    ctx.fillStyle = '#aa8855'; ctx.fillRect(npc.x + 20, npc.y - 60, 4, 60);
                    ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(npc.x + 20, npc.y - 60, 40, Math.PI, 0); ctx.fill();
                }
                
                // Make notnoob visibly hurt (laying down!)
                if (npc.id === 'notnoob') {
                    ctx.save();
                    ctx.translate(npc.x, npc.y);
                    ctx.rotate(Math.PI / 2); // Rotate 90 degrees to lie on the floor
                    drawDino('raptor', 0, 0, -1, 0, 1.25, 1, npc.oc);
                    drawHat(npc.hat, 0, -25, 1.1);
                    // Draw medical cross
                    ctx.fillStyle = 'white'; ctx.fillRect(-10, -20, 20, 20);
                    ctx.fillStyle = 'red'; ctx.fillRect(-2, -18, 4, 16); ctx.fillRect(-8, -12, 16, 4);
                    ctx.restore();
                } else {
                    drawDino('raptor', npc.x, npc.y, -1, G.tick, 1.25, 1, npc.oc);
                    drawHat(npc.hat, npc.x, npc.y - 25, 1.1);
                }
                
                ctx.fillStyle = '#aaddff'; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center';
                ctx.fillText(npc.name, npc.x, npc.y - 45);
            }
        }
        ctx.restore();
        
        if (G.nearNPC && !G.dialogue.active && !G.wirePuzzle.active) {
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Courier New'; ctx.textAlign = 'center';
            ctx.fillText('Press [E] or Click to Interact', W/2, H/2 + 100); 
        }
        
        if (G.dialogue.active) {
            rr(W/2 - 250, H/2 + 50, 500, 100, 8, 'rgba(0,0,0,0.85)', '#44aa44', 2);
            ctx.fillStyle = '#44ff44'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'left';
            ctx.fillText(G.dialogue.speaker + ":", W/2 - 230, H/2 + 80);
            ctx.fillStyle = '#ffffff'; ctx.font = '14px Courier New';
            let txt = G.dialogue.text;
            if(txt.length > 55) {
                ctx.fillText(txt.substring(0, 55), W/2 - 230, H/2 + 110);
                ctx.fillText(txt.substring(55), W/2 - 230, H/2 + 130);
            } else { ctx.fillText(txt, W/2 - 230, H/2 + 110); }
            ctx.fillStyle = '#aaaaaa'; ctx.font = '10px Courier New'; ctx.textAlign = 'right';
            ctx.fillText('Click to continue ▼', W/2 + 230, H/2 + 140);
        }
        
        // DRAW THE WIRE PUZZLE
        if (G.wirePuzzle.active) {
            const bx = W/2 - 200; const by = H/2 - 150;
            rr(bx, by, 400, 300, 8, 'rgba(20,20,50,0.95)', '#4488ff', 2);
            ctx.fillStyle = '#44aaff'; ctx.font = 'bold 18px Courier New'; ctx.textAlign = 'center';
            ctx.fillText('POWER TERMINAL: CONNECT WIRES', W/2, by + 30);
            
            G.wirePuzzle.nodes.forEach(n => {
                // Left Node
                ctx.fillStyle = n.col; ctx.beginPath(); ctx.arc(bx + 50, by + n.ly, 15, 0, Math.PI*2); ctx.fill();
                // Right Node
                ctx.fillStyle = n.col; ctx.beginPath(); ctx.arc(bx + 350, by + n.ry, 15, 0, Math.PI*2); ctx.fill();
                // Draw Connection Line
                if (n.connected) {
                    ctx.strokeStyle = n.col; ctx.lineWidth = 6;
                    ctx.beginPath(); ctx.moveTo(bx + 50, by + n.ly); ctx.lineTo(bx + 350, by + n.ry); ctx.stroke();
                }
            });
            
            // Draw current dragging line
            if (G.wirePuzzle.selected !== null) {
                const sn = G.wirePuzzle.nodes.find(n => n.id === G.wirePuzzle.selected);
                ctx.strokeStyle = sn.col; ctx.lineWidth = 6;
                ctx.beginPath(); ctx.moveTo(bx + 50, by + sn.ly); ctx.lineTo(G.mx, G.my); ctx.stroke();
            }
            
            btn(W/2 - 60, by + 250, 120, 30, 'Leave', '#aa4444', '#fff', () => {
                G.wirePuzzle.active = false; G.player.y += TS; 
            });
        }
        
        if (G.fade.active) {
            ctx.fillStyle = `rgba(0,0,0,${G.fade.opacity})`; ctx.fillRect(0, 0, W, H);
        }
    }
};

const origDrawHUD = drawHUD;
drawHUD = function() {
    origDrawHUD(); 
    
    const W = canvas.width, H = canvas.height;
    const mm = 90, mmx = W - mm - 8, mmy = H - mm - 65;
    const msc = mm / WS;
    
    // REDRAW THE MINIMAP TO FORCE BIGGER VISIBLE SQUARES
    for(let ty2=0; ty2<WS; ty2+=2){
        for(let tx2=0; tx2<WS; tx2+=2){
            const tt = worldMap[ty2][tx2];
            if (tt >= 5) {
                let mmCol = '#000';
                if (tt === 10 || tt === 14) mmCol = '#666'; 
                if (tt === 11 || tt === 15) mmCol = '#333'; 
                if (tt === 8 || tt === 7) mmCol = '#222'; 
                if (tt === 9) mmCol = '#fff'; 
                if (tt === 13) mmCol = '#8b4513'; 
                if (tt === 17) mmCol = '#1a6b8a'; 
                
                ctx.fillStyle = mmCol;
                ctx.fillRect(mmx+tx2*msc, mmy+ty2*msc, msc*2+0.5, msc*2+0.5);
            }
        }
    }
    
    // Draw 4x4 Highly Visible Squares for Entrances
    for(let ty2=0; ty2<WS; ty2++){
        for(let tx2=0; tx2<WS; tx2++){
            if (worldMap[ty2][tx2] === 5) {
                ctx.fillStyle = '#000000'; ctx.fillRect(mmx + tx2*msc - 2, mmy + ty2*msc - 2, 4, 4);
            } else if (worldMap[ty2][tx2] === 6) {
                ctx.fillStyle = '#ffffff'; ctx.fillRect(mmx + tx2*msc - 2, mmy + ty2*msc - 2, 4, 4);
            }
        }
    }
    
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(mmx+G.player.x/TS*msc, mmy+G.player.y/TS*msc, 3, 0, Math.PI*2); ctx.fill();
};

// ── 8. KEYBINDS & PUZZLE INTERACTION ──
window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'e') triggerInteraction();
});

// Click logic handles both Dialogue and the Wire Puzzle!
canvas.addEventListener('mousedown', e => {
    if (G.dialogue.active || G.nearNPC) {
        triggerInteraction();
        return;
    }
    
    if (G.wirePuzzle.active) {
        const W = canvas.width; const H = canvas.height;
        const bx = W/2 - 200; const by = H/2 - 150;
        
        // Check if clicking a left node
        for (let n of G.wirePuzzle.nodes) {
            if (Math.hypot(G.mx - (bx + 50), G.my - (by + n.ly)) < 25) {
                G.wirePuzzle.selected = n.id; return;
            }
        }
    }
});

canvas.addEventListener('mouseup', e => {
    if (G.wirePuzzle.active && G.wirePuzzle.selected !== null) {
        const W = canvas.width; const H = canvas.height;
        const bx = W/2 - 200; const by = H/2 - 150;
        
        for (let n of G.wirePuzzle.nodes) {
            if (Math.hypot(G.mx - (bx + 350), G.my - (by + n.ry)) < 25) {
                if (n.id === G.wirePuzzle.selected) {
                    n.connected = true; // Matched!
                    
                    // Check if puzzle is solved
                    if (G.wirePuzzle.nodes.every(x => x.connected)) {
                        G.story.cavePuzzleSolved = true;
                        G.wirePuzzle.active = false;
                        addChatMessage('System', 'Power Restored! The Waterfall Bridge extended.');
                        generateWorld(); // Redraw map to show bridge
                    }
                }
            }
        }
        G.wirePuzzle.selected = null; // drop wire
    }
});

canvas.addEventListener('touchstart', e => {
    if (G.dialogue.active || G.nearNPC) {
        triggerInteraction();
        return;
    }
});

function triggerInteraction() {
    if (G.dialogue.active) {
        G.dialogue.step++;
        if (G.dialogue.step >= G.dialogue.queue.length) {
            G.dialogue.active = false; 
        } else {
            G.dialogue.speaker = G.dialogue.queue[G.dialogue.step].speaker;
            G.dialogue.text = G.dialogue.queue[G.dialogue.step].text;
        }
        return;
    }
    
    if (G.nearNPC === 'terminal') {
        if (!G.story.cavePuzzleSolved) G.wirePuzzle.active = true;
        else addChatMessage('System', 'Terminal is already active.');
    } 
    else if (G.nearNPC) {
        G.dialogue.active = true;
        G.dialogue.queue = G.nearNPC.dialogue;
        G.dialogue.step = 0;
        G.dialogue.speaker = G.dialogue.queue[0].speaker;
        G.dialogue.text = G.dialogue.queue[0].text;
    }
}

// ── FORCE LOAD THE MAP ON SCRIPT START ──
if (G.state === 'world') {
    generateWorld();
    spawnWilds();
    if(G.level === 1) spawnMega();
}
