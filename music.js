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

// 3. The Music Files (Make sure your GitHub files match these names!)
const TRACKS = {
    map1: 'DinoWorld.mp3',
    map2: 'DinoWorld2 OST.mp3',
    shop: 'DinoWorld OST.mp3',
    battle1: 'battle_map1.mp3',
    boss1: 'boss_map1.mp3',
    battle2: 'battle_map2.mp3',
    boss2: 'boss_map2.mp3'
};

// Internal memory for the DJ
const buffers = {};
const offsets = {}; 
Object.keys(TRACKS).forEach(k => offsets[k] = 0); // Sets all song memories to 0 seconds initially

let currentTrack = null;
let currentSource = null;
let lastStartTime = 0;

// 4. Preload all songs into RAM so they can swap instantly
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
        // Calculate exactly how many seconds we listened to the song
        const elapsed = audioCtx.currentTime - lastStartTime;
        offsets[currentTrack] = (offsets[currentTrack] + elapsed) % buffers[currentTrack].duration;
        
        // SPECIAL RULE: Always restart Battle & Boss themes from the beginning!
        if (['battle1', 'boss1', 'battle2', 'boss2'].includes(currentTrack)) {
            offsets[currentTrack] = 0; 
        }
        
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

    // If we only wanted to pause (e.g. entering Index), exit here.
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

// 8. Hook into the Game Loop
setTimeout(() => {
    if (typeof update === 'function') {
        const originalUpdate = update;
        
        update = function() {
            originalUpdate(); // Run normal game logic
            
            // Audio Logic
            if (!window.isAudioMuted && audioCtx.state === 'running') {
                let target = null; // Default is null (silence) for menus like Index/Customize

                // Check what the player is doing
                if (G.state === 'world') {
                    target = (G.level === 2) ? 'map2' : 'map1';
                } else if (G.state === 'shop') {
                    target = 'shop';
                } else if (G.state === 'battle' && G.battle) {
                    // Decide which battle theme to play!
                    if (G.level === 1) {
                        target = G.battle.isBoss ? 'boss1' : 'battle1';
                    } else if (G.level === 2) {
                        target = G.battle.isBoss ? 'boss2' : 'battle2';
                    }
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
