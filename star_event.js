// ==========================================
// SWEET STAR FALL EVENT & NOOB BEN BOSS
// ==========================================

// 1. Add Ben to the DINOS registry
DINOS['ben'] = {
    name: 'Noob Ben',
    rarity: 'Boss', // Red text, heavy scaling
    col: '#ffcc00', // Base yellow (overridden by custom OC below)
    acc: '#00aa00', 
    hp: 3334, // Scales to ~5000 HP
    atk: 167, // Scales to ~250 DMG
    spd: 5.5,
    sz: 36, // T-Rex size
    sp: 0, // 0 spawn rate so he NEVER spawns naturally
    rw: 10000, // Exactly 10,000 buckets!
    em: '⭐',
    lvl: -1 // Hides him from the Index
};

// 2. Event State Tracker
const StarEvent = {
    active: false,
    timer: 0,
    stars: [],
    tickCounter: 0, // Custom counter for reliable 1-minute tracking
    forceBen: false
};

// 3. Trigger and Spawn Logic
function triggerStarEvent() {
    StarEvent.active = true;
    StarEvent.timer = 600; // 10 seconds at 60 FPS
    StarEvent.stars = [];
    StarEvent.tickCounter = 0; // Reset timer
    
    if (typeof addChatMessage === 'function') {
        addChatMessage('System', '✨ A Sweet Star Fall has begun! Look at the sky!');
    }

    // 10% chance to spawn Ben (or 100% if testing via cheat)
    if (Math.random() < 0.10 || StarEvent.forceBen) {
        spawnBen();
    }
}

function spawnBen() {
    if (typeof addChatMessage === 'function') {
        addChatMessage('System', '⭐ A legendary Ben has descended from the stars!');
    }
    
    // Find a valid land tile near the player
    for (let attempt = 0; attempt < 50; attempt++) {
        const range = 400; // Spawn near player view
        const tx = Math.floor(Math.max(TS, Math.min((WS-1)*TS, G.player.x + (Math.random()*range*2 - range))) / TS);
        const ty = Math.floor(Math.max(TS, Math.min((WS-1)*TS, G.player.y + (Math.random()*range*2 - range))) / TS);
        
        if (worldMap[ty] && worldMap[ty][tx] !== 2) { // 2 is water
            G.wilds.push({
                key: 'ben',
                x: tx * TS + TS / 2,
                y: ty * TS + TS / 2,
                anim: 0, mt: 0, dx: 0, dy: 0, face: 1,
                isBoss: false // Kept false so we don't accidentally triple his reward
            });
            break;
        }
    }
}

// 4. Intercept the Cheat Prompt safely
const originalPrompt = window.prompt;
window.prompt = function(msg, defaultText) {
    const res = originalPrompt(msg, defaultText);
    if (res && res.trim().toLowerCase() === 'dev_star') {
        G.cheatsActive = true;
        StarEvent.forceBen = true; // Guarantees Ben spawns
        triggerStarEvent();
        StarEvent.forceBen = false;
        if (typeof addChatMessage === 'function') {
            addChatMessage('System', "Cheat Activated: Sweet Star Fall (with Ben!)");
        }
        return null;
    }
    return res;
};

// 5. Safely Hook into the Game Loop (Wait 200ms to ensure all files loaded)
setTimeout(() => {
    // --- HOOK UPDATE LOOP (For stars and timer) ---
    const _originalUpdate = window.update;
    window.update = function() {
        _originalUpdate();

        if (G.state === 'world') {
            StarEvent.tickCounter++;
            
            // Trigger every 1 minute (3600 ticks)
            if (!StarEvent.active && StarEvent.tickCounter >= 3600) {
                triggerStarEvent();
            } else if (StarEvent.active) {
                StarEvent.timer--;
                
                // Spawn falling stars relative to camera
                if (Math.random() < 0.6) {
                    StarEvent.stars.push({
                        x: G.cam.x + Math.random() * canvas.width * 1.5 - 200,
                        y: G.cam.y - 50 - Math.random() * 50,
                        vx: -3 + Math.random() * 2,
                        vy: 9 + Math.random() * 5,
                        life: 120
                    });
                }
                
                // Move Stars
                StarEvent.stars.forEach(s => {
                    s.x += s.vx;
                    s.y += s.vy;
                    s.life--;
                });
                StarEvent.stars = StarEvent.stars.filter(s => s.life > 0);

                if (StarEvent.timer <= 0) {
                    StarEvent.active = false;
                }
            }
        }
    };

    // --- HOOK HUD (For Dark Overlay and Visuals) ---
    const _originalDrawHUD = window.drawHUD;
    window.drawHUD = function() {
        if (G.state === 'world' && StarEvent.active) {
            // Darken Sky OVER the world, but UNDER the HUD UI
            ctx.fillStyle = 'rgba(0, 5, 20, 0.65)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Stars with glowing trails!
            ctx.save();
            ctx.translate(-G.cam.x, -G.cam.y);
            StarEvent.stars.forEach(s => {
                // Glow
                ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
                ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI*2); ctx.fill();
                // Core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(s.x, s.y, 2.5, 0, Math.PI*2); ctx.fill();
                // Trail
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4);
                ctx.stroke();
            });
            ctx.restore();

            // Screen Warning
            ctx.fillStyle = '#ffdd44';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 6;
            ctx.font = 'bold 22px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`⭐ SWEET STAR FALL! ENJOY THE VIEW! ${Math.ceil(StarEvent.timer/60)}s`, canvas.width/2, 90);
            ctx.shadowBlur = 0;
        }
        _originalDrawHUD(); // Render actual HUD on top
    };

    // --- HOOK HAT SYSTEM (Add RBLX cap) ---
    const _originalDrawHat = window.drawHat;
    window.drawHat = function(type, cx, cy, sc) {
        if (type === 'ben_cap') {
            const s = sc || 1;
            ctx.save(); ctx.translate(cx, cy);
            
            // Black Cap Base
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(0, -6*s, 11*s, Math.PI, 0); ctx.fill();
            ctx.fillRect(-11*s, -6*s, 22*s, 6*s);
            
            // Brim
            ctx.fillStyle = '#0a0a0a';
            ctx.beginPath(); ctx.ellipse(8*s, 0, 11*s, 2.5*s, 0, 0, Math.PI*2); ctx.fill();
            
            // White Logo Text
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${4.5*s}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('RBLX', 0, -4*s);
            
            ctx.restore();
        } else {
            _originalDrawHat(type, cx, cy, sc);
        }
    };

    // --- HOOK DINO DRAWING (Add Roblox Colors AND Hat) ---
    const _originalDrawDino = window.drawDino;
    window.drawDino = function(key, cx, cy, face, af, sc, alpha, oc) {
        if (key === 'ben') {
            // Roblox Noob Colors
            const benOc = {
                body: '#0066cc', // Blue shirt
                legs: '#33cc33', // Green pants
                head: '#ffcc00', // Yellow head
                neck: '#ffcc00', // Yellow neck
                tail: '#0066cc'  // Blue tail
            };
            
            // Draw base T-Rex with Noob Colors
            _originalDrawDino('trex', cx, cy, face, af, sc, alpha, benOc);
            
            // Force draw his custom hat right on top of him!
            const s = sc || 1;
            const headOff = DINOS.trex.sz * s * 0.55;
            const bob = Math.sin(af * 0.18) * 2.5;
            window.drawHat('ben_cap', cx, cy - headOff + bob - 2, s * 1.15);
            
        } else {
            _originalDrawDino(key, cx, cy, face, af, sc, alpha, oc);
        }
    };

}, 200); // 200ms delay ensures game.js & render.js are totally finished loading first!
