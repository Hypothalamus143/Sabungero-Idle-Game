class UISystem{
    constructor(playerStats, currentOpponent){
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.roosters = new Roosters(playerStats, currentOpponent);
        this.activeKeys = new Set();
        this.init();
    }
    async init(){

    }
    updateUI() {
        document.getElementById('player-level').textContent = this.playerStats.level;
        document.getElementById('player-multiplier').textContent = this.playerStats.multiplier.toFixed(2);
        document.getElementById('player-exp').textContent = Math.floor(this.playerStats.experience);
        document.getElementById('exp-needed').textContent = this.playerStats.expNeeded;
        
        // Add ranking display
        const rankElement = document.getElementById('player-rank') || this.createRankElement();
        rankElement.textContent = `${this.playerStats.ranking.rank} (${this.playerStats.ranking.mmr} MMR)`;
        
        const expPercent = (this.playerStats.experience / this.playerStats.expNeeded) * 100;
        document.getElementById('exp-bar').style.width = `${Math.min(expPercent, 100)}%`;
    }
    createRankElement() {
        // Add ranking to stats panel
        const statsContent = document.getElementById('stats-content');
        const rankElement = document.createElement('p');
        rankElement.id = 'player-rank';
        rankElement.innerHTML = `Rank: <span id="rank-text">${this.playerStats.ranking.rank} (${this.playerStats.ranking.mmr} MMR)</span>`;
        statsContent.appendChild(rankElement);
        return document.getElementById('rank-text');
    }
}