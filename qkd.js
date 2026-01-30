// ============================================
// QKD LAB - Eavesdropping Detection
// 10 bits × 10 photons = 100 total
// ============================================

const NEON_CYAN = '#00fff9';
const NEON_BLUE = '#00d4ff';
const NEON_PURPLE = '#b026ff';
const NEON_RED = '#ff0844';
const NEON_GREEN = '#39ff14';
const BG_SECONDARY = '#141b2d';
const TEXT_PRIMARY = '#e8edf4';

const txCanvas = document.getElementById('transmissionCanvas');
const txCtx = txCanvas ? txCanvas.getContext('2d') : null;

const qkdLab = {
    // LOCKED PARAMETERS
    NUM_BITS: 10,
    PHOTONS_PER_BIT: 10,
    TOTAL_PHOTONS: 100,
    
    // Alice's data (hidden from user initially)
    aliceBits: [],
    
    // Eve's presence and behavior
    evePresent: false,
    eveTargetPhotons: [], // Which photon indices Eve measures
    
    // Bob's received data
    bobBits: [], // Array of 10 objects, each with photon results
    
    // User's guess
    eveGuess: null,
    
    init() {
        // Generate Alice's random 10-bit key
        this.aliceBits = [];
        for (let i = 0; i < this.NUM_BITS; i++) {
            this.aliceBits.push(Math.random() < 0.5 ? 0 : 1);
        }
        
        // Determine if Eve is present (50% chance)
        this.evePresent = Math.random() < 0.5;
        
        // If Eve present, she randomly selects 1-3 photons from EACH bit's 10 photons
        this.eveTargetPhotons = [];
        if (this.evePresent) {
            for (let bit = 0; bit < this.NUM_BITS; bit++) {
                const numToMeasure = 1 + Math.floor(Math.random() * 3); // 1-3 photons
                const indices = [];
                
                // Randomly select which photons in this bit Eve measures
                while (indices.length < numToMeasure) {
                    const idx = Math.floor(Math.random() * this.PHOTONS_PER_BIT);
                    if (!indices.includes(idx)) {
                        indices.push(idx);
                    }
                }
                
                this.eveTargetPhotons.push(indices);
            }
        } else {
            // No Eve - empty arrays
            for (let bit = 0; bit < this.NUM_BITS; bit++) {
                this.eveTargetPhotons.push([]);
            }
        }
        
        // Initialize Bob's data structure
        this.bobBits = [];
        for (let i = 0; i < this.NUM_BITS; i++) {
            this.bobBits.push({
                photons: [], // Array of 10 results: 'D1', 'D2', or 'LOST'
                d1Count: 0,
                d2Count: 0,
                lostCount: 0
            });
        }
        
        this.eveGuess = null;
        
        // Show transmission phase
        document.getElementById('transmissionPhase').style.display = 'block';
        document.getElementById('analysisPhase').style.display = 'none';
        
        // Start transmission animation
        this.startTransmission();
    },
    
    async startTransmission() {
        let totalPhotonsSent = 0;
        let totalD1 = 0;
        let totalD2 = 0;
        let totalLost = 0;
        
        // Transmit each bit sequentially
        for (let bitIdx = 0; bitIdx < this.NUM_BITS; bitIdx++) {
            document.getElementById('currentBit').textContent = bitIdx + 1;
            
            const aliceBit = this.aliceBits[bitIdx];
            const bobBit = this.bobBits[bitIdx];
            
            // Send 10 photons for this bit
            for (let photonIdx = 0; photonIdx < this.PHOTONS_PER_BIT; photonIdx++) {
                const eveInterferes = this.eveTargetPhotons[bitIdx].includes(photonIdx);
                const result = this.simulatePhoton(aliceBit, eveInterferes);
                
                bobBit.photons.push(result);
                
                if (result === 'D1') {
                    bobBit.d1Count++;
                    totalD1++;
                } else if (result === 'D2') {
                    bobBit.d2Count++;
                    totalD2++;
                } else {
                    bobBit.lostCount++;
                    totalLost++;
                }
                
                totalPhotonsSent++;
                
                // Update transmission display
                document.getElementById('photonsSent').textContent = totalPhotonsSent;
                document.getElementById('txD1').textContent = totalD1;
                document.getElementById('txD2').textContent = totalD2;
                document.getElementById('txLost').textContent = totalLost;
                
                // Animate photon burst
                await this.animatePhoton();
            }
            
            // Brief pause between bits
            await this.sleep(200);
        }
        
        // Transmission complete - switch to analysis phase
        await this.sleep(500);
        this.showAnalysisPhase();
    },
    
    // Simulate single photon transmission
    simulatePhoton(aliceBit, eveInterferes) {
        if (aliceBit === 0 && !eveInterferes) {
            // Perfect interference: all go to D1
            if (Math.random() < 0.2) {
                return 'LOST';
            }
            return 'D1';
        }
        
        if (aliceBit === 0 && eveInterferes) {
            // Eve measures: 50% lost, 50% random D1/D2
            if (Math.random() < 0.5) {
                return 'LOST';
            }
            return Math.random() < 0.5 ? 'D1' : 'D2';
        }
        
        if (aliceBit === 1 && !eveInterferes) {
            // Alice's encoding causes 50% loss
            if (Math.random() < 0.5) {
                return 'LOST';
            }
            return Math.random() < 0.5 ? 'D1' : 'D2';
        }
        
        if (aliceBit === 1 && eveInterferes) {
            // Both Alice encoding and Eve: higher loss
            // 50% Alice loss
            if (Math.random() < 0.5) {
                return 'LOST';
            }
            // 50% Eve loss
            if (Math.random() < 0.5) {
                return 'LOST';
            }
            return Math.random() < 0.5 ? 'D1' : 'D2';
        }
        
        return 'LOST';
    },
    
    async animatePhoton() {
        return new Promise(resolve => setTimeout(resolve, 30));
    },
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    showAnalysisPhase() {
        document.getElementById('transmissionPhase').style.display = 'none';
        document.getElementById('analysisPhase').style.display = 'block';
        
        this.renderAliceBits();
        this.renderBobBits();
        this.updateAnalysisStats();
    },
    
    renderAliceBits() {
        const container = document.getElementById('aliceBits');
        container.innerHTML = '';
        
        this.aliceBits.forEach((bit, idx) => {
            const bitCard = document.createElement('div');
            bitCard.className = `bit-card alice-bit bit-${bit}`;
            bitCard.innerHTML = `
                <div class="bit-label">Bit ${idx + 1}</div>
                <div class="bit-value">${bit}</div>
            `;
            container.appendChild(bitCard);
        });
    },
    
    renderBobBits() {
        const container = document.getElementById('bobBits');
        container.innerHTML = '';
        
        this.bobBits.forEach((bobBit, idx) => {
            const bitCard = document.createElement('div');
            bitCard.className = 'bit-card bob-bit';
            bitCard.onclick = () => this.inspectBit(idx);
            
            // Determine inferred bit (majority of detected photons)
            const inferredBit = bobBit.d1Count > bobBit.d2Count ? 0 : 
                               bobBit.d2Count > bobBit.d1Count ? 1 : '?';
            
            bitCard.innerHTML = `
                <div class="bit-label">Bit ${idx + 1}</div>
                <div class="bit-value">${inferredBit}</div>
                <div class="bit-stats">${bobBit.d1Count + bobBit.d2Count}/10</div>
            `;
            container.appendChild(bitCard);
        });
    },
    
    inspectBit(bitIdx) {
        const bobBit = this.bobBits[bitIdx];
        
        document.getElementById('inspectedBitNum').textContent = bitIdx + 1;
        document.getElementById('bitD1').textContent = bobBit.d1Count;
        document.getElementById('bitD2').textContent = bobBit.d2Count;
        document.getElementById('bitLost').textContent = bobBit.lostCount;
        
        // Display photon results
        const photonDisplay = document.getElementById('photonDisplay');
        photonDisplay.innerHTML = '';
        
        bobBit.photons.forEach((result, idx) => {
            const photon = document.createElement('div');
            photon.className = 'photon-result';
            
            if (result === 'D1') {
                photon.classList.add('d1');
                photon.textContent = 'D1';
            } else if (result === 'D2') {
                photon.classList.add('d2');
                photon.textContent = 'D2';
            } else {
                photon.classList.add('lost');
                photon.textContent = '—';
            }
            
            photonDisplay.appendChild(photon);
        });
        
        // Highlight selected bit
        document.querySelectorAll('.bob-bit').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelectorAll('.bob-bit')[bitIdx].classList.add('selected');
    },
    
    updateAnalysisStats() {
        let totalLost = 0;
        let disturbedBits = 0;
        
        this.bobBits.forEach((bobBit, idx) => {
            totalLost += bobBit.lostCount;
            
            // Check if bit appears disturbed
            // For bit 0: expect D1 dominant
            // For bit 1: expect ~50% loss
            const aliceBit = this.aliceBits[idx];
            
            if (aliceBit === 0) {
                // Should have D1 >> D2
                const total = bobBit.d1Count + bobBit.d2Count;
                if (total > 0 && bobBit.d2Count / total > 0.3) {
                    // Significant D2 presence = disturbance
                    disturbedBits++;
                }
            }
        });
        
        const lossPercent = ((totalLost / this.TOTAL_PHOTONS) * 100).toFixed(1);
        const disturbanceRate = ((disturbedBits / this.NUM_BITS) * 100).toFixed(1);
        
        document.getElementById('totalLoss').textContent = totalLost;
        document.getElementById('lossPercent').textContent = `(${lossPercent}%)`;
        document.getElementById('disturbedBits').textContent = disturbedBits;
        document.getElementById('disturbanceRate').textContent = `${disturbanceRate}%`;
    },
    
    selectEve(guess) {
        this.eveGuess = guess;
        
        document.getElementById('eveYes').classList.remove('selected');
        document.getElementById('eveNo').classList.remove('selected');
        
        if (guess) {
            document.getElementById('eveYes').classList.add('selected');
        } else {
            document.getElementById('eveNo').classList.add('selected');
        }
    },
    
    submitDecision() {
        if (this.eveGuess === null) {
            alert('Please select whether you think Eve was present!');
            return;
        }
        
        this.showResults();
    },
    
    showResults() {
        const modal = document.getElementById('resultsModal');
        const body = document.getElementById('resultsBody');
        
        const correct = this.eveGuess === this.evePresent;
        
        let html = '<div class="qkd-result-content">';
        
        // Decision result - compact
        html += '<div class="result-header">';
        html += `<div class="result-decision">`;
        html += `<span class="label">Your Answer:</span> <strong>${this.eveGuess ? 'Eve Present' : 'Eve Absent'}</strong>`;
        html += `</div>`;
        html += `<div class="result-truth">`;
        html += `<span class="label">Truth:</span> <strong>Eve was ${this.evePresent ? 'PRESENT' : 'ABSENT'}</strong>`;
        html += `</div>`;
        html += `<div class="verdict ${correct ? 'correct' : 'incorrect'}">`;
        html += correct ? '✓ CORRECT' : '✗ INCORRECT';
        html += '</div>';
        html += '</div>';
        
        // Compact explanation
        html += '<div class="result-explanation">';
        
        if (this.evePresent) {
            html += '<p><strong>Eve was eavesdropping.</strong> She measured 1-3 photons from each bit.</p>';
            html += '<p><strong>Her presence was revealed by:</strong> Photon loss (~50%) + Interference destruction (D1/D2 randomness in bit-0 transmissions) + Statistical disturbance pattern.</p>';
            
            // Condensed measurements
            const measuredBits = this.eveTargetPhotons.filter(p => p.length > 0);
            if (measuredBits.length > 0) {
                html += `<p class="eve-note">Eve measured photons in ${measuredBits.length} out of 10 bits.</p>`;
            }
        } else {
            html += '<p><strong>Eve was absent.</strong> Clean transmission.</p>';
            html += '<p><strong>What you saw:</strong> Expected loss from Alice\'s bit-1 encoding, clean interference in bit-0, no statistical disturbance.</p>';
        }
        
        html += '</div>';
        
        // Key lesson - condensed
        html += '<div class="key-insight">';
        html += '<h4>⚛️ Key Takeaway</h4>';
        html += '<p><strong>Photon loss ≠ Eavesdropping.</strong> Alice intentionally causes loss for bit-1.</p>';
        html += '<p><strong>Disturbance in the photon distribution = Eve.</strong> Her measurements destroy quantum interference, creating detectable statistical patterns.</p>';
        html += '<p class="final-note">QKD is fundamentally secure: eavesdropping cannot be hidden.</p>';
        html += '</div>';
        
        html += '</div>';
        
        body.innerHTML = html;
        modal.classList.add('active');
    },
    
    restart() {
        document.getElementById('resultsModal').classList.remove('active');
        this.init();
    }
};

// Initialize on page load
if (document.getElementById('transmissionPhase')) {
    qkdLab.init();
}