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
G.puzzleUI = { active: false };
G.mountainTimer = 90 * 60; 

// ── 2. INJECT NEW DINOS INTO THE INDEX ──
for (let key in DINOS) {
    if (DINOS[key].lvl === 1) {
        DINOS[key].zone = 'main';
    }
}
if (DINOS.megalodon) {
    DINOS.megalodon.lvl = 3; 
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
        x: WS/2 * TS - 150, 
        y: WS/2 * TS + 150, 
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
        x: 0, y: 0, 
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
        origGenerateWorld(); // Draw the normal Isla Uno
        
        const mid = Math.floor(WS/2);
        
        // 1. Force the Mountain onto Top-Left
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
        
        // 2. Force the Cave onto Bottom-Right
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
        
        // 3. Force yeahitsm3 onto Sand at the Middle-Right
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
                worldMap[y][x] = 10; 
                tileClr[y][x] = '#3a3a3a'; 
            } else {
                worldMap[y][x] = 8; 
                tileClr[y][x] = '#1a1a1a'; 
            }
            
            if (y === Math.floor(WS/2) && dist <= 0.4) {
                if (G.story.cavePuzzleSolved) {
                    worldMap[y][x] = 13; 
                    tileClr[y][x] = '#5c4033'; 
                } else {
                    worldMap[y][x] = 2; 
                    tileClr[y][x] = '#1a6b8a'; 
                }
            }
        }
    }
    
    worldMap[Math.floor(WS/2) + 15][Math.floor(WS/2)] = 12; 
    tileClr[Math.floor(WS/2) + 15][Math.floor(WS/2)] = '#000000';
    worldMap[Math.floor(WS/2) + 2][Math.floor(WS/2)] = 16; 
    tileClr[Math.floor(WS/2) + 2][Math.floor(WS/2)] = '#aaaaaa';
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


// ── 5. OVERRIDE SPAWNS ──
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
        for (let i = 0; i < 15; i++) {
            const tx = Math.floor(Math.random() * WS); 
            const ty = Math.floor(Math.random() * WS);
            if (worldMap[ty] && worldMap[ty][tx] === 8) { 
                const key = Math.random() > 0.5 ? 'troodon' : 'arthropleura';
                G.wilds.push({key: key, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: 60, dx: 0, dy: 0, face: 1, isBoss: false});
            }
        }
        if (!G.story.mountainKey) {
            G.wilds.push({key: 'spider_boss', x: WS/2 * TS, y: (WS/2 - 15) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        }
    } else if (G.room === 'mountain') {
        for (let i = 0; i < 15; i++) {
            const tx = Math.floor(Math.random() * WS); 
            const ty = Math.floor(Math.random() * WS);
            if (worldMap[ty] && worldMap[ty][tx] === 9) { 
                const key = Math.random() > 0.5 ? 'cryolophosaurus' : 'yutyrannus';
                G.wilds.push({key: key, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: 60, dx: 0, dy: 0, face: 1, isBoss: false});
            }
        }
        if (!G.story.miniBoss1) {
            G.wilds.push({key: 'miniboss_1', x: (WS/2 - 5) * TS, y: (WS/2 - 5) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        }
        if (!G.story.miniBoss2) {
            G.wilds.push({key: 'miniboss_2', x: (WS/2 + 5) * TS, y: (WS/2 - 5) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        }
        if (G.story.miniBoss1 && G.story.miniBoss2 && !G.story.mainBossDefeated) {
            G.wilds.push({key: 'panda', x: WS/2 * TS, y: (WS/2 - 15) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        }
    }
};


// ── 6. OVERRIDE MOVEMENT & FADES ──
function triggerFade(roomName, targetX, targetY) {
    G.fade.active = true;
    G.fade.opacity = 0;
    G.fade.phase = 'out';
    G.fade.targetRoom = roomName;
    G.fade.targetX = targetX;
    G.fade.targetY = targetY;
}

const origUpdate = update;
update = function() {
    if (G.fade.active) {
        if (G.fade.phase === 'out') {
            G.fade.opacity += 0.05;
            if (G.fade.opacity >= 1) {
                G.fade.opacity = 1;
                
                try {
                    G.room = G.fade.targetRoom;
                    G.player.x = G.fade.targetX;
                    G.player.y = G.fade.targetY;
                    G.wilds = []; 
                    G.hazards = [];
                    
                    generateWorld(); 
                    spawnWilds();
                    
                    G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width, G.player.x - canvas.width/2)); 
                    G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.player.y - canvas.height/2));
                } catch(e) {
                    console.error(e);
                }
                
                G.fade.phase = 'in';
            }
        } else if (G.fade.phase === 'in') {
            G.fade.opacity -= 0.05;
            if (G.fade.opacity <= 0) {
                G.fade.opacity = 0;
                G.fade.active = false;
            }
        }
    }
    
    origUpdate();
    
    if (G.room === 'mountain') {
        G.mountainTimer--;
        if (G.mountainTimer <= 120 && G.mountainTimer % 10 === 0) {
            G.camShake = 15;
        }
        if (G.mountainTimer <= 0) {
            G.mountainTimer = 90 * 60; 
            addChatMessage('System', 'The mountain rumbles! Watch out for falling spikes!');
            for (let i = 0; i < 30; i++) {
                G.hazards.push({x: G.player.x + (Math.random()-0.5)*800, y: G.player.y + (Math.random()-0.5)*800, life: 100, maxLife: 100});
            }
        }
    }
};

const origUpdateWorld = updateWorld;
updateWorld = function() {
    if (G.fade.active || G.dialogue.active || G.puzzleUI.active) return; 

    origUpdateWorld();

    const tx = Math.floor(G.player.x / TS);
    const ty = Math.floor(G.player.y / TS);
    
    if (worldMap[ty] && worldMap[ty][tx] === 5 && G.room === 'main') {
        G.overworldX = G.player.x; 
        G.overworldY = G.player.y - TS * 2; 
        triggerFade('cave', WS/2 * TS, (Math.floor(WS/2) + 12) * TS);
    }
    else if (worldMap[ty] && worldMap[ty][tx] === 6 && G.room === 'main') {
        if (!G.story.mountainKey) {
            G.player.y += TS; 
            if (G.tick % 60 === 0) addChatMessage('System', 'Locked! Defeat the Cave Spider to get the key.');
        } else {
            G.overworldX = G.player.x; 
            G.overworldY = G.player.y + TS * 2; 
            triggerFade('mountain', WS/2 * TS, (Math.floor(WS/2) + 12) * TS);
        }
    }
    else if (worldMap[ty] && worldMap[ty][tx] === 12) { 
        triggerFade('main', G.overworldX, G.overworldY);
    }
    
    G.nearNPC = null;
    for (const npc of NPCS) {
        if (npc.room === G.room) {
            if (Math.hypot(G.player.x - npc.x, G.player.y - npc.y) < 100) {
                G.nearNPC = npc;
            }
        }
    }
    
    if (worldMap[ty] && worldMap[ty][tx] === 16) {
        G.nearNPC = 'terminal';
    }
};


// ── 7. OVERRIDE RENDER ──
const origDrawWorld = drawWorld;

drawWorld = function() {
    origDrawWorld(); 
    
    const sx0 = Math.floor(G.cam.x / TS) - 1;
    const sy0 = Math.floor(G.cam.y / TS) - 1;
    const sx1 = sx0 + Math.ceil(canvas.width / TS) + 2;
    const sy1 = sy0 + Math.ceil(canvas.height / TS) + 2;
    
    for (let ty = Math.max(0, sy0); ty < Math.min(WS, sy1); ty++) {
        for (let tx = Math.max(0, sx0); tx < Math.min(WS, sx1); tx++) {
            const px = tx * TS - G.cam.x; 
            const py = ty * TS - G.cam.y;
            const t = worldMap[ty][tx];
            
            if (t >= 5) {
                ctx.fillStyle = tileClr[ty][tx] || '#000';
                ctx.fillRect(px, py, TS + 1, TS + 1);
                
                if (t === 5) { 
                    ctx.fillStyle = '#111';
                    ctx.beginPath(); ctx.arc(px + TS/2, py + TS, TS, Math.PI, 0); ctx.fill();
                    ctx.fillStyle = '#050505';
                    ctx.beginPath(); ctx.arc(px + TS/2, py + TS, TS*0.8, Math.PI, 0); ctx.fill();
                    ctx.fillStyle = '#888'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
                    ctx.fillText('CAVE', px + TS/2, py - 5);
                } 
                else if (t === 6) { 
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.moveTo(px - TS/2, py + TS); ctx.lineTo(px + TS/2, py - TS); ctx.lineTo(px + TS*1.5, py + TS); ctx.fill();
                    
                    if (!G.story.mountainKey) {
                        ctx.fillStyle = '#222'; ctx.fillRect(px, py, TS, TS);
                        ctx.strokeStyle = '#880000'; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px+TS, py+TS); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(px+TS, py); ctx.lineTo(px, py+TS); ctx.stroke();
                    } else {
                        ctx.fillStyle = '#050505'; ctx.fillRect(px + 5, py + 5, TS - 10, TS - 10);
                    }
                }
                else if (t === 12) { 
                    ctx.fillStyle = '#dddddd'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
                    ctx.fillText('EXIT', px + TS/2, py + TS/2);
                }
                else if (t === 16) { 
                    ctx.fillStyle = '#44aaff'; ctx.fillRect(px + 10, py + 10, TS - 20, TS - 20);
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
        const W = canvas.width;
        const H = canvas.height;
        
        ctx.save();
        ctx.translate(-G.cam.x, -G.cam.y);
        
        for (const npc of NPCS) {
            if (npc.room === G.room) {
                if (npc.id === 'yeahitsm3') {
                    ctx.fillStyle = '#cc4444'; ctx.fillRect(npc.x - 30, npc.y - 10, 60, 40);
                    ctx.fillStyle = '#ffffff'; ctx.fillRect(npc.x - 15, npc.y - 10, 10, 40); ctx.fillRect(npc.x + 5, npc.y - 10, 10, 40);
                    ctx.fillStyle = '#aa8855'; ctx.fillRect(npc.x + 20, npc.y - 60, 4, 60);
                    ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(npc.x + 20, npc.y - 60, 40, Math.PI, 0); ctx.fill();
                }
                
                drawDino('raptor', npc.x, npc.y, -1, G.tick, 1.25, 1, npc.oc);
                drawHat(npc.hat, npc.x, npc.y - 25, 1.1);
                ctx.fillStyle = '#aaddff'; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center';
                ctx.fillText(npc.name, npc.x, npc.y - 45);
            }
        }
        ctx.restore();
        
        // MOVED HIGHER TO AVOID JOYSTICK
        if (G.nearNPC && !G.dialogue.active && !G.puzzleUI.active) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Press [E] or Click to Interact', W/2, H - 280); 
        }
        
        if (G.dialogue.active) {
            rr(W/2 - 250, H - 250, 500, 100, 8, 'rgba(0,0,0,0.85)', '#44aa44', 2);
            ctx.fillStyle = '#44ff44';
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'left';
            ctx.fillText(G.dialogue.speaker + ":", W/2 - 230, H - 220);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Courier New';
            
            let txt = G.dialogue.text;
            if(txt.length > 55) {
                ctx.fillText(txt.substring(0, 55), W/2 - 230, H - 190);
                ctx.fillText(txt.substring(55), W/2 - 230, H - 170);
            } else {
                ctx.fillText(txt, W/2 - 230, H - 190);
            }
            
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'right';
            ctx.fillText('Click to continue ▼', W/2 + 230, H - 160);
        }
        
        if (G.puzzleUI.active) {
            rr(W/2 - 150, H/2 - 100, 300, 200, 8, 'rgba(20,20,50,0.95)', '#4488ff', 2);
            ctx.fillStyle = '#44aaff';
            ctx.font = 'bold 18px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('POWER TERMINAL', W/2, H/2 - 70);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Courier New';
            ctx.fillText('Bridge power is offline.', W/2, H/2 - 40);
            
            btn(W/2 - 80, H/2, 160, 40, 'Connect Wires', '#44aa44', '#fff', () => {
                G.story.cavePuzzleSolved = true;
                G.puzzleUI.active = false;
                addChatMessage('System', 'You spliced the wires! The bridge is active.');
                generateWorld(); 
            });
            
            btn(W/2 - 80, H/2 + 50, 160, 30, 'Leave', '#aa4444', '#fff', () => {
                G.puzzleUI.active = false;
                G.player.y += TS; 
            });
        }
        
        if (G.fade.active) {
            ctx.fillStyle = `rgba(0,0,0,${G.fade.opacity})`;
            ctx.fillRect(0, 0, W, H);
        }
    }
};

const origDrawHUD = drawHUD;
drawHUD = function() {
    origDrawHUD(); 
    
    const W = canvas.width, H = canvas.height;
    const mm=90, mmx=W-mm-8, mmy=H-mm-65;
    const msc=mm/WS;
    
    for(let ty2=0; ty2<WS; ty2+=2){
        for(let tx2=0; tx2<WS; tx2+=2){
            const tt = worldMap[ty2][tx2];
            
            // MINIMAP FIX: Draws specific bright squares for Entrances
            if (tt >= 5) {
                let mmCol = '#000';
                if (tt === 10 || tt === 14) mmCol = '#666'; 
                if (tt === 11 || tt === 15) mmCol = '#333'; 
                if (tt === 8 || tt === 7) mmCol = '#222'; 
                if (tt === 9) mmCol = '#fff'; 
                if (tt === 13) mmCol = '#8b4513'; 
                
                // Entrances stand out on the minimap
                if (tt === 5) mmCol = '#000000'; // Cave entrance is black
                if (tt === 6) mmCol = '#ffffff'; // Mountain entrance is white
                
                ctx.fillStyle = mmCol;
                ctx.fillRect(mmx+tx2*msc, mmy+ty2*msc, msc*2+0.5, msc*2+0.5);
            }
        }
    }
    
    ctx.fillStyle='#fff'; 
    ctx.beginPath(); 
    ctx.arc(mmx+G.player.x/TS*msc, mmy+G.player.y/TS*msc, 3, 0, Math.PI*2); 
    ctx.fill();
};

// ── 8. KEYBINDS FOR INTERACTION ──
window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'e') {
        triggerInteraction();
    }
});

canvas.addEventListener('click', e => {
    if (G.dialogue.active || G.nearNPC) {
        triggerInteraction();
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
        G.puzzleUI.active = true;
    } 
    else if (G.nearNPC) {
        G.dialogue.active = true;
        G.dialogue.queue = G.nearNPC.dialogue;
        G.dialogue.step = 0;
        G.dialogue.speaker = G.dialogue.queue[0].speaker;
        G.dialogue.text = G.dialogue.queue[0].text;
    }
}

// ── THE CRITICAL FIX: REGENERATE MAP ON SCRIPT LOAD ──
if (G.state === 'world') {
    generateWorld();
    spawnWilds();
    if(G.level === 1) spawnMega();
}
