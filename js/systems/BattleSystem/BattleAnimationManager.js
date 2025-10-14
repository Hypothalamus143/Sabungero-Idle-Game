class BattleAnimationManager{
    constructor(playerStats, currentOpponent, battleStates){
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.battleStates = battleStates;
        this.init();
    }
    async init(){

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
        
        // Default starting positions (far left/right)
        const startPlayerX = window.app.screen.width * 0.1;
        const startOpponentX = window.app.screen.width * 0.9;
        const centerY = window.app.screen.height * 0.5;
        
        // Set initial far positions
        window.app.uiSystem.roosters.playerRooster.x = startPlayerX;
        window.app.uiSystem.roosters.playerRooster.y = centerY;
        window.app.uiSystem.roosters.opponentRooster.x = startOpponentX;
        window.app.uiSystem.roosters.opponentRooster.y = centerY;
        
        window.app.uiSystem.roosters.opponentRooster.visible = true;
        
        // Show battle starting message
        document.getElementById('battle-result').innerHTML = `
            <div class="battle-start">
                <p>⚔️ BATTLE START!</p>
                <p>Roosters approaching...</p>
            </div>
        `;
        
        // Calculate dynamic touch positions based on level
        const centerX = window.app.screen.width * 0.5;
        const baseSize = 80;
        const growthFactor = 5;
        const playerSize = baseSize + (this.playerStats.level * growthFactor);
        const opponentSize = baseSize + (this.currentOpponent.level * growthFactor);
        const totalSize = playerSize + opponentSize;
        
        const playerStopX = centerX - (totalSize * 0.25);
        const opponentStopX = centerX + (totalSize * 0.25);
        
        // Animate towards touch positions SIMULTANEOUSLY
        await Promise.all([
            this.moveToPosition(window.app.uiSystem.roosters.playerRooster, startPlayerX, centerY, playerStopX, centerY, 800),
            this.moveToPosition(window.app.uiSystem.roosters.opponentRooster, startOpponentX, centerY, opponentStopX, centerY, 800)
        ]);
        
        // Brief touch in center
        this.battleStates.battleState = 'clashing';
        document.getElementById('battle-result').innerHTML = `
            <div class="battle-clash">
                <p>👀 SIZING EACH OTHER UP!</p>
                <p>Level ${this.playerStats.level} vs Level ${this.currentOpponent.level}</p>
            </div>
        `;
        await this.delay(300);
        
        // Break apart to random positions
        await this.breakApartAnimation();
        
        // Show battle ongoing message
        document.getElementById('battle-result').innerHTML = `
            <div class="battle-ongoing">
                <p>🥊 BATTLE ONGOING!</p>
                <p>Press keys to power up your attacks!</p>
            </div>
        `;
    }

    async breakApartAnimation() {
        this.battleStates.battleState = 'separated';
        // Re-enable when animation complete (in breakApartAnimation)
        document.getElementById('fight-btn').disabled = false;
        document.getElementById('fight-btn').textContent = 'Fight!';
        
        // Random battle formation (your original idea)
        
        const formation = BATTLE_FORMATIONS[Math.floor(Math.random() * BATTLE_FORMATIONS.length)];
        const playerTargetX = window.app.screen.width * formation.playerPos[0];
        const playerTargetY = window.app.screen.height * formation.playerPos[1];
        const opponentTargetX = window.app.screen.width * formation.opponentPos[0];
        const opponentTargetY = window.app.screen.height * formation.opponentPos[1];
        
        const duration = 500;
        const startTime = Date.now();
        
        const playerStartX = window.app.uiSystem.roosters.playerRooster.x;
        const playerStartY = window.app.uiSystem.roosters.playerRooster.y;
        const opponentStartX = window.app.uiSystem.roosters.opponentRooster.x;
        const opponentStartY = window.app.uiSystem.roosters.opponentRooster.y;
        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Move to final positions
                window.app.uiSystem.roosters.playerRooster.x = playerStartX + (playerTargetX - playerStartX) * progress;
                window.app.uiSystem.roosters.playerRooster.y = playerStartY + (playerTargetY - playerStartY) * progress;
                window.app.uiSystem.roosters.opponentRooster.x = opponentStartX + (opponentTargetX - opponentStartX) * progress;
                window.app.uiSystem.roosters.opponentRooster.y = opponentStartY + (opponentTargetY - opponentStartY) * progress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.battleStates.battleState = 'fighting';
                    resolve();
                }
            };
            animate();
        });
    }
    async attackAnimation(playerDamage, opponentDamage) {
        const attackDuration = 400;
        // Store positions and start attack animation
        const playerStartX = window.app.uiSystem.roosters.playerRooster.x;
        const playerStartY = window.app.uiSystem.roosters.playerRooster.y;
        const opponentStartX = window.app.uiSystem.roosters.opponentRooster.x;
        const opponentStartY = window.app.uiSystem.roosters.opponentRooster.y;

        // Calculate dynamic sizes based on level
        const baseSize = 30;
        const growthFactor = 5;
        const playerSize = baseSize + (this.playerStats.level * growthFactor);
        const opponentSize = baseSize + (this.currentOpponent.level * growthFactor);
        const totalSize = playerSize + opponentSize;
        
        // Calculate meeting point based on their current positions
        const meetingPointX = (playerStartX + opponentStartX) / 2;
        const meetingPointY = (playerStartY + opponentStartY) / 2;
        
        // Calculate stopping positions where they just touch
        // Use vector math to position them facing each other
        const angle = Math.atan2(opponentStartY - playerStartY, opponentStartX - playerStartX);
        
        const playerStopX = meetingPointX - Math.cos(angle) * (totalSize * 0.25);
        const playerStopY = meetingPointY - Math.sin(angle) * (totalSize * 0.25);
        const opponentStopX = meetingPointX + Math.cos(angle) * (totalSize * 0.25);
        const opponentStopY = meetingPointY + Math.sin(angle) * (totalSize * 0.25);
        // Phase 1: Fly to touch positions SIMULTANEOUSLY
        await Promise.all([
            this.moveToPosition(window.app.uiSystem.roosters.playerRooster, playerStartX, playerStartY, playerStopX, playerStopY, attackDuration/2),
            this.moveToPosition(window.app.uiSystem.roosters.opponentRooster, opponentStartX, opponentStartY, opponentStopX, opponentStopY, attackDuration/2)
        ]);
        // Phase 2: Brief touch - show damage here
        const resultDiv = document.getElementById('battle-result');
        resultDiv.innerHTML = `
            <div class="battle-attack">
                <p>💥 ATTACK!</p>
                <p>You dealt: ${playerDamage} damage</p>
                <p>Opponent dealt: ${opponentDamage} damage</p>
            </div>
        `;
        
        await this.delay(100);
        
        // Phase 3: Return to battle positions (random for variety)
        
        const formation = BATTLE_FORMATIONS[Math.floor(Math.random() * BATTLE_FORMATIONS.length)];
        const playerTargetX = window.app.screen.width * formation.playerPos[0];
        const playerTargetY = window.app.screen.height * formation.playerPos[1];
        const opponentTargetX = window.app.screen.width * formation.opponentPos[0];
        const opponentTargetY = window.app.screen.height * formation.opponentPos[1];
        
        // Phase 4: Return simultaneously
        await Promise.all([
            this.moveToPosition(window.app.uiSystem.roosters.playerRooster, playerStopX, playerStopY, playerTargetX, playerTargetY, attackDuration/2),
            this.moveToPosition(window.app.uiSystem.roosters.opponentRooster, opponentStopX, opponentStopY, opponentTargetX, opponentTargetY, attackDuration/2)
        ]);
    }
    moveToPosition(rooster, startX, startY, targetX, targetY, duration) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing
                const easeProgress = progress < 0.5 ? 
                    2 * progress * progress : 
                    1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                rooster.x = startX + (targetX - startX) * easeProgress;
                rooster.y = startY + (targetY - startY) * easeProgress;
                
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
}