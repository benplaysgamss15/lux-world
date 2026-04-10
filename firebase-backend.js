import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCiBh7qpo6xukF8d-NSeEzx0sks6rqy_XM",
  authDomain: "backend-server-cb3aa.firebaseapp.com",
  projectId: "backend-server-cb3aa",
  storageBucket: "backend-server-cb3aa.firebasestorage.app",
  messagingSenderId: "136528471367",
  appId: "1:136528471367:web:572f68aa82bfe997b59862",
  measurementId: "G-1BPP79XQP8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get or Create a Player ID so we know whose data is whose
let playerID = localStorage.getItem('dinoworld_cloud_id');
if (!playerID) {
    playerID = 'p_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('dinoworld_cloud_id', playerID);
}

// THE CLOUD LOAD FUNCTION
window.loadSaveData = async function() {
    console.log("Checking Cloud for saves...");
    try {
        const docRef = doc(db, "players", playerID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            window.activeSave = docSnap.data();
            console.log("Cloud Save Found and Loaded!");
        } else {
            console.log("No cloud save found for this ID.");
        }
    } catch (e) {
        console.error("Cloud Load Error:", e);
    }
};

// THE CLOUD SAVE FUNCTION
window.saveGame = async function() {
    if (typeof G === 'undefined' || G.state === 'intro' || G.coop.partnerId) return; 
    
    const data = {
        ts: Date.now(), 
        level: G.level, 
        wheat: G.wheat, 
        player: G.player, 
        playerHp: G.playerHp, 
        playerShield: G.playerShield, 
        discovered: G.discovered, 
        volcanoTimer: G.volcanoTimer, 
        megaTimer: G.megaTimer, 
        megaOnLand: G.megaOnLand 
    };

    try {
        await setDoc(doc(db, "players", playerID), data);
        console.log("Saved to Cloud!");
    } catch (e) {
        console.error("Cloud Save Error:", e);
    }
};

// Start the load process immediately
window.loadSaveData();
