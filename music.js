// ==========================================
// 🎵 DINOWORLD MULTI-TRACK AUDIO ENGINE
// ==========================================

window.isAudioMuted = false;

// 1. Setup the Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// 2. Control the Master Volume
const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.3; // 30% Volume
masterGain.connect(audioCtx.destination);

// 3. The Music Files
const TRACKS = {
    map1: 'DinoWorld.mp3',
    map2: 'DinoWorld2 OST.mp3',
    shop: 'DinoWorld OST.mp3'
};

// Internal memory for the DJ
const buffers = {};
const offsets = { map1: 0, map2: 0, shop: 0 }; // Remembers where each song paused!
let currentTrack = null;
let currentSource = null;
let lastStartTime = 0;

// 4. Preload all 3 songs into RAM so they can swap instantly
Object.keys(TRACKS).forEach(key => {
    fetch(TRACKS[key])
        .then(response => response.arrayBuffer())
        .then(data => audioCtx.decodeAudioData(data))
        .then(buffer => { 
            buffers[key] = buffer; 
            console.log(`🎵 Loaded: ${key}`);
        })
        .catch(err => console.error(`Error loading ${TRACKS[key]}:`, err));
});

// 5. The function that smoothly stops the current song
function stopCurrentTrack() {
    if (currentTrack && currentSource && buffers[currentTrack]) {
        // Calculate exactly how many seconds we listened to the song, and save it!
        const elapsed = audioCtx.currentTime - lastStartTime;
        offsets[currentTrack] = (offsets[currentTrack] + elapsed) % buffers[currentTrack].duration;
        
        try { currentSource.stop(); } catch(e){}
        currentSource.disconnect();
    }
    currentSource = null;
    currentTrack = null;
}

// 6. The function that switches tracks based on game state
function switchTrack(targetTrack) {
    // If we are already playing the target track (or if both are null/silent), do nothing!
    if (currentTrack === targetTrack && (currentSource !== null || targetTrack === null)) return;

    // If the game wants to play a track, but the track hasn't finished downloading yet:
    if (targetTrack !== null && !buffers[targetTrack]) {
        stopCurrentTrack(); // Stop the old music so they don't overlap, and wait.
        return; 
    }

    // Stop whatever is currently playing
    stopCurrentTrack();

    // If we only wanted to pause (e.g. entering a battle), exit here.
    if (targetTrack === null) return;

    // Start the new track exactly where we left off last time
    currentTrack = targetTrack;
    currentSource = audioCtx.createBufferSource();
    currentSource.buffer = buffers[targetTrack];
    currentSource.loop = true; // Flawless gapless loop!
    currentSource.connect(masterGain);
    
    currentSource.start(0, offsets[targetTrack]);
    lastStartTime = audioCtx.currentTime;
}

// 7. Mute Button Logic
function toggleMute() {
    window.isAudioMuted = !window.isAudioMuted;
    if (window.isAudioMuted) {
        audioCtx.suspend();
    } else {
        audioCtx.resume();
    }
}

// 8. Hook into the Game Loop (No need to edit game.js!)
setTimeout(() => {
    if (typeof update === 'function') {
        const originalUpdate = update;
        
        update = function() {
            originalUpdate(); // Run normal game logic
            
            // Audio Logic
            if (!window.isAudioMuted && audioCtx.state === 'running') {
                let target = null; // Default is null (silence) for Battles, Index, etc.

                // Check what the player is doing
                if (G.state === 'world') {
                    if (G.level === 1) target = 'map1';
                    if (G.level === 2) target = 'map2';
                } else if (G.state === 'shop') {
                    target = 'shop';
                }

                // Tell the DJ to play the right song!
                switchTrack(target);
            }
        };
    }
}, 1000);

// Browsers require a click/keypress before allowing audio to play.
function unlockAudio() {
    if (!window.isAudioMuted && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Listen for the first click or keyboard tap
window.addEventListener('click', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });
