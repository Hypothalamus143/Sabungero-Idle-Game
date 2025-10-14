class FlashcardsManager{
    constructor(playerStats){
        this.playerStats = playerStats;
        this.init();
    }
    async init(){

    }
    showFlashcardsContent(flashcards, category) {
        let currentCard = 0;
        let showAnswer = false;
        let timerActive = true;
        let timeRemaining = 3; // 3 seconds per card
        let timerInterval;

        const updateFlashcard = () => {
            const card = flashcards[currentCard];
            
            const html = `
                <div class="flashcards-quest">
                    <h3>🎴 ${category}</h3>
                    <div class="flashcard-container">
                        <div class="flashcard ${showAnswer ? 'flipped' : ''}">
                            <div class="flashcard-front">
                                <h4>Question</h4>
                                <p>${card.question}</p>
                                <button id="show-answer" ${timerActive ? 'disabled' : ''}>
                                    ${timerActive ? `Reveal Answer in ${timeRemaining}s` : 'Show Answer'}
                                </button>
                            </div>
                            <div class="flashcard-back">
                                <h4>Answer</h4>
                                <p>${card.answer}</p>
                                ${card.explanation ? `<p class="explanation">${card.explanation}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flashcard-controls">
                        <button id="prev-card" ${currentCard === 0 ? 'disabled' : ''}>← Previous</button>
                        <span>Card ${currentCard + 1} of ${flashcards.length}</span>
                        <button id="next-card" ${!showAnswer ? 'disabled' : ''}>
                            ${currentCard === flashcards.length - 1 ? 'Complete' : 'Next →'}
                        </button>
                    </div>
                    <div class="flashcard-complete" style="display: none;">
                        <button id="mark-flashcards-completed">✅ Mark as Completed</button>
                    </div>
                </div>
            `;
            
            document.getElementById('quest-content').innerHTML = html;
            this.setupFlashcardEventListeners();
        };

        this.setupFlashcardEventListeners = () => {
            const showAnswerBtn = document.getElementById('show-answer');
            const prevBtn = document.getElementById('prev-card');
            const nextBtn = document.getElementById('next-card');
            const completeBtn = document.getElementById('mark-flashcards-completed');

            // Timer for answer reveal
            timerInterval = setInterval(() => {
                if (timerActive && timeRemaining > 0) {
                    timeRemaining--;
                    if (showAnswerBtn) {
                        showAnswerBtn.textContent = `Reveal Answer in ${timeRemaining}s`;
                    }
                    
                    if (timeRemaining === 0) {
                        timerActive = false;
                        if (showAnswerBtn) {
                            showAnswerBtn.disabled = false;
                            showAnswerBtn.textContent = 'Show Answer';
                        }
                        clearInterval(timerInterval);
                    }
                }
            }, 1000);

            // Show Answer button
            if (showAnswerBtn) {
                showAnswerBtn.onclick = () => {
                    if (!timerActive) {
                        showAnswer = true;
                        updateFlashcard();
                    }
                };
            }

            // Navigation buttons
            if (prevBtn) {
                prevBtn.onclick = () => {
                    clearInterval(timerInterval);
                    currentCard--;
                    showAnswer = false;
                    timerActive = true;
                    timeRemaining = 3;
                    updateFlashcard();
                };
            }

            if (nextBtn) {
                nextBtn.onclick = () => {
                    clearInterval(timerInterval);
                    if (showAnswer) {
                        if (currentCard < flashcards.length - 1) {
                            currentCard++;
                            showAnswer = false;
                            timerActive = true;
                            timeRemaining = 3;
                            updateFlashcard();
                        } else {
                            // Last card - show completion
                            document.querySelector('.flashcard-complete').style.display = 'block';
                            document.querySelector('.flashcard-controls').style.display = 'none';
                        }
                    }
                };
            }

            // Completion
            if (completeBtn) {
                completeBtn.onclick = () => {
                    clearInterval(timerInterval);
                    LearningSystem.completeLearningQuest(this.playerStats, 'flashcards', category);
                };
            }
        };

        updateFlashcard();
        document.getElementById('quest-modal').style.display = 'block';
    }
    renderFlashcards(flashcards, container) {
        container.innerHTML = '<h3>📚 Flashcards</h3>';
        
        if (flashcards.flashcards) {
            flashcards.flashcards.forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.style.margin = '10px 0';
                cardDiv.style.padding = '10px';
                cardDiv.style.background = '#34495e';
                cardDiv.style.borderRadius = '5px';
                
                cardDiv.innerHTML = `
                    <p><strong>Q${index + 1}:</strong> ${card.question}</p>
                    <p><strong>A:</strong> <span style="color: #3498db">${card.answer}</span></p>
                    <p><em>Difficulty: ${card.difficulty}</em></p>
                `;
                
                container.appendChild(cardDiv);
            });
        } else {
            container.innerHTML += '<p>Error loading flashcards</p>';
        }
    }
    getFlashcardsContent(category) {
        const result = BrowserDB.execute(`
            SELECT f.question, f.answer, f.explanation
            FROM flashcards f
            JOIN learning_content lc ON f.learning_content_id = lc.id
            JOIN topics t ON lc.topic_id = t.id
            JOIN content_types ct ON lc.content_type_id = ct.id
            WHERE t.title = ? AND ct.name = 'flashcards'
            ORDER BY RANDOM()
        `, [category]);
        
        if (result.length > 0) {
            return result;
        }
        throw new Error('Flashcards content not found in BrowserDB');
    }

}