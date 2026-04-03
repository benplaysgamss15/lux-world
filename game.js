p// ── SAVE & LOAD SYSTEM ──
window.activeSave = null;

function loadSaveData() {
    try {
        const s = localStorage.getItem('dinoworld_save');
        if (s) {
            const data = JSON.parse(s);
            if (Date.now() - data.ts < 24 * 60 * 60 * 1000) {
                window.activeSave = data;
            } else {
                localStorage.removeItem('dinoworld_save');
            }
        }
    } catch (e) { 
        console.error("Save load failed", e); 
    }
}
loadSaveData();

function saveGame() {
    // PROTECT SOLO DATA: Do not overwrite save file if user is currently in a Co-op Party!
    if (G.state === 'intro' || G.coop.partnerId) return; 
    
    try {
        const data = {
            ts: Date.now(), 
            level: G.level, 
            wheat: G.wheat, 
            player: G.player, 
            playerHp: G.playerHp, 
            playerShield: G.playerShield, 
            discovered: G.discovered, 
            volcanoTimer: G.volcanoTimer, 
            megaTimer: G.megaTimer, 
            megaOnLand: G.megaOnLand 
        };
        localStorage.setItem('dinoworld_save', JSON.stringify(data));
    } catch (e) { 
        console.error("Save error", e); 
    }
}

window.addEventListener('beforeunload', () => { 
    if(G.state === 'world' || G.state === 'shop' || G.state === 'index' || G.state === 'customize') {
        saveGame(); 
    }
});

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

    // NEW: Inject Map Entrances!
    if (G.level === 1 && G.room === 'main') {
        
        // Mountain Entrance (Tile 6) Top Left
        const mx = 20;
        const my = 20;
        for(let dy = -2; dy <= 2; dy++) {
            for(let dx = -2; dx <= 2; dx++) {
                worldMap[my+dy][mx+dx] = 0; // Clear the terrain around it
            }
        }
        worldMap[my][mx] = 6; 
        
        // Cave Entrance (Tile 5) Bottom Right
        const cx = WS - 20;
        const cy = WS - 20;
        for(let dy = -2; dy <= 2; dy++) {
            for(let dx = -2; dx <= 2; dx++) {
                worldMap[cy+dy][cx+dx] = 0; // Clear the terrain around it
            }
        }
        worldMap[cy][cx] = 5; 
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
    stashSoloData(); // Save solo progress to background!
    
    G.coop.partnerId = id; 
    G.coop.partnerName = name; 
    G.level = 1; 
    G.room = 'main'; // Ensure we reset room state
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
    
    restoreSoloData(); // Retrieve solo progress from background!
    G.room = 'main'; // Reset back to main just in case they were in a cave
    
    generateWorld(); 
    spawnWilds(); 
    spawnMega(); 
    
    G.cam.x = G.player.x - canvas.width/2; 
    G.cam.y = G.player.y - canvas.height/2;
    addChatMessage('System', `${reason} Returned to your Solo save.`);
}


// ── BATTLE LOGIC (PVP & CO-OP) ──
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
        isPvP: true, 
        isCoop: false, 
        opId: opId, 
        ek: opStats.dk, 
        ehp: opStats.hp, 
        emhp: opStats.mhp, 
        eshield: opStats.shield, 
        emshield: opStats.mshield, 
        ename: opStats.name, 
        eoc: opStats.oc, 
        ehat: opStats.hat, 
        eatk: opStats.atk, 
        espd: opStats.spd,
        php: G.playerHp, 
        pmhp: pMaxHp(), 
        php_shield: G.playerShield, 
        pmhp_shield: Math.floor(pMaxHp()*0.4), 
        turn: isMyTurn ? 'player' : 'enemy', 
        log: [`⚔️ Friendly PvP with ${opStats.name}!`], 
        anim: false, 
        res: null, 
        eshake: 0, 
        pshake: 0, 
        cshake: 0, 
        dnums: []
    }; 
    G.btns = [];
}

function startCoopBattle(ek, isBoss, isHostOfBattle, partnerStats) {
    const en = DINOS[ek]; 
    G.state = 'battle'; 
    
    // 1.55x Co-op Boss Buff applied here!
    let eHP = Math.floor(en.hp * R_MULT[en.rarity] * 1.55); 
    
    G.battle = {
        isPvP: false, 
        isCoop: true, 
        isBattleHost: isHostOfBattle, 
        opId: null, 
        ek: ek, 
        ehp: eHP, 
        emhp: eHP, 
        eatk: 0, 
        eshield: 0, 
        emshield: 0, 
        ename: '', 
        eoc: null, 
        ehat: '',
        php: G.playerHp, 
        pmhp: pMaxHp(), 
        php_shield: G.playerShield, 
        pmhp_shield: Math.floor(pMaxHp()*0.4), 
        cpHp: partnerStats.hp, 
        cpMhp: partnerStats.mhp, 
        cpShield: partnerStats.shield, 
        cpDk: partnerStats.dk, 
        cpName: partnerStats.name, 
        cpOc: partnerStats.oc, 
        cpHat: partnerStats.hat,
        turn: isHostOfBattle ? 'player' : 'partner', 
        log: [`🤝 Co-op Battle against ${en.name}!`], 
        anim: false, 
        res: null, 
        eshake: 0, 
        pshake: 0, 
        cshake: 0, 
        dnums: []
    }; 
    G.btns = [];
}

function startBattle(ek, isBoss) {
    if (G.coop.partnerId && G.otherPlayers[G.coop.partnerId]) {
        const pStats = G.otherPlayers[G.coop.partnerId]; 
        sendCoop({ 
            type: 'coop_battle_start', 
            target: G.coop.partnerId, 
            ek: ek, 
            isBoss: isBoss, 
            stats: getMyBattleStats() 
        });
        startCoopBattle(ek, isBoss, true, { 
            hp: pStats.hp, 
            mhp: pStats.mhp, 
            shield: 0, 
            dk: pStats.dk, 
            name: pStats.name || 'Partner', 
            oc: pStats.oc, 
            hat: pStats.hat 
        }); 
        return;
    }
    
    const en = DINOS[ek]; 
    G.state = 'battle';
    
    G.battle = {
        isPvP: false, 
        isCoop: false, 
        opId: null, 
        ek: ek, 
        ehp: Math.floor(en.hp * R_MULT[en.rarity]), 
        emhp: Math.floor(en.hp * R_MULT[en.rarity]), 
        eshield: 0, 
        emshield: 0,
        php: G.playerHp, 
        pmhp: pMaxHp(), 
        php_shield: G.playerShield, 
        pmhp_shield: Math.floor(pMaxHp()*0.4), 
        turn: 'player', 
        log: [isBoss ? `⚠️ BOSS: ${en.name} appears!` : `Wild ${en.name} appeared!`], 
        anim: false, 
        res: null, 
        eshake: 0, 
        pshake: 0, 
        cshake: 0, 
        dnums: [], 
        isBoss: !!isBoss
    }; 
    G.btns = [];
}

function doAttack() {
    const b = G.battle; 
    if(b.turn !== 'player' || b.anim || b.res) return; 
    
    b.anim = true; 
    const dmg = pAtk();

    if (b.isPvP) {
        sendPvP({ type: 'pvp_action', target: b.opId, sender: (G.isHost ? 'host' : G.peer.id), action: 'attack', dmg: dmg });
        
        if (b.eshield >= dmg) { 
            b.eshield -= dmg; 
        } else { 
            b.ehp -= (dmg - b.eshield); 
            b.eshield = 0; 
        }
        b.ehp = Math.max(0, b.ehp); 
        b.eshake = 20; 
        b.dnums.push({x: canvas.width*0.67, y: canvas.height*0.37, val: dmg, col: '#ff4444', life: 60});
        b.log.unshift(`You attack for ${dmg} dmg!`); 
        
        if(b.log.length > 5) b.log.pop(); 
        spawnParticles(canvas.width*0.67, canvas.height*0.37, '#ff4444', 6);
        
        if(b.ehp <= 0){ 
            setTimeout(() => { 
                b.log.unshift(`🏆 You won the friendly match!`); 
                b.res = 'win'; 
                b.anim = false; 
                spawnParticles(canvas.width*0.67, canvas.height*0.37, '#55ddff', 16); 
            }, 500); 
        } else { 
            setTimeout(() => { 
                b.anim = false; 
                b.turn = 'enemy'; 
            }, 520); 
        } 
        return;
    }

    if (b.isCoop) {
        b.ehp = Math.max(0, b.ehp - dmg); 
        b.eshake = 20; 
        b.dnums.push({x: canvas.width*0.67, y: canvas.height*0.37, val: dmg, col: '#ff4444', life: 60});
        b.log.unshift(`You attack for ${dmg} dmg!`); 
        
        if(b.log.length > 5) b.log.pop(); 
        spawnParticles(canvas.width*0.67, canvas.height*0.37, '#ff4444', 6);
        
        sendCoop({ type: 'coop_battle_action', target: G.coop.partnerId, action: 'player_attack', dmg: dmg }); 
        
        if(b.ehp <= 0){
            setTimeout(() => {
                const rew = Math.floor(DINOS[b.ek].rw * (b.isBoss ? 3 : 1) * 1.5); 
                G.wheat += rew; 
                if (G.coop.partnerId) sendCoop({ type: 'coop_wheat', target: G.coop.partnerId, wheat: G.wheat }); 
                
                b.log.unshift(`🪣 Co-op Team Won ${rew} Buckets!`);
                if(!G.discovered[b.ek]) { 
                    G.discovered[b.ek] = true; 
                    b.log.unshift(`📘 ${DINOS[b.ek].name} added to Index!`); 
                }
                b.res = (b.ek === 'megalodon' && G.level === 1) ? 'level2' : 'win'; 
                b.anim = false; 
                spawnParticles(canvas.width*0.67, canvas.height*0.37, '#55ddff', 16);
            }, 500); 
            return;
        }
        
        setTimeout(() => { 
            b.anim = false; 
            if (b.isBattleHost) { 
                if (b.cpHp > 0) b.turn = 'partner'; 
                else enemyTurn(); 
            } else { 
                b.turn = 'enemy'; 
            }
        }, 520); 
        return;
    }

    b.ehp = Math.max(0, b.ehp - dmg); 
    b.eshake = 20; 
    b.dnums.push({x: canvas.width*0.67, y: canvas.height*0.37, val: dmg, col: '#ff4444', life: 60}); 
    b.log.unshift(`You attack for ${dmg} dmg!`); 
    
    if(b.log.length > 5) b.log.pop(); 
    spawnParticles(canvas.width*0.67, canvas.height*0.37, '#ff4444', 6);
    
    if(b.ehp <= 0){ 
        setTimeout(() => { 
            const rew = DINOS[b.ek].rw * (b.isBoss ? 3 : 1); 
            G.wheat += rew; 
            b.log.unshift(`🪣 Won ${rew} Buckets!`); 
            
            if(!G.discovered[b.ek]){
                G.discovered[b.ek] = true; 
                b.log.unshift(`📘 ${DINOS[b.ek].name} added to Index!`);
            } 
            b.res = (b.ek === 'megalodon' && G.level === 1) ? 'level2' : 'win'; 
            b.anim = false; 
            spawnParticles(canvas.width*0.67, canvas.height*0.37, '#55ddff', 16); 
        }, 500); 
        return; 
    }
    setTimeout(() => {
        b.anim = false;
        b.turn = 'enemy';
        enemyTurn();
    }, 520);
}

function processCoopBattleAction(data) {
    const b = G.battle; 
    if (G.state !== 'battle' || !b.isCoop) return;

    if (data.action === 'player_attack') {
        b.anim = true; 
        b.ehp = Math.max(0, b.ehp - data.dmg); 
        b.eshake = 20; 
        b.dnums.push({x: canvas.width*0.67, y: canvas.height*0.37, val: data.dmg, col: '#ff4444', life: 60}); 
        b.log.unshift(`${b.cpName} attacks for ${data.dmg} dmg!`); 
        
        if(b.log.length > 5) b.log.pop(); 
        spawnParticles(canvas.width*0.67, canvas.height*0.37, '#ff4444', 6);
        
        if (b.ehp <= 0) { 
            setTimeout(() => { 
                const rew = Math.floor(DINOS[b.ek].rw * (b.isBoss ? 3 : 1) * 1.5); 
                b.log.unshift(`🪣 Co-op Team Won ${rew} Buckets!`); 
                if(!G.discovered[b.ek]) { 
                    G.discovered[b.ek] = true; 
                    b.log.unshift(`📘 ${DINOS[b.ek].name} added to Index!`); 
                } 
                b.res = (b.ek === 'megalodon' && G.level === 1) ? 'level2' : 'win'; 
                b.anim = false; 
            }, 500); 
            return; 
        }
        
        setTimeout(() => { 
            b.anim = false; 
            if (b.isBattleHost) enemyTurn(); 
            else b.turn = (b.php > 0) ? 'player' : 'enemy'; 
        }, 520);
    } 
    else if (data.action === 'enemy_attack') {
        b.anim = true; 
        const targetIsMe = !data.targetIsBattleHost; 
        
        if (targetIsMe) {
            if (b.php_shield >= data.dmg) {
                b.php_shield -= data.dmg; 
            } else { 
                b.php -= (data.dmg - b.php_shield); 
                b.php_shield = 0; 
            } 
            G.playerHp = Math.max(0, b.php); 
            G.playerShield = b.php_shield; 
            b.pshake = 18; 
            b.dnums.push({x: canvas.width*0.28, y: canvas.height*0.4, val: data.dmg, col: '#ff8844', life: 60}); 
            spawnParticles(canvas.width*0.28, canvas.height*0.4, '#ff8844', 6); 
            b.log.unshift(`${DINOS[b.ek].name} bites YOU for ${data.dmg}!`);
        } else {
            if (b.cpShield >= data.dmg) {
                b.cpShield -= data.dmg; 
            } else { 
                b.cpHp -= (data.dmg - b.cpShield); 
                b.cpShield = 0; 
            } 
            b.cshake = 18; 
            b.dnums.push({x: canvas.width*0.28, y: canvas.height*0.65, val: data.dmg, col: '#ff8844', life: 60}); 
            spawnParticles(canvas.width*0.28, canvas.height*0.65, '#ff8844', 6); 
            b.log.unshift(`${DINOS[b.ek].name} bites ${b.cpName} for ${data.dmg}!`);
        }
        
        if(b.log.length > 5) b.log.pop();
        
        setTimeout(() => {
            b.anim = false;
            if(b.php <= 0 && b.cpHp <= 0){ 
                const pen = Math.floor(G.wheat * 0.2); 
                b.log.unshift(`💀 Team Defeated! Lost ${pen} Buckets.`); 
                b.res = 'lose'; 
            } else { 
                b.turn = (b.cpHp > 0) ? 'partner' : 'player'; 
            }
        }, 420);
    }
    else if (data.action === 'run') { 
        b.log.unshift(`${b.cpName} fled the battle!`); 
        b.res = 'win'; 
    }
}

function enemyTurn(){
    const b = G.battle; 
    if(b.res) return; 
    
    b.anim = true; 
    const en = DINOS[b.ek];
    
    let dmg = Math.max(1, Math.floor(en.atk * R_MULT[en.rarity]) + Math.floor(Math.random()*10)-5);
    
    if(b.ek === 'megalodon') dmg = 125 + Math.floor(Math.random() * 20); 
    else if(b.ek === 'indominus') dmg = 175 + Math.floor(Math.random() * 50);

    if (b.isCoop) {
        // 1.55x Co-op Enemy Damage Buff!
        dmg = Math.floor(dmg * 1.55); 
        
        const canHitPlayer = b.php > 0; 
        const canHitPartner = b.cpHp > 0; 
        let targetLocal = true; 
        
        if (canHitPlayer && canHitPartner) {
            targetLocal = Math.random() > 0.5; 
        } else if (canHitPartner) {
            targetLocal = false;
        }
        
        if (targetLocal) {
            if (b.php_shield >= dmg) {
                b.php_shield -= dmg; 
            } else { 
                b.php -= (dmg - b.php_shield); 
                b.php_shield = 0; 
            } 
            G.playerHp = Math.max(0, b.php); 
            G.playerShield = b.php_shield; 
            b.pshake = 18; 
            b.dnums.push({x: canvas.width*0.28, y: canvas.height*0.4, val: dmg, col: '#ff8844', life: 60}); 
            spawnParticles(canvas.width*0.28, canvas.height*0.4, '#ff8844', 6); 
            b.log.unshift(`${en.name} bites YOU for ${dmg}!`);
        } else {
            if (b.cpShield >= dmg) {
                b.cpShield -= dmg; 
            } else { 
                b.cpHp -= (data.dmg - b.cpShield); 
                b.cpShield = 0; 
            } 
            b.cshake = 18; 
            b.dnums.push({x: canvas.width*0.28, y: canvas.height*0.65, val: dmg, col: '#ff8844', life: 60}); 
            spawnParticles(canvas.width*0.28, canvas.height*0.65, '#ff8844', 6); 
            b.log.unshift(`${en.name} bites ${b.cpName} for ${dmg}!`);
        }
        
        if(b.log.length > 5) b.log.pop();
        sendCoop({ type: 'coop_battle_action', target: G.coop.partnerId, action: 'enemy_attack', dmg: dmg, targetIsBattleHost: targetLocal });

        setTimeout(() => {
            b.anim = false;
            if(b.php <= 0 && b.cpHp <= 0){
                const pen = Math.floor(G.wheat * 0.2); 
                G.wheat = Math.max(0, G.wheat - pen); 
                if (G.coop.partnerId) sendCoop({ type: 'coop_wheat', target: G.coop.partnerId, wheat: G.wheat });
                b.log.unshift(`💀 Team Defeated! Lost ${pen} Buckets.`); 
                b.res = 'lose';
            } else { 
                b.turn = b.php > 0 ? 'player' : 'partner'; 
            }
        }, 420); 
        return;
    }

    if (b.php_shield >= dmg) {
        b.php_shield -= dmg; 
    } else { 
        b.php -= (dmg - b.php_shield); 
        b.php_shield = 0; 
    } 
    G.playerHp = Math.max(0, b.php); 
    G.playerShield = b.php_shield;
    
    b.pshake = 18; 
    b.dnums.push({x: canvas.width*0.28, y: canvas.height*0.52, val: dmg, col: '#ff8844', life: 60}); 
    b.log.unshift(`${en.name} attacks for ${dmg}!`);
    
    if(b.log.length > 5) b.log.pop(); 
    spawnParticles(canvas.width*0.28, canvas.height*0.52, '#ff8844', 6);
    
    setTimeout(() => { 
        b.anim = false; 
        if(b.php <= 0){ 
            const pen = Math.floor(G.wheat * 0.2);
            G.wheat = Math.max(0, G.wheat - pen); 
            b.log.unshift(`💀 Defeated! Lost ${pen} Buckets.`);
            b.res = 'lose'; 
        } else {
            b.turn = 'player';
        } 
    }, 420);
}

function doRun() {
    const b = G.battle;
    if(b.res || b.anim) return;
    
    if (b.isPvP) { 
        sendPvP({ type: 'pvp_action', target: b.opId, sender: (G.isHost ? 'host' : G.peer.id), action: 'run' }); 
        b.log.unshift('You fled the friendly match!'); 
        setTimeout(exitBattle, 500); 
        return; 
    }
    
    if (b.isCoop) { 
        sendCoop({ type: 'coop_battle_action', target: G.coop.partnerId, action: 'run' }); 
        b.log.unshift('Team fled the battle safely!'); 
        setTimeout(exitBattle, 500); 
        return; 
    }
    
    if(Math.random() < 0.62){
        b.log.unshift('Got away safely!');
        setTimeout(exitBattle, 500);
    } else {
        b.log.unshift("Can't escape!");
        b.turn = 'enemy';
        setTimeout(enemyTurn, 350);
    }
}

function exitBattle(){
    G.state = 'world';
    
    if (G.battle.isPvP) {
        if (G.battle.php <= 0) G.playerHp = 1; 
        else G.playerHp = G.battle.php; 
        G.playerShield = G.battle.php_shield; 
        G.pvp.cd = 1800; 
    } else if (G.battle.isCoop) {
        G.playerHp = G.battle.res === 'lose' ? pMaxHp() : Math.max(0, G.battle.php);
    } else {
        G.playerHp = G.battle.res === 'lose' ? pMaxHp() : Math.max(5, G.battle.php);
    }
    
    G.lastDamageTick = G.tick; 
    G.encCd = 200;
    G.btns = [];
}

// ── SPAWNING ──
function spawnWilds(){
    G.wilds = []; 
    const keys = Object.keys(DINOS).filter(k => DINOS[k].lvl === G.level && DINOS[k].rarity !== 'Boss');
    
    for(let i=0; i<36; i++){
        let chosen = keys[0], acc = 0; 
        const tot = keys.reduce((sum, k) => sum + DINOS[k].sp, 0); 
        const rng = Math.random() * tot;
        
        for(const k of keys){
            acc += DINOS[k].sp;
            if(rng < acc){
                chosen = k;
                break;
            }
        }
        
        for(let attempt=0; attempt<20; attempt++){
            const tx = Math.floor(Math.random() * WS);
            const ty = Math.floor(Math.random() * WS);
            // Ensure no spawning on entrances (Tiles 5 & 6)
            if(worldMap[ty] && worldMap[ty][tx] !== 2 && worldMap[ty][tx] !== 5 && worldMap[ty][tx] !== 6){ 
                G.wilds.push({key: chosen, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: Math.random()*90, dx: 0, dy: 0, face: 1, isBoss: false}); 
                break; 
            }
        }
    }
}

function spawnMega(){
    const bossKey = G.level === 1 ? 'megalodon' : 'indominus';
    for(let attempt=0; attempt<300; attempt++){
        const tx = Math.floor(Math.random() * WS);
        const ty = Math.floor(Math.random() * WS); 
        const isWater = worldMap[ty] && worldMap[ty][tx] === 2;
        
        if((G.level === 1 && ((!G.megaOnLand && isWater) || (G.megaOnLand && !isWater))) || (G.level === 2 && !isWater)){ 
            G.wilds.push({key: bossKey, x: tx*TS + TS/2, y: ty*TS + TS/2, anim: 0, mt: 0, dx: 0, dy: 0, face: 1, isBoss: true}); 
            return; 
        }
    }
}

spawnWilds(); 
spawnMega();

// ── UPDATE ──
function update(){
    G.tick++;
    
    // NEW: FADE ANIMATION LOGIC
    if (G.fade.active) {
        if (G.fade.phase === 'out') {
            G.fade.opacity += 0.05;
            if (G.fade.opacity >= 1) {
                G.fade.opacity = 1;
                executeZoneSwap(); 
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
    
    if (G.playerHp <= 0 && G.state === 'world') { 
        G.playerHp = pMaxHp(); 
        G.playerShield = 0; 
        G.wheat = Math.max(0, Math.floor(G.wheat * 0.9)); 
        G.player.x = WS/2 * TS; 
        G.player.y = WS/2 * TS; 
    }
    
    if(G.state === 'world' && (G.tick - G.lastDamageTick >= 120) && G.playerHp > 0 && G.playerHp < pMaxHp()){ 
        if (G.tick % 150 === 0) {
            G.playerHp = Math.min(pMaxHp(), G.playerHp + Math.max(1, Math.floor(pMaxHp() * 0.02))); 
        }
    }
    
    if(G.tick % 300 === 0 && G.state === 'world') {
        saveGame();
    }
    
    if(G.encCd > 0) G.encCd--; 
    if(G.swapCd > 0) G.swapCd--;
    
    if(G.state === 'world') {
        updateWorld(); 
    } else if(G.state === 'battle') {
        updateBattle();
    }
    
    G.particles = G.particles.filter(p => p.life > 0); 
    G.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life--;
    });
}

function updateWorld(){
    if(G.camShake > 0) G.camShake--;
    
    // Freeze movement if screen is fading
    if(G.fade.active) return; 

    const p = G.player; 
    let dx = 0, dy = 0; 
    const spd = pSpd();
    
    if(G.keys['arrowleft'] || G.keys['a'] || G.keys['ArrowLeft']) dx -= spd;
    if(G.keys['arrowright'] || G.keys['d'] || G.keys['ArrowRight']) dx += spd;
    if(G.keys['arrowup'] || G.keys['w'] || G.keys['ArrowUp']) dy -= spd;
    if(G.keys['arrowdown'] || G.keys['s'] || G.keys['ArrowDown']) dy += spd;
    
    if(G.joy.on){ 
        const jl = Math.sqrt(G.joy.dx * G.joy.dx + G.joy.dy * G.joy.dy); 
        if(jl > 12){
            dx += (G.joy.dx / jl) * spd;
            dy += (G.joy.dy / jl) * spd;
        } 
    }
    
    if(dx && dy){
        dx *= 0.707;
        dy *= 0.707;
    }
    
    const nx = p.x + dx;
    const ny = p.y + dy; 
    const ttx = Math.floor(nx / TS);
    const tty = Math.floor(ny / TS); 
    const canSwim = ['spinosaurus','pterodactyl','megalodon','mosasaurus'].includes(p.dk);
    
    if(ttx >= 0 && tty >= 0 && ttx < WS && tty < WS){ 
        
        // NEW: Check if touching Cave Entrance
        if (worldMap[tty][ttx] === 5) {
            G.overworldX = p.x;
            G.overworldY = p.y - TS * 2; 
            if(G.coop.partnerId) sendCoop({ type: 'coop_zone', room: 'cave' });
            loadZone('cave', WS/2*TS, WS/2*TS); 
            return;
        }
        
        // NEW: Check if touching Mountain Entrance
        if (worldMap[tty][ttx] === 6) {
            if (!G.story.mountainKey) {
                p.x = p.x - dx * 2; 
                p.y = p.y - dy * 2; 
                if(G.tick % 60 === 0) addChatMessage('System', 'The Mountain is locked. Defeat the Cave Spider to get the key.');
                return;
            } else {
                G.overworldX = p.x;
                G.overworldY = p.y + TS * 2; 
                if(G.coop.partnerId) sendCoop({ type: 'coop_zone', room: 'mountain' });
                loadZone('mountain', WS/2*TS, WS/2*TS); 
                return;
            }
        }
        
        if(worldMap[tty][ttx] !== 2 || canSwim){
            p.x = nx;
            p.y = ny;
        } 
    }
    
    p.x = Math.max(TS, Math.min((WS-1)*TS, p.x)); 
    p.y = Math.max(TS, Math.min((WS-1)*TS, p.y));
    
    p.moving = !!(dx || dy); 
    if(p.moving){
        p.anim++;
        if(dx > 0) p.face = 1;
        else if(dx < 0) p.face = -1;
    }
    
    G.cam.x += (p.x - canvas.width/2 - G.cam.x) * LERP; 
    G.cam.y += (p.y - canvas.height/2 - G.cam.y) * LERP;
    G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width, G.cam.x)); 
    G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.cam.y));

    const curTx = Math.floor(p.x / TS);
    const curTy = Math.floor(p.y / TS);
    
    if(curTx >= 0 && curTy >= 0 && curTx < WS && curTy < WS && worldMap[curTy][curTx] === 4) {
        if(G.tick % 30 === 0) { 
            let dmg = 15; 
            if (G.playerShield >= dmg) {
                G.playerShield -= dmg; 
            } else { 
                G.playerHp -= (dmg - G.playerShield); 
                G.playerShield = 0; 
            } 
            G.lastDamageTick = G.tick; 
            spawnParticles(p.x, p.y, '#ff4400', 8); 
        }
    }

    if(G.level === 1 && G.room === 'main'){
        G.megaTimer--; 
        if(G.megaTimer <= 0){ 
            G.megaOnLand = !G.megaOnLand; 
            G.megaTimer = 3600; 
            G.wilds = G.wilds.filter(w => w.key !== 'megalodon'); 
            spawnMega(); 
        }
    }
    
    if(G.level === 2){
        if(G.volcanoActive <= 0){ 
            G.volcanoTimer--; 
            if(G.volcanoTimer <= 0){ 
                G.volcanoActive = 1200; 
                G.camShake = 60; 
                G.volcanoTimer = 10800; 
            }
        } else { 
            G.volcanoActive--; 
            if(G.volcanoActive % 40 === 0){ 
                G.hazards.push({x: p.x + (Math.random()-0.5)*500, y: p.y + (Math.random()-0.5)*500, life: 75, maxLife: 75}); 
            } 
        }
        
        for(let i = G.hazards.length - 1; i >= 0; i--){
            const h = G.hazards[i]; 
            h.life--;
            if(h.life <= 0){
                if(Math.hypot(p.x - h.x, p.y - h.y) < 45) { 
                    let dmg = 25; 
                    if (G.playerShield >= dmg) {
                        G.playerShield -= dmg; 
                    } else { 
                        G.playerHp -= (dmg - G.playerShield); 
                        G.playerShield = 0; 
                    } 
                    G.lastDamageTick = G.tick; 
                    spawnParticles(p.x, p.y, '#ff0000', 10); 
                }
                spawnParticles(h.x, h.y, '#ff6600', 25); 
                G.hazards.splice(i, 1);
            }
        }
    }
    
    for(const w of G.wilds){
        w.mt--; 
        if(w.mt <= 0){ 
            w.mt = 50 + Math.random()*100; 
            const a = Math.random() * Math.PI * 2;
            const wsp = DINOS[w.key].spd * 0.4; 
            w.dx = Math.cos(a) * wsp;
            w.dy = Math.sin(a) * wsp; 
        }
        w.x += w.dx;
        w.y += w.dy; 
        if(w.dx !== 0) w.face = w.dx > 0 ? 1 : -1; 
        
        w.x = Math.max(TS, Math.min((WS-1)*TS, w.x)); 
        w.y = Math.max(TS, Math.min((WS-1)*TS, w.y)); 
        w.anim++;
        
        const wtx = Math.floor(w.x / TS);
        const wty = Math.floor(w.y / TS); 
        const wCanSwim = ['spinosaurus','pterodactyl','megalodon','mosasaurus'].includes(w.key);
        if(wtx >= 0 && wty >= 0 && wtx < WS && wty < WS && worldMap[wty][wtx] === 2 && !wCanSwim){ 
            w.x -= w.dx || 0; 
            w.y -= w.dy || 0; 
            w.dx = w.dy = 0; 
        }
    }
    
    if(G.encCd <= 0){
        for(let i=0; i<G.wilds.length; i++){
            const w = G.wilds[i]; 
            const dist = Math.hypot(p.x - w.x, p.y - w.y); 
            const trigger = 38 + DINOS[w.key].sz;
            
            if(dist < trigger){
                const wasBoss = w.isBoss; 
                G.wilds.splice(i, 1); 
                startBattle(w.key, wasBoss);
                
                if(wasBoss) {
                    setTimeout(spawnMega, 90000);
                } else {
                    setTimeout(()=>{
                        const ks2 = Object.keys(DINOS).filter(k => DINOS[k].lvl === G.level && DINOS[k].rarity !== 'Boss');
                        let ch = ks2[0];
                        let ac2 = 0; 
                        const tot2 = ks2.reduce((sum, k) => sum + DINOS[k].sp, 0); 
                        const r2 = Math.random() * tot2;
                        
                        for(const k of ks2){
                            ac2 += DINOS[k].sp;
                            if(r2 < ac2){
                                ch = k;
                                break;
                            }
                        }
                        
                        for(let att=0; att<20; att++){ 
                            const tx2 = Math.floor(Math.random() * WS);
                            const ty2 = Math.floor(Math.random() * WS); 
                            if(worldMap[ty2] && worldMap[ty2][tx2] !== 2 && worldMap[ty2][tx2] !== 5 && worldMap[ty2][tx2] !== 6){ 
                                G.wilds.push({key: ch, x: tx2*TS + TS/2, y: ty2*TS + TS/2, anim: 0, mt: 60, dx: 0, dy: 0, face: 1, isBoss: false}); 
                                break; 
                            } 
                        }
                    }, 5000); 
                }
                break;
            }
        }
    }

    let closeId = null;
    for(let id in G.otherPlayers) {
        if(!G.isHost && G.peer && id === G.peer.id) continue;
        let op = G.otherPlayers[id]; 
        if(!op) continue;
        if(Math.hypot(p.x - op.x, p.y - op.y) < 60) { 
            closeId = id; 
            break; 
        }
    }
    G.pvp.closeId = closeId;
    if (G.pvp.reqFrom && G.pvp.closeId !== G.pvp.reqFrom) G.pvp.reqFrom = null; 
    if (G.pvp.reqTo && G.pvp.closeId !== G.pvp.reqTo) G.pvp.reqTo = null; 
    if (G.coop.reqFrom && G.pvp.closeId !== G.coop.reqFrom) G.coop.reqFrom = null; 
    if (G.coop.reqTo && G.pvp.closeId !== G.coop.reqTo) G.coop.reqTo = null; 
}

function updateBattle(){
    const b = G.battle; 
    if(b.eshake > 0) b.eshake--; 
    if(b.pshake > 0) b.pshake--; 
    if(b.cshake > 0) b.cshake--;
    b.dnums = b.dnums.filter(dn => {
        dn.life--;
        return dn.life > 0;
    });
}

// ── INPUT, CHEATS & GAME START ──
function doCheatPrompt(){
    const code = window.prompt("Secret Developer Console:\nEnter command:");
    if(!code) return; 
    const c = code.trim().toLowerCase();
    
    if(c === 'dev_money') { 
        G.wheat += 999999; 
        G.cheatsActive = true; 
        addChatMessage('System', "Cheat Activated: +999,999 Buckets"); 
    } 
    else if(c === 'dev_dinos') { 
        for(let k in DINOS) {
            G.discovered[k] = true; 
        }
        G.cheatsActive = true; 
        addChatMessage('System', "Cheat Activated: All Dinos Unlocked"); 
    } 
    else if(c === 'dev_god') { 
        G.player.upg.hp = 99; 
        G.player.upg.atk = 99; 
        G.player.upg.spd = 99; 
        G.playerHp = pMaxHp(); 
        G.cheatsActive = true; 
        addChatMessage('System', "Cheat Activated: GOD MODE"); 
    } 
    else if(c === 'dev_lvl2') { 
        G.level = 2; 
        G.discovered = {utahraptor: true}; 
        G.player.dk = 'utahraptor'; 
        generateWorld(); 
        spawnWilds(); 
        spawnMega(); 
        G.playerHp = pMaxHp(); 
        G.volcanoTimer = 10800; 
        G.volcanoActive = 0; 
        G.hazards = []; 
        G.cheatsActive = true; 
        addChatMessage('System', "Cheat Activated: Teleported to Volcano Map"); 
    }
}

window.addEventListener('keydown', e => {
    G.keys[e.key] = true;
    G.keys[e.key.toLowerCase()] = true;
    
    if(G.state === 'intro') { 
        if(!window.activeSave) startGame(false); 
    }
    
    if(e.key === '`' || e.key === '~') doCheatPrompt();
    
    if (e.key === '/' && document.getElementById('chatBox').style.display !== 'flex' && G.state === 'world') { 
        e.preventDefault(); 
        document.getElementById('chatBox').style.display = 'flex'; 
        document.getElementById('chatInp').focus(); 
        document.getElementById('chatMessages').style.pointerEvents = 'auto'; 
        wakeChat(); 
    }
});

window.addEventListener('keyup', e => { 
    G.keys[e.key] = false;
    G.keys[e.key.toLowerCase()] = false; 
});

canvas.addEventListener('mousemove', e => { 
    const r = canvas.getBoundingClientRect(); 
    G.mx = e.clientX - r.left;
    G.my = e.clientY - r.top; 
});

canvas.addEventListener('click', e => {
    if(document.getElementById('chatBox').style.display === 'flex' && e.clientY > 100) { 
        closeChatUI(); 
        return; 
    }
    
    const r = canvas.getBoundingClientRect(); 
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    
    if(G.state === 'intro'){ 
        for(const b of G.btns){
            if(cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h){
                b.act();
                return;
            }
        } 
        if(!window.activeSave) startGame(false); 
        return; 
    }
    
    for(const b of G.btns){
        if(cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h){
            b.act();
            return;
        }
    }
    
    if(G.state === 'world' && cx < 80 && cy < 50) { 
        doCheatPrompt(); 
        return; 
    }
});

canvas.addEventListener('touchstart', e => {
    const r = canvas.getBoundingClientRect(); 
    const t = e.touches[0]; 
    const tx = t.clientX - r.left;
    const ty = t.clientY - r.top;
    
    if(G.state === 'intro'){ 
        for(const b of G.btns){
            if(tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h){
                b.act();
                return;
            }
        } 
        if(!window.activeSave) startGame(false); 
        return; 
    }
    
    for(const b of G.btns){
        if(tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h){
            b.act();
            return;
        }
    }
    
    if(G.state === 'world' && tx < 80 && ty < 50) { 
        doCheatPrompt(); 
        return; 
    }
    
    if(G.state === 'world'){
        G.joy.on = true;
        G.joy.sx = tx;
        G.joy.sy = ty;
        G.joy.dx = 0;
        G.joy.dy = 0;
    }
}, {passive: false});

canvas.addEventListener('touchmove', e => { 
    if(!G.joy.on) return; 
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0]; 
    G.joy.dx = t.clientX - r.left - G.joy.sx; 
    G.joy.dy = t.clientY - r.top - G.joy.sy; 
}, {passive: false});

canvas.addEventListener('touchend', e => { 
    G.joy.on = false;
    G.joy.dx = 0;
    G.joy.dy = 0; 
}, {passive: false});

function startGame(isNew = false) {
    if (!isNew && window.activeSave) {
        const s = window.activeSave;
        G.level = s.level || 1; 
        G.wheat = s.wheat || 60; 
        G.player = s.player;
        if (!G.player.oc) G.player.oc = {body:'#40c4ff',legs:'#1a347a',head:'#ffd700',neck:'#ffd700',tail:'#2a5acc'};
        G.playerHp = s.playerHp; 
        G.playerShield = s.playerShield || 0; 
        G.discovered = s.discovered;
        G.volcanoTimer = s.volcanoTimer || 10800; 
        G.megaTimer = s.megaTimer || 3600; 
        G.megaOnLand = s.megaOnLand || false;
        
        window.activeSave = null;
        G.room = 'main';
        generateWorld(); 
        spawnWilds(); 
        spawnMega();
        
        G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width, G.player.x - canvas.width/2)); 
        G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.player.y - canvas.height/2));
        
        G.coop = { partnerId: null, partnerName: '', reqTo: null, reqFrom: null, reqFromName: '' }; 
        G.soloStash = null;
    } else if (isNew) {
        G.level = 1; 
        G.wheat = 60; 
        G.playerHp = 80; 
        G.playerShield = 0; 
        G.discovered = {raptor: true};
        G.player = {
            x: WS/2 * TS, 
            y: WS/2 * TS, 
            dk: 'raptor', 
            face: 1, 
            anim: 0, 
            moving: false, 
            upg: {hp:0, atk:0, spd:0}, 
            hat: 'bucket', 
            oc: {body:'#40c4ff',legs:'#1a347a',head:'#ffd700',neck:'#ffd700',tail:'#2a5acc'}
        };
        G.volcanoTimer = 10800; 
        G.megaTimer = 3600; 
        G.megaOnLand = false; 
        G.cheatsActive = false;
        
        G.room = 'main';
        G.coop = { partnerId: null, partnerName: '', reqTo: null, reqFrom: null, reqFromName: '' }; 
        G.soloStash = null;
        
        generateWorld(); 
        spawnWilds(); 
        spawnMega();
        
        G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width, G.player.x - canvas.width/2)); 
        G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.player.y - canvas.height/2));
    } else {
        G.playerHp = pMaxHp();
        G.room = 'main';
        G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width, G.player.x - canvas.width/2)); 
        G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.player.y - canvas.height/2));
    }
    G.state = 'world';
}

function loop(){
    update();
    render();
    requestAnimationFrame(loop);
}
loop();
