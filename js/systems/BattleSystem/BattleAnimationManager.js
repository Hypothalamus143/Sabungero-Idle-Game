class BattleAnimationManager{
    constructor(playerStats, currentOpponent, battleStates){
        this.arenaBg = null;
        this.centerSmokeScreen = null;
        this.battleFormation = 0;
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.battleStates = battleStates;
        this.init();
    }
    async init(){

    }
    createArena() {
        // Arena background (for battle screen)
        const arenaBGContainer = new PIXI.Container();
        this.arenaBg = new PIXI.Graphics();
        arenaBGContainer.addChild(this.arenaBg);
        const arenaWidth = 1115;
        const arenaHeight = 531;

        const arenaX = (window.app.screen.width - arenaWidth) / 2;
        const arenaY = (window.app.screen.height - arenaHeight) / 2;

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
        this.createSmokeScreen();
    }

    createSmokeScreen(){
        // Arena center circle
        const centerSmokeScreenContainer = new PIXI.Container();
        this.centerSmokeScreen = new PIXI.Graphics();
        centerSmokeScreenContainer.addChild(this.centerSmokeScreen);
        this.centerSmokeScreen.circle(window.app.screen.width / 2, window.app.screen.height / 2, 50);
        this.centerSmokeScreen.stroke({
            width: 3,
            color: 0xe74c3c
        });
        this.centerSmokeScreen.visible = false; // Hidden by default
        window.app.stage.addChild(centerSmokeScreenContainer);
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
            attackDuration = 800;
        else{
            attackDuration = 400;
            //await this.delay(100 * (Math.floor(Math.random() * 10))); work in progress
        } 
        // Store positions and start attack animation
        const playerStartX = BATTLE_FORMATIONS[this.battleFormation].playerPos[0];
        const playerStartY = BATTLE_FORMATIONS[this.battleFormation].playerPos[1];
        const opponentStartX = BATTLE_FORMATIONS[this.battleFormation].opponentPos[0];
        const opponentStartY = BATTLE_FORMATIONS[this.battleFormation].opponentPos[1];

        const playerStopX = 0.5;
        const playerStopY = 0.5;
        const opponentStopX = 0.5;
        const opponentStopY = 0.5;

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
             document.getElementById('battle-result').innerHTML = `
                <div class="battle-attack">
                    <p>💥 ATTACK!</p>
                    <p>You dealt: ${playerDamage} damage</p>
                    <p>Opponent dealt: ${opponentDamage} damage</p>
                </div>
            `;
            await this.delay(200);
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
    moveToPosition(rooster, startX, startY, targetX, targetY, duration) {
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            const animate = () => {
                const arenaX = (window.app.screen.width - this.arenaBg.width) / 2;
                const arenaY = (window.app.screen.height - this.arenaBg.height) / 2;
                const arenaWidth = this.arenaBg.width;
                const arenaHeight = this.arenaBg.height;
                const startXFinal = arenaX + (arenaWidth * startX);
                const startYFinal = arenaY + (arenaHeight * startY);
                const targetXFinal = arenaX + (arenaWidth * targetX);
                const targetYFinal = arenaY + (arenaHeight * targetY);
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing
                const easeProgress = progress < 0.5 ? 
                    2 * progress * progress : 
                    1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                rooster.x = startXFinal  + (targetXFinal - startXFinal) * easeProgress;
                rooster.y = startYFinal + (targetYFinal - startYFinal) * easeProgress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }
    // Helper function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getBattleFormation(){
        return this.battleFormation;
    }
}