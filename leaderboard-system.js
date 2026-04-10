import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCiBh7qpo6xukF8d-NSeEzx0sks6rqy_XM",
  authDomain: "backend-server-cb3aa.firebaseapp.com",
  projectId: "backend-server-cb3aa",
  storageBucket: "backend-server-cb3aa.firebasestorage.app",
  messagingSenderId: "136528471367",
  appId: "1:136528471367:web:572f68aa82bfe997b59862",
  measurementId: "G-1BPP79XQP8"
};

const app = initializeApp(firebaseConfig, "leaderboardApp");
const db = getFirestore(app);

// --- 1. THE MONKEY PATCHING (INTERCEPTION) ---

// Patch Save System: Whenever the game saves, it now updates the leaderboard too.
const originalSave = window.saveGame;
window.saveGame = function() {
    if (originalSave) originalSave(); 
    updateLeaderboardData();
};

// Patch the HUD: We inject our new button into the existing HUD loop
const originalDrawHUD = window.drawHUD;
window.drawHUD = function() {
    if (originalDrawHUD) originalDrawHUD(); // Draw the original HUD first

    // Place the button next to the Music button (approx x: 105)
    if (typeof btn === 'function') {
        const musicY = G.coop.partnerId ? 80 : 56;
        btn(105, musicY, 85, 20, 'Ranks', '#aa8800', '#fff', () => {
            openLeaderboard();
        }, '🏆');
    }
};

// Patch the Main Render Loop: If the state is 'leaderboard', we draw our UI
const originalRender = window.render;
window.render = function() {
    originalRender(); // Run the whole game render
    if (G.state === 'leaderboard') {
        drawLeaderboardUI();
    }
};

// --- 2. THE LOGIC ---

async function updateLeaderboardData() {
    const pID = localStorage.getItem('dinoworld_cloud_id');
    if (!pID || !G || G.state === 'intro') return;
    
    try {
        await setDoc(doc(db, "leaderboard", pID), {
            name: G.username || "Anonymous Raptor",
            wheat: G.wheat,
            dino: DINOS[G.player.dk].name,
            ts: Date.now()
        });
    } catch(e) {}
}

async function openLeaderboard() {
    G.state = 'leaderboard';
    window.leaderboardScores = null; // Show loading
    
    const q = query(collection(db, "leaderboard"), orderBy("wheat", "desc"), limit(10));
    try {
        const snap = await getDocs(q);
        let s = [];
        snap.forEach(d => s.push(d.data()));
        window.leaderboardScores = s;
    } catch(e) { console.error(e); }
}

// --- 3. THE "GOOD LOOKING" UI ---

function drawLeaderboardUI() {
    const W = canvas.width;
    const H = canvas.height;
    G.btns = []; // Reset buttons for this frame

    // Glassmorphism Background
    ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
    ctx.fillRect(0, 0, W, H);
    
    // Golden border
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.strokeRect(W/2 - 200, 50, 400, H - 100);

    // Title with Shadow
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 TOP 10 RAPTORS', W/2, 100);
    ctx.shadowBlur = 0;

    // Table Header
    ctx.font = 'bold 16px Courier New';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'left';
    ctx.fillText('RANK  NAME', W/2 - 170, 145);
    ctx.textAlign = 'right';
    ctx.fillText('BUCKETS', W/2 + 170, 145);

    // List
    if (window.leaderboardScores) {
        window.leaderboardScores.forEach((p, i) => {
            const y = 180 + (i * 38);
            ctx.fillStyle = i === 0 ? '#fff' : (i < 3 ? '#ffaa00' : '#aaa');
            
            ctx.textAlign = 'left';
            ctx.font = i === 0 ? 'bold 18px Courier New' : '16px Courier New';
            ctx.fillText(`${i + 1}. ${p.name.substring(0, 12)}`, W/2 - 170, y);
            
            ctx.textAlign = 'right';
            ctx.fillText(`🪣 ${p.wheat.toLocaleString()}`, W/2 + 170, y);
        });
    } else {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Loading Global Ranks...', W/2, H/2);
    }

    // Exit Button
    if (typeof btn === 'function') {
        btn(W/2 - 50, H - 130, 100, 40, 'EXIT', '#aa2222', '#fff', () => {
            G.state = 'world';
        }, '✖');
    }
}
