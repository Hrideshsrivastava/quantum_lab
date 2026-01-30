// ============================================
// INTERFEROMETER LAB - Interactive Simulation
// ============================================

// Canvas setup
const canvas = document.getElementById('labCanvas');
const ctx = canvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

// Colors
const NEON_CYAN = '#00fff9';
const NEON_BLUE = '#00d4ff';
const NEON_PURPLE = '#b026ff';
const NEON_RED = '#ff0844';
const NEON_GREEN = '#39ff14';
const BG_SECONDARY = '#141b2d';
const TEXT_PRIMARY = '#e8edf4';

// Component positions
const positions = {
    source: { x: 50, y: 250 },
    bs1: { x: 180, y: 250 },
    bs2: { x: 480, y: 250 },
    upperMirror: { x: 480, y: 100 },
    lowerMirror: { x: 480, y: 400 },
    d1: { x: 550, y: 200 },
    d2: { x: 550, y: 300 },
    upperDetector: { x: 330, y: 100 },
    lowerDetector: { x: 330, y: 400 }
};

// Experiment state
const experiment = {
    stats: {
        total: 0,
        d1: 0,
        d2: 0,
        pathUpper: 0,
        pathLower: 0
    },
    
    hasUpperDetector: false,
    hasLowerDetector: false,
    
    photonQueue: [],
    animating: false,
    
    // Toggle detectors
    toggleUpperDetector(enabled) {
        this.hasUpperDetector = enabled;
        this.redraw();
    },
    
    toggleLowerDetector(enabled) {
        this.hasLowerDetector = enabled;
        this.redraw();
    },
    
    // Emit photons with proper quantum logic
    emitPhotons(count) {
        for (let i = 0; i < count; i++) {
            this.photonQueue.push(this.simulatePhoton());
        }
        
        if (!this.animating) {
            this.processQueue();
        }
    },
    
    // Core quantum simulation logic
    simulatePhoton() {
        const hasPathInfo = this.hasUpperDetector || this.hasLowerDetector;
        
        if (!hasPathInfo) {
            // INTERFERENCE PRESENT
            // When no path information exists, quantum interference causes
            // all photons to go to one detector (D1) with ~100% probability
            // This is the key phenomenon: the two paths interfere destructively at D2
            return {
                finalDetector: 'D1',
                pathDetected: null,
                absorbedByPath: false
            };
        } else {
            // INTERFERENCE DESTROYED
            // When path information CAN exist (detector present), interference is lost
            // The photon "chooses" a path at the first beam splitter (50/50)
            
            const takesUpperPath = Math.random() < 0.5;
            
            // If detector is on that path, it ABSORBS the photon
            // The photon is detected and does NOT continue to final detectors
            if (takesUpperPath && this.hasUpperDetector) {
                return {
                    finalDetector: null,
                    pathDetected: 'upper',
                    path: 'upper',
                    absorbedByPath: true
                };
            } else if (!takesUpperPath && this.hasLowerDetector) {
                return {
                    finalDetector: null,
                    pathDetected: 'lower',
                    path: 'lower',
                    absorbedByPath: true
                };
            }
            
            // If no detector on the chosen path, photon continues
            // After BS2, it splits 50/50 to final detectors (no interference)
            const finalDetector = Math.random() < 0.5 ? 'D1' : 'D2';
            
            return {
                finalDetector,
                pathDetected: null,
                path: takesUpperPath ? 'upper' : 'lower',
                absorbedByPath: false
            };
        }
    },
    
    // Process photon queue with animation
    async processQueue() {
        this.animating = true;
        
        while (this.photonQueue.length > 0) {
            const result = this.photonQueue.shift();
            await this.animatePhoton(result);
            this.recordResult(result);
        }
        
        this.animating = false;
        this.updateDisplay();
        this.updateExplanation();
    },
    
    // Record experimental results
    recordResult(result) {
        this.stats.total++;
        
        // Only count final detector if photon reached it
        if (!result.absorbedByPath) {
            if (result.finalDetector === 'D1') {
                this.stats.d1++;
            } else if (result.finalDetector === 'D2') {
                this.stats.d2++;
            }
        }
        
        // Count path detections
        if (result.pathDetected === 'upper') {
            this.stats.pathUpper++;
        } else if (result.pathDetected === 'lower') {
            this.stats.pathLower++;
        }
    },
    
    // Animate single photon
    async animatePhoton(result) {
        return new Promise(resolve => {
            const duration = this.photonQueue.length > 50 ? 100 : 300;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                this.redraw();
                this.drawPhotonPath(result, progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    },
    
    // Draw photon traveling through system
    drawPhotonPath(result, progress) {
        const hasPathInfo = this.hasUpperDetector || this.hasLowerDetector;
        
        if (result.absorbedByPath) {
            // Photon is absorbed by path detector - doesn't reach final detectors
            let points;
            if (result.path === 'upper') {
                points = [
                    positions.source,
                    positions.bs1,
                    positions.upperDetector
                ];
            } else {
                points = [
                    positions.source,
                    positions.bs1,
                    positions.lowerDetector
                ];
            }
            
            const totalSegments = points.length - 1;
            const currentSegment = Math.floor(progress * totalSegments);
            const segmentProgress = (progress * totalSegments) % 1;
            
            if (currentSegment < totalSegments) {
                const start = points[currentSegment];
                const end = points[currentSegment + 1];
                const x = start.x + (end.x - start.x) * segmentProgress;
                const y = start.y + (end.y - start.y) * segmentProgress;
                
                this.drawPhotonParticle(x, y);
            }
        } else if (!hasPathInfo) {
            // NO PATH DETECTORS - Show as WAVE traveling BOTH paths simultaneously
            // Define both upper and lower paths
            const upperPath = [
                positions.source,
                positions.bs1,
                positions.upperMirror,
                positions.bs2,
                result.finalDetector === 'D1' ? positions.d1 : positions.d2
            ];
            
            const lowerPath = [
                positions.source,
                positions.bs1,
                positions.lowerMirror,
                positions.bs2,
                result.finalDetector === 'D1' ? positions.d1 : positions.d2
            ];
            
            // Draw photon on BOTH paths until they recombine at BS2
            // Upper path
            const upperPos = this.getPositionAlongPath(upperPath, progress);
            if (upperPos && progress < 0.75) { // Stop showing at BS2
                this.drawPhotonWave(upperPos.x, upperPos.y, 0.7); // Semi-transparent
            }
            
            // Lower path
            const lowerPos = this.getPositionAlongPath(lowerPath, progress);
            if (lowerPos && progress < 0.75) { // Stop showing at BS2
                this.drawPhotonWave(lowerPos.x, lowerPos.y, 0.7); // Semi-transparent
            }
            
            // After BS2, show as single particle going to final detector
            if (progress >= 0.75) {
                const finalPath = [
                    positions.bs2,
                    result.finalDetector === 'D1' ? positions.d1 : positions.d2
                ];
                const finalProgress = (progress - 0.75) / 0.25;
                const finalPos = this.getPositionAlongPath(finalPath, finalProgress);
                if (finalPos) {
                    this.drawPhotonParticle(finalPos.x, finalPos.y);
                }
            }
        } else {
            // PATH DETECTOR PRESENT - Show as particle taking ONE specific path
            let points;
            if (result.path === 'upper') {
                points = [
                    positions.source,
                    positions.bs1,
                    positions.upperMirror,
                    positions.bs2,
                    result.finalDetector === 'D1' ? positions.d1 : positions.d2
                ];
            } else {
                points = [
                    positions.source,
                    positions.bs1,
                    positions.lowerMirror,
                    positions.bs2,
                    result.finalDetector === 'D1' ? positions.d1 : positions.d2
                ];
            }
            
            const pos = this.getPositionAlongPath(points, progress);
            if (pos) {
                this.drawPhotonParticle(pos.x, pos.y);
            }
        }
    },
    
    // Helper: Get position along a path
    getPositionAlongPath(points, progress) {
        const totalSegments = points.length - 1;
        const currentSegment = Math.floor(progress * totalSegments);
        const segmentProgress = (progress * totalSegments) % 1;
        
        if (currentSegment < totalSegments) {
            const start = points[currentSegment];
            const end = points[currentSegment + 1];
            
            return {
                x: start.x + (end.x - start.x) * segmentProgress,
                y: start.y + (end.y - start.y) * segmentProgress
            };
        }
        return null;
    },
    
    // Draw photon as particle (localized)
    drawPhotonParticle(x, y) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = NEON_CYAN;
        ctx.fillStyle = NEON_CYAN;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    
    // Draw photon as wave (delocalized)
    drawPhotonWave(x, y, alpha = 0.7) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 20;
        ctx.shadowColor = NEON_CYAN;
        
        // Draw larger, more diffuse glow to represent wave nature
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
        gradient.addColorStop(0, NEON_CYAN);
        gradient.addColorStop(0.5, 'rgba(0, 255, 249, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 249, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Small core
        ctx.fillStyle = NEON_CYAN;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // Redraw entire system
    redraw() {
        // Clear
        ctx.fillStyle = BG_SECONDARY;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw paths
        this.drawPaths();
        
        // Draw components
        this.drawSource(positions.source.x, positions.source.y);
        this.drawBeamSplitter(positions.bs1.x, positions.bs1.y, 'BS1');
        this.drawBeamSplitter(positions.bs2.x, positions.bs2.y, 'BS2');
        this.drawMirror(positions.upperMirror.x, positions.upperMirror.y);
        this.drawMirror(positions.lowerMirror.x, positions.lowerMirror.y);
        this.drawDetector(positions.d1.x, positions.d1.y, 'D1');
        this.drawDetector(positions.d2.x, positions.d2.y, 'D2');
        
        // Draw path detectors if enabled
        if (this.hasUpperDetector) {
            this.drawPathDetector(positions.upperDetector.x, positions.upperDetector.y, 'Upper');
        }
        if (this.hasLowerDetector) {
            this.drawPathDetector(positions.lowerDetector.x, positions.lowerDetector.y, 'Lower');
        }
    },
    
    drawPaths() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // To BS1
        ctx.beginPath();
        ctx.moveTo(positions.source.x + 10, positions.source.y);
        ctx.lineTo(positions.bs1.x - 20, positions.bs1.y);
        ctx.stroke();
        
        // Upper path
        ctx.beginPath();
        ctx.moveTo(positions.bs1.x, positions.bs1.y - 20);
        ctx.lineTo(positions.upperMirror.x, positions.upperMirror.y + 15);
        ctx.lineTo(positions.bs2.x, positions.bs2.y - 20);
        ctx.stroke();
        
        // Lower path
        ctx.beginPath();
        ctx.moveTo(positions.bs1.x, positions.bs1.y + 20);
        ctx.lineTo(positions.lowerMirror.x, positions.lowerMirror.y - 15);
        ctx.lineTo(positions.bs2.x, positions.bs2.y + 20);
        ctx.stroke();
        
        // To detectors
        ctx.beginPath();
        ctx.moveTo(positions.bs2.x + 20, positions.bs2.y - 10);
        ctx.lineTo(positions.d1.x - 15, positions.d1.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(positions.bs2.x + 20, positions.bs2.y + 10);
        ctx.lineTo(positions.d2.x - 15, positions.d2.y);
        ctx.stroke();
        
        ctx.setLineDash([]);
    },
    
    drawSource(x, y) {
        ctx.fillStyle = NEON_CYAN;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.font = '12px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText('Source', x, y + 25);
    },
    
    drawBeamSplitter(x, y, label) {
        ctx.strokeStyle = NEON_BLUE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 15, y - 15);
        ctx.lineTo(x + 15, y + 15);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 20, y - 20, 40, 40);
        
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.font = '11px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 35);
    },
    
    drawMirror(x, y) {
        ctx.strokeStyle = NEON_PURPLE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 12);
        ctx.lineTo(x + 12, y + 12);
        ctx.stroke();
    },
    
    drawDetector(x, y, label) {
        ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.fillRect(x - 15, y - 20, 30, 40);
        ctx.strokeStyle = NEON_CYAN;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 15, y - 20, 30, 40);
        
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.font = '12px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 35);
    },
    
    drawPathDetector(x, y, label) {
        ctx.fillStyle = 'rgba(255, 8, 68, 0.1)';
        ctx.fillRect(x - 12, y - 15, 24, 30);
        ctx.strokeStyle = NEON_RED;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 12, y - 15, 24, 30);
        
        ctx.fillStyle = NEON_RED;
        ctx.font = '10px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 25);
    },
    
    // Update statistics display
    updateDisplay() {
        document.getElementById('totalPhotons').textContent = this.stats.total;
        document.getElementById('d1Count').textContent = this.stats.d1;
        document.getElementById('d2Count').textContent = this.stats.d2;
        
        if (this.stats.total > 0) {
            const d1Percent = ((this.stats.d1 / this.stats.total) * 100).toFixed(1);
            const d2Percent = ((this.stats.d2 / this.stats.total) * 100).toFixed(1);
            document.getElementById('d1Percent').textContent = `(${d1Percent}%)`;
            document.getElementById('d2Percent').textContent = `(${d2Percent}%)`;
        }
        
        const pathStat = document.getElementById('pathStat');
        if (this.hasUpperDetector || this.hasLowerDetector) {
            pathStat.style.display = 'flex';
            const pathTotal = this.stats.pathUpper + this.stats.pathLower;
            document.getElementById('pathCount').textContent = pathTotal;
            if (this.stats.total > 0) {
                const pathPercent = ((pathTotal / this.stats.total) * 100).toFixed(1);
                document.getElementById('pathPercent').textContent = `(${pathPercent}%)`;
            }
        } else {
            pathStat.style.display = 'none';
        }
        
        this.updateGraph();
    },
    
    // Update bar graph - show ALL active detectors
    updateGraph() {
        graphCtx.fillStyle = BG_SECONDARY;
        graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
        
        if (this.stats.total === 0) return;
        
        const d1Percent = (this.stats.d1 / this.stats.total) * 100;
        const d2Percent = (this.stats.d2 / this.stats.total) * 100;
        const pathUpperPercent = (this.stats.pathUpper / this.stats.total) * 100;
        const pathLowerPercent = (this.stats.pathLower / this.stats.total) * 100;
        
        // Determine how many bars to show
        const hasPathDetectors = this.hasUpperDetector || this.hasLowerDetector;
        const numBars = hasPathDetectors ? 4 : 2;
        const barWidth = hasPathDetectors ? 60 : 80;
        const maxHeight = 220;
        const spacing = 20;
        const startX = hasPathDetectors ? 20 : 50;
        
        let xPos = startX;
        
        // D1 bar
        const d1Height = (d1Percent / 100) * maxHeight;
        graphCtx.fillStyle = NEON_BLUE;
        graphCtx.fillRect(xPos, maxHeight - d1Height + 40, barWidth, d1Height);
        
        graphCtx.fillStyle = TEXT_PRIMARY;
        graphCtx.font = '12px "Segoe UI"';
        graphCtx.textAlign = 'center';
        graphCtx.fillText('D1', xPos + barWidth / 2, maxHeight + 60);
        graphCtx.fillText(`${d1Percent.toFixed(0)}%`, xPos + barWidth / 2, maxHeight - d1Height + 30);
        
        xPos += barWidth + spacing;
        
        // D2 bar
        const d2Height = (d2Percent / 100) * maxHeight;
        graphCtx.fillStyle = NEON_PURPLE;
        graphCtx.fillRect(xPos, maxHeight - d2Height + 40, barWidth, d2Height);
        
        graphCtx.fillText('D2', xPos + barWidth / 2, maxHeight + 60);
        graphCtx.fillText(`${d2Percent.toFixed(0)}%`, xPos + barWidth / 2, maxHeight - d2Height + 30);
        
        xPos += barWidth + spacing;
        
        // Path detectors if active
        if (this.hasUpperDetector) {
            const upperHeight = (pathUpperPercent / 100) * maxHeight;
            graphCtx.fillStyle = NEON_RED;
            graphCtx.fillRect(xPos, maxHeight - upperHeight + 40, barWidth, upperHeight);
            
            graphCtx.fillStyle = TEXT_PRIMARY;
            graphCtx.font = '10px "Segoe UI"';
            graphCtx.fillText('Upper', xPos + barWidth / 2, maxHeight + 60);
            graphCtx.font = '12px "Segoe UI"';
            graphCtx.fillText(`${pathUpperPercent.toFixed(0)}%`, xPos + barWidth / 2, maxHeight - upperHeight + 30);
            
            xPos += barWidth + spacing;
        }
        
        if (this.hasLowerDetector) {
            const lowerHeight = (pathLowerPercent / 100) * maxHeight;
            graphCtx.fillStyle = NEON_RED;
            graphCtx.fillRect(xPos, maxHeight - lowerHeight + 40, barWidth, lowerHeight);
            
            graphCtx.fillStyle = TEXT_PRIMARY;
            graphCtx.font = '10px "Segoe UI"';
            graphCtx.fillText('Lower', xPos + barWidth / 2, maxHeight + 60);
            graphCtx.font = '12px "Segoe UI"';
            graphCtx.fillText(`${pathLowerPercent.toFixed(0)}%`, xPos + barWidth / 2, maxHeight - lowerHeight + 30);
        }
    },
    
    // Update explanation text
    updateExplanation() {
        const hasPathInfo = this.hasUpperDetector || this.hasLowerDetector;
        const pathDetections = this.stats.pathUpper + this.stats.pathLower;
        const finalDetections = this.stats.d1 + this.stats.d2;
        
        let html = '<p><strong>What happened:</strong></p>';
        
        if (!hasPathInfo) {
            html += '<p>With no path detectors, quantum interference is present. The two paths interfere destructively at D2 and constructively at D1, causing nearly all photons to arrive at D1.</p>';
            html += '<p><strong>The rule:</strong> When both paths are possible and no information exists about which path was taken, the probability waves interfere. This creates the characteristic pattern where one detector receives ~100% and the other ~0%.</p>';
        } else {
            html += `<p>With path detector(s) present, photons "choose" a path at the first beam splitter (50/50 split).</p>`;
            html += `<p><strong>Path detections:</strong> ${pathDetections} photons were absorbed by path detectors (~${((pathDetections/this.stats.total)*100).toFixed(0)}%).</p>`;
            html += `<p><strong>Final detections:</strong> ${finalDetections} photons reached the final detectors and split roughly 50/50 between D1 and D2.</p>`;
            html += '<p><strong>The rule:</strong> When path information exists (even if unread), interference is destroyed. Photons on a monitored path are absorbed. Photons on an unmonitored path continue and split 50/50 at the second beam splitter.</p>';
            html += '<p class="highlight">Notice: The mere presence of a path detector changes the entire system behavior, even for photons that take the other path!</p>';
        }
        
        document.getElementById('explanationText').innerHTML = html;
    },
    
    // Reset experiment
    reset() {
        this.stats = {
            total: 0,
            d1: 0,
            d2: 0,
            pathUpper: 0,
            pathLower: 0
        };
        
        this.photonQueue = [];
        this.updateDisplay();
        this.redraw();
        
        document.getElementById('explanationText').innerHTML = '<p>Run an experiment to see results and explanations.</p>';
    }
};

// Initialize
experiment.redraw();
