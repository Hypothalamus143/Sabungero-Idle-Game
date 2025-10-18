class BattleSystem{
    constructor(playerStats, currentOpponent){
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.battleStates = {"isBattleActive":false, battleState:'idle'};
        this.battleEngine = new BattleEngine(playerStats, currentOpponent, this.battleStates);
        this.battleAnimationManager = new BattleAnimationManager(playerStats, currentOpponent, this.battleStates);
        this.init();
    }
    async init() {
        this.battleAnimationManager.createArena();
        this.initEventListeners();
    }
    initEventListeners(){
        // Battle button
        document.getElementById('battle-btn').addEventListener('click', () => {
            this.startBattle();
        });
        document.getElementById('fight-btn').addEventListener('click', () => {
            this.fightOpponent();
        });
    }
    async startBattle() {
        // Reset ALL battle states
        this.battleAnimationManager.battleState = 'idle';
        this.battleStates.isBattleActive = false; // Ensure this is reset
        this.battleAnimationManager.stopJitterAnimation();
        
        document.getElementById('battle-result').innerHTML = "";
        try {
            console.log(this.playerStats);

            const opponentData = BrowserDB.generateOpponent(this.playerStats.level, this.playerStats.mmr);
            Object.assign(this.currentOpponent, opponentData);

            // Update roosters
            window.app.uiSystem.roosters.updateRoosters();
            
            // Show opponent with rank info
            window.app.uiSystem.roosters.opponentRooster.visible = true;
            document.getElementById('opponent-name').textContent = 
                `${opponentData.name} (${opponentData.rank})`;
            
            // Show both buttons
            document.getElementById('fight-btn').style.display = 'block';
            document.getElementById('battle-btn').style.display = 'block';
            document.getElementById('battle-btn').textContent = '🔁 Find New Opponent';
            
            // Show opponent info
            document.getElementById('battle-result').innerHTML = `
                <div class="opponent-info">
                    <p><strong>Opponent Found!</strong></p>
                    <p>Level ${opponentData.level} • ${opponentData.rank}</p>
                    <p><strong>${this.playerStats.ranking.rank}</strong> vs <strong>${opponentData.rank}</strong></p>
                    <p>Fight this opponent or find a new one?</p>
                </div>
            `;
            
            // Initialize HP
            this.playerStats.hp = this.playerStats.level * 100;
            this.currentOpponent.hp = opponentData.hp;
            this.updateHPBars(this.currentOpponent.hp, this.currentOpponent.max_hp, this.playerStats.hp, this.playerStats.hp);
            
        } catch (error) {
            console.error('Error starting battle:', error);
        }
    }
    async fightOpponent() {
        if (!this.currentOpponent) return;
        // Set the battle active flag
        this.battleStates.isBattleActive = true;
        // Hide both buttons during battle
        document.getElementById('fight-btn').style.display = 'none';
        document.getElementById('battle-btn').style.display = 'none';
        
        // Start the initial approach animation
        await this.battleAnimationManager.battleApproachAnimation();
        
        // After animation completes, start the battle loop
        this.battleAnimationManager.battleState = 'fighting';
        this.startBattleLoop();
        console.log('⚔️ Battle started!');
    }
    startBattleLoop() {
        this.battleInterval = setInterval(() => {
            // Trigger attacks when in fighting state
            if (this.battleStates.isBattleActive) {
                this.damages = this.battleEngine.calculateBattle();
                this.battleAnimationManager.attackAnimation(
                this.damages.playerDamage, this.damages.opponentDamage
            ).then(() => {
                if (this.battleStates.isBattleActive) {
                    this.applyDamage(this.damages.playerDamage, this.damages.opponentDamage);
                    this.battleStates.battleState = 'fighting';
                }
            });
            }
        }, 1000);
        // Start continuous jitter animation during fighting state
        this.battleAnimationManager.startJitterAnimation();
    }
    
    applyDamage(playerDamage, opponentDamage) {
        // Apply damage
        this.currentOpponent.hp -= playerDamage;
        this.playerStats.hp -= opponentDamage;
        
        // Update HP bars
        this.updateBattleDisplay();
        
        // Check if battle is over
        const battleOver = this.playerStats.hp <= 0 || this.currentOpponent.hp <= 0;
        const victory = this.currentOpponent.hp <= 0;
        
        if (battleOver) {
            this.handleBattleEnd(victory, playerDamage, opponentDamage);
        }
    }

    updateBattleDisplay() {
        // Update HP bars (always needed)
        const playerHpPercent = (this.playerStats.hp / (this.playerStats.level * 100)) * 100;
        const opponentHpPercent = (this.currentOpponent.hp / this.currentOpponent.max_hp) * 100;
        
        document.getElementById('player-hp-bar').style.width = `${Math.max(0, playerHpPercent)}%`;
        document.getElementById('opponent-hp-bar').style.width = `${Math.max(0, opponentHpPercent)}%`;
        document.getElementById('player-hp-text').textContent = `${Math.max(0, this.playerStats.hp)}/${this.playerStats.level * 100}`;
        document.getElementById('opponent-hp-text').textContent = `${Math.max(0, this.currentOpponent.hp)}/${this.currentOpponent.max_hp}`;
        
        // REMOVE the battle result display logic from here
        // The battle flow should handle displaying messages separately
    }
    updateHPBars(opponentHP, opponentMaxHP, playerHP, playerMaxHP) {
        const playerHpPercent = (playerHP / playerMaxHP) * 100;
        const opponentHpPercent = (opponentHP / opponentMaxHP) * 100;
        document.getElementById('player-hp-bar').style.width = `${playerHpPercent}%`;
        document.getElementById('opponent-hp-bar').style.width = `${opponentHpPercent}%`;
        document.getElementById('player-hp-text').textContent = `${playerHP}/${playerMaxHP}`;
        document.getElementById('opponent-hp-text').textContent = `${opponentHP}/${opponentMaxHP}`;
    }
    updateRankFromMMR() {
        const mmr = this.playerStats.ranking.mmr;
        const rankVisuals = {
            0: {rank: "Novice", avatarId: 1, accessoryId: 0, glow: 0x000000},
            1000: {rank: "Bronze", avatarId: 1, accessoryId: 1, glow: 0xcd7f32},
            1500: {rank: "Silver", avatarId: 2, accessoryId: 2, glow: 0xc0c0c0},
            2000: {rank: "Gold", avatarId: 2, accessoryId: 3, glow: 0xffd700},
            2500: {rank: "Platinum", avatarId: 3, accessoryId: 4, glow: 0xe5e4e2},
            3000: {rank: "Diamond", avatarId: 3, accessoryId: 5, glow: 0xb9f2ff},
            3500: {rank: "Master", avatarId: 4, accessoryId: 6, glow: 0xff00ff},
            4000: {rank: "Grand Sabungero", avatarId: 4, accessoryId: 7, glow: 0xff0000}
        };
        
        let newRank = rankVisuals[0];
        for (const threshold in rankVisuals) {
            if (mmr >= parseInt(threshold)) {
                newRank = rankVisuals[threshold];
            }
        }
        // Update player appearance if rank changed
        if (newRank.rank !== this.playerStats.ranking.rank) {
            this.playerStats.ranking.rank = newRank.rank;
            this.playerStats.ranking.rank_tier = Object.keys(rankVisuals).indexOf(Object.keys(rankVisuals).find(k => rankVisuals[k].rank === newRank.rank));
            
            // Update appearance from the rank definition
            this.playerStats.appearance = {...newRank};
            window.app.uiSystem.roosters.updateRoosters();
            
            // TODO: Send appearance update to backend when we have user accounts
        }
    }
    handleBattleEnd(victory, playerDamage, opponentDamage) {
        this.battleStates.isBattleActive = false;
        
        // Stop battle loops
        clearInterval(this.battleInterval);
        this.battleAnimationManager.stopJitterAnimation();
        
        // Update MMR and ranking
        const mmrChange = this.battleEngine.calculateMMRChange(victory, this.playerStats.ranking.mmr, this.currentOpponent.mmr);
        if (victory) {
            this.playerStats.ranking.mmr += mmrChange;
            this.playerStats.ranking.win_streak++;
        } else {
            this.playerStats.ranking.mmr += mmrChange; // mmrChange is negative for losses
            this.playerStats.ranking.win_streak = 0;
        }
        
        // Ensure MMR doesn't go below minimum
        this.playerStats.ranking.mmr = Math.max(100, this.playerStats.ranking.mmr);
        // Update rank
        this.updateRankFromMMR();
        
        // Show battle result
        this.showBattleResult(victory, playerDamage, opponentDamage, mmrChange);
        // Update UI
        window.app.uiSystem.updateUI();
        
        // Hide opponent and show find button after delay
        setTimeout(() => {
            window.app.uiSystem.roosters.opponentRooster.visible = false;
            document.getElementById('battle-btn').style.display = 'block';
            document.getElementById('battle-btn').textContent = '⚔️ Find New Opponent';
        }, 3000);
    }

    showBattleResult(victory, playerDamage, opponentDamage, mmrChange) {
        const resultDiv = document.getElementById('battle-result');
        
        if (victory) {
            resultDiv.innerHTML = `
                <div class="battle-result victory">
                    <p><strong>🏆 VICTORY!</strong></p>
                    <p>You defeated the ${this.currentOpponent.rank} opponent!</p>
                    <p>You dealt: ${playerDamage} damage</p>
                    <p>Opponent dealt: ${opponentDamage} damage</p>
                    <p class="ranking-reward">+${Math.abs(mmrChange)} MMR</p>
                    ${this.playerStats.ranking.win_streak >= 3 ? `<p>🔥 ${this.playerStats.ranking.win_streak} Win Streak!</p>` : ''}
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="battle-result defeat">
                    <p><strong>💥 DEFEAT!</strong></p>
                    <p>The ${this.currentOpponent.rank} opponent was too strong!</p>
                    <p>You dealt: ${playerDamage} damage</p>
                    <p>Opponent dealt: ${opponentDamage} damage</p>
                    <p class="ranking-penalty">${mmrChange} MMR</p>
                </div>
            `;
        }
    }
    // Update battle loop to handle animation states
}