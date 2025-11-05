class BattleAnimationManager{
    constructor(playerStats, currentOpponent, battleStates, damages){
        this.arenaBg = null;
        this.centerSmokeScreen = null;
        this.battleFormation = 0;
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.battleStates = battleStates;
        this.damages = damages;
        this.init();
    }
    async init(){

    }
    async createArena() {
        // Arena background (for battle screen)
        const arenaBGContainer = new PIXI.Container();
        this.arenaBg = new PIXI.Graphics();
        arenaBGContainer.addChild(this.arenaBg);
        const arenaWidth = 1115;
        const arenaHeight = 531;

        const arenaX = (window.app.screen.width - arenaWidth) / 2;
        const arenaY = (window.app.screen.height);

        this.arenaBg.rect(
            arenaX,  // Center X
            arenaY, // Center Y
            arenaWidth,
            arenaHeight
        );
        this.arenaBg.fill({"color":0x34495e}); // Arena color
        this.arenaBg.visible = false; // Hidden by default
        
        // Add arena FIRST, then circle on top
        window.app.stage.addChild(arenaBGContainer);
        await this.createSmokeScreen();
    }

    async createSmokeScreen(){
        const pngPath = "assets/smokescreen/battle_spritesheet.png";
        const jsonPath = "assets/maps/smokescreen_spritesheet.json";
        const centerSmokeScreenContainer = new PIXI.Container();
        this.centerSmokeScreen = new PIXI.AnimatedSprite(await window.app.uiSystem.roosters.loadCustomSpritesheet(pngPath, jsonPath));
        this.centerSmokeScreen.visible = false; // Hidden by default
        centerSmokeScreenContainer.addChild(this.centerSmokeScreen);
        window.app.stage.addChild(centerSmokeScreenContainer);
        this.centerSmokeScreen.width = 400;
        this.centerSmokeScreen.height = 400;
        this.centerSmokeScreen.animationSpeed = 0.12;
    }
    startJitterAnimation() {
        const jitterLoop = () => {
            // Only jitter when in fighting state (after backing away to positions)
            if (this.battleStates.isBattleActive) {
                this.simulateFightMovement();
            }
            this.animationFrameId = requestAnimationFrame(jitterLoop);
        };
        jitterLoop();
    }
    stopJitterAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    simulateFightMovement() {
        // Small random movements while circling each other in battle positions
        const playerJitter = (Math.random() - 0.5) * 8; // Reduced jitter for circling
        const opponentJitter = (Math.random() - 0.5) * 8;
        
        window.app.uiSystem.roosters.playerRooster.x += playerJitter;
        window.app.uiSystem.roosters.playerRooster.y += playerJitter;
        window.app.uiSystem.roosters.opponentRooster.x += opponentJitter;
        window.app.uiSystem.roosters.opponentRooster.y += opponentJitter;
    }
    async battleApproachAnimation() {
        this.battleStates.battleState = 'approaching';
        
        // Animate towards touch positions SIMULTANEOUSLY
        await this.attackAnimation(0,0);

        // Break apart to random positions
        this.battleStates.battleState = 'separated';
        document.getElementById('fight-btn').textContent = 'Fight!';
    }
    async attackAnimation(playerDamage, opponentDamage) {
        const isBattleApproachAnimation = opponentDamage == 0 && playerDamage == 0;
        let attackDuration;
        if(isBattleApproachAnimation)
            attackDuration = 1000;
        else{
            attackDuration = 1000;
            //await this.delay(100 * (Math.floor(Math.random() * 10))); work in progress
        } 
        // Store positions and start attack animation
        const playerStartX = BATTLE_FORMATIONS[this.battleFormation].playerPos[0];
        const playerStartY = BATTLE_FORMATIONS[this.battleFormation].playerPos[1];
        const opponentStartX = BATTLE_FORMATIONS[this.battleFormation].opponentPos[0];
        const opponentStartY = BATTLE_FORMATIONS[this.battleFormation].opponentPos[1];

        const playerStopX = 0.5 + isBattleApproachAnimation*0.1*BATTLE_FORMATIONS[this.battleFormation].playerPos[2];
        const playerStopY = 0.5 + isBattleApproachAnimation*0.1*BATTLE_FORMATIONS[this.battleFormation].playerPos[2];
        const opponentStopX = 0.5 + isBattleApproachAnimation*0.1*BATTLE_FORMATIONS[this.battleFormation].opponentPos[2];
        const opponentStopY = 0.5 + isBattleApproachAnimation*0.1*BATTLE_FORMATIONS[this.battleFormation].opponentPos[2];

        window.app.uiSystem.roosters.playerRooster.scale.x = -BATTLE_FORMATIONS[this.battleFormation].playerPos[2];
        window.app.uiSystem.roosters.opponentRooster.scale.x = -BATTLE_FORMATIONS[this.battleFormation].opponentPos[2];

        // Phase 1: Fly to touch positions SIMULTANEOUSLY
        this.stopJitterAnimation();
        await Promise.all([
            this.moveToPosition(window.app.uiSystem.roosters.playerRooster, playerStartX, playerStartY, playerStopX, playerStopY, attackDuration/2),
            this.moveToPosition(window.app.uiSystem.roosters.opponentRooster, opponentStartX, opponentStartY, opponentStopX, opponentStopY, attackDuration/2)
        ]);
        // Phase 2: Brief touch - show damage here
        if(isBattleApproachAnimation){
            document.getElementById('battle-result').innerHTML = `
            <div class="battle-clash">
                <p>👀 SIZING EACH OTHER UP!</p>
                <p>Level ${this.playerStats.level} vs Level ${this.currentOpponent.level}</p>
            </div>
        `;
            await this.delay(500);
        }
        else{
            this.centerSmokeScreen.visible = true;
            window.app.uiSystem.roosters.playerRooster.visible = false;
            window.app.uiSystem.roosters.opponentRooster.visible = false;
            this.centerSmokeScreen.play();
            window.app.uiSystem.roosters.playerAvatarRunning.stop();
            window.app.uiSystem.roosters.playerAccessoryRunning.stop();
            window.app.uiSystem.roosters.roostersRunning[this.currentOpponent.appearance.avatarId-1].stop();
            window.app.uiSystem.roosters.accessoriesRunning[this.currentOpponent.appearance.accessoryId].stop();
            window.app.uiSystem.sabunganMusic.pause();
            window.app.uiSystem.smokeFightSound.play();
            
            await this.delay(400);
            document.getElementById('battle-result').innerHTML = `
                <div class="battle-attack">
                    <p>💥 ATTACK!</p>
                    <p>You dealt: ${playerDamage} damage</p>
                    <p>Opponent dealt: ${opponentDamage} damage</p>
                </div>
            `;
            this.applyDamage(this.damages.playerDamage, this.damages.opponentDamage);
            //window.app.uiSystem.takeDamageSound.play();
            await this.delay(400);
            this.centerSmokeScreen.stop();
            window.app.uiSystem.smokeFightSound.pause();
            window.app.uiSystem.sabunganMusic.play();
            window.app.uiSystem.roosters.playerAvatarRunning.play();
            window.app.uiSystem.roosters.playerAccessoryRunning.play();
            window.app.uiSystem.roosters.roostersRunning[this.currentOpponent.appearance.avatarId-1].play();
            window.app.uiSystem.roosters.accessoriesRunning[this.currentOpponent.appearance.accessoryId].play();
            this.centerSmokeScreen.visible = false;
            window.app.uiSystem.roosters.playerRooster.visible = true;
            window.app.uiSystem.roosters.opponentRooster.visible = true;
        }
        
        
        // Phase 3: Return to battle positions (random for variety)

        this.battleFormation = Math.floor(Math.random() * 4);
        const formation = BATTLE_FORMATIONS[this.battleFormation];
        const playerTargetX = formation.playerPos[0];
        const playerTargetY = formation.playerPos[1];
        const opponentTargetX = formation.opponentPos[0];
        const opponentTargetY = formation.opponentPos[1];
        
        window.app.uiSystem.roosters.playerRooster.scale.x = -BATTLE_FORMATIONS[this.battleFormation].playerPos[2];
        window.app.uiSystem.roosters.opponentRooster.scale.x = -BATTLE_FORMATIONS[this.battleFormation].opponentPos[2];
        // Phase 4: Return simultaneously
        await Promise.all([
            this.moveToPosition(window.app.uiSystem.roosters.playerRooster, playerStopX, playerStopY, playerTargetX, playerTargetY, attackDuration/2),
            this.moveToPosition(window.app.uiSystem.roosters.opponentRooster, opponentStopX, opponentStopY, opponentTargetX, opponentTargetY, attackDuration/2)
        ]);

        if(isBattleApproachAnimation){
            document.getElementById('battle-result').innerHTML = `
            <div class="battle-ongoing">
                <p>🥊 BATTLE ONGOING!</p>
                <p>Press keys to power up your attacks!</p>
            </div>
        `;
        }
        this.startJitterAnimation();
    }
    moveToPosition(rooster, startX, startY, targetX, targetY, durationMs) {
        if (rooster.currentAnimation) {
            window.app.ticker.remove(rooster.currentAnimation);
        }
        return new Promise((resolve) => {
            const arenaX = (window.app.screen.width - this.arenaBg.width) / 2;
            const arenaY = (window.app.screen.height * 0.4);
            const arenaWidth = this.arenaBg.width;
            const arenaHeight = this.arenaBg.height;
            
            const startXFinal = arenaX + (arenaWidth * startX);
            const startYFinal = arenaY + (arenaHeight * startY);
            const targetXFinal = arenaX + (arenaWidth * targetX);
            const targetYFinal = arenaY + (arenaHeight * targetY);
            
            const deltaFactor = window.app.ticker.deltaTime; // Get PIXI's delta time factor
            let elapsedMs = 0;
            
            const animate = () => {
                elapsedMs += 16.67 * deltaFactor; // Convert to approximate milliseconds
                
                const progress = Math.min(elapsedMs / durationMs, 1);
                const easeProgress = progress < 0.5 ? 
                    2 * progress * progress : 
                    1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                rooster.x = startXFinal + (targetXFinal - startXFinal) * easeProgress;
                rooster.y = startYFinal + (targetYFinal - startYFinal) * easeProgress;
                
                if (progress < 1) {
                    // Continue
                } else {
                    window.app.ticker.remove(animate);
                    resolve();
                }
            };
            
            window.app.ticker.add(animate);
        });
    }
    applyDamage(playerDamage, opponentDamage) {
        // Apply damage
        this.currentOpponent.hp -= playerDamage;
        this.playerStats.hp -= opponentDamage;
        
        // Update HP bars
        this.updateBattleDisplay();
    }
    // Helper function
    delay(milliseconds) {
        return new Promise(resolve => {
            const startTime = performance.now();
            
            const tick = () => {
                const currentTime = performance.now();
                if (currentTime - startTime >= milliseconds) {
                    window.app.ticker.remove(tick);
                    resolve();
                }
            };
            
            window.app.ticker.add(tick);
        });
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
    getBattleFormation(){
        return this.battleFormation;
    }
}