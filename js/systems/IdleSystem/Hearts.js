class Hearts {
    constructor(playerStats) {
        this.playerStats = playerStats;
        this.heartTextures = [];
        this.heartPool = [];
        this.activeHearts = [];
        this.poolSize = 20;
        this.heartAnimation = null;
    }
    
    async initialize() {
        // Pre-create different colored heart textures
        this.heartTextures = [
            this.createHeartTexture('#FF6B6B'), // Red
            this.createHeartTexture('#FF85B3'), // Pink  
            this.createHeartTexture('#6BCEFF'), // Blue
            this.createHeartTexture('#FFD700')  // Gold
        ];
        
        // Pre-create sprite pool with random colors
        for (let i = 0; i < this.poolSize; i++) {
            const texture = this.heartTextures[Math.floor(Math.random() * this.heartTextures.length)];
            const heart = new PIXI.Sprite(texture);
            heart.anchor.set(0.5);
            heart.visible = false;
            this.heartPool.push(heart);
            window.stageContainer.addChild(heart);
        }
        console.log(this.heartPool);
        console.log(`❤️ Hearts system initialized with ${this.poolSize} hearts`);
    }
    
    createHeartTexture(color = '#FF6B6B') {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.beginPath();
        
        // Draw heart shape
        const x = 32, y = 32, size = 15;
        ctx.moveTo(x, y - size);
        ctx.bezierCurveTo(x, y - size*2, x - size*2, y - size*2, x - size*2, y);
        ctx.bezierCurveTo(x - size*2, y + size, x, y + size*2, x, y + size*2);
        ctx.bezierCurveTo(x, y + size*2, x + size*2, y + size, x + size*2, y);
        ctx.bezierCurveTo(x + size*2, y - size*2, x, y - size*2, x, y - size);
        
        ctx.closePath();
        ctx.fill();
        
        return PIXI.Texture.from(canvas);
    }
    
    spawnHeart(x, y) {
        if (this.heartPool.length === 0) {
            console.warn('No hearts available in pool');
            return null;
        }
        
        const heart = this.heartPool.pop();
        heart.visible = true;
        heart.x = x;
        heart.y = y;
        heart.alpha = 0.7 + Math.random() * 0.3;
        heart.scale.set(0.1 + Math.random() * (0.2 + 0.05 * this.playerStats.multiplier));
        
        // Movement properties
        heart.speedY = -1 - Math.random() * 2;
        heart.speedX = -1 + Math.random() * 2;
        heart.wobbleSpeed = 0.5 + Math.random() * 2;
        heart.wobbleAmount = 0.5 + Math.random() * 2;
        heart.startTime = performance.now();
        
        this.activeHearts.push(heart);
        return heart;
    }
    
    spawnHearts(count = 10, x = 0, y = 0, width = 100, height = 100) {
        const actualCount = Math.min(count, this.heartPool.length);
        
        for (let i = 0; i < actualCount; i++) {
            const spawnX = x + (Math.random() * width);
            const spawnY = y + (Math.random() * height);
            this.spawnHeart(spawnX, spawnY);
        }
        
        return actualCount;
    }
    
    returnHeartToPool(heart) {
        heart.visible = false;
        this.heartPool.push(heart);
    }
    
    startAnimation(maxTimeAlive = 5000) {
        if (this.heartAnimation) return; // Already running
        
        this.heartAnimation = (delta) => {
            const currentTime = performance.now();
            
            for (let i = this.activeHearts.length - 1; i >= 0; i--) {
                const heart = this.activeHearts[i];
                const timeAlive = currentTime - heart.startTime;
                
                // Update position with wobble
                const wobble = Math.sin(timeAlive * 0.001 * heart.wobbleSpeed) * heart.wobbleAmount;
                heart.x += heart.speedX + wobble;
                heart.y += heart.speedY;
                
                // Fade out based on time alive
                const progress = timeAlive / maxTimeAlive;
                heart.alpha = 1 - progress;
                
                // Return to pool when time's up or off screen
                if (timeAlive >= maxTimeAlive || heart.y < -50 || heart.alpha < 0.1) {
                    this.activeHearts.splice(i, 1);
                    this.returnHeartToPool(heart);
                }
            }
        };
        
        window.app.ticker.add(this.heartAnimation);
        console.log(`❤️ Heart animation started (max time: ${maxTimeAlive}ms)`);
    }
    
    stopAnimation() {
        if (this.heartAnimation) {
            window.app.ticker.remove(this.heartAnimation);
            this.heartAnimation = null;
        }
        
        // Return all active hearts to pool
        this.activeHearts.forEach(heart => {
            this.returnHeartToPool(heart);
        });
        this.activeHearts = [];
        
        console.log('❤️ Heart animation stopped');
    }
    
    // Quick methods for common use cases
    spawnAroundPlayer(count = 15) {
        const x = window.app.uiSystem.roosters.playerRooster.x - 75;
        const y = window.app.uiSystem.roosters.playerRooster.y - 75;
        return this.spawnHearts(count, x, y, 150, 150);
    }
    
    spawnAroundPoint(count = 10, pointX, pointY, radius = 100) {
        return this.spawnHearts(count, pointX - radius, pointY - radius, radius * 2, radius * 2);
    }
    
    cleanup() {
        this.stopAnimation();
        
        // Remove all hearts from stage
        this.heartPool.forEach(heart => {
            window.app.stage.removeChild(heart);
        });
        this.heartPool = [];
        this.activeHearts = [];
    }
}