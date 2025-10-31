class BattleEngine{
    constructor(playerStats, currentOpponent, battleStates){
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.battleStates = battleStates;
        this.init();
    }
    async init(){

    }
    calculateBattle() {
        if (this.battleStates.isBattleActive) {
            // Calculate damage
            const minDamage = this.playerStats.level;
            const maxDamage = this.playerStats.level * (1 + window.app.uiSystem.activeKeys.size);
            const playerDamage = Math.round(minDamage + Math.random() * (maxDamage - minDamage)) * 3;
            const opponentDamage = this.currentOpponent.level * (1 + Math.floor(Math.random() * 6)) * 3;
            
            this.battleStates.battleState = 'attacking';
            
            return {"playerDamage": playerDamage, "opponentDamage" : opponentDamage}
            
        }
    }
    calculateMMRChange(playerWon, playerLevel, opponentLevel) {
        const levelDifference = opponentLevel - playerLevel;
        
        // Base rewards for winning
        if (levelDifference >= 3) return playerWon ? 50 : -1;      // +50 / -1
        if (levelDifference === 2) return playerWon ? 30 : -2;     // +30 / -2  
        if (levelDifference === 1) return playerWon ? 20 : -5;     // +20 / -5
        if (levelDifference === 0) return playerWon ? 10 : -10;    // +10 / -10
        if (levelDifference === -1) return playerWon ? 5 : -20;    // +5 / -20
        if (levelDifference === -2) return playerWon ? 2 : -30;    // +2 / -30
        if (levelDifference <= -3) return playerWon ? 1 : -50;     // +1 / -50
    }
}