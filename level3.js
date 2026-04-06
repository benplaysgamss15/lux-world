// ==========================================
// 🌊 LEVEL 3: OCEAN DEPTHS & ABYSSAL CAVE
// ==========================================

// ── 1. INJECT NEW OCEAN DINOS & BOSSES ──
Object.assign(DINOS, {
    plesiosaurus: { name: 'Plesiosaurus', rarity: 'Common', col: '#2060a0', acc: '#104080', hp: 160, atk: 35, spd: 4.8, sz: 24, sp: 0.15, rw: 30, em: '🦕', lvl: 3 },
    ichthyosaurus: { name: 'Ichthyosaurus', rarity: 'Common', col: '#40a0c0', acc: '#2080a0', hp: 140, atk: 40, spd: 5.5, sz: 22, sp: 0.12, rw: 35, em: '🐬', lvl: 3 },
    archelon: { name: 'Archelon', rarity: 'Rare', col: '#305030', acc: '#204020', hp: 250, atk: 25, spd: 2.0, sz: 32, sp: 0.08, rw: 60, em: '🐢', lvl: 3 },
    dunkleosteus: { name: 'Dunkleosteus', rarity: 'Rare', col: '#504030', acc: '#302010', hp: 220, atk: 55, spd: 3.5, sz: 36, sp: 0.06, rw: 80, em: '🐟', lvl: 3 },
    kronosaurus: { name: 'Kronosaurus', rarity: 'Epic', col: '#203050', acc: '#102040', hp: 350, atk: 75, spd: 4.2, sz: 42, sp: 0.04, rw: 150, em: '🦈', lvl: 3 },
    leviathan: { name: 'Leviathan', rarity: 'Boss', col: '#102040', acc: '#001030', hp: 800, atk: 100, spd: 5.0, sz: 60, sp: 0, rw: 2000, em: '🦑', lvl: 3 },
    abyssal_serpent: { name: 'Abyssal Serpent', rarity: 'Boss', col: '#104020', acc: '#002010', hp: 850, atk: 110, spd: 4.0, sz: 65, sp: 0, rw: 2500, em: '🐉', lvl: 3 }
});

// ── 2. LEVEL 3 STATE VARIABLES ──
G.inCave = false;
G.caveX = 0; 
G.caveY = 0;
G.puzzles = { wire: false, seq: false, maze: false, bridge: false };
G.bosses = { leviathan: false, abyssal: false };

// ── 3. OVERRIDE WORLD GENERATION ──
const origGenerateWorld = generateWorld;
generateWorld = function() {
    if (G.level === 3) {
        if (G.inCave) generateCaveMap();
        else generateOceanMap();
    } else {
        origGenerateWorld();
    }
};

function generateOceanMap() {
    for (let y = 0; y < WS; y++) {
        worldMap[y] = []; tileClr[y] = [];
        for (let x = 0; x < WS; x++) {
            const cx = x - WS/2, cy = y - WS/2;
            const dist = Math.sqrt(cx*cx + cy*cy) / (WS*0.5);
            const n = Math.sin(x*0.4) * Math.cos(y*0.4) + Math.sin((x+y)*0.2);

            let t = 2; // Deep Water
            if (dist > 0.8) t = 2;
            else if (n > 0.8) t = 1; 
            else if (n > 0.6) t = 0; 

            worldMap[y][x] = t;
            if (t === 0) tileClr[y][x] = SCLR[Math.abs(x*3+y) % SCLR.length];
            else if (t === 1) tileClr[y][x] = GCLR[Math.abs(x+y*2) % GCLR.length];
            else if (t === 2) tileClr[y][x] = WCLR[Math.abs(x*7+y*11) % WCLR.length];
        }
    }
    // Shifted island so Index equipping doesn't instantly teleport you
    for (let y = 65; y <= 75; y++) {
        for (let x = 75; x <= 85; x++) {
            worldMap[y][x] = 0; tileClr[y][x] = SCLR[0];
        }
    }
    // Huge 3x3 Cave Entrance (Visible on minimap)
    for (let y = 69; y <= 71; y++) {
        for (let x = 79; x <= 81; x++) {
            worldMap[y][x] = 5; 
        }
    }
}

function generateCaveMap() {
    for (let y = 0; y < WS; y++) {
        worldMap[y] = []; tileClr[y] = [];
        for (let x = 0; x < WS; x++) {
            worldMap[y][x] = 1; tileClr[y][x] = '#111'; // Wall
        }
    }
    // Much Wider Main Corridor
    for (let y = 48; y < 156; y++) {
        for (let x = 68; x <= 92; x++) { worldMap[y][x] = 0; tileClr[y][x] = '#333'; }
    }
    // Huge Boss Room
    for (let y = 5; y < 40; y++) {
        for (let x = 40; x <= 120; x++) { worldMap[y][x] = 0; tileClr[y][x] = '#223'; }
    }
    // Thick Lava River separating boss (Uncrossable without bridge)
    for (let x = 0; x < WS; x++) {
        for (let y = 38; y <= 48; y++) { if (worldMap[y][x] === 0) worldMap[y][x] = 6; }
    }
    // Drop bridge over lava
    if (G.puzzles.bridge) {
        for (let y = 38; y <= 48; y++) {
            for (let x = 75; x <= 85; x++) worldMap[y][x] = 7; 
        }
    }
    // Bigger Puzzle Rooms
    for (let y = 110; y <= 135; y++) for (let x = 40; x <= 67; x++) { worldMap[y][x] = 0; tileClr[y][x] = '#334'; } // Wire Room
    for (let y = 110; y <= 135; y++) for (let x = 93; x <= 120; x++) { worldMap[y][x] = 0; tileClr[y][x] = '#334'; } // Seq Room
    for (let y = 60; y <= 90; y++) for (let x = 40; x <= 67; x++) { worldMap[y][x] = 0; tileClr[y][x] = '#334'; } // Maze Room

    worldMap[125][55] = 10; // Wire
    worldMap[125][105] = 11; // Seq
    worldMap[75][55] = 12;  // Maze
    worldMap[154][80] = 8;  // Exit cave
}

// ── 4. OVERRIDE SPAWNING ──
const origSpawnWilds = spawnWilds;
spawnWilds = function() {
    if (G.level === 3) {
        G.wilds = [];
        if (G.inCave) return; 
        const keys = Object.keys(DINOS).filter(k => DINOS[k].lvl === 3 && DINOS[k].rarity !== 'Boss');
        const centerXY = WS/2 * TS;
        const mapRadius = (WS/2 - 4) * TS;

        for (let i = 0; i < 35; i++) {
            let chosen = keys[Math.floor(Math.random() * keys.length)];
            let tx = Math.floor(Math.random() * WS), ty = Math.floor(Math.random() * WS);
            let wx = tx*TS+TS/2, wy = ty*TS+TS/2;
            
            // Only spawn inside invisible circular wall
            if (worldMap[ty] && worldMap[ty][tx] === 2 && Math.hypot(wx - centerXY, wy - centerXY) < mapRadius) { 
                G.wilds.push({ key: chosen, x: wx, y: wy, anim: 0, mt: Math.random()*90, dx: 0, dy: 0, face: 1, isBoss: false }); 
            }
        }
    } else {
        origSpawnWilds();
    }
};

const origSpawnMega = spawnMega;
spawnMega = function() {
    if (G.level === 3) {
        if (!G.inCave && !G.bosses.leviathan) {
            const centerXY = WS/2 * TS;
            const mapRadius = (WS/2 - 4) * TS;
            let tx, ty, wx, wy;
            
            // Force Leviathan to spawn INSIDE the circle bounds
            do {
                tx = Math.floor(Math.random() * WS);
                ty = Math.floor(Math.random() * WS);
                wx = tx*TS + TS/2;
                wy = ty*TS + TS/2;
            } while (Math.hypot(wx - centerXY, wy - centerXY) >= mapRadius || (worldMap[ty] && worldMap[ty][tx] !== 2));
            
            G.wilds.push({ key: 'leviathan', x: wx, y: wy, anim: 0, mt: 0, dx: 0, dy: 0, face: 1, isBoss: true });
        } else if (G.inCave && !G.bosses.abyssal) {
            G.wilds.push({ key: 'abyssal_serpent', x: 80*TS, y: 22*TS, anim: 0, mt: 0, dx: 0, dy: 0, face: 1, isBoss: true });
        }
    } else {
        origSpawnMega();
    }
};

// ── 5. SAFELY OVERRIDE MOVEMENT & ENCOUNTERS ──
const origUpdateWorld = updateWorld;
updateWorld = function() {
    if (G.level !== 3) return origUpdateWorld();

    if(G.camShake > 0) G.camShake--;
    const p = G.player; let dx = 0, dy = 0; const spd = pSpd();
    
    if(G.keys['arrowleft'] || G.keys['a']) dx -= spd;
    if(G.keys['arrowright'] || G.keys['d']) dx += spd;
    if(G.keys['arrowup'] || G.keys['w']) dy -= spd;
    if(G.keys['arrowdown'] || G.keys['s']) dy += spd;
    if(G.joy.on) { 
        const jl = Math.hypot(G.joy.dx, G.joy.dy); 
        if(jl > 12) { dx += (G.joy.dx / jl) * spd; dy += (G.joy.dy / jl) * spd; } 
    }
    if(dx && dy) { dx *= 0.707; dy *= 0.707; }
    
    const nx = p.x + dx, ny = p.y + dy; 
    const ttx = Math.floor(nx / TS), tty = Math.floor(ny / TS); 
    
    const canSwim = ['spinosaurus','pterodactyl','megalodon','mosasaurus', 
                     'plesiosaurus', 'ichthyosaurus', 'archelon', 'dunkleosteus', 'kronosaurus', 'leviathan', 'abyssal_serpent'].includes(p.dk);
    
    // INVISIBLE CIRCULAR WALL
    const centerXY = WS/2 * TS;
    const mapRadius = (WS/2 - 4) * TS;
    
    if (Math.hypot(nx - centerXY, ny - centerXY) <= mapRadius) {
        if(ttx >= 0 && tty >= 0 && ttx < WS && tty < WS){ 
            const t = worldMap[tty][ttx];
            let canMoveHere = false;
            
            if (G.inCave) {
                // Inside cave: Block Wall(1) and Lava(6). Bridge(7) and Floor(0) are safe.
                if (t !== 1 && t !== 6) canMoveHere = true;
            } else {
                // Ocean: Normal collision logic + swim
                if (t !== 2 || canSwim) canMoveHere = true;
            }

            if (canMoveHere) { p.x = nx; p.y = ny; }
        }
    }
    
    p.x = Math.max(TS, Math.min((WS-1)*TS, p.x)); 
    p.y = Math.max(TS, Math.min((WS-1)*TS, p.y));
    p.moving = !!(dx || dy); 
    if(p.moving) { p.anim++; p.face = dx > 0 ? 1 : (dx < 0 ? -1 : p.face); }
    
    G.cam.x += (p.x - canvas.width/2 - G.cam.x) * LERP; 
    G.cam.y += (p.y - canvas.height/2 - G.cam.y) * LERP;
    G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width, G.cam.x)); 
    G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.cam.y));

    // ── LEVEL 3 TELEPORTS & TRIGGERS ──
    const curTx = Math.floor(p.x / TS), curTy = Math.floor(p.y / TS);

    if (curTx >= 0 && curTy >= 0 && curTy < WS && curTx < WS) {
        const tile = worldMap[curTy][curTx];

        if (!G.inCave && tile === 5 && p.moving) { 
            G.caveX = p.x; G.caveY = p.y;
            G.inCave = true;
            p.x = 80 * TS + TS/2; p.y = 153 * TS + TS/2; 
            generateWorld(); spawnWilds(); spawnMega();
            G.cam.x = p.x - canvas.width/2; G.cam.y = p.y - canvas.height/2;
            addChatMessage('System', 'You descended into the Abyssal Cave!');
        }
        else if (G.inCave && tile === 8 && p.moving) { 
            G.inCave = false;
            p.x = G.caveX; p.y = G.caveY + TS*2.5; 
            generateWorld(); spawnWilds(); spawnMega();
            G.cam.x = p.x - canvas.width/2; G.cam.y = p.y - canvas.height/2;
            addChatMessage('System', 'Returned to the Ocean Depths.');
        }
        else if (G.inCave) {
            if (tile === 10 && !G.puzzles.wire) initPuzzle1();
            if (tile === 11 && !G.puzzles.seq) initPuzzle2();
            if (tile === 12 && !G.puzzles.maze) initPuzzle3();
        }

        if (G.inCave && !G.puzzles.bridge && G.puzzles.wire && G.puzzles.seq && G.puzzles.maze) {
            G.puzzles.bridge = true;
            generateWorld(); 
            addChatMessage('System', 'The puzzles glow... A bridge extends over the lava!');
        }
    }

    for (let i = 0; i < G.wilds.length; i++) {
        const w = G.wilds[i];
        
        if (w.key === 'abyssal_serpent') { w.dx = 0; w.dy = 0; }
        else {
            w.mt--; 
            if(w.mt <= 0) { 
                w.mt = 50 + Math.random()*100; 
                const a = Math.random() * Math.PI * 2;
                const wsp = DINOS[w.key].spd * 0.4; 
                w.dx = Math.cos(a) * wsp; w.dy = Math.sin(a) * wsp; 
            }
            const wx = w.x + w.dx, wy = w.y + w.dy;
            
            // Respect invisible circle and cave walls
            if (Math.hypot(wx - centerXY, wy - centerXY) < mapRadius) {
                let wCanMove = true;
                const wtx = Math.floor(wx/TS), wty = Math.floor(wy/TS);
                if (worldMap[wty] && worldMap[wty][wtx] !== undefined) {
                    if (G.inCave && (worldMap[wty][wtx] === 1 || worldMap[wty][wtx] === 6)) wCanMove = false;
                }
                if (wCanMove) { w.x = wx; w.y = wy; }
            }
            if(w.dx !== 0) w.face = w.dx > 0 ? 1 : -1; 
            w.anim++;
        }
        
        if (G.encCd <= 0 && Math.hypot(p.x - w.x, p.y - w.y) < (38 + DINOS[w.key].sz)) {
            const wasBoss = w.isBoss; 
            G.wilds.splice(i, 1); 
            startBattle(w.key, wasBoss);
            break;
        }
    }
};

// ── 6. DRAW WORLD CUSTOM TILES ──
const origDrawWorld = drawWorld;
drawWorld = function() {
    origDrawWorld(); 
    if (G.level === 3) {
        const sx0 = Math.floor(G.cam.x/TS)-1, sy0 = Math.floor(G.cam.y/TS)-1;
        const sx1 = sx0 + Math.ceil(canvas.width/TS)+2, sy1 = sy0 + Math.ceil(canvas.height/TS)+2;
        
        for (let ty = Math.max(0,sy0); ty < Math.min(WS,sy1); ty++) {
            for (let tx = Math.max(0,sx0); tx < Math.min(WS,sx1); tx++) {
                const px = tx*TS - G.cam.x, py = ty*TS - G.cam.y, t = worldMap[ty][tx];
                
                if (t === 5) { // Giant Whirlpool
                    ctx.fillStyle = '#001133'; ctx.fillRect(px, py, TS, TS);
                    ctx.strokeStyle = '#0055aa'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(px+TS/2, py+TS/2, TS*0.4, G.tick*0.05, Math.PI+G.tick*0.05); ctx.stroke();
                    ctx.beginPath(); ctx.arc(px+TS/2, py+TS/2, TS*0.2, -G.tick*0.08, Math.PI-G.tick*0.08); ctx.stroke();
                } else if (t === 6) { // Lava
                    ctx.fillStyle = '#cc2200'; ctx.fillRect(px, py, TS, TS);
                    ctx.fillStyle = `rgba(255, 180, 0, ${0.7 + Math.sin(G.tick*0.1 + tx)*0.3})`;
                    ctx.fillRect(px+4, py+4, TS-8, TS-8);
                } else if (t === 7) { // Bridge
                    ctx.fillStyle = '#5a3a22'; ctx.fillRect(px, py, TS, TS);
                    ctx.fillStyle = '#3a2010'; for(let i=0; i<TS; i+=12) ctx.fillRect(px, py+i, TS, 3);
                } else if (t === 8) { // Exit Pad
                    ctx.fillStyle = '#333'; ctx.fillRect(px, py, TS, TS);
                    ctx.fillStyle = '#00ffff'; ctx.beginPath(); 
                    ctx.arc(px+TS/2, py+TS/2, 12 + Math.sin(G.tick*0.1)*4, 0, Math.PI*2); ctx.fill();
                } else if (t >= 10 && t <= 12) { // Puzzles
                    ctx.fillStyle = '#222'; ctx.fillRect(px+2, py+2, TS-4, TS-4);
                    const solved = (t===10 && G.puzzles.wire) || (t===11 && G.puzzles.seq) || (t===12 && G.puzzles.maze);
                    ctx.fillStyle = solved ? '#44ff44' : '#ffcc00';
                    ctx.font = '24px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
                    ctx.fillText(t===10 ? '🔌' : t===11 ? '🔢' : '🧩', px+TS/2, py+TS/2);
                }
            }
        }
    }
};

// ── 7. DRAW LEVEL 3 MINIMAP ──
const origDrawHUD = drawHUD;
drawHUD = function() {
    origDrawHUD(); 
    if (G.level === 3) {
        const W = canvas.width, H = canvas.height;
        const mm = 90, mmx = W - mm - 8, mmy = H - mm - 65;
        
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(mmx, mmy, mm, mm);
        ctx.strokeStyle = '#00aaff'; ctx.lineWidth = 1; ctx.strokeRect(mmx, mmy, mm, mm);
        
        const msc = mm / WS;
        for (let ty = 0; ty < WS; ty += 2) {
            for (let tx = 0; tx < WS; tx += 2) {
                const tt = worldMap[ty][tx];
                let mc = '#000';
                if (G.inCave) {
                    mc = tt===1?'#111': tt===6?'#ff4400': tt===7?'#885522': tt===8?'#fff': (tt>=10&&tt<=12)?'#ffff00': '#333';
                } else {
                    mc = tt===2?'#0d6080': tt===1?'#2d5a27': tt===0?'#c8a85a': tt===5?'#00ffff': '#0d6080';
                }
                ctx.fillStyle = mc;
                ctx.fillRect(mmx + tx*msc, mmy + ty*msc, msc*2+0.5, msc*2+0.5);
            }
        }
        
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mmx + G.player.x/TS*msc, mmy + G.player.y/TS*msc, 3, 0, Math.PI*2); ctx.fill();
        for (const w of G.wilds) {
            // FIX: Use Rarity Color for Minimap dots
            ctx.fillStyle = w.isBoss ? '#ff3333' : RARITY_COLOR[DINOS[w.key].rarity];
            ctx.beginPath(); ctx.arc(mmx + w.x/TS*msc, mmy + w.y/TS*msc, w.isBoss ? 3 : 1.5, 0, Math.PI*2); ctx.fill();
        }

        ctx.fillStyle = '#0a0602'; ctx.fillRect(16, 28, 200, 16); 
        ctx.fillStyle = '#aaa'; ctx.font = '12px Courier New'; ctx.textAlign = 'left';
        ctx.fillText(`Map: ${G.inCave ? 'Abyssal Cave' : 'Ocean Depths'}`, 16, 38);
    }
};

// ── 8. CUSTOM ART FOR LEVEL 3 DINOS (EYES + UNIQUE BODIES) ──
const origDrawDino = drawDino;
drawDino = function(key, cx, cy, face, af, sc, alpha, oc) {
    if (['plesiosaurus', 'ichthyosaurus', 'archelon', 'dunkleosteus', 'kronosaurus', 'leviathan', 'abyssal_serpent'].includes(key)) {
        const d = DINOS[key]; if(!d) return;
        ctx.save(); ctx.globalAlpha = alpha != null ? alpha : 1;
        ctx.translate(cx, cy); ctx.scale(face, 1);
        const s = (sc || 1) * (d.sz / 20);
        const bob = Math.sin(af * 0.18) * 2.5;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath();
        ctx.ellipse(0, d.sz*s*0.55+2, d.sz*s*0.65, 5, 0, 0, Math.PI*2); ctx.fill();

        // Eye Helper
        const drawEyes = (ex, ey) => {
            ctx.fillStyle = '#ffee00'; ctx.beginPath(); ctx.arc(ex*s, ey*s + bob, 2.5*s, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc((ex+0.5)*s, ey*s + bob, 1.2*s, 0, Math.PI*2); ctx.fill();
        };

        const cBody = oc && oc.body ? getCol(oc.body, 20*s) : d.col;
        const cAcc = oc && oc.legs ? getCol(oc.legs, 20*s) : d.acc;
        
        ctx.fillStyle = cBody; 

        if (key === 'plesiosaurus') {
            ctx.beginPath(); ctx.ellipse(0, bob, 22*s, 12*s, 0, 0, Math.PI*2); ctx.fill(); // body
            ctx.beginPath(); ctx.moveTo(15*s, bob); ctx.quadraticCurveTo(30*s, -25*s+bob, 35*s, -20*s+bob); ctx.lineWidth=6*s; ctx.strokeStyle=cBody; ctx.stroke(); // neck
            ctx.beginPath(); ctx.arc(36*s, -21*s+bob, 5*s, 0, Math.PI*2); ctx.fill(); // head
            ctx.fillStyle = cAcc;
            ctx.beginPath(); ctx.ellipse(10*s, 10*s+bob, 10*s, 4*s, 0.5, 0, Math.PI*2); ctx.fill(); 
            ctx.beginPath(); ctx.ellipse(-10*s, 10*s+bob, 10*s, 4*s, -0.5, 0, Math.PI*2); ctx.fill();
            drawEyes(37, -22);
            
        } else if (key === 'ichthyosaurus') {
            ctx.beginPath(); ctx.ellipse(0, bob, 24*s, 10*s, 0.1, 0, Math.PI*2); ctx.fill(); // body
            ctx.beginPath(); ctx.moveTo(20*s, bob); ctx.lineTo(34*s, 2*s+bob); ctx.lineTo(20*s, 6*s+bob); ctx.fill(); // nose
            ctx.fillStyle = cAcc;
            ctx.beginPath(); ctx.moveTo(0, -9*s+bob); ctx.lineTo(-8*s, -18*s+bob); ctx.lineTo(-10*s, -8*s+bob); ctx.fill(); // dorsal
            ctx.beginPath(); ctx.moveTo(-20*s, bob); ctx.lineTo(-35*s, -10*s+bob); ctx.lineTo(-30*s, 0+bob); ctx.lineTo(-35*s, 10*s+bob); ctx.fill(); // tail
            drawEyes(16, 0);

        } else if (key === 'archelon') {
            ctx.fillStyle = cAcc;
            ctx.beginPath(); ctx.ellipse(12*s, 12*s+bob, 14*s, 5*s, 0.6, 0, Math.PI*2); ctx.fill(); // flippers
            ctx.beginPath(); ctx.ellipse(-12*s, 12*s+bob, 12*s, 5*s, -0.6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = cBody; 
            ctx.beginPath(); ctx.ellipse(0, -2*s+bob, 22*s, 14*s, 0, 0, Math.PI*2); ctx.fill(); // shell
            ctx.beginPath(); ctx.arc(26*s, Math.sin(af*0.1)*3*s+bob, 6*s, 0, Math.PI*2); ctx.fill(); // head
            drawEyes(27, -1);

        } else if (key === 'dunkleosteus') {
            ctx.beginPath(); ctx.ellipse(-5*s, bob, 20*s, 12*s, 0, 0, Math.PI*2); ctx.fill(); // body
            ctx.fillStyle = cAcc; 
            ctx.beginPath(); ctx.moveTo(10*s, -14*s+bob); ctx.lineTo(30*s, -5*s+bob); ctx.lineTo(26*s, 15*s+bob); ctx.lineTo(5*s, 10*s+bob); ctx.fill(); // armored head
            ctx.beginPath(); ctx.moveTo(-22*s, bob); ctx.lineTo(-38*s, -12*s+bob); ctx.lineTo(-32*s, 0+bob); ctx.lineTo(-38*s, 12*s+bob); ctx.fill(); // tail
            drawEyes(22, -2);

        } else if (key === 'kronosaurus') {
            ctx.beginPath(); ctx.ellipse(0, bob, 26*s, 14*s, 0, 0, Math.PI*2); ctx.fill(); // huge body
            ctx.beginPath(); ctx.moveTo(20*s, -8*s+bob); ctx.lineTo(40*s, -5*s+bob); ctx.lineTo(45*s, 5*s+bob); ctx.lineTo(20*s, 10*s+bob); ctx.fill(); // big jaw
            ctx.fillStyle = cAcc;
            ctx.beginPath(); ctx.ellipse(12*s, 14*s+bob, 12*s, 5*s, 0.4, 0, Math.PI*2); ctx.fill(); // front flipper
            ctx.beginPath(); ctx.ellipse(-12*s, 14*s+bob, 12*s, 5*s, -0.4, 0, Math.PI*2); ctx.fill(); // back flipper
            drawEyes(32, -3);

        } else if (key === 'leviathan') {
            ctx.shadowColor = '#0000ff'; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.ellipse(0, -10*s+bob, 25*s, 35*s, 0, 0, Math.PI*2); ctx.fill();
            drawEyes(8, -15);
            ctx.fillStyle = cAcc;
            for(let i=-2; i<=2; i++) {
                ctx.beginPath(); ctx.moveTo(i*8*s, 20*s+bob);
                ctx.quadraticCurveTo(i*12*s, 40*s, i*5*s+Math.sin(af*0.2+i)*10*s, 50*s);
                ctx.lineWidth = 4*s; ctx.strokeStyle=cAcc; ctx.stroke();
            }
            ctx.shadowBlur = 0;

        } else if (key === 'abyssal_serpent') {
            ctx.shadowColor = '#00ff00'; ctx.shadowBlur = 20;
            for(let i=0; i<6; i++) {
                ctx.beginPath(); ctx.arc(-i*12*s, Math.sin(af*0.1 + i)*8*s + bob, (15-i)*s, 0, Math.PI*2); ctx.fill();
            }
            ctx.beginPath(); ctx.arc(10*s, bob, 16*s, 0, Math.PI*2); ctx.fill(); // head
            drawEyes(15, -4);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    } else {
        origDrawDino(key, cx, cy, face, af, sc, alpha, oc);
    }
};

// ── 9. NEW CHEAT PROMPT (OVERRIDE) ──
doCheatPrompt = function() {
    const code = window.prompt("Secret Developer Console:\nEnter command:");
    if(!code) return; 
    const c = code.trim().toLowerCase();
    
    if (c === 'dev_money') { G.wheat += 999999; G.cheatsActive = true; addChatMessage('System', "+999,999 Buckets"); } 
    else if (c === 'dev_dinos') { for(let k in DINOS) G.discovered[k] = true; G.cheatsActive = true; addChatMessage('System', "All Dinos Unlocked"); } 
    else if (c === 'dev_god') { G.playerHp = 9999; G.cheatsActive = true; addChatMessage('System', "GOD MODE"); } 
    else if (c === 'dev_lvl2') { 
        G.level = 2; G.discovered.utahraptor = true; G.player.dk = 'utahraptor'; G.inCave = false;
        generateWorld(); spawnWilds(); spawnMega(); 
        G.player.x = WS/2*TS; G.player.y = WS/2*TS; G.cheatsActive = true; 
        addChatMessage('System', "Teleported to Volcano Map"); 
    }
    else if (c === 'dev_lvl3') { 
        G.level = 3; G.discovered.plesiosaurus = true; G.player.dk = 'plesiosaurus'; G.inCave = false;
        generateWorld(); spawnWilds(); spawnMega(); 
        G.player.x = 80*TS; G.player.y = 60*TS; G.cheatsActive = true; // FIX: Spawns above cave entrance safely
        addChatMessage('System', "Teleported to Ocean Depths!"); 
    }
};

// ── 10. PUZZLE IMPLEMENTATIONS & MOBILE CONTROLS ──

function initPuzzle1() {
    G.p1 = { 
        L: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'], 
        R: ['#0000ff', '#ffff00', '#ff0000', '#00ff00'].sort(() => Math.random()-0.5), 
        sel: null, links: {} 
    };
    G.state = 'puzzle1';
}

function initPuzzle2() {
    G.p2 = { next: 1, pos: [] };
    for(let i=1; i<=10; i++) G.p2.pos.push({ i: i, x: 200 + Math.random()*(canvas.width-400), y: 150 + Math.random()*(canvas.height-300) });
    G.state = 'puzzle2';
}

function initPuzzle3() {
    G.p3 = {
        px: 1, py: 1,
        grid: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,1,0,0,0,0,0,1,0,0,2,1],
            [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1],
            [1,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
            [1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
            [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
            [1,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
    };
    G.state = 'puzzle3';
}

function drawPuzzle1() {
    G.btns = [];
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = 'rgba(0,10,30,0.95)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff'; ctx.font = '30px Courier New'; ctx.textAlign='center'; ctx.fillText('Match the wires!', W/2, 80);

    const padY = H/2 - 150;
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = G.p1.L[i]; ctx.fillRect(W/4 - 25, padY + i*80, 50, 50);
        if (G.p1.sel === i) { ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.strokeRect(W/4 - 25, padY + i*80, 50, 50); }
        ctx.fillStyle = G.p1.R[i]; ctx.fillRect(W*0.75 - 25, padY + i*80, 50, 50);
        if (G.p1.links[i] !== undefined) {
            ctx.strokeStyle = G.p1.L[i]; ctx.lineWidth = 10;
            ctx.beginPath(); ctx.moveTo(W/4 + 25, padY + i*80 + 25); ctx.lineTo(W*0.75 - 25, padY + G.p1.links[i]*80 + 25); ctx.stroke();
        }
    }
    btn(20, 20, 100, 40, 'Exit', '#aa2222', '#fff', () => { G.state = 'world'; G.player.y += TS; });
}

function drawPuzzle2() {
    G.btns = [];
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = 'rgba(0,10,30,0.95)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff'; ctx.font = '30px Courier New'; ctx.textAlign='center'; ctx.fillText(`Click 1 to 10 (Next: ${G.p2.next})`, W/2, 80);

    for (let p of G.p2.pos) {
        if (p.i >= G.p2.next) {
            ctx.fillStyle = '#2255aa'; ctx.beginPath(); ctx.arc(p.x, p.y, 35, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Courier New'; ctx.fillText(p.i, p.x, p.y+8);
        }
    }
    btn(20, 20, 100, 40, 'Exit', '#aa2222', '#fff', () => { G.state = 'world'; G.player.y += TS; });
}

function moveMaze(dx, dy) {
    let nx = G.p3.px + dx, ny = G.p3.py + dy;
    if (G.p3.grid[ny] && G.p3.grid[ny][nx] !== 1) {
        G.p3.px = nx; G.p3.py = ny;
        if (G.p3.grid[ny][nx] === 2) { 
            G.puzzles.maze = true; G.state = 'world'; G.player.y += TS; addChatMessage('System', 'Maze Solved!'); 
        }
    }
}

function drawPuzzle3() {
    G.btns = []; 
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = 'rgba(0,10,30,0.95)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff'; ctx.font = '24px Courier New'; ctx.textAlign='center'; 
    ctx.fillText('Use WASD/Arrows or On-Screen buttons to reach the green tile!', W/2, 50);

    const tw = 40, bx = W/2 - (15*tw)/2, by = 80;
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 15; x++) {
            const v = G.p3.grid[y][x];
            ctx.fillStyle = v === 1 ? '#333' : v === 2 ? '#44ff44' : '#000';
            ctx.fillRect(bx + x*tw, by + y*tw, tw, tw);
            ctx.strokeStyle = '#222'; ctx.strokeRect(bx + x*tw, by + y*tw, tw, tw);
        }
    }
    ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(bx + G.p3.px*tw + tw/2, by + G.p3.py*tw + tw/2, 12, 0, Math.PI*2); ctx.fill();

    const bY = H - 140;
    btn(W/2 - 30, bY - 60, 60, 50, '▲', '#444', '#fff', () => moveMaze(0, -1));
    btn(W/2 - 30, bY + 10, 60, 50, '▼', '#444', '#fff', () => moveMaze(0, 1));
    btn(W/2 - 100, bY - 25, 60, 50, '◀', '#444', '#fff', () => moveMaze(-1, 0));
    btn(W/2 + 40, bY - 25, 60, 50, '▶', '#444', '#fff', () => moveMaze(1, 0));

    btn(20, 20, 100, 40, 'Exit', '#aa2222', '#fff', () => { G.state = 'world'; G.player.y += TS; });
}

window.addEventListener('mousedown', e => handlePuzzleClicks(e.clientX, e.clientY));
window.addEventListener('touchstart', e => handlePuzzleClicks(e.touches[0].clientX, e.touches[0].clientY));

function handlePuzzleClicks(clientX, clientY) {
    if(!G.state.startsWith('puzzle')) return;
    const r = canvas.getBoundingClientRect(); const cx = clientX - r.left, cy = clientY - r.top;
    const W = canvas.width, H = canvas.height;

    if (G.state === 'puzzle1') {
        const padY = H/2 - 150;
        for (let i = 0; i < 4; i++) {
            if (cx > W/4-25 && cx < W/4+25 && cy > padY+i*80 && cy < padY+i*80+50) G.p1.sel = i; 
            if (cx > W*0.75-25 && cx < W*0.75+25 && cy > padY+i*80 && cy < padY+i*80+50) { 
                if (G.p1.sel !== null && G.p1.L[G.p1.sel] === G.p1.R[i]) G.p1.links[G.p1.sel] = i;
            }
        }
        if (Object.keys(G.p1.links).length === 4) { 
            G.puzzles.wire = true; G.state = 'world'; G.player.y += TS; addChatMessage('System', 'Wire Puzzle Solved!'); 
        }
    } 
    else if (G.state === 'puzzle2') {
        for (let p of G.p2.pos) {
            if (p.i >= G.p2.next && Math.hypot(cx - p.x, cy - p.y) < 35) {
                if (p.i === G.p2.next) {
                    G.p2.next++;
                    if (G.p2.next > 10) { G.puzzles.seq = true; G.state = 'world'; G.player.y += TS; addChatMessage('System', 'Sequence Solved!'); }
                } else { G.p2.next = 1; } 
            }
        }
    }
}

window.addEventListener('keydown', e => {
    if (G.state === 'puzzle3') {
        if (e.key === 'ArrowUp' || e.key === 'w') moveMaze(0, -1);
        if (e.key === 'ArrowDown' || e.key === 's') moveMaze(0, 1);
        if (e.key === 'ArrowLeft' || e.key === 'a') moveMaze(-1, 0);
        if (e.key === 'ArrowRight' || e.key === 'd') moveMaze(1, 0);
    }
});

// ── 11. ENDING CREDITS ──
function drawEnding() {
    G.btns = [];
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
    
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()*0.5})`;
        ctx.beginPath(); ctx.arc(Math.random()*W, (Math.random()*H + G.tick) % H, Math.random()*2, 0, Math.PI*2); ctx.fill();
    }

    ctx.fillStyle = '#ffaa00'; ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 20;
    ctx.font = 'bold 45px Courier New'; ctx.textAlign='center';
    ctx.fillText('Thank you for playing!', W/2, H/2 - 100); ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff'; ctx.font = '22px Courier New';
    ctx.fillText('Game was made by Ben', W/2, H/2 - 20);
    ctx.fillText('Music was created by flora', W/2, H/2 + 20);
    
    ctx.fillStyle = '#44aaff'; ctx.font = 'bold 24px Courier New';
    ctx.fillText('Join the dc!', W/2, H/2 + 80);
    
    btn(W/2 - 160, H/2 + 110, 320, 50, 'https://discord.gg/8lux', '#2255cc', '#fff', () => {
        window.open('https://discord.gg/8lux', '_blank');
    }, '💬');

    // FIX: New Button -> Let me play anyways
    btn(W/2 - 160, H/2 + 175, 320, 40, 'Let me play anyways', '#44aa44', '#fff', () => {
        G.state = 'world';
        G.btns = [];
    }, '▶');
}

// ── 12. END GAME HOOKS (INCLUDES LVL 2 -> LVL 3 TRANSITION) ──
const origExitBattle = exitBattle;
exitBattle = function() {
    // Check if we JUST beat the Level 2 Boss
    let transitioningTo3 = (G.level === 2 && G.battle.ek === 'indominus' && G.battle.res === 'win');

    // Run normal game reset
    origExitBattle();

    // Force transition to Level 3 immediately after normal reset
    if (transitioningTo3) {
        G.level = 3; 
        G.discovered.plesiosaurus = true; 
        G.player.dk = 'plesiosaurus'; 
        G.inCave = false;
        generateWorld(); 
        spawnWilds(); 
        spawnMega(); 
        G.player.x = 80*TS; G.player.y = 60*TS; // Safely above the cave entrance
        G.playerHp = pMaxHp(); 
        G.playerShield = 0;
        
        if (G.coop.partnerId) sendCoop({ type: 'coop_sync', level: 3 });
        addChatMessage('System', 'The ocean calls... Level 3 Unlocked!');
    }

    // Level 3 Boss defeat tracking
    if (G.level === 3 && G.battle.res === 'win') {
        if (G.battle.ek === 'leviathan') { G.bosses.leviathan = true; addChatMessage('System', 'Leviathan Defeated!'); }
        if (G.battle.ek === 'abyssal_serpent') { G.bosses.abyssal = true; addChatMessage('System', 'Abyssal Serpent Defeated!'); }

        if (G.bosses.leviathan && G.bosses.abyssal) {
            setTimeout(() => { G.state = 'ending'; }, 1500); 
        }
    }
};

// Also patch the co-op handler so if host advances to map 3, the client follows smoothly
const origHandleCoopMessage = handleCoopMessage;
handleCoopMessage = function(data) {
    if (data.type === 'coop_sync' && data.level === 3 && G.level < 3) {
        G.level = 3; 
        G.discovered.plesiosaurus = true; 
        G.player.dk = 'plesiosaurus'; 
        G.inCave = false;
        generateWorld(); spawnWilds(); spawnMega(); 
        G.player.x = 80*TS; G.player.y = 60*TS; 
        G.playerHp = pMaxHp(); G.playerShield = 0;
        addChatMessage('System', 'Partner defeated Indominus! Welcome to Map 3!');
    }
    origHandleCoopMessage(data);
};

const origRender = render;
render = function() {
    if (G.state === 'puzzle1') { drawPuzzle1(); updateDrawParticles(); }
    else if (G.state === 'puzzle2') { drawPuzzle2(); updateDrawParticles(); }
    else if (G.state === 'puzzle3') { drawPuzzle3(); updateDrawParticles(); }
    else if (G.state === 'ending') { drawEnding(); }
    else origRender();
};
