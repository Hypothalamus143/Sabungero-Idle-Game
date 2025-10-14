class ReadingManager{
    constructor(playerStats){
        this.playerStats = playerStats;
        this.init();
    }
    async init(){

    }
    showReadingContent(content, category) {
        const paragraphs = content.content.split('\n\n').filter(p => p.trim());
        const paragraphsPerPage = 2;
        const totalPages = Math.ceil(paragraphs.length / paragraphsPerPage);
        let currentPage = 0;
        let timerActive = true;
        let timerInterval; // Add this line with other variables
        let timeRemaining = 10; // 10 seconds per page
        document.getElementById('close-quest').addEventListener('click', () => {
            clearInterval(timerInterval);
            document.getElementById('quest-modal').style.display = 'none';
        });
        const updateDisplay = () => {
            const start = currentPage * paragraphsPerPage;
            const end = start + paragraphsPerPage;
            const currentParagraphs = paragraphs.slice(start, end);
            
            const html = `
                <div class="reading-quest">
                    <h3>📖 ${category}</h3>
                    <div class="article-content">
                        ${currentParagraphs.join('\n\n')}
                    </div>
                    <div class="timer-display">
                        ⏱️ Next page available in: <span id="timer">${timeRemaining}s</span>
                    </div>
                    <div class="page-controls">
                        <button id="prev-page" ${currentPage === 0 ? 'disabled' : ''}>← Previous</button>
                        <span>Page ${currentPage + 1} of ${totalPages}</span>
                        <button id="next-page" disabled>Next →</button>
                    </div>
                    <div class="reading-controls">
                        <button id="mark-completed" 
                                ${currentPage === totalPages - 1 ? '' : 'style="display: none;"'}
                                ${currentPage === totalPages - 1 && !timerActive ? '' : 'disabled'}>
                            ✅ Mark as Completed
                        </button>
                    </div>
                </div>
            `;
            
            document.getElementById('quest-content').innerHTML = html;
            this.setupReadingEventListeners();
        };
        
        this.setupReadingEventListeners = () => {
            const nextBtn = document.getElementById('next-page');
            const prevBtn = document.getElementById('prev-page');
            const completeBtn = document.getElementById('mark-completed');
            // Timer countdown
            timerInterval = setInterval(() => {
                if (timerActive && timeRemaining > 0) {
                    timeRemaining--;
                    document.getElementById('timer').textContent = `${timeRemaining}s`;
                    
                    if (timeRemaining === 0) {
                        timerActive = false;
                        if (nextBtn) nextBtn.disabled = false;
                        if (completeBtn && currentPage === totalPages - 1) {
                            completeBtn.disabled = false;
                        }
                        document.querySelector('.timer-display').style.display = 'none';
                        clearInterval(timerInterval);
                    }
                }
            }, 1000);
            
            if (nextBtn) {
                nextBtn.onclick = () => {
                    clearInterval(timerInterval);
                    if (!timerActive && currentPage < totalPages - 1) {
                        currentPage++;
                        timeRemaining = 10; // Reset timer for next page
                        timerActive = true;
                        updateDisplay();
                    }
                };
            }
            
            if (prevBtn) {
                prevBtn.onclick = () => {
                    clearInterval(timerInterval);
                    currentPage--;
                    timeRemaining = 10; // Reset timer when going back
                    timerActive = true;
                    updateDisplay();
                };
            }
            
            if (completeBtn) {
                completeBtn.onclick = () => {
                    if (!timerActive || currentPage === totalPages - 1) {
                        LearningSystem.completeLearningQuest(this.playerStats,'reading', category);
                    }
                };
            }
        };
        
        updateDisplay();
        document.getElementById('quest-modal').style.display = 'block';
    }
    renderArticle(article, container) {
        container.innerHTML = '<h3>📖 Article</h3>';
        
        if (article.content) {
            const articleDiv = document.createElement('div');
            articleDiv.style.padding = '10px';
            articleDiv.style.background = '#34495e';
            articleDiv.style.borderRadius = '5px';
            articleDiv.style.maxHeight = '400px';
            articleDiv.style.overflowY = 'auto';
            articleDiv.textContent = article.content;
            container.appendChild(articleDiv);
        } else {
            container.innerHTML += '<p>Error loading article</p>';
        }
    }
    getReadingContent(category) {
        const result = BrowserDB.execute(`
            SELECT lc.content
            FROM learning_content lc
            JOIN topics t ON lc.topic_id = t.id
            JOIN content_types ct ON lc.content_type_id = ct.id
            WHERE t.title = ? AND ct.name = 'reading'
        `, [category]);
        
        if (result.length > 0) {
            return { content: result[0].content };
        }
        throw new Error('Reading content not found in BrowserDB');
    }
}