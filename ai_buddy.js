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
    model: 'groq/compound-mini',               // <-- Switched to Groq's Compound Mini
    spawned: false,
    following: false,
    x: 0,
    y: 0,
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
        
        if (msg.startsWith('/')) {
            if (msg.startsWith('/api')) {
                // Updated text to ask for Groq Key instead of Gemini
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
                    window.AI_BUDDY.x = (WS/2) * TS;
                    window.AI_BUDDY.y = (WS/2) * TS;
                    
                    addChatMessage('System', 'dino buddy has joined the room!');
                    
                    G.otherPlayers['BOT_1'] = {
                        x: window.AI_BUDDY.x, y: window.AI_BUDDY.y,
                        dk: 'raptor', face: 1, anim: 0, hat: '', oc: null, name: 'dino buddy'
                    };
                }
            } 
            else if (msg === '/dismiss') {
                window.AI_BUDDY.spawned = false;
                delete G.otherPlayers['BOT_1'];
                addChatMessage('System', 'dino buddy went home.');
            } 
            else {
                addChatMessage('System', 'Unknown command. Try /api, /summon, or /dismiss');
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
            botSpeak("Okay, I will stay right here!");
        }
        else if (lowerMsg.includes('dino buddy')) {
            askGroq(msg); // Changed function name to match the new API
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
        // Formatted for OpenAI/Groq standards
        const payload = {
            model: window.AI_BUDDY.model,
            messages: [
                {
                    role: "system",
                    content: "You are 'dino buddy', a friendly Raptor in a multiplayer survival game called DinoWorld. You ONLY talk about dinosaurs, survival, buckets, and the game. Keep your answers very short (1 or 2 sentences)."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            max_tokens: 300   // <-- Token limit set to 300 as requested
        };

        const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // Groq uses Bearer Authorization in the headers, unlike Gemini
                'Authorization': `Bearer ${window.AI_BUDDY.apiKey}` 
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error("Groq API Error:", data.error.message);
            botSpeak(`Rawr... Groq Error: ${data.error.message.split('.')[0]}`);
        } 
        // Groq parses text through choices[0].message.content
        else if (data.choices && data.choices.length > 0) {
            botSpeak(data.choices[0].message.content.trim());
        }
        
    } catch (err) {
        console.error("Network Error:", err);
        botSpeak("Rawr... I can't connect to the internet right now!");
    }
    
    window.AI_BUDDY.isFetching = false;
}

// ── 5. MONKEY PATCH: BOT MOVEMENT LOOP ──
const origBotUpdateWorld = typeof updateWorld !== 'undefined' ? updateWorld : null;

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
        }
        
        G.otherPlayers['BOT_1'] = {
            x: window.AI_BUDDY.x, y: window.AI_BUDDY.y,
            dk: 'raptor', face: window.AI_BUDDY.face, anim: window.AI_BUDDY.anim,
            hat: '', oc: null, name: 'dino buddy'
        };
    }
};
