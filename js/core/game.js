// Four possible battle formations
const BATTLE_FORMATIONS = [
            // Player Upper Left, Opponent Lower Right
            { playerPos: [0.1, 0.1, -1], opponentPos: [0.9, 0.9, 1], name: "Horizontal Face-off" },
            
            // Player Lower Right, Opponent Upper Left  
            { playerPos: [0.9, 0.9, 1], opponentPos: [0.1, 0.1, -1], name: "Reverse Horizontal" },
            
            // Player Lower Left , Opponent Upper Right
            { playerPos: [0.1, 0.9, -1], opponentPos: [0.9, 0.1, 1], name: "Vertical Stand-off" },
            
            // Player Upper Right, Lower Left
            { playerPos: [0.9, 0.1, 1], opponentPos: [0.1, 0.9, -1], name: "Reverse Vertical" }
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

        await window.app.uiSystem.roosters.createRoosterContainers();
        await this.idleSystem.hearts.initialize();
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
            this.savePlayerData();
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
                window.app.uiSystem.roosters.playerRooster.scale.x = 1;
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
                window.app.uiSystem.roosters.playerRooster.scale.x = 1;
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
                window.app.uiSystem.roosters.playerRooster.scale.x = BATTLE_FORMATIONS[this.battleSystem.battleAnimationManager.getBattleFormation()].playerPos[2];
                window.app.uiSystem.roosters.opponentRooster.scale.x = BATTLE_FORMATIONS[this.battleSystem.battleAnimationManager.getBattleFormation()].opponentPos[2];
                // Update roosters to ensure they're drawn with current data
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
    async showAvatarCreation() {
        const roostersPngPath = [
            "assets/roosters/idle/rooster1_spritesheet.png",
            "assets/roosters/idle/rooster2_spritesheet.png",
            "assets/roosters/idle/rooster3_spritesheet.png",
            "assets/roosters/idle/rooster4_spritesheet.png"

        ];
        const accessoriesPngPath = [
            "assets/accessories/idle/accessory1_spritesheet.png",
            "assets/accessories/idle/accessory2_spritesheet.png",
            "assets/accessories/idle/accessory3_spritesheet.png",
            "assets/accessories/idle/accessory4_spritesheet.png"
        ];
        const jsonPath = "assets/maps/idle_spritesheet.json";

        this.roostersPreview = await window.app.uiSystem.roosters.loadPreviews(roostersPngPath, jsonPath);
        this.accessoriesPreview = await window.app.uiSystem.roosters.loadPreviews(accessoriesPngPath, jsonPath);
        this.roostersPreviewDuplicate = await window.app.uiSystem.roosters.loadPreviews(roostersPngPath, jsonPath);
        this.accessoriesPreviewDuplicate = await window.app.uiSystem.roosters.loadPreviews(accessoriesPngPath, jsonPath);
        return new Promise((resolve) => { // 👈 ADD THIS LINE
            const modal = document.getElementById('avatar-creation-modal');
            modal.style.display = 'flex';
            
            // Define avatar and accessory options
             
            this.avatars = [
                { id: 1, sprite: this.roostersPreview[0], name: "Red" },
                { id: 2, sprite: this.roostersPreview[1], name: "Pink" },
                { id: 3, sprite: this.roostersPreview[2], name: "Black" },
                { id: 4, sprite: this.roostersPreview[3], name: "White" }
            ];
            
            this.accessories = [
                { id: 0, sprite: this.accessoriesPreview[0], name: "Crown" },
                { id: 1, sprite: this.accessoriesPreview[1], name: "Helmet" },
                { id: 2, sprite: this.accessoriesPreview[2], name: "Chain" },
                { id: 3, sprite: this.accessoriesPreview[3], name: "Necklace" }
            ];
            
            // Initialize selections
            this.selectedAvatarIndex = 0;
            this.selectedAccessoryIndex = 0;
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
                    this.avatars[this.selectedAvatarIndex].id,
                    this.accessories[this.selectedAccessoryIndex].id
                );
                modal.style.display = 'none';
                resolve(); // 👈 ADD THIS LINE - tells Promise it's done
            };
        }); // 👈 ADD THIS CLOSING
    }
    changeSelection(typeIndex, direction) {
        if (typeIndex === 0) {
            // Main color selection
            this.selectedAvatarIndex = (this.selectedAvatarIndex + direction + this.avatars.length) % this.avatars.length;
        } else {
            // Border color selection
            this.selectedAccessoryIndex = (this.selectedAccessoryIndex + direction + this.accessories.length) % this.accessories.length;
        }
        this.updatePreview();
    }

    updatePreview() {
        document.getElementById('main-display').innerHTML = '';
        document.getElementById('border-display').innerHTML = '';
        document.getElementById('combined-preview-circle').innerHTML = '';
        document.getElementById('main-display').appendChild(this.roostersPreview[this.selectedAvatarIndex]);
        document.getElementById('border-display').appendChild(this.accessoriesPreview[this.selectedAccessoryIndex]);
        document.getElementById('combined-preview-circle').appendChild(this.roostersPreviewDuplicate[this.selectedAvatarIndex]);
        document.getElementById('combined-preview-circle').appendChild(this.accessoriesPreviewDuplicate[this.selectedAccessoryIndex]);
        // Update names
        document.getElementById('main-color-name').textContent = this.avatars[this.selectedAvatarIndex].name;
        document.getElementById('border-color-name').textContent = this.accessories[this.selectedAccessoryIndex].name;
    }
    createPlayerWithAvatar(avatarId, accessoryId) {
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
                accessoryId: parseInt(accessoryId),  // Start with no accessory
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

            this.battleSystem.battleAnimationManager.centerSmokeScreen.x = window.app.screen.width / 2 - this.battleSystem.battleAnimationManager.centerSmokeScreen.width/2;
            this.battleSystem.battleAnimationManager.centerSmokeScreen.y = window.app.screen.height / 2 - this.battleSystem.battleAnimationManager.centerSmokeScreen.height/2;
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
