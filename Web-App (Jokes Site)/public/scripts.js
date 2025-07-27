class JokeApp {
    constructor() {
        this.currentCategory = 'all';
        this.seenJokes = new Set();
        this.favorites = new Set();
        this.stats = {
            totalJokes: 0,
            jokesSeen: 0,
            favorites: 0
        };
        
        this.init();
        this.loadStats();
    }

    init() {
        this.bindEvents();
        this.updateStats();
    }

    bindEvents() {
        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectCategory(e.target.dataset.category);
            });
        });

        // Get joke button
        document.getElementById('getJokeBtn').addEventListener('click', () => {
            this.getNewJoke();
        });

        // Favorite button
        document.getElementById('favoriteBtn').addEventListener('click', () => {
            this.addToFavorites();
        });

        // Ripple effect for buttons
        document.querySelectorAll('.get-joke-btn').forEach(btn => {
            btn.addEventListener('click', this.createRipple);
        });
    }

    selectCategory(category) {
        this.currentCategory = category;
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Reset seen jokes for new category
        this.seenJokes.clear();
    }

    async getNewJoke() {
        this.showLoading(true);
        
        try {
            const response = await fetch(`/api/jokes/${this.currentCategory}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch joke');
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.displayJoke(data.joke);
                this.seenJokes.add(data.joke.id);
                this.stats.jokesSeen++;
                this.updateStats();
                this.saveStats();
            } else {
                throw new Error(data.message || 'Failed to get joke');
            }
        } catch (error) {
            console.error('Error fetching joke:', error);
            this.displayError('Failed to fetch joke. Please try again!');
        }
        
        this.showLoading(false);
    }

    displayJoke(joke) {
        const jokeText = document.getElementById('jokeText');
        const jokeCategory = document.getElementById('jokeCategory');
        const favoriteBtn = document.getElementById('favoriteBtn');
        
        jokeText.textContent = joke.text;
        jokeCategory.textContent = joke.category;
        favoriteBtn.style.display = 'inline-block';
        
        // Store current joke for favoriting
        this.currentJoke = joke;
        
        // Animate joke card
        const jokeCard = document.getElementById('jokeCard');
        jokeCard.style.transform = 'scale(0.95)';
        setTimeout(() => {
            jokeCard.style.transform = 'scale(1)';
        }, 100);
    }

    displayError(message) {
        const jokeText = document.getElementById('jokeText');
        const jokeCategory = document.getElementById('jokeCategory');
        const favoriteBtn = document.getElementById('favoriteBtn');
        
        jokeText.textContent = message;
        jokeCategory.textContent = '';
        favoriteBtn.style.display = 'none';
    }

    async addToFavorites() {
        if (!this.currentJoke) return;
        
        try {
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jokeId: this.currentJoke.id })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.favorites.add(this.currentJoke.id);
                this.stats.favorites++;
                this.updateStats();
                this.saveStats();
                this.showNotification('Added to favorites! ❤️');
            } else {
                throw new Error(data.message || 'Failed to add to favorites');
            }
        } catch (error) {
            console.error('Error adding to favorites:', error);
            this.showNotification('Failed to add to favorites', 'error');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const jokeCard = document.getElementById('jokeCard');
        
        if (show) {
            loading.style.display = 'block';
            jokeCard.style.opacity = '0.5';
        } else {
            loading.style.display = 'none';
            jokeCard.style.opacity = '1';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4ecdc4' : '#ff6b6b'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    createRipple(e) {
        const button = e.currentTarget;
        const ripple = button.querySelector('.ripple');
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        ripple.classList.add('animate');
        
        setTimeout(() => {
            ripple.classList.remove('animate');
        }, 600);
    }

    updateStats() {
        document.getElementById('totalJokes').textContent = this.stats.totalJokes;
        document.getElementById('jokesSeen').textContent = this.stats.jokesSeen;
        document.getElementById('favorites').textContent = this.stats.favorites;
    }

    saveStats() {
        localStorage.setItem('jokeAppStats', JSON.stringify({
            stats: this.stats,
            seenJokes: Array.from(this.seenJokes),
            favorites: Array.from(this.favorites)
        }));
    }

    loadStats() {
        const saved = localStorage.getItem('jokeAppStats');
        if (saved) {
            const data = JSON.parse(saved);
            this.stats = data.stats || this.stats;
            this.seenJokes = new Set(data.seenJokes || []);
            this.favorites = new Set(data.favorites || []);
        }
        
        // Fetch total jokes count
        this.fetchTotalJokesCount();
    }

    async fetchTotalJokesCount() {
        try {
            const response = await fetch('/api/stats');
            if (response.ok) {
                const data = await response.json();
                this.stats.totalJokes = data.totalJokes || 0;
                this.updateStats();
            }
        } catch (error) {
            console.error('Error fetching total jokes count:', error);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JokeApp();
});

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .ripple.animate {
        animation: ripple 0.6s linear;
    }
`;
document.head.appendChild(style);