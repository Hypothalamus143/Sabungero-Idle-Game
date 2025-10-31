class UISystem{
    constructor(playerStats, currentOpponent){
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.roosters = new Roosters(playerStats, currentOpponent);
        this.activeKeys = new Set();
        this.sabunganBackground = null;
        this.pugaranBackground = null;
        this.pugaranMusic = null;
        this.sabunganMusic = null;
        this.smokeFightSound = null;
        this.chickenFightSound = null;
        this.init();
    }
    async init(){

    }
    async preLoadBackgrounds(){
        const pugaranBackgroundPngPath = "assets/backgrounds/pugaran_background.png";
        const sabuganBackgroundPngPath = "assets/backgrounds/sabungan_spritesheet.png";
        const jsonSabuganBackgroundPath = "assets/maps/sabungan_spritesheet.json";
        this.pugaranBackground = new PIXI.Sprite(await PIXI.Assets.load(pugaranBackgroundPngPath));
        this.pugaranBackground.width = 1920;
        this.pugaranBackground.height = 1080;
        this.pugaranBackground.visible = true;
        window.app.stage.addChildAt(this.pugaranBackground, 0); // Bottom layer
        this.sabunganBackground = new PIXI.AnimatedSprite(await this.roosters.loadCustomSpritesheet(sabuganBackgroundPngPath, jsonSabuganBackgroundPath));
        this.sabunganBackground.width = window.app.screen.width;
        this.sabunganBackground.height = window.app.screen.height;
        this.sabunganBackground.animationSpeed = 0.1; // Slow animation for background
        this.sabunganBackground.visible = false;
        window.stageContainer.addChildAt(this.sabunganBackground, 1);
        await this.preLoadMusic();
    }
    async preLoadMusic(){
        this.pugaranMusic = new Howl({
            src: ['assets/music/pugaranBackgroundMusic.mp3'],
            loop: true,
            volume: 0.5,
            preload: true
            });
        this.sabunganMusic = new Howl({
            src: ['assets/music/sabunganBackgroundMusic.mp3'],
            loop: true,
            volume: 0.7,
            preload: true
            });
        this.smokeFightSound = new Howl({
            src: ['assets/music/smokeFight.mp3'],
            loop: true,
            volume: 0.8,
            preload: true
            });
        this.chickenFightSound = new Howl({
            src: ['assets/music/chickenFight.mp3'],
            loop: true,
            volume: 0.4,
            preload: true
            });
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