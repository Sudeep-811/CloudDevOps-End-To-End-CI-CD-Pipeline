const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('./jokes.db');

// Initialize database tables
db.serialize(() => {
    // Jokes table
    db.run(`
        CREATE TABLE IF NOT EXISTS jokes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Favorites table
    db.run(`
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            joke_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (joke_id) REFERENCES jokes (id)
        )
    `);

    // User sessions table (for tracking seen jokes)
    db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            joke_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (joke_id) REFERENCES jokes (id)
        )
    `);

    // Insert sample jokes if table is empty
    db.get("SELECT COUNT(*) as count FROM jokes", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        
        if (row.count === 0) {
            insertSampleJokes();
        }
    });
});

// Sample jokes data
function insertSampleJokes() {
    const sampleJokes = [
        // Programming jokes
        { text: "Why do programmers prefer dark mode? Because light attracts bugs!", category: "programming" },
        { text: "How many programmers does it take to change a light bulb? None, that's a hardware problem!", category: "programming" },
        { text: "Why don't programmers like nature? It has too many bugs!", category: "programming" },
        { text: "A SQL query goes into a bar, walks up to two tables and asks... 'Can I join you?'", category: "programming" },
        { text: "Why did the programmer quit his job? He didn't get arrays!", category: "programming" },
        { text: "What's a programmer's favorite hangout place? Foo Bar!", category: "programming" },
        { text: "Why do Java developers wear glasses? Because they can't C#!", category: "programming" },
        { text: "How do you comfort a JavaScript bug? You console it!", category: "programming" },

        // Dad jokes
        { text: "I'm reading a book about anti-gravity. It's impossible to put down!", category: "dad" },
        { text: "Why don't scientists trust atoms? Because they make up everything!", category: "dad" },
        { text: "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!", category: "dad" },
        { text: "Why don't eggs tell jokes? They'd crack each other up!", category: "dad" },
        { text: "I only know 25 letters of the alphabet. I don't know y!", category: "dad" },
        { text: "What do you call a fake noodle? An impasta!", category: "dad" },
        { text: "Why did the scarecrow win an award? He was outstanding in his field!", category: "dad" },
        { text: "What do you call a bear with no teeth? A gummy bear!", category: "dad" },

        // Puns
        { text: "I wondered why the baseball kept getting bigger. Then it hit me!", category: "puns" },
        { text: "The graveyard is so crowded, people are dying to get in!", category: "puns" },
        { text: "I used to hate facial hair, but then it grew on me!", category: "puns" },
        { text: "What's the best thing about Switzerland? I don't know, but the flag is a big plus!", category: "puns" },
        { text: "I'm reading a book on the history of glue – can't put it down!", category: "puns" },
        { text: "Did you hear about the guy who invented the knock-knock joke? He won the 'No-bell' prize!", category: "puns" },
        { text: "I used to be a banker, but I lost interest!", category: "puns" },
        { text: "What do you call a sleeping bull? A bulldozer!", category: "puns" },

        // One-liners
        { text: "I told my wife she was drawing her eyebrows too high. She looked surprised!", category: "oneliners" },
        { text: "My therapist says I have a preoccupation with vengeance. We'll see about that!", category: "oneliners" },
        { text: "I haven't slept for ten days, because that would be too long!", category: "oneliners" },
        { text: "I'm great at multitasking. I can waste time, be unproductive, and procrastinate all at once!", category: "oneliners" },
        { text: "The early bird might get the worm, but the second mouse gets the cheese!", category: "oneliners" },
        { text: "I'm not arguing, I'm just explaining why I'm right!", category: "oneliners" },
        { text: "If you think nobody cares about you, try missing a couple of payments!", category: "oneliners" },
        { text: "Behind every great man is a woman rolling her eyes!", category: "oneliners" },

        // Knock-knock jokes
        { text: "Knock knock! Who's there? Interrupting cow. Interrupting cow w-- MOOOOO!", category: "knock-knock" },
        { text: "Knock knock! Who's there? Lettuce. Lettuce who? Lettuce in, it's cold out here!", category: "knock-knock" },
        { text: "Knock knock! Who's there? Boo. Boo who? Don't cry, it's just a joke!", category: "knock-knock" },
        { text: "Knock knock! Who's there? Orange. Orange who? Orange you glad I didn't say banana?", category: "knock-knock" },
        { text: "Knock knock! Who's there? Dishes. Dishes who? Dishes a very bad joke!", category: "knock-knock" },
        { text: "Knock knock! Who's there? Tank. Tank who? You're welcome!", category: "knock-knock" },
        { text: "Knock knock! Who's there? Candice. Candice who? Candice joke get any worse?", category: "knock-knock" },
        { text: "Knock knock! Who's there? Howard. Howard who? Howard you like to hear another joke?", category: "knock-knock" }
    ];

    const stmt = db.prepare("INSERT INTO jokes (text, category) VALUES (?, ?)");
    
    sampleJokes.forEach(joke => {
        stmt.run(joke.text, joke.category);
    });
    
    stmt.finalize();
    console.log('Sample jokes inserted successfully!');
}

// API Routes

// Get a random joke by category
app.get('/api/jokes/:category', (req, res) => {
    const category = req.params.category;
    const sessionId = req.get('X-Session-ID') || 'default';
    
    let query = `
        SELECT j.* FROM jokes j
        WHERE j.id NOT IN (
            SELECT us.joke_id FROM user_sessions us 
            WHERE us.session_id = ?
        )
    `;
    
    let params = [sessionId];
    
    if (category !== 'all') {
        query += ' AND j.category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY RANDOM() LIMIT 1';
    
    db.get(query, params, (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (!row) {
            // If no unseen jokes, reset session and get a random joke
            db.run('DELETE FROM user_sessions WHERE session_id = ?', [sessionId], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                
                // Get a random joke
                let resetQuery = 'SELECT * FROM jokes';
                let resetParams = [];
                
                if (category !== 'all') {
                    resetQuery += ' WHERE category = ?';
                    resetParams.push(category);
                }
                
                resetQuery += ' ORDER BY RANDOM() LIMIT 1';
                
                db.get(resetQuery, resetParams, (err, resetRow) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ success: false, message: 'Database error' });
                    }
                    
                    if (resetRow) {
                        // Mark as seen
                        db.run('INSERT INTO user_sessions (session_id, joke_id) VALUES (?, ?)', 
                               [sessionId, resetRow.id]);
                        
                        res.json({ success: true, joke: resetRow });
                    } else {
                        res.status(404).json({ success: false, message: 'No jokes found' });
                    }
                });
            });
        } else {
            // Mark joke as seen
            db.run('INSERT INTO user_sessions (session_id, joke_id) VALUES (?, ?)', 
                   [sessionId, row.id]);
            
            res.json({ success: true, joke: row });
        }
    });
});

// Add joke to favorites
app.post('/api/favorites', (req, res) => {
    const { jokeId } = req.body;
    
    if (!jokeId) {
        return res.status(400).json({ success: false, message: 'Joke ID is required' });
    }
    
    // Check if already in favorites
    db.get('SELECT * FROM favorites WHERE joke_id = ?', [jokeId], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (row) {
            return res.json({ success: false, message: 'Joke already in favorites' });
        }
        
        // Add to favorites
        db.run('INSERT INTO favorites (joke_id) VALUES (?)', [jokeId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            res.json({ success: true, message: 'Added to favorites' });
        });
    });
});

// Get favorites
app.get('/api/favorites', (req, res) => {
    const query = `
        SELECT j.*, f.created_at as favorited_at 
        FROM jokes j 
        JOIN favorites f ON j.id = f.joke_id 
        ORDER BY f.created_at DESC
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.json({ success: true, favorites: rows });
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const queries = {
        totalJokes: 'SELECT COUNT(*) as count FROM jokes',
        totalFavorites: 'SELECT COUNT(*) as count FROM favorites',
        jokesByCategory: `
            SELECT category, COUNT(*) as count 
            FROM jokes 
            GROUP BY category 
            ORDER BY count DESC
        `
    };

    const stats = {};

    db.get(queries.totalJokes, [], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to fetch total jokes' });
        }
        stats.totalJokes = row.count;

        db.get(queries.totalFavorites, [], (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Failed to fetch total favorites' });
            }
            stats.totalFavorites = row.count;

            db.all(queries.jokesByCategory, [], (err, rows) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: 'Failed to fetch jokes by category' });
                }
                stats.jokesByCategory = rows;
                res.status(200).json({ success: true, ...stats });
        });
    });
});

    
});

// Add new joke (admin endpoint)
app.post('/api/jokes', (req, res) => {
    const { text, category } = req.body;
    
    if (!text || !category) {
        return res.status(400).json({ 
            success: false, 
            message: 'Text and category are required' 
        });
    }
    
    db.run('INSERT INTO jokes (text, category) VALUES (?, ?)', 
           [text, category], 
           function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.json({
            success: true,
            joke: {
                id: this.lastID,
                text,
                category
            }
        });
    });
});

// Get all jokes (admin endpoint)
app.get('/api/jokes', (req, res) => {
    const category = req.query.category;
    let query = 'SELECT * FROM jokes';
    let params = [];
    
    if (category && category !== 'all') {
        query += ' WHERE category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.json({ success: true, jokes: rows });
    });
});

// Delete joke (admin endpoint)
app.delete('/api/jokes/:id', (req, res) => {
    const jokeId = req.params.id;
    
    db.run('DELETE FROM jokes WHERE id = ?', [jokeId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Joke not found' });
        }
        
        res.json({ success: true, message: 'Joke deleted successfully' });
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎭 JokeMaster server is running on port ${PORT}`);
    console.log(`📖 App is live! Access it via public IP / ALB DNS`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('📦 Database connection closed.');
        }
        process.exit(0);
    });
});