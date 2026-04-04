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
// We remove Megalodon from Map 1 by pushing it to Level 3. Panda takes its place!
if (DINOS.megalodon) DINOS.megalodon.lvl = 3; 

Object.assign(DINOS, {
    troodon: {name:'Troodon', rarity:'Common', col:'#3a3a3a', acc:'#111111', hp:110, atk:35, spd:4.8, sz:18, sp:0.1, rw:20, em:'🦖', lvl:1},
    arthropleura: {name:'Arthropleura', rarity:'Rare', col:'#4a2a1a', acc:'#2a1a0a', hp:160, atk:45, spd:2.5, sz:22, sp:0.08, rw:35, em:'🐛', lvl:1},
    spider_boss: {name:'Cave Spider', rarity:'Boss', col:'#111111', acc:'#880000', hp:450, atk:60, spd:3.8, sz:45, sp:0, rw:600, em:'🕷️', lvl:1},
    
    cryolophosaurus: {name:'Cryolopho', rarity:'Rare', col:'#88ccff', acc:'#4488cc', hp:180, atk:45, spd:3.8, sz:28, sp:0.08, rw:45, em:'🦖', lvl:1},
    yutyrannus: {name:'Yutyrannus', rarity:'Epic', col:'#eeeeff', acc:'#aabbcc', hp:260, atk:65, spd:3.2, sz:38, sp:0.04, rw:110, em:'🦖', lvl:1},
    miniboss_1: {name:'Ice Guard', rarity:'Boss', col:'#aaddff', acc:'#ffffff', hp:350, atk:55, spd:3.0, sz:40, sp:0, rw:200, em:'🛡️', lvl:1},
    miniboss_2: {name:'Frost Guard', rarity:'Boss', col:'#aaddff', acc:'#ffffff', hp:350, atk:55, spd:3.0, sz:40, sp:0, rw:200, em:'🛡️', lvl:1},
    panda: {name:'Panda', rarity:'Boss', col:'#ffffff', acc:'#111111', hp:850, atk:110, spd:4.5, sz:60, sp:0, rw:2000, em:'🐼', lvl:1}
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
        x: 0, y: 0, // Dynamically placed on the beach later
        name: 'yeahitsm3',
        oc: {body:'#222222', head:'#ffeebb', legs:'#111111', neck:'#ffeebb', tail:'#222222'},
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
        
        // Find safe grass (t=0) on the bottom right for the Cave
        let placedCave = false;
        for(let y = WS - 15; y > 0 && !placedCave; y--){
            for(let x = WS - 15; x > 0 && !placedCave; x--){
                if(worldMap[y][x] === 0) {
                    carveEntrance(x, y, 5, 10, 11); // 5 = Cave, 10 = Light Rock, 11 = Dark Rock
                    G.caveX = x * TS;
                    G.caveY = y * TS;
                    placedCave = true;
                }
            }
        }
        
        // Find safe grass (t=0) on the top left for the Mountain
        let placedMount = false;
        for(let y = 15; y < WS && !placedMount; y++){
            for(let x = 15; x < WS && !placedMount; x++){
                if(worldMap[y][x] === 0) {
                    carveEntrance(x, y, 6, 14, 15); // 6 = Mountain, 14 = Light Snow, 15 = Dark Ice
                    G.mountX = x * TS;
                    G.mountY = y * TS;
                    placedMount = true;
                }
            }
        }
        
        // Place yeahitsm3 on the Sand (t=3) on the right side
        let placedNPC = false;
        for(let y = 10; y < WS && !placedNPC; y++){
            for(let x = WS - 5; x > WS/2 && !placedNPC; x--){
                if(worldMap[y][x] === 3) {
                    NPCS[1].x = x * TS;
                    NPCS[1].y = y * TS;
                    placedNPC = true;
                }
            }
        }

    } else if (G.room === 'cave') {
        buildCaveMap();
    } else if (G.room === 'mountain') {
        buildMountainMap();
    }
};

function carveEntrance(cx, cy, doorTile, outerTile, innerTile) {
    // Carve 3 Layers of Art
    for(let dy = -3; dy <= 3; dy++){
        for(let dx = -3; dx <= 3; dx++){
            if(worldMap[cy+dy] && worldMap[cy+dy][cx+dx] !== undefined) {
                worldMap[cy+dy][cx+dx] = outerTile; 
            }
        }
    }
    for(let dy = -1; dy <= 1; dy++){
        for(let dx = -1; dx <= 1; dx++){
            if(worldMap[cy+dy] && worldMap[cy+dy][cx+dx] !== undefined) {
                worldMap[cy+dy][cx+dx] = innerTile; 
            }
        }
    }
    worldMap[cy][cx] = doorTile; 
}

function buildCaveMap() {
    for(let y=0; y<WS; y++){
        worldMap[y] = []; tileClr[y] = [];
        for(let x=0; x<WS; x++){
            const cx = x - WS/2; const cy = y - WS/2; 
            const dist = Math.sqrt(cx*cx + cy*cy) / (WS*0.46);
            
            if (dist > 0.4) {
                worldMap[y][x] = 10; tileClr[y][x] = '#3a3a3a'; // Rock Walls
            } else {
                worldMap[y][x] = 8; tileClr[y][x] = '#1a1a1a'; // Cave Floor
            }
            
            // The Waterfall splitting the cave horizontally
            if (y === Math.floor(WS/2) && dist <= 0.4) {
                if (G.story.cavePuzzleSolved) {
                    worldMap[y][x] = 13; tileClr[y][x] = '#5c4033'; // Bridge
                } else {
                    worldMap[y][x] = 2; tileClr[y][x] = '#1a6b8a'; // Water
                }
            }
        }
    }
    
    // Add Exit Door
    worldMap[Math.floor(WS/2) + 15][Math.floor(WS/2)] = 12; 
    tileClr[Math.floor(WS/2) + 15][Math.floor(WS/2)] = '#000000';
    
    // Add Terminal
    worldMap[Math.floor(WS/2) + 2][Math.floor(WS/2)] = 16; 
    tileClr[Math.floor(WS/2) + 2][Math.floor(WS/2)] = '#aaaaaa';
}

function buildMountainMap() {
    for(let y=0; y<WS; y++){
        worldMap[y] = []; tileClr[y] = [];
        for(let x=0; x<WS; x++){
            const cx = x - WS/2; const cy = y - WS/2; 
            const dist = Math.sqrt(cx*cx + cy*cy) / (WS*0.46);
            
            if (dist > 0.4) {
                worldMap[y][x] = 15; tileClr[y][x] = '#88aadd'; // Ice Walls
            } else {
                worldMap[y][x] = 9; tileClr[y][x] = '#ffffff'; // Snow Floor
            }
        }
    }
    
    // Add Exit Door
    worldMap[Math.floor(WS/2) + 15][Math.floor(WS/2)] = 12; 
    tileClr[Math.floor(WS/2) + 15][Math.floor(WS/2)] = '#000000';
}


// ── 5. OVERRIDE SPAWNS ──
const origSpawnWilds = spawnWilds;
spawnWilds = function() {
    if (G.room === 'main') {
        origSpawnWilds();
    } else if (G.room === 'cave') {
        G.wilds = [];
        for(let i=0; i<15; i++) {
            const tx = Math.floor(Math.random() * WS); const ty = Math.floor(Math.random() * WS);
            if (worldMap[ty] && worldMap[ty][tx] === 8) { // Only on cave floor
                const key = Math.random() > 0.5 ? 'troodon' : 'arthropleura';
                G.wilds.push({key: key, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: 60, dx: 0, dy: 0, face: 1, isBoss: false});
            }
        }
        // Spawn Spider Boss at the top!
        if (!G.story.mountainKey) {
            G.wilds.push({key: 'spider_boss', x: WS/2 * TS, y: (WS/2 - 15) * TS, anim: 0, mt: 9999, dx: 0, dy: 0, face: 1, isBoss: true});
        }
    } else if (G.room === 'mountain') {
        G.wilds = [];
        for(let i=0; i<15; i++) {
            const tx = Math.floor(Math.random() * WS); const ty = Math.floor(Math.random() * WS);
            if (worldMap[ty] && worldMap[ty][tx] === 9) { // Only on snow floor
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
        
        // Spawn Panda if Minibosses are dead
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
                
                // Swap Map!
                G.room = G.fade.targetRoom;
                G.player.x = G.fade.targetX;
                G.player.y = G.fade.targetY;
                G.wilds = []; G.hazards = [];
                generateWorld(); spawnWilds();
                G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width, G.player.x - canvas.width/2)); 
                G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.player.y - canvas.height/2));
                
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
            G.camShake = 15; // Warning rumble
        }
        if (G.mountainTimer <= 0) {
            G.mountainTimer = 90 * 60; // Reset
            addChatMessage('System', 'The mountain rumbles! Watch out for falling spikes!');
            for(let i=0; i<30; i++){
                G.hazards.push({x: G.player.x + (Math.random()-0.5)*800, y: G.player.y + (Math.random()-0.5)*800, life: 100, maxLife: 100});
            }
        }
    }
};

const origUpdateWorld = updateWorld;
updateWorld = function() {
    if (G.fade.active || G.dialogue.active || G.puzzleUI.active) return; // Freeze movement

    origUpdateWorld();

    const tx = Math.floor(G.player.x / TS);
    const ty = Math.floor(G.player.y / TS);
    
    // Check Teleports
    if (worldMap[ty] && worldMap[ty][tx] === 5 && G.room === 'main') {
        G.overworldX = G.player.x; G.overworldY = G.player.y - TS*3;
        triggerFade('cave', WS/2 * TS, (Math.floor(WS/2) + 12) * TS);
    }
    else if (worldMap[ty] && worldMap[ty][tx] === 6 && G.room === 'main') {
        if (!G.story.mountainKey) {
            G.player.y += TS; 
            if (G.tick % 60 === 0) addChatMessage('System', 'Locked! Defeat the Cave Spider to get the key.');
        } else {
            G.overworldX = G.player.x; G.overworldY = G.player.y + TS*3;
            triggerFade('mountain', WS/2 * TS, (Math.floor(WS/2) + 12) * TS);
        }
    }
    else if (worldMap[ty] && worldMap[ty][tx] === 12) { // Exit Tile
        triggerFade('main', G.overworldX, G.overworldY);
    }
    
    // Check Interactions
    G.nearNPC = null;
    
    // Check NPCs
    for (const npc of NPCS) {
        if (npc.room === G.room) {
            if (Math.hypot(G.player.x - npc.x, G.player.y - npc.y) < 100) {
                G.nearNPC = npc;
            }
        }
    }
    
    // Check Terminal
    if (worldMap[ty] && worldMap[ty][tx] === 16) {
        G.nearNPC = 'terminal';
    }
};


// ── 7. OVERRIDE RENDER ──
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
        
        // Draw NPCs
        for (const npc of NPCS) {
            if (npc.room === G.room) {
                drawDino('raptor', npc.x, npc.y, -1, G.tick, 1.25, 1, npc.oc);
                drawHat(npc.hat, npc.x, npc.y - 25, 1.1);
                ctx.fillStyle = '#aaddff'; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center';
                ctx.fillText(npc.name, npc.x, npc.y - 45);
            }
        }
        
        ctx.restore();
        
        // Draw Interaction Prompt
        if (G.nearNPC && !G.dialogue.active && !G.puzzleUI.active) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Press [E] or Click to Interact', W/2, H - 150);
        }
        
        // Draw Dialogue Box
        if (G.dialogue.active) {
            rr(W/2 - 250, H - 120, 500, 100, 8, 'rgba(0,0,0,0.85)', '#44aa44', 2);
            ctx.fillStyle = '#44ff44';
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'left';
            ctx.fillText(G.dialogue.speaker + ":", W/2 - 230, H - 90);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Courier New';
            
            // Text wrapping simple hack
            let txt = G.dialogue.text;
            if(txt.length > 55) {
                ctx.fillText(txt.substring(0, 55), W/2 - 230, H - 60);
                ctx.fillText(txt.substring(55), W/2 - 230, H - 40);
            } else {
                ctx.fillText(txt, W/2 - 230, H - 60);
            }
            
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'right';
            ctx.fillText('Click to continue ▼', W/2 + 230, H - 30);
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
                G.player.y += TS; // Step back
            });
        }
        
        // Draw Fade overlay OVER HUD
        if (G.fade.active) {
            ctx.fillStyle = `rgba(0,0,0,${G.fade.opacity})`;
            ctx.fillRect(0, 0, W, H);
        }
    }
};

// Override HUD Minimap Dynamically
const origDrawHUD = drawHUD;
drawHUD = function() {
    origDrawHUD(); // Let original draw the HUD and basic minimap
    
    // Now we draw OVER the minimap to fix the colors for new tiles
    const W = canvas.width, H = canvas.height;
    const mm=90, mmx=W-mm-8, mmy=H-mm-65;
    const msc=mm/WS;
    
    for(let ty2=0; ty2<WS; ty2+=2){
        for(let tx2=0; tx2<WS; tx2+=2){
            const tt = worldMap[ty2][tx2];
            
            if (tt >= 5) {
                let mmCol = '#000';
                if (tt === 10 || tt === 14) mmCol = '#666'; // Light Rock / Snow
                if (tt === 11 || tt === 15) mmCol = '#333'; // Dark Rock / Ice
                if (tt === 8 || tt === 7) mmCol = '#222'; // Cave
                if (tt === 9) mmCol = '#fff'; // Mountain Snow
                if (tt === 13) mmCol = '#8b4513'; // Bridge
                
                ctx.fillStyle = mmCol;
                ctx.fillRect(mmx+tx2*msc, mmy+ty2*msc, msc*2+0.5, msc*2+0.5);
            }
        }
    }
    
    // Redraw player dot so it isn't buried
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
