class VideoCutscene {
    constructor(videoPath) {
        this.videoPath = videoPath;
        // Don't preload until play() is called
        this.init();
    }
    async init(){
        this.initEventListeners();
    }
    async initEventListeners(){
        
    }
    async play() {
        // Show loading screen
        this.showLoadingScreen();
        
        // Create and preload video
        this.video = document.createElement('video');
        this.video.src = this.videoPath;
        this.video.muted = false;
        this.video.playsInline = true;
        this.video.preload = 'auto';
        
        // Wait for video to load
        await new Promise((resolve) => {
            this.video.addEventListener('loadeddata', resolve);
            this.video.addEventListener('canplaythrough', resolve);
        });
        
        // Hide loading screen
        await this.hideLoadingScreen();
        document.getElementById('game-container').style.zIndex = 10000;
        if(window.app.uiSystem.pugaranMusic)
            window.app.uiSystem.pugaranMusic.pause();
        if(window.app.uiSystem.roosters.playerAvatarIdle){
            window.app.uiSystem.roosters.playerAvatarIdle.stop();
            window.app.uiSystem.roosters.playerAvatarTalking.stop();
            window.app.uiSystem.roosters.playerAccessoryIdle.stop();
        }
            
        // Setup Pixi.js video texture
        this.videoTexture = PIXI.Texture.from(this.video);
        this.sprite = new PIXI.Sprite(this.videoTexture);
        this.sprite.width = app.screen.width;
        this.sprite.height = app.screen.height;
        
        // Play video
        app.stage.addChild(this.sprite);
        await this.video.play();
        
        return new Promise((resolve) => {
            this.video.onended = () => {
                this.cleanup();
                if(window.app.uiSystem.pugaranMusic)
                    window.app.uiSystem.pugaranMusic.play();
                if(window.app.uiSystem.roosters.playerAvatarIdle){
                    window.app.uiSystem.roosters.playerAvatarIdle.play();
                    window.app.uiSystem.roosters.playerAvatarTalking.play();
                    window.app.uiSystem.roosters.playerAccessoryIdle.play();
                }
                document.getElementById('game-container').style.zIndex = 0;
                resolve();
            };
        });
    }
    
    showLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.querySelector('.loading-text').textContent = 'Loading Cutscene...';
    }
    
    async hideLoadingScreen() {
        if(!window.app.uiSystem.pugaranMusic){
            document.querySelector('.loading-text').textContent = 'Click to Reminisce!';
            document.querySelector('.spinner').style.display = "none";
            document.getElementById("loading-screen").style.cursor = "pointer";
            // Wait for user click to start video
            return new Promise((resolve) => {
                const clickHandler = () => {
                    document.getElementById('loading-screen').style.display = 'none';
                    document.querySelector('.loading-text').textContent = 'Loading Game Assets...';
                    document.querySelector('.spinner').style.display = "flex";
                     document.getElementById("loading-screen").style.cursor = "auto";
                    document.removeEventListener('click', clickHandler);
                    resolve();
                };
                
                document.addEventListener('click', clickHandler);
            });
        } else {
            // Music exists, we can autoplay
            document.getElementById('loading-screen').style.display = 'none';
            document.querySelector('.loading-text').textContent = 'Loading Game Assets...';
        }
    }
    
    cleanup() {
        app.stage.removeChild(this.sprite);
        this.videoTexture.destroy();
        this.video.remove();
    }
}