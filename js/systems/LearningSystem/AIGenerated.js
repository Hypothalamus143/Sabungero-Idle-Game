class AIGenerated{
    constructor(){
        this.init();
    }
    async init(){

    }
    async generate(topic, contentType) {
        try {
            const apiKey = window.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error();
            }
            const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");
            const modelName = "models/gemini-2.0-flash";
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = this.createPrompt(topic, contentType);
            const result = await model.generateContent(prompt);
            const text = result?.response?.text?.();

            if (!text || !text.trim()) throw new Error("Empty Gemini response");
            let content = null;
            if (contentType === "reading") {
                content = { type: "reading", content: text };
            } 
            else if (["flashcards", "quiz"].includes(contentType)) {
                const cleaned = text.replace(/```json|```/g, "").trim();
                try {
                    const parsed = JSON.parse(cleaned);
                    parsed.type = contentType;
                    content = parsed;
                } catch (e) {
                    console.warn("⚠️ JSON parsing failed, using raw text");
                    content = { type: contentType, content: text };
                }
            } 
            else {
                content = { type: contentType, content: text };
            }

            return {
                success: true,
                exists: false,
                content: content,
                topic: topic,
                content_type: contentType,
                message: `Successfully generated ${contentType}'`
            };
        } catch (error) {
            alert("⚠️ Gemini generation failed: using dummy");
            // Fallback to dummy
            return this.dummyGenerate(topic, contentType);
        }
    }
    createPrompt(topic, contentType) {
        const prompts = {
            flashcards: `
    Create 10 educational flashcards about:
    ${topic}
    ======================================
    Return ONLY valid JSON:
    {"flashcards":[{"question":"","answer":""}]}
    `,
            quiz: `
    Create 10 multiple choice questions about:
    ${topic}.
    ======================================
    Return ONLY valid JSON:
    {"questions":[{"question":"","options":["A","B","C","D"],"correct_index":0,"explanation":""}]}
    `,
            reading: `
    Write a concise 500-word educational article about:
    ${topic}.
    `
        };
        return prompts[contentType] || `Create educational content about ${topic}`;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    parseTXT(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    async parseDOCX(file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return result.value.trim();
    }
    async parsePDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(" ");
            text += pageText + "\n";
        }
        return text.trim();
    }
    async extractTextFromFile(file) {
        if(!file)
            return "";
        const name = file.name.toLowerCase();

        if (name.endsWith(".txt")) {
            return await this.parseTXT(file);
        } else if (name.endsWith(".pdf")) {
            return await this.parsePDF(file);
        } else if (name.endsWith(".docx")) {
            return await this.parseDOCX(file);
        } else {
            throw new Error("Unsupported file type.");
        }
    }
    async dummyGenerate(topic, contentType, text) {
        alert('Error');
        return;
        let content = null;

        if (contentType === "reading") {
            const articles = [
                `${topic} is a fascinating subject that has captivated minds for generations.`,
                `Introduction to ${topic}: Understanding its principles and real-world uses.`,
                `The Complete Guide to ${topic}: Key concepts, history, and applications.`
            ];
            content = { type: "reading", content: articles[Math.floor(Math.random() * articles.length)] };
        }

        else if (contentType === "flashcards") {
            const templates = [
                `What is the main purpose of ${topic}?`,
                `Which of these is NOT related to ${topic}?`,
                `How does ${topic} benefit modern society?`,
                `What year was ${topic} first introduced?`,
                `Who is considered the founder of ${topic}?`,
                `What are the key components of ${topic}?`,
                `What problems does ${topic} solve?`,
                `Give an example of ${topic} in daily life.`,
                `Explain the importance of ${topic}.`,
                `What distinguishes ${topic} from similar ideas?`
            ];

            const flashcards = [];
            for (let i = 0; i < 10; i++) {
                flashcards.push({
                    question: templates[Math.floor(Math.random() * templates.length)],
                    answer: `Sample answer for ${topic} question ${i + 1}`,
                    explanation: `This helps understand ${topic}.`
                });
            }

            content = { type: "flashcards", flashcards: flashcards };
        }

        else if (contentType === "quiz") {
            const questions = [];
            for (let i = 0; i < 10; i++) {
                const correctIndex = 0;
                const options = [
                    `Correct answer for ${topic}`,
                    `Wrong option 1 for ${topic}`,
                    `Wrong option 2 for ${topic}`,
                    `Wrong option 3 for ${topic}`
                ];

                const correctAnswer = options[correctIndex];
                const shuffled = this.shuffle(options);
                const newIndex = shuffled.indexOf(correctAnswer);

                questions.push({
                    question: `Quiz question ${i + 1} about ${topic}?`,
                    options: shuffled,
                    correct_index: newIndex,
                    explanation: `Because it relates to ${topic}.`
                });
            }

            content = { type: "quiz", questions: questions };
        }

        return {
            success: true,
            exists: false,
            content: content,
            topic: topic,
            content_type: contentType,
            message: `Successfully generated ${contentType} content for '${topic}' (dummy)`
        };
    }
    async generateWithAI(currentContentType) {
        this.currentContentType = currentContentType;
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
        
        const confirmContinue = confirm(
            `The text "${topic}" will be used as the topic title.\n\nDo you want to continue?`
        );

        if (!confirmContinue) {
            // user clicked Cancel
            return;
        }
        const text = await this.extractTextFromFile(document.getElementById('file-input').files[0]);
        
        // Show loading state
        const modal = document.getElementById('quest-modal');
        const contentDiv = document.getElementById('quest-content');
        contentDiv.innerHTML = '<div style="color:black" class="loading">✨ Generating content with AI...</div>';
        modal.style.display = 'block';
        
        let context;
        if(text)
            context = text;
        else
            context = topic;
        const CHUNK_SIZE = 3000;
        let remaining = context;
        let part = 1;

        while (remaining.length > 0) {
            const chunk = remaining.substring(0, CHUNK_SIZE);
            remaining = remaining.substring(CHUNK_SIZE);

            const data = await this.generate(chunk, this.currentContentType);

            if (data.success) {
                // ✅ Only add “(Part 1)” if there are *more* parts
                const isSinglePart = remaining.length < 5000 && part === 1;
                const partTitle = isSinglePart
                    ? topic
                    : `${topic} (Part ${part})`;

                await this.saveToBrowserDB(data.content, partTitle, this.currentContentType);
                this.showAIGeneratedContent(topic, this.currentContentType);

            } else {
                alert('Error: ' + data.detail);
                modal.style.display = 'none';
                break;
            }

            if (remaining.length === 0) break;
            part++;
        }
            document.getElementById('file-input').value = "";
        }

    showAIGeneratedContent(topic, category) {
        const contentDiv = document.getElementById('quest-content');
        
        contentDiv.innerHTML = `
            <h3 style="color:black">✨ AI Generated: ${topic}</h3>
        `;
    }
    async checkIfTopicExists(topic, contentType) {
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
}