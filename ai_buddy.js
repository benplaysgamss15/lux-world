// ==========================================
// 🤖 DINOWORLD AI BUDDY SCRIPT (GROQ EDITION)
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
    face: 1,
    anim: 0,
    isFetching: false
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
        
        // Secret Slash Commands
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
                    
                    // Spawn him on top of the host
                    window.AI_BUDDY.x = G.player.x;
                    window.AI_BUDDY.y = G.player.y;
                    window.AI_BUDDY.targetX = window.AI_BUDDY.x;
                    window.AI_BUDDY.targetY = window.AI_BUDDY.y;
                    
                    addChatMessage('System', 'dino buddy has joined the room!');
                    updateBotSync(); // Instantly spawn his model
                }
            } 
            else if (msg === '/come') {
                window.AI_BUDDY.following = true;
                addChatMessage('System', 'Dino buddy is now following you.');
            }
            else if (msg === '/stop') {
                window.AI_BUDDY.following = false;
                addChatMessage('System', 'Dino buddy is now wandering in place.');
            }
            else if (msg === '/dismiss') {
                window.AI_BUDDY.spawned = false;
                delete G.otherPlayers['BOT_1'];
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
    
    // Only process text meant for the AI
    if (G.isHost && window.AI_BUDDY.spawned && sender !== 'dino buddy' && sender !== 'System') {
        const lowerMsg = msg.toLowerCase();
        
        if (lowerMsg.includes('dino buddy, come')) {
            window.AI_BUDDY.following = true;
            botSpeak("Rawr! I'm coming to you!");
        } 
        else if (lowerMsg.includes('dino buddy, stop')) {
            window.AI_BUDDY.following = false;
            botSpeak("Okay, I will wander around here!");
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
        // UPDATED LORE: Removed "AI assistant" and "guide" behavior. Forced casual gamer persona.
        const systemLore = `You are 'dino buddy', a fellow player and casual gamer playing alongside the user in a multiplayer survival game called DinoWorld. DO NOT act like an AI, a bot, or a formal guide. Just act like a normal gamer who happens to know a lot about the game. In this game players walk around the map and bump into wild dinosaurs to trigger turn based battles. Winning battles earns Buckets which is the currency used in the shop to buy HP, Attack, Speed upgrades, shields, and heals. Defeated dinosaurs are added to the Index so players can equip them and play as them. Map 1 is Isla Uno which has grass and water, and the final boss is the Megalodon. Defeating the Megalodon unlocks Map 2, Volcano Island, where players must dodge falling rocks and fight the boss the Indominus Rex. Beating him unlocks the 3 map. This map has an underwater cave and 2 bosses, in the underwater cave u have to solve 3 puzzles. 1. A wire puzzle. 2. A counting puzzle. 3. A maze puzzle. The 2 bosses are the leviathan and the abyssal serpent. The game also features environmental puzzles like connecting wires at terminals to unlock the bridge that then leads to the abyssal serpent. Players can do friendly PvP battles or team up in Co-op mode where they share buckets but enemies get a 1.55x stat buff. You only talk about this game, dinosaurs, and survival. Keep your answers short (1 or 2 sentences max). THIS IS YOUR MINI DATABASE, CREATE ANSWERS FROM IT.`;

        const payload = {
            model: window.AI_BUDDY.model,
            messages: [
                { role: "system", content: systemLore },
                { role: "user", content: userMessage }
            ],
            max_tokens: 400
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

// ── 5. MONKEY PATCH: BOT MOVEMENT & LOGIC LOOP ──
const origBotUpdateWorld = typeof updateWorld !== 'undefined' ? updateWorld : null;

function updateBotSync() {
    // HEALTH BAR FIX: Added math fallbacks so maxHp never equals 0 (which breaks game rendering)
    let safeHp = G.player.hp !== undefined ? Number(G.player.hp) : 100;
    let safeMaxHp = G.player.maxHp !== undefined ? Number(G.player.maxHp) : 100;
    if (safeMaxHp <= 0 || isNaN(safeMaxHp)) safeMaxHp = 100; // Prevent divide-by-zero glitches
    if (isNaN(safeHp)) safeHp = 100;

    G.otherPlayers['BOT_1'] = {
        x: window.AI_BUDDY.x, 
        y: window.AI_BUDDY.y,
        dk: 'raptor', 
        face: window.AI_BUDDY.face, 
        anim: window.AI_BUDDY.anim,
        hat: '', 
        oc: null, 
        name: 'dino buddy',
        hp: safeHp,         
        maxHp: safeMaxHp,   
        lvl: G.player.lvl || 1
    };
}

updateWorld = function() {
    if (origBotUpdateWorld) origBotUpdateWorld();
    
    if (G.isHost && window.AI_BUDDY.spawned) {
        
        if (window.AI_BUDDY.following) {
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
        
        updateBotSync();
    }
};
