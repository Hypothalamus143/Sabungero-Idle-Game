class LearningSystem{
    constructor(playerStats){
        this.playerStats = playerStats;
        this.currentContentType = null;
        this.readingManager = new ReadingManager(this.playerStats);
        this.flashcardsManager = new FlashcardsManager(this.playerStats);
        this.quizManager = new QuizManager(this.playerStats);
        this.aiGenerated = new AIGenerated();
        this.contentSearch = new ContentSearch(this.readingManager, this.flashcardsManager, this.quizManager, this.aiGenerated);
        this.default_content = new DefaultContent();
        this.init();
    }
    
    async init(){
        const savedKey = localStorage.getItem('gemini_api_key');
            if (savedKey) {
                window.GEMINI_API_KEY = savedKey;
                document.getElementById('api-key-input-modal').value = '*'.repeat(savedKey.length); // mask it
                console.log("✅ Gemini API key loaded from localStorage");
            }
        this.initEventListeners();
    }
    async initializeDefaultContent(){
        const hasContent = await BrowserDB.execute('SELECT 1 FROM topics LIMIT 1');
        if (hasContent.length > 0) {
            console.log('✅ Default content already exists');
            return;
        }
        const defaultReadingArticle = this.default_content.defaultArticles();
        await this.aiGenerated.saveToBrowserDB(defaultReadingArticle.content, defaultReadingArticle.topic, defaultReadingArticle.category);
        const defaultFlashcards = this.default_content.defaultFlashcards();
        await this.aiGenerated.saveToBrowserDB(defaultFlashcards.content, defaultFlashcards.topic, defaultFlashcards.category);
        const defaultQuiz = this.default_content.defaultQuizzes();
        await this.aiGenerated.saveToBrowserDB(defaultQuiz.content, defaultQuiz.topic, defaultQuiz.category);
    }
    initEventListeners(){
        // Pause game key listening when input is focused
        document.getElementById('topic-search').addEventListener('focus', () => {
            this.inputFocused = true;
        });
        document.getElementById('topic-search').addEventListener('blur', () => {
            this.inputFocused = false;
        });
        document.getElementById('api-key-input-modal').addEventListener('focus', () => {
            this.inputFocused = true;
        });
        document.getElementById('api-key-input-modal').addEventListener('blur', () => {
            this.inputFocused = false;
        });
        document.getElementById('topic-search').addEventListener('input', (e) => {
            const term = e.target.value.trim();
            if (term.length === 0) {
                this.contentSearch.showSearchResults([], term, null);
                document.getElementById('search-results').style.display = 'none';
            } else {
                this.contentSearch.searchTopics(term, 1, this.currentContentType);
            }
        });
        //Learning Tab Buttons
        document.getElementById('tab-reading').addEventListener('click', () => {
            this.toggleTab('reading');
        });
        document.getElementById('tab-flashcards').addEventListener('click', () => {
            this.toggleTab('flashcards');
        });
        document.getElementById('tab-quiz').addEventListener('click', () => {
            this.toggleTab('quiz');
        });
        // Open modal when user clicks Generate with AI (bottom of panel)
        document.getElementById("generate-similar").addEventListener("click", () => {
            document.getElementById("ai-options-modal").style.display = "flex";
        });

        // Close modal
        document.getElementById("close-ai-options").addEventListener("click", () => {
            document.getElementById("ai-options-modal").style.display = "none";
        });
        // Generate content trigger
        document.getElementById("generate-ai-now").addEventListener("click", async () => {
            // Close the modal first
            document.getElementById("ai-options-modal").style.display = "none";
            await this.aiGenerated.generateWithAI(this.currentContentType);
            this.contentSearch.searchTopics(document.getElementById('topic-search').value.trim(), 1, this.currentContentType);
        });
        // Quest modal buttons
        document.getElementById('close-quest').addEventListener('click', () => {
            this.closeQuestModal();
            document.getElementById('blur').classList.remove('blur-overlay');
        });
        document.getElementById('save-api-key-modal').addEventListener('click', () => {
            const input = document.getElementById('api-key-input-modal');
            const key = input.value.trim();

            if (!key) {
                alert("Please enter your Gemini API key!");
                return;
            }

            // Store key locally
            localStorage.setItem('gemini_api_key', key);
            window.GEMINI_API_KEY = key;
            input.value = '*'.repeat(key.length); // mask
            alert("✅ Gemini API key saved!");
        });
    }
    showLearningMain() {
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('topic-search').value = '';
    }
    closeQuestModal() {
        document.getElementById('quest-modal').style.display = 'none';
        this.currentQuest = null;
    }
    toggleTab(contentType) {
        const tab = document.getElementById(`tab-${contentType}`);
        
        if (tab.classList.contains('active')) {
            // Deactivate the tab
            tab.classList.remove('active');
            this.currentContentType = null; // No active tab
        } else {
            // Activate the tab (deactivate others)
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            tab.classList.add('active');
            this.currentContentType = contentType;
        }
        
        // Update display
        const displayType = this.currentContentType ? 
            this.currentContentType.charAt(0).toUpperCase() + this.currentContentType.slice(1) : 
            'All';
        document.getElementById('current-content-type').textContent = displayType;
        
        // Restart search if there's text
        const searchTerm = document.getElementById('topic-search').value.trim();
        if (searchTerm) {
            this.contentSearch.searchTopics(searchTerm, 1, this.currentContentType);
        }
    }
    static completeLearningQuest(playerStats, contentType, category) {
        // Increase multiplier
        playerStats.multiplier += 1;
        BrowserDB.savePlayerStats(this.playerStats);
        // Show success message
        const modal = document.getElementById('quest-modal');
        const contentDiv = document.getElementById('quest-content');
        
        contentDiv.innerHTML = `
            <div class="completion-message">
                <h3>🎉 Quest Completed!</h3>
                <p>You've completed <strong>${category}</strong> (${contentType})</p>
                <p>Multiplier increased by +1! (Now ${playerStats.multiplier.toFixed(2)}x)</p>
                <button id="close-completion">Continue</button>
            </div>
        `;
        
        document.getElementById('close-completion').addEventListener('click', () => {
            modal.style.display = 'none';
            window.app.uiSystem.updateUI();
            document.getElementById('blur').classList.remove('blur-overlay');
        });
    }
    static async initializeDefaultContent() {
        // Check if default content already exists
        const hasContent = BrowserDB.execute('SELECT 1 FROM topics LIMIT 1');
        if (hasContent.length > 0) {
            console.log('✅ Default content already exists');
            return;
        }
        
        console.log('📚 Adding default Cebuano learning content...');
        
        // Add default content here
        await default_content.addDefaultFlashcards(this);
        await default_content.addDefaultQuizzes(this);
        await default_content.addDefaultArticles(this);
        
        this.save(); // Save to localStorage
        console.log('✅ Default content initialized!');
    }
}