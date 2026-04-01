// ── CHAT SYSTEM & FILTER ──
function filterMessage(msg) {
    const badWords =['fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'dumbass', 'nigger', 'nigga', 'cunt', 'slut', 'whore', 'faggot', 'dick', 'cock', 'pussy', 'bastard'];
    const leetMap = { '@':'a', '4':'a', '3':'e', '1':'i', '!':'i', '0':'o', '5':'s', '$':'s', '7':'t', '8':'b', '+':'t' };
    
    let leeted = msg.toLowerCase();
    for (let k in leetMap) leeted = leeted.split(k).join(leetMap[k]);
    let testStrClean = leeted.replace(/[\s\W_]+/g, ''); 
    
    for (let i = 0; i < badWords.length; i++) {
        if (testStrClean.includes(badWords[i])) return "****"; 
    }
    return msg; 
}

function wakeChat() {
    const msgs = document.getElementById('chatMessages');
    msgs.style.opacity = '1';
    clearTimeout(chatFadeTimer);
    chatFadeTimer = setTimeout(() => {
        if(document.getElementById('chatBox').style.display === 'none') msgs.style.opacity = '0';
    }, 8000);
}

function addChatMessage(sender, msg) {
    const safeMsg = filterMessage(msg);
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg';
    msgEl.style.color = sender === (G.username || 'You') ? '#aaddff' : (sender === 'System' ? '#ffff55' : '#ffddaa');
    msgEl.innerText = sender + ': ' + safeMsg;

    const chatMsgs = document.getElementById('chatMessages');
    chatMsgs.appendChild(msgEl);
    if (chatMsgs.children.length > 50) chatMsgs.firstChild.remove();
    chatMsgs.scrollTop = chatMsgs.scrollHeight;

    wakeChat();
}

const chatBox = document.getElementById('chatBox');
const chatInp = document.getElementById('chatInp');
const chatSend = document.getElementById('chatSend');

function closeChatUI() {
    chatInp.value = '';
    chatBox.style.display = 'none'; 
    document.getElementById('chatMessages').style.pointerEvents = 'none';
    chatInp.blur();
    wakeChat();
}

function sendChatUI() {
    const msg = chatInp.value;
    if(msg && msg.trim() !== '') {
        const safeName = G.username || 'You';
        addChatMessage(safeName, msg); 
        
        try {
            if(G.isHost) {
                for(let id in G.conns) {
                    if(G.conns[id] && G.conns[id].open) G.conns[id].send({ type: 'chat', sender: safeName, msg: msg });
                }
            } else {
                if(G.conns['host'] && G.conns['host'].open) G.conns['host'].send({ type: 'chat', sender: safeName, msg: msg }); 
            }
        } catch(e) { console.error("Chat send error:", e); }
    }
    closeChatUI();
}

chatSend.addEventListener('click', sendChatUI);
chatInp.addEventListener('keydown', (e) => { if(e.key === 'Enter') sendChatUI(); });
chatBox.addEventListener('touchstart', e => e.stopPropagation());
chatBox.addEventListener('touchmove', e => e.stopPropagation());
chatBox.addEventListener('click', e => e.stopPropagation());
document.getElementById('chatContainer').addEventListener('touchstart', e => e.stopPropagation());
document.getElementById('chatContainer').addEventListener('touchmove', e => e.stopPropagation());

// ── MULTIPLAYER MODAL UI ──
const mpModal = document.getElementById('mpModal');
const mpTitle = document.getElementById('mpTitle');
const mpUserInp = document.getElementById('mpUserInp');
const mpRoomInp = document.getElementById('mpRoomInp');
const mpBtnCancel = document.getElementById('mpBtnCancel');
const mpBtnConfirm = document.getElementById('mpBtnConfirm');
let mpMode = 'host';

function showMpModal(mode) {
    mpMode = mode;
    mpTitle.innerText = mode === 'host' ? 'Host a Party' : 'Join a Party';
    mpTitle.style.color = mode === 'host' ? '#dd88ff' : '#ff88cc';
    mpModal.style.borderColor = mode === 'host' ? '#8822cc' : '#cc2288';
    mpRoomInp.style.display = mode === 'join' ? 'block' : 'none';
    
    mpUserInp.value = G.username || '';
    mpRoomInp.value = '';
    
    mpModal.style.display = 'flex';
    mpUserInp.focus();
}

mpBtnCancel.addEventListener('click', () => mpModal.style.display = 'none');

mpBtnConfirm.addEventListener('click', () => {
    const u = mpUserInp.value.trim();
    G.username = u !== '' ? u : (mpMode === 'host' ? 'Host' : 'Guest');
    mpModal.style.display = 'none';
    
    if(mpMode === 'host') hostGame();
    else { const r = mpRoomInp.value.trim(); if(r) joinGame(r); }
});

mpModal.addEventListener('touchstart', e => e.stopPropagation());
mpModal.addEventListener('touchmove', e => e.stopPropagation());
mpModal.addEventListener('click', e => e.stopPropagation());

// ── MULTIPLAYER LOGIC & PVP/COOP PACKET ROUTING ──
function leaveGame() {
    if(G.sessionTimer) { clearTimeout(G.sessionTimer); G.sessionTimer = null; }
    if(syncInterval) { clearInterval(syncInterval); syncInterval = null; }
    
    for(let id in G.conns) { if(G.conns[id]) G.conns[id].close(); }
    G.conns = {};
    if(G.peer) { G.peer.destroy(); G.peer = null; }
    
    G.peerId = null;
    G.otherPlayers = {};
    G.isHost = false;
    if(G.coop.partnerId) breakCoop("Disconnected from room.");
    addChatMessage('System', 'Disconnected from room.');
}

function startSessionTimer() {
    if(G.sessionTimer) clearTimeout(G.sessionTimer);
    G.sessionTimer = setTimeout(() => {
        addChatMessage('System', '1-hour limit reached. Disconnecting.');
        leaveGame();
    }, 3600000); 
}

function sendPvP(data) {
    try {
        if (G.isHost) {
            if (data.target === 'host') handlePvPMessage(data); 
            else if (G.conns[data.target] && G.conns[data.target].open) G.conns[data.target].send(data);
        } else {
            if (G.conns['host'] && G.conns['host'].open) G.conns['host'].send(data);
        }
    } catch(e) { console.error("PvP Send Error:", e); }
}

function sendCoop(data) {
    try {
        if (G.isHost) {
            if (data.target === 'host') handleCoopMessage(data); 
            else if (G.conns[data.target] && G.conns[data.target].open) G.conns[data.target].send(data);
        } else {
            if (G.conns['host'] && G.conns['host'].open) G.conns['host'].send(data);
        }
    } catch(e) { console.error("Coop Send Error:", e); }
}

function handlePvPMessage(data) {
    if (data.type === 'pvp_request') {
        if (G.state === 'world' && G.pvp.cd === 0 && G.encCd <= 0 && !G.coop.partnerId) {
            G.pvp.reqFrom = data.sender;
            G.pvp.reqFromName = data.name;
            G.pvp.reqFromStats = data.stats;
        } else {
            sendPvP({ type: 'pvp_reply', target: data.sender, sender: (G.isHost ? 'host' : G.peer.id), accept: false, name: G.username || 'Player' });
        }
    } else if (data.type === 'pvp_reply') {
        if (data.accept && G.pvp.reqTo === data.sender) {
            startPvPBattle(data.sender, data.stats, true); 
            G.pvp.reqTo = null;
        } else {
            if (G.pvp.reqTo === data.sender) addChatMessage('System', data.name + ' denied PvP.');
            G.pvp.reqTo = null;
            G.pvp.cd = 1800;
        }
    } else if (data.type === 'pvp_action') {
        if (G.state === 'battle' && G.battle.isPvP && G.battle.opId === data.sender) {
            const b = G.battle;
            if (data.action === 'attack') {
                b.anim = true;
                const dmg = data.dmg;
                if (b.php_shield >= dmg) { b.php_shield -= dmg; }
                else { b.php -= (dmg - b.php_shield); b.php_shield = 0; }
                G.playerHp = Math.max(0, b.php);
                G.playerShield = b.php_shield;
                G.lastDamageTick = G.tick;

                b.pshake = 18;
                b.dnums.push({x:canvas.width*0.28, y:canvas.height*0.52, val:dmg, col:'#ff8844', life:60});
                b.log.unshift(`${b.ename} attacks for ${dmg}!`); if(b.log.length>5) b.log.pop();
                spawnParticles(canvas.width*0.28, canvas.height*0.52, '#ff8844', 6);

                setTimeout(()=>{
                    b.anim = false;
                    if(b.php <= 0){
                        b.log.unshift(`💀 You lost the friendly match!`);
                        b.res = 'lose';
                    } else {
                        b.turn = 'player';
                    }
                }, 420);
            } else if (data.action === 'run') {
                b.log.unshift(`${b.ename} fled the match!`);
                b.res = 'win';
            }
        }
    }
}

function handleCoopMessage(data) {
    if (data.type === 'coop_request') {
        if (G.coop.partnerId || G.state !== 'world') {
            sendCoop({ type: 'coop_reply', accept: false, sender: (G.isHost?'host':G.peer.id), name: G.username||'Player', target: data.sender });
            return;
        }
        G.coop.reqFrom = data.sender;
        G.coop.reqFromName = data.name;
    } else if (data.type === 'coop_reply') {
        if (data.accept && G.coop.reqTo === data.sender) {
            bondWithPartner(data.sender, data.name);
        } else {
            if (G.coop.reqTo === data.sender) addChatMessage('System', data.name + ' denied the Co-op request.');
            G.coop.reqTo = null;
        }
    } else if (data.type === 'coop_break') {
        breakCoop("Partner left the Co-op party.");
    } else if (data.type === 'coop_battle_start') {
        if (G.state === 'battle' && G.battle.isCoop) {
            addChatMessage('System', 'Collision! Both users attacked a Dino at the exact same time! Resetting encounter.');
            exitBattle();
            sendCoop({ type: 'coop_battle_abort', target: G.coop.partnerId });
            return;
        }
        startCoopBattle(data.ek, data.isBoss, false, data.stats);
    } else if (data.type === 'coop_battle_abort') {
        if (G.state === 'battle') {
            addChatMessage('System', 'Collision! Both users attacked a Dino at the exact same time! Resetting encounter.');
            exitBattle();
        }
    } else if (data.type === 'coop_battle_action') {
        processCoopBattleAction(data);
    } else if (data.type === 'coop_sync') {
        if (data.wheat !== undefined) G.wheat = data.wheat;
        if (data.level !== undefined && data.level > G.level) {
            G.level = data.level;
            G.discovered.utahraptor = true; G.player.dk = 'utahraptor';
            generateWorld(); spawnWilds(); spawnMega();
            G.player.x = WS/2*TS; G.player.y = WS/2*TS;
            G.volcanoTimer = 10800; G.volcanoActive = 0; G.hazards =[];
            addChatMessage('System', 'Partner defeated Megalodon! Welcome to Map 2!');
        }
    }
}

function hostGame() {
    if(G.peer) return;

    const pid = Math.floor(1000 + Math.random() * 9000).toString(); 
    G.peer = new Peer('dinoworld-' + pid);
    G.isHost = true;
    
    G.peer.on('open', id => {
        G.peerId = pid;
        addChatMessage('System', 'Room created! Give your friends ID: ' + pid);
        startSessionTimer();
    });
    
    G.peer.on('connection', c => {
        c.on('open', () => {
            G.conns[c.peer] = c;
            addChatMessage('System', 'A player joined the party!');
            
            c.on('data', data => {
                if (data.type === 'sync') G.otherPlayers[c.peer] = data.player; 
                else if (data.type === 'chat') {
                    addChatMessage(data.sender, data.msg); 
                    for (let id in G.conns) {
                        if (id !== c.peer && G.conns[id].open) G.conns[id].send({ type: 'chat', sender: data.sender, msg: data.msg });
                    }
                } else if (data.type.startsWith('pvp_')) {
                    if (data.target === 'host') handlePvPMessage(data);
                    else if (G.conns[data.target] && G.conns[data.target].open) G.conns[data.target].send(data);
                } else if (data.type.startsWith('coop_')) {
                    if (data.target === 'host') handleCoopMessage(data);
                    else if (G.conns[data.target] && G.conns[data.target].open) G.conns[data.target].send(data);
                }
            });

            c.on('close', () => {
                if (G.state === 'battle' && G.battle.isPvP && G.battle.opId === c.peer) {
                    G.battle.log.unshift("Opponent disconnected!");
                    G.battle.res = 'win';
                }
                if (G.coop.partnerId === c.peer) breakCoop("Partner disconnected!");
                delete G.otherPlayers[c.peer];
                delete G.conns[c.peer];
                addChatMessage('System', 'A player left the party.');
            });
        });
    });
    
    G.peer.on('error', err => { addChatMessage('System', 'Connection error.'); leaveGame(); });
    startSyncLoop();
}

function joinGame(pid) {
    if(G.peer) return;
    
    G.peer = new Peer();
    G.isHost = false;

    G.peer.on('open', () => {
        addChatMessage('System', 'Connecting to Room ' + pid + '...');
        const c = G.peer.connect('dinoworld-' + pid);
        
        c.on('open', () => {
            G.conns['host'] = c;
            addChatMessage('System', 'Connected to Room ' + pid + '!');
            startSessionTimer();

            c.on('data', data => {
                if (data.type === 'sync') G.otherPlayers = data.players; 
                else if (data.type === 'chat') addChatMessage(data.sender, data.msg); 
                else if (data.type.startsWith('pvp_')) handlePvPMessage(data);
                else if (data.type.startsWith('coop_')) handleCoopMessage(data);
            });

            c.on('close', () => {
                addChatMessage('System', 'Host closed the room.');
                if (G.state === 'battle' && G.battle.isPvP) G.state = 'world';
                if (G.coop.partnerId) breakCoop("Host closed the room.");
                leaveGame(); 
            });
        });
    });
    
    G.peer.on('error', err => { addChatMessage('System', 'Could not find room.'); leaveGame(); });
    startSyncLoop();
}

function startSyncLoop() {
    if(syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
        try {
            const myData = {
                x: G.player.x, y: G.player.y, dk: G.player.dk, 
                face: G.player.face, anim: G.player.anim, 
                hat: G.player.hat, oc: G.player.oc, name: G.username,
                coopPartner: G.coop.partnerId 
            };

            if (G.isHost) {
                const allPlayers = { host: myData };
                for (let id in G.otherPlayers) allPlayers[id] = G.otherPlayers[id];
                for (let id in G.conns) {
                    if (G.conns[id] && G.conns[id].open) G.conns[id].send({ type: 'sync', players: allPlayers });
                }
            } else {
                if (G.conns['host'] && G.conns['host'].open) G.conns['host'].send({ type: 'sync', player: myData });
            }
        } catch(e) {}
    }, 100);
}
