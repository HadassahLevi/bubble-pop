// Bubble Wrap Popper - Main Script

class BubbleWrapPopper {
    constructor() {
        this.popCount = 0;
        this.currentMode = 'classic';
        this.soundEnabled = true;
        this.currentTheme = 'default';
        this.bubbles = [];
        this.gridSize = 0;
        this.timer = null;
        this.timeRemaining = 30;
        this.isTimerRunning = false;

        // Special bubble probabilities
        this.goldenProbability = 0.05; // 5% chance
        this.rainbowProbability = 0.03; // 3% chance

        // Themes
        this.themes = [
            { id: 'default', name: 'Classic Blue', unlockAt: 0 },
            { id: 'ocean', name: 'Ocean Breeze', unlockAt: 100 },
            { id: 'sunset', name: 'Sunset Glow', unlockAt: 200 },
            { id: 'forest', name: 'Forest Green', unlockAt: 300 },
            { id: 'lavender', name: 'Lavender Dreams', unlockAt: 400 },
            { id: 'midnight', name: 'Midnight Sky', unlockAt: 500 },
            { id: 'candy', name: 'Candy Pop', unlockAt: 600 },
            { id: 'mint', name: 'Mint Fresh', unlockAt: 700 },
            { id: 'autumn', name: 'Autumn Leaves', unlockAt: 800 }
        ];

        this.milestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000];

        this.init();
    }

    init() {
        this.loadProgress();
        this.setupEventListeners();
        this.generateGrid();
        this.updateDisplay();
        this.setupAudioContext();
    }

    setupEventListeners() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeMode(e.target.dataset.mode);
            });
        });

        // Settings buttons
        document.getElementById('themeBtn').addEventListener('click', () => {
            this.openThemeModal();
        });

        document.getElementById('soundBtn').addEventListener('click', () => {
            this.toggleSound();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                this.resetProgress();
            }
        });

        // Modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeThemeModal();
        });

        document.getElementById('themeModal').addEventListener('click', (e) => {
            if (e.target.id === 'themeModal') {
                this.closeThemeModal();
            }
        });
    }

    setupAudioContext() {
        // Create Web Audio context for sound generation
        this.audioContext = null;
        
        // Initialize on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }

    playPopSound(frequency = 800) {
        if (!this.soundEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    playChainSound() {
        if (!this.soundEnabled || !this.audioContext) return;

        const frequencies = [600, 700, 800, 900];
        frequencies.forEach((freq, index) => {
            setTimeout(() => this.playPopSound(freq), index * 50);
        });
    }

    playExplosionSound() {
        if (!this.soundEnabled || !this.audioContext) return;

        const frequencies = [1000, 900, 800, 700, 600, 500];
        frequencies.forEach((freq, index) => {
            setTimeout(() => this.playPopSound(freq), index * 30);
        });
    }

    generateGrid() {
        const grid = document.getElementById('bubbleGrid');
        grid.innerHTML = '';
        this.bubbles = [];

        // Calculate grid size based on screen width
        const containerWidth = grid.offsetWidth || 800;
        const bubbleSize = window.innerWidth < 480 ? 40 : window.innerWidth < 768 ? 50 : 60;
        const gap = window.innerWidth < 480 ? 6 : window.innerWidth < 768 ? 8 : 10;
        const cols = Math.floor((containerWidth + gap) / (bubbleSize + gap));
        const rows = window.innerWidth < 768 ? 8 : 10;
        this.gridSize = cols * rows;

        for (let i = 0; i < this.gridSize; i++) {
            const bubble = this.createBubble(i);
            grid.appendChild(bubble);
            this.bubbles.push(bubble);
        }
    }

    createBubble(index) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.dataset.index = index;

        // Randomly assign special bubbles
        const rand = Math.random();
        if (rand < this.goldenProbability) {
            bubble.classList.add('golden');
            bubble.dataset.type = 'golden';
        } else if (rand < this.goldenProbability + this.rainbowProbability) {
            bubble.classList.add('rainbow');
            bubble.dataset.type = 'rainbow';
        } else {
            bubble.dataset.type = 'normal';
        }

        bubble.addEventListener('click', () => this.popBubble(bubble));

        return bubble;
    }

    popBubble(bubble) {
        if (bubble.classList.contains('popped') || bubble.classList.contains('popping')) {
            return;
        }

        // Start timer for speed mode
        if (this.currentMode === 'speed' && !this.isTimerRunning) {
            this.startTimer();
        }

        const type = bubble.dataset.type;
        
        bubble.classList.add('popping');
        
        // Play appropriate sound
        if (type === 'golden') {
            this.playChainSound();
        } else if (type === 'rainbow') {
            this.playExplosionSound();
        } else {
            const frequency = 700 + Math.random() * 400;
            this.playPopSound(frequency);
        }

        setTimeout(() => {
            bubble.classList.remove('popping');
            bubble.classList.add('popped');

            this.popCount++;
            this.updateDisplay();
            this.checkMilestones();
            this.saveProgress();

            // Handle special bubbles
            if (type === 'golden') {
                this.triggerChainReaction(bubble);
            } else if (type === 'rainbow') {
                this.triggerColorExplosion(bubble);
            }

            // Mode-specific behavior
            this.handleModeLogic(bubble);
        }, 400);
    }

    triggerChainReaction(sourceBubble) {
        const index = parseInt(sourceBubble.dataset.index);
        const grid = document.getElementById('bubbleGrid');
        const containerWidth = grid.offsetWidth;
        const bubbleSize = window.innerWidth < 480 ? 40 : window.innerWidth < 768 ? 50 : 60;
        const gap = window.innerWidth < 480 ? 6 : window.innerWidth < 768 ? 8 : 10;
        const cols = Math.floor((containerWidth + gap) / (bubbleSize + gap));

        // Get adjacent bubbles (up, down, left, right)
        const adjacentIndices = [];
        const row = Math.floor(index / cols);
        const col = index % cols;

        if (col > 0) adjacentIndices.push(index - 1); // left
        if (col < cols - 1) adjacentIndices.push(index + 1); // right
        if (row > 0) adjacentIndices.push(index - cols); // up
        if (row < Math.floor(this.bubbles.length / cols) - 1) adjacentIndices.push(index + cols); // down

        adjacentIndices.forEach((adjIndex, i) => {
            setTimeout(() => {
                const adjBubble = this.bubbles[adjIndex];
                if (adjBubble && !adjBubble.classList.contains('popped')) {
                    adjBubble.classList.add('chain-reaction');
                    setTimeout(() => {
                        this.popBubble(adjBubble);
                        adjBubble.classList.remove('chain-reaction');
                    }, 200);
                }
            }, i * 150);
        });
    }

    triggerColorExplosion(sourceBubble) {
        const index = parseInt(sourceBubble.dataset.index);
        
        // Pop bubbles in a radius
        this.bubbles.forEach((bubble, i) => {
            if (i !== index && !bubble.classList.contains('popped')) {
                const distance = Math.abs(i - index);
                if (distance <= 5) { // Nearby bubbles
                    setTimeout(() => {
                        bubble.classList.add('exploding');
                        setTimeout(() => {
                            this.popBubble(bubble);
                            bubble.classList.remove('exploding');
                        }, 200);
                    }, Math.random() * 500);
                }
            }
        });
    }

    handleModeLogic(bubble) {
        switch (this.currentMode) {
            case 'classic':
                // Check if all bubbles are popped
                const allPopped = this.bubbles.every(b => b.classList.contains('popped'));
                if (allPopped) {
                    setTimeout(() => {
                        this.refillSheet();
                    }, 1000);
                }
                break;

            case 'zen':
                // Regenerate bubble after a delay
                setTimeout(() => {
                    this.regenerateBubble(bubble);
                }, 2000);
                break;

            case 'speed':
                // Timer already running
                break;
        }
    }

    refillSheet() {
        this.bubbles.forEach(bubble => {
            bubble.classList.remove('popped', 'popping');
            const rand = Math.random();
            
            // Remove old special classes
            bubble.classList.remove('golden', 'rainbow');
            
            // Reassign special bubbles
            if (rand < this.goldenProbability) {
                bubble.classList.add('golden');
                bubble.dataset.type = 'golden';
            } else if (rand < this.goldenProbability + this.rainbowProbability) {
                bubble.classList.add('rainbow');
                bubble.dataset.type = 'rainbow';
            } else {
                bubble.dataset.type = 'normal';
            }
        });
    }

    regenerateBubble(bubble) {
        if (this.currentMode !== 'zen') return;

        bubble.classList.remove('popped', 'popping');
        const rand = Math.random();
        
        // Remove old special classes
        bubble.classList.remove('golden', 'rainbow');
        
        // Reassign special bubble type
        if (rand < this.goldenProbability) {
            bubble.classList.add('golden');
            bubble.dataset.type = 'golden';
        } else if (rand < this.goldenProbability + this.rainbowProbability) {
            bubble.classList.add('rainbow');
            bubble.dataset.type = 'rainbow';
        } else {
            bubble.dataset.type = 'normal';
        }
    }

    startTimer() {
        this.isTimerRunning = true;
        this.timeRemaining = 30;
        document.getElementById('timerDisplay').style.display = 'flex';
        this.updateTimerDisplay();

        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.endSpeedChallenge();
            }
        }, 1000);
    }

    endSpeedChallenge() {
        clearInterval(this.timer);
        this.isTimerRunning = false;
        
        const poppedCount = this.bubbles.filter(b => b.classList.contains('popped')).length;
        
        this.showMilestone(`Speed Challenge Complete! 🎉\nYou popped ${poppedCount} bubbles in 30 seconds!`);
        
        // Disable all bubbles
        this.bubbles.forEach(bubble => {
            if (!bubble.classList.contains('popped')) {
                bubble.style.pointerEvents = 'none';
                bubble.style.opacity = '0.5';
            }
        });

        // Reset after a delay
        setTimeout(() => {
            this.changeMode('speed');
        }, 3000);
    }

    updateTimerDisplay() {
        document.getElementById('timerValue').textContent = this.timeRemaining;
    }

    changeMode(mode) {
        // Stop any running timer
        if (this.timer) {
            clearInterval(this.timer);
            this.isTimerRunning = false;
        }

        this.currentMode = mode;

        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Hide timer for non-speed modes
        if (mode !== 'speed') {
            document.getElementById('timerDisplay').style.display = 'none';
        }

        // Regenerate grid
        this.generateGrid();
    }

    checkMilestones() {
        this.milestones.forEach(milestone => {
            if (this.popCount === milestone) {
                this.showMilestone(`🎉 ${milestone} Pops Milestone! 🎉`);
            }
        });

        // Check for theme unlocks
        const lastUnlockedTheme = this.themes.filter(t => this.popCount >= t.unlockAt).pop();
        if (lastUnlockedTheme && this.popCount === lastUnlockedTheme.unlockAt && lastUnlockedTheme.unlockAt > 0) {
            this.showMilestone(`🎨 New Theme Unlocked: ${lastUnlockedTheme.name}! 🎨`);
        }
    }

    showMilestone(text) {
        const alert = document.getElementById('milestoneAlert');
        const textEl = document.getElementById('milestoneText');
        
        textEl.textContent = text;
        alert.classList.add('show');

        setTimeout(() => {
            alert.classList.remove('show');
        }, 3000);
    }

    updateDisplay() {
        document.getElementById('popCount').textContent = this.popCount;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundBtn');
        btn.textContent = this.soundEnabled ? '🔊' : '🔇';
        this.saveProgress();
    }

    openThemeModal() {
        const modal = document.getElementById('themeModal');
        const themeList = document.getElementById('themeList');
        
        themeList.innerHTML = '';
        
        this.themes.forEach(theme => {
            const item = document.createElement('div');
            item.className = 'theme-item';
            
            const unlocked = this.popCount >= theme.unlockAt;
            
            if (!unlocked) {
                item.classList.add('locked');
            }
            
            if (this.currentTheme === theme.id) {
                item.classList.add('active');
            }

            const name = document.createElement('span');
            name.textContent = theme.name;
            item.appendChild(name);

            const status = document.createElement('span');
            if (unlocked) {
                status.textContent = '✓';
            } else {
                status.textContent = `🔒 ${theme.unlockAt} pops`;
            }
            item.appendChild(status);

            if (unlocked) {
                item.addEventListener('click', () => {
                    this.applyTheme(theme.id);
                    document.querySelectorAll('.theme-item').forEach(t => t.classList.remove('active'));
                    item.classList.add('active');
                });
            }

            themeList.appendChild(item);
        });

        modal.classList.add('active');
    }

    closeThemeModal() {
        document.getElementById('themeModal').classList.remove('active');
    }

    applyTheme(themeId) {
        // Remove all theme classes
        this.themes.forEach(theme => {
            document.body.classList.remove(`theme-${theme.id}`);
        });

        // Apply new theme
        if (themeId !== 'default') {
            document.body.classList.add(`theme-${themeId}`);
        }

        this.currentTheme = themeId;
        this.saveProgress();
    }

    saveProgress() {
        const data = {
            popCount: this.popCount,
            soundEnabled: this.soundEnabled,
            currentTheme: this.currentTheme
        };
        localStorage.setItem('bubbleWrapProgress', JSON.stringify(data));
    }

    loadProgress() {
        const saved = localStorage.getItem('bubbleWrapProgress');
        if (saved) {
            const data = JSON.parse(saved);
            this.popCount = data.popCount || 0;
            this.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
            this.currentTheme = data.currentTheme || 'default';

            // Apply loaded theme
            this.applyTheme(this.currentTheme);

            // Update sound button
            document.getElementById('soundBtn').textContent = this.soundEnabled ? '🔊' : '🔇';
        }
    }

    resetProgress() {
        this.popCount = 0;
        this.currentTheme = 'default';
        this.soundEnabled = true;
        
        localStorage.removeItem('bubbleWrapProgress');
        
        this.applyTheme('default');
        document.getElementById('soundBtn').textContent = '🔊';
        this.updateDisplay();
        this.generateGrid();
        
        this.showMilestone('Progress Reset! 🔄');
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BubbleWrapPopper();
});
