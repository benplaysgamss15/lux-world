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
G.dialogue = { active: false, queue: [], step: 0 };
G.puzzleUI = { active: false };
G.mountainTimer = 90 * 60; // 90 seconds at 60fps

// ── 2. INJECT NEW DINOS INTO THE INDEX ──
// Tag all existing Level 1 dinos to only spawn in the main overworld
for (let key in DINOS) {
    if (DINOS[key].lvl === 1) {
        DINOS[key].zone = 'main';
    }
}
// Push Megalodon to Map 2 temporarily so Panda is the Map 1 Boss
if (DINOS.megalodon) {
    DINOS.megalodon.lvl = 3; 
}

Object.assign(DINOS, {
    // Cave Enemies (Zone: cave)
    troodon: {name:'Troodon', rarity:'Common', col:'#3a3a3a', acc:'#111111', hp:110, atk:35, spd:4.8, sz:18, sp:0.1, rw:20, em:'🦖', lvl:1, zone:'cave'},
    arthropleura: {name:'Arthropleura', rarity:'Rare', col:'#4a2a1a', acc:'#2a1a0a', hp:160, atk:45, spd:2.5, sz:22, sp:0.08, rw:35, em:'🐛', lvl:1, zone:'cave'},
    spider_boss: {name:'Cave Spider', rarity:'Boss', col:'#111111', acc:'#880000', hp:450, atk:60, spd:3.8, sz:45, sp:0, rw:600, em:'🕷️', lvl:1, zone:'cave'},
    
    // Mountain Enemies (Zone: mountain)
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
        origGenerateWorld(); // Draw the normal Isla Uno
        
        const mid = Math.floor(WS/2);
        
        // 1. Force the Mountain onto safe Grass at Top-Left
        const mx = mid - 25;
        const my = mid - 25;
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                worldMap[my+dy][mx+dx] = 0; // Force Grass
                tileClr[my+dy][mx+dx] = '#4a7c3f';
            }
        }
        worldMap[my][mx] = 6; // Mountain Entrance
        G.mountX = mx * TS;
        G.mountY = my * TS;
        
        // 2. Force the Cave onto safe Grass at Bottom-Right
        const cx = mid + 25;
        const cy = mid + 25;
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                worldMap[cy+dy][cx+dx] = 0; // Force Grass
                tileClr[cy+dy][cx+dx] = '#4a7c3f';
            }
        }
        worldMap[cy][cx] = 5; // Cave Entrance
        G.caveX = cx * TS;
        G.caveY = cy * TS;
        
        // 3. Force yeahitsm3 onto safe Sand at the Middle-Right
        const nx = mid + 35;
        const ny = mid;
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                worldMap[ny+dy][nx+dx] = 3; // Force Sand
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
                worldMap[y][x] = 10; // Cave Wall
                tileClr[y][x] = '#3a3a3a'; 
            } else {
                worldMap[y][x] = 8; // Cave Floor
                tileClr[y][x] = '#1a1a1a'; 
            }
            
            // The Waterfall splitting the cave
            if (y === Math.floor(WS/2) && dist <= 0.4) {
                if (G.story.cavePuzzleSolved) {
                    worldMap[y][x] = 13; // Bridge
                    tileClr[y][x] = '#5c4033'; 
                } else {
                    worldMap[y][x] = 2; // Water
                    tileClr[y][x] = '#1a6b8a'; 
                }
            }
        }
    }
    
    // Add Exit Door at bottom
    worldMap[Math.floor(WS/2) + 15][Math.floor(WS/2)] = 12; 
    tileClr[Math.floor(WS/2) + 15][Math.floor(WS/2)] = '#000000';
    
    // Add Puzzle Terminal
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
                worldMap[y][x] = 15; // Ice Wall
                tileClr[y][x] = '#88aadd'; 
            } else {
                worldMap[y][x] = 9; // Snow Floor
                tileClr[y][x] = '#ffffff'; 
            }
        }
    }
    // Add Exit Door at bottom
    worldMap[Math.floor(WS/2) + 15][Math.floor(WS/2)] = 12; 
    tileClr[Math.floor(WS/2) + 15][Math.floor(WS/2)] = '#000000';
}


// ── 5. OVERRIDE SPAWNS ──
const origSpawnWilds = spawnWilds;

spawnWilds = function() {
    G.wilds = [];
    
    if (G.room === 'main') {
        // Only spawn Zone: Main dinos
        const keys = Object.keys(DINOS).filter(k => DINOS[k].lvl === G.level && DINOS[k].rarity !== 'Boss' && DINOS[k].zone === 'main');
        for (let i = 0; i < 36; i++) {
            let chosen = keys[Math.floor(Math.random() * keys.length)];
            for (let attempt = 0; attempt < 20; attempt++) {
                const tx = Math.floor(Math.random() * WS);
                const ty = Math.floor(Math.random() * WS);
                // Make sure they don't spawn on the entrance tiles (5 and 6)
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
            if (worldMap[ty] && worldMap[ty][tx] === 8) { // Cave floor only
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
            if (worldMap[ty] && worldMap[ty][tx] === 9) { // Snow floor only
                const key = Math.random() > 0.5 ? 'cryolophosaurus' : 'yutyrannus';
                G.wilds.push({key: key, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: 60, dx: 0, dy: 0, face: 1, isBoss: false});
            }
        }
        // Spawn Mini Bosses
        if (!G.story.miniBoss1) {
            G.wilds.push({key: 'miniboss_1', x: (WS/2 - 5) * TS, y: (WS/2 - 5) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        }
        if (!G.story.miniBoss2) {
            G.wilds.push({key: 'miniboss_2', x: (WS/2 + 5) * TS, y: (WS/2 - 5) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        }
        // Spawn Panda
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
                    // Perform the actual room swap!
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
                
                // Fade back in
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
    
    // Mountain Falling Spike Event
    if (G.room === 'mountain') {
        G.mountainTimer--;
        if (G.mountainTimer <= 120 && G.mountainTimer % 10 === 0) {
            G.camShake = 15;
        }
        if (G.mountainTimer <= 0) {
            G.mountainTimer = 90 * 60; // Reset 90s
            addChatMessage('System', 'The mountain rumbles! Watch out for falling spikes!');
            for (let i = 0; i < 30; i++) {
                G.hazards.push({x: G.player.x + (Math.random()-0.5)*800, y: G.player.y + (Math.random()-0.5)*800, life: 100, maxLife: 100});
            }
        }
    }
};

const origUpdateWorld = updateWorld;

updateWorld = function() {
    // Freeze player if talking, solving puzzle, or fading
    if (G.fade.active || G.dialogue.active || G.puzzleUI.active) return; 

    origUpdateWorld();

    const tx = Math.floor(G.player.x / TS);
    const ty = Math.floor(G.player.y / TS);
    
    // Collision Triggers for Entrances
    if (worldMap[ty] && worldMap[ty][tx] === 5 && G.room === 'main') {
        G.overworldX = G.player.x; 
        G.overworldY = G.player.y - TS * 2; // Bounce them slightly off the door for return
        triggerFade('cave', WS/2 * TS, (Math.floor(WS/2) + 12) * TS);
    }
    else if (worldMap[ty] && worldMap[ty][tx] === 6 && G.room === 'main') {
        if (!G.story.mountainKey) {
            G.player.y += TS; // Bounce back
            if (G.tick % 60 === 0) addChatMessage('System', 'Locked! Defeat the Cave Spider to get the key.');
        } else {
            G.overworldX = G.player.x; 
            G.overworldY = G.player.y + TS * 2; 
            triggerFade('mountain', WS/2 * TS, (Math.floor(WS/2) + 12) * TS);
        }
    }
    else if (worldMap[ty] && worldMap[ty][tx] === 12) { // Exit Tile
        triggerFade('main', G.overworldX, G.overworldY);
    }
    
    // Check NPC Distances
    G.nearNPC = null;
    for (const npc of NPCS) {
        if (npc.room === G.room) {
            if (Math.hypot(G.player.x - npc.x, G.player.y - npc.y) < 100) {
                G.nearNPC = npc;
            }
        }
    }
    
    // Check Puzzle Terminal
    if (worldMap[ty] && worldMap[ty][tx] === 16) {
        G.nearNPC = 'terminal';
    }
};


// ── 7. OVERRIDE RENDER ──
const origDrawWorld = drawWorld;

drawWorld = function() {
    origDrawWorld(); // Let original run
    
    // NOW draw our specific new tiles over the map
    const sx0 = Math.floor(G.cam.x / TS) - 1;
    const sy0 = Math.floor(G.cam.y / TS) - 1;
    const sx1 = sx0 + Math.ceil(canvas.width / TS) + 2;
    const sy1 = sy0 + Math.ceil(canvas.height / TS) + 2;
    
    for (let ty = Math.max(0, sy0); ty < Math.min(WS, sy1); ty++) {
        for (let tx = Math.max(0, sx0); tx < Math.min(WS, sx1); tx++) {
            const px = tx * TS - G.cam.x; 
            const py = ty * TS - G.cam.y;
            const t = worldMap[ty][tx];
            
            // Draw Specific Graphic Overrides
            if (t >= 5) {
                ctx.fillStyle = tileClr[ty][tx] || '#000';
                ctx.fillRect(px, py, TS + 1, TS + 1);
                
                if (t === 5) { // Cave Entrance
                    ctx.fillStyle = '#111';
                    ctx.beginPath(); ctx.arc(px + TS/2, py + TS, TS, Math.PI, 0); ctx.fill();
                    ctx.fillStyle = '#050505';
                    ctx.beginPath(); ctx.arc(px + TS/2, py + TS, TS*0.8, Math.PI, 0); ctx.fill();
                    ctx.fillStyle = '#888'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
                    ctx.fillText('CAVE', px + TS/2, py - 5);
                } 
                else if (t === 6) { // Mountain Entrance
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
                else if (t === 12) { // Exit Door
                    ctx.fillStyle = '#dddddd'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
                    ctx.fillText('EXIT', px + TS/2, py + TS/2);
                }
                else if (t === 16) { // Terminal
                    ctx.fillStyle = '#44aaff'; ctx.fillRect(px + 10, py + 10, TS - 20, TS - 20);
                }
            }
        }
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
        
        // Draw NPCs and Visuals (Blanket, Parasol)
        for (const npc of NPCS) {
            if (npc.room === G.room) {
                
                // Draw yeahitsm3's setup!
                if (npc.id === 'yeahitsm3') {
                    // Blanket
                    ctx.fillStyle = '#cc4444'; ctx.fillRect(npc.x - 30, npc.y - 10, 60, 40);
                    ctx.fillStyle = '#ffffff'; ctx.fillRect(npc.x - 15, npc.y - 10, 10, 40); ctx.fillRect(npc.x + 5, npc.y - 10, 10, 40);
                    // Parasol Pole
                    ctx.fillStyle = '#aa8855'; ctx.fillRect(npc.x + 20, npc.y - 60, 4, 60);
                    // Parasol Top
                    ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(npc.x + 20, npc.y - 60, 40, Math.PI, 0); ctx.fill();
                }
                
                drawDino('raptor', npc.x, npc.y, -1, G.tick, 1.25, 1, npc.oc);
                drawHat(npc.hat, npc.x, npc.y - 25, 1.1);
                ctx.fillStyle = '#aaddff'; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center';
                ctx.fillText(npc.name, npc.x, npc.y - 45);
            }
        }
        
        ctx.restore();
        
        // Draw Interaction Prompt (Moved UP to avoid joystick)
        if (G.nearNPC && !G.dialogue.active && !G.puzzleUI.active) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Press [E] or Click to Interact', W/2, H - 250); 
        }
        
        // Draw Dialogue Box (Moved UP to avoid joystick)
        if (G.dialogue.active) {
            rr(W/2 - 250, H - 220, 500, 100, 8, 'rgba(0,0,0,0.85)', '#44aa44', 2);
            ctx.fillStyle = '#44ff44';
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'left';
            ctx.fillText(G.dialogue.speaker + ":", W/2 - 230, H - 190);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Courier New';
            
            let txt = G.dialogue.text;
            if(txt.length > 55) {
                ctx.fillText(txt.substring(0, 55), W/2 - 230, H - 160);
                ctx.fillText(txt.substring(55), W/2 - 230, H - 140);
            } else {
                ctx.fillText(txt, W/2 - 230, H - 160);
            }
            
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'right';
            ctx.fillText('Click to continue ▼', W/2 + 230, H - 130);
        }
        
        // Draw Puzzle UI
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
                generateWorld(); // Refresh map to show bridge
            });
            
            btn(W/2 - 80, H/2 + 50, 160, 30, 'Leave', '#aa4444', '#fff', () => {
                G.puzzleUI.active = false;
                G.player.y += TS; 
            });
        }
        
        // FADE OVERLAY
        if (G.fade.active) {
            ctx.fillStyle = `rgba(0,0,0,${G.fade.opacity})`;
            ctx.fillRect(0, 0, W, H);
        }
    }
};

// Override HUD Minimap Dynamically
const origDrawHUD = drawHUD;
drawHUD = function() {
    origDrawHUD(); 
    
    const W = canvas.width, H = canvas.height;
    const mm=90, mmx=W-mm-8, mmy=H-mm-65;
    const msc=mm/WS;
    
    for(let ty2=0; ty2<WS; ty2+=2){
        for(let tx2=0; tx2<WS; tx2+=2){
            const tt = worldMap[ty2][tx2];
            
            // Draw custom Minimap colors over the default ones
            if (tt >= 5) {
                let mmCol = '#000';
                if (tt === 10 || tt === 14) mmCol = '#666'; 
                if (tt === 11 || tt === 15) mmCol = '#333'; 
                if (tt === 8 || tt === 7) mmCol = '#222'; 
                if (tt === 9) mmCol = '#fff'; 
                if (tt === 13) mmCol = '#8b4513'; 
                
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
            G.dialogue.active = false; // End conversation
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
