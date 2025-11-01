class ScaleToFit {
    constructor(targetWidth = 1200, targetHeight = 800) {
        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;
        this.applyScale();
    }
    
    applyScale() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Calculate scale ratios for each dimension independently
        const scaleX = screenWidth / this.targetWidth;
        const scaleY = screenHeight / this.targetHeight;
        
        // Apply independent scaling to the ENTIRE document
        document.documentElement.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;
        document.documentElement.style.transformOrigin = 'center center';
        document.documentElement.style.position = 'fixed';
        document.documentElement.style.top = '50%';
        document.documentElement.style.left = '50%';
        document.documentElement.style.width = `${this.targetWidth}px`;
        document.documentElement.style.height = `${this.targetHeight}px`;
        document.documentElement.style.overflow = 'hidden';
        
        // Also set body to match
        document.body.style.width = `${this.targetWidth}px`;
        document.body.style.height = `${this.targetHeight}px`;
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        
        // Resize PIXI renderer once
        if (window.app?.renderer) {
            window.app.canvas.width = this.targetWidth;
            window.app.canvas.height = this.targetHeight;
            window.app.renderer.resize(this.targetWidth/10, this.targetHeight/10);
            window.app.renderer.resolution = 10;
        }
        
        console.log(`📐 Entire document scaled independently: X=${Math.round(scaleX * 100)}% Y=${Math.round(scaleY * 100)}% (${this.targetWidth}x${this.targetHeight})`);
        this.preventZoom();
    }
    preventZoom() {
        // Keyboard zoom prevention
        document.addEventListener('keydown', (e) => {
            const zoomKeys = ['+', '-', '0', '='];
            if ((e.ctrlKey || e.metaKey) && zoomKeys.includes(e.key)) {
                e.preventDefault();
                console.log('🔒 Zoom key prevented:', e.key);
                return false;
            }
    });
    
    // Wheel zoom prevention
    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            return false;
        }
    }, { passive: false });
    
    // Touch pinch zoom prevention
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
}
}


// Apply once and never listen for resizes

// scaling = new ScaleToFit(1920, 1080);
// Disable resize entirely
