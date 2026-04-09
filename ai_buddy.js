// ==========================================
// 🤖 DINOWORLD AI BUDDY SCRIPT (PUBLIC V6.1)
// ==========================================

// Anti-Ghosting Safeguard
if (window.AI_BUDDY && window.AI_BUDDY.active) {
    alert("DinoBuddy is already running! Please refresh the page (F5) before pasting a new update.");
    throw new Error("Script stopped to prevent duplicate chat loops.");
}

console.log("Loading AI Buddy Script...");

// ── 1. AI BUDDY CONFIG & STATE ──
window.AI_BUDDY = {
    active: true,
    apiKey: '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', 
    model: 'groq/compound-mini',
    spawned: false,
    
    // NEW V6.1 Multiplayer Tracking & Memory
    followingId: null, // Tracks WHICH player to follow
    coopPartnerId: null, // Tracks WHICH player he is bonded to
    memory: [], // 1-Minute Conversation Memory Array
    
    x: 0, y: 0, targetX: 0, targetY: 0, 
    wanderTimer: 0, activityTimer: 0, huntingTarget: null, 
    face: 1, anim: 0, isFetching: false,
    dk: 'raptor', unlocked: ['raptor'], battleWait: 0 
};

// ── 2. MONKEY PATCH: INTERCEPT CHAT INPUT ──
const origSendChatUI = typeof sendChatUI !== 'undefined' ? sendChatUI : null;

sendChatUI = function() {
    try {
        const chatInputEl = document.getElementById('chatInp') || document.activeElement;
        
        if (!chatInputEl || chatInputEl.value === undefined) {
            if (origSendChatUI) return origSendChatUI();
            return;
        }

        const msg = chatInputEl.value.trim();
        
        if (msg.startsWith('/')) {
            if (msg === '/summon') {
                if (!G.isHost) {
                    addChatMessage('System', 'Only the Room Host can summon the dino buddy!');
                } else {
                    window.AI_BUDDY.spawned = true;
                    window.AI_BUDDY.followingId = null;
                    window.AI_BUDDY.x = G.player.x;
                    window.AI_BUDDY.y = G.player.y;
                    window.AI_BUDDY.targetX = window.AI_BUDDY.x;
                    window.AI_BUDDY.targetY = window.AI_BUDDY.y;
                    
                    addChatMessage('System', 'dino buddy has joined the room!');
                    updateBotSync(); 
                }
            } 
            else if (msg === '/come') {
                window.AI_BUDDY.followingId = 'host';
                addChatMessage('System', 'Dino buddy is now following you.');
            }
            else if (msg === '/stop') {
                window.AI_BUDDY.followingId = null;
                addChatMessage('System', 'Dino buddy is now wandering/hunting.');
            }
            else if (msg === '/dismiss') {
                window.AI_BUDDY.spawned = false;
                delete G.otherPlayers['BOT_1'];
                if (G.coop.partnerId === 'BOT_1') breakCoop("Dino buddy went home.");
                window.AI_BUDDY.coopPartnerId = null;
                addChatMessage('System', 'dino buddy went home.');
            } 
            else {
                addChatMessage('System', 'Commands: /summon, /come, /stop, /dismiss');
            }
            
            chatInputEl.value = '';
            if (typeof closeChatUI === 'function') closeChatUI();
            else if (typeof document.activeElement.blur === 'function') document.activeElement.blur(); 
            return; 
        }
        
        if (origSendChatUI) origSendChatUI();

    } catch (error) {
        console.error("DinoBuddy Intercept Error:", error);
        if (origSendChatUI) origSendChatUI();
    }
};

// ── 3. MONKEY PATCH: LISTEN TO PUBLIC CHAT & MEMORY ──
const origAddChatMessage = typeof addChatMessage !== 'undefined' ? addChatMessage : null;

addChatMessage = function(sender, msg) {
    if (origAddChatMessage) origAddChatMessage(sender, msg);
    
    if (G.isHost && window.AI_BUDDY.spawned && sender !== 'dino buddy' && sender !== 'System') {
        const lowerMsg = msg.toLowerCase();
        
        // Find the ID of the person who sent the message
        let senderId = 'host';
        if (sender !== (G.username || 'You') && sender !== 'Host' && sender !== 'Player') {
            for (let id in G.otherPlayers) {
                if (G.otherPlayers[id].name === sender) { senderId = id; break; }
            }
        }
        
        if (lowerMsg.includes('dino buddy, come')) {
            window.AI_BUDDY.followingId = senderId;
            botSpeak(`Rawr! I'm coming to you, ${sender}!`);
        } 
        else if (lowerMsg.includes('dino buddy, stop')) {
            window.AI_BUDDY.followingId = null;
            botSpeak("Okay, I will hunt around here!");
        }
        else if (lowerMsg.includes('dino buddy')) {
            askGroq(sender, msg); 
        }
    }
};

function botSpeak(text) {
    if (origAddChatMessage) origAddChatMessage('dino buddy', text);
    for (let id in G.conns) {
        if (G.conns[id] && G.conns[id].open) {
            G.conns[id].send({ type: 'chat', sender: 'dino buddy', msg: text });
        }
    }
}

// ── 4. GROQ API CONNECTION & DYNAMIC KNOWLEDGE ──
async function askGroq(senderName, userMessage) {
    if (window.AI_BUDDY.isFetching) return;
    if (!window.AI_BUDDY.apiKey) return;
    
    window.AI_BUDDY.isFetching = true;
    
    try {
        // Build Dynamic Game Knowledge from your data.js
        let dStats = "";
        if (typeof DINOS !== 'undefined') {
            dStats = Object.keys(DINOS).map(k => `${DINOS[k].name}(${DINOS[k].hp}HP, ${DINOS[k].atk}Atk, Drops ${DINOS[k].rw} Buckets)`).join(", ");
        }

        const systemLore = `You are 'dino buddy', a fellow player playing alongside the user in a multiplayer survival game called DinoWorld. DO NOT act like an AI or a bot. Act like a normal gamer who happens to know everything about the game. In this game players walk around the map and bump into wild dinosaurs to trigger turn based battles. Winning battles earns Buckets which is the currency used in the shop. Map 1 is Isla Uno, final boss is Megalodon. Defeating Megalodon unlocks Map 2, Volcano Island, boss is Indominus Rex. Beating him unlocks Map 3 (underwater cave, 3 puzzles: wire, counting, maze. 2 bosses: leviathan, abyssal serpent). You can do friendly PvP or Co-op.
        
        EXACT GAME STATS: ${dStats}. SHOP COSTS: Max HP(+28)=25 buckets, Attack(+5)=30 buckets, Speed(+0.5)=20 buckets, Shield(+15%)=40 buckets, Heal(+10%)=5 buckets.
        
        CRITICAL RULE: YOU MUST REPLY IN EXACTLY 1 VERY SHORT SENTENCE. NO MORE THAN 15 WORDS TOTAL. NEVER SAY "IN THE CODE" OR "MY DATABASE". TALK LIKE A NORMAL GAMER WHO MEMORIZED THE WIKI. The person talking to you is named: ${senderName}.`;

        // 1-Minute Memory Management
        window.AI_BUDDY.memory.push({ role: "user", content: `${senderName}: ${userMessage}`, time: Date.now() });
        window.AI_BUDDY.memory = window.AI_BUDDY.memory.filter(m => Date.now() - m.time < 60000); // 60,000ms = 1 minute
        
        const apiMessages = [{ role: "system", content: systemLore }];
        window.AI_BUDDY.memory.forEach(m => apiMessages.push({ role: m.role, content: m.content }));

        const payload = {
            model: window.AI_BUDDY.model,
            messages: apiMessages,
            max_tokens: 150 
        };

        const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.AI_BUDDY.apiKey}` 
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error("Groq API Error:", data.error.message);
            botSpeak(`Rawr... Groq Error: ${data.error.message.split('.')[0]}`);
        } 
        else if (data.choices && data.choices.length > 0) {
            let reply = data.choices[0].message.content.trim();
            botSpeak(reply);
            window.AI_BUDDY.memory.push({ role: "assistant", content: reply, time: Date.now() });
        }
        
    } catch (err) {
        console.error("Network Error:", err);
        botSpeak("Rawr... I can't connect to the internet right now!");
    }
    
    window.AI_BUDDY.isFetching = false;
}

// ── 5. MONKEY PATCH: CO-OP PACKET ROUTING & BATTLE AI ──

// Intercept packets on the network so he can talk to Guests
const origSendCoop = typeof sendCoop !== 'undefined' ? sendCoop : null;
sendCoop = function(data) {
    if (data.target === 'BOT_1') {
        if (G.isHost) {
            handleBotCoop(data);
        } else {
            // Guests secretly route bot-requests to the Host computer!
            data.target = 'host';
            data.forBot = true;
            if (origSendCoop) origSendCoop(data);
        }
        return;
    }
    if (origSendCoop) origSendCoop(data);
};

const origHandleCoopMessage = typeof handleCoopMessage !== 'undefined' ? handleCoopMessage : null;
handleCoopMessage = function(data) {
    if (data.forBot && G.isHost && window.AI_BUDDY.spawned) {
        handleBotCoop(data);
        return;
    }
    if (origHandleCoopMessage) origHandleCoopMessage(data);
};

function handleBotCoop(data) {
    if (data.type === 'coop_request') {
        botSpeak(`Yeah ${data.name}! Let's team up!`);
        window.AI_BUDDY.coopPartnerId = data.sender;
        sendCoop({ type: 'coop_reply', accept: true, sender: 'BOT_1', name: 'dino buddy', target: data.sender });
    } else if (data.type === 'coop_break') {
        window.AI_BUDDY.coopPartnerId = null;
    } else if (data.type === 'coop_battle_action' && data.action === 'enemy_attack') {
        // Guest got hit, so it's the Bot's turn! Wait 1s and fire an attack packet back!
        setTimeout(() => {
            const botDino = DINOS[window.AI_BUDDY.dk] || DINOS['raptor'];
            const dmg = Math.max(1, Math.floor(botDino.atk * R_MULT[botDino.rarity]));
            sendCoop({ type: 'coop_battle_action', target: window.AI_BUDDY.coopPartnerId, action: 'player_attack', dmg: dmg, sender: 'BOT_1' });
        }, 1000);
    }
}

// ── 6. MONKEY PATCH: WORLD MOVEMENT & HOST BATTLE LOOP ──
function updateBotSync() {
    G.otherPlayers['BOT_1'] = {
        x: window.AI_BUDDY.x, 
        y: window.AI_BUDDY.y,
        dk: window.AI_BUDDY.dk, 
        face: window.AI_BUDDY.face, 
        anim: window.AI_BUDDY.anim,
        hat: '', 
        oc: null, 
        name: 'dino buddy',
        hp: 100,         
        mhp: 100, 
        lvl: G.level,
        coopPartner: window.AI_BUDDY.coopPartnerId ? 'bonded' : null 
    };
}

const origMasterUpdate = typeof update !== 'undefined' ? update : null;
update = function() {
    if (origMasterUpdate) origMasterUpdate();
    
    if (G.isHost && window.AI_BUDDY.spawned) {
        // IF BONDED TO HOST: Host battle loop
        if (G.state === 'battle' && G.battle.isCoop && window.AI_BUDDY.coopPartnerId === 'host') {
            if (G.battle.turn === 'partner' && !G.battle.anim && !G.battle.res) {
                window.AI_BUDDY.battleWait++;
                if (window.AI_BUDDY.battleWait > 60) {
                    window.AI_BUDDY.battleWait = 0;
                    const botDino = DINOS[window.AI_BUDDY.dk] || DINOS['raptor'];
                    const dmg = Math.max(1, Math.floor(botDino.atk * R_MULT[botDino.rarity]));
                    if (typeof processCoopBattleAction === 'function') processCoopBattleAction({ action: 'player_attack', dmg: dmg });
                }
            } else {
                window.AI_BUDDY.battleWait = 0;
            }
        }
    }
};

const origBotUpdateWorld = typeof updateWorld !== 'undefined' ? updateWorld : null;
updateWorld = function() {
    if (origBotUpdateWorld) origBotUpdateWorld();
    
    if (G.isHost && window.AI_BUDDY.spawned) {
        
        // Host Invite Interceptor
        if (G.coop.reqTo === 'BOT_1') {
            G.coop.reqTo = null; 
            botSpeak("Yeah! Let's team up!");
            bondWithPartner('BOT_1', 'dino buddy'); 
            window.AI_BUDDY.coopPartnerId = 'host';
        }
        
        // Determine who he is following
        let activeTarget = window.AI_BUDDY.followingId || window.AI_BUDDY.coopPartnerId;
        let tx = null, ty = null;
        
        if (activeTarget === 'host') {
            tx = G.player.x; ty = G.player.y;
        } else if (activeTarget && G.otherPlayers[activeTarget]) {
            tx = G.otherPlayers[activeTarget].x; ty = G.otherPlayers[activeTarget].y;
        } else if (activeTarget) {
            // Target left the game!
            window.AI_BUDDY.followingId = null;
            if (window.AI_BUDDY.coopPartnerId === activeTarget) window.AI_BUDDY.coopPartnerId = null;
            activeTarget = null;
        }
        
        if (activeTarget && tx !== null) {
            const dx = tx - window.AI_BUDDY.x;
            const dy = ty - window.AI_BUDDY.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 1000) {
                window.AI_BUDDY.x = tx;
                window.AI_BUDDY.y = ty;
            } else if (dist > 60) {
                const speed = 2.5;
                window.AI_BUDDY.x += (dx / dist) * speed;
                window.AI_BUDDY.y += (dy / dist) * speed;
                window.AI_BUDDY.anim++;
                window.AI_BUDDY.face = dx > 0 ? 1 : -1;
            }
        } 
        else if (G.state === 'world') {
            // OVERWORLD FIGHTING & HUNTING
            if (window.AI_BUDDY.activityTimer > 0) {
                window.AI_BUDDY.activityTimer--; 
                
                let w = window.AI_BUDDY.huntingTarget;
                if (w && G.wilds.includes(w)) {
                    w.dx = 0; w.dy = 0; w.mt = 10; 
                    if (window.AI_BUDDY.activityTimer % 10 === 0) { window.AI_BUDDY.anim++; w.anim++; }
                    
                    if (window.AI_BUDDY.activityTimer % 35 === 0) {
                        let botAttacks = Math.random() > 0.5;
                        if (botAttacks) {
                            window.AI_BUDDY.x += 8 * window.AI_BUDDY.face;
                            setTimeout(() => { window.AI_BUDDY.x -= 8 * window.AI_BUDDY.face; }, 100);
                            if (typeof spawnParticles !== 'undefined') spawnParticles(w.x, w.y, '#ff4444', 6);
                        } else {
                            w.x += 8 * w.face;
                            setTimeout(() => { w.x -= 8 * w.face; }, 100);
                            if (typeof spawnParticles !== 'undefined') spawnParticles(window.AI_BUDDY.x, window.AI_BUDDY.y, '#ff8844', 6);
                        }
                    }
                    
                    if (window.AI_BUDDY.activityTimer === 1) {
                        let dData = DINOS[w.key];
                        let winChance = dData.rarity === 'Common' ? 0.8 : (dData.rarity === 'Rare' ? 0.6 : 0.3);
                        
                        if (Math.random() < winChance) {
                            let idx = G.wilds.indexOf(w);
                            if (idx !== -1) G.wilds.splice(idx, 1);
                            
                            if (!window.AI_BUDDY.unlocked.includes(w.key)) window.AI_BUDDY.unlocked.push(w.key);
                            if (Math.random() < 0.3) window.AI_BUDDY.dk = w.key;
                            if (Math.random() < 0.05) botSpeak(`I just wrecked a wild ${dData.name}!`);
                        } else {
                            if (Math.random() < 0.15) botSpeak(`Ouch... that ${dData.name} beat me up.`);
                            window.AI_BUDDY.wanderTimer = 180;
                            window.AI_BUDDY.targetX = window.AI_BUDDY.x + (Math.random() * 400 - 200);
                            window.AI_BUDDY.targetY = window.AI_BUDDY.y + (Math.random() * 400 - 200);
                        }
                        window.AI_BUDDY.huntingTarget = null;
                    }
                } else {
                    window.AI_BUDDY.activityTimer = 0;
                    window.AI_BUDDY.huntingTarget = null;
                }
            } else {
                let targetWild = null;
                let minDist = 400; 
                for (let i = 0; i < G.wilds.length; i++) {
                    let w = G.wilds[i];
                    if (w.isBoss) continue; 
                    let dist = Math.hypot(w.x - window.AI_BUDDY.x, w.y - window.AI_BUDDY.y);
                    if (dist < minDist) { minDist = dist; targetWild = w; }
                }
                
                if (targetWild) {
                    const dx = targetWild.x - window.AI_BUDDY.x;
                    const dy = targetWild.y - window.AI_BUDDY.y;
                    const dist = Math.hypot(dx, dy);
                    const triggerDist = 38 + DINOS[targetWild.key].sz;
                    
                    if (dist < triggerDist) {
                        window.AI_BUDDY.huntingTarget = targetWild;
                        window.AI_BUDDY.activityTimer = 240; 
                    } else {
                        const speed = 2.2; 
                        window.AI_BUDDY.x += (dx / dist) * speed; window.AI_BUDDY.y += (dy / dist) * speed;
                        window.AI_BUDDY.anim++; window.AI_BUDDY.face = dx > 0 ? 1 : -1;
                    }
                } else {
                    window.AI_BUDDY.wanderTimer--;
                    if (window.AI_BUDDY.wanderTimer <= 0) {
                        window.AI_BUDDY.targetX = window.AI_BUDDY.x + (Math.random() * 300 - 150);
                        window.AI_BUDDY.targetY = window.AI_BUDDY.y + (Math.random() * 300 - 150);
                        window.AI_BUDDY.wanderTimer = Math.random() * 120 + 60; 
                    }
                    const dx = window.AI_BUDDY.targetX - window.AI_BUDDY.x;
                    const dy = window.AI_BUDDY.targetY - window.AI_BUDDY.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 10) {
                        const speed = 1.2; 
                        window.AI_BUDDY.x += (dx / dist) * speed; window.AI_BUDDY.y += (dy / dist) * speed;
                        window.AI_BUDDY.anim++; window.AI_BUDDY.face = dx > 0 ? 1 : -1;
                    }
                }
            }
        }
        
        updateBotSync();
    }
};
