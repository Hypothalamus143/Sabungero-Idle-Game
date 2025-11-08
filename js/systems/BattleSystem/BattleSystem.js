class BattleSystem{
    constructor(playerStats, currentOpponent, foodDropSystem){
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.foodDropSystem = foodDropSystem;
        this.damages = {};
        this.battleStates = {"isBattleActive":false, battleState:'idle'};
        this.battleEngine = new BattleEngine(playerStats, currentOpponent, this.battleStates);
        this.battleAnimationManager = new BattleAnimationManager(playerStats, currentOpponent, this.battleStates, this.damages);
        this.battleInterval = null;
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

            const opponentData = BrowserDB.generateOpponent(this.playerStats.ranking.mmr);
            Object.assign(this.currentOpponent, opponentData);

            // Update roosters
            window.app.uiSystem.roosters.updateSingleAvatar(false);
            
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
        window.app.uiSystem.roosters.updateRoosters(true);
        // Start the initial approach animation
        window.app.uiSystem.chickenFightSound.play();
        await this.battleAnimationManager.battleApproachAnimation();
        // After animation completes, start the battle loop
        this.battleAnimationManager.battleState = 'fighting';
        this.startBattleLoop();
        console.log('⚔️ Battle started!');
    }
    startBattleLoop() {
        // Stop any existing battle loop first
        this.stopBattleLoop();
        
        let lastAttackTime = 0;
        const attackCooldown = 2200; // 2 seconds

        // Store the function reference for proper removal
        this.battleTickFunction = () => {
            if (!this.battleStates.isBattleActive) return;
            
            const currentTime = performance.now();
            
            // Only attack every 2 seconds
            if (currentTime - lastAttackTime >= attackCooldown) {
                lastAttackTime = currentTime;
                
                Object.assign(this.damages, this.battleEngine.calculateBattle());
                this.battleAnimationManager.attackAnimation(
                    this.damages.playerDamage, this.damages.opponentDamage
                ).then(() => {
                    if (this.battleStates.isBattleActive) {
                        const battleOver = this.playerStats.hp <= 0 || this.currentOpponent.hp <= 0;
                        const victory = this.currentOpponent.hp <= 0;
                        if (battleOver) {
                            this.handleBattleEnd(victory, this.damages.playerDamage, this.damages.opponentDamage);
                        }
                    }
                });
            }
        };
        
        // Add the function to ticker
        window.app.ticker.add(this.battleTickFunction);
        
        this.battleAnimationManager.startJitterAnimation();
    }

    stopBattleLoop() {
        // Remove the battle ticker function
        if (this.battleTickFunction) {
            window.app.ticker.remove(this.battleTickFunction);
            this.battleTickFunction = null;
        }
        
        // Also clear any legacy interval (safety)
        if (this.battleInterval) {
            clearInterval(this.battleInterval);
            this.battleInterval = null;
        }
        
        this.battleAnimationManager.stopJitterAnimation();
    }

    updateHPBars(opponentHP, opponentMaxHP, playerHP, playerMaxHP) {
        const playerHpPercent = Math.max(0, playerHP) / playerMaxHP * 100;
        const opponentHpPercent = Math.max(0, opponentHP) / opponentMaxHP * 100;
        document.getElementById('player-hp-bar').style.width = `${playerHpPercent}%`;
        document.getElementById('opponent-hp-bar').style.width = `${opponentHpPercent}%`;
        document.getElementById('player-hp-text').textContent = `${playerHP}/${playerMaxHP}`;
        document.getElementById('opponent-hp-text').textContent = `${Math.max(0, opponentHP)}/${Math.max(0, opponentMaxHP)}`;
    }
    updateRankFromMMR() {
        const mmr = this.playerStats.ranking.mmr;
        const rankVisuals = {
            0: {rank: "Novice", glow: 0x000000},
            500: {rank: "Bronze", glow: 0xcd7f32},        // Level 5
            1000: {rank: "Silver", glow: 0xc0c0c0},       // Level 10
            1500: {rank: "Gold", glow: 0xffd700},         // Level 15
            2000: {rank: "Platinum", glow: 0xe5e4e2},     // Level 20
            2500: {rank: "Diamond", glow: 0xb9f2ff},      // Level 25
            3000: {rank: "Master", glow: 0xff00ff},       // Level 30
            3500: {rank: "Grand Sabungero", glow: 0xff0000} // Level 35
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
            
            // ✅ Only update glow, preserve avatarId and accessoryId
            this.playerStats.appearance.glow = newRank.glow;
            
            window.app.uiSystem.roosters.updateRoosters();
            
            // TODO: Send appearance update to backend when we have user accounts
        }
    }
    async handleBattleEnd(victory, playerDamage, opponentDamage) {
        this.battleStates.isBattleActive = false;
        this.stopBattleLoop();
        window.app.uiSystem.chickenFightSound.pause();
        // Stop battle loops
        this.battleAnimationManager.stopJitterAnimation();
        
        // Update MMR and ranking
        const mmrChange = this.battleEngine.calculateMMRChange(victory, this.playerStats.ranking.mmr, this.currentOpponent.mmr);
        if (victory) {
            this.playerStats.ranking.mmr += mmrChange;
            this.playerStats.ranking.win_streak++;
            const types= Object.keys(window.app.uiSystem.dropTextures);
            const dropRate = Object.values(window.app.uiSystem.dropTextures);
            let type = null;
            for(let i = 0; i < types.length; i++){
                if(Math.random() < dropRate[i]["dropRate"]){
                    type = types[i];
                    break;
                }
            }
            if(type){
                const modal = document.getElementById('quest-modal');
                modal.style.display = 'flex';
                const contentDiv = document.getElementById('quest-content');
                
                contentDiv.innerHTML = `
                    <div class="completion-message">
                        <h3>Your Opponent Ran Away in Tears!</h3>
                        <h1 style="color:black">They dropped a ${window.app.uiSystem.dropTextures[type]["name"]}!</h1>
                        <p>Feed it to your rooster in the Pugaran!</p>
                    </div>
                `;
            const id = (parseInt(Object.keys(this.playerStats.drops).pop() || "0") + 1).toString();
                
                const position = [Math.random() * window.app.screen.width, Math.random() * window.app.screen.height];
                this.playerStats.drops[id] = {"type":type, "position":position};
                const sprite = this.foodDropSystem.addDrop(id, this.playerStats.drops[id]);
                sprite.visible = false;
            }
        } else {
            this.playerStats.ranking.mmr += mmrChange; // mmrChange is negative for losses
            this.playerStats.ranking.win_streak = 0;
        }
        console.log(this.playerStats.drops);
        // Ensure MMR doesn't go below minimum
        this.playerStats.ranking.mmr = Math.max(100, this.playerStats.ranking.mmr);
        // Update rank
        this.updateRankFromMMR();
        
        // Show battle result
        this.showBattleResult(victory, playerDamage, opponentDamage, mmrChange);
        // Update UI
        BrowserDB.savePlayerStats(this.playerStats);
        window.app.uiSystem.updateUI();
        window.app.uiSystem.roosters.updateRoosters();
        window.app.uiSystem.roosters.playerRooster.scale.x = BATTLE_FORMATIONS[this.battleAnimationManager.getBattleFormation()].playerPos[2];
        window.app.uiSystem.roosters.opponentRooster.scale.x = BATTLE_FORMATIONS[this.battleAnimationManager.getBattleFormation()].opponentPos[2];
        
        // Hide opponent and show find button after delay
        await this.battleAnimationManager.delay(3000);
        document.getElementById('battle-btn').style.display = 'block';
        document.getElementById('battle-btn').textContent = '⚔️ Find New Opponent';
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