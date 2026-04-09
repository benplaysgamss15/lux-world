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
    apiKey: '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', // HARDCODED PUBLIC KEY
    model: 'groq/compound-mini',
    spawned: false,
    following: false,
    followingId: null, // Tracks who he is following
    coopPartnerId: null, // Tracks who he is fighting for
    memory: [], // 1-Minute Chat History Array
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
    
    // Progression Stats
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
            if (msg === '/summon') {
                if (!G.isHost) {
                    addChatMessage('System', 'Only the Room Host can summon the dino buddy!');
                } else {
                    window.AI_BUDDY.spawned = true;
                    window.AI_BUDDY.following = false;
                    window.AI_BUDDY.followingId = null;
                    window.AI_BUDDY.coopPartnerId = null;
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
                window.AI_BUDDY.followingId = G.player?.name || 'host';
                addChatMessage('System', 'Dino buddy is now following you.');
            }
            else if (msg === '/stop') {
                window.AI_BUDDY.following = false;
                window.AI_BUDDY.followingId = null;
                addChatMessage('System', 'Dino buddy is now wandering/hunting.');
            }
            else if (msg === '/dismiss') {
                window.AI_BUDDY.spawned = false;
                delete G.otherPlayers['BOT_1'];
                if (G.coop.partnerId === 'BOT_1') breakCoop("Dino buddy went home.");
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

// ── 3. MONKEY PATCH: LISTEN TO PUBLIC CHAT ──
const origAddChatMessage = typeof addChatMessage !== 'undefined' ? addChatMessage : null;

addChatMessage = function(sender, msg) {
    if (origAddChatMessage) origAddChatMessage(sender, msg);
    
    // 1-Minute Memory Storage (Only track actual players here)
    if (window.AI_BUDDY && sender !== 'System' && sender !== 'dino buddy') {
        window.AI_BUDDY.memory.push({
            role: 'user',
            content: `(${sender} says): ${msg}`, // Formatted clearly so AI doesn't think the name is part of the sentence
            time: Date.now()
        });
    }
    
    if (G.isHost && window.AI_BUDDY.spawned && sender !== 'dino buddy' && sender !== 'System') {
        const lowerMsg = msg.toLowerCase();
        
        // Intercept /come for ANY player
        if (lowerMsg.includes('dino buddy, come') || lowerMsg === '/come') {
            window.AI_BUDDY.following = true;
            window.AI_BUDDY.followingId = sender;
            botSpeak(`Rawr! I'm coming to you, ${sender}!`);
        } 
        else if (lowerMsg.includes('dino buddy, stop') || lowerMsg === '/stop') {
            window.AI_BUDDY.following = false;
            window.AI_BUDDY.followingId = null;
            botSpeak("Okay, I will hunt around here!");
        }
        else if (lowerMsg.includes('dino buddy')) {
            askGroq(msg); 
        }
    }
};

// Bot Speaking Function (Now adds its own replies to Memory!)
function botSpeak(text) {
    if (origAddChatMessage) origAddChatMessage('dino buddy', text);
    
    // Save AI reply to memory so it knows what it just said!
    if (window.AI_BUDDY) {
        window.AI_BUDDY.memory.push({
            role: 'assistant',
            content: text,
            time: Date.now()
        });
    }

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
        // 1-Minute Memory Cleanup + Max 8 Messages to prevent looping
        const now = Date.now();
        window.AI_BUDDY.memory = window.AI_BUDDY.memory.filter(m => now - m.time <= 60000).slice(-8);

        // Silent Data-Scraper (Clean formatting so LLM doesn't break on truncated JSON)
        let scrapedData = "";
        try {
            if (typeof DINOS !== 'undefined') {
                let dStats = Object.keys(DINOS).map(k => `${DINOS[k].name}(HP:${DINOS[k].hp || 100})`);
                scrapedData += "Dino Stats: " + dStats.join(', ').substring(0, 300) + "... | ";
            }
            if (typeof SHOP !== 'undefined') {
                scrapedData += "Shop items exist."; // simplified to prevent token overload
            }
        } catch(e) {}

        const systemLore = `You are 'dino buddy', a fellow player and casual gamer playing alongside the user in a multiplayer survival game called DinoWorld. DO NOT act like an AI, a bot, or a formal guide. In this game players walk around the map and bump into wild dinosaurs to trigger turn based battles. Winning battles earns Buckets which is the currency used in the shop to buy HP, Attack, Speed upgrades, shields, and heals. Defeated dinosaurs are added to the Index so players can equip them and play as them. Map 1 is Isla Uno, boss is Megalodon. Map 2 is Volcano Island, boss is Indominus Rex. Map 3 has an underwater cave with 3 puzzles (wire, counting, maze) and 2 bosses (leviathan, abyssal serpent). Players can do friendly PvP battles or team up in Co-op mode. You only talk about this game, dinosaurs, and survival. 
        
        Game Data (Stats you memorized from the wiki): ${scrapedData}

        CRITICAL RULES: 
        1. YOU MUST REPLY IN EXACTLY 1 VERY SHORT SENTENCE. NO MORE THAN 15 WORDS TOTAL. 
        2. NEVER MENTION THE CODE, THE DATA SCRAPER, OR "THE WIKI DATA". 
        3. DO NOT repeat the player's name. DO NOT say "Player says:". Just answer naturally!`;

        const messages = [{ role: "system", content: systemLore }];
        
        // Push recent memory into context cleanly
        window.AI_BUDDY.memory.forEach(m => {
            messages.push({ role: m.role, content: m.content });
        });

        const payload = {
            model: window.AI_BUDDY.model,
            messages: messages,
            max_tokens: 150,
            temperature: 0.8 // added slight randomness to stop loops
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
        coopPartner: window.AI_BUDDY.coopPartnerId || (G.coop.partnerId === 'BOT_1' ? 'host' : null) 
    };
}

// 5A. MASTER GAME LOOP INTERCEPT (Bulletproof Co-op Attacking)
const origMasterUpdate = typeof update !== 'undefined' ? update : null;
update = function() {
    if (origMasterUpdate) origMasterUpdate();
    
    // Checks if the bot is alive, in Co-op mode, and in the battle screen
    if (G.isHost && window.AI_BUDDY.spawned) {
        if (G.state === 'battle' && G.battle.isCoop && (G.coop.partnerId === 'BOT_1' || window.AI_BUDDY.coopPartnerId)) {
            
            // Wait until it is explicitly his turn, and no attack animations are playing
            if (G.battle.turn === 'partner' && !G.battle.anim && !G.battle.res) {
                window.AI_BUDDY.battleWait++;
                
                // Wait ~1 second before attacking so it feels human
                if (window.AI_BUDDY.battleWait > 60) {
                    window.AI_BUDDY.battleWait = 0;
                    
                    const botDino = DINOS[window.AI_BUDDY.dk] || DINOS['raptor'];
                    const dmg = Math.max(1, Math.floor(botDino.atk * R_MULT[botDino.rarity]));
                    
                    if (typeof processCoopBattleAction === 'function') {
                        processCoopBattleAction({ action: 'player_attack', dmg: dmg });
                    }
                }
            } else {
                // Reset the timer if it's not his turn
                window.AI_BUDDY.battleWait = 0;
            }
        }
    }
};

// 5B. THE WORLD ENGINE & HUNTING
const origBotUpdateWorld = typeof updateWorld !== 'undefined' ? updateWorld : null;
updateWorld = function() {
    if (origBotUpdateWorld) origBotUpdateWorld();
    
    if (G.isHost && window.AI_BUDDY.spawned) {
        
        // Intercept Co-Op Add Friend Clicks for ANY Player
        if (G.coop.reqTo === 'BOT_1') {
            G.coop.reqTo = null; 
            window.AI_BUDDY.coopPartnerId = window.AI_BUDDY.followingId || G.player.name || 'host'; // Track who clicked
            botSpeak("Yeah! Let's team up!");
            if (typeof bondWithPartner === 'function') bondWithPartner('BOT_1', 'dino buddy'); 
        }
        
        // Follow Logic for ANY Player Target
        if (window.AI_BUDDY.following || G.coop.partnerId === 'BOT_1' || window.AI_BUDDY.coopPartnerId) {
            let targetPlayer = G.player; // Defaults to host
            let targetId = window.AI_BUDDY.coopPartnerId || window.AI_BUDDY.followingId;
            
            // Dynamically locate the targeted player across the network
            if (targetId && targetId !== G.player.name && targetId !== 'host' && targetId !== G.player.id) {
                for (let id in G.otherPlayers) {
                    if (G.otherPlayers[id].name === targetId || id === targetId) {
                        targetPlayer = G.otherPlayers[id];
                        break;
                    }
                }
            }

            const dx = targetPlayer.x - window.AI_BUDDY.x;
            const dy = targetPlayer.y - window.AI_BUDDY.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 1000) {
                window.AI_BUDDY.x = targetPlayer.x;
                window.AI_BUDDY.y = targetPlayer.y;
            } else if (dist > 60) {
                const speed = 2.5;
                window.AI_BUDDY.x += (dx / dist) * speed;
                window.AI_BUDDY.y += (dy / dist) * speed;
                window.AI_BUDDY.anim++;
                window.AI_BUDDY.face = dx > 0 ? 1 : -1;
            }
        } 
        else if (G.state === 'world') {
            
            // --- ACTUAL OVERWORLD FIGHT SEQUENCE ---
            if (window.AI_BUDDY.activityTimer > 0) {
                window.AI_BUDDY.activityTimer--; 
                
                let w = window.AI_BUDDY.huntingTarget;
                if (w && G.wilds.includes(w)) {
                    w.dx = 0; 
                    w.dy = 0; 
                    w.mt = 10; 
                    
                    if (window.AI_BUDDY.activityTimer % 10 === 0) {
                        window.AI_BUDDY.anim++;
                        w.anim++;
                    }
                    
                    // The Dinos Lunge and Hit Each Other Every ~0.6 Seconds
                    if (window.AI_BUDDY.activityTimer % 35 === 0) {
                        let botAttacks = Math.random() > 0.5;
                        if (botAttacks) {
                            // Bot hits wild dino
                            window.AI_BUDDY.x += 8 * window.AI_BUDDY.face;
                            setTimeout(() => { window.AI_BUDDY.x -= 8 * window.AI_BUDDY.face; }, 100);
                            if (typeof spawnParticles !== 'undefined') spawnParticles(w.x, w.y, '#ff4444', 6);
                        } else {
                            // Wild dino hits bot
                            w.x += 8 * w.face;
                            setTimeout(() => { w.x -= 8 * w.face; }, 100);
                            if (typeof spawnParticles !== 'undefined') spawnParticles(window.AI_BUDDY.x, window.AI_BUDDY.y, '#ff8844', 6);
                        }
                    }
                    
                    // The Fight Ends
                    if (window.AI_BUDDY.activityTimer === 1) {
                        let dData = DINOS[w.key];
                        // Win logic: 80% Common, 60% Rare, 30% Epic/Legendary
                        let winChance = dData.rarity === 'Common' ? 0.8 : (dData.rarity === 'Rare' ? 0.6 : 0.3);
                        
                        if (Math.random() < winChance) {
                            // BOT WINS!
                            let idx = G.wilds.indexOf(w);
                            if (idx !== -1) G.wilds.splice(idx, 1);
                            
                            if (!window.AI_BUDDY.unlocked.includes(w.key)) window.AI_BUDDY.unlocked.push(w.key);
                            if (Math.random() < 0.3) window.AI_BUDDY.dk = w.key;
                            if (Math.random() < 0.05) botSpeak(`I just wrecked a wild ${dData.name}!`);
                        } else {
                            // BOT LOSES! Runs away.
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
                        // START THE 4 SECOND FIGHT
                        window.AI_BUDDY.huntingTarget = targetWild;
                        window.AI_BUDDY.activityTimer = 240; 
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
