// ==========================================
// 🤖 DINOWORLD AI BUDDY SCRIPT (GEMINI 3.1)
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

// ── 2. MONKEY PATCH: INTERCEPT CHAT INPUT ──
const origSendChatUI = sendChatUI;

sendChatUI = function() {
    try {
        const chatInputEl = document.getElementById('chatInp') || document.activeElement;
        
        if (!chatInputEl || chatInputEl.value === undefined) {
            console.error("DinoBuddy Error: Could not find the chat box!");
            return origSendChatUI();
        }

        const msg = chatInputEl.value.trim();
        
        if (msg.startsWith('/')) {
            
            if (msg.startsWith('/api')) {
                const userKey = prompt("🦖 DINO BUDDY SETUP:\nPlease paste your Gemini API Key here:");
                
                if (userKey && userKey.trim() !== "") {
                    window.AI_BUDDY.apiKey = userKey.trim();
                    addChatMessage('System', 'API Key saved privately! You can now type /summon');
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
                        x: window.AI_BUDDY.x,
                        y: window.AI_BUDDY.y,
                        dk: 'raptor',
                        face: 1,
                        anim: 0,
                        hat: '',
                        oc: null, 
                        name: 'dino buddy'
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
            
            if (typeof closeChatUI === 'function') {
                closeChatUI();
            } else if (typeof document.activeElement.blur === 'function') {
                document.activeElement.blur(); 
            }
            return; 
        }
        
        origSendChatUI();

    } catch (error) {
        console.error("DinoBuddy Intercept Error:", error);
        origSendChatUI();
    }
};

// ── 3. MONKEY PATCH: LISTEN TO PUBLIC CHAT ──
const origAddChatMessage = addChatMessage;

addChatMessage = function(sender, msg) {
    origAddChatMessage(sender, msg);
    
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
            askGemini(msg);
        }
    }
};

function botSpeak(text) {
    origAddChatMessage('dino buddy', text);
    
    for (let id in G.conns) {
        if (G.conns[id] && G.conns[id].open) {
            G.conns[id].send({ type: 'chat', sender: 'dino buddy', msg: text });
        }
    }
}

// ── 4. GEMINI API CONNECTION (UPDATED FOR GEMINI 3.1) ──
async function askGemini(userMessage) {
    if (window.AI_BUDDY.isFetching) return;
    if (!window.AI_BUDDY.apiKey) return;
    
    window.AI_BUDDY.isFetching = true;
    
    try {
        const payload = {
            system_instruction: {
                parts: { text: "You are 'dino buddy', a friendly Raptor in a multiplayer survival game called DinoWorld. You ONLY talk about dinosaurs, survival, buckets, and the game. If the user asks about real-world topics, math, code, or anything outside of dinosaurs, you MUST refuse politely and say 'Rawr! I only know about DinoWorld!'. Never respond to toxic messages. Keep your answers very short (1 or 2 sentences maximum)." }
            },
            contents: [{
                parts: [{ text: userMessage }]
            }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        // 🚨 UPGRADED TO gemini-3.1-flash-lite-preview 🚨
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${window.AI_BUDDY.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini API Error:", data.error.message);
            botSpeak(`Rawr... Google said: ${data.error.message}`);
        } 
        else if (data.candidates && data.candidates.length > 0) {
            const content = data.candidates[0].content;
            if (content && content.parts && content.parts.length > 0) {
                let reply = content.parts[0].text.trim();
                botSpeak(reply);
            } else {
                botSpeak("Rawr... my safety filters blocked me from answering that.");
            }
        } else {
            botSpeak("Rawr? I got confused and have no response.");
        }
        
    } catch (err) {
        console.error("Network Error:", err);
        botSpeak("Rawr... I can't connect to the internet right now!");
    }
    
    window.AI_BUDDY.isFetching = false;
}

// ── 5. MONKEY PATCH: BOT MOVEMENT LOOP ──
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
