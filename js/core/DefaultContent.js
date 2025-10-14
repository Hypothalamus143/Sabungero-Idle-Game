class DefaultContent{
    constructor(){

    }
    defaultFlashcards() {
        const flashcardsData = {
    "flashcards": [
        {
            "question": "What is 'hello' in Cebuano?",
            "answer": "Kumusta"
        },
        {
            "question": "What does 'salamat' mean in English?",
            "answer": "Thank you"
        },
        {
            "question": "How do you say 'good morning' in Cebuano?",
            "answer": "Maayong buntag"
        },
        {
            "question": "What is the Cebuano word for 'water'?",
            "answer": "Tubig"
        },
        {
            "question": "What does 'gihigugma tika' mean?",
            "answer": "I love you"
        },
        {
            "question": "How do you say 'delicious' in Cebuano?",
            "answer": "Lami"
        },
        {
            "question": "What is 'house' in Cebuano?",
            "answer": "Balay"
        },
        {
            "question": "What does 'asa ka padulong' mean?",
            "answer": "Where are you going?"
        },
        {
            "question": "How do you say 'beautiful' in Cebuano?",
            "answer": "Gwapa (for female) / Gwapo (for male)"
        },
        {
            "question": "What is the Cebuano word for 'food'?",
            "answer": "Pagkaon"
        }
    ]
};
        return {"topic": "Basic Cebuano Vocabulary", "category":"flashcards", "content":flashcardsData};
    }

    defaultQuizzes() {
        const quizData = {
    "questions": [
        {
            "question": "What is the capital city of Cebu province?",
            "options": ["Cebu City", "Mandaue City", "Lapu-Lapu City", "Talisay City"],
            "correct_index": 0,
            "explanation": "Cebu City is the capital and largest city of Cebu province."
        },
        {
            "question": "Which famous festival in Cebu honors the Santo Niño?",
            "options": ["Sinulog Festival", "Kadaugan Festival", "Pasko sa Sugbo", "Kabanhawan Festival"],
            "correct_index": 0,
            "explanation": "The Sinulog Festival is Cebu's grandest celebration honoring the Santo Niño (Child Jesus)."
        },
        {
            "question": "What is Cebu's most famous culinary specialty?",
            "options": ["Lechon", "Adobo", "Sinigang", "Kare-kare"],
            "correct_index": 0,
            "explanation": "Cebu is famous for its lechon (roasted pig), considered by many as the best in the Philippines."
        },
        {
            "question": "Which historical event first happened in Cebu in 1521?",
            "options": ["First Catholic Mass", "First Spanish Settlement", "Battle of Mactan", "All of the above"],
            "correct_index": 3,
            "explanation": "All these historic events happened in Cebu in 1521 during Magellan's expedition."
        },
        {
            "question": "What is the name of the strait that separates Cebu from Bohol?",
            "options": ["Cebu Strait", "Bohol Strait", "Cebu-Bohol Channel", "None of the above"],
            "correct_index": 1,
            "explanation": "The Bohol Strait separates Cebu Island from Bohol Island."
        },
        {
            "question": "Which Cebuano delicacy is dried fish?",
            "options": ["Danggit", "Chicharon", "Buwad", "Both A and C"],
            "correct_index": 3,
            "explanation": "Both danggit and buwad refer to dried fish, a popular Cebuano delicacy."
        },
        {
            "question": "What does 'puso' refer to in Cebuano cuisine?",
            "options": ["Heart", "Hanging rice", "Love", "Traditional dance"],
            "correct_index": 1,
            "explanation": "Puso is hanging rice wrapped in coconut leaves, a Cebuano culinary tradition."
        },
        {
            "question": "Who was the native chieftain who defeated Magellan in 1521?",
            "options": ["Lapu-Lapu", "Rajah Humabon", "Datu Zula", "Rajah Tupas"],
            "correct_index": 0,
            "explanation": "Lapu-Lapu was the chieftain of Mactan who defeated Ferdinand Magellan in the Battle of Mactan."
        }
    ]
};
        return {"topic": "Cebuano Culture Trivia", "category":'quiz', "content":quizData};
    }

    defaultArticles() {
        const articleData = {
            "content": `Cebu, known as the Queen City of the South, is one of the most developed provinces in the Philippines. Located in the Central Visayas region, it consists of Cebu Island and 167 surrounding islands and islets. The province has a rich history dating back to pre-colonial times when it was already a thriving trading community.

    Cebu City, the provincial capital, is the oldest city in the Philippines. It was the first Spanish settlement in the country, established in 1565. The city serves as the economic, educational, and cultural center of the Visayas region. Its metropolitan area is the second most populous in the Philippines after Metro Manila.

    The history of Cebu is deeply intertwined with the arrival of Ferdinand Magellan in 1521. He planted a cross to mark the introduction of Christianity to the Philippines. The original cross is now housed in a chapel in Cebu City and is known as Magellan's Cross, one of the most famous historical landmarks in the country.

    Cebu is famous for its vibrant festivals, with the Sinulog Festival being the most prominent. Held every third Sunday of January, Sinulog honors the Santo Niño (Child Jesus). The festival features colorful street dancing, elaborate costumes, and religious processions that attract millions of visitors from around the world.

    The Cebuano language, also known as Bisaya, is the mother tongue of most Cebuanos. It is the most widely spoken language in the Visayas and Mindanao regions. While Filipino and English are also widely understood, Cebuano remains the language of daily communication and cultural expression for millions of Filipinos.

    Cebuano cuisine is renowned throughout the Philippines. The province is particularly famous for its lechon (roasted pig), which many consider the best in the country. Other local delicacies include danggit (dried rabbitfish), puso (hanging rice wrapped in coconut leaves), and otap (a flaky pastry).

    The economy of Cebu is diverse and robust. It serves as a major hub for business process outsourcing (BPO), tourism, shipping, and furniture manufacturing. The Mactan-Cebu International Airport connects the province to major domestic and international destinations, facilitating both business and tourism.

    Cebu's natural attractions are equally impressive. The province boasts beautiful white sand beaches, particularly in Bantayan Island and Malapascua Island. Moalboal is famous for its sardine run and vibrant coral reefs, while Oslob attracts tourists for its whale shark watching opportunities.

    Education is highly valued in Cebu, with numerous prestigious universities and colleges. The University of San Carlos, University of the Philippines Cebu, and University of Cebu are among the leading educational institutions. These schools attract students from all over the Visayas and Mindanao regions.

    The people of Cebu, known as Cebuanos, are recognized for their warmth, hospitality, and strong work ethic. They take pride in their rich cultural heritage while embracing modernization. This balance between tradition and progress makes Cebu one of the most dynamic and attractive provinces in the Philippines.`
        };

        return {"topic": "Introduction to Cebu", "category":'reading', "content":articleData};
    }
}