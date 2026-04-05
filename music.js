// ==========================================
// 🎵 DINOWORLD AUDIO ENGINE
// ==========================================

const bgmMap1 = new Audio('DinoWorld.mp3');
bgmMap1.loop = true;
bgmMap1.volume = 0.3; // 30% Volume

window.isAudioMuted = false;
let playPromise = null; // Keeps track of the audio loading to prevent 60fps spam

function toggleMute() {
    window.isAudioMuted = !window.isAudioMuted;
    
    if (window.isAudioMuted) {
        bgmMap1.pause();
    } else if (G && G.state === 'world' && G.level === 1) {
        bgmMap1.play().catch(() => {});
    }
}

// Automatically hook into the game loop
setTimeout(() => {
    if (typeof update === 'function') {
        const originalUpdate = update;
        
        update = function() {
            originalUpdate(); // Run the normal game logic first
            
            // Audio Logic
            if (!window.isAudioMuted) {
                // Only play music if we are walking around in Map 1
                if (G.state === 'world' && G.level === 1) {
                    
                    // If it is paused, and we aren't currently trying to load it
                    if (bgmMap1.paused && playPromise === null) {
                        playPromise = bgmMap1.play();
                        
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                playPromise = null; // Success!
                            }).catch(e => {
                                playPromise = null; // Browser blocked it, will try again next click
                            });
                        }
                    }
                } else {
                    // Instantly pause music if we enter a Battle, Shop, Index, or Map 2!
                    if (!bgmMap1.paused) {
                        bgmMap1.pause();
                    }
                }
            }
        };
    }
}, 1000);

// Browsers require a click/keypress before allowing audio to play.
// This safely forces the audio to start the exact moment the player starts the game!
window.addEventListener('click', () => {
    if (!window.isAudioMuted && G && G.state === 'world' && G.level === 1 && bgmMap1.paused) {
        bgmMap1.play().catch(() => {});
    }
}, { once: true });

window.addEventListener('keydown', () => {
    if (!window.isAudioMuted && G && G.state === 'world' && G.level === 1 && bgmMap1.paused) {
        bgmMap1.play().catch(() => {});
    }
}, { once: true });
