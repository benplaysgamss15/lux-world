// ==========================================
// 🎵 DINOWORLD AUDIO ENGINE (SEAMLESS LOOP)
// ==========================================

window.isAudioMuted = false;

// 1. Setup the Web Audio API (This allows flawless, gapless looping!)
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// 2. Control the Volume
const gainNode = audioCtx.createGain();
gainNode.gain.value = 0.3; // 30% Volume
gainNode.connect(audioCtx.destination);

let audioBuffer = null;
let sourceNode = null;
let isLoaded = false;

// 3. Fetch the audio file and load it into RAM
// NOTE: Make sure this matches your file name exactly!
fetch('DinoWorld.mp3') 
    .then(response => response.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(buffer => {
        audioBuffer = buffer;
        
        // Build the audio player
        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.loop = true; // SEAMLESS LOOP!
        sourceNode.connect(gainNode);
        sourceNode.start(0); 
        
        isLoaded = true;
        
        // Suspend (pause) it immediately until the game is actually running
        audioCtx.suspend();
    })
    .catch(err => console.error("Audio failed to load:", err));


function toggleMute() {
    window.isAudioMuted = !window.isAudioMuted;
    
    if (window.isAudioMuted) {
        audioCtx.suspend();
    } else if (G && G.state === 'world' && G.level === 1) {
        audioCtx.resume();
    }
}

// Automatically hook into the game loop
setTimeout(() => {
    if (typeof update === 'function') {
        const originalUpdate = update;
        
        update = function() {
            originalUpdate(); // Run the normal game logic first
            
            // Audio Logic
            if (isLoaded && !window.isAudioMuted) {
                // Only play music if we are walking around in Map 1
                if (G.state === 'world' && G.level === 1) {
                    if (audioCtx.state === 'suspended') {
                        audioCtx.resume().catch(() => {});
                    }
                } else {
                    // Instantly pause music if we enter a Battle, Shop, Index, or Map 2!
                    if (audioCtx.state === 'running') {
                        audioCtx.suspend();
                    }
                }
            }
        };
    }
}, 1000);

// Browsers require a click/keypress before allowing audio to play.
function unlockAudio() {
    if (isLoaded && !window.isAudioMuted && G && G.state === 'world' && G.level === 1) {
        audioCtx.resume();
    }
}

window.addEventListener('click', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });
