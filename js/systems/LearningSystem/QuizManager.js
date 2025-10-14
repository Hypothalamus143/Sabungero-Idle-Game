class QuizManager{
    constructor(playerStats){
        this.playerStats = playerStats;
        this.init();
    }
    async init(){

    }
    showQuizContent(questions, category) {
        let currentQuestion = 0;
        let userAnswers = [];

        const restartQuiz = () => {
            // Reload questions from backend for fresh randomization
            this.showQuizContent(this.getQuizContent(category), category);
        };

        const updateQuizDisplay = () => {
            if (currentQuestion >= questions.length) {
                showQuizResults();
                return;
            }

            const question = questions[currentQuestion];
            
            const html = `
                <div class="quiz-quest">
                    <h3>❓ ${category} Quiz</h3>
                    <div class="quiz-stats">
                        <span>Question ${currentQuestion + 1}/${questions.length}</span>
                    </div>
                    <div class="quiz-question">
                        <h4>${question.question}</h4>
                        <div class="quiz-options">
                            ${question.options.map((option, index) => `
                                <label class="quiz-option">
                                    <input type="radio" name="quiz-answer" value="${index}">
                                    <span class="option-text">${option}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="quiz-controls">
                        <button id="submit-answer">Submit Answer</button>
                    </div>
                </div>
            `;
            
            document.getElementById('quest-content').innerHTML = html;
            setupQuizEventListeners();
        };

        const setupQuizEventListeners = () => {
            const submitBtn = document.getElementById('submit-answer');
            
            if (submitBtn) {
                submitBtn.onclick = () => {
                    const selected = document.querySelector('input[name="quiz-answer"]:checked');
                    handleAnswer(selected ? parseInt(selected.value) : null);
                };
            }
        };

        const handleAnswer = (selectedIndex) => {
            const question = questions[currentQuestion];
            const isCorrect = selectedIndex === question.correct_index;
            
            userAnswers.push({
                question: question.question,
                selected: selectedIndex,
                correct: question.correct_index,
                isCorrect: isCorrect
            });

            if (!isCorrect) {
                // Instant restart with new randomization
                restartQuiz();
            } else {
                // Move to next question
                currentQuestion++;
                updateQuizDisplay();
            }
        };

        const showQuizResults = () => {
            const score = userAnswers.filter(answer => answer.isCorrect).length;
            const total = questions.length;
            
            const html = `
                <div class="quiz-results">
                    <h3>🎯 Quiz Mastered!</h3>
                    <div class="success-message">
                        <p>✅ You successfully completed the <strong>${category}</strong> quiz!</p>
                        <p>All ${total} questions answered correctly.</p>
                    </div>
                    <div class="answers-review">
                        <h4>What you learned:</h4>
                        ${userAnswers.map((answer, index) => `
                            <div class="learned-item">
                                <p><strong>${answer.question}</strong></p>
                                <p class="explanation">💡 ${questions[index].explanation}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="quiz-complete">
                        <button id="complete-quiz">🎉 Claim Reward</button>
                    </div>
                </div>
            `;
            
            document.getElementById('quest-content').innerHTML = html;
            
            document.getElementById('complete-quiz').addEventListener('click', () => {
                LearningSystem.completeLearningQuest(this.playerStats,'quiz', category);
            });
        };

        // Start the quiz
        updateQuizDisplay();
        document.getElementById('quest-modal').style.display = 'block';
    }

    renderQuiz(quiz, container) {
        container.innerHTML = '<h3>❓ Quiz</h3>';
        
        if (quiz.questions) {
            quiz.questions.forEach((question, qIndex) => {
                const questionDiv = document.createElement('div');
                questionDiv.style.margin = '15px 0';
                questionDiv.style.padding = '10px';
                questionDiv.style.background = '#34495e';
                questionDiv.style.borderRadius = '5px';
                
                let optionsHtml = '';
                question.options.forEach((option, oIndex) => {
                    optionsHtml += `
                        <div>
                            <input type="radio" name="q${qIndex}" value="${oIndex}" id="q${qIndex}o${oIndex}">
                            <label for="q${qIndex}o${oIndex}">${option}</label>
                        </div>
                    `;
                });
                
                questionDiv.innerHTML = `
                    <p><strong>Q${qIndex + 1}:</strong> ${question.question}</p>
                    ${optionsHtml}
                `;
                
                container.appendChild(questionDiv);
            });
        } else {
            container.innerHTML += '<p>Error loading quiz</p>';
        }
    }
    getQuizContent(category) {
        const result = BrowserDB.execute(`
            SELECT q.question, q.option_a, q.option_b, q.option_c, q.option_d, 
                q.correct_index, q.explanation
            FROM quiz_questions q
            JOIN learning_content lc ON q.learning_content_id = lc.id
            JOIN topics t ON lc.topic_id = t.id
            JOIN content_types ct ON lc.content_type_id = ct.id
            WHERE t.title = ? AND ct.name = 'quiz'
            ORDER BY RANDOM()
        `, [category]);
        
        if (result.length > 0) {
            const questions = result.map(row => {
                const options = [row.option_a, row.option_b, row.option_c, row.option_d];
                const correctIndex = parseInt(row.correct_index);
                const correctAnswer = options[correctIndex];
                
                const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
                const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
                
                return {
                    question: row.question,
                    options: shuffledOptions,
                    correct_index: newCorrectIndex,
                    explanation: row.explanation
                };
            });
            
            return questions;
        }
        throw new Error('Quiz content not found in BrowserDB');
    }
}