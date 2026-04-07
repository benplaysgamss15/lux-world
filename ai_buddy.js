p// ==========================================
// 🤖 DINOWORLD AI BUDDY SCRIPT (GEMINI)
// ==========================================
console.log("Loading AI Buddy Script...");

// ── 1. AI BUDDY STATE ──
window.AI_BUDDY = {
    apiKey: null,
    spawned: false,
    following: false,
    x: 0,
    y: 0,
    face: 1,
    anim: 0,
    isFetching: false
};

// ── 2. INTERCEPT CHAT INPUT (For Secret Commands) ──
const origSendChatUI = sendChatUI;

sendChatUI = function() {
    const chatInputEl = document.getElementById('chatInp');
    const msg = chatInputEl.value.trim();
    
    if (msg.startsWith('/')) {
        
        if (msg.startsWith('/api ')) {
            window.AI_BUDDY.apiKey = msg.replace('/api ', '').trim();
            addChatMessage('System', 'API Key saved privately. Your key is safe!');
        } 
        else if (msg === '/summon') {
            if (!G.isHost) {
                addChatMessage('System', 'Only the Room Host can summon the dino buddy!');
            } else if (!window.AI_BUDDY.apiKey) {
                addChatMessage('System', 'You must set an API key first by typing: /api YOUR_KEY_HERE');
            } else {
                window.AI_BUDDY.spawned = true;
                window.AI_BUDDY.following = false;
                
                window.AI_BUDDY.x = (WS/2) * TS;
                window.AI_BUDDY.y = (WS/2) * TS;
                
                addChatMessage('System', 'dino buddy has joined the room!');
                
                G.otherPlayers['BOT_1'] = {
                    x: window.AI_BUDDY.x,
                    y: window.AI_BUDDY.y,
                    dk: 'raptor',
                    face: 1,
                    anim: 0,
                    hat: '',
                    oc: null, 
                    name: 'dino buddy'
                };
                
                // NEW: Make him introduce himself so players know the rules!
                setTimeout(() => {
                    botSpeak("Rawr! I am your Dino Buddy! Say my name to talk to me, or say 'dino buddy, come' to make me follow you!");
                }, 500);
            }
        } 
        else if (msg === '/dismiss') {
            window.AI_BUDDY.spawned = false;
            delete G.otherPlayers['BOT_1'];
            addChatMessage('System', 'dino buddy went home.');
        } 
        else {
            addChatMessage('System', 'Unknown command.');
        }
        
        closeChatUI();
        return; 
    }
    
    origSendChatUI();
};

// ── 3. LISTEN TO PUBLIC CHAT ──
const origAddChatMessage = addChatMessage;

addChatMessage = function(sender, msg) {
    origAddChatMessage(sender, msg);
    
    // Check if the Bot should react to this message
    if (G.isHost && window.AI_BUDDY.spawned && sender !== 'dino buddy' && sender !== 'System') {
        const lowerMsg = msg.toLowerCase();
        
        // Command: Follow
        if (lowerMsg.includes('dino buddy, come')) {
            window.AI_BUDDY.following = true;
            botSpeak("Rawr! I'm coming to you!");
        } 
        // Command: Stop
        else if (lowerMsg.includes('dino buddy, stop')) {
            window.AI_BUDDY.following = false;
            botSpeak("Okay, I will stay right here!");
        }
        // AI Conversation Trigger (Must say "dino buddy" or reply to him with "@dino buddy")
        else if (lowerMsg.includes('dino buddy')) {
            askGemini(msg, sender);
        }
    }
};

function botSpeak(text) {
    addChatMessage('dino buddy', text);
    
    for (let id in G.conns) {
        if (G.conns[id] && G.conns[id].open) {
            G.conns[id].send({ type: 'chat', sender: 'dino buddy', msg: text });
        }
    }
}

// ── 4. GEMINI API CONNECTION ──
async function askGemini(userMessage, playerName) {
    if (window.AI_BUDDY.isFetching) return;
    if (!window.AI_BUDDY.apiKey) return;
    
    window.AI_BUDDY.isFetching = true;
    
    try {
        const systemPrompt = `
            SYSTEM INSTRUCTION: You are 'dino buddy', a friendly Raptor in a multiplayer survival game called DinoWorld. 
            You are talking to a player named ${playerName}.
            You ONLY talk about dinosaurs, survival, buckets, and the game. 
            If the user asks about real-world topics, math, code, or anything outside of dinosaurs, you MUST refuse politely and say 'Rawr! I only know about DinoWorld!'. 
            Never respond to toxic, offensive, or inappropriate messages. 
            Keep your answers very short (1 or 2 sentences maximum). 
            
            USER MESSAGE: ${userMessage}
        `;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${window.AI_BUDDY.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });
        
        // NEW: Error checking! If the API key is wrong, tell the player.
        if (!response.ok) {
            botSpeak("Rawr... I can't think right now. My API key might be invalid!");
            window.AI_BUDDY.isFetching = false;
            return;
        }
        
        const data = await response.json();
        
        if (data && data.candidates && data.candidates.length > 0) {
            let reply = data.candidates[0].content.parts[0].text.trim();
            botSpeak(reply);
        }
        
    } catch (err) {
        console.error("Gemini API Error:", err);
        botSpeak("Rawr... my brain is having trouble connecting right now.");
    }
    
    window.AI_BUDDY.isFetching = false;
}

// ── 5. BOT MOVEMENT LOOP ──
const origBotUpdateWorld = updateWorld;

updateWorld = function() {
    origBotUpdateWorld();
    
    if (G.isHost && window.AI_BUDDY.spawned) {
        
        if (window.AI_BUDDY.following) {
            const dx = G.player.x - window.AI_BUDDY.x;
            const dy = G.player.y - window.AI_BUDDY.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 1000) {
                window.AI_BUDDY.x = G.player.x;
                window.AI_BUDDY.y = G.player.y;
            } 
            else if (dist > 60) {
                const speed = 2.5; 
                window.AI_BUDDY.x += (dx / dist) * speed;
                window.AI_BUDDY.y += (dy / dist) * speed;
                window.AI_BUDDY.anim++;
                window.AI_BUDDY.face = dx > 0 ? 1 : -1;
            }
        }
        
        G.otherPlayers['BOT_1'] = {
            x: window.AI_BUDDY.x,
            y: window.AI_BUDDY.y,
            dk: 'raptor',
            face: window.AI_BUDDY.face,
            anim: window.AI_BUDDY.anim,
            hat: '',
            oc: null, 
            name: 'dino buddy'
        };
    }
};
