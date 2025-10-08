class ContentSearch{
    constructor(readingManager, flashcardsManager, quizManager){
        this.readingManager = readingManager;
        this.flashcardsManager = flashcardsManager;
        this.quizManager = quizManager;
        this.init();
    }
    async init(){

    }
    async searchTopics(searchTerm, page = 1, currentContentType) {
    this.currentContentType = currentContentType;
    console.log("🔍 Searching BrowserDB for:", searchTerm, "Active tab:", this.currentContentType, "Page:", page);
    
    try {
        let results = [];
        let pagination = {
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
                    <button class="delete-btn" data-content-type="${result.contentType}" data-category="${result.category}">🗑️ Delete</button>
                `;
                
                container.appendChild(resultItem);
                
                // Add click event for learning
                resultItem.querySelector('.result-text').addEventListener('click', () => {
                    this.startLearningQuest(result);
                });
                
                // Add click event for delete
                resultItem.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering the learning quest
                    this.deleteContent(result.contentType, result.category);
                });
            });
        } else {
            container.innerHTML = '<p>No topics found.</p>';
        }
        
        this.addSearchPagination(pagination, searchTerm);
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
    async startLearningQuest(result) {
        try {
            // Now we have the full result object with contentType and category
            const { contentType, category } = result;
            
            // Use BrowserDB to get the actual content
            const content = this.getContentFromBrowserDB(contentType, category);
            
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
    async generateWithAI() {
        alert('finding cheap backend... coming soon...');
        return;
        const topic = document.getElementById('topic-search').value.trim();
        
        // Check if any tab is active
        if (this.currentContentType === null) {
            alert('Please select a content type first!');
            return;
        }
        
        if (!topic) {
            alert('Please enter a topic first!');
            return;
        }
        
        // ✅ Frontend check if topic already exists in BrowserDB
        const exists = await this.checkIfTopicExists(topic, this.currentContentType);
        if (exists) {
            alert(`Topic "${topic}" already exists as ${this.currentContentType}!`);
            return;
        }
        
        // Show loading state
        const modal = document.getElementById('quest-modal');
        const contentDiv = document.getElementById('quest-content');
        contentDiv.innerHTML = '<div class="loading">✨ Generating content with AI...</div>';
        modal.style.display = 'block';
        
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/learning/generate-with-validation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic,
                    content_type: this.currentContentType
                })
            });
            
            const data = await response.json();
            console.log(data);
            
            if (data.success) {
                // Save to BrowserDB and show content
                await this.saveToBrowserDB(data.content, topic, this.currentContentType);
                this.showAIGeneratedContent(topic, this.currentContentType);
                
            } else {
                alert('Error: ' + data.detail);
                modal.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error generating with AI:', error);
            alert('Failed to generate content');
            modal.style.display = 'none';
        }
    }

    showAIGeneratedContent(topic, category) {
        const contentDiv = document.getElementById('quest-content');
        
        contentDiv.innerHTML = `
            <h3>✨ AI Generated: ${topic}</h3>
        `;
        this.searchTopics(topic, 1, category);
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
    async saveToBrowserDB(content, topic, contentType) {
        try {
            console.log('💾 Saving to BrowserDB:', { topic, contentType, content });
            
            // Check if topic already exists in BrowserDB
            const existingTopic = BrowserDB.execute(
                'SELECT id FROM topics WHERE title = ?',
                [topic]
            );
            
            let topicId;
            
            if (existingTopic.length > 0) {
                topicId = existingTopic[0].id;
                console.log('📝 Topic exists, using ID:', topicId);
            } else {
                // Insert new topic
                BrowserDB.execute(
                    'INSERT INTO topics (title) VALUES (?)',
                    [topic]
                );
                
                // Get the new topic ID
                const newTopic = BrowserDB.execute(
                    'SELECT id FROM topics WHERE title = ?',
                    [topic]
                );
                topicId = newTopic[0].id;
                console.log('🆕 New topic created with ID:', topicId);
            }
            
            // Get content type ID
            const contentTypeResult = BrowserDB.execute(
                'SELECT id FROM content_types WHERE name = ?',
                [contentType]
            );
            const contentTypeId = contentTypeResult[0].id;
            
            // Insert or update learning content
            if (contentType === 'reading') {
                BrowserDB.execute(
                    'INSERT OR REPLACE INTO learning_content (topic_id, content_type_id, content) VALUES (?, ?, ?)',
                    [topicId, contentTypeId, content.content]
                );
            } else {
                const result = BrowserDB.execute(
                    'INSERT OR IGNORE INTO learning_content (topic_id, content_type_id) VALUES (?, ?)',
                    [topicId, contentTypeId]
                );
                
                // Get learning content ID
                const learningContent = BrowserDB.execute(
                    'SELECT id FROM learning_content WHERE topic_id = ? AND content_type_id = ?',
                    [topicId, contentTypeId]
                );
                const learningContentId = learningContent[0].id;
                
                // Save related content
                if (contentType === 'flashcards') {
                    content.flashcards.forEach(flashcard => {
                        BrowserDB.execute(
                            'INSERT INTO flashcards (learning_content_id, question, answer, explanation) VALUES (?, ?, ?, ?)',
                            [learningContentId, flashcard.question, flashcard.answer, flashcard.explanation || '']
                        );
                    });
                } else if (contentType === 'quiz') {
                    content.questions.forEach(question => {
                        BrowserDB.execute(
                            `INSERT INTO quiz_questions 
                            (learning_content_id, question, option_a, option_b, option_c, option_d, correct_index, explanation) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                learningContentId,
                                question.question,
                                question.options[0],
                                question.options[1],
                                question.options[2],
                                question.options[3],
                                question.correct_index,
                                question.explanation || ''
                            ]
                        );
                    });
                }
            }
            
            // Save to localStorage
            BrowserDB.save();
            console.log('✅ Successfully saved to BrowserDB!');
            
        } catch (error) {
            console.error('❌ Error saving to BrowserDB:', error);
            throw error;
        }
    }
    checkIfTopicExists(topic, contentType) {
    try {
        const result = BrowserDB.execute(`
            SELECT 1 
            FROM topics t
            JOIN learning_content lc ON t.id = lc.topic_id  
            JOIN content_types ct ON lc.content_type_id = ct.id
            WHERE t.title = ? AND ct.name = ?
        `, [topic, contentType]);
        
        return result.length > 0;
        
    } catch (error) {
        console.error('Error checking topic existence:', error);
        return false;
    }
}
}