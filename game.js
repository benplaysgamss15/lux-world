// ── WORLD GEN ──
function noise(x, y){ 
    return Math.sin(x*0.31)*Math.cos(y*0.29) + Math.sin(x*0.73+y*0.41)*0.5 + Math.cos(x*0.17-y*0.23)*0.8 + Math.sin((x+y)*0.11)*0.3; 
}

function generateWorld(){
    for(let y=0; y<WS; y++){
        worldMap[y] = [];
        tileClr[y] = [];
        for(let x=0; x<WS; x++){
            const cx = x - WS/2;
            const cy = y - WS/2; 
            const dist = Math.sqrt(cx*cx + cy*cy) / (WS*0.46);
            
            const isL2 = G.level === 2; 
            const lx = x + (isL2 ? 500 : 0); 
            const ly = y + (isL2 ? 500 : 0);
            
            const n = noise(lx, ly); 
            let t = 0;
            
            if(dist > 0.92) t = 2; 
            else if(dist > 0.75 && n < 0.1) t = 2; 
            else if(dist > 0.62 && n < -0.6) t = 2; 
            else if(n > 0.9 && dist < 0.68) t = 1; 
            else if(dist > 0.66 && dist < 0.76) t = 3;
            
            if(isL2) {
                const vcx = WS * 0.62;
                const vcy = WS * 0.38; 
                const craterDist = Math.hypot(x - vcx, y - vcy); 
                const spawnDist = Math.hypot(x - WS/2, y - WS/2);
                
                if(spawnDist > 4) { 
                    if(craterDist < 7) {
                        t = 4; 
                    } else if(craterDist < 14 && t !== 2) {
                        t = 1; 
                    } else if(t === 0 && (noise(lx*3.5, ly*3.5) > 0.5 || Math.sin(lx*0.45 + noise(lx*0.9, ly*0.7)*2.5) * Math.cos(ly*0.38) > 0.78)) {
                        t = 4; 
                    }
                }
            }
            
            worldMap[y][x] = t; 
            const gCol = isL2 ? VGCLR : GCLR; 
            const fCol = isL2 ? VFCLR : FCLR; 
            const wCol = isL2 ? VWCLR : WCLR; 
            const sCol = isL2 ? VSCLR : SCLR;
            
            if(t === 0) tileClr[y][x] = gCol[Math.abs(x*3+y*7) % gCol.length]; 
            else if(t === 1) tileClr[y][x] = fCol[Math.abs(x*5+y*3) % fCol.length]; 
            else if(t === 2) tileClr[y][x] = wCol[Math.abs(x*7+y*11) % wCol.length]; 
            else if(t === 3) tileClr[y][x] = sCol[Math.abs(x*11+y*5) % sCol.length]; 
            else if(t === 4) tileClr[y][x] = VRED[Math.abs(x*7+y*3) % VRED.length];
        }
    }
}
generateWorld();


// ── CO-OP SOLO STASH & PARTY MANAGEMENT ──
function stashSoloData() {
    G.soloStash = {
        level: G.level, 
        wheat: G.wheat, 
        player: JSON.parse(JSON.stringify(G.player)),
        playerHp: G.playerHp, 
        playerShield: G.playerShield, 
        discovered: JSON.parse(JSON.stringify(G.discovered)),
        volcanoTimer: G.volcanoTimer, 
        megaTimer: G.megaTimer, 
        megaOnLand: G.megaOnLand
    };
}

function restoreSoloData() {
    if (G.soloStash) {
        G.level = G.soloStash.level; 
        G.wheat = G.soloStash.wheat; 
        G.player = G.soloStash.player;
        G.playerHp = G.soloStash.playerHp; 
        G.playerShield = G.soloStash.playerShield; 
        G.discovered = G.soloStash.discovered;
        G.volcanoTimer = G.soloStash.volcanoTimer; 
        G.megaTimer = G.soloStash.megaTimer; 
        G.megaOnLand = G.soloStash.megaOnLand;
        G.soloStash = null;
    }
}

function bondWithPartner(id, name) {
    stashSoloData(); 
    
    G.coop.partnerId = id; 
    G.coop.partnerName = name; 
    G.level = 1; 
    G.wheat = 70; 
    G.player.dk = 'raptor'; 
    G.discovered = {raptor:true}; 
    G.player.upg = {hp:0, atk:0, spd:0}; 
    G.playerHp = pMaxHp(); 
    G.playerShield = 0;
    G.player.x = WS/2 * TS; 
    G.player.y = WS/2 * TS; 
    
    generateWorld(); 
    spawnWilds(); 
    spawnMega(); 
    
    G.cam.x = G.player.x - canvas.width/2; 
    G.cam.y = G.player.y - canvas.height/2;
    addChatMessage('System', `Successfully Bonded with ${name}! Started Co-op Mode.`);
}

function breakCoop(reason) {
    G.coop.partnerId = null; 
    G.coop.partnerName = '';
    
    restoreSoloData(); 
    
    generateWorld(); 
    spawnWilds(); 
    spawnMega(); 
    
    G.cam.x = G.player.x - canvas.width/2; 
    G.cam.y = G.player.y - canvas.height/2;
    addChatMessage('System', `${reason} Returned to your Solo save.`);
}


// ── BATTLE LOGIC ──
function getMyBattleStats() { 
    return { 
        dk: G.player.dk, 
        hp: G.playerHp, 
        mhp: pMaxHp(), 
        shield: G.playerShield, 
        mshield: Math.floor(pMaxHp()*0.4), 
        atk: pAtk(), 
        spd: pSpd(), 
        name: G.username || 'Player', 
        oc: G.player.oc, 
        hat: G.player.hat 
    }; 
}

function startPvPBattle(opId, opStats, isMyTurn) {
    G.state = 'battle'; 
    G.pvp.opponentId = opId;
    
    G.battle = {
        isPvP: true, isCoop: false, opId: opId, ek: opStats.dk, ehp: opStats.hp, emhp: opStats.mhp, eshield: opStats.shield, emshield: opStats.mshield, ename: opStats.name, eoc: opStats.oc, ehat: opStats.hat, eatk: opStats.atk, espd: opStats.spd, php: G.playerHp, pmhp: pMaxHp(), php_shield: G.playerShield, pmhp_shield: Math.floor(pMaxHp()*0.4), turn: isMyTurn ? 'player' : 'enemy', log: [`⚔️ Friendly PvP with ${opStats.name}!`], anim: false, res: null, eshake: 0, pshake: 0, cshake: 0, dnums: []
    }; 
}

function startCoopBattle(ek, isBoss, isHostOfBattle, partnerStats) {
    const en = DINOS[ek]; 
    G.state = 'battle'; 
    let eHP = Math.floor(en.hp * R_MULT[en.rarity] * 1.55); 
    G.battle = {
        isPvP: false, isCoop: true, isBattleHost: isHostOfBattle, opId: null, ek: ek, ehp: eHP, emhp: eHP, eatk: 0, eshield: 0, emshield: 0, ename: '', eoc: null, ehat: '', php: G.playerHp, pmhp: pMaxHp(), php_shield: G.playerShield, pmhp_shield: Math.floor(pMaxHp()*0.4), cpHp: partnerStats.hp, cpMhp: partnerStats.mhp, cpShield: partnerStats.shield, cpDk: partnerStats.dk, cpName: partnerStats.name, cpOc: partnerStats.oc, cpHat: partnerStats.hat, turn: isHostOfBattle ? 'player' : 'partner', log: [`🤝 Co-op Battle against ${en.name}!`], anim: false, res: null, eshake: 0, pshake: 0, cshake: 0, dnums: []
    }; 
}

function startBattle(ek, isBoss) {
    if (G.coop.partnerId && G.otherPlayers[G.coop.partnerId]) {
        const pStats = G.otherPlayers[G.coop.partnerId]; 
        sendCoop({ type: 'coop_battle_start', target: G.coop.partnerId, ek: ek, isBoss: isBoss, stats: getMyBattleStats() });
        startCoopBattle(ek, isBoss, true, { hp: pStats.hp, mhp: pStats.mhp, shield: 0, dk: pStats.dk, name: pStats.name || 'Partner', oc: pStats.oc, hat: pStats.hat }); 
        return;
    }
    const en = DINOS[ek]; 
    G.state = 'battle';
    G.battle = {
        isPvP: false, isCoop: false, opId: null, ek: ek, ehp: Math.floor(en.hp * R_MULT[en.rarity]), emhp: Math.floor(en.hp * R_MULT[en.rarity]), eshield: 0, emshield: 0, php: G.playerHp, pmhp: pMaxHp(), php_shield: G.playerShield, pmhp_shield: Math.floor(pMaxHp()*0.4), turn: 'player', log: [isBoss ? `⚠️ BOSS: ${en.name} appears!` : `Wild ${en.name} appeared!`], anim: false, res: null, eshake: 0, pshake: 0, cshake: 0, dnums: [], isBoss: !!isBoss
    }; 
}

function doAttack() {
    const b = G.battle; 
    if(b.turn !== 'player' || b.anim || b.res) return; 
    b.anim = true; const dmg = pAtk();
    if (b.isPvP) {
        sendPvP({ type: 'pvp_action', target: b.opId, sender: (G.isHost ? 'host' : G.peer.id), action: 'attack', dmg: dmg });
        if (b.eshield >= dmg) { b.eshield -= dmg; } else { b.ehp -= (dmg - b.eshield); b.eshield = 0; }
        b.ehp = Math.max(0, b.ehp); b.eshake = 20; b.dnums.push({x: canvas.width*0.67, y: canvas.height*0.37, val: dmg, col: '#ff4444', life: 60});
        b.log.unshift(`You attack for ${dmg} dmg!`); 
        if(b.ehp <= 0){ setTimeout(() => { b.res = 'win'; b.anim = false; }, 500); } else { setTimeout(() => { b.anim = false; b.turn = 'enemy'; }, 520); } 
        return;
    }
    if (b.isCoop) {
        b.ehp = Math.max(0, b.ehp - dmg); b.eshake = 20; b.dnums.push({x: canvas.width*0.67, y: canvas.height*0.37, val: dmg, col: '#ff4444', life: 60});
        b.log.unshift(`You attack for ${dmg} dmg!`); 
        sendCoop({ type: 'coop_battle_action', target: G.coop.partnerId, action: 'player_attack', dmg: dmg }); 
        if(b.ehp <= 0){ setTimeout(() => { const rew = Math.floor(DINOS[b.ek].rw * (b.isBoss ? 3 : 1) * 1.5); G.wheat += rew; b.res = (b.ek === 'megalodon' && G.level === 1) ? 'level2' : 'win'; b.anim = false; }, 500); return;}
        setTimeout(() => { b.anim = false; if (b.isBattleHost) { if (b.cpHp > 0) b.turn = 'partner'; else enemyTurn(); } else { b.turn = 'enemy'; }}, 520); 
        return;
    }
    b.ehp = Math.max(0, b.ehp - dmg); b.eshake = 20; b.dnums.push({x: canvas.width*0.67, y: canvas.height*0.37, val: dmg, col: '#ff4444', life: 60}); 
    b.log.unshift(`You attack for ${dmg} dmg!`); 
    if(b.ehp <= 0){ setTimeout(() => { const rew = DINOS[b.ek].rw * (b.isBoss ? 3 : 1); G.wheat += rew; b.res = (b.ek === 'megalodon' && G.level === 1) ? 'level2' : 'win'; b.anim = false; }, 500); return; }
    setTimeout(() => { b.anim = false; b.turn = 'enemy'; enemyTurn(); }, 520);
}

function processCoopBattleAction(data) {
    const b = G.battle; if (G.state !== 'battle' || !b.isCoop) return;
    if (data.action === 'player_attack') {
        b.anim = true; b.ehp = Math.max(0, b.ehp - data.dmg); b.eshake = 20; b.dnums.push({x: canvas.width*0.67, y: canvas.height*0.37, val: data.dmg, col: '#ff4444', life: 60}); 
        b.log.unshift(`${b.cpName} attacks for ${data.dmg} dmg!`); 
        if (b.ehp <= 0) { setTimeout(() => { b.res = (b.ek === 'megalodon' && G.level === 1) ? 'level2' : 'win'; b.anim = false; }, 500); return; }
        setTimeout(() => { b.anim = false; if (b.isBattleHost) enemyTurn(); else b.turn = (b.php > 0) ? 'player' : 'enemy'; }, 520);
    } 
    else if (data.action === 'enemy_attack') {
        b.anim = true; const targetIsMe = !data.targetIsBattleHost; 
        if (targetIsMe) {
            if (b.php_shield >= data.dmg) { b.php_shield -= data.dmg; } else { b.php -= (data.dmg - b.php_shield); b.php_shield = 0; } 
            G.playerHp = Math.max(0, b.php); G.playerShield = b.php_shield; b.pshake = 18; b.log.unshift(`${DINOS[b.ek].name} bites YOU for ${data.dmg}!`);
        } else {
            if (b.cpShield >= data.dmg) { b.cpShield -= data.dmg; } else { b.cpHp -= (data.dmg - b.cpShield); b.cpShield = 0; } 
            b.cshake = 18; b.log.unshift(`${DINOS[b.ek].name} bites ${b.cpName} for ${data.dmg}!`);
        }
        setTimeout(() => { b.anim = false; if(b.php <= 0 && b.cpHp <= 0){ b.res = 'lose'; } else { b.turn = (b.cpHp > 0) ? 'partner' : 'player'; }}, 420);
    }
    else if (data.action === 'run') { b.res = 'win'; }
}

function enemyTurn(){
    const b = G.battle; if(b.res) return; 
    b.anim = true; const en = DINOS[b.ek];
    let dmg = Math.max(1, Math.floor(en.atk * R_MULT[en.rarity]) + Math.floor(Math.random()*10)-5);
    if (b.isCoop) {
        dmg = Math.floor(dmg * 1.55); 
        const canHitPlayer = b.php > 0; const canHitPartner = b.cpHp > 0; 
        let targetLocal = (canHitPlayer && canHitPartner) ? Math.random() > 0.5 : !canHitPartner;
        if (targetLocal) {
            if (b.php_shield >= dmg) { b.php_shield -= dmg; } else { b.php -= (dmg - b.php_shield); b.php_shield = 0; } 
            G.playerHp = Math.max(0, b.php); G.playerShield = b.php_shield; b.pshake = 18; b.log.unshift(`${en.name} bites YOU for ${dmg}!`);
        } else {
            if (b.cpShield >= dmg) { b.cpShield -= dmg; } else { b.cpHp -= (dmg - b.cpShield); b.cpShield = 0; } 
            b.cshake = 18; b.log.unshift(`${en.name} bites ${b.cpName} for ${dmg}!`);
        }
        sendCoop({ type: 'coop_battle_action', target: G.coop.partnerId, action: 'enemy_attack', dmg: dmg, targetIsBattleHost: targetLocal });
        setTimeout(() => { b.anim = false; if(b.php <= 0 && b.cpHp <= 0){ b.res = 'lose'; } else { b.turn = b.php > 0 ? 'player' : 'partner'; }}, 420); 
        return;
    }
    if (b.php_shield >= dmg) { b.php_shield -= dmg; } else { b.php -= (dmg - b.php_shield); b.php_shield = 0; } 
    G.playerHp = Math.max(0, b.php); G.playerShield = b.php_shield;
    b.pshake = 18; b.log.unshift(`${en.name} attacks for ${dmg}!`);
    setTimeout(() => { b.anim = false; if(b.php <= 0){ b.res = 'lose'; } else { b.turn = 'player'; } }, 420);
}

function doRun() {
    const b = G.battle; if(b.res || b.anim) return;
    if (b.isPvP) { sendPvP({ type: 'pvp_action', target: b.opId, action: 'run' }); setTimeout(exitBattle, 500); return; }
    if (b.isCoop) { sendCoop({ type: 'coop_battle_action', target: G.coop.partnerId, action: 'run' }); setTimeout(exitBattle, 500); return; }
    if(Math.random() < 0.62){ setTimeout(exitBattle, 500); } else { b.turn = 'enemy'; setTimeout(enemyTurn, 350); }
}

function exitBattle(){
    G.state = 'world';
    if (G.battle.isPvP) { G.playerHp = G.battle.php <= 0 ? 1 : G.battle.php; G.pvp.cd = 1800; } 
    else if (G.battle.isCoop) { G.playerHp = G.battle.res === 'lose' ? pMaxHp() : Math.max(0, G.battle.php); } 
    else { G.playerHp = G.battle.res === 'lose' ? pMaxHp() : Math.max(5, G.battle.php); }
    G.encCd = 200;
}

// ── SPAWNING ──
function spawnWilds(){
    G.wilds = []; const keys = Object.keys(DINOS).filter(k => DINOS[k].lvl === G.level && DINOS[k].rarity !== 'Boss');
    for(let i=0; i<36; i++){
        let chosen = keys[0], acc = 0; const tot = keys.reduce((sum, k) => sum + DINOS[k].sp, 0); const rng = Math.random() * tot;
        for(const k of keys){ acc += DINOS[k].sp; if(rng < acc){ chosen = k; break; } }
        for(let attempt=0; attempt<20; attempt++){
            const tx = Math.floor(Math.random() * WS); const ty = Math.floor(Math.random() * WS);
            if(worldMap[ty] && worldMap[ty][tx] !== 2){ G.wilds.push({key: chosen, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: Math.random()*90, dx: 0, dy: 0, face: 1, isBoss: false}); break; }
        }
    }
}

function spawnMega(){
    const bossKey = G.level === 1 ? 'megalodon' : 'indominus';
    for(let attempt=0; attempt<300; attempt++){
        const tx = Math.floor(Math.random() * WS); const ty = Math.floor(Math.random() * WS); 
        const isWater = worldMap[ty] && worldMap[ty][tx] === 2;
        if((G.level === 1 && ((!G.megaOnLand && isWater) || (G.megaOnLand && !isWater))) || (G.level === 2 && !isWater)){ G.wilds.push({key: bossKey, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: 0, dx: 0, dy: 0, face: 1, isBoss: true}); return; }
    }
}

spawnWilds(); spawnMega();

// ── UPDATE ──
function update(){
    G.tick++;
    if (G.playerHp <= 0 && G.state === 'world') { G.playerHp = pMaxHp(); G.playerShield = 0; G.player.x = WS/2 * TS; G.player.y = WS/2 * TS; }
    if(G.tick % 300 === 0 && G.state === 'world') { if(window.saveGame) window.saveGame(); }
    if(G.state === 'world') { updateWorld(); } else if(G.state === 'battle') { updateBattle(); }
}

function updateWorld(){
    const p = G.player; let dx = 0, dy = 0; const spd = pSpd();
    if(G.keys['a']) dx -= spd; if(G.keys['d']) dx += spd; if(G.keys['w']) dy -= spd; if(G.keys['s']) dy += spd;
    if(G.joy.on){ const jl = Math.sqrt(G.joy.dx**2 + G.joy.dy**2); if(jl > 12){ dx += (G.joy.dx / jl) * spd; dy += (G.joy.dy / jl) * spd; } }
    p.x += dx; p.y += dy;
    G.cam.x += (p.x - canvas.width/2 - G.cam.x) * LERP; G.cam.y += (p.y - canvas.height/2 - G.cam.y) * LERP;
    
    for(const w of G.wilds){
        const dist = Math.hypot(p.x - w.x, p.y - w.y);
        if(G.encCd <= 0 && dist < 50){ startBattle(w.key, w.isBoss); G.wilds.splice(G.wilds.indexOf(w),1); break; }
    }
}

function updateBattle(){
    const b = G.battle; if(b.eshake > 0) b.eshake--; if(b.pshake > 0) b.pshake--;
}

window.addEventListener('keydown', e => { G.keys[e.key.toLowerCase()] = true; if(G.state === 'intro') startGame(false); });
window.addEventListener('keyup', e => { G.keys[e.key.toLowerCase()] = false; });

function startGame(isNew = false) {
    if (!isNew && window.activeSave) {
        const s = window.activeSave;
        G.level = s.level || 1; G.wheat = s.wheat || 60; G.player = s.player;
        G.playerHp = s.playerHp; G.discovered = s.discovered;
        window.activeSave = null;
    } else {
        G.level = 1; G.wheat = 60; G.playerHp = 80; G.discovered = {raptor: true};
    }
    G.state = 'world';
}

function loop(){ update(); render(); requestAnimationFrame(loop); }
loop();
