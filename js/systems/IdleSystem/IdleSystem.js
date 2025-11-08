class IdleSystem{
    constructor(playerStats){
        this.playerStats = playerStats;
        this.hearts = new Hearts(playerStats);
        this.init();
    }
    async init(){
        this.initEventListeners();
    }
    initEventListeners(){

    }
    addIdleExperience() {
        if(!document.getElementById('nav-main').classList.contains('active'))
            return;
        const baseGain = window.app.uiSystem.activeKeys.size;
        const multiplierBonus = this.playerStats.multiplier * this.playerStats.rooster_multiplier;
        const totalGain = baseGain * multiplierBonus;
        
        this.playerStats.experience += totalGain;
        
        const expNeeded = this.playerStats.expNeeded
        if (this.playerStats.experience >= expNeeded) {
            this.levelUp();
        }
        BrowserDB.savePlayerStats(this.playerStats);
        window.app.uiSystem.updateUI();
        this.hearts.spawnAroundPlayer(window.app.uiSystem.activeKeys.size);
        this.hearts.startAnimation(1000);
        if(window.app.uiSystem.activeKeys.size == 1)
            window.app.uiSystem.singleHeartSound.play();
        else
            window.app.uiSystem.doubleHeartSound.play();
    }
    levelUp() {
        const currentExp = this.playerStats.experience;
        const expNeeded = this.playerStats.expNeeded; // Use current threshold
        if (currentExp >= expNeeded) {
            this.playerStats.level++;
            this.playerStats.experience = currentExp - expNeeded; // Carry over excess XP
            this.playerStats.expNeeded = expNeeded * 2; // Multiply threshold by 2
            window.app.uiSystem.roosters.updateRoosters();
        }
        window.app.uiSystem.levelUpSound.play();
        this.addRoosterGlow();
    }
    startIdleLoop() {
        // Clear any existing interval first
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
            this.idleInterval = null;  // ← ADD THIS LINE
        }
        if (this.idleInterval) { //extra for safety
            clearInterval(this.idleInterval);
            this.idleInterval = null;  // ← ADD THIS LINE
        }
        // Check every second for active key pressing
        this.idleInterval = setInterval(() => {
            if (window.app.uiSystem.activeKeys.size > 0) {
                this.addIdleExperience();
            }
        }, 1000);
    }
    
    addRoosterGlow(duration = 2000) {
        const rooster = window.app.uiSystem.roosters.playerRooster;
        
        // Create multiple glow rings for better effect
        const outerGlow = this.createGlowRing(0xFFD700, 0.2, rooster.width * 0.8);
        const innerGlow = this.createGlowRing(0xFFFF00, 0.3, rooster.width * 0.6);
        
        rooster.addChild(outerGlow);
        rooster.addChild(innerGlow);
        
        this.animateGlowRings([outerGlow, innerGlow], duration);
    }

    createGlowRing(color, alpha, size) {
        const glow = new PIXI.Graphics();
        glow.beginFill(color, alpha);
        glow.drawCircle(0, 0, size);
        glow.endFill();
        return glow;
    }

    animateGlowRings(glows, duration) {
        const startTime = performance.now();
        
        const animate = (delta) => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Pulsing scale and fade
            const pulse = Math.sin(progress * Math.PI * 6) * 0.3 + 0.7;
            const fade = 1 - progress;
            
            glows.forEach((glow, index) => {
                const scale = pulse + (index * 0.1); // Stagger scales
                glow.scale.set(scale);
                glow.alpha = fade * (0.3 - (index * 0.1));
            });
            
            if (progress >= 1) {
                window.app.ticker.remove(animate);
                glows.forEach(glow => {
                    if (glow.parent) glow.parent.removeChild(glow);
                });
            }
        };
        
        window.app.ticker.add(animate);
    }
}