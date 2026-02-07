// ============================================
// ADVANCED INTERFEROMETER LAB
// Full Physics Simulation with Professional Instruments
// ============================================

// Canvas setup
const canvas = document.getElementById('labCanvas');
const ctx = canvas.getContext('2d');
const oscilloscope = document.getElementById('oscilloscope');
const scopeCtx = oscilloscope.getContext('2d');
const interferenceCanvas = document.getElementById('interferencePattern');
const intCtx = interferenceCanvas.getContext('2d');

// Colors - Dynamic based on wavelength
const BG_SECONDARY = '#141b2d';
const TEXT_PRIMARY = '#e8edf4';
const NEON_CYAN = '#00fff9';
const NEON_BLUE = '#00d4ff';
const NEON_PURPLE = '#b026ff';
const NEON_RED = '#ff0844';
const NEON_GREEN = '#39ff14';
const NEON_YELLOW = '#ffed4e';

// Component positions (for 650x650 square canvas)
const positions = {
    source: { x: 80, y: 325 },
    bs1: { x: 220, y: 325 },
    bs2: { x: 520, y: 325 },
    upperMirror: { x: 520, y: 140 },
    lowerMirror: { x: 520, y: 510 },
    d1: { x: 590, y: 280 },
    d2: { x: 590, y: 370 },
    upperDetector: { x: 370, y: 140 },
    lowerDetector: { x: 370, y: 510 },
    material: { x: 370, y: 140, width: 50, height: 28 }
};

// Experiment state
const experiment = {
    // Basic state
    stats: {
        total: 0,
        d1: 0,
        d2: 0,
        pathUpper: 0,
        pathLower: 0
    },
    
    // Detector states
    hasUpperDetector: false,
    hasLowerDetector: false,
    
    // Photon queue and animation
    photonQueue: [],
    animating: false,
    
    // Advanced features
    wavelength: 532, // nm (green by default)
    photonColor: '#00ff00',
    
    // Material properties
    materialEnabled: false,
    material: {
        type: 'glass',
        refractiveIndex: 1.5,
        thickness: 10, // mm
        phaseShift: 0 // degrees
    },
    
    // Noise simulation
    noiseEnabled: false,
    noiseLevel: 0.2, // 0-1
    
    // Stream mode
    streamMode: false,
    streamIntensity: 5, // photons per second
    streamInterval: null,
    
    // Oscilloscope data
    scopeData: {
        d1: [],
        d2: [],
        maxPoints: 200,
        timeWindow: 10 // seconds
    },
    
    scopeChannels: {
        d1: true,
        d2: true
    },
    
    // Real-time tracking for oscilloscope
    lastSecondD1: 0,
    lastSecondD2: 0,
    lastUpdate: Date.now(),
    
    // ============================================
    // WAVELENGTH & COLOR MANAGEMENT
    // ============================================
    
    updateWavelength(wl) {
        this.wavelength = parseInt(wl);
        document.getElementById('wavelengthValue').textContent = this.wavelength;
        this.photonColor = this.wavelengthToColor(this.wavelength);
        document.getElementById('colorPreview').style.backgroundColor = this.photonColor;
        this.updateMaterial();
        this.redraw();
    },
    
    setWavelength(wl) {
        document.getElementById('wavelength').value = wl;
        this.updateWavelength(wl);
    },
    
    wavelengthToColor(wavelength) {
        // Convert wavelength (380-750 nm) to RGB color
        let r, g, b;
        
        if (wavelength >= 380 && wavelength < 440) {
            r = -(wavelength - 440) / (440 - 380);
            g = 0;
            b = 1;
        } else if (wavelength >= 440 && wavelength < 490) {
            r = 0;
            g = (wavelength - 440) / (490 - 440);
            b = 1;
        } else if (wavelength >= 490 && wavelength < 510) {
            r = 0;
            g = 1;
            b = -(wavelength - 510) / (510 - 490);
        } else if (wavelength >= 510 && wavelength < 580) {
            r = (wavelength - 510) / (580 - 510);
            g = 1;
            b = 0;
        } else if (wavelength >= 580 && wavelength < 645) {
            r = 1;
            g = -(wavelength - 645) / (645 - 580);
            b = 0;
        } else if (wavelength >= 645 && wavelength <= 750) {
            r = 1;
            g = 0;
            b = 0;
        } else {
            r = 0;
            g = 0;
            b = 0;
        }
        
        // Intensity correction for edge wavelengths
        let intensity = 1.0;
        if (wavelength >= 380 && wavelength < 420) {
            intensity = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
        } else if (wavelength >= 700 && wavelength <= 750) {
            intensity = 0.3 + 0.7 * (750 - wavelength) / (750 - 700);
        }
        
        r = Math.round(r * intensity * 255);
        g = Math.round(g * intensity * 255);
        b = Math.round(b * intensity * 255);
        
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    // ============================================
    // MATERIAL LAB
    // ============================================
    
    toggleMaterial(enabled) {
        this.materialEnabled = enabled;
        const controls = document.getElementById('materialControls');
        controls.style.display = enabled ? 'block' : 'none';
        if (enabled) {
            this.updateMaterial();
        }
        this.redraw();
        this.updateScopeExplanation();
    },
    
    updateMaterial() {
        const type = document.getElementById('materialType').value;
        const customDiv = document.getElementById('customRefractiveIndex');
        
        if (type === 'custom') {
            customDiv.style.display = 'block';
            this.material.refractiveIndex = parseFloat(document.getElementById('refractiveIndex').value);
        } else {
            customDiv.style.display = 'none';
            const materials = {
                'glass': 1.5,
                'water': 1.33,
                'diamond': 2.42
            };
            this.material.refractiveIndex = materials[type];
        }
        
        this.material.type = type;
        this.material.thickness = parseFloat(document.getElementById('thickness').value);
        this.calculatePhaseShift();
        this.updateScopeExplanation();
    },
    
    updateRefractiveIndex(n) {
        this.material.refractiveIndex = parseFloat(n);
        document.getElementById('nValue').textContent = n;
        this.calculatePhaseShift();
        this.updateScopeExplanation();
    },
    
    updateThickness(thickness) {
        this.material.thickness = parseFloat(thickness);
        document.getElementById('thicknessValue').textContent = thickness;
        this.calculatePhaseShift();
        this.updateScopeExplanation();
    },
    
    calculatePhaseShift() {
        // Phase shift = (2π * n * d) / λ
        // Convert to degrees
        const n = this.material.refractiveIndex;
        const d = this.material.thickness * 1e-3; // mm to meters
        const lambda = this.wavelength * 1e-9; // nm to meters
        
        const phaseRadians = (2 * Math.PI * n * d) / lambda;
        const phaseDegrees = (phaseRadians * 180 / Math.PI) % 360;
        
        this.material.phaseShift = phaseDegrees;
        document.getElementById('phaseShift').textContent = phaseDegrees.toFixed(1);
    },
    
    // ============================================
    // NOISE SIMULATION
    // ============================================
    
    toggleNoise(enabled) {
        this.noiseEnabled = enabled;
        const controls = document.getElementById('noiseControls');
        controls.style.display = enabled ? 'block' : 'none';
        if (enabled) {
            this.updateNoise(document.getElementById('noiseLevel').value);
        }
        this.updateScopeExplanation();
    },
    
    updateNoise(level) {
        this.noiseLevel = parseFloat(level) / 100;
        document.getElementById('noiseValue').textContent = level;
        this.updateSNR();
    },
    
    updateSNR() {
        // Signal-to-Noise Ratio in dB
        // SNR = 20 * log10(signal / noise)
        if (this.noiseLevel === 0) {
            document.getElementById('snrValue').textContent = '∞';
        } else {
            const snr = 20 * Math.log10(1 / this.noiseLevel);
            document.getElementById('snrValue').textContent = snr.toFixed(1);
        }
    },
    
    // ============================================
    // STREAM MODE
    // ============================================
    
    toggleStreamMode(enabled) {
        this.streamMode = enabled;
        const controls = document.getElementById('streamControls');
        controls.style.display = enabled ? 'block' : 'none';
        
        if (enabled) {
            this.startStream();
        } else {
            this.stopStream();
        }
        
        this.updateScopeExplanation();
    },
    
    updateIntensity(value) {
        this.streamIntensity = parseInt(value);
        document.getElementById('intensityValue').textContent = value;
        
        if (this.streamMode) {
            this.stopStream();
            this.startStream();
        }
    },
    
    startStream() {
        const interval = 1000 / this.streamIntensity;
        this.streamInterval = setInterval(() => {
            this.emitPhotons(1);
        }, interval);
    },
    
    stopStream() {
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
        }
    },
    
    // ============================================
    // DETECTOR CONTROLS
    // ============================================
    
    toggleUpperDetector(enabled) {
        this.hasUpperDetector = enabled;
        this.redraw();
        this.updateScopeExplanation();
    },
    
    toggleLowerDetector(enabled) {
        this.hasLowerDetector = enabled;
        this.redraw();
        this.updateScopeExplanation();
    },
    
    // ============================================
    // CORE QUANTUM SIMULATION
    // ============================================
    
    emitPhotons(count) {
        for (let i = 0; i < count; i++) {
            this.photonQueue.push(this.simulatePhoton());
        }
        
        if (!this.animating) {
            this.processQueue();
        }
    },
    
    simulatePhoton() {
        const hasPathInfo = this.hasUpperDetector || this.hasLowerDetector;
        
        // Apply noise
        let noiseOffset = 0;
        if (this.noiseEnabled) {
            noiseOffset = (Math.random() - 0.5) * this.noiseLevel;
        }
        
        if (!hasPathInfo && !this.materialEnabled) {
            // Standard interference - all to D1
            return {
                finalDetector: Math.random() < (1 + noiseOffset) ? 'D1' : 'D2',
                pathDetected: null,
                absorbedByPath: false
            };
        } else if (!hasPathInfo && this.materialEnabled) {
            // Material causes phase shift - affects interference
            const phaseShift = this.material.phaseShift;
            
            // Probability based on phase shift
            // P(D1) = cos²(φ/2), P(D2) = sin²(φ/2)
            const phaseRad = phaseShift * Math.PI / 180;
            const p_d1 = Math.cos(phaseRad / 2) ** 2;
            
            const rand = Math.random() + noiseOffset;
            return {
                finalDetector: rand < p_d1 ? 'D1' : 'D2',
                pathDetected: null,
                absorbedByPath: false,
                materialEffect: true
            };
        } else {
            // Path detectors present - interference destroyed
            const takesUpperPath = Math.random() < 0.5;
            
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
            
            // No detector on chosen path - continues to final detectors
            const rand = Math.random() + noiseOffset;
            const finalDetector = rand < 0.5 ? 'D1' : 'D2';
            
            return {
                finalDetector,
                pathDetected: null,
                path: takesUpperPath ? 'upper' : 'lower',
                absorbedByPath: false
            };
        }
    },
    
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
    
    recordResult(result) {
        this.stats.total++;
        
        if (!result.absorbedByPath) {
            if (result.finalDetector === 'D1') {
                this.stats.d1++;
                this.lastSecondD1++;
            } else if (result.finalDetector === 'D2') {
                this.stats.d2++;
                this.lastSecondD2++;
            }
        }
        
        if (result.pathDetected === 'upper') {
            this.stats.pathUpper++;
        } else if (result.pathDetected === 'lower') {
            this.stats.pathLower++;
        }
        
        // Update oscilloscope every second
        const now = Date.now();
        if (now - this.lastUpdate >= 1000) {
            this.scopeData.d1.push(this.lastSecondD1);
            this.scopeData.d2.push(this.lastSecondD2);
            
            if (this.scopeData.d1.length > this.scopeData.maxPoints) {
                this.scopeData.d1.shift();
                this.scopeData.d2.shift();
            }
            
            this.lastSecondD1 = 0;
            this.lastSecondD2 = 0;
            this.lastUpdate = now;
            
            this.drawOscilloscope();
        }
    },
    
    async animatePhoton(result) {
        return new Promise(resolve => {
            const duration = this.photonQueue.length > 50 ? 100 : 300;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                this.redraw();
                
                // Only draw the photon if progress is less than 1
                if (progress < 1) {
                    this.drawPhotonPath(result, progress);
                    requestAnimationFrame(animate);
                } else {
                    // Animation is done: redraw system empty and resolve
                    this.redraw(); 
                    resolve();
                }
            };
            
            animate();
        });
    },
    
    // ============================================
    // DRAWING FUNCTIONS
    // ============================================
    
    drawPhotonPath(result, progress) {
        const hasPathInfo = this.hasUpperDetector || this.hasLowerDetector;
        
        if (result.absorbedByPath) {
            // Draw to path detector
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
            
            const pos = this.getPointOnPath(points, progress);
            this.drawPhotonParticle(pos.x, pos.y);
        } else if (!hasPathInfo) {
            // Show as wave on both paths
            this.drawWavePaths(progress);
        } else {
            // Show single path
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
            
            const pos = this.getPointOnPath(points, progress);
            this.drawPhotonParticle(pos.x, pos.y);
        }
    },
    
    getPointOnPath(points, progress) {
        const totalSegments = points.length - 1;
        const currentSegment = Math.floor(progress * totalSegments);
        const segmentProgress = (progress * totalSegments) % 1;
        
        if (currentSegment >= totalSegments) {
            return points[points.length - 1];
        }
        
        const start = points[currentSegment];
        const end = points[currentSegment + 1];
        
        return {
            x: start.x + (end.x - start.x) * segmentProgress,
            y: start.y + (end.y - start.y) * segmentProgress
        };
    },
    
    drawWavePaths(progress) {
        // Upper path wave
        const upperPoints = [
            positions.source,
            positions.bs1,
            positions.upperMirror,
            positions.bs2
        ];
        
        // Lower path wave
        const lowerPoints = [
            positions.source,
            positions.bs1,
            positions.lowerMirror,
            positions.bs2
        ];
        
        const upperPos = this.getPointOnPath(upperPoints, progress);
        const lowerPos = this.getPointOnPath(lowerPoints, progress);
        
        // Draw wave packets
        ctx.globalAlpha = 0.6;
        this.drawPhotonWave(upperPos.x, upperPos.y);
        this.drawPhotonWave(lowerPos.x, lowerPos.y);
        ctx.globalAlpha = 1;
    },
    
    drawPhotonParticle(x, y) {
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 8);
        grd.addColorStop(0, this.photonColor);
        grd.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawPhotonWave(x, y) {
        ctx.strokeStyle = this.photonColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = -3; i <= 3; i++) {
            const offset = i * 8;
            const amplitude = 6 * Math.exp(-i * i / 4);
            ctx.moveTo(x + offset, y - amplitude);
            ctx.lineTo(x + offset, y + amplitude);
        }
        ctx.stroke();
    },
    
    redraw() {
        ctx.fillStyle = BG_SECONDARY;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        this.drawPaths();
        this.drawComponents();
        if (this.materialEnabled) {
            this.drawMaterial();
        }
    },
    
    drawPaths() {
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Source to BS1
        ctx.beginPath();
        ctx.moveTo(positions.source.x, positions.source.y);
        ctx.lineTo(positions.bs1.x, positions.bs1.y);
        ctx.stroke();
        
        // BS1 to upper mirror
        ctx.beginPath();
        ctx.moveTo(positions.bs1.x, positions.bs1.y);
        ctx.lineTo(positions.upperMirror.x, positions.upperMirror.y);
        ctx.stroke();
        
        // BS1 to lower mirror
        ctx.beginPath();
        ctx.moveTo(positions.bs1.x, positions.bs1.y);
        ctx.lineTo(positions.lowerMirror.x, positions.lowerMirror.y);
        ctx.stroke();
        
        // Upper mirror to BS2
        ctx.beginPath();
        ctx.moveTo(positions.upperMirror.x, positions.upperMirror.y);
        ctx.lineTo(positions.bs2.x, positions.bs2.y);
        ctx.stroke();
        
        // Lower mirror to BS2
        ctx.beginPath();
        ctx.moveTo(positions.lowerMirror.x, positions.lowerMirror.y);
        ctx.lineTo(positions.bs2.x, positions.bs2.y);
        ctx.stroke();
        
        // BS2 to detectors
        ctx.beginPath();
        ctx.moveTo(positions.bs2.x, positions.bs2.y);
        ctx.lineTo(positions.d1.x, positions.d1.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(positions.bs2.x, positions.bs2.y);
        ctx.lineTo(positions.d2.x, positions.d2.y);
        ctx.stroke();
        
        ctx.setLineDash([]);
    },
    
    drawComponents() {
        this.drawSource(positions.source.x, positions.source.y);
        this.drawBeamSplitter(positions.bs1.x, positions.bs1.y, 'BS1');
        this.drawBeamSplitter(positions.bs2.x, positions.bs2.y, 'BS2');
        this.drawMirror(positions.upperMirror.x, positions.upperMirror.y);
        this.drawMirror(positions.lowerMirror.x, positions.lowerMirror.y);
        this.drawDetector(positions.d1.x, positions.d1.y, 'D1');
        this.drawDetector(positions.d2.x, positions.d2.y, 'D2');
        
        if (this.hasUpperDetector) {
            this.drawPathDetector(positions.upperDetector.x, positions.upperDetector.y, 'PD');
        }
        if (this.hasLowerDetector) {
            this.drawPathDetector(positions.lowerDetector.x, positions.lowerDetector.y, 'PD');
        }
    },
    
    drawSource(x, y) {
        // Draw laser source with current wavelength color
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 15);
        grd.addColorStop(0, this.photonColor);
        grd.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.photonColor;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = TEXT_PRIMARY;
        ctx.font = '11px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText('Laser', x, y + 30);
        ctx.fillText(`${this.wavelength}nm`, x, y + 43);
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
    
    drawMaterial() {
        const pos = positions.material;
        
        // Draw material block
        ctx.fillStyle = 'rgba(176, 38, 255, 0.2)';
        ctx.fillRect(pos.x - pos.width / 2, pos.y - pos.height / 2, pos.width, pos.height);
        
        ctx.strokeStyle = NEON_PURPLE;
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x - pos.width / 2, pos.y - pos.height / 2, pos.width, pos.height);
        
        // Label
        ctx.fillStyle = NEON_PURPLE;
        ctx.font = '10px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText(this.material.type.toUpperCase(), pos.x, pos.y + 25);
        ctx.fillText(`n=${this.material.refractiveIndex.toFixed(2)}`, pos.x, pos.y + 37);
    },
    
    // ============================================
    // OSCILLOSCOPE
    // ============================================
    
    updateScopeChannels() {
        this.scopeChannels.d1 = document.getElementById('scopeD1').checked;
        this.scopeChannels.d2 = document.getElementById('scopeD2').checked;
        this.drawOscilloscope();
    },
    
    updateScopeExplanation() {
        const hasPathInfo = this.hasUpperDetector || this.hasLowerDetector;
        const hasMaterial = this.materialEnabled;
        const hasNoise = this.noiseEnabled;
        const isStreaming = this.streamMode;
        
        let html = '';
        
        if (!isStreaming) {
            html = '<p><strong>Enable stream mode</strong> to see real-time detection rates.</p>';
            html += '<p>Each point shows photons detected per second.</p>';
        } else {
            html = '<p><strong>Real-time monitoring active.</strong></p>';
            
            if (!hasPathInfo && !hasMaterial && !hasNoise) {
                // Perfect interference
                html += '<p class="scope-reading-interference">● <strong>D1 (blue):</strong> Should show steady high rate (~' + this.streamIntensity + '/sec)</p>';
                html += '<p class="scope-reading-interference">● <strong>D2 (purple):</strong> Should show near zero</p>';
                html += '<p style="margin-top: 0.5rem; font-size: 0.85rem;">This is <strong>quantum interference</strong> - all photons go to D1!</p>';
            } else if (hasMaterial && !hasPathInfo) {
                // Material interference
                const phaseShift = this.material.phaseShift % 360;
                html += '<p class="scope-reading-normal">● <strong>Material effect active</strong></p>';
                
                if (Math.abs(phaseShift) < 20 || Math.abs(phaseShift - 360) < 20) {
                    html += '<p style="font-size: 0.85rem;">Phase ≈ 0°: D1 high, D2 low (constructive at D1)</p>';
                } else if (Math.abs(phaseShift - 180) < 20) {
                    html += '<p style="font-size: 0.85rem;">Phase ≈ 180°: D1 low, D2 high (shifted interference)</p>';
                } else if (Math.abs(phaseShift - 90) < 20 || Math.abs(phaseShift - 270) < 20) {
                    html += '<p style="font-size: 0.85rem;">Phase ≈ 90°: Both equal (~50/50 split)</p>';
                } else {
                    html += '<p style="font-size: 0.85rem;">Intermediate phase: Partial interference</p>';
                }
            } else if (hasPathInfo) {
                // Path detectors active
                html += '<p class="scope-reading-path">● <strong>Path detection active</strong></p>';
                html += '<p style="font-size: 0.85rem;">D1 and D2 should show reduced rates (some photons absorbed by path detectors)</p>';
                html += '<p style="font-size: 0.85rem;">Expect roughly equal D1/D2 rates (no interference)</p>';
            }
            
            if (hasNoise) {
                html += '<p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--neon-yellow);">⚠ Noise adds random fluctuations to readings</p>';
            }
        }
        
        document.getElementById('scopeExplanation').innerHTML = html;
    },
    
    drawOscilloscope() {
        // Clear
        scopeCtx.fillStyle = '#001a00';
        scopeCtx.fillRect(0, 0, oscilloscope.width, oscilloscope.height);
        
        // Grid
        scopeCtx.strokeStyle = 'rgba(57, 255, 20, 0.1)';
        scopeCtx.lineWidth = 1;
        
        for (let x = 0; x < oscilloscope.width; x += 35) {
            scopeCtx.beginPath();
            scopeCtx.moveTo(x, 0);
            scopeCtx.lineTo(x, oscilloscope.height);
            scopeCtx.stroke();
        }
        
        for (let y = 0; y < oscilloscope.height; y += 40) {
            scopeCtx.beginPath();
            scopeCtx.moveTo(0, y);
            scopeCtx.lineTo(oscilloscope.width, y);
            scopeCtx.stroke();
        }
        
        if (this.scopeData.d1.length < 2) return;
        
        const maxCount = Math.max(...this.scopeData.d1, ...this.scopeData.d2, 1);
        const xScale = oscilloscope.width / this.scopeData.maxPoints;
        const yScale = (oscilloscope.height - 20) / maxCount;
        
        // Draw D1 trace
        if (this.scopeChannels.d1) {
            scopeCtx.strokeStyle = NEON_BLUE;
            scopeCtx.lineWidth = 2;
            scopeCtx.beginPath();
            
            for (let i = 0; i < this.scopeData.d1.length; i++) {
                const x = i * xScale;
                const y = oscilloscope.height - 10 - this.scopeData.d1[i] * yScale;
                
                if (i === 0) {
                    scopeCtx.moveTo(x, y);
                } else {
                    scopeCtx.lineTo(x, y);
                }
            }
            scopeCtx.stroke();
        }
        
        // Draw D2 trace
        if (this.scopeChannels.d2) {
            scopeCtx.strokeStyle = NEON_PURPLE;
            scopeCtx.lineWidth = 2;
            scopeCtx.beginPath();
            
            for (let i = 0; i < this.scopeData.d2.length; i++) {
                const x = i * xScale;
                const y = oscilloscope.height - 10 - this.scopeData.d2[i] * yScale;
                
                if (i === 0) {
                    scopeCtx.moveTo(x, y);
                } else {
                    scopeCtx.lineTo(x, y);
                }
            }
            scopeCtx.stroke();
        }
    },
    
    // ============================================
    // INTERFERENCE PATTERN
    // ============================================
    
    drawInterferencePattern() {
        intCtx.fillStyle = BG_SECONDARY;
        intCtx.fillRect(0, 0, interferenceCanvas.width, interferenceCanvas.height);
        
        if (this.stats.total === 0) return;
        
        const d1Percent = (this.stats.d1 / this.stats.total) * 100;
        const d2Percent = (this.stats.d2 / this.stats.total) * 100;
        const pathUpperPercent = (this.stats.pathUpper / this.stats.total) * 100;
        const pathLowerPercent = (this.stats.pathLower / this.stats.total) * 100;
        
        // Adjusted layout to fit 4 bars
        const barWidth = 40;
        const maxHeight = 200;
        const spacing = 15; 
        const startX = 30; 
        
        // --- D1 Bar ---
        const d1Height = (d1Percent / 100) * maxHeight;
        intCtx.fillStyle = NEON_BLUE;
        intCtx.fillRect(startX, maxHeight - d1Height + 20, barWidth, d1Height);
        
        intCtx.fillStyle = TEXT_PRIMARY;
        intCtx.font = '12px "Segoe UI"'; // Slightly smaller font to fit labels
        intCtx.textAlign = 'center';
        intCtx.fillText('D1', startX + barWidth / 2, maxHeight + 45);
        if(d1Percent > 0) intCtx.fillText(`${d1Percent.toFixed(1)}%`, startX + barWidth / 2, maxHeight - d1Height + 10);
        
        // --- D2 Bar ---
        const d2Height = (d2Percent / 100) * maxHeight;
        const d2X = startX + barWidth + spacing;
        intCtx.fillStyle = NEON_PURPLE;
        intCtx.fillRect(d2X, maxHeight - d2Height + 20, barWidth, d2Height);
        
        intCtx.fillStyle = TEXT_PRIMARY;
        intCtx.fillText('D2', d2X + barWidth / 2, maxHeight + 45);
        if(d2Percent > 0) intCtx.fillText(`${d2Percent.toFixed(1)}%`, d2X + barWidth / 2, maxHeight - d2Height + 10);

        // --- Upper Path Bar ---
        const upperHeight = (pathUpperPercent / 100) * maxHeight;
        const upperX = startX + 2 * (barWidth + spacing);
        intCtx.fillStyle = NEON_RED;
        intCtx.fillRect(upperX, maxHeight - upperHeight + 20, barWidth, upperHeight);

        intCtx.fillStyle = TEXT_PRIMARY;
        intCtx.fillText('Upper', upperX + barWidth / 2, maxHeight + 45);
        if(pathUpperPercent > 0) intCtx.fillText(`${pathUpperPercent.toFixed(1)}%`, upperX + barWidth / 2, maxHeight - upperHeight + 10);

        // --- Lower Path Bar ---
        const lowerHeight = (pathLowerPercent / 100) * maxHeight;
        const lowerX = startX + 3 * (barWidth + spacing);
        intCtx.fillStyle = NEON_RED;
        intCtx.fillRect(lowerX, maxHeight - lowerHeight + 20, barWidth, lowerHeight);

        intCtx.fillStyle = TEXT_PRIMARY;
        intCtx.fillText('Lower', lowerX + barWidth / 2, maxHeight + 45);
        if(pathLowerPercent > 0) intCtx.fillText(`${pathLowerPercent.toFixed(1)}%`, lowerX + barWidth / 2, maxHeight - lowerHeight + 10);
        
        // --- Visibility Stat ---
        // Only calculate visibility based on the photons that actually reached D1/D2
        const finalPhotons = d1Percent + d2Percent;
        let visibility = 0;
        if (finalPhotons > 0) {
            const contrast = Math.abs(d1Percent - d2Percent);
            visibility = (contrast / finalPhotons) * 100;
        }
        
        // intCtx.fillStyle = TEXT_PRIMARY;
        // intCtx.font = '12px "Segoe UI"';
        // intCtx.textAlign = 'top';
        // intCtx.fillText(`Interference Visibility: ${visibility.toFixed(1)}%`, 10, interferenceCanvas.height - 10);
    },
    
    // ============================================
    // DISPLAY UPDATES
    // ============================================
    
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
        
        this.drawInterferencePattern();
    },
    
    updateExplanation() {
        const hasPathInfo = this.hasUpperDetector || this.hasLowerDetector;
        const hasMaterial = this.materialEnabled;
        const hasNoise = this.noiseEnabled;
        
        let html = '<p><strong>Current Configuration:</strong></p>';
        
        if (hasMaterial && !hasPathInfo) {
            html += `<p>A ${this.material.type} block (n=${this.material.refractiveIndex}) with thickness ${this.material.thickness}mm is inserted in the upper path.</p>`;
            html += `<p><strong>Phase shift:</strong> ${this.material.phaseShift.toFixed(1)}° affects the interference pattern. The material changes the optical path length, shifting the interference.</p>`;
            
            const d1Percent = ((this.stats.d1 / this.stats.total) * 100);
            const d2Percent = ((this.stats.d2 / this.stats.total) * 100);
            
            if (Math.abs(this.material.phaseShift % 360) < 10 || Math.abs(this.material.phaseShift % 360) > 350) {
                html += `<p>📊 Phase ≈ 0°: Constructive interference at D1 (${d1Percent.toFixed(0)}% detected)</p>`;
            } else if (Math.abs(this.material.phaseShift % 360 - 180) < 10) {
                html += `<p>📊 Phase ≈ 180°: Destructive interference at D1, constructive at D2 (${d2Percent.toFixed(0)}% at D2)</p>`;
            } else if (Math.abs(this.material.phaseShift % 360 - 90) < 15 || Math.abs(this.material.phaseShift % 360 - 270) < 15) {
                html += `<p>📊 Phase ≈ 90° or 270°: Balanced interference (~50/50 split)</p>`;
            }
        } else if (!hasPathInfo && !hasMaterial) {
            html += '<p>With no path detectors and no material, quantum interference is present. The paths interfere destructively at D2 and constructively at D1.</p>';
        } else if (hasPathInfo) {
            html += '<p>Path detectors are present - interference is destroyed. Photons behave as particles taking definite paths.</p>';
        }
        
        if (hasNoise) {
            html += `<p><strong>Environmental noise (${(this.noiseLevel * 100).toFixed(0)}%):</strong> Simulates vibrations and thermal fluctuations. This degrades measurement precision and reduces signal-to-noise ratio.</p>`;
        }
        
        if (this.streamMode) {
            html += `<p><strong>Stream mode:</strong> Continuous photon stream at ${this.streamIntensity} photons/sec. Watch the oscilloscope for real-time detection rates!</p>`;
        }
        
        document.getElementById('explanationText').innerHTML = html;
    },
    
    // ============================================
    // RESET
    // ============================================
    
    reset() {
        this.stats = {
            total: 0,
            d1: 0,
            d2: 0,
            pathUpper: 0,
            pathLower: 0
        };
        
        this.photonQueue = [];
        this.scopeData.d1 = [];
        this.scopeData.d2 = [];
        this.lastSecondD1 = 0;
        this.lastSecondD2 = 0;
        
        this.updateDisplay();
        this.drawOscilloscope();
        this.redraw();
        
        document.getElementById('explanationText').innerHTML = '<p>Configure the experiment and run photons to see results.</p>';
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    experiment.redraw();
    experiment.drawOscilloscope();
    experiment.drawInterferencePattern();
    experiment.updateWavelength(532);
    experiment.updateScopeExplanation();
    
    // Setup material type selector
    document.getElementById('materialType').addEventListener('change', function() {
        if (this.value === 'custom') {
            document.getElementById('customRefractiveIndex').style.display = 'block';
        } else {
            document.getElementById('customRefractiveIndex').style.display = 'none';
        }
        experiment.updateMaterial();
    });
});