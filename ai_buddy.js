// ==========================================
// 🤖 DINOWORLD AI BUDDY SCRIPT (GEMINI) - V3
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
        // Look for 'chatInp', but if it fails, try to grab whatever you are currently typing in
        const chatInputEl = document.getElementById('chatInp') || document.activeElement;
        
        // If we STILL can't find the chat box, just run the normal game chat and stop
        if (!chatInputEl || chatInputEl.value === undefined) {
            console.error("DinoBuddy Error: Could not find the chat box!");
            return origSendChatUI();
        }

        const msg = chatInputEl.value.trim();
        
        // Check if it is a secret command
        if (msg.startsWith('/')) {
            
            if (msg.startsWith('/api')) {
                // FOOLPROOF FIX: Open a browser popup to ask for the key
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
            
            // Clear the chat box so you don't accidentally send the command to the public
            chatInputEl.value = '';
            
            // Safe close: Only run closeChatUI if the game actually has that function
            if (typeof closeChatUI === 'function') {
                closeChatUI();
            } else if (typeof document.activeElement.blur === 'function') {
                document.activeElement.blur(); // Drops focus from the chat box safely
            }
            return; 
        }
        
        // If it's a normal message, let the original chat function handle it
        origSendChatUI();

    } catch (error) {
        // If anything crashes, print it to the F12 console and let normal chat work so your game doesn't break
        console.error("DinoBuddy Intercept Error:", error);
        origSendChatUI();
    }
};

// ── 3. MONKEY PATCH: LISTEN TO PUBLIC CHAT ──
const origAddChatMessage = addChatMessage;

addChatMessage = function(sender, msg) {
    // Let the message display normally on screen
    origAddChatMessage(sender, msg);
    
    // The Host's computer acts as the "Brain" for the bot
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
        // AI Conversation Trigger
        else if (lowerMsg.includes('dino buddy')) {
            askGemini(msg);
        }
    }
};

// Helper function to make the bot talk to the entire room
function botSpeak(text) {
    // Show it on the host's screen
    origAddChatMessage('dino buddy', text);
    
    // Send it to all connected friends in the room
    for (let id in G.conns) {
        if (G.conns[id] && G.conns[id].open) {
            G.conns[id].send({ type: 'chat', sender: 'dino buddy', msg: text });
        }
    }
}

// ── 4. GEMINI API CONNECTION ──
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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${window.AI_BUDDY.apiKey}`, {
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
