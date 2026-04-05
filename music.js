// ==========================================
// 🎵 DINOWORLD AUDIO ENGINE
// ==========================================

const bgmMap1 = new Audio('DinoWorld.mp3');
bgmMap1.loop = true;
bgmMap1.volume = 0.3; // 30% Volume

window.isAudioMuted = false;

function playMap1Music() {
    if (window.isAudioMuted) return;
    
    // Only play if it's currently paused, so it doesn't stutter
    if (bgmMap1.paused) {
        // The .catch() prevents browser errors if they haven't clicked the screen yet
        bgmMap1.play().catch(e => console.log("Browser blocked autoplay until user clicks."));
    }
}

function stopMusic() {
    bgmMap1.pause();
}

function toggleMute() {
    window.isAudioMuted = !window.isAudioMuted;
    
    if (window.isAudioMuted) {
        stopMusic();
    } else {
        // If unmuted, check if we are on Map 1 in the overworld, and play it!
        if (G.state === 'world' && G.level === 1) {
            playMap1Music();
        }
    }
}
