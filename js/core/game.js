// Four possible battle formations
const BATTLE_FORMATIONS = [
            // Player Upper Left, Opponent Lower Right
            { playerPos: [0.1, 0.1], opponentPos: [0.9, 0.9], name: "Horizontal Face-off" },
            
            // Player Lower Right, Opponent Upper Left  
            { playerPos: [0.9, 0.9], opponentPos: [0.1, 0.1], name: "Reverse Horizontal" },
            
            // Player Lower Left , Opponent Upper Right
            { playerPos: [0.1, 0.9], opponentPos: [0.9, 0.1], name: "Vertical Stand-off" },
            
            // Player Upper Right, Lower Left
            { playerPos: [0.9, 0.1], opponentPos: [0.1, 0.9], name: "Reverse Vertical" }
            ];

class SabungeroGame {
    constructor() {
        this.playerStats = {}; // Empty - will be loaded from backend
        this.playerGlow = null;
        this.opponentGlow = null;
        this.currentOpponent = {};
        this.currentQuest = {};
        this.idleInterval = null;
        this.keysPressedCount = 0;
        this.lastKeyPressTime = 0;
        window.app.uiSystem = new UISystem(this.playerStats, this.currentOpponent);
        this.battleSystem = new BattleSystem(this.playerStats, this.currentOpponent);
        this.learningSystem = new LearningSystem(this.playerStats);
        this.idleSystem = new IdleSystem(this.playerStats);
        this.init();
    }
    async init() {
        // Initialize SQL.js database first
        await BrowserDB.init();
        BrowserDB.load();
        // Load player stats from BrowserDB instead of backend
        const savedStats = BrowserDB.loadPlayerStats();
        if (savedStats) {
            Object.assign(this.playerStats, savedStats)
        } else {
           // Show avatar creation instead of auto-creating
            await this.showAvatarCreation();
        }
        // Save default stats
        BrowserDB.savePlayerStats(this.playerStats);
        this.learningSystem.initializeDefaultContent();
        document.getElementById('game-container').appendChild(window.app.canvas);
        
        // Initialize event listeners first
        this.initEventListeners();

        // Create empty rooster containers

        window.app.uiSystem.roosters.createRoosterContainers();

        window.app.uiSystem.updateUI();
        this.showScreen("main");

        console.log("🎮 Sabungero Idle Game initialized!");
    }
    initEventListeners() {
        // Navigation buttons
        document.getElementById('nav-main').addEventListener('click', () => {
            this.showScreen('main');
        });
        document.getElementById('nav-quests').addEventListener('click', () => {
            this.showScreen('quests');
        });

        document.getElementById('nav-arena').addEventListener('click', () => {
            this.showScreen('arena');
        });
    
        // Keyboard listener for idle gains
        document.addEventListener('keydown', (e) => {
            if (this.learningSystem.inputFocused) return;
            if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                window.app.uiSystem.activeKeys.add(e.key.toLowerCase());
                this.keysPressedCount++;
                this.lastKeyPressTime = Date.now();
                this.updateKeyIndicators();
                
                // Add experience based on keys pressed and multiplierS
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', (e) => {
            window.app.uiSystem.activeKeys.delete(e.key.toLowerCase());
            this.updateKeyIndicators();
            e.preventDefault();
        });
        window.addEventListener('beforeunload', () => {
            BrowserDB.savePlayerStats(this.playerStats);
        });
        window.addEventListener('resize', () => this.updateAllPositions());
    }
    
    showScreen(screenName) {
        // Simple check - if battle is active, block navigation
        if (this.battleSystem.battleStates.isBattleActive) {
            return;
        }
        // First, stop any existing idle loop
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
            this.idleInterval = null;
        }
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
            this.idleInterval = null;  // ← ADD THIS LINE
        }
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        document.getElementById(`nav-${screenName}`).classList.add('active');
        
        // Show/hide panels based on screen
        const statsPanel = document.querySelector('.stats-panel');
        const learningPanel = document.querySelector('.learning-panel');
        const battlePanel = document.querySelector('.battle-panel');
        switch(screenName) {
            case 'main':
                statsPanel.style.display = 'block';
                learningPanel.style.display = 'none';
                battlePanel.style.display = 'none';
                this.battleSystem.battleAnimationManager.arenaBg.visible = false;
                window.app.uiSystem.roosters.playerRooster.visible = true;
                window.app.uiSystem.roosters.opponentRooster.visible = false;
                this.updateAllPositions();
                this.idleSystem.startIdleLoop();
                break;
            case 'quests':
                statsPanel.style.display = 'none';
                learningPanel.style.display = 'block';
                battlePanel.style.display = 'none';
                this.battleSystem.battleAnimationManager.arenaBg.visible = false;
                window.app.uiSystem.roosters.playerRooster.visible = true;
                window.app.uiSystem.roosters.opponentRooster.visible = false;
                this.updateAllPositions();
                this.learningSystem.showLearningMain();
                break;
            case 'arena':
                statsPanel.style.display = 'block';
                learningPanel.style.display = 'none';
                battlePanel.style.display = 'block';
                this.battleSystem.battleAnimationManager.arenaBg.visible = true;
                

                // Reset battle state when entering arena
                if (this.battleSystem.battleStates.battleState !== 'fighting') {
                    this.battleSystem.battleStates.isBattleActive = false;
                    this.battleSystem.battleStates.battleState = 'idle';
                    this.battleSystem.battleAnimationManager.stopJitterAnimation();
                }
                if (!this.currentOpponent) {
                    this.battleSystem.battleStates.isBattleActive = false;
                    this.battleSystem.battleStates.battleState = 'idle';
                }
                this.updateAllPositions();
                // Always ensure player is positioned correctly
                window.app.uiSystem.roosters.playerRooster.visible = true;
                // Update roosters to ensure they're drawn with current data
                window.app.uiSystem.roosters.updateRoosters();
                break;
        }
        // Update roosters after screen switch
        window.app.uiSystem.roosters.updateRoosters();
    }

    updateKeyIndicators() {
        // Update key count display
        document.getElementById('active-keys-count').textContent = window.app.uiSystem.activeKeys.size;
    }
    savePlayerData() {
        if (this.playerStats && BrowserDB.db) {
            BrowserDB.savePlayerStats(this.playerStats);
            console.log('💾 Player data saved (beforeunload)');
        }
    }
    // In your showAvatarCreation() method, update the avatar preview
    showAvatarCreation() {
        return new Promise((resolve) => { // 👈 ADD THIS LINE
            const modal = document.getElementById('avatar-creation-modal');
            modal.style.display = 'flex';
            
            // Define color options
            this.avatarColors = [
                { id: 1, main: 0xe74c3c, border: 0xc0392b, name: "Red" },
                { id: 2, main: 0x3498db, border: 0x2980b9, name: "Blue" },
                { id: 3, main: 0x2ecc71, border: 0x27ae60, name: "Green" },
                { id: 4, main: 0xf39c12, border: 0xd35400, name: "Orange" },
                { id: 5, main: 0x9b59b6, border: 0x8e44ad, name: "Purple" },
                { id: 6, main: 0x1abc9c, border: 0x16a085, name: "Teal" },
                { id: 7, main: 0xe67e22, border: 0xc0392b, name: "Carrot" },
                { id: 8, main: 0x34495e, border: 0x2c3e50, name: "Dark" }
            ];
            
            this.borderColors = [
                { id: 0, color: 0xc0392b, name: "Dark Red" },
                { id: 1, color: 0x2980b9, name: "Dark Blue" },
                { id: 2, color: 0x27ae60, name: "Dark Green" },
                { id: 3, color: 0xd35400, name: "Dark Orange" },
                { id: 4, color: 0x8e44ad, name: "Dark Purple" },
                { id: 5, color: 0x16a085, name: "Dark Teal" },
                { id: 6, color: 0xc0392b, name: "Maroon" },
                { id: 7, color: 0x2c3e50, name: "Midnight" }
            ];
            
            // Initialize selections
            this.selectedAvatarIndex = 0;
            this.selectedBorderIndex = 0;
            
            this.updatePreview();
            
            // Event listeners for carousels
            document.querySelectorAll('.carousel .left-btn').forEach((btn, index) => {
                btn.onclick = () => this.changeSelection(index, -1);
            });
            
            document.querySelectorAll('.carousel .right-btn').forEach((btn, index) => {
                btn.onclick = () => this.changeSelection(index, 1);
            });
            
            document.getElementById('confirm-avatar').onclick = () => {
                this.createPlayerWithAvatar(
                    this.avatarColors[this.selectedAvatarIndex].id,
                    this.borderColors[this.selectedBorderIndex].id
                );
                modal.style.display = 'none';
                resolve(); // 👈 ADD THIS LINE - tells Promise it's done
            };
        }); // 👈 ADD THIS CLOSING
    }
    changeSelection(typeIndex, direction) {
        if (typeIndex === 0) {
            // Main color selection
            this.selectedAvatarIndex = (this.selectedAvatarIndex + direction + this.avatarColors.length) % this.avatarColors.length;
        } else {
            // Border color selection
            this.selectedBorderIndex = (this.selectedBorderIndex + direction + this.borderColors.length) % this.borderColors.length;
        }
        this.updatePreview();
    }

    updatePreview() {
        const mainColor = this.avatarColors[this.selectedAvatarIndex];
        const borderColor = this.borderColors[this.selectedBorderIndex];
        
        // Update combined preview
        const combinedPreview = document.querySelector('.combined-preview-circle');
        combinedPreview.style.backgroundColor = `#${mainColor.main.toString(16)}`;
        combinedPreview.style.borderColor = `#${borderColor.color.toString(16)}`;
        
        // Update color displays
        document.querySelector('.main-display').style.backgroundColor = `#${mainColor.main.toString(16)}`;
        document.querySelector('.border-display').style.backgroundColor = `#${borderColor.color.toString(16)}`;
        
        // Update names
        document.getElementById('main-color-name').textContent = mainColor.name;
        document.getElementById('border-color-name').textContent = `${borderColor.name} Border`;
    }
    createPlayerWithAvatar(avatarId) {
        const defaultStats = {
            level: 1,
            multiplier: 1.0,
            experience: 0,
            expNeeded: 100,
            skills: {
                knowledge: { level: 1, progress: 0 },
                technique: { level: 1, progress: 0 },
                strategy: { level: 1, progress: 0 }
            },
            ranking: {
                mmr: 1000,
                rank: "Novice",
                rank_tier: 0,
                win_streak: 0
            },
            appearance: {
                avatarId: parseInt(avatarId),
                accessoryId: 0,  // Start with no accessory
                glow: 0x000000   // No glow initially
            }
        };
        Object.assign(this.playerStats, defaultStats);
        BrowserDB.savePlayerStats(defaultStats);
        console.log('🎮 New player created with avatar:', avatarId);
        // ✅ Show tutorial instead of going straight to game
        this.showTutorial();
    }

    updateAllPositions(){
        app.renderer.resize(screen.width, screen.height);
        if(document.getElementById('nav-arena').classList.contains('active')){
            const arenaWidth = this.battleSystem.battleAnimationManager.arenaBg.width;
            const arenaHeight = this.battleSystem.battleAnimationManager.arenaBg.height;
            this.battleSystem.battleAnimationManager.arenaBg.clear();
            const arenaX = (window.app.screen.width - arenaWidth) / 2;
            const arenaY = (window.app.screen.height - arenaHeight) / 2;

            this.battleSystem.battleAnimationManager.arenaBg.rect(arenaX, arenaY, arenaWidth, arenaHeight);
            this.battleSystem.battleAnimationManager.arenaBg.fill({"color":0x34495e});

            // Position roosters relative to arena
            window.app.uiSystem.roosters.playerRooster.x = arenaX + (arenaWidth * BATTLE_FORMATIONS[this.battleSystem.battleAnimationManager.getBattleFormation()].playerPos[0]);    // 30% into arena
            window.app.uiSystem.roosters.playerRooster.y = arenaY + (arenaHeight * BATTLE_FORMATIONS[this.battleSystem.battleAnimationManager.getBattleFormation()].playerPos[1]);     // Middle of arena

            window.app.uiSystem.roosters.opponentRooster.x = arenaX + (arenaWidth * BATTLE_FORMATIONS[this.battleSystem.battleAnimationManager.getBattleFormation()].opponentPos[0]);  // 70% into arena
            window.app.uiSystem.roosters.opponentRooster.y = arenaY + (arenaHeight * BATTLE_FORMATIONS[this.battleSystem.battleAnimationManager.getBattleFormation()].opponentPos[1]);   // Middle of arena

            this.battleSystem.battleAnimationManager.centerSmokeScreen.clear(); 
            this.battleSystem.battleAnimationManager.centerSmokeScreen.circle(window.app.screen.width / 2, window.app.screen.height / 2, 50);
            this.battleSystem.battleAnimationManager.centerSmokeScreen.stroke({
                width: 3,
                color: 0xe74c3c
            });
        }
        else{
            window.app.uiSystem.roosters.playerRooster.x = window.app.screen.width / 2; // Centered in coop
            window.app.uiSystem.roosters.playerRooster.y = window.app.screen.height / 2;
        }
    }

    showTutorial() {
        const modal = document.getElementById('tutorial-modal');
        modal.style.display = 'flex';
        
        document.getElementById('start-playing').onclick = () => {
            modal.style.display = 'none';
            
            // ✅ Mark tutorial as completed
            this.playerStats.hasCompletedTutorial = true;
            BrowserDB.savePlayerStats(this.playerStats);
        };
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new SabungeroGame();
});
