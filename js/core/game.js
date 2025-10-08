// Four possible battle formations
const BATTLE_FORMATIONS = [
            // Horizontal - Player Left, Opponent Right
            { playerPos: [0.3, 0.5], opponentPos: [0.7, 0.5], name: "Horizontal Face-off" },
            
            // Horizontal - Player Right, Opponent Left  
            { playerPos: [0.7, 0.5], opponentPos: [0.3, 0.5], name: "Reverse Horizontal" },
            
            // Vertical - Player Top, Opponent Bottom
            { playerPos: [0.5, 0.3], opponentPos: [0.5, 0.7], name: "Vertical Stand-off" },
            
            // Vertical - Player Bottom, Opponent Top
            { playerPos: [0.5, 0.7], opponentPos: [0.5, 0.3], name: "Reverse Vertical" }
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
        alert('Press Ctrl+F5 to load updates');
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
            BrowserDB.savePlayerData();
        });
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
                this.battleSystem.arenaBg.visible = false;
                this.battleSystem.centerCircle.visible = false;
                window.app.uiSystem.roosters.playerRooster.visible = true;
                window.app.uiSystem.roosters.playerRooster.x = window.app.screen.width / 2; // Centered in coop
                window.app.uiSystem.roosters.playerRooster.y = window.app.screen.height / 2;
                window.app.uiSystem.roosters.opponentRooster.visible = false;
                this.idleSystem.startIdleLoop();
                break;
            case 'quests':
                statsPanel.style.display = 'none';
                learningPanel.style.display = 'block';
                battlePanel.style.display = 'none';
                this.battleSystem.arenaBg.visible = false;
                this.battleSystem.centerCircle.visible = false;
                window.app.uiSystem.roosters.playerRooster.visible = true;
                window.app.uiSystem.roosters.playerRooster.x = window.app.screen.width / 2; // Centered in coop
                window.app.uiSystem.roosters.playerRooster.y = window.app.screen.height / 2;
                window.app.uiSystem.roosters.opponentRooster.visible = false;
                this.learningSystem.showLearningMain();
                break;
            case 'arena':
                statsPanel.style.display = 'block';
                learningPanel.style.display = 'none';
                battlePanel.style.display = 'block';
                this.battleSystem.arenaBg.visible = true;
                this.battleSystem.centerCircle.visible = true;

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
                // Always ensure player is positioned correctly
                window.app.uiSystem.roosters.playerRooster.visible = true;
                window.app.uiSystem.roosters.playerRooster.x = window.app.screen.width * 0.3;
                window.app.uiSystem.roosters.playerRooster.y = window.app.screen.height / 2;
                
                // Always ensure opponent is positioned correctly (even if not visible yet)
                window.app.uiSystem.roosters.opponentRooster.x = window.app.screen.width * 0.7;
                window.app.uiSystem.roosters.opponentRooster.y = window.app.screen.height / 2;
                
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
