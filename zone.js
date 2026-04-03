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
    // This physically changes the map variables while the screen is pitch black
    G.room = G.fade.targetRoom;
    G.player.x = G.fade.targetX;
    G.player.y = G.fade.targetY;
    
    // Clear wild dinos temporarily
    G.wilds = []; 
    
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
}

function buildCaveMap() {
    // Placeholder: We will write the 2D array generation for the Cave here in Stage 1.2
    for(let y=0; y<WS; y++){
        worldMap[y] = [];
        tileClr[y] = [];
        for(let x=0; x<WS; x++){
            worldMap[y][x] = 0; 
            tileClr[y][x] = '#333333'; // Temporary dark stone
        }
    }
}

function buildMountainMap() {
    // Placeholder: We will write the 2D array generation for the Mountain here in Stage 1.2
    for(let y=0; y<WS; y++){
        worldMap[y] = [];
        tileClr[y] = [];
        for(let x=0; x<WS; x++){
            worldMap[y][x] = 0; 
            tileClr[y][x] = '#ffffff'; // Temporary snow
        }
    }
}
