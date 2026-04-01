// ── SAVE & LOAD SYSTEM ──
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
    } catch (e) { console.error("Save load failed", e); }
}
loadSaveData();

function saveGame() {
    if (G.state === 'intro') return;
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
    } catch (e) { console.error("Save error", e); }
}

window.addEventListener('beforeunload', () => {
    if(G.state === 'world' || G.state === 'shop' || G.state === 'index' || G.state === 'customize') saveGame();
});

// ── WORLD GEN ──
function noise(x,y){
    return Math.sin(x*0.31)*Math.cos(y*0.29)+Math.sin(x*0.73+y*0.41)*0.5+Math.cos(x*0.17-y*0.23)*0.8+Math.sin((x+y)*0.11)*0.3;
}

function generateWorld(){
    for(let y=0;y<WS;y++){
        worldMap[y]=[];tileClr[y]=[];
        for(let x=0;x<WS;x++){
            const cx=x-WS/2,cy=y-WS/2;
            const dist=Math.sqrt(cx*cx+cy*cy)/(WS*0.46);
            const isL2 = G.level === 2;
            const lx = x + (isL2 ? 500 : 0);
            const ly = y + (isL2 ? 500 : 0);
            const n=noise(lx,ly);
            let t=0;
            if(dist>0.92) t=2;
            else if(dist>0.75&&n<0.1) t=2;
            else if(dist>0.62&&n<-0.6) t=2;
            else if(n>0.9&&dist<0.68) t=1;
            else if(dist>0.66&&dist<0.76) t=3;

            if(isL2) {
                const vcx = WS * 0.62, vcy = WS * 0.38;
                const craterDist = Math.hypot(x - vcx, y - vcy);
                const spawnDist = Math.hypot(x - WS/2, y - WS/2);
                if(spawnDist > 4) {
                    if(craterDist < 7) {
                        t = 4; 
                    } else if(craterDist < 14 && t !== 2) {
                        t = 1; 
                    } else if(t === 0) {
                        const lavaRiver = Math.sin(lx*0.45 + noise(lx*0.9, ly*0.7)*2.5) * Math.cos(ly*0.38);
                        if(noise(lx*3.5, ly*3.5) > 0.5 || lavaRiver > 0.78) {
                            t = 4;
                        }
                    }
                }
            }

            worldMap[y][x]=t;
            const gCol = isL2 ? VGCLR : GCLR;
            const fCol = isL2 ? VFCLR : FCLR;
            const wCol = isL2 ? VWCLR : WCLR;
            const sCol = isL2 ? VSCLR : SCLR;

            if(t===0) tileClr[y][x]=gCol[Math.abs(x*3+y*7)%gCol.length];
            else if(t===1) tileClr[y][x]=fCol[Math.abs(x*5+y*3)%fCol.length];
            else if(t===2) tileClr[y][x]=wCol[Math.abs(x*7+y*11)%wCol.length];
            else if(t===3) tileClr[y][x]=sCol[Math.abs(x*11+y*5)%sCol.length];
            else if(t===4) tileClr[y][x]=VRED[Math.abs(x*7+y*3)%VRED.length];
        }
    }
}
generateWorld();

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
        isPvP: true, opId: opId, ek: opStats.dk, ehp: opStats.hp, emhp: opStats.mhp,
        eshield: opStats.shield, emshield: opStats.mshield, ename: opStats.name,
        eoc: opStats.oc, ehat: opStats.hat, eatk: opStats.atk, espd: opStats.spd,
        php: G.playerHp, pmhp: pMaxHp(), php_shield: G.playerShield, pmhp_shield: Math.floor(pMaxHp()*0.4),
        turn: isMyTurn ? 'player' : 'enemy', 
        log:[`⚔️ Friendly PvP with ${opStats.name}!`],
        anim: false, res: null, eshake: 0, pshake: 0, dnums:[]
    };
    G.btns =[];
}

function startBattle(ek,isBoss){
    const en=DINOS[ek];
    G.state='battle';
    Object.assign(G.battle,{
        isPvP:false, opId:null, ek, ehp: Math.floor(en.hp * R_MULT[en.rarity]), emhp: Math.floor(en.hp * R_MULT[en.rarity]), eshield:0, emshield:0,
        php:G.playerHp, pmhp:pMaxHp(), php_shield:G.playerShield, pmhp_shield:Math.floor(pMaxHp()*0.4),
        turn:'player',log:[isBoss?`⚠️ BOSS: ${en.name} appears!`:`Wild ${en.name} appeared!`],
        anim:false,res:null,eshake:0,pshake:0,dnums:[],isBoss:!!isBoss
    });
    G.btns=[];
}

function doAttack(){
    const b=G.battle;
    if(b.turn!=='player'||b.anim||b.res) return;
    b.anim=true;
    const dmg = pAtk();

    if (b.isPvP) {
        sendPvP({ type: 'pvp_action', target: b.opId, sender: (G.isHost ? 'host' : G.peer.id), action: 'attack', dmg: dmg });
        
        if (b.eshield >= dmg) { b.eshield -= dmg; }
        else { b.ehp -= (dmg - b.eshield); b.eshield = 0; }
        b.ehp = Math.max(0, b.ehp);
        
        b.eshake=20;
        b.dnums.push({x:canvas.width*0.67,y:canvas.height*0.37,val:dmg,col:'#ff4444',life:60});
        b.log.unshift(`You attack for ${dmg} dmg!`);if(b.log.length>5)b.log.pop();
        spawnParticles(canvas.width*0.67,canvas.height*0.37,'#ff4444',6);
        
        if(b.ehp <= 0){
            setTimeout(()=>{
                b.log.unshift(`🏆 You won the friendly match!`);
                b.res = 'win';
                b.anim = false;
                spawnParticles(canvas.width*0.67, canvas.height*0.37, '#55ddff', 16);
            }, 500);
        } else {
            setTimeout(()=>{ b.anim=false; b.turn='enemy'; }, 520);
        }
        return;
    }

    b.ehp=Math.max(0,b.ehp-dmg);b.eshake=20;
    b.dnums.push({x:canvas.width*0.67,y:canvas.height*0.37,val:dmg,col:'#ff4444',life:60});
    b.log.unshift(`You attack for ${dmg} dmg!`);if(b.log.length>5)b.log.pop();
    spawnParticles(canvas.width*0.67,canvas.height*0.37,'#ff4444',6);
    if(b.ehp<=0){
        setTimeout(()=>{
            const rew=DINOS[b.ek].rw*(b.isBoss?3:1);G.wheat+=rew;
            b.log.unshift(`🪣 Won ${rew} Buckets!`);
            if(!G.discovered[b.ek]){G.discovered[b.ek]=true;b.log.unshift(`📘 ${DINOS[b.ek].name} added to Index!`);}
            if(b.ek === 'megalodon' && G.level === 1){
                b.res = 'level2';
            } else {
                b.res='win';
            }
            b.anim=false;
            spawnParticles(canvas.width*0.67,canvas.height*0.37,'#55ddff',16);
        },500);
        return;
    }
    setTimeout(()=>{b.anim=false;b.turn='enemy';enemyTurn();},520);
}

function enemyTurn(){
    const b=G.battle;if(b.res) return;
    b.anim=true;
    const en=DINOS[b.ek];
    let dmg = Math.max(1, Math.floor(en.atk * R_MULT[en.rarity]) + Math.floor(Math.random()*10)-5);
    if(b.ek === 'megalodon') dmg = 125 + Math.floor(Math.random() * 20); 
    else if(b.ek === 'indominus') dmg = 175 + Math.floor(Math.random() * 50);

    if (b.php_shield >= dmg) {
        b.php_shield -= dmg;
    } else {
        b.php -= (dmg - b.php_shield);
        b.php_shield = 0;
    }
    G.playerHp = Math.max(0, b.php);
    G.playerShield = b.php_shield;

    b.pshake=18;
    b.dnums.push({x:canvas.width*0.28,y:canvas.height*0.52,val:dmg,col:'#ff8844',life:60});
    b.log.unshift(`${en.name} attacks for ${dmg}!`);if(b.log.length>5)b.log.pop();
    spawnParticles(canvas.width*0.28,canvas.height*0.52,'#ff8844',6);
    setTimeout(()=>{
        b.anim=false;
        if(b.php<=0){
            const pen=Math.floor(G.wheat*0.2);G.wheat=Math.max(0,G.wheat-pen);
            b.log.unshift(`💀 Defeated! Lost ${pen} Buckets.`);b.res='lose';
        } else {b.turn='player';}
    },420);
}

function doRun(){
    const b=G.battle;if(b.res||b.anim) return;

    if (b.isPvP) {
        sendPvP({ type: 'pvp_action', target: b.opId, sender: (G.isHost ? 'host' : G.peer.id), action: 'run' });
        b.log.unshift('You fled the friendly match!');
        setTimeout(exitBattle, 500);
        return;
    }

    if(Math.random()<0.62){b.log.unshift('Got away safely!');setTimeout(exitBattle,500);}
    else{b.log.unshift("Can't escape!");b.turn='enemy';setTimeout(enemyTurn,350);}
}

function exitBattle(){
    G.state='world';
    if (G.battle.isPvP) {
        if (G.battle.php <= 0) G.playerHp = 1; 
        else G.playerHp = G.battle.php;
        G.playerShield = G.battle.php_shield;
        G.pvp.cd = 1800; 
    } else {
        G.playerHp = G.battle.res === 'lose' ? pMaxHp() : Math.max(5, G.battle.php);
    }
    G.lastDamageTick = G.tick; 
    G.encCd=200;G.btns=[];
}

// ── SPAWNING ──
function spawnWilds(){
    G.wilds =[];
    const keys=Object.keys(DINOS).filter(k=>DINOS[k].lvl===G.level && DINOS[k].rarity!=='Boss');
    for(let i=0;i<36;i++){
        let chosen=keys[0], acc=0;
        const tot=keys.reduce((sum,k)=>sum+DINOS[k].sp, 0);
        const rng=Math.random()*tot;
        for(const k of keys){acc+=DINOS[k].sp;if(rng<acc){chosen=k;break;}}
        for(let attempt=0;attempt<20;attempt++){
            const tx=Math.floor(Math.random()*WS), ty=Math.floor(Math.random()*WS);
            if(worldMap[ty]&&worldMap[ty][tx]!==2){
                G.wilds.push({key:chosen,x:tx*TS+TS/2,y:ty*TS+TS/2,anim:0,mt:Math.random()*90,dx:0,dy:0,face:1,isBoss:false});
                break;
            }
        }
    }
}
function spawnMega(){
    const bossKey = G.level === 1 ? 'megalodon' : 'indominus';
    for(let attempt=0;attempt<300;attempt++){
        const tx=Math.floor(Math.random()*WS), ty=Math.floor(Math.random()*WS);
        const isWater = worldMap[ty]&&worldMap[ty][tx]===2;
        if((G.level===1 && ((!G.megaOnLand && isWater) || (G.megaOnLand && !isWater))) || (G.level===2 && !isWater)){
            G.wilds.push({key:bossKey,x:tx*TS+TS/2,y:ty*TS+TS/2,anim:0,mt:0,dx:0,dy:0,face:1,isBoss:true});
            return;
        }
    }
}
spawnWilds();
spawnMega();

// ── UPDATE ──
function update(){
    G.tick++;

    if (G.playerHp <= 0 && G.state === 'world') {
        G.playerHp = pMaxHp();
        G.playerShield = 0;
        G.wheat = Math.max(0, Math.floor(G.wheat * 0.9));
        G.player.x = WS/2*TS; 
        G.player.y = WS/2*TS;
    }

    if(G.state === 'world' && (G.tick - G.lastDamageTick >= 120) && G.playerHp > 0 && G.playerHp < pMaxHp()){
        if (G.tick % 150 === 0) {
            G.playerHp = Math.min(pMaxHp(), G.playerHp + Math.max(1, Math.floor(pMaxHp() * 0.02)));
        }
    }

    if(G.tick % 300 === 0 && G.state === 'world') saveGame();
    if(G.encCd>0) G.encCd--;
    if(G.swapCd>0) G.swapCd--;
    if(G.state==='world') updateWorld();
    else if(G.state==='battle') updateBattle();
    G.particles=G.particles.filter(p=>p.life>0);
    G.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.life--;});
}

function updateWorld(){
    if(G.camShake > 0) G.camShake--;
    const p=G.player;
    let dx=0,dy=0;
    const spd=pSpd();
    if(G.keys['arrowleft']||G.keys['a']||G.keys['ArrowLeft']) dx-=spd;
    if(G.keys['arrowright']||G.keys['d']||G.keys['ArrowRight']) dx+=spd;
    if(G.keys['arrowup']||G.keys['w']||G.keys['ArrowUp']) dy-=spd;
    if(G.keys['arrowdown']||G.keys['s']||G.keys['ArrowDown']) dy+=spd;
    if(G.joy.on){
        const jl=Math.sqrt(G.joy.dx*G.joy.dx+G.joy.dy*G.joy.dy);
        if(jl>12){dx+=(G.joy.dx/jl)*spd;dy+=(G.joy.dy/jl)*spd;}
    }
    if(dx&&dy){dx*=0.707;dy*=0.707;}
    const nx=p.x+dx, ny=p.y+dy;
    const ttx=Math.floor(nx/TS), tty=Math.floor(ny/TS);
    const canSwim=['spinosaurus','pterodactyl','megalodon','mosasaurus'].includes(p.dk);
    if(ttx>=0&&tty>=0&&ttx<WS&&tty<WS){
        if(worldMap[tty][ttx]!==2||canSwim){p.x=nx;p.y=ny;}
    }
    p.x=Math.max(TS,Math.min((WS-1)*TS,p.x));
    p.y=Math.max(TS,Math.min((WS-1)*TS,p.y));
    p.moving=!!(dx||dy);
    if(p.moving){p.anim++;if(dx>0)p.face=1;else if(dx<0)p.face=-1;}
    const camTx=p.x-canvas.width/2, camTy=p.y-canvas.height/2;
    G.cam.x+=(camTx-G.cam.x)*LERP;
    G.cam.y+=(camTy-G.cam.y)*LERP;
    G.cam.x=Math.max(0,Math.min(WS*TS-canvas.width,G.cam.x));
    G.cam.y=Math.max(0,Math.min(WS*TS-canvas.height,G.cam.y));

    const curTx = Math.floor(p.x/TS), curTy = Math.floor(p.y/TS);
    if(curTx>=0 && curTy>=0 && curTx<WS && curTy<WS && worldMap[curTy][curTx] === 4) {
        if(G.tick % 30 === 0) {
            let dmg = 15;
            if (G.playerShield >= dmg) G.playerShield -= dmg;
            else { G.playerHp -= (dmg - G.playerShield); G.playerShield = 0; }
            G.lastDamageTick = G.tick;
            spawnParticles(p.x, p.y, '#ff4400', 8);
        }
    }

    if(G.level === 1){
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
        for(let i=G.hazards.length-1; i>=0; i--){
            const h = G.hazards[i];
            h.life--;
            if(h.life <= 0){
                if(Math.hypot(p.x - h.x, p.y - h.y) < 45) {
                    let dmg = 25;
                    if (G.playerShield >= dmg) G.playerShield -= dmg;
                    else { G.playerHp -= (dmg - G.playerShield); G.playerShield = 0; }
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
        if(w.mt<=0){
            w.mt=50+Math.random()*100;
            const a=Math.random()*Math.PI*2, wsp=DINOS[w.key].spd*0.4;
            w.dx=Math.cos(a)*wsp;w.dy=Math.sin(a)*wsp;
        }
        w.x+=w.dx;w.y+=w.dy;
        if(w.dx!==0) w.face=w.dx>0?1:-1;
        w.x=Math.max(TS,Math.min((WS-1)*TS,w.x));
        w.y=Math.max(TS,Math.min((WS-1)*TS,w.y));
        w.anim++;
        const wtx=Math.floor(w.x/TS), wty=Math.floor(w.y/TS);
        const wCanSwim =['spinosaurus','pterodactyl','megalodon','mosasaurus'].includes(w.key);
        if(wtx>=0&&wty>=0&&wtx<WS&&wty<WS && worldMap[wty][wtx]===2 && !wCanSwim){
            w.x -= w.dx || 0; w.y -= w.dy || 0;
            w.dx = w.dy = 0;
        }
    }
    if(G.encCd<=0){
        for(let i=0;i<G.wilds.length;i++){
            const w=G.wilds[i];
            const dist=Math.hypot(p.x-w.x,p.y-w.y);
            const trigger=38+DINOS[w.key].sz;
            if(dist<trigger){
                const wasBoss=w.isBoss;
                G.wilds.splice(i,1);
                startBattle(w.key,wasBoss);
                if(wasBoss) setTimeout(spawnMega,90000);
                else setTimeout(()=>{
                    const ks2=Object.keys(DINOS).filter(k=>DINOS[k].lvl===G.level && DINOS[k].rarity!=='Boss');
                    let ch=ks2[0],ac2=0;
                    const tot2=ks2.reduce((sum,k)=>sum+DINOS[k].sp, 0);
                    const r2=Math.random()*tot2;
                    for(const k of ks2){ac2+=DINOS[k].sp;if(r2<ac2){ch=k;break;}}
                    for(let att=0;att<20;att++){
                        const tx2=Math.floor(Math.random()*WS),ty2=Math.floor(Math.random()*WS);
                        if(worldMap[ty2]&&worldMap[ty2][tx2]!==2){
                            G.wilds.push({key:ch,x:tx2*TS+TS/2,y:ty2*TS+TS/2,anim:0,mt:60,dx:0,dy:0,face:1,isBoss:false});
                            break;
                        }
                    }
                },5000);
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
            closeId = id; break;
        }
    }
    G.pvp.closeId = closeId;

    if (G.pvp.reqFrom && G.pvp.closeId !== G.pvp.reqFrom) G.pvp.reqFrom = null; 
    if (G.pvp.reqTo && G.pvp.closeId !== G.pvp.reqTo) G.pvp.reqTo = null; 
}

function updateBattle(){
    const b=G.battle;
    if(b.eshake>0) b.eshake--;
    if(b.pshake>0) b.pshake--;
    b.dnums=b.dnums.filter(dn=>{dn.life--;return dn.life>0;});
}

// ── MAIN RENDER LOOP ──
function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(G.state==='intro'){drawIntro();return;}
    if(G.state==='world'){
        ctx.save();
        if(G.camShake > 0) ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
        drawWorld();
        drawWilds();
        drawPlayer();

        for (let id in G.otherPlayers) {
            if (!G.isHost && G.peer && id === G.peer.id) continue; 
            const op = G.otherPlayers[id];
            if (!op) continue;

            const sx = op.x - G.cam.x;
            const sy = op.y - G.cam.y;
            if (sx > -100 && sx < canvas.width + 100 && sy > -100 && sy < canvas.height + 100) {
                drawDino(op.dk, sx, sy, op.face, op.anim, 1.25, 0.75, op.oc); 
                const headOff = DINOS[op.dk].sz * 1.25 * 0.55;
                const bob = Math.sin(op.anim * 0.18) * 2.5;
                drawHat(op.hat || 'bucket', sx, sy - headOff + bob - 2, 1.1);
                ctx.fillStyle='#aaddff'; ctx.font='bold 12px Courier New'; ctx.textAlign='center';
                ctx.fillText(op.name || 'Player', sx, sy - DINOS[op.dk].sz - 25);
            }
        }

        drawHazards();
        updateDrawParticles();
        ctx.restore();
        if(G.level===2 && G.volcanoActive > 0){
            ctx.fillStyle = 'rgba(255, 40, 0, 0.15)';
            ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#ff4444'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
            ctx.font = 'bold 22px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(`🌋 VOLCANO ERUPTION! DODGE FALLING ROCKS! ${Math.ceil(G.volcanoActive/60)}s`, canvas.width/2, 60);
            ctx.shadowBlur = 0;
        }
        drawHUD();
        if(G.joy.on){
            const jx=G.joy.sx,jy=G.joy.sy;
            ctx.fillStyle='rgba(255,255,255,0.12)';ctx.beginPath();ctx.arc(jx,jy,52,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='rgba(255,255,255,0.45)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(jx,jy,52,0,Math.PI*2);ctx.stroke();
            const jl=Math.min(42,Math.hypot(G.joy.dx,G.joy.dy));
            const ja=Math.atan2(G.joy.dy,G.joy.dx);
            ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();
            ctx.arc(jx+Math.cos(ja)*jl,jy+Math.sin(ja)*jl,26,0,Math.PI*2);ctx.fill();
        }
    } else if(G.state==='battle'){
        drawBattle();updateDrawParticles();
    } else if(G.state==='index'){
        drawIndex();
    } else if(G.state==='shop'){
        drawShop();updateDrawParticles();
    } else if(G.state==='customize'){
        drawCustomize();
    }
}

// ── INPUT & CHEATS ──
function doCheatPrompt(){
    const code = window.prompt("Secret Developer Console:\nEnter command:");
    if(!code) return;
    const c = code.trim().toLowerCase();
    if(c === 'dev_money') {
        G.wheat += 999999;
        G.cheatsActive = true;
        addChatMessage('System', "Cheat Activated: +999,999 Buckets");
    } else if(c === 'dev_dinos') {
        for(let k in DINOS) G.discovered[k] = true;
        G.cheatsActive = true;
        addChatMessage('System', "Cheat Activated: All Dinos Unlocked");
    } else if(c === 'dev_god') {
        G.player.upg.hp = 99;
        G.player.upg.atk = 99;
        G.player.upg.spd = 99;
        G.playerHp = pMaxHp();
        G.cheatsActive = true;
        addChatMessage('System', "Cheat Activated: GOD MODE");
    } else if(c === 'dev_lvl2') {
        G.level = 2; G.discovered = {utahraptor: true}; G.player.dk = 'utahraptor';
        generateWorld(); spawnWilds(); spawnMega(); G.playerHp = pMaxHp();
        G.volcanoTimer = 10800; G.volcanoActive = 0; G.hazards =[];
        G.cheatsActive = true;
        addChatMessage('System', "Cheat Activated: Teleported to Volcano Map");
    }
}

window.addEventListener('keydown',e=>{
    G.keys[e.key]=true;G.keys[e.key.toLowerCase()]=true;
    if(G.state==='intro') {
        if(!window.activeSave) startGame(false);
    }
    if(e.key==='`' || e.key==='~') doCheatPrompt();

    if (e.key === '/' && document.getElementById('chatBox').style.display !== 'flex' && G.state === 'world') {
        e.preventDefault();
        document.getElementById('chatBox').style.display = 'flex';
        document.getElementById('chatInp').focus();
        document.getElementById('chatMessages').style.pointerEvents = 'auto';
        wakeChat();
    }
});
window.addEventListener('keyup',e=>{
    G.keys[e.key]=false;G.keys[e.key.toLowerCase()]=false;
});
canvas.addEventListener('mousemove',e=>{
    const r=canvas.getBoundingClientRect();
    G.mx=e.clientX-r.left;G.my=e.clientY-r.top;
});
canvas.addEventListener('click',e=>{
    if(document.getElementById('chatBox').style.display === 'flex' && e.clientY > 100) {
        closeChatUI();
        return;
    }
    const r=canvas.getBoundingClientRect();
    const cx=e.clientX-r.left, cy=e.clientY-r.top;
    if(G.state==='intro'){
        for(const b of G.btns){if(cx>=b.x&&cx<=b.x+b.w&&cy>=b.y&&cy<=b.y+b.h){b.act();return;}}
        if(!window.activeSave) startGame(false);
        return;
    }
    for(const b of G.btns){if(cx>=b.x&&cx<=b.x+b.w&&cy>=b.y&&cy<=b.y+b.h){b.act();return;}}
    if(G.state==='world' && cx<80 && cy<50) { doCheatPrompt(); return; }
});
canvas.addEventListener('touchstart',e=>{
    const r=canvas.getBoundingClientRect();
    const t=e.touches[0];
    const tx=t.clientX-r.left, ty=t.clientY-r.top;
    if(G.state==='intro'){
        for(const b of G.btns){if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){b.act();return;}}
        if(!window.activeSave) startGame(false);
        return;
    }
    for(const b of G.btns){if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){b.act();return;}}
    if(G.state==='world' && tx<80 && ty<50) { doCheatPrompt(); return; }
    if(G.state==='world'){G.joy.on=true;G.joy.sx=tx;G.joy.sy=ty;G.joy.dx=0;G.joy.dy=0;}
},{passive:false});
canvas.addEventListener('touchmove',e=>{
    if(!G.joy.on)return;
    const r=canvas.getBoundingClientRect();const t=e.touches[0];
    G.joy.dx=t.clientX-r.left-G.joy.sx;
    G.joy.dy=t.clientY-r.top-G.joy.sy;
},{passive:false});
canvas.addEventListener('touchend',e=>{
    G.joy.on=false;G.joy.dx=0;G.joy.dy=0;
},{passive:false});

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
        generateWorld();
        spawnWilds();
        spawnMega();
        G.cam.x = Math.max(0, Math.min(WS*TS-canvas.width, G.player.x - canvas.width/2));
        G.cam.y = Math.max(0, Math.min(WS*TS-canvas.height, G.player.y - canvas.height/2));
    } else if (isNew) {
        G.level = 1;
        G.wheat = 60;
        G.player = {x:WS/2*TS, y:WS/2*TS, dk:'raptor', face:1, anim:0, moving:false, upg:{hp:0,atk:0,spd:0}, hat:'bucket', oc:{body:'#40c4ff',legs:'#1a347a',head:'#ffd700',neck:'#ffd700',tail:'#2a5acc'}};
        G.playerHp = 80;
        G.playerShield = 0;
        G.discovered = {raptor:true};
        G.volcanoTimer = 10800;
        G.megaTimer = 3600;
        G.megaOnLand = false;
        G.cheatsActive = false;
        generateWorld();
        spawnWilds();
        spawnMega();
        G.cam.x = Math.max(0, Math.min(WS*TS-canvas.width, G.player.x - canvas.width/2));
        G.cam.y = Math.max(0, Math.min(WS*TS-canvas.height, G.player.y - canvas.height/2));
    } else {
        G.playerHp = pMaxHp();
        G.cam.x = Math.max(0, Math.min(WS*TS-canvas.width, G.player.x - canvas.width/2));
        G.cam.y = Math.max(0, Math.min(WS*TS-canvas.height, G.player.y - canvas.height/2));
    }
    G.state = 'world';
}

function loop(){update();render();requestAnimationFrame(loop);}
loop();
