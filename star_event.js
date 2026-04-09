// ==========================================
// SWEET STAR FALL EVENT & NOOB BEN BOSS
// ==========================================

// 1. Add Ben to the DINOS registry
DINOS['ben'] = {
    name: 'Noob Ben',
    rarity: 'Boss', // Boss rarity for red text and heavy stat scaling
    col: '#ffcc00', // Base yellow (overridden by custom OC)
    acc: '#00aa00', 
    hp: 3334, // Scales to ~5000 HP in battle
    atk: 167, // Scales to ~250 DMG in battle
    spd: 5.5,
    sz: 36, // T-Rex size
    sp: 0, // 0 spawn rate so he NEVER spawns naturally
    rw: 10000, // Exactly 10,000 buckets reward!
    em: '⭐',
    lvl: -1 // Hides him from the Index entirely (Easter Egg!)
};

// 2. Event State Tracker
const StarEvent = {
    active: false,
    timer: 0,
    stars: [],
    forceBen: false
};

// 3. Trigger and Spawn Logic
function triggerStarEvent() {
    StarEvent.active = true;
    StarEvent.timer = 600; // 10 seconds at 60 FPS
    StarEvent.stars = [];
    
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
    
    // Find a valid land tile near the player so they don't miss him
    for (let attempt = 0; attempt < 50; attempt++) {
        const range = 350;
        const tx = Math.floor(Math.max(TS, Math.min((WS-1)*TS, G.player.x + (Math.random()*range*2 - range))) / TS);
        const ty = Math.floor(Math.max(TS, Math.min((WS-1)*TS, G.player.y + (Math.random()*range*2 - range))) / TS);
        
        if (worldMap[ty] && worldMap[ty][tx] !== 2) { // 2 is water
            G.wilds.push({
                key: 'ben',
                x: tx * TS + TS / 2,
                y: ty * TS + TS / 2,
                anim: 0, mt: 0, dx: 0, dy: 0, face: 1,
                isBoss: false // Kept false so we don't accidentally triple his 10k reward
            });
            break;
        }
    }
}

// 4. Intercept the Cheat Prompt safely for "dev_star"
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
        return null; // Return null so original handler ignores it
    }
    return res;
};

// 5. Override Game Logic (Update Loop)
const _originalUpdateWorld = updateWorld;
updateWorld = function() {
    _originalUpdateWorld();

    // Trigger every 1 minute (3600 ticks)
    if (!StarEvent.active && G.tick % 3600 === 0 && G.tick > 0) {
        triggerStarEvent();
    } else if (StarEvent.active) {
        StarEvent.timer--;
        
        // Generate falling stars
        if (Math.random() < 0.5) {
            StarEvent.stars.push({
                x: G.cam.x + Math.random() * canvas.width,
                y: G.cam.y - 50 - Math.random() * 50,
                vx: -2 + Math.random() * 1.5,
                vy: 7 + Math.random() * 4,
                life: 150
            });
        }
        
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
};

// 6. Override Drawing Logic (Visuals, Colors, and Hats)
const _originalDrawHUD = drawHUD;
drawHUD = function() {
    if (G.state === 'world' && StarEvent.active) {
        // Darken Sky
        ctx.fillStyle = 'rgba(0, 5, 25, 0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Stars
        ctx.save();
        ctx.translate(-G.cam.x, -G.cam.y);
        StarEvent.stars.forEach(s => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
            ctx.beginPath(); ctx.arc(s.x, s.y, 9, 0, Math.PI*2); ctx.fill();
        });
        ctx.restore();

        // Screen Warning
        ctx.fillStyle = '#ffdd44';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.font = 'bold 22px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`⭐ SWEET STAR FALL! ENJOY THE VIEW! ${Math.ceil(StarEvent.timer/60)}s`, canvas.width/2, 90);
        ctx.shadowBlur = 0;
    }
    _originalDrawHUD();
};

const _originalDrawDino = drawDino;
drawDino = function(key, cx, cy, face, af, sc, alpha, oc) {
    if (key === 'ben') {
        // Ben is fundamentally a T-Rex with Roblox Noob Custom Colors
        const benOc = {
            body: '#0066cc', // Blue shirt
            legs: '#33cc33', // Green pants
            head: '#ffcc00', // Yellow head
            neck: '#ffcc00', // Yellow neck
            tail: '#0066cc'  // Blue tail (matching shirt)
        };
        _originalDrawDino('trex', cx, cy, face, af, sc, alpha, benOc);
    } else {
        _originalDrawDino(key, cx, cy, face, af, sc, alpha, oc);
    }
};

const _originalDrawHat = drawHat;
drawHat = function(type, cx, cy, sc) {
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

const _originalDrawWilds = drawWilds;
drawWilds = function() {
    _originalDrawWilds();
    
    // Add special golden aura and hat to wild Ben on the map
    for (const w of G.wilds) {
        if (w.key === 'ben') {
            const sx = w.x - G.cam.x, sy = w.y - G.cam.y;
            if (sx < -130 || sx > canvas.width + 130 || sy < -130 || sy > canvas.height + 130) continue;
            
            // Golden Aura
            const pulse = Math.sin(G.tick * 0.05) * 0.15 + 0.15;
            ctx.fillStyle = `rgba(255, 220, 50, ${pulse})`;
            ctx.beginPath(); ctx.arc(sx, sy, 90, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'rgba(255, 230, 80, 0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath(); ctx.arc(sx, sy, 90, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw custom Cap
            const headOff = DINOS.trex.sz * 1 * 0.55;
            const bob = Math.sin(w.anim * 0.18) * 2.5;
            drawHat('ben_cap', sx, sy - headOff + bob - 2, 1.2);
        }
    }
};

const _originalDrawBattle = drawBattle;
drawBattle = function() {
    _originalDrawBattle();
    
    const b = G.battle;
    // Draw the hat for Ben during the battle screen
    if (!b.isPvP && b.ek === 'ben') {
        const W = canvas.width, H = canvas.height;
        const eshake = b.eshake > 0 ? (Math.random() - 0.5) * 10 : 0;
        const eScale = 1.9; // Match standard wild battle scale
        const epHeadY = H * 0.37 - DINOS.trex.sz * eScale * 0.55;
        const bob = Math.sin(G.tick * 0.18) * 2.5;
        drawHat('ben_cap', W * 0.67 + eshake, epHeadY + bob - 2, eScale * 0.85);
    }
};
