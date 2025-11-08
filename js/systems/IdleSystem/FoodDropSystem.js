class FoodDropSystem{
    constructor(playerStats){
        this.playerStats = playerStats;
        this.dragTarget = null;
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
    }
    async addDrops(){
        this.dropSprites = {};
        const loadPromises = Object.entries(this.playerStats.drops).map(async ([key, value]) => {
            this.addDrop(key, value);
        })
        await Promise.all(loadPromises);
    }
    addDrop(key, value){
        const sprite = new PIXI.Sprite(window.app.uiSystem.dropTextures[value["type"]]["texture"]);
        sprite.x = value["position"][0];
        sprite.y = value["position"][1];
        sprite.width = window.app.uiSystem.dropTextures[value["type"]]["dimensions"][0];
        sprite.height = window.app.uiSystem.dropTextures[value["type"]]["dimensions"][1];
        sprite.anchor.set(0.5);
        sprite.eventMode = 'static';
        sprite.cursor = "pointer";
        sprite.hitArea = new PIXI.Rectangle(-sprite.anchor.x * sprite.width , -sprite.anchor.y * sprite.height, sprite.width, sprite.height);
        sprite.on('pointerdown', this.onDragStart);
        sprite.on('pointerup', this.onDragEnd);
        sprite.on('pointerupoutside', this.onDragEnd);
        this.dropSprites[key] = sprite;
        sprite.id = key;
        window.app.stage.addChild(sprite);
        return sprite;
    }
    // Drag functions
    onDragStart(event) {
        this.dragTarget = event.currentTarget;
        window.app.stage.on('pointermove', this.onDragMove); 
    }

    onDragMove(event) {
        if (this.dragTarget) {
            // Move sprite to mouse position
            this.dragTarget.parent.toLocal(event.global, null, this.dragTarget.position);
        }
    }

    async onDragEnd() {
        if (this.dragTarget) {
            window.app.stage.off('pointermove', this.onDragMove);
            this.checkDropPosition(this.dragTarget);
            this.dragTarget = null;
        }
    }

    checkDropPosition(sprite){
        if(this.intersects(sprite, window.app.uiSystem.roosters.playerRooster)){
            window.app.stage.removeChild(sprite);
            const id = sprite.id;
            const type = this.playerStats.drops[id]["type"];
            this.playerStats.rooster_multiplier += window.app.uiSystem.dropTextures[type]["multiplier"];
            // const modal = document.getElementById('quest-modal');
            // modal.style.display = 'flex';
            // const contentDiv = document.getElementById('quest-content');
            
            // contentDiv.innerHTML = `
            //     <div class="completion-message">
            //         <h3>Your rooster ate the ${type}!</h3>
            //         <h1 style="color:black">It'll now grow faster!</h1>
            //         <p>Its multiplier increased by ${parseInt(window.app.uiSystem.dropTextures[type]["multiplier"])}!</p>
            //     </div>
            // `;
            delete this.dropSprites[id];
            delete this.playerStats.drops[id];
            sprite.destroy({
            children: true,    // Destroy child objects
            texture: false,    // Keep texture (might be reused)
            baseTexture: false // Keep baseTexture
        });
        window.app.uiSystem.updateUI();
        BrowserDB.savePlayerStats(this.playerStats);
        }
    }
    intersects(spriteA, spriteB, collisionScale = 0.5) {
        const a = spriteA.getBounds();
        const b = spriteB.getBounds();
        
        // Calculate scaled dimensions (3/4 of original)
        const aScaledWidth = a.width * collisionScale;
        const aScaledHeight = a.height * collisionScale;
        const bScaledWidth = b.width * collisionScale;
        const bScaledHeight = b.height * collisionScale;
        
        // Calculate centered positions for scaled bounds
        const aCenterX = a.x + a.width / 2;
        const aCenterY = a.y + a.height / 2;
        const bCenterX = b.x + b.width / 2;
        const bCenterY = b.y + b.height / 2;
        
        const aScaledX = aCenterX - aScaledWidth / 2;
        const aScaledY = aCenterY - aScaledHeight / 2;
        const bScaledX = bCenterX - bScaledWidth / 2;
        const bScaledY = bCenterY - bScaledHeight / 2;
        
        return aScaledX < bScaledX + bScaledWidth && 
            aScaledX + aScaledWidth > bScaledX && 
            aScaledY < bScaledY + bScaledHeight && 
            aScaledY + aScaledHeight > bScaledY;
    }
    
}