// ==========================================
// 🤖 DINOWORLD AI BUDDY SCRIPT (GROQ V5.1)
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
    apiKey: null,
    model: 'groq/compound-mini',
    spawned: false,
    following: false,
    x: 0,
    y: 0,
    targetX: 0, 
    targetY: 0, 
    wanderTimer: 0,
    activityTimer: 0, // Used for fake battles
    huntingTarget: null, // The wild dino he is currently fighting
    face: 1,
    anim: 0,
    isFetching: false,
    
    // V5 Progression Stats
    dk: 'raptor', // His current equipped dino
    unlocked: ['raptor'], // His secret index!
    battleWait: 0 // Used to time his attacks in Co-op
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
            if (msg.startsWith('/api')) {
                const userKey = prompt("🦖 DINO BUDDY SETUP:\nPlease paste your GROQ API Key here:");
                if (userKey && userKey.trim() !== "") {
                    window.AI_BUDDY.apiKey = userKey.trim();
                    addChatMessage('System', `API Key saved! Model set to ${window.AI_BUDDY.model}. Type /summon`);
                } else {
                    addChatMessage('System', 'API Key setup cancelled.');
                }
            } 
            else if (msg === '/summon') {
                if (!G.isHost) {
                    addChatMessage('System', 'Only the Room Host can summon the dino buddy!');
                } else if (!window.AI_BUDDY.apiKey) {
                    addChatMessage('System', 'You must set an API key first! Type /api');
                } else {
                    window.AI_BUDDY.spawned = true;
                    window.AI_BUDDY.following = false;
                    window.AI_BUDDY.x = G.player.x;
                    window.AI_BUDDY.y = G.player.y;
                    window.AI_BUDDY.targetX = window.AI_BUDDY.x;
                    window.AI_BUDDY.targetY = window.AI_BUDDY.y;
                    
                    addChatMessage('System', 'dino buddy has joined the room!');
                    updateBotSync(); 
                }
            } 
            else if (msg === '/come') {
                window.AI_BUDDY.following = true;
                addChatMessage('System', 'Dino buddy is now following you.');
            }
            else if (msg === '/stop') {
                window.AI_BUDDY.following = false;
                addChatMessage('System', 'Dino buddy is now wandering/hunting.');
            }
            else if (msg === '/dismiss') {
                window.AI_BUDDY.spawned = false;
                delete G.otherPlayers['BOT_1'];
                if (G.coop.partnerId === 'BOT_1') breakCoop("Dino buddy went home.");
                addChatMessage('System', 'dino buddy went home.');
            } 
            else {
                addChatMessage('System', 'Commands: /api, /summon, /come, /stop, /dismiss');
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

// ── 3. MONKEY PATCH: LISTEN TO PUBLIC CHAT ──
const origAddChatMessage = typeof addChatMessage !== 'undefined' ? addChatMessage : null;

addChatMessage = function(sender, msg) {
    if (origAddChatMessage) origAddChatMessage(sender, msg);
    
    if (G.isHost && window.AI_BUDDY.spawned && sender !== 'dino buddy' && sender !== 'System') {
        const lowerMsg = msg.toLowerCase();
        
        if (lowerMsg.includes('dino buddy, come')) {
            window.AI_BUDDY.following = true;
            botSpeak("Rawr! I'm coming to you!");
        } 
        else if (lowerMsg.includes('dino buddy, stop')) {
            window.AI_BUDDY.following = false;
            botSpeak("Okay, I will hunt around here!");
        }
        else if (lowerMsg.includes('dino buddy')) {
            askGroq(msg); 
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

// ── 4. GROQ API CONNECTION ──
async function askGroq(userMessage) {
    if (window.AI_BUDDY.isFetching) return;
    if (!window.AI_BUDDY.apiKey) return;
    
    window.AI_BUDDY.isFetching = true;
    
    try {
        const systemLore = `You are 'dino buddy', a fellow player and casual gamer playing alongside the user in a multiplayer survival game called DinoWorld. DO NOT act like an AI, a bot, or a formal guide. Just act like a normal gamer who happens to know a lot about the game. In this game players walk around the map and bump into wild dinosaurs to trigger turn based battles. Winning battles earns Buckets which is the currency used in the shop to buy HP, Attack, Speed upgrades, shields, and heals. Defeated dinosaurs are added to the Index so players can equip them and play as them. Map 1 is Isla Uno which has grass and water, and the final boss is the Megalodon. Defeating the Megalodon unlocks Map 2, Volcano Island, where players must dodge falling rocks and fight the boss the Indominus Rex. Beating him unlocks the 3 map. This map has an underwater cave and 2 bosses, in the underwater cave u have to solve 3 puzzles. 1. A wire puzzle. 2. A counting puzzle. 3. A maze puzzle. The 2 bosses are the leviathan and the abyssal serpent. The game also features environmental puzzles like connecting wires at terminals to unlock the bridge that then leads to the abyssal serpent. Players can do friendly PvP battles or team up in Co-op mode where they share buckets but enemies get a 1.55x stat buff. You only talk about this game, dinosaurs, and survival. 
        
        CRITICAL RULE: YOU MUST REPLY IN EXACTLY 1 VERY SHORT SENTENCE. NO MORE THAN 15 WORDS TOTAL. TALK LIKE A NORMAL GAMER IN CHAT.`;

        const payload = {
            model: window.AI_BUDDY.model,
            messages: [
                { role: "system", content: systemLore },
                { role: "user", content: userMessage }
            ],
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
            botSpeak(data.choices[0].message.content.trim());
        }
        
    } catch (err) {
        console.error("Network Error:", err);
        botSpeak("Rawr... I can't connect to the internet right now!");
    }
    
    window.AI_BUDDY.isFetching = false;
}

// ── 5. MONKEY PATCH: BOT MOVEMENT, HUNTING & BATTLE LOOP ──
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
        coopPartner: G.coop.partnerId === 'BOT_1' ? 'host' : null 
    };
}

// 5A. The BATTLE Engine Fix
const origUpdateBattle = typeof updateBattle !== 'undefined' ? updateBattle : null;
updateBattle = function() {
    if (origUpdateBattle) origUpdateBattle();
    
    // The bot's brain now correctly ticks during the battle screen!
    if (G.isHost && window.AI_BUDDY.spawned && G.battle && G.battle.isCoop && G.coop.partnerId === 'BOT_1') {
        // Wait until it's his turn and animations are finished
        if (G.battle.turn === 'partner' && !G.battle.anim && !G.battle.res) {
            window.AI_BUDDY.battleWait++;
            // Wait about ~0.8 seconds to feel like a real player clicking the button
            if (window.AI_BUDDY.battleWait > 50) {
                window.AI_BUDDY.battleWait = 0;
                const botDino = DINOS[window.AI_BUDDY.dk] || DINOS['raptor'];
                const dmg = Math.max(1, Math.floor(botDino.atk * R_MULT[botDino.rarity]));
                
                // Fire the attack packet!
                if (typeof processCoopBattleAction === 'function') {
                    processCoopBattleAction({ action: 'player_attack', dmg: dmg });
                }
            }
        } else {
            window.AI_BUDDY.battleWait = 0;
        }
    }
};

// 5B. The WORLD Engine Fix
const origBotUpdateWorld = typeof updateWorld !== 'undefined' ? updateWorld : null;
updateWorld = function() {
    if (origBotUpdateWorld) origBotUpdateWorld();
    
    if (G.isHost && window.AI_BUDDY.spawned) {
        
        // --- CO-OP INVITE INTERCEPTOR ---
        if (G.coop.reqTo === 'BOT_1') {
            G.coop.reqTo = null; 
            botSpeak("Yeah! Let's team up!");
            bondWithPartner('BOT_1', 'dino buddy'); 
        }
        
        // --- MOVEMENT & HUNTING ---
        if (window.AI_BUDDY.following || G.coop.partnerId === 'BOT_1') {
            const dx = G.player.x - window.AI_BUDDY.x;
            const dy = G.player.y - window.AI_BUDDY.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 1000) {
                window.AI_BUDDY.x = G.player.x;
                window.AI_BUDDY.y = G.player.y;
            } else if (dist > 60) {
                const speed = 2.5;
                window.AI_BUDDY.x += (dx / dist) * speed;
                window.AI_BUDDY.y += (dy / dist) * speed;
                window.AI_BUDDY.anim++;
                window.AI_BUDDY.face = dx > 0 ? 1 : -1;
            }
        } 
        else if (G.state === 'world') {
            // FIXED HUNTING MODE
            if (window.AI_BUDDY.activityTimer > 0) {
                window.AI_BUDDY.activityTimer--; 
                window.AI_BUDDY.anim++; // Jiggle to look alive
                
                let w = window.AI_BUDDY.huntingTarget;
                // Verify the dino hasn't been stolen by a real player
                if (w && G.wilds.includes(w)) {
                    // Lock the wild dino in combat with the bot!
                    w.dx = 0; 
                    w.dy = 0; 
                    w.mt = 10; 
                    w.anim++;
                    
                    // When the 4 second battle finishes...
                    if (window.AI_BUDDY.activityTimer === 1) {
                        let killedKey = w.key;
                        let idx = G.wilds.indexOf(w);
                        if (idx !== -1) G.wilds.splice(idx, 1); // Kill it
                        
                        if (!window.AI_BUDDY.unlocked.includes(killedKey)) {
                            window.AI_BUDDY.unlocked.push(killedKey);
                        }
                        if (Math.random() < 0.3) {
                            window.AI_BUDDY.dk = window.AI_BUDDY.unlocked[Math.floor(Math.random() * window.AI_BUDDY.unlocked.length)];
                        }
                        if (Math.random() < 0.05) {
                            botSpeak(`I just wrecked a wild ${DINOS[killedKey].name}!`);
                        }
                        window.AI_BUDDY.huntingTarget = null;
                    }
                } else {
                    // Target was lost or killed by someone else
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
                    if (dist < minDist) {
                        minDist = dist;
                        targetWild = w;
                    }
                }
                
                if (targetWild) {
                    const dx = targetWild.x - window.AI_BUDDY.x;
                    const dy = targetWild.y - window.AI_BUDDY.y;
                    const dist = Math.hypot(dx, dy);
                    const triggerDist = 38 + DINOS[targetWild.key].sz;
                    
                    if (dist < triggerDist) {
                        // COLLISION! Start a 4 second fake battle.
                        window.AI_BUDDY.huntingTarget = targetWild;
                        window.AI_BUDDY.activityTimer = 240; // 240 ticks = 4 seconds
                    } else {
                        const speed = 2.2; 
                        window.AI_BUDDY.x += (dx / dist) * speed;
                        window.AI_BUDDY.y += (dy / dist) * speed;
                        window.AI_BUDDY.anim++;
                        window.AI_BUDDY.face = dx > 0 ? 1 : -1;
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
                        window.AI_BUDDY.x += (dx / dist) * speed;
                        window.AI_BUDDY.y += (dy / dist) * speed;
                        window.AI_BUDDY.anim++;
                        window.AI_BUDDY.face = dx > 0 ? 1 : -1;
                    }
                }
            }
        }
        
        updateBotSync();
    }
};
