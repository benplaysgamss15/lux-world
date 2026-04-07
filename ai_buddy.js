// ==========================================
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

// ── 2. MONKEY PATCH: INTERCEPT CHAT INPUT ──
// We hijack the send function to catch secret commands BEFORE they go public!
const origSendChatUI = sendChatUI;

sendChatUI = function() {
    const chatInputEl = document.getElementById('chatInp');
    const msg = chatInputEl.value.trim();
    
    // Check if it is a secret command
    if (msg.startsWith('/')) {
        
        if (msg.startsWith('/api ')) {
            // Save the key privately and do NOT broadcast it
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
                
                // Spawn him perfectly in the middle of the map
                window.AI_BUDDY.x = (WS/2) * TS;
                window.AI_BUDDY.y = (WS/2) * TS;
                
                addChatMessage('System', 'dino buddy has joined the room!');
                
                // Inject him into the multiplayer list so he renders instantly!
                G.otherPlayers['BOT_1'] = {
                    x: window.AI_BUDDY.x,
                    y: window.AI_BUDDY.y,
                    dk: 'raptor',
                    face: 1,
                    anim: 0,
                    hat: '',
                    oc: null, // Normal Raptor colors
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
            addChatMessage('System', 'Unknown command.');
        }
        
        // Close the chat UI without sending the message to the server
        closeChatUI();
        return; 
    }
    
    // If it's a normal message, let the original chat function handle it
    origSendChatUI();
};

// ── 3. MONKEY PATCH: LISTEN TO PUBLIC CHAT ──
// We hijack the chat reader so the Bot can "hear" what people type
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
    addChatMessage('dino buddy', text);
    
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
        // 1. Use the official System Instructions format for Gemini 1.5
        const payload = {
            system_instruction: {
                parts: { text: "You are 'dino buddy', a friendly Raptor in a multiplayer survival game called DinoWorld. You ONLY talk about dinosaurs, survival, buckets, and the game. If the user asks about real-world topics, math, code, or anything outside of dinosaurs, you MUST refuse politely and say 'Rawr! I only know about DinoWorld!'. Never respond to toxic messages. Keep your answers very short (1 or 2 sentences maximum)." }
            },
            contents: [{
                parts: [{ text: userMessage }]
            }],
            // 2. Lower safety settings so survival game talk isn't blocked by accident
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
        
        // 3. STOP SILENT FAILURES! Tell the chat exactly why it failed.
        if (data.error) {
            console.error("Gemini API Error:", data.error.message);
            botSpeak(`Rawr... Google said: ${data.error.message}`);
        } 
        // Check if we got a valid response back
        else if (data.candidates && data.candidates.length > 0) {
            const content = data.candidates[0].content;
            
            // Sometimes safety filters block the text AFTER generation
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
// We hijack the world update to physically move the bot on the map
const origBotUpdateWorld = updateWorld;

updateWorld = function() {
    origBotUpdateWorld();
    
    if (G.isHost && window.AI_BUDDY.spawned) {
        
        if (window.AI_BUDDY.following) {
            // Find distance between Host and Bot
            const dx = G.player.x - window.AI_BUDDY.x;
            const dy = G.player.y - window.AI_BUDDY.y;
            const dist = Math.hypot(dx, dy);
            
            // If the host teleports really far away (like entering a cave), teleport the bot instantly!
            if (dist > 1000) {
                window.AI_BUDDY.x = G.player.x;
                window.AI_BUDDY.y = G.player.y;
            } 
            // Otherwise, slowly walk toward the host, stopping when close
            else if (dist > 60) {
                const speed = 2.5; // A slow, steady pace
                window.AI_BUDDY.x += (dx / dist) * speed;
                window.AI_BUDDY.y += (dy / dist) * speed;
                window.AI_BUDDY.anim++;
                window.AI_BUDDY.face = dx > 0 ? 1 : -1;
            }
        }
        
        // Update the Bot's data in the sync list so all friends see him moving!
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
