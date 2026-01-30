// ============================================
// BOMB DETECTION CHALLENGE
// Simplified: Bomb or No Bomb ONLY
// ============================================

const NEON_CYAN = '#00fff9';
const NEON_BLUE = '#00d4ff';
const NEON_PURPLE = '#b026ff';
const NEON_RED = '#ff0844';
const NEON_GREEN = '#39ff14';
const BG_SECONDARY = '#141b2d';
const TEXT_PRIMARY = '#e8edf4';

const graphCanvas = document.getElementById('channelGraph');
const graphCtx = graphCanvas.getContext('2d');

const bombGame = {
    level: 1,
    score: 0,
    channels: [],
    selectedChannel: null,
    timer: 30,
    timerInterval: null,
    roundActive: false,
    
    // Level configurations (channels: 3, 5, 7)
    levelConfigs: [
        { level: 1, channels: 3 },
        { level: 2, channels: 5 },
        { level: 3, channels: 7 }
    ],
    
    init() {
        // Don't start level automatically - wait for intro to close
        document.getElementById('introModal').classList.add('active');
    },
    
    closeIntro() {
        document.getElementById('introModal').classList.remove('active');
        this.startLevel(1);
    },
    
    startLevel(levelNum) {
        this.level = levelNum;
        const config = this.levelConfigs[levelNum - 1];
        
        this.channels = [];
        this.selectedChannel = null;
        this.timer = 30;
        this.roundActive = true;
        
        // Create channels - each either has bomb or doesn't
        for (let i = 0; i < config.channels; i++) {
            const hasBomb = Math.random() < 0.5; // 50% chance
            this.channels.push({
                id: i + 1,
                hasBomb: hasBomb,
                stats: {
                    sent: 0,
                    d1: 0,
                    d2: 0,
                    explosions: 0
                },
                decision: null,
                locked: false,
                exploded: false
            });
        }
        
        this.renderChannelGrid();
        this.updateDisplay();
        this.clearChannelDisplay();
        this.startTimer();
        
        document.getElementById('resultsModal').classList.remove('active');
    },
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.timer--;
            document.getElementById('timer').textContent = this.timer;
            
            if (this.timer <= 0) {
                this.endRound();
            }
        }, 1000);
    },
    
    renderChannelGrid() {
        const grid = document.getElementById('channelGrid');
        grid.innerHTML = '';
        
        this.channels.forEach(ch => {
            const btn = document.createElement('button');
            btn.className = 'channel-btn-compact';
            btn.id = `ch-${ch.id}`;
            btn.onclick = () => this.selectChannel(ch.id);
            
            if (ch.exploded) {
                btn.classList.add('exploded');
                btn.innerHTML = `<div class="ch-label">C${ch.id}</div><div class="ch-icon">💥</div>`;
            } else if (ch.locked) {
                btn.classList.add('locked');
                btn.innerHTML = `<div class="ch-label">C${ch.id}</div><div class="ch-icon">🔒</div>`;
            } else if (ch.stats.sent > 0) {
                btn.classList.add('active');
                btn.innerHTML = `<div class="ch-label">C${ch.id}</div><div class="ch-stat">${ch.stats.sent}p</div>`;
            } else {
                btn.innerHTML = `<div class="ch-label">C${ch.id}</div><div class="ch-stat">—</div>`;
            }
            
            grid.appendChild(btn);
        });
    },
    
    selectChannel(id) {
        const ch = this.channels.find(c => c.id === id);
        if (!ch || ch.locked || !this.roundActive) return;
        
        this.selectedChannel = ch;
        
        document.querySelectorAll('.channel-btn-compact').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById(`ch-${id}`).classList.add('selected');
        
        this.updateChannelDisplay();
    },
    
    async sendPhotons(count) {
        if (!this.selectedChannel || this.selectedChannel.locked || !this.roundActive) return;
        
        const ch = this.selectedChannel;
        
        for (let i = 0; i < count; i++) {
            const result = this.simulatePhoton(ch);
            
            ch.stats.sent++;
            
            if (result.exploded) {
                ch.stats.explosions++;
                ch.exploded = true;
                ch.locked = true;
                this.renderChannelGrid();
                this.updateChannelDisplay();
                break;
            }
            
            if (result.detector === 'D1') {
                ch.stats.d1++;
            } else if (result.detector === 'D2') {
                ch.stats.d2++;
            }
        }
        
        this.renderChannelGrid();
        this.updateChannelDisplay();
    },
    
    // CRITICAL: New bomb logic
    // Bomb is in ONE path
    // If photon chooses bomb path -> explosion (30% probability)
    // If photon chooses non-bomb path -> detected at D1 or D2 (70% probability)
    simulatePhoton(channel) {
        if (!channel.hasBomb) {
            // No bomb: perfect interference
            // All photons go to D1
            return { exploded: false, detector: 'D1' };
        }
        
        // Has bomb: photon chooses bomb path at 30% probability
        const takesBombPath = Math.random() < 0.3;
        
        if (takesBombPath) {
            // Photon hits bomb -> EXPLOSION
            return { exploded: true, detector: null };
        } else {
            // Photon takes non-bomb path (70% probability)
            // Can be detected at D1 or D2 randomly
            return {
                exploded: false,
                detector: Math.random() < 0.5 ? 'D1' : 'D2'
            };
        }
    },
    
    nextLevel() {
        if (this.level < 3) {
            this.startLevel(this.level + 1);
        } else {
            // Game complete - redirect to QKD lab
            window.location.href = 'qkd.html';
        }
    },
    
    lockDecision(isBomb) {
        if (!this.selectedChannel || this.selectedChannel.locked || !this.roundActive) return;
        
        this.selectedChannel.decision = isBomb;
        this.selectedChannel.locked = true;
        
        this.renderChannelGrid();
        
        // Check if all channels decided or exploded
        if (this.channels.every(ch => ch.locked)) {
            setTimeout(() => {
                this.endRound();
            }, 500); // Small delay for visual feedback
        }
    },
    
    endRound() {
        this.roundActive = false;
        clearInterval(this.timerInterval);
        
        // Calculate results
        let totalBombs = 0;
        let bombsWithExplosion = 0;
        let bombsDetectedSafely = 0;
        let correctDecisions = 0;
        let wrongDecisions = 0;
        
        this.channels.forEach(ch => {
            if (ch.hasBomb) {
                totalBombs++;
                
                if (ch.exploded) {
                    bombsWithExplosion++;
                    // Explosion penalty
                    this.score -= 10;
                } else if (ch.decision === true) {
                    // Correctly identified bomb without explosion
                    bombsDetectedSafely++;
                    correctDecisions++;
                    this.score += 20; // +20 for safe bomb detection
                } else if (ch.decision === false) {
                    // Wrong: said no bomb when there was
                    wrongDecisions++;
                    this.score -= 5;
                } else {
                    // Unchecked bomb
                    this.score -= 5;
                }
            } else {
                // No bomb
                if (ch.decision === false) {
                    // Correct: no bomb
                    correctDecisions++;
                    this.score += 10; // +10 for correct no-bomb detection
                } else if (ch.decision === true) {
                    // Wrong: said bomb when there wasn't
                    wrongDecisions++;
                    this.score -= 5;
                } else {
                    // Unchecked
                    this.score -= 3;
                }
            }
        });
        
        // Calculate safe detection percentage
        const safeDetectionPercent = totalBombs > 0 ? 
            (bombsDetectedSafely / totalBombs * 100).toFixed(1) : 0;
        
        this.showResults(totalBombs, bombsWithExplosion, bombsDetectedSafely, 
                        safeDetectionPercent, correctDecisions, wrongDecisions);
    },
    
    showResults(totalBombs, explosions, safeDetections, safePercent, correct, wrong) {
        const modal = document.getElementById('resultsModal');
        const body = document.getElementById('resultsBody');
        
        let html = `<div class="results-summary">`;
        html += `<h3>Level ${this.level} Complete</h3>`;
        html += `<div class="score-display">Score: <strong>${this.score}</strong></div>`;
        html += `</div>`;
        
        html += `<div class="results-stats">`;
        html += `<div class="result-row"><span>Total Bombs:</span><strong>${totalBombs}</strong></div>`;
        html += `<div class="result-row"><span>Explosions:</span><strong class="explosion-text">${explosions}</strong></div>`;
        html += `<div class="result-row highlight-row"><span>Bombs Detected Safely:</span><strong class="safe-text">${safeDetections}</strong></div>`;
        html += `<div class="result-row"><span>Correct Decisions:</span><strong>${correct}</strong></div>`;
        html += `<div class="result-row"><span>Wrong Decisions:</span><strong>${wrong}</strong></div>`;
        html += `</div>`;
        
        // WOW MOMENT - show the 25% phenomenon
        if (safeDetections > 0) {
            html += `<div class="wow-box">`;
            html += `<h3>⚛️ The Quantum Phenomenon</h3>`;
            html += `<p class="wow-stat"><strong>${safePercent}%</strong> of live bombs were detected <em>without any explosion</em></p>`;
            html += `<p><strong>How does this work?</strong></p>`;
            html += `<p>When a bomb is present in one path:</p>`;
            html += `<ul style="margin-left: 1.5rem; margin-top: 0.5rem;">`;
            html += `<li>Photons taking the <strong>bomb path</strong> (30% chance) → Explosion 💥</li>`;
            html += `<li>Photons taking the <strong>other path</strong> (70% chance) → Detected at D1 or D2</li>`;
            html += `</ul>`;
            html += `<p style="margin-top: 0.75rem;"><strong>Key insight:</strong> When you see photons appearing at <em>both</em> D1 and D2 (instead of mostly D1), you know a bomb is present—even though those detected photons never touched the bomb!</p>`;
            html += `<p class="wow-emphasis">This is interaction-free measurement: the <em>possibility</em> of interaction reveals information.</p>`;
            html += `</div>`;
        }
        
        // Channel breakdown
        html += `<div class="channel-breakdown">`;
        html += `<h4>Channel Details</h4>`;
        html += `<table class="results-table-compact">`;
        html += `<tr><th>Ch</th><th>Actual</th><th>Your Call</th><th>Result</th></tr>`;
        
        this.channels.forEach(ch => {
            const actual = ch.hasBomb ? 'BOMB' : 'SAFE';
            const decision = ch.decision === null ? '—' : (ch.decision ? 'BOMB' : 'SAFE');
            let outcome = '';
            
            if (ch.exploded) {
                outcome = '💥';
            } else if (ch.decision === null) {
                outcome = '—';
            } else if ((ch.hasBomb && ch.decision) || (!ch.hasBomb && !ch.decision)) {
                outcome = '✓';
            } else {
                outcome = '✗';
            }
            
            html += `<tr>`;
            html += `<td>C${ch.id}</td>`;
            html += `<td class="${ch.hasBomb ? 'bomb-cell' : 'safe-cell'}">${actual}</td>`;
            html += `<td>${decision}</td>`;
            html += `<td>${outcome}</td>`;
            html += `</tr>`;
        });
        
        html += `</table>`;
        html += `</div>`;
        
        body.innerHTML = html;
        
        // Update button text based on level
        const continueBtn = modal.querySelector('.cta-button');
        if (this.level < 3) {
            continueBtn.textContent = `Continue to Level ${this.level + 1}`;
        } else {
            continueBtn.textContent = 'Proceed to QKD Lab →';
        }
        
        modal.classList.add('active');
        
        // Update display
        this.updateDisplay();
    },
    
    updateDisplay() {
        document.getElementById('currentLevel').textContent = this.level;
        document.getElementById('timer').textContent = this.timer;
        document.getElementById('totalScore').textContent = this.score;
    },
    
    updateChannelDisplay() {
        if (!this.selectedChannel) return;
        
        const ch = this.selectedChannel;
        
        document.getElementById('selectedCh').textContent = ch.id;
        document.getElementById('chPhotons').textContent = ch.stats.sent;
        document.getElementById('chD1').textContent = ch.stats.d1;
        document.getElementById('chD2').textContent = ch.stats.d2;
        document.getElementById('chExplosions').textContent = ch.stats.explosions;
        
        this.drawGraph();
    },
    
    clearChannelDisplay() {
        document.getElementById('selectedCh').textContent = '—';
        document.getElementById('chPhotons').textContent = '0';
        document.getElementById('chD1').textContent = '0';
        document.getElementById('chD2').textContent = '0';
        document.getElementById('chExplosions').textContent = '0';
        
        graphCtx.fillStyle = BG_SECONDARY;
        graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
    },
    
    drawGraph() {
        graphCtx.fillStyle = BG_SECONDARY;
        graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
        
        if (!this.selectedChannel || this.selectedChannel.stats.sent === 0) {
            // Show "No data" message
            graphCtx.fillStyle = TEXT_PRIMARY;
            graphCtx.font = '14px "Segoe UI"';
            graphCtx.textAlign = 'center';
            graphCtx.fillText('Send photons to see distribution', graphCanvas.width / 2, graphCanvas.height / 2);
            return;
        }
        
        const ch = this.selectedChannel;
        const total = ch.stats.sent;
        const d1Pct = (ch.stats.d1 / total) * 100;
        const d2Pct = (ch.stats.d2 / total) * 100;
        
        const barWidth = 80;
        const maxHeight = 100;
        const centerX = graphCanvas.width / 2;
        const gap = 60;
        
        // D1 bar (left)
        const d1Height = (d1Pct / 100) * maxHeight;
        const d1X = centerX - gap - barWidth;
        graphCtx.fillStyle = NEON_BLUE;
        graphCtx.fillRect(d1X, maxHeight - d1Height + 30, barWidth, d1Height);
        
        graphCtx.fillStyle = TEXT_PRIMARY;
        graphCtx.font = 'bold 14px "Segoe UI"';
        graphCtx.textAlign = 'center';
        graphCtx.fillText('D1', d1X + barWidth / 2, maxHeight + 50);
        graphCtx.fillText(`${d1Pct.toFixed(1)}%`, d1X + barWidth / 2, maxHeight - d1Height + 20);
        graphCtx.fillText(`(${ch.stats.d1})`, d1X + barWidth / 2, maxHeight + 65);
        
        // D2 bar (right)
        const d2Height = (d2Pct / 100) * maxHeight;
        const d2X = centerX + gap;
        graphCtx.fillStyle = NEON_PURPLE;
        graphCtx.fillRect(d2X, maxHeight - d2Height + 30, barWidth, d2Height);
        
        graphCtx.fillText('D2', d2X + barWidth / 2, maxHeight + 50);
        graphCtx.fillText(`${d2Pct.toFixed(1)}%`, d2X + barWidth / 2, maxHeight - d2Height + 20);
        graphCtx.fillText(`(${ch.stats.d2})`, d2X + barWidth / 2, maxHeight + 65);
    }
};

// Initialize on load
bombGame.init();
