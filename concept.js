// ============================================
// CONCEPT PAGE - System Diagram Animation
// ============================================

const canvas = document.getElementById('systemCanvas');
const ctx = canvas.getContext('2d');

// Colors
const NEON_CYAN = '#00fff9';
const NEON_BLUE = '#00d4ff';
const NEON_PURPLE = '#b026ff';
const TEXT_PRIMARY = '#e8edf4';
const TEXT_DIM = '#718096';

// Component positions
const components = {
    source: { x: 50, y: 200 },
    bs1: { x: 200, y: 200 },
    bs2: { x: 600, y: 200 },
    upperMirror: { x: 600, y: 80 },
    lowerMirror: { x: 600, y: 320 },
    d1: { x: 750, y: 150 },
    d2: { x: 750, y: 250 }
};

// Animation state
let animationFrame = 0;
const ANIMATION_SPEED = 2;

function drawComponent(x, y, type, label) {
    ctx.save();
    
    if (type === 'source') {
        // Photon source - glowing circle
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fillStyle = NEON_CYAN;
        ctx.fill();
        
        // Glow effect
        const gradient = ctx.createRadialGradient(x, y, 5, x, y, 25);
        gradient.addColorStop(0, 'rgba(0, 255, 249, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 249, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
    } 
    else if (type === 'beamsplitter') {
        // Beam splitter - angled line
        ctx.strokeStyle = NEON_BLUE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 20);
        ctx.lineTo(x + 20, y + 20);
        ctx.stroke();
        
        // Frame
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 25, y - 25, 50, 50);
    }
    else if (type === 'mirror') {
        // Mirror - perpendicular line
        ctx.strokeStyle = NEON_PURPLE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 15, y - 15);
        ctx.lineTo(x + 15, y + 15);
        ctx.stroke();
    }
    else if (type === 'detector') {
        // Detector - rectangle
        ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.fillRect(x - 15, y - 20, 30, 40);
        ctx.strokeStyle = NEON_CYAN;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 15, y - 20, 30, 40);
    }
    
    // Label
    ctx.fillStyle = TEXT_PRIMARY;
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 50);
    
    ctx.restore();
}

function drawPath(x1, y1, x2, y2, color, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    
    if (dashed) {
        ctx.setLineDash([5, 5]);
    }
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    ctx.restore();
}

function drawPhotonParticle(x, y) {
    ctx.save();
    
    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
    gradient.addColorStop(0, 'rgba(0, 255, 249, 1)');
    gradient.addColorStop(1, 'rgba(0, 255, 249, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Core
    ctx.fillStyle = NEON_CYAN;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function animate() {
    // Clear canvas
    ctx.fillStyle = '#141b2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all paths first (as guides)
    drawPath(components.source.x + 15, components.source.y, 
             components.bs1.x - 25, components.bs1.y, 
             'rgba(0, 255, 249, 0.3)');
    
    // Upper path
    drawPath(components.bs1.x, components.bs1.y - 20, 
             components.upperMirror.x, components.upperMirror.y + 15, 
             'rgba(0, 212, 255, 0.3)');
    drawPath(components.upperMirror.x - 15, components.upperMirror.y, 
             components.bs2.x, components.bs2.y - 20, 
             'rgba(0, 212, 255, 0.3)');
    
    // Lower path
    drawPath(components.bs1.x, components.bs1.y + 20, 
             components.lowerMirror.x, components.lowerMirror.y - 15, 
             'rgba(176, 38, 255, 0.3)');
    drawPath(components.lowerMirror.x - 15, components.lowerMirror.y, 
             components.bs2.x, components.bs2.y + 20, 
             'rgba(176, 38, 255, 0.3)');
    
    // To detectors
    drawPath(components.bs2.x + 25, components.bs2.y - 20, 
             components.d1.x - 15, components.d1.y, 
             'rgba(0, 255, 249, 0.3)');
    drawPath(components.bs2.x + 25, components.bs2.y + 20, 
             components.d2.x - 15, components.d2.y, 
             'rgba(0, 255, 249, 0.3)');
    
    // Draw components
    drawComponent(components.source.x, components.source.y, 'source', 'Photon Source');
    drawComponent(components.bs1.x, components.bs1.y, 'beamsplitter', 'Beam Splitter 1');
    drawComponent(components.bs2.x, components.bs2.y, 'beamsplitter', 'Beam Splitter 2');
    drawComponent(components.upperMirror.x, components.upperMirror.y, 'mirror', 'Mirror');
    drawComponent(components.lowerMirror.x, components.lowerMirror.y, 'mirror', 'Mirror');
    drawComponent(components.d1.x, components.d1.y, 'detector', 'Detector D1');
    drawComponent(components.d2.x, components.d2.y, 'detector', 'Detector D2');
    
    // Animate photon traveling through the system
    const cycle = 300; // frames for complete cycle
    const t = (animationFrame % cycle) / cycle;
    
    // Define path segments
    if (t < 0.15) {
        // Source to BS1
        const segmentT = t / 0.15;
        const x = components.source.x + 15 + segmentT * (components.bs1.x - 25 - components.source.x - 15);
        const y = components.source.y;
        drawPhotonParticle(x, y);
    } else if (t < 0.3) {
        // Split: show two photons on upper and lower paths (wave-like)
        const segmentT = (t - 0.15) / 0.15;
        
        // Upper path to mirror
        const ux = components.bs1.x + segmentT * (components.upperMirror.x - components.bs1.x);
        const uy = components.bs1.y - 20 + segmentT * (components.upperMirror.y + 15 - components.bs1.y + 20);
        drawPhotonParticle(ux, uy);
        
        // Lower path to mirror
        const lx = components.bs1.x + segmentT * (components.lowerMirror.x - components.bs1.x);
        const ly = components.bs1.y + 20 + segmentT * (components.lowerMirror.y - 15 - components.bs1.y - 20);
        drawPhotonParticle(lx, ly);
    } else if (t < 0.45) {
        // Mirror to BS2
        const segmentT = (t - 0.3) / 0.15;
        
        // Upper path
        const ux = components.upperMirror.x - 15 + segmentT * (components.bs2.x - components.upperMirror.x + 15);
        const uy = components.upperMirror.y + segmentT * (components.bs2.y - 20 - components.upperMirror.y);
        drawPhotonParticle(ux, uy);
        
        // Lower path
        const lx = components.lowerMirror.x - 15 + segmentT * (components.bs2.x - components.lowerMirror.x + 15);
        const ly = components.lowerMirror.y + segmentT * (components.bs2.y + 20 - components.lowerMirror.y);
        drawPhotonParticle(lx, ly);
    } else if (t < 0.6) {
        // BS2 to detector (recombined - show going to D1 due to interference)
        const segmentT = (t - 0.45) / 0.15;
        const x = components.bs2.x + 25 + segmentT * (components.d1.x - 15 - components.bs2.x - 25);
        const y = components.bs2.y - 20 + segmentT * (components.d1.y - components.bs2.y + 20);
        drawPhotonParticle(x, y);
    }
    
    // Add instructional text
    ctx.fillStyle = TEXT_DIM;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('The photon takes both paths simultaneously as a probability wave', canvas.width / 2, 380);
    
    animationFrame++;
    requestAnimationFrame(animate);
}

// Start animation when page loads
animate();
