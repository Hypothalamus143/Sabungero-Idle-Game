class Roosters{
    constructor(playerStats, currentOpponent){
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.init();
    }
    async init(){
    }

    createRoosterContainers() {
        // Just create empty containers at positions
        const playerRoosterContainer = new PIXI.Container();
        this.playerRooster = new PIXI.Graphics();
        playerRoosterContainer.addChild(this.playerRooster);
        this.playerRooster.x = window.app.screen.width / 2;
        this.playerRooster.y = window.app.screen.height / 2;
        
        const opponentRoosterContainer = new PIXI.Container();
        this.opponentRooster = new PIXI.Graphics();
        opponentRoosterContainer.addChild(this.opponentRooster);
        this.opponentRooster.x = window.app.screen.width * 0.7;
        this.opponentRooster.y = window.app.screen.height / 2;
        this.opponentRooster.visible = false;
        window.stageContainer.addChild(playerRoosterContainer, opponentRoosterContainer);
    }

    updateRoosters() {
        console.log('🔄 Updating all roosters');
        // Update player rooster
        if (this.playerStats && this.playerStats.appearance) {
            this.updateSingleRooster(this.playerRooster, this.playerStats, true);
        } else {
            console.warn('❌ Player stats not loaded yet', 'player: ',this.playerStats, ' opponent:',this.currentOpponent);
        }
        
        // Update opponent rooster if we have one
        if (this.currentOpponent && this.currentOpponent.appearance) {
            this.updateSingleRooster(this.opponentRooster, this.currentOpponent, false);
        } else {
            console.warn('❌ Opponent stats not loaded yet', ' opponent:',this.currentOpponent);
        }
    }
    
    updateSingleRooster(rooster, stats, isPlayer) { 
        rooster.clear();
        
        const level = stats.level;
        const appearance = stats.appearance;
        const baseSize = 30;
        const growthFactor = 5;
        const size = baseSize + (level * growthFactor);
        
        // Remove old glow
        const oldGlow = rooster.getChildByName('glow');
        if (oldGlow) {
            rooster.removeChild(oldGlow);
        }
        
        // Main circle - color based on avatarId
        const avatarColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e];
        const mainColor = avatarColors[appearance.avatarId - 1];
        
        rooster.circle(0, 0, size);
        rooster.fill({"color":mainColor});
        
        // Border - color based on accessoryId  
        const borderColors = [0xc0392b, 0x2980b9, 0x27ae60, 0xd35400, 0x8e44ad, 0x16a085, 0xc0392b, 0x2c3e50];
        const borderColor = borderColors[appearance.accessoryId];
        const borderWidth = isPlayer ? 3 : 2;
        
        rooster.stroke({
            width: borderWidth,
            color: borderColor
        });
        
        // Glow effect based on glowId (index-based)
        const glowColors = [0x000000, 0xcd7f32, 0xc0c0c0, 0xffd700, 0xe5e4e2, 0xb9f2ff, 0xff00ff, 0xff0000];
        const glowId = appearance.glowId || 0;
        
        if (glowId > 0) { // Only add glow if not Novice (glowId 0)
            const glowContainer = new PIXI.Container();
            const glow = new PIXI.Graphics();
            glow.label = 'glow';
            glow.circle(0, 0, size + (isPlayer ? 8 : 6));
            glow.fill({"color": glowColors[glowId], "alpha":0.4});
            glowContainer.addChild(glow);
            rooster.addChild(glowContainer);
        }
    }
}