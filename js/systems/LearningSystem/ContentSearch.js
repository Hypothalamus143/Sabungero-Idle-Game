class ContentSearch{
    constructor(readingManager, flashcardsManager, quizManager, aiGenerated, playerStats){
        this.readingManager = readingManager;
        this.flashcardsManager = flashcardsManager;
        this.quizManager = quizManager;
        this.aiGenerated = aiGenerated;
        this.playerStats = playerStats;
        this.init();
    }
    async init(){
        this.response = await fetch('defaultContent/lore.json');
        this.frameData = await this.response.json();
    }
    async searchTopics(searchTerm, page = 1, currentContentType) {
        let results;
        let pagination;
        if(searchTerm == ""){
            results = await this.fetchLoreResults();
            pagination = {
                current_page: page,
                total_pages: 1,
                total_items: 0,
                items_per_page: 10,
                has_next: false,
                has_prev: false
            };
            this.showSearchResults(results, searchTerm, pagination);
            return;
        }
        this.currentContentType = currentContentType;
        console.log("🔍 Searching BrowserDB for:", searchTerm, "Active tab:", this.currentContentType, "Page:", page);
        
        try {
            results = [];
            pagination = {
                current_page: page,
                total_pages: 1,
                total_items: 0,
                items_per_page: 10,
                has_next: false,
                has_prev: false
            };

            if (!this.currentContentType) {
                // Search ALL content types in BrowserDB
                const query = `
                    SELECT ct.name as contentType, t.title as category
                    FROM topics t
                    JOIN learning_content lc ON t.id = lc.topic_id  
                    JOIN content_types ct ON lc.content_type_id = ct.id
                    WHERE t.title LIKE ?
                    LIMIT ? OFFSET ?
                `;
                
                const offset = (page - 1) * pagination.items_per_page;
                const dbResults = BrowserDB.execute(query, [`%${searchTerm}%`, pagination.items_per_page, offset]);
                
                results = dbResults.map(row => ({
                    contentType: row.contentType,
                    category: row.category
                }));
                
            } else {
                // Search specific content type in BrowserDB
                const query = `
                    SELECT t.title as category
                    FROM topics t
                    JOIN learning_content lc ON t.id = lc.topic_id  
                    JOIN content_types ct ON lc.content_type_id = ct.id
                    WHERE ct.name = ? AND t.title LIKE ?
                    LIMIT ? OFFSET ?
                `;
                
                const offset = (page - 1) * pagination.items_per_page;
                const dbResults = BrowserDB.execute(query, [this.currentContentType, `%${searchTerm}%`, pagination.items_per_page, offset]);
                
                results = dbResults.map(row => ({
                    contentType: this.currentContentType,
                    category: row.category
                }));
            }
            
            console.log("✅ BrowserDB search results:", results);
            this.showSearchResults(results, searchTerm, pagination);
            
        } catch (error) {
            console.error('Error searching BrowserDB:', error);
        }
    }
    addSearchPagination(pagination, searchTerm) {
        if(pagination == null)
            return;
        const bottomPagination = document.getElementById('bottom-pagination');
        bottomPagination.style.visibility = "visible";
        let paginationHTML = '<div class="pagination">';
        
        if (pagination.has_prev) {
            paginationHTML += `<button class="search-page-btn" data-page="${pagination.current_page - 1}">← Previous</button>`;
        }
        
        paginationHTML += `<span>Page ${pagination.current_page} of ${pagination.total_pages}</span>`;
        
        if (pagination.has_next) {
            paginationHTML += `<button class="search-page-btn" data-page="${pagination.current_page + 1}">Next →</button>`;
        }
        
        paginationHTML += '</div>';
        
        bottomPagination.innerHTML = paginationHTML;
        
        document.querySelectorAll('.search-page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                this.searchTopics(searchTerm, page);
            });
        });
    }
    addPaginationControls(pagination, contentType) {
        const container = document.getElementById('categories-container');
        
        const paginationHTML = `
            <div class="pagination">
                <button class="page-btn prev-btn" data-page="${pagination.current_page - 1}" 
                        style="visibility: ${pagination.has_prev ? 'visible' : 'hidden'}">
                    ← Previous
                </button>
                <span>Page ${pagination.current_page} of ${pagination.total_pages}</span>
                <button class="page-btn next-btn" data-page="${pagination.current_page + 1}"
                        style="visibility: ${pagination.has_next ? 'visible' : 'hidden'}">
                    Next →
                </button>
            </div>
        `;
        
        container.innerHTML += paginationHTML;
        
        document.querySelectorAll('.page-btn').forEach(btn => {
            if (btn.style.visibility !== 'hidden') {
                btn.addEventListener('click', (e) => {
                    const page = parseInt(e.target.dataset.page);
                    this.showLearningCategories(contentType, page);
                });
            }
        });
    }

    showSearchResults(results, searchTerm, pagination) {
        document.getElementById('search-results').style.display = 'block';
        const container = document.getElementById('results-container');
        container.innerHTML = ''; // Always clear first
        
        if (results && results.length > 0) {
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                const displayText = this.currentContentType === null ? 
                    `${result.category} (${result.contentType})`
                    : result.category;
                    
                resultItem.innerHTML = `
                    <span class="result-text">${displayText}</span>
                `;
                if(searchTerm != "")
                    resultItem.innerHTML +=  `<button class="delete-btn" data-content-type="${result.contentType}" data-category="${result.category}">🗑️ Delete</button>`;
                container.appendChild(resultItem);
                
                // Add click event for learning
                resultItem.querySelector('.result-text').addEventListener('click', () => {
                    if(searchTerm == "")
                        this.startLearningQuest(result, true);
                    else
                        this.startLearningQuest(result);
                });
                
                // Add click event for delete
                if(searchTerm != ""){
                resultItem.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering the learning quest
                    this.deleteContent(result.contentType, result.category);
                });
                }
            });
        } else {
            container.innerHTML = '<p>No topics found.</p>';
        }
        
        this.addSearchPagination(pagination, searchTerm);
    }
    async fetchLoreResults(){
        let results = [];
        Object.keys(this.frameData).forEach(key => {
            if(this.playerStats.ranking.mmr > this.frameData[key]["MMR"])
                results.push({"category":key+" Lore", "contentType":"reading"});
        });
        return results;
    }
    async deleteContent(contentType, category) {
        if (!confirm(`Are you sure you want to delete "${category}" (${contentType})? This cannot be undone!`)) {
            return;
        }
        
        try {
            console.log(`🗑️ Deleting ${contentType}: ${category}`);
            
            // Get topic ID first
            const topicResult = BrowserDB.execute(
                'SELECT id FROM topics WHERE title = ?',
                [category]
            );
            
            if (topicResult.length === 0) {
                alert('Topic not found!');
                return;
            }
            
            const topicId = topicResult[0].id;
            
            // Get content type ID
            const contentTypeResult = BrowserDB.execute(
                'SELECT id FROM content_types WHERE name = ?',
                [contentType]
            );
            const contentTypeId = contentTypeResult[0].id;
            
            // Get learning content ID
            const learningContentResult = BrowserDB.execute(
                'SELECT id FROM learning_content WHERE topic_id = ? AND content_type_id = ?',
                [topicId, contentTypeId]
            );
            
            if (learningContentResult.length === 0) {
                alert('Content not found!');
                return;
            }
            
            const learningContentId = learningContentResult[0].id;
            
            // Delete related content based on type
            if (contentType === 'flashcards') {
                BrowserDB.execute(
                    'DELETE FROM flashcards WHERE learning_content_id = ?',
                    [learningContentId]
                );
            } else if (contentType === 'quiz') {
                BrowserDB.execute(
                    'DELETE FROM quiz_questions WHERE learning_content_id = ?',
                    [learningContentId]
                );
            }
            
            // Delete learning content entry
            BrowserDB.execute(
                'DELETE FROM learning_content WHERE id = ?',
                [learningContentId]
            );
            
            // Check if topic has any other content, if not delete topic too
            const remainingContent = BrowserDB.execute(
                'SELECT COUNT(*) as count FROM learning_content WHERE topic_id = ?',
                [topicId]
            );
            
            if (remainingContent[0].count === 0) {
                BrowserDB.execute(
                    'DELETE FROM topics WHERE id = ?',
                    [topicId]
                );
            }
            
            // Save changes
            BrowserDB.save();
            
            console.log('✅ Content deleted successfully');
            alert(`"${category}" has been deleted!`);
            
            // Refresh the search results
            this.searchTopics(document.getElementById('topic-search').value.trim(), 1, this.currentContentType);
            
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('Failed to delete content');
        }
    }
    async startLearningQuest(result, lore = false) {
        if(lore){
            this.readingManager.showReadingContent(this.frameData[this.playerStats.ranking.rank], result["category"], lore);
            return;
        }
        try {
            // Now we have the full result object with contentType and category
            const { contentType, category } = result;
            
            // Use BrowserDB to get the actual content
            const content = this.getContentFromBrowserDB(contentType, category);
            document.getElementById('blur').classList.add('blur-overlay');
            if (contentType === 'reading') {
                this.readingManager.showReadingContent(content, category);
            } else if (contentType === 'flashcards') {
                this.flashcardsManager.showFlashcardsContent(content, category);
            } else if (contentType === 'quiz') {
                this.quizManager.showQuizContent(content, category);
            }
            
        } catch (error) {
            console.error('Error loading content from BrowserDB:', error);
        }
    }
    getContentFromBrowserDB(contentType, category) {
        try {
            console.log('📚 Loading from BrowserDB:', { contentType, category });
            
            if (contentType === 'reading') {
                return this.readingManager.getReadingContent(category);
            } else if (contentType === 'flashcards') {
                return this.flashcardsManager.getFlashcardsContent(category);
            } else if (contentType === 'quiz') {
                return this.quizManager.getQuizContent(category);
            }
            
            throw new Error('Unknown content type');
            
        } catch (error) {
            console.error('Error getting content from BrowserDB:', error);
            throw error;
        }
    }
}