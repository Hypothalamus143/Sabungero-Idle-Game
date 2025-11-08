// js/core/BrowserDB.js
class BrowserDB {
    static db = null;
    
    static async init() {
        try {
            // Initialize SQL.js
            const SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });
            
            this.db = new SQL.Database();
            await this.createTables();
            console.log('✅ SQL.js database ready with empty tables!');
            
        } catch (error) {
            console.error('Failed to initialize SQL.js:', error);
            // Fallback - continue without database
        }
    }
    
    static exportDatabase() {
        const binaryArray = this.db.export();
        const blob = new Blob([binaryArray], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sabungero_database.sqlite';
        a.click();
        
        console.log('💾 Database exported as sabungero_database.sqlite');
    }

    static async createTables() {
        // Your exact table schema from backend
        this.db.run(`

            CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL UNIQUE,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS content_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
            
            CREATE TABLE IF NOT EXISTS learning_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic_id INTEGER,
                content_type_id INTEGER,
                content TEXT,
                FOREIGN KEY (topic_id) REFERENCES topics(id),
                FOREIGN KEY (content_type_id) REFERENCES content_types(id),
                UNIQUE(topic_id, content_type_id)
            );
            
            CREATE TABLE IF NOT EXISTS flashcards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                learning_content_id INTEGER,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                explanation TEXT,
                FOREIGN KEY (learning_content_id) REFERENCES learning_content(id)
            );
            
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                learning_content_id INTEGER,
                question TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_index INTEGER NOT NULL,
                explanation TEXT,
                FOREIGN KEY (learning_content_id) REFERENCES learning_content(id)
            );
        `);
        
        this.db.run(`
            CREATE TABLE IF NOT EXISTS player_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level INTEGER DEFAULT 1,
                multiplier REAL DEFAULT 1.0,
                rooster_multiplier REAL DEFAULT 1.0,
                experience INTEGER DEFAULT 0,
                exp_needed INTEGER DEFAULT 100,
                mmr INTEGER DEFAULT 1000,
                win_streak INTEGER DEFAULT 0,
                drops TEXT DEFAULT '{}',
                appearance_json TEXT DEFAULT '{}',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Insert default content types (same as your backend)
        this.db.run(`
            INSERT OR IGNORE INTO content_types (id, name) VALUES 
            (1, 'reading'),
            (2, 'flashcards'), 
            (3, 'quiz')
        `);
    }
    
    // Generic query executor
    static execute(sql, params = []) {
        // ✅ ADD NULL CHECK
        try {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                const result = this.db.exec(sql, params);
                return this.formatResult(result);
            } else {
                this.db.run(sql, params);
                return { changes: this.db.getRowsModified() };
            }
        } catch (error) {
            console.error('SQL Error:', error.message, 'Query:', sql);
            throw error;
        }
    }
    
    static formatResult(result) {
        if (!result.length) return [];
        
        const columns = result[0].columns;
        const values = result[0].values;
        
        return values.map(row => {
            const obj = {};
            columns.forEach((col, index) => {
                obj[col] = row[index];
            });
            return obj;
        });
    }
    
    // Optional: Save/load database to localStorage
    static save() {
        try {
            const data = this.db.export();
            localStorage.setItem('sabungero_sql_db', JSON.stringify(Array.from(data)));
        } catch (error) {
            console.warn('Could not save database:', error);
        }
    }
    
    static load() {
        try {
            const saved = localStorage.getItem('sabungero_sql_db');
            if (saved && this.db) {
                const data = new Uint8Array(JSON.parse(saved));
                // Import the saved data into the existing database
                this.db.close();
                this.db = new this.db.constructor(data);
                try{
                    console.log(this.execute('SELECT drops FROM player_stats WHERE id = 1'));
                }
                catch(e){
                    this.execute(`ALTER TABLE player_stats ADD COLUMN drops JSON DEFAULT '{}'`);
                    this.execute("ALTER TABLE player_stats DROP COLUMN skills_json");
                }
                try{
                    console.log(this.execute('SELECT rooster_multiplier FROM player_stats WHERE id = 1'));
                }
                catch(e){
                    this.execute(`ALTER TABLE player_stats ADD COLUMN rooster_multiplier REAL DEFAULT 1.0`);
                }
                console.log('✅ Database loaded from localStorage!');
            }
        } catch (error) {
            console.warn('Could not load database:', error);
        }
    }
    static savePlayerStats(stats) {
        this.execute(`
            INSERT OR REPLACE INTO player_stats 
            (id, level, multiplier,rooster_multiplier, experience, exp_needed, mmr, win_streak, drops, appearance_json)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            stats.level,
            stats.multiplier, 
            stats.rooster_multiplier, 
            stats.experience,
            stats.expNeeded || 100,
            stats.ranking?.mmr || 1000,
            stats.ranking?.win_streak || 0,
            JSON.stringify(stats.drops || {}),
            JSON.stringify(stats.appearance || {})
        ]);
        this.save(); // Persist to localStorage
}

    static loadPlayerStats() {
        const result = this.execute('SELECT * FROM player_stats WHERE id = 1');
        if (result.length > 0) {
            const row = result[0];
            const rankInfo = this.getRankFromMMR(row.mmr);
            
            return {
                level: row.level,
                multiplier: row.multiplier,
                rooster_multiplier: row.rooster_multiplier,
                experience: row.experience,
                expNeeded: row.exp_needed,
                drops: JSON.parse(row.drops), 
                ranking: {
                    mmr: row.mmr,
                    rank: rankInfo.name,
                    rank_tier: rankInfo.tier,
                    win_streak: row.win_streak
                },
                appearance: JSON.parse(row.appearance_json)
            };
        }
        return null; // No saved stats
    }
    static getRankFromMMR(mmr) {
        const RANKING_TIERS = [
            {"name": "Novice", "min_mmr": 0, "tier": 0},
            {"name": "Bronze", "min_mmr": 500, "tier": 1},
            {"name": "Silver", "min_mmr": 1000, "tier": 2},
            {"name": "Gold", "min_mmr": 1500, "tier": 3},
            {"name": "Platinum", "min_mmr": 2000, "tier": 4},
            {"name": "Diamond", "min_mmr": 2500, "tier": 5},
            {"name": "Master", "min_mmr": 3000, "tier": 6},
            {"name": "Grand Sabungero", "min_mmr": 3500, "tier": 7}
        ];
        
        // Find the highest tier the MMR qualifies for
        for (let i = RANKING_TIERS.length - 1; i >= 0; i--) {
            if (mmr >= RANKING_TIERS[i].min_mmr) {
                return RANKING_TIERS[i];
            }
        }
        
        // Fallback to Novice
        return RANKING_TIERS[0];
    }
    static generateOpponent(playerMMR) {
        console.log(playerMMR);
        // Calculate opponent MMR with some variance
        const mmrVariance = Math.floor(Math.random() * 601) - 300; // -300 to +300
        const opponentMMR = Math.max(100, playerMMR + mmrVariance);
        
        // Get opponent rank from MMR
        const opponentRank = this.getRankFromMMR(opponentMMR);
        
        // Calculate level based on MMR (example: 100 MMR = level 1, 2000 MMR = level 20)
        const levelScale = 0.01; // Adjust this to control level progression
        const opponentLevel = Math.max(1, Math.floor(opponentMMR * levelScale));
        const opponentHp = opponentLevel * 100;
        const opponentDamage = opponentLevel;
        
        // Random avatar and accessory, index-based glow
        const visualData = {
            avatarId: Math.floor(Math.random() * 4) + 1,      // Random 1-4
            accessoryId: Math.floor(Math.random() * 4),       // Random 0-3
            glowId: opponentRank.tier                         // Index-based glow (0-7)
        };
        
        return {
            level: opponentLevel,
            hp: opponentHp,
            max_hp: opponentHp,
            damage: opponentDamage,
            name: `Level ${opponentLevel} Rooster`,
            mmr: opponentMMR,
            rank: opponentRank.name,
            appearance: visualData
        };
    }
    static async reset(){
        await this.init();
        this.save();
        console.log('🔍 AFTER RESET - Player stats:', this.loadPlayerStats());
        location.reload();
    }
}