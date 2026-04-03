// ── ZONE GENERATOR SCRIPT ──

function loadZone(zoneName, teleportX, teleportY) {
    // This starts the fade effect!
    G.fade.active = true;
    G.fade.opacity = 0;
    G.fade.phase = 'out';
    G.fade.targetRoom = zoneName;
    G.fade.targetX = teleportX;
    G.fade.targetY = teleportY;
}

function executeZoneSwap() {
    try {
        // Physically change the map variables while the screen is pitch black
        G.room = G.fade.targetRoom;
        G.player.x = G.fade.targetX;
        G.player.y = G.fade.targetY;
        
        // Clear wild dinos and hazards temporarily
        G.wilds = []; 
        G.hazards = [];
        
        if (G.room === 'main') {
            generateWorld();
            spawnWilds();
            if(G.level === 1) spawnMega();
        } else if (G.room === 'cave') {
            buildCaveMap();
        } else if (G.room === 'mountain') {
            buildMountainMap();
        }
        
        // Snap camera to new location
        G.cam.x = Math.max(0, Math.min(WS*TS - canvas.width, G.player.x - canvas.width/2)); 
        G.cam.y = Math.max(0, Math.min(WS*TS - canvas.height, G.player.y - canvas.height/2));
        
    } catch (error) {
        console.error(error);
        addChatMessage('System', 'Map Load Error: ' + error.message);
        // Force the game to unfreeze if an error happens
        G.fade.phase = 'in'; 
    }
}

function buildCaveMap() {
    for(let y=0; y<WS; y++){
        worldMap[y] = [];
        tileClr[y] = [];
        for(let x=0; x<WS; x++){
            worldMap[y][x] = 0; 
            tileClr[y][x] = '#222222'; // Dark floor for the cave
        }
    }
}

function buildMountainMap() {
    for(let y=0; y<WS; y++){
        worldMap[y] = [];
        tileClr[y] = [];
        for(let x=0; x<WS; x++){
            worldMap[y][x] = 0; 
            tileClr[y][x] = '#dddddd'; // Snow floor for the mountain
        }
    }
}
