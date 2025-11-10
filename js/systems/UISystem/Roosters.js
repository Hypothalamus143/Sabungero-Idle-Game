class Roosters{
    constructor(playerStats, currentOpponent){
        this.playerStats = playerStats;
        this.currentOpponent = currentOpponent;
        this.roostersIdle = [];
        this.accessoriesIdle = [];
        this.roostersRunning = [];
        this.accessoriesRunning = [];
        this.playerAvatarIdle = null;
        this.playerAccessoryIdle = null;
        this.playerAvatarRunning = null;
        this.playerAccessoryRunning = null;
        this.playerAvatarShadow = null;
        this.init();
    }
    async init(){
    }

    async createRoosterContainers() {
        // Just create empty containers at positions
        const playerRoosterContainer = new PIXI.Container();
        this.playerRooster = new PIXI.Graphics();
        playerRoosterContainer.addChild(this.playerRooster);
        this.playerRooster.x = window.app.screen.width / 2;
        this.playerRooster.y = window.app.screen.height / 2;
        
        const opponentRoosterContainer = new PIXI.Container();
        this.opponentRooster = new PIXI.Graphics();
        opponentRoosterContainer.addChild(this.opponentRooster);
        this.opponentRooster.x = window.app.screen.width * 0.7;
        this.opponentRooster.y = window.app.screen.height / 2;
        this.opponentRooster.visible = false;
        window.stageContainer.addChild(playerRoosterContainer, opponentRoosterContainer);
        
        await this.preLoadAnimatedSprites();
    }

    updateRoosters(state="idle") {
        console.log('🔄 Updating all roosters');
        // Update player rooster
        if (this.playerStats && this.playerStats.appearance) {
            this.updateSingleAvatar(true, state);
        } else {
            console.warn('❌ Player stats not loaded yet', 'player: ',this.playerStats, ' opponent:',this.currentOpponent);
        }
        
        // Update opponent rooster if we have one
        if (this.currentOpponent && this.currentOpponent.appearance) {
            this.updateSingleAvatar(false, state);
        } else {
            console.warn('❌ Opponent stats not loaded yet', ' opponent:',this.currentOpponent);
        }
    }
    
    async preLoadAnimatedSprites(){
        const roostersIdlePngPaths = [
            "assets/roosters/idle/rooster1_spritesheet.png",
            "assets/roosters/idle/rooster2_spritesheet.png",
            "assets/roosters/idle/rooster3_spritesheet.png",
            "assets/roosters/idle/rooster4_spritesheet.png"
        ];
        const accessoriesIdlePngPaths = [
            "assets/accessories/idle/accessory1_spritesheet.png",
            "assets/accessories/idle/accessory2_spritesheet.png",
            "assets/accessories/idle/accessory3_spritesheet.png",
            "assets/accessories/idle/accessory4_spritesheet.png"
        ];
        const roostersRunningPngPaths = [
            "assets/roosters/running/rooster1_spritesheet.png",
            "assets/roosters/running/rooster2_spritesheet.png",
            "assets/roosters/running/rooster3_spritesheet.png",
            "assets/roosters/running/rooster4_spritesheet.png"
        ];
        const accessoriesRunningPngPaths = [
            "assets/accessories/running/accessory1_spritesheet.png",
            "assets/accessories/running/accessory2_spritesheet.png",
            "assets/accessories/running/accessory3_spritesheet.png",
            "assets/accessories/running/accessory4_spritesheet.png"
        ];
        const jsonIdlePath = "assets/maps/idle_spritesheet.json";
        const jsonRunningPath = "assets/maps/running_spritesheet.json";
        const jsonAccessoryRunningPath = "assets/maps/running_accessories_spritesheet.json";
        const jsonAvatarTalkingPath = "assets/maps/talking_spritesheet.json";
        const jsonAccessoryTalkingPath = "assets/maps/talking_accessory.json"
        const shadowPngPath = "assets/backgrounds/chicken_shadow.png";
        this.roostersIdle = await this.loadAnimatedSprites(roostersIdlePngPaths, jsonIdlePath);
        this.accessoriesIdle = await this.loadAnimatedSprites(accessoriesIdlePngPaths, jsonIdlePath);
        this.roostersRunning = await this.loadAnimatedSprites(roostersRunningPngPaths, jsonRunningPath);
        this.accessoriesRunning = await this.loadAnimatedSprites(accessoriesRunningPngPaths, jsonAccessoryRunningPath);
        this.playerAvatarIdle = new PIXI.AnimatedSprite(await this.loadCustomSpritesheet(roostersIdlePngPaths[this.playerStats.appearance.avatarId-1], jsonIdlePath));
        this.playerAvatarTalking = new PIXI.AnimatedSprite(await this.loadCustomSpritesheet(roostersIdlePngPaths[this.playerStats.appearance.avatarId-1], jsonAvatarTalkingPath));
        this.playerAccessoryIdle = new PIXI.AnimatedSprite(await this.loadCustomSpritesheet(accessoriesIdlePngPaths[this.playerStats.appearance.accessoryId], jsonIdlePath));
        this.playerAccessoryTalking = new PIXI.Sprite((await this.loadCustomSpritesheet(accessoriesIdlePngPaths[this.playerStats.appearance.accessoryId], jsonAccessoryTalkingPath))[0]);
        this.playerAvatarRunning = new PIXI.AnimatedSprite(await this.loadCustomSpritesheet(roostersRunningPngPaths[this.playerStats.appearance.avatarId-1], jsonRunningPath));
        this.playerAccessoryRunning = new PIXI.AnimatedSprite(await this.loadCustomSpritesheet(accessoriesRunningPngPaths[this.playerStats.appearance.accessoryId], jsonAccessoryRunningPath));
        this.playerAvatarShadow = new PIXI.Sprite(await PIXI.Assets.load(shadowPngPath));
    }   

    async updateSingleAvatar(isPlayer, state="idle") {
        if(state=="talking")
            console.log(this.playerAccessoryTalking);
        let rooster;
        let stats;
        let avatarSprite;
        let accessorySprite;
        let avatarShadow;    
        if(isPlayer){
            this.playerAccessoryIdle.stop();
            this.playerAvatarIdle.stop();
            this.playerAvatarTalking.stop();
            this.playerAvatarRunning.stop();
            this.playerAccessoryRunning.stop();
            rooster = this.playerRooster;
            stats = this.playerStats;
            if(state=="battle"){
                avatarSprite = this.playerAvatarRunning;
                accessorySprite = this.playerAccessoryRunning;
            }
            else if(state == "talking"){
                avatarSprite = this.playerAvatarTalking
                accessorySprite = this.playerAccessoryTalking;
            }
            else{
                avatarSprite = this.playerAvatarIdle;
                accessorySprite = this.playerAccessoryIdle;
                avatarShadow = this.playerAvatarShadow;
            }
        }
        else{
            this.roostersIdle?.forEach(sprite => sprite?.stop());
            this.roostersRunning?.forEach(sprite => sprite?.stop());
            this.accessoriesIdle?.forEach(sprite => sprite?.stop());
            rooster = this.opponentRooster;
            stats = this.currentOpponent;
            if(state=="battle"){
                avatarSprite = this.roostersRunning[stats.appearance.avatarId-1];
                accessorySprite = this.accessoriesRunning[stats.appearance.accessoryId];
            }
            else{
                avatarSprite = this.roostersIdle[stats.appearance.avatarId-1];
                accessorySprite = this.accessoriesIdle[stats.appearance.accessoryId];
            }
       }
        const level = stats.level;
        const baseSize = 100;
        const growthFactor = 5;
        const size = baseSize + (level * growthFactor);
        const animationSpeed = 0.12;
        // Remove old avatar sprite if it exists
        rooster.removeChildren();
        
        avatarSprite.anchor.set(0.5);
        avatarSprite.width = size * 2;
        avatarSprite.height = size * 2;
        avatarSprite.animationSpeed = animationSpeed;
        
        accessorySprite.anchor.set(0.5);
        accessorySprite.width = size * 2;
        accessorySprite.height = size * 2;
        if(state == "idle" && document.getElementById('nav-main').classList.contains('active')){
            avatarShadow.anchor.set(0.5);
            avatarShadow.width = size * 2;
            avatarShadow.height = size*2;
            rooster.addChild(avatarShadow);
        }
        if(state != "talking")
            accessorySprite.animationSpeed = animationSpeed;
        
        //Play and Add Simultaneously
        avatarSprite.gotoAndPlay(0); // Reset to frame 0 and play
        if(state != "talking")
            accessorySprite.gotoAndPlay(0);
        rooster.addChild(avatarSprite);
        rooster.addChild(accessorySprite);
        accessorySprite.visibility = true;
    }

    async loadCustomSpritesheet(spritesheetImagePath, jsonDataPath) {
        // Load the JSON frame data
        const response = await fetch(jsonDataPath);
        const frameData = await response.json();
        
        // Load the baseTexture
        const baseTexture = await PIXI.Assets.load(spritesheetImagePath);
        
        // Create spritesheet data with simple indexed names
        const pixiSheetData = {
            frames: {},
            meta: {
                image: spritesheetImagePath,
                format: "RGBA8888",
                size: { w: 0, h: 0 },
                scale: 1
            }
        };
        
        // Use simple index-based names to avoid conflicts
        frameData.forEach((frame, index) => {
            pixiSheetData.frames[`frame${index}`] = {
                frame: { x: frame.x, y: frame.y, w: frame.width, h: frame.height },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: frame.width, h: frame.height },
                sourceSize: { w: frame.width, h: frame.height }
            };
        });
        
        const sheet = new PIXI.Spritesheet(baseTexture, pixiSheetData);
        await sheet.parse();
        
        // Return the textures in the correct order
        const textures = Object.values(sheet.textures);
        return textures;
    }
    async loadAnimatedSprites(pngPaths, jsonPath) {
        const sprites = [];
        
        const loadPromises = pngPaths.map(async (pngPath, index) => {
            try {
                const textures = await this.loadCustomSpritesheet(pngPath, jsonPath);
                const animatedSprite = new PIXI.AnimatedSprite(textures);
                animatedSprite.name = `sprite${index}`;
                animatedSprite.anchor.set(0.5);
                animatedSprite.width = 100 * 2; // Default size
                animatedSprite.height = 100 * 2;
                animatedSprite.animationSpeed = 0.12;
                
                sprites[index] = animatedSprite;
            } catch (error) {
                console.error(`❌ Failed to load sprite ${index}:`, error);
            }
        });

        await Promise.all(loadPromises);
        
        return sprites;
    }

    async loadPreviews(pngPaths, jsonPath) {
        let previews = [];
        const loadPromises = pngPaths.map(async (pngPath, index) => {
            try {
                const spriteData = await this.loadSingleSprite(pngPath, jsonPath);
                
                // Create a canvas element for this sprite
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                canvas.style.visibility = 'visible';
                
                const ctx = canvas.getContext('2d');
                
                // Check if frame data structure matches your JSON
                // If your JSON is an array, spriteData.frame should be the first element
                ctx.drawImage(
                    spriteData.image,
                    spriteData.frame.x, spriteData.frame.y, 
                    spriteData.frame.width || spriteData.frame.w, // Use width if w doesn't exist
                    spriteData.frame.height || spriteData.frame.h, // Use height if h doesn't exist
                    0, 0, 100, 100
                );
                
                // Store with index-based key
                previews[index] = canvas;
                
            } catch (error) {
                console.error(`❌ Failed to load rooster ${index}:`, error);
                // Create a fallback colored canvas
                const fallbackCanvas = document.createElement('canvas');
                fallbackCanvas.width = 100;
                fallbackCanvas.height = 100;
                const ctx = fallbackCanvas.getContext('2d');
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(0, 0, 100, 100);
                previews[index] = fallbackCanvas;
            }
        });
        
        await Promise.all(loadPromises);
        return previews;
    }

    async loadSingleSprite(spritesheetImagePath, jsonDataPath) {
        // Load the JSON frame data
        const response = await fetch(jsonDataPath);
        const frameData = await response.json();
        
        // Load the image
        const image = await this.loadImage(spritesheetImagePath);
        
        // Get the first frame only - EXACTLY like your original PIXI function
        const firstFrame = frameData[0]; // ← This gets the first array element
        
        return {
            image: image,
            frame: firstFrame // ← This should have x, y, width, height properties
        };
    }

    // Helper function to load images
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
}