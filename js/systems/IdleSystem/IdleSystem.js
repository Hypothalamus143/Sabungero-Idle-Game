class IdleSystem{
    constructor(playerStats){
        this.playerStats = playerStats;
        this.hearts = new Hearts();
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
        const multiplierBonus = this.playerStats.multiplier;
        const totalGain = baseGain * multiplierBonus;
        
        this.playerStats.experience += totalGain;
        
        const expNeeded = this.playerStats.expNeeded
        if (this.playerStats.experience >= expNeeded) {
            this.levelUp();
        }
        
        window.app.uiSystem.updateUI();
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
    }
    startIdleLoop() {
        // Clear any existing interval first
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
            this.idleInterval = null;  // ← ADD THIS LINE
        }
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
            this.idleInterval = null;  // ← ADD THIS LINE
        }
        // Check every second for active key pressing
        this.idleInterval = setInterval(() => {
            if (window.app.uiSystem.activeKeys.size > 0) {
                this.addIdleExperience();
                this.hearts.spawnAroundPlayer(window.app.uiSystem.activeKeys.size);
                this.hearts.startAnimation(1000);
            }
        }, 1000);
    }
    

}