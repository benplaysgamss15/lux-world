/**
 * DinoWorld Expansion: Level 3 - The Abyssal Ocean & The Crystal Cave
 * Created by Ben | Music by Flora
 * File: ocean.js
 */

// --- SECTION 1: DATA EXTENSION ---
Object.assign(G, {
    oceanMap: [],
    oceanTileClr: [],
    uwCaveMap: [],
    uwCaveTileClr: [],
    oceanBossDefeated: false,
    caveBossDefeated: false,
    gameCompleted: false,
    // Puzzle States
    puzzleWiresSolved: false,
    puzzleSequenceIdx: -1, // -1 means not started, 0-10 for progress
    puzzleMazeSolved: false,
    bridgeLowered: false,
    uwCaveEntrance: { x: WS * 0.2 * TS, y: WS * 0.8 * TS },
    // Interactive Puzzle objects
    uwMazeData: [],
    uwSequenceNums: []
});

const OCEAN_DINOS = {
    plesiosaurus: { name: 'Plesiosaurus', rarity: 'Common', col: '#2a5a8a', acc: '#1a3a5a', hp: 200, atk: 35, spd: 4.0, sz: 35, sp: 0.15, rw: 45, em: '🦕', lvl: 3, zone: 'ocean' },
    basilosaurus: { name: 'Basilosaurus', rarity: 'Rare', col: '#4a4a5a', acc: '#2a2a3a', hp: 350, atk: 55, spd: 3.5, sz: 55, sp: 0.08, rw: 95, em: '🐋', lvl: 3, zone: 'ocean' },
    elasmosaurus: { name: 'Elasmosaurus', rarity: 'Rare', col: '#3a7a9a', acc: '#1a4a6a', hp: 300, atk: 50, spd: 4.5, sz: 45, sp: 0.07, rw: 85, em: '🦕', lvl: 3, zone: 'ocean' },
    kronosaurus: { name: 'Kronosaurus', rarity: 'Epic', col: '#1a2a4a', acc: '#0a1a2a', hp: 450, atk: 85, spd: 3.8, sz: 50, sp: 0.03, rw: 220, em: '🦈', lvl: 3, zone: 'ocean' },
    livyatan: { name: 'Livyatan', rarity: 'Boss', col: '#5a5a6a', acc: '#3a3a4a', hp: 1200, atk: 110, spd: 3.2, sz: 80, sp: 0, rw: 1500, em: '🐋', lvl: 3, zone: 'ocean' },
    abyssal_kraken: { name: 'The Kraken', rarity: 'Boss', col: '#2a0a0a', acc: '#1a0505', hp: 1500, atk: 130, spd: 2.0, sz: 90, sp: 0, rw: 2000, em: '🐙', lvl: 3, zone: 'uw_cave' }
};

Object.assign(DINOS, OCEAN_DINOS);

// --- SECTION 2: MAP GENERATION (OCEAN & CAVE) ---
function generateOceanLevel() {
    for (let y = 0; y < WS; y++) {
        G.oceanMap[y] = [];
        G.oceanTileClr[y] = [];
        for (let x = 0; x < WS; x++) {
            const n = noise(x * 0.1, y * 0.1);
            let t = 2; // Default to water
            if (n > 0.8) t = 0; // Small islands
            if (n < -0.8) t = 4; // Deep trenches
            
            G.oceanMap[y][x] = t;
            // Better water colors (Deep Blues/Teals)
            const oceanPalette = ['#0a1f3d', '#0e2a52', '#081a33', '#0d2547'];
            const islandPalette = ['#c2b280', '#d2c290', '#b2a270'];
            const trenchPalette = ['#050a14', '#070d1a', '#03060d'];

            if (t === 2) G.oceanTileClr[y][x] = oceanPalette[Math.abs(x * 3 + y * 7) % oceanPalette.length];
            else if (t === 0) G.oceanTileClr[y][x] = islandPalette[Math.abs(x * 5 + y * 3) % islandPalette.length];
            else if (t === 4) G.oceanTileClr[y][x] = trenchPalette[Math.abs(x * 7 + y * 11) % trenchPalette.length];
        }
    }
    // Set fixed entrance to the cave
    G.uwCaveEntrance = { tx: 40, ty: 120 };
}

function generateUWCave() {
    const CW = 50, CH = 40;
    for (let y = 0; y < CH; y++) {
        G.uwCaveMap[y] = [];
        G.uwCaveTileClr[y] = [];
        for (let x = 0; x < CW; x++) {
            let t = 0; // Stone floor
            if (x === 0 || x === CW - 1 || y === 0 || y === CH - 1) t = 1; // Wall
            if (x > 22 && x < 28 && !G.bridgeLowered) t = 4; // Lava gap
            
            G.uwCaveMap[y][x] = t;
            G.uwCaveTileClr[y][x] = t === 1 ? '#1a1a1a' : t === 4 ? '#ff4400' : '#2a2a3a';
        }
    }
    // Setup Sequence Puzzle Numbers
    G.uwSequenceNums = [];
    for (let i = 0; i <= 10; i++) {
        G.uwSequenceNums.push({ val: i, x: 5 * TS + (i * 1.5 * TS), y: 5 * TS, hit: false });
    }
}

// --- SECTION 3: BATTLE & PROGRESSION HOOKS ---
const _oceanExitBattle = exitBattle;
exitBattle = function() {
    const ek = G.battle.ek;
    const win = G.battle.res === 'win';
    _oceanExitBattle();

    if (win) {
        if (ek === 'livyatan') {
            G.oceanBossDefeated = true;
            addChatMessage('System', 'The Ocean Master has fallen!');
            checkGameEnd();
        }
        if (ek === 'abyssal_kraken') {
            G.caveBossDefeated = true;
            addChatMessage('System', 'The Kraken is slain!');
            checkGameEnd();
        }
    }
};

function checkGameEnd() {
    if (G.oceanBossDefeated && G.caveBossDefeated) {
        G.gameCompleted = true;
        G.state = 'ending';
    }
}

// --- SECTION 4: CHEAT CODES ---
const _oceanCheat = doCheatPrompt;
doCheatPrompt = function() {
    const code = window.prompt("Dev Console:\nEnter command:");
    if (!code) return;
    const c = code.trim().toLowerCase();

    if (c === 'dev_lvl3') {
        G.level = 3;
        G.zone = 'ocean';
        generateOceanLevel();
        spawnOceanWilds();
        G.player.x = WS / 2 * TS;
        G.player.y = WS / 2 * TS;
        G.playerHp = pMaxHp();
        addChatMessage('System', 'Teleported to The Abyssal Ocean (Hardest Level)');
    } else {
        // Fallback to original cheats if needed (though we handle the prompt here)
        if (c === 'dev_money') G.wheat += 999999;
        if (c === 'dev_god') { G.player.upg.hp = 99; G.player.upg.atk = 99; G.playerHp = 9999; }
    }
};

// --- SECTION 5: SPAWNING & ZONE LOGIC ---
function spawnOceanWilds() {
    G.wilds = [];
    const keys = Object.keys(DINOS).filter(k => DINOS[k].lvl === 3 && DINOS[k].rarity !== 'Boss');
    for (let i = 0; i < 40; i++) {
        let chosen = keys[Math.floor(Math.random() * keys.length)];
        const tx = Math.floor(Math.random() * WS);
        const ty = Math.floor(Math.random() * WS);
        G.wilds.push({ key: chosen, x: tx * TS, y: ty * TS, anim: 0, mt: Math.random() * 90, dx: 0, dy: 0, face: 1, isBoss: false });
    }
    // Spawn Ocean Boss
    G.wilds.push({ key: 'livyatan', x: 20 * TS, y: 20 * TS, anim: 0, mt: 0, dx: 0, dy: 0, face: 1, isBoss: true });
}

function enterUWCave() {
    G.fadeAlpha = 0;
    G.fadeDir = 1;
    G.fadeCb = () => {
        G.zone = 'uw_cave';
        generateUWCave();
        G.wilds = [];
        // Spawn Kraken Boss at the end of the cave
        G.wilds.push({ key: 'abyssal_kraken', x: 40 * TS, y: 20 * TS, anim: 0, mt: 0, dx: 0, dy: 0, face: 1, isBoss: true });
        G.player.x = 5 * TS;
        G.player.y = 20 * TS;
        G.encCd = 120;
    };
}

// --- SECTION 6: UPDATE LOOP (FIXING FREEZE) ---
const _oceanUpdate = update;
update = function() {
    if (G.state === 'ending') return; // Don't run game logic during credits
    
    if (G.level === 3) {
        G.tick++;
        if (G.state === 'world') {
            updateOceanWorld();
        } else if (G.state === 'battle') {
            updateBattle();
        }
        // Particle update
        G.particles = G.particles.filter(p => p.life > 0);
        G.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    } else {
        _oceanUpdate();
    }
};

function updateOceanWorld() {
    const p = G.player;
    let spd = pSpd();
    let dx = 0, dy = 0;

    if (G.keys['w']) dy -= spd;
    if (G.keys['s']) dy += spd;
    if (G.keys['a']) dx -= spd;
    if (G.keys['d']) dx += spd;

    // Movement
    if (G.zone === 'ocean') {
        p.x += dx; p.y += dy;
        // Check Cave Entrance
        if (Math.hypot(p.x - G.uwCaveEntrance.tx * TS, p.y - G.uwCaveEntrance.ty * TS) < 60) {
            enterUWCave();
        }
    } else if (G.zone === 'uw_cave') {
        const nx = p.x + dx;
        const ny = p.y + dy;
        const tx = Math.floor(nx / TS);
        const ty = Math.floor(ny / TS);
        
        // Puzzle Sequence Collision
        if (G.puzzleSequenceIdx < 10) {
            G.uwSequenceNums.forEach((num, i) => {
                if (Math.hypot(p.x - num.x, p.y - num.y) < 40 && !num.hit) {
                    if (num.val === G.puzzleSequenceIdx + 1) {
                        num.hit = true;
                        G.puzzleSequenceIdx++;
                        if (G.puzzleSequenceIdx === 10) addChatMessage('System', 'Sequence Complete!');
                    } else {
                        // Reset if wrong
                        G.puzzleSequenceIdx = -1;
                        G.uwSequenceNums.forEach(n => n.hit = false);
                        addChatMessage('System', 'Wrong Order! Resetting...');
                    }
                }
            });
        }

        // Cave boundaries and lava
        if (G.uwCaveMap[ty] && G.uwCaveMap[ty][tx] !== 1) {
            if (G.uwCaveMap[ty][tx] === 4 && !G.bridgeLowered) {
                // Lava contact
                G.playerHp -= 2;
                spawnParticles(p.x, p.y, '#ff4400', 5);
            } else {
                p.x = nx; p.y = ny;
            }
        }
        
        // Final Bridge Logic
        if (G.puzzleSequenceIdx === 10 && !G.bridgeLowered) {
            G.bridgeLowered = true;
            addChatMessage('System', 'The bridge has lowered! Cross to face the Kraken.');
        }
    }

    // Camera
    G.cam.x += (p.x - canvas.width / 2 - G.cam.x) * LERP;
    G.cam.y += (p.y - canvas.height / 2 - G.cam.y) * LERP;

    // Dino Collision
    for (let i = 0; i < G.wilds.length; i++) {
        const w = G.wilds[i];
        if (Math.hypot(p.x - w.x, p.y - w.y) < 60 && G.encCd <= 0) {
            startBattle(w.key, w.isBoss);
            break;
        }
    }
    if (G.encCd > 0) G.encCd--;
}

// --- SECTION 7: RENDERER PATCHES ---
const _oceanDrawWorld = drawWorld;
drawWorld = function() {
    if (G.level === 3) {
        if (G.zone === 'ocean') {
            drawOceanTiles();
        } else if (G.zone === 'uw_cave') {
            drawUWCaveTiles();
        }
    } else {
        _oceanDrawWorld();
    }
};

function drawOceanTiles() {
    const sx0 = Math.floor(G.cam.x / TS) - 1;
    const sy0 = Math.floor(G.cam.y / TS) - 1;
    const sx1 = sx0 + Math.ceil(canvas.width / TS) + 2;
    const sy1 = sy0 + Math.ceil(canvas.height / TS) + 2;

    for (let y = Math.max(0, sy0); y < Math.min(WS, sy1); y++) {
        for (let x = Math.max(0, sx0); x < Math.min(WS, sx1); x++) {
            const px = x * TS - G.cam.x, py = y * TS - G.cam.y;
            ctx.fillStyle = G.oceanTileClr[y][x];
            ctx.fillRect(px, py, TS + 1, TS + 1);
            
            // Add water shimmer
            if (G.oceanMap[y][x] === 2) {
                const w = Math.sin(G.tick * 0.02 + x * 0.5) * 0.1 + 0.1;
                ctx.fillStyle = `rgba(255,255,255,${w})`;
                ctx.fillRect(px, py + TS/2, TS, 2);
            }
        }
    }
    // Draw Cave Entrance
    const cex = G.uwCaveEntrance.tx * TS - G.cam.x;
    const cey = G.uwCaveEntrance.ty * TS - G.cam.y;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cex, cey, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    drawLabel("Underwater Cave", cex, cey - 60);
}

function drawUWCaveTiles() {
    const CW = 50, CH = 40;
    for (let y = 0; y < CH; y++) {
        for (let x = 0; x < CW; x++) {
            const px = x * TS - G.cam.x, py = y * TS - G.cam.y;
            if (px < -TS || px > canvas.width || py < -TS || py > canvas.height) continue;
            
            ctx.fillStyle = G.uwCaveTileClr[y][x];
            ctx.fillRect(px, py, TS + 1, TS + 1);
            
            // Draw lowered bridge
            if (x > 22 && x < 28 && G.bridgeLowered) {
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px, py + 10, TS, 28);
            }
        }
    }
    // Draw Sequence Numbers
    G.uwSequenceNums.forEach(num => {
        const nx = num.x - G.cam.x;
        const ny = num.y - G.cam.y;
        ctx.fillStyle = num.hit ? '#44ff44' : '#fff';
        ctx.font = 'bold 24px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(num.val, nx, ny);
    });
}

function drawLabel(txt, x, y) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(txt, x, y);
}

// --- SECTION 8: MINIMAP FOR LVL 3 ---
const _oceanHUD = drawHUD;
drawHUD = function() {
    if (G.state === 'ending') {
        drawEnding();
        return;
    }
    
    _oceanHUD();

    if (G.level === 3) {
        const W = canvas.width, H = canvas.height, mm = 100, mmx = W - mm - 10, mmy = H - mm - 80;
        // Wipe default minimap and draw level 3 one
        ctx.fillStyle = '#000';
        ctx.fillRect(mmx, mmy, mm, mm);
        
        if (G.zone === 'ocean') {
            const msc = mm / WS;
            for (let y = 0; y < WS; y += 4) {
                for (let x = 0; x < WS; x += 4) {
                    ctx.fillStyle = G.oceanTileClr[y][x];
                    ctx.fillRect(mmx + x * msc, mmy + y * msc, 2, 2);
                }
            }
            // Mark Cave on Minimap
            ctx.fillStyle = '#0ff';
            ctx.fillRect(mmx + G.uwCaveEntrance.tx * msc, mmy + G.uwCaveEntrance.ty * msc, 4, 4);
        } else {
            // Draw Cave Minimap
            const CW = 50, CH = 40;
            const mscX = mm / CW, mscY = mm / CH;
            for (let y = 0; y < CH; y++) {
                for (let x = 0; x < CW; x++) {
                    ctx.fillStyle = G.uwCaveTileClr[y][x];
                    ctx.fillRect(mmx + x * mscX, mmy + y * mscY, mscX, mscY);
                }
            }
        }
        // Player dot
        ctx.fillStyle = '#fff';
        const px = G.zone === 'ocean' ? (G.player.x / (WS * TS) * mm) : (G.player.x / (50 * TS) * mm);
        const py = G.zone === 'ocean' ? (G.player.y / (WS * TS) * mm) : (G.player.y / (40 * TS) * mm);
        ctx.beginPath(); ctx.arc(mmx + px, mmy + py, 3, 0, Math.PI * 2); ctx.fill();
    }
};

// --- SECTION 9: THE ENDING SCREEN ---
function drawEnding() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    
    // Star scroll
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = '#fff';
        const x = (Math.sin(i + G.tick * 0.01) * W) % W;
        const y = (i * 20 + G.tick) % H;
        ctx.fillRect(x, y, 2, 2);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Courier New';
    ctx.fillText('THANK YOU FOR PLAYING!', W / 2, H * 0.3);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Courier New';
    ctx.fillText('Game was made by Ben', W / 2, H * 0.5);
    ctx.fillText('Music was created by flora', W / 2, H * 0.5 + 40);
    
    ctx.fillStyle = '#55aaff';
    ctx.fillText('Join the dc!', W / 2, H * 0.7);
    ctx.font = 'bold 20px Courier New';
    ctx.fillText('https://discord.gg/8lux', W / 2, H * 0.7 + 40);
    
    if (G.tick % 60 < 30) {
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Courier New';
        ctx.fillText('The world is safe... for now.', W / 2, H * 0.9);
    }
}

// --- SECTION 10: INITIALIZATION ---
console.log("Level 3 Expansion Loaded Successfully.");
// Hooking into render loop to ensure 'ending' state is drawn
const _oceanRender = render;
render = function() {
    if (G.state === 'ending') {
        drawEnding();
        G.tick++;
        requestAnimationFrame(render);
    } else {
        _oceanRender();
    }
};
