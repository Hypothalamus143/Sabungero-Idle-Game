class AssetManager {
    constructor() {
        this.root = null;
        this.downloadQueue = [];
        this.downloadedAssets = new Set();
        this.init();
    }

    async init() {
        try {
            // Request persistent storage
            if (navigator.storage && navigator.storage.persist) {
                const persisted = await navigator.storage.persist();
                console.log('Storage persistent:', persisted);
            }

            // Get file system access
            this.root = await navigator.storage.getDirectory();
            console.log('File System API ready');

            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.installPrompt = e;
                console.log('✅ PWA installable');
            });

            // Scan for already downloaded assets
            await this.scanExistingAssets();
            
            
        } catch (error) {
            console.error('AssetManager init failed:', error);
        }
    }

    async scanExistingAssets() {
        for await (const [name, handle] of this.root.entries()) {
            if (handle.kind === 'file') {
                this.downloadedAssets.add(name);
                console.log('Found existing asset:', name);
            }
        }
    }

    async downloadAllAssets() {
        console.log('Starting full asset download...');
        alert('Starting full asset download...');

        const assets = this.getAllGameAssets();
        let successCount = 0;
        let failCount = 0;

        for (const asset of assets) {
            try {
                await this.downloadAsset(asset.url, asset.filename);
                successCount++;
            } catch (error) {
                console.error('Failed to download:', asset.url, error);
                failCount++;
            }
        }

        console.log(`Download complete: ${successCount} successful, ${failCount} failed`);
        alert("Download Complete!");
        localStorage.setItem('assets-downloaded', 'true');
        return { success: successCount, failed: failCount };
    }

    async downloadAsset(url, filename) {
        console.log('Downloading:', url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const blob = await response.blob();
        const fileHandle = await this.root.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        this.downloadedAssets.add(filename);
        console.log('✅ Downloaded:', filename);
        return true;
    }

    async getAsset(filename) {
        if (!this.downloadedAssets.has(filename)) {
            throw new Error(`Asset not downloaded: ${filename}`);
        }

        const fileHandle = await this.root.getFileHandle(filename);
        const file = await fileHandle.getFile();
        return URL.createObjectURL(file);
    }

    isAssetDownloaded(filename) {
        return this.downloadedAssets.has(filename);
    }

    async startDownload() {
        const btn = document.getElementById('download-assets-btn');
        const progress = document.getElementById('download-progress');
        const progressBar = document.getElementById('download-bar');
        const progressText = document.getElementById('progress-text');
        
        btn.style.display = 'none';
        progress.style.display = 'block';
        
        try {
            await this.downloadAllAssets(progressBar, progressText);
            document.getElementById('download-screen').style.display = 'none';
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            if (progressText) progressText.textContent = 'Download failed!';
            return false;
        }
    }
    getAllGameAssets() {
    return [
        // HTML and Core Files
        { url: './index.html', filename: 'index.html' },
        
        // CSS Files
        { url: './styles/style.css', filename: 'style.css' },
        { url: './styles/battlePanel.css', filename: 'battlePanel.css' },
        { url: './styles/learningPanel.css', filename: 'learningPanel.css' },
        { url: './styles/tutorial.css', filename: 'tutorial.css' },
        { url: './styles/avatarCreation.css', filename: 'avatarCreation.css' },
        { url: './styles/quests/flashcard.css', filename: 'flashcard.css' },
        { url: './styles/quests/quiz.css', filename: 'quiz.css' },
        { url: './styles/quests/reading.css', filename: 'reading.css' },
        
        // JavaScript Files
        { url: './js/core/game.js', filename: 'game.js' },
        { url: './js/core/BrowserDB.js', filename: 'BrowserDB.js' },
        { url: './js/core/config.js', filename: 'config.js' },
        { url: './js/core/DefaultContent.js', filename: 'DefaultContent.js' },
        
        // Battle System
        { url: './js/systems/BattleSystem/BattleEngine.js', filename: 'BattleEngine.js' },
        { url: './js/systems/BattleSystem/BattleSystem.js', filename: 'BattleSystem.js' },
        { url: './js/systems/BattleSystem/BattleAnimationManager.js', filename: 'BattleAnimationManager.js' },
        
        // Learning System
        { url: './js/systems/LearningSystem/LearningSystem.js', filename: 'LearningSystem.js' },
        { url: './js/systems/LearningSystem/FlashcardsManager.js', filename: 'FlashcardsManager.js' },
        { url: './js/systems/LearningSystem/QuizManager.js', filename: 'QuizManager.js' },
        { url: './js/systems/LearningSystem/ReadingManager.js', filename: 'ReadingManager.js' },
        { url: './js/systems/LearningSystem/ContentSearch.js', filename: 'ContentSearch.js' },
        { url: './js/systems/LearningSystem/AIGenerated.js', filename: 'AIGenerated.js' },
        
        // Other Systems
        { url: './js/systems/IdleSystem/IdleSystem.js', filename: 'IdleSystem.js' },
        { url: './js/systems/IdleSystem/Hearts.js', filename: 'Hearts.js' },
        { url: './js/systems/PlayerSystem/RankManager.js', filename: 'RankManager.js' },
        { url: './js/systems/PlayerSystem/ExperienceManager.js', filename: 'ExperienceManager.js' },
        { url: './js/systems/PlayerSystem/AppearanceManager.js', filename: 'AppearanceManager.js' },
        { url: './js/systems/UISystem/UISystem.js', filename: 'UISystem.js' },
        { url: './js/systems/UISystem/ScaleToFit.js', filename: 'ScaleToFit.js' },
        { url: './js/systems/UISystem/Roosters.js', filename: 'Roosters.js' },
        
        // Utils
        { url: './js/utils/pixi.js', filename: 'pixi.js' },
        { url: './js/utils/howler.min.js', filename: 'howler.min.js' },
        { url: './js/utils/pdf.min.js', filename: 'pdf.min.js' },
        { url: './js/utils/mammoth.browser.min.js', filename: 'mammoth.browser.min.js' },
        
        // ========== IMAGE AND AUDIO ASSETS ==========
        
        // Rooster Idle Sprites
        { url: './assets/roosters/idle/rooster1_spritesheet.png', filename: 'rooster1_idle.png' },
        { url: './assets/roosters/idle/rooster2_spritesheet.png', filename: 'rooster2_idle.png' },
        { url: './assets/roosters/idle/rooster3_spritesheet.png', filename: 'rooster3_idle.png' },
        { url: './assets/roosters/idle/rooster4_spritesheet.png', filename: 'rooster4_idle.png' },
        
        // Rooster Running Sprites
        { url: './assets/roosters/running/rooster1_spritesheet.png', filename: 'rooster1_running.png' },
        { url: './assets/roosters/running/rooster2_spritesheet.png', filename: 'rooster2_running.png' },
        { url: './assets/roosters/running/rooster3_spritesheet.png', filename: 'rooster3_running.png' },
        { url: './assets/roosters/running/rooster4_spritesheet.png', filename: 'rooster4_running.png' },
        
        // Accessory Idle Sprites
        { url: './assets/accessories/idle/accessory1_spritesheet.png', filename: 'accessory1_idle.png' },
        { url: './assets/accessories/idle/accessory2_spritesheet.png', filename: 'accessory2_idle.png' },
        { url: './assets/accessories/idle/accessory3_spritesheet.png', filename: 'accessory3_idle.png' },
        { url: './assets/accessories/idle/accessory4_spritesheet.png', filename: 'accessory4_idle.png' },
        
        // Accessory Running Sprites
        { url: './assets/accessories/running/accessory1_spritesheet.png', filename: 'accessory1_running.png' },
        { url: './assets/accessories/running/accessory2_spritesheet.png', filename: 'accessory2_running.png' },
        { url: './assets/accessories/running/accessory3_spritesheet.png', filename: 'accessory3_running.png' },
        { url: './assets/accessories/running/accessory4_spritesheet.png', filename: 'accessory4_running.png' },
        
        // Backgrounds
        { url: './assets/backgrounds/sabungan_spritesheet.png', filename: 'sabungan_background.png' },
        { url: './assets/backgrounds/pugaran_background.png', filename: 'pugaran_background.png' },
        
        // Smokescreen
        { url: './assets/smokescreen/battle_spritesheet.png', filename: 'smokescreen_battle.png' },
        
        // Music
        { url: './assets/music/sabunganBackgroundMusic.mp3', filename: 'sabungan_music.mp3' },
        { url: './assets/music/pugaranBackgroundMusic.mp3', filename: 'pugaran_music.mp3' },
        { url: './assets/music/smokeFight.mp3', filename: 'smokefight_music.mp3' },
        { url: './assets/music/chickenFight.mp3', filename: 'chickenfight_music.mp3' },
        
        // JSON Maps/Data
        { url: './assets/maps/sabungan_spritesheet.json', filename: 'sabungan_map.json' },
        { url: './assets/maps/running_spritesheet.json', filename: 'running_map.json' },
        { url: './assets/maps/running_accessories_spritesheet.json', filename: 'running_accessories_map.json' },
        { url: './assets/maps/idle_spritesheet.json', filename: 'idle_map.json' },
        { url: './assets/maps/smokescreen_spritesheet.json', filename: 'smokescreen_map.json' }
    ];
}
    async clearAllAssets() {
        if(!confirm('Are you sure you want to delete downloaded assets? \n(You cannot run this offline anymore)'))
            return;
        alert("Now deleting...");
        
        const cache = await caches.open('sabungero-idle-game');
        await cache.delete('/index.html');
            try {
            let deletedCount = 0;
            
            // Delete all files in the file system
            for await (const [name, handle] of this.root.entries()) {
                if (handle.kind === 'file') {
                    await this.root.removeEntry(name);
                    deletedCount++;
                    console.log('🗑️ Deleted:', name);
                }
            }
            
            // Clear tracking data
            this.downloadedAssets.clear();
            localStorage.removeItem('assets-downloaded');
            
            console.log(`✅ Cleared ${deletedCount} files`);
            return deletedCount;
            
        } catch (error) {
            console.error('Error clearing assets:', error);
            throw error;
        }
    }
    installPWA() {
        if (this.installPrompt) {
            this.installPrompt.prompt();
            this.installPrompt.userChoice.then(choice => {
                alert(`Install: ${choice.outcome}`);
                this.installPrompt = null;
            });
        } else {
            alert('📱 Not installable in this browser.\n\nTry:\n• Refresh page\n• Use browser menu\n• Use different browser');
        }
    }
}

// Global instance
const assetManager = new AssetManager();