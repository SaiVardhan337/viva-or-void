/* -------------------------------------------------------------
   SEMESTER SPRINT - GAME ENGINE
   Pure JS HTML5 Canvas game with procedurally generated retro
   visuals, Web Audio synth, and custom pixel-art loader.
   ------------------------------------------------------------- */

// --- Global Setup & Configuration ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Prevent image smoothing for crisp retro pixel-art rendering
ctx.imageSmoothingEnabled = false;

// HUD Elements
const hudElement = document.getElementById('hud');
const attendanceFill = document.getElementById('attendance-fill');
const commitsVal = document.getElementById('commits-val');
const distanceVal = document.getElementById('distance-val');
const attendanceLabelEl = document.querySelector('.attendance-container .hud-label');
const commitsLabelEl = document.querySelector('.hud-stats .hud-item .hud-label');

// Screens
const menuScreen = document.getElementById('menu-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const pauseScreen = document.getElementById('pause-screen');
const soundBtn = document.getElementById('sound-btn');
const sharmaRemarkEl = document.getElementById('sharma-remark');
const finalDistanceEl = document.getElementById('final-distance');
const finalCommitsEl = document.getElementById('final-commits');
const highScoreEl = document.getElementById('high-score');
const pauseToggleBtn = document.getElementById('pause-toggle-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// Campaign Selector Selectors
const campaignBtnCommute = document.getElementById('campaign-btn-commute');
const campaignBtnPlacement = document.getElementById('campaign-btn-placement');
let selectedCampaign = localStorage.getItem('btech-campaign') || 'commute';

// Game States
let gameState = 'MENU'; // MENU, PLAYING, PLAYING_L2, GAMEOVER, PAUSED, WIN, WIN_L1, NOTIF
let currentLevel = 1;
let distance = 0;
let commits = 0;
let collectiblesCount = 0;
let attendance = 100; // Full attendance — starting fresh!
let vivaProgress = 0;
const distanceLabel = document.getElementById('distance-label');
let highScore = parseInt(localStorage.getItem('btech_high_score') || '0', 10);
let notifTimer = 0; // Countdown while notification is shown
let notifMilestone = 0; // which 500m milestone triggered
let nextNotifAt = 500; // Next distance milestone to trigger notification
let gameSpeed = 5;
const baseSpeed = 5;
const maxSpeed = 12;
let groundOffset = 0; // Added for smooth pavement/road scrolling

// Vardhan Sprite coordinates on 1024x1024 canvas
const SPRITE_MAP = {
    run: [
        { x: 6, y: 6, w: 242, h: 328 },
        { x: 260, y: 6, w: 242, h: 328 },
        { x: 514, y: 6, w: 242, h: 328 },
        { x: 768, y: 6, w: 248, h: 328 }
    ],
    jump: { x: 528, y: 364, w: 180, h: 285 },
    slide: { x: 575, y: 800, w: 280, h: 180 },
    hurt: { x: 324, y: 408, w: 160, h: 260 }
};

// Character Spritesheet Setup (Varsity Jacket Hero)
const spriteSheet = new Image();
spriteSheet.src = 'assets/vardhan_spritesheet.jpg';
let isSpriteSheetLoaded = false;
let transparentSpriteCanvas = null;

spriteSheet.onload = () => {
    isSpriteSheetLoaded = true;
    processSpriteSheet();
};

function processSpriteSheet() {
    transparentSpriteCanvas = document.createElement('canvas');
    transparentSpriteCanvas.width = spriteSheet.width;
    transparentSpriteCanvas.height = spriteSheet.height;
    const tempCtx = transparentSpriteCanvas.getContext('2d');
    tempCtx.drawImage(spriteSheet, 0, 0);

    const imgData = tempCtx.getImageData(0, 0, spriteSheet.width, spriteSheet.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If it's near-white, make it transparent
        if (r > 230 && g > 230 && b > 230) {
            data[i + 3] = 0;
        } else {
            // Lighten skin tones to match fair skin tone requirement
            if (r > 120 && g > 70 && b > 40 && r > g && g > b && r - b > 30 && r < 220) {
                data[i]     = Math.min(255, r + 100);
                data[i + 1] = Math.min(255, g + 90);
                data[i + 2] = Math.min(255, b + 80);
            }
        }
    }
    tempCtx.putImageData(imgData, 0, 0);
}

// Level 4 Gardens Background Image
const gardensBgImage = new Image();
gardensBgImage.src = 'assets/gardens_bg.jpg';
let isGardensBgLoaded = false;
gardensBgImage.onload = () => { isGardensBgLoaded = true; };

// Level 4 Campus Greenery Background (appears after 250m)
const campusGreeneryBgImage = new Image();
campusGreeneryBgImage.src = 'assets/campus_greenery_bg.jpg';
let isCampusGreeneryBgLoaded = false;
campusGreeneryBgImage.onload = () => { isCampusGreeneryBgLoaded = true; };

// Level 4 Peer Blocker Image
const peerImage = new Image();
peerImage.src = 'assets/peer.jpg';
let isPeerLoaded = false;
let transparentPeerCanvas = null;
peerImage.onload = () => {
    isPeerLoaded = true;
    processPeerImage();
};

// Level 4 Security Guard Image
const securityImage = new Image();
securityImage.src = 'assets/security.jpg';
let isSecurityLoaded = false;
let transparentSecurityCanvas = null;
securityImage.onload = () => {
    isSecurityLoaded = true;
    processSecurityImage();
};

// Level 4 Resume Collectible Image
const resumeImage = new Image();
resumeImage.src = 'assets/resume.jpg';
let isResumeLoaded = false;
let transparentResumeCanvas = null;
resumeImage.onload = () => {
    isResumeLoaded = true;
    processResumeImage();
};

// Level 4 Flyer Obstacle Image
const flyerImage = new Image();
flyerImage.src = 'assets/placement_flyer.jpg';
let isFlyerLoaded = false;
let transparentFlyerCanvas = null;
flyerImage.onload = () => {
    isFlyerLoaded = true;
    processFlyerImage();
};

function processPeerImage() {
    transparentPeerCanvas = document.createElement('canvas');
    transparentPeerCanvas.width = peerImage.width;
    transparentPeerCanvas.height = peerImage.height;
    const tempCtx = transparentPeerCanvas.getContext('2d');
    tempCtx.drawImage(peerImage, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, peerImage.width, peerImage.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 210 && data[i + 1] > 210 && data[i + 2] > 210) data[i + 3] = 0;
    }
    tempCtx.putImageData(imgData, 0, 0);
}

function processSecurityImage() {
    transparentSecurityCanvas = document.createElement('canvas');
    transparentSecurityCanvas.width = securityImage.width;
    transparentSecurityCanvas.height = securityImage.height;
    const tempCtx = transparentSecurityCanvas.getContext('2d');
    tempCtx.drawImage(securityImage, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, securityImage.width, securityImage.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 210 && data[i + 1] > 210 && data[i + 2] > 210) data[i + 3] = 0;
    }
    tempCtx.putImageData(imgData, 0, 0);
}

function processResumeImage() {
    transparentResumeCanvas = document.createElement('canvas');
    transparentResumeCanvas.width = resumeImage.width;
    transparentResumeCanvas.height = resumeImage.height;
    const tempCtx = transparentResumeCanvas.getContext('2d');
    tempCtx.drawImage(resumeImage, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, resumeImage.width, resumeImage.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) data[i + 3] = 0;
    }
    tempCtx.putImageData(imgData, 0, 0);
}

function processFlyerImage() {
    transparentFlyerCanvas = document.createElement('canvas');
    transparentFlyerCanvas.width = flyerImage.width;
    transparentFlyerCanvas.height = flyerImage.height;
    const tempCtx = transparentFlyerCanvas.getContext('2d');
    tempCtx.drawImage(flyerImage, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, flyerImage.width, flyerImage.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) data[i + 3] = 0;
    }
    tempCtx.putImageData(imgData, 0, 0);
}

// Dog Sprite Setup (Light background transparency filter)
const dogImage = new Image();
dogImage.src = 'assets/dog.png';
let isDogImageLoaded = false;
let transparentDogCanvas = null;

// Cow Sprite Setup (Light background transparency filter)
const cowImage = new Image();
cowImage.src = 'assets/cow.png';
let isCowImageLoaded = false;
let transparentCowCanvas = null;

// (Old classroom image logic removed)

// Corridor Background Image (Level 2, 0 to 450m)
const corridorImage = new Image();
corridorImage.src = 'assets/corridor.jpg';
let isCorridorLoaded = false;
corridorImage.onload = () => { isCorridorLoaded = true; };

// Level 3 Classroom Lab Background Image
const classroomLevel3Image = new Image();
classroomLevel3Image.src = 'assets/classroom_level3.png';
let isClassroomLevel3Loaded = false;
classroomLevel3Image.onload = () => { isClassroomLevel3Loaded = true; };

// Professor Boss Sprite Image
const professorImage = new Image();
professorImage.src = 'assets/professor.png';
let isProfessorLoaded = false;
let transparentProfessorCanvas = null;



dogImage.onload = () => {
    isDogImageLoaded = true;
    processDogImage();
};

cowImage.onload = () => {
    isCowImageLoaded = true;
    processCowImage();
};

professorImage.onload = () => {
    isProfessorLoaded = true;
    processProfessorImage();
};

function processProfessorImage() {
    transparentProfessorCanvas = document.createElement('canvas');
    transparentProfessorCanvas.width = professorImage.width;
    transparentProfessorCanvas.height = professorImage.height;
    const tempCtx = transparentProfessorCanvas.getContext('2d');
    tempCtx.drawImage(professorImage, 0, 0);

    const imgData = tempCtx.getImageData(0, 0, professorImage.width, professorImage.height);
    const data = imgData.data;

    // Filter white pixels (RGB close to 255)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
        }
    }
    tempCtx.putImageData(imgData, 0, 0);
}

function processDogImage() {
    transparentDogCanvas = document.createElement('canvas');
    transparentDogCanvas.width = dogImage.width;
    transparentDogCanvas.height = dogImage.height;
    const tempCtx = transparentDogCanvas.getContext('2d');
    tempCtx.drawImage(dogImage, 0, 0);

    const imgData = tempCtx.getImageData(0, 0, dogImage.width, dogImage.height);
    const data = imgData.data;

    // Filter white pixels (RGB close to 255)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
        }
    }
    tempCtx.putImageData(imgData, 0, 0);
}

function processCowImage() {
    transparentCowCanvas = document.createElement('canvas');
    transparentCowCanvas.width = cowImage.width;
    transparentCowCanvas.height = cowImage.height;
    const tempCtx = transparentCowCanvas.getContext('2d');
    tempCtx.drawImage(cowImage, 0, 0);

    const imgData = tempCtx.getImageData(0, 0, cowImage.width, cowImage.height);
    const data = imgData.data;

    // Filter white pixels (RGB close to 255)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
        }
    }
    tempCtx.putImageData(imgData, 0, 0);
}



// --- Web Audio API Synth Engine ---
class AudioSynth {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('btech-muted') !== 'false'; // Defaults to true (muted)
        this.seqTimer = null;
        this.seqIndex = 0;
        
        // Chaotic-Peaceful mixed music box arrays (32 steps chord progression)
        // Soft low pentatonic chords (A minor 7, C major 7, E minor, G major)
        this.bassline = [
            110.00, 0, 110.00, 0, 130.81, 0, 130.81, 0, // Am7
            146.83, 0, 146.83, 0, 164.81, 0, 196.00, 0, // D/E/G
            110.00, 0, 110.00, 0, 196.00, 0, 196.00, 0, // G/Am
            164.81, 0, 146.83, 0, 130.81, 0, 98.00, 0   // Descending pass
        ];
        this.melody = [
            440.00, 0, 523.25, 587.33, 659.25, 0, 783.99, 0,
            0, 659.25, 523.25, 0, 587.33, 440.00, 0, 392.00,
            329.63, 0, 392.00, 0, 440.00, 523.25, 587.33, 659.25,
            0, 0, 523.25, 0, 392.00, 329.63, 293.66, 0
        ];
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('btech-muted', this.muted);
        if (this.muted) {
            soundBtn.textContent = 'MUTED';
            soundBtn.classList.remove('unmuted');
            this.stopBGM();
        } else {
            soundBtn.textContent = 'SOUND ON';
            soundBtn.classList.add('unmuted');
            this.init();
            this.startBGM();
            // Resume context if suspended
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }
    }

    playJump() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playSlide() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Synthesize noise for sliding on road
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.linearRampToValueAtTime(200, now + 0.25);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start(now);
    }

    playCollect() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
        
        osc.start(now);
        osc.stop(now + 0.22);
    }

    playHit() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.3);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playGameOver() {
        if (this.muted) return;
        this.init();
        this.stopBGM();
        const now = this.ctx.currentTime;
        const sadNotes = [392.00, 349.23, 311.13, 261.63, 196.00]; // G4, F4, D#4, C4, G3
        
        sadNotes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.08, now + idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);
            
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.25);
        });
    }

    playDogBark() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // "Bow-bow!" - Two quick, realistic retro barks
        this.triggerSingleBark(now);
        this.triggerSingleBark(now + 0.12);
    }

    triggerSingleBark(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, time);
        osc.frequency.exponentialRampToValueAtTime(90, time + 0.08);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(380, time);
        
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.03, time);
        noiseGain.gain.linearRampToValueAtTime(0.001, time + 0.08);
        
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.linearRampToValueAtTime(0.001, time + 0.08);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        
        osc.start(time);
        osc.stop(time + 0.08);
        noise.start(time);
    }

    playWinSound() {
        if (this.muted) return;
        this.init();
        this.stopBGM();
        const now = this.ctx.currentTime;
        const winNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6 (victory arpeggio)
        winNotes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.08, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.35);
        });
    }

    startBGM() {
        if (this.muted) return;
        this.stopBGM();
        this.seqIndex = 0;
        
        // Slower, peaceful tempo (~58 BPM, 260ms per step)
        const stepTime = 260; 
        this.seqTimer = setInterval(() => {
            if (this.muted || gameState !== 'PLAYING') return;
            this.playSequenceStep();
        }, stepTime);
    }

    stopBGM() {
        if (this.seqTimer) {
            clearInterval(this.seqTimer);
            this.seqTimer = null;
        }
    }

    playSequenceStep() {
        const now = this.ctx.currentTime;
        
        // 1. Play Soft Bass Note (Triangle wave, lowpassed for warmth)
        const bassFreq = this.bassline[this.seqIndex % this.bassline.length];
        if (bassFreq > 0) {
            const bOsc = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            const bFilter = this.ctx.createBiquadFilter();
            
            bOsc.type = 'triangle';
            bOsc.frequency.setValueAtTime(bassFreq, now);
            
            bFilter.type = 'lowpass';
            bFilter.frequency.setValueAtTime(250, now); // Cut off harsh harmonics
            
            bGain.gain.setValueAtTime(0.04, now); // Soft background volume
            bGain.gain.linearRampToValueAtTime(0.001, now + 0.22);
            
            bOsc.connect(bFilter);
            bFilter.connect(bGain);
            bGain.connect(this.ctx.destination);
            
            bOsc.start(now);
            bOsc.stop(now + 0.22);
        }

        // 2. Play Peaceful Melody Note (Sine wave for ambient music-box styling)
        const melFreq = this.melody[this.seqIndex % this.melody.length];
        if (melFreq > 0) {
            const mOsc = this.ctx.createOscillator();
            const mGain = this.ctx.createGain();
            
            mOsc.type = 'sine'; // Pure, warm tone that prevents headaches
            mOsc.frequency.setValueAtTime(melFreq, now);
            
            mGain.gain.setValueAtTime(0.015, now); // Gentle, subtle level
            mGain.gain.linearRampToValueAtTime(0.001, now + 0.24);
            
            mOsc.connect(mGain);
            mGain.connect(this.ctx.destination);
            
            mOsc.start(now);
            mOsc.stop(now + 0.24);
        }

        // 3. Play Chaotic digital textures (15% chance of light 'CS compiling bubble' glitch pings)
        if (Math.random() < 0.15) {
            const gOsc = this.ctx.createOscillator();
            const gGain = this.ctx.createGain();
            
            gOsc.type = 'sine';
            const startFreq = 600 + Math.random() * 600;
            gOsc.frequency.setValueAtTime(startFreq, now);
            gOsc.frequency.exponentialRampToValueAtTime(startFreq * 2, now + 0.05);
            
            gGain.gain.setValueAtTime(0.006, now); // Extremely quiet ambient texture
            gGain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
            
            gOsc.connect(gGain);
            gGain.connect(this.ctx.destination);
            
            gOsc.start(now);
            gOsc.stop(now + 0.05);
        }

        // 4. Subtle, soft percussive noise hi-hat (on beat 4 for structure, very quiet)
        if (this.seqIndex % 8 === 4) {
            const bufferSize = this.ctx.sampleRate * 0.03;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(8000, now); // soft high rattle
            
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.008, now); // barely audible
            gain.gain.linearRampToValueAtTime(0.0001, now + 0.03);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            
            noise.start(now);
        }

        this.seqIndex++;
    }
}

const synth = new AudioSynth();
soundBtn.addEventListener('click', () => synth.toggleMute());

// --- Parallax Scrolling Background Elements ---
class BackgroundLayer {
    constructor(speedFactor, drawCallback, customWidth = null) {
        this.speedFactor = speedFactor;
        this.drawCallback = drawCallback;
        this.offset = 0;
        this.customWidth = customWidth;
    }

    update() {
        if (gameState === 'PLAYING') {
            const w = this.customWidth || canvas.width;
            this.offset = (this.offset + gameSpeed * this.speedFactor) % w;
        }
    }

    draw() {
        const w = this.customWidth || canvas.width;
        ctx.save();
        ctx.translate(-this.offset, 0);
        this.drawCallback(0);
        ctx.translate(w, 0);
        this.drawCallback(w);
        ctx.restore();
    }
}

const bgLayers = [
    // Layer 0: Sky, Sun and Clouds (Distant daylight / Moonlight night)
    new BackgroundLayer(0.05, (xOffset) => {
        // Dark mode only affects UI, NOT in-game sky — sky is always daytime
        const isDark = false;
        
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        if (isDark) {
            gradient.addColorStop(0, '#0a0b12'); // Deep starry night sky
            gradient.addColorStop(1, '#1b1d2e');
        } else {
            gradient.addColorStop(0, currentLevel === 2 ? '#b3d9f7' : '#7ac2f0');
            gradient.addColorStop(1, currentLevel === 2 ? '#daeeff' : '#bee1f7');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 250);

        if (isDark) {
            // Draw Stars in the sky
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(80, 40, 2, 2);
            ctx.fillRect(150, 80, 3, 3);
            ctx.fillRect(240, 50, 2, 2);
            ctx.fillRect(320, 90, 2, 2);
            ctx.fillRect(450, 30, 3, 3);
            ctx.fillRect(520, 70, 2, 2);
            ctx.fillRect(710, 60, 2, 2);

            // Blocky Silver Moon
            ctx.fillStyle = '#e5e9f0'; // Silver moon body
            ctx.fillRect(620, 30, 48, 48);
            ctx.fillStyle = '#d8dee9'; // Moon craters / highlights
            ctx.fillRect(628, 38, 12, 12);
            ctx.fillRect(644, 54, 10, 10);
            
            // Moon glow
            ctx.fillStyle = 'rgba(229, 233, 240, 0.15)';
            ctx.fillRect(610, 40, 8, 28);
            ctx.fillRect(670, 40, 8, 28);
            ctx.fillRect(630, 20, 28, 8);
            ctx.fillRect(630, 80, 28, 8);
        } else {
            // Pixelated Sun (with 8-bit rays)
            ctx.fillStyle = '#ffdf00'; // Yellow
            ctx.fillRect(620, 30, 48, 48);
            ctx.fillStyle = '#ff9900'; // Orange outline
            ctx.strokeRect(620, 30, 48, 48);
            // Sun rays blocky highlights
            ctx.fillStyle = 'rgba(255, 223, 0, 0.4)';
            ctx.fillRect(610, 40, 8, 28);
            ctx.fillRect(670, 40, 8, 28);
            ctx.fillRect(630, 20, 28, 8);
            ctx.fillRect(630, 80, 28, 8);
        }

        // Distant Town Skyline / Hills
        if (isDark) {
            ctx.fillStyle = currentLevel === 2 ? '#242e3f' : '#1b2535'; // dark blue-grey trees
            ctx.fillRect(0, 200, canvas.width, 60);
            
            ctx.fillStyle = currentLevel === 2 ? '#1c2533' : '#141c29';
        } else {
            ctx.fillStyle = currentLevel === 2 ? '#a5c98a' : '#7eb87e';
            ctx.fillRect(0, 200, canvas.width, 60);
            
            ctx.fillStyle = currentLevel === 2 ? '#85a868' : '#659c65';
        }
        for (let i = 0; i < canvas.width; i += 120) {
            ctx.beginPath();
            ctx.moveTo(i, 200);
            ctx.lineTo(i + 30, 180);
            ctx.lineTo(i + 60, 200);
            ctx.fill();
        }
    }),

    // Layer 1: Indian Town Buildings + College Campus (Level 1 only, 1600px loop)
    new BackgroundLayer(0.3, (xOffset) => {
        if (currentLevel !== 1) return; // Level 1 only

        // --- PART A: INDIAN TOWN BUILDINGS (0 to 800) ---
        // --- 1. Building A: Yellow "ROOMS Available" Hotel ---
        const ax = 20;
        ctx.fillStyle = '#f6d258'; // Yellow building
        ctx.fillRect(ax, 50, 120, 215);
        ctx.fillStyle = '#dcae2a'; // Top trim
        ctx.fillRect(ax - 4, 45, 128, 6);
        // Arched Windows
        ctx.fillStyle = '#5d4037'; // Frame
        ctx.fillRect(ax + 20, 85, 32, 50);
        ctx.fillRect(ax + 68, 85, 32, 50);
        ctx.fillStyle = '#cceeff'; // Pane
        ctx.beginPath();
        ctx.arc(ax + 36, 105, 12, Math.PI, 0);
        ctx.arc(ax + 84, 105, 12, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(ax + 24, 105, 24, 26);
        ctx.fillRect(ax + 72, 105, 24, 26);
        // Vertical Signboard: "ROOMS"
        ctx.fillStyle = '#ff2d55'; // Neon pink vertical board
        ctx.fillRect(ax + 104, 70, 20, 90);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText("R", ax + 110, 85);
        ctx.fillText("O", ax + 110, 103);
        ctx.fillText("O", ax + 110, 121);
        ctx.fillText("M", ax + 110, 139);
        ctx.fillText("S", ax + 110, 157);

        // --- 2. Building B: Jain Mandir Style "GIFTS & FABRICS" Shop ---
        const bx = 160;
        ctx.fillStyle = '#eaeaea'; // Pale grey building
        ctx.fillRect(bx, 70, 150, 195);
        ctx.fillStyle = '#d2d2d2'; // Domes
        ctx.fillRect(bx + 15, 60, 30, 10);
        ctx.fillRect(bx + 105, 60, 30, 10);
        ctx.fillStyle = '#f6d258'; // Gold peaks
        ctx.fillRect(bx + 28, 50, 4, 10);
        ctx.fillRect(bx + 118, 50, 4, 10);
        // Blue & Yellow Striped Awning
        const awningY = 140;
        ctx.fillStyle = '#0066cc'; // Blue base
        ctx.fillRect(bx - 10, awningY, 170, 12);
        ctx.fillStyle = '#fff000'; // Yellow stripes
        for (let s = bx - 10; s < bx + 160; s += 20) {
            ctx.fillRect(s, awningY, 10, 12);
        }
        // Hanging textiles
        const fabrics = ['#ff3399', '#00f0ff', '#39ff14', '#fff000', '#ff5722'];
        for (let f = 0; f < 5; f++) {
            ctx.fillStyle = fabrics[f];
            ctx.fillRect(bx + 15 + f * 25, awningY + 12, 18, 45);
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; // horizontal strip details
            ctx.fillRect(bx + 15 + f * 25, awningY + 22, 18, 4);
            ctx.fillRect(bx + 15 + f * 25, awningY + 42, 18, 4);
        }
        // Horizontal Sign Board
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(bx + 30, 100, 90, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText("GIFTS", bx + 55, 114);

        // --- 3. Building C: Red-tile "SWEETS & SAMOSA" Shop ---
        const cx = 330;
        ctx.fillStyle = '#ef9a9a'; // Soft red structure
        ctx.fillRect(cx, 90, 140, 175);
        // Awning (Red & White)
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(cx - 5, 130, 150, 12);
        ctx.fillStyle = '#ffffff';
        for (let s = cx - 5; s < cx + 145; s += 20) {
            ctx.fillRect(s, 130, 10, 12);
        }
        // Sign board
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(cx + 15, 105, 110, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText("SWEETS", cx + 38, 118);
        // Shop counter
        ctx.fillStyle = '#8d6e63'; // Wood counter
        ctx.fillRect(cx + 10, 180, 120, 45);
        // Yellow pixel piles (samosas/laddoos)
        ctx.fillStyle = '#ffb300';
        ctx.fillRect(cx + 20, 172, 15, 8);
        ctx.fillRect(cx + 24, 168, 7, 4);
        ctx.fillStyle = '#ff8f00';
        ctx.fillRect(cx + 80, 170, 25, 10);

        // --- 4. Building D: Green "XEROX" Building ---
        const dx = 490;
        ctx.fillStyle = '#81c784'; // Soft green
        ctx.fillRect(dx, 80, 130, 185);
        // Upper floor windows
        ctx.fillStyle = '#263238';
        ctx.fillRect(dx + 20, 110, 30, 40);
        ctx.fillRect(dx + 80, 110, 30, 40);
        ctx.fillStyle = '#b0bec5';
        ctx.fillRect(dx + 23, 113, 24, 34);
        ctx.fillRect(dx + 83, 113, 24, 34);
        // Green Xerox banner sign
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(dx + 10, 165, 110, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText("XEROX", dx + 42, 178);
        
        // --- 5. Building E: Blue "CYBER CAFE" ---
        const ex = 640;
        ctx.fillStyle = '#64b5f6'; // Light blue
        ctx.fillRect(ex, 60, 140, 205);
        // Computer screens visible in upper window
        ctx.fillStyle = '#1565c0';
        ctx.fillRect(ex + 15, 90, 110, 45);
        // Glowing screens
        ctx.fillStyle = '#e3f2fd';
        for(let c = 0; c < 3; c++) {
            ctx.fillRect(ex + 20 + c * 35, 100, 25, 20);
            ctx.fillStyle = '#000000';
            ctx.fillRect(ex + 25 + c * 35, 105, 15, 10); // inner screen
            ctx.fillStyle = '#e3f2fd';
        }
        // Cyber Cafe neon sign
        ctx.fillStyle = '#111111';
        ctx.fillRect(ex + 10, 145, 120, 22);
        ctx.fillStyle = '#00e5ff'; // Neon cyan
        ctx.fillText("CYBER CAFE", ex + 18, 160);


        // --- PART B: COLLEGE CAMPUS BUILDINGS (800 to 1600) ---
        ctx.save();
        ctx.translate(800, 0); // Shift drawing context by 800px

        // --- College Main Building (Large grey multi-storey block) ---
        const cb = 80; // start x
        // Main structure
        ctx.fillStyle = '#c8cdd8'; // Light grey concrete
        ctx.fillRect(cb, 40, 380, 225);
        // Building depth shadow on right
        ctx.fillStyle = '#a0a8b8';
        ctx.fillRect(cb + 370, 40, 30, 225);
        // Roof edge detail
        ctx.fillStyle = '#8892a8';
        ctx.fillRect(cb - 4, 36, 412, 8);
        // Windows (5 columns x 4 rows)
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 5; col++) {
                const wx = cb + 30 + col * 68;
                const wy = 60 + row * 50;
                // Window frame
                ctx.fillStyle = '#6a7285';
                ctx.fillRect(wx - 2, wy - 2, 38, 36);
                // Window pane
                ctx.fillStyle = '#b8d4e8';
                ctx.fillRect(wx, wy, 34, 32);
                // Reflection
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(wx + 2, wy + 2, 8, 12);
                ctx.fillRect(wx + 2, wy + 2, 30, 3);
            }
        }
        // Main entrance gate
        ctx.fillStyle = '#7a8098';
        ctx.fillRect(cb + 160, 190, 60, 75);
        ctx.fillStyle = '#4a5068';
        ctx.fillRect(cb + 165, 195, 50, 70);
        ctx.fillStyle = '#c8a000'; // Gold door handle
        ctx.fillRect(cb + 208, 235, 4, 10);
        // College name board on building
        ctx.fillStyle = '#2c3e7a'; // Dark navy board
        ctx.fillRect(cb + 50, 170, 280, 20);
        ctx.fillStyle = '#fff9c4';
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText('DEPT OF COMPUTER SCIENCE & ENGG', cb + 58, 183);

        // --- Side wing B (smaller block right) ---
        const sb = cb + 430;
        ctx.fillStyle = '#d2d8e0';
        ctx.fillRect(sb, 80, 200, 185);
        ctx.fillStyle = '#a8b0bc';
        ctx.fillRect(sb + 190, 80, 20, 185);
        // Balcony rails (pixel style)
        for (let row = 0; row < 3; row++) {
            const ry = 100 + row * 55;
            ctx.fillStyle = '#8890a0';
            ctx.fillRect(sb + 10, ry, 180, 5); // rail beam
            for (let c = 0; c < 9; c++) {
                ctx.fillStyle = '#9098a8';
                ctx.fillRect(sb + 15 + c * 19, ry, 4, 15); // balusters
            }
        }
        // Side building windows
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const wx = sb + 20 + col * 58;
                const wy = 90 + row * 55;
                ctx.fillStyle = '#7080a0';
                ctx.fillRect(wx, wy, 36, 28);
                ctx.fillStyle = '#a8c8e0';
                ctx.fillRect(wx + 2, wy + 2, 32, 24);
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(wx + 3, wy + 3, 8, 8);
            }
        }
        // College sign at entrance
        ctx.fillStyle = '#1a237e'; // dark blue signboard
        ctx.fillRect(cb + 100, 20, 200, 16);
        ctx.fillStyle = '#ffee58'; // yellow letters
        ctx.font = '5px "Press Start 2P"';
        ctx.fillText('BITS PILANI - TECH FEST 2024', cb + 108, 31);

        // Campus grass strip at bottom of buildings
        ctx.fillStyle = '#7fc46a';
        ctx.fillRect(cb, 262, 620, 10);
        // Grass pixel detail
        ctx.fillStyle = '#5aab45';
        for (let gx = cb; gx < cb + 620; gx += 12) {
            ctx.fillRect(gx, 258, 6, 6);
        }
        
        ctx.restore();
    }, 1600),

    // Layer 2: Foreground Electric Poles & Trees (Foreground depth)
    new BackgroundLayer(0.6, (xOffset) => {
        // --- 1. Foreground Trees ---
        const drawTree = (tx, ty) => {
            // Trunk
            ctx.fillStyle = '#5d4037'; // brown
            ctx.fillRect(tx + 16, ty - 60, 12, 60);
            
            // Foliage (8-bit layered leaves)
            ctx.fillStyle = currentLevel === 2 ? '#388e3c' : '#2e7d32'; // campus trees are brighter
            ctx.fillRect(tx, ty - 110, 44, 50);
            ctx.fillRect(tx + 6, ty - 125, 32, 15);
            ctx.fillRect(tx - 6, ty - 95, 56, 30);
            
            // Leaf highlights
            ctx.fillStyle = currentLevel === 2 ? '#66bb6a' : '#4caf50';
            ctx.fillRect(tx + 4, ty - 105, 12, 12);
            ctx.fillRect(tx + 22, ty - 90, 16, 12);
            ctx.fillRect(tx + 12, ty - 120, 8, 8);
        };

        drawTree(20, 260);
        drawTree(400, 260);
        drawTree(580, 260);

        // Level 2: Campus benches & notice board instead of electric poles
        if (currentLevel === 2) {
            // Campus wooden bench
            const drawBench = (bx) => {
                ctx.fillStyle = '#795548'; // Brown wood seat
                ctx.fillRect(bx, 220, 60, 8);
                ctx.fillStyle = '#6d4c41'; // Darker legs
                ctx.fillRect(bx + 5, 228, 8, 24);
                ctx.fillRect(bx + 47, 228, 8, 24);
                ctx.fillStyle = '#8d6e63'; // Backrest
                ctx.fillRect(bx, 210, 60, 6);
                ctx.fillRect(bx + 5, 204, 8, 8);
                ctx.fillRect(bx + 47, 204, 8, 8);
            };
            drawBench(120);
            drawBench(550);

            // Notice board on campus
            ctx.fillStyle = '#4a3728'; // Dark brown frame
            ctx.fillRect(310, 130, 80, 100);
            ctx.fillStyle = '#8d6e4a'; // Corkboard
            ctx.fillRect(314, 134, 72, 76);
            // Pinned papers
            const colors = ['#fff9c4', '#e1f5fe', '#fce4ec', '#e8f5e9'];
            for (let pi = 0; pi < 4; pi++) {
                ctx.fillStyle = colors[pi];
                ctx.fillRect(316 + (pi % 2) * 34, 136 + Math.floor(pi / 2) * 36, 28, 28);
                // Thumbtack
                ctx.fillStyle = '#f44336';
                ctx.fillRect(328 + (pi % 2) * 34, 138 + Math.floor(pi / 2) * 36, 4, 4);
            }
            // Support pole
            ctx.fillStyle = '#607d8b';
            ctx.fillRect(346, 230, 8, 32);
        } else {
            // Level 1: Electric Poles & Sagging Cables (Indian style street details)
            const poleY = 40;
            const poleH = 220;

            const drawPole = (px) => {
                ctx.fillStyle = '#78909c';
                ctx.fillRect(px, poleY, 8, poleH);
                ctx.fillStyle = '#37474f';
                ctx.fillRect(px - 20, poleY + 15, 48, 5);
                ctx.fillRect(px - 15, poleY + 30, 38, 5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(px - 16, poleY + 9, 4, 6);
                ctx.fillRect(px + 20, poleY + 9, 4, 6);
                ctx.fillRect(px - 10, poleY + 24, 4, 6);
                ctx.fillRect(px + 10, poleY + 24, 4, 6);
            };

            const px1 = 220;
            const px2 = 700;
            drawPole(px1);
            drawPole(px2);

            // Add Streetlights
            const drawStreetlight = (sx) => {
                // Post
                ctx.fillStyle = '#9e9e9e'; // Grey metal
                ctx.fillRect(sx, 60, 6, 200); // taller post
                // Arm
                ctx.fillStyle = '#757575';
                ctx.fillRect(sx - 25, 60, 30, 4);
                // Lamp head
                ctx.fillStyle = '#424242';
                ctx.fillRect(sx - 35, 56, 16, 8);
                // Yellow light glow
                ctx.fillStyle = '#fff59d';
                ctx.fillRect(sx - 33, 64, 12, 4);
                // Glow aura
                ctx.fillStyle = 'rgba(255, 245, 157, 0.15)';
                ctx.beginPath();
                ctx.arc(sx - 27, 68, 50, 0, Math.PI);
                ctx.fill();
            };
            
            drawStreetlight(100);
            drawStreetlight(500);

            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(px1 - 14, poleY + 9);
            ctx.quadraticCurveTo((px1 + px2)/2, poleY + 50, px2 - 14, poleY + 9);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(px1 + 22, poleY + 9);
            ctx.quadraticCurveTo((px1 + px2)/2, poleY + 55, px2 + 22, poleY + 9);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(px1 - 8, poleY + 24);
            ctx.quadraticCurveTo((px1 + px2)/2, poleY + 65, px2 - 8, poleY + 24);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(px1 - 14, poleY + 9);
            ctx.quadraticCurveTo(px1 / 2, poleY + 60, 0, poleY + 35);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(px2 + 22, poleY + 9);
            ctx.quadraticCurveTo(px2 + (800 - px2)/2, poleY + 60, 800, poleY + 35);
            ctx.stroke();
        }
    })
];

// --- Player Object (Vardhan) ---
const player = {
    x: 80,
    y: 200,
    width: 60,
    height: 80,
    spriteW: 64, // visual sizes
    spriteH: 80,
    
    // Physics
    vy: 0,
    gravity: 0.72,
    jumpForce: -13.5,
    doubleJumpForce: -11.0,
    groundY: 260,
    
    // States
    isJumping: false,
    canDoubleJump: false,
    isSliding: false,
    slideTimer: 0,
    slideDuration: 40, // frames
    
    // Animation
    animFrame: 0,
    animTick: 0,
    animSpeed: 5, // Ticks per frame
    
    // Hitbox offsets (makes the collision detection feel fair)
    getHitbox() {
        if (this.isSliding) {
            return {
                x: this.x + 8,
                y: this.y + 40,
                w: this.width - 12,
                h: this.height - 40
            };
        }
        return {
            x: this.x + 12,
            y: this.y + 8,
            w: this.width - 24,
            h: this.height - 12
        };
    },

    reset() {
        this.y = this.groundY;
        this.vy = 0;
        this.isJumping = false;
        this.canDoubleJump = false;
        this.isSliding = false;
        this.animFrame = 0;
        this.animTick = 0;
    },

    jump() {
        if (this.isSliding) return;
        
        if (!this.isJumping) {
            this.vy = this.jumpForce;
            this.isJumping = true;
            this.canDoubleJump = true;
            synth.playJump();
            spawnDust(this.x + 10, this.y + this.height, 8);
        } else if (this.canDoubleJump) {
            this.vy = this.doubleJumpForce;
            this.canDoubleJump = false;
            synth.playJump();
            spawnDust(this.x + 10, this.y + 20, 6);
        }
    },

    slide() {
        if (this.isJumping) {
            // fast drop / slam down
            this.vy = 12;
            return;
        }
        if (!this.isSliding) {
            this.isSliding = true;
            this.slideTimer = this.slideDuration;
            synth.playSlide();
            spawnDust(this.x + 5, this.y + this.height - 10, 5);
        }
    },

    update() {
        // Handle Slide duration
        if (this.isSliding) {
            this.slideTimer--;
            if (this.slideTimer <= 0) {
                this.isSliding = false;
            }
            // Sliding dust
            if (Math.random() < 0.3) {
                spawnDust(this.x - 5, this.y + this.height - 5, 2);
            }
        }

        // Gravity physics
        this.vy += this.gravity;
        this.y += this.vy;

        // Ground constraint
        const targetGround = this.isSliding ? this.groundY + 20 : this.groundY;
        if (this.y >= targetGround) {
            this.y = targetGround;
            this.vy = 0;
            this.isJumping = false;
            this.canDoubleJump = false;
        }

        // Animation ticking
        if (currentLevel === 3 && !this.isJumping && !this.isSliding) {
            this.animFrame = 0;
            this.animTick = 0;
        } else {
            this.animTick++;
            if (this.animTick >= this.animSpeed) {
                this.animTick = 0;
                this.animFrame = (this.animFrame + 1) % 4; // 4 run frames
            }
        }
    },

    draw() {
        ctx.save();

        // Flash Vardhan if invincible (Chai energy!)
        let drawAlpha = 1;
        if (invincibilityTimer > 0) {
            if (Math.floor(Date.now() / 50) % 2 === 0) {
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowColor = '#ff007f';
                ctx.shadowBlur = 15;
            }
        }

        let activeCanvas = transparentSpriteCanvas;
        let isActiveLoaded = isSpriteSheetLoaded;

        if (isActiveLoaded && activeCanvas) {
            // Render Vardhan using the spritesheet
            let sourceRect = SPRITE_MAP.run[this.animFrame]; // Running

            if (this.isJumping) {
                sourceRect = SPRITE_MAP.jump;
            } else if (this.isSliding) {
                sourceRect = SPRITE_MAP.slide;
            } else if (gameState === 'GAMEOVER') {
                sourceRect = SPRITE_MAP.hurt;
            }

            // Draw to canvas
            const scaleW = this.isSliding ? 75 : 60;
            const scaleH = this.isSliding ? 50 : 80;
            const renderY = this.isSliding ? this.y + 30 : this.y;

            ctx.drawImage(
                activeCanvas,
                sourceRect.x, sourceRect.y, sourceRect.w, sourceRect.h,
                this.x, renderY, scaleW, scaleH
            );
        } else {
            // Fallback placeholder block rendering in case sprite loading fails
            ctx.fillStyle = invincibilityTimer > 0 ? '#ff007f' : '#fff000';
            const hBox = this.getHitbox();
            ctx.fillRect(hBox.x, hBox.y, hBox.w, hBox.h);
        }

        ctx.restore();
    }
};

// QA pairs dictionary for Level 3
const VIVA_QA = [
    { q: "Bubble Sort Worst Case?", a: "O(N^2)" },
    { q: "Binary Search Time?", a: "O(log N)" },
    { q: "LIFO Data Structure?", a: "Stack" },
    { q: "FIFO Data Structure?", a: "Queue" },
    { q: "HTML structure tag?", a: "div" },
    { q: "CSS margin spacing?", a: "Margin" },
    { q: "Local storage key?", a: "localStorage" }
];

// --- Obstacles & Collectibles Definition ---
class GameItem {
    constructor(type, x, y, speedMult = 1, extra = null) {
        this.type = type; // cow, dog, auto, sharma, bug, chai, sheet, commit, magnet, laser, answer
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speedMult = speedMult;
        this.extra = extra;
        this.markedForDeletion = false;
        
        // Customize details
        this.setupType();
    }

    setupType() {
        switch (this.type) {
            case 'dog':
                this.width = 72;
                this.height = 58;
                // Dog stands ON the pavement (groundY = 260; pavement from 260 to 300)
                // Dog feet at 260+58=318, so y = 260-58+58 = 260
                this.y = player.groundY + 2;
                this.animFrame = 0;
                break;
            case 'cow':
                this.width = 90;
                this.height = 76;
                // Standing cow sits on pavement/road junction, bottom aligned at Y=320
                this.y = player.groundY - 16;
                break;
            case 'auto':
                this.width = 72;
                this.height = 58;
                // Auto on road surface (road starts at groundY+40)
                this.y = player.groundY + 42;
                break;
            case 'sharma':
                this.width = 36;
                this.height = 72;
                // Sharma stands on pavement
                this.y = player.groundY;
                this.direction = -1;
                this.walkRange = 80;
                this.startX = this.x;
                break;
            case 'bug':
                this.width = 130;
                this.height = 28;
                // BUG floats at head height — player must SLIDE to avoid
                // Player head is at (groundY - height) = 260 - 80 = 180; bug bottom at ~228
                this.y = player.groundY - 52;
                const bugs = ["NullPointerException", "Segmentation Fault", "Merge Conflict", "StackOverflowError", "Infinite Loop"];
                this.bugText = bugs[Math.floor(Math.random() * bugs.length)];
                break;
            case 'bench':
                this.width = 65;
                this.height = 36;
                // Stands on the floor
                this.y = player.groundY + 24; 
                break;
            case 'podium':
                this.width = 40;
                this.height = 60;
                this.y = player.groundY; // stands on pavement/floor
                break;
            case 'peer':
                this.width = 32;
                this.height = 70;
                this.y = player.groundY - 10;
                this.peerIndexX = Math.floor(Math.random() * 4);
                this.peerIndexY = Math.floor(Math.random() * 2);
                break;
            case 'security':
                this.width = 40;
                this.height = 72;
                this.y = player.groundY - 12;
                break;
            case 'placement_flyer':
                this.width = 30;
                this.height = 30;
                this.y = player.groundY + 5 + Math.random() * 10;
                break;
            case 'resume':
                this.width = 24;
                this.height = 28;
                this.y = player.groundY - 24;
                break;
            case 'backpack':
                this.width = 34;
                this.height = 34;
                this.y = player.groundY + 26; // lies on floor
                break;
            case 'classmate':
                this.width = 32;
                this.height = 70;
                this.y = player.groundY - 10; // stands on floor
                break;
            case 'wetsign':
                this.width = 30;
                this.height = 42;
                this.y = player.groundY + 18; // stands on floor
                break;
            case 'pothole':
                // Pothole is on road surface (road starts at groundY+40)
                this.width = 56;
                this.height = 16;
                this.y = player.groundY + 48;
                break;
            case 'trashcan':
                this.width = 32;
                this.height = 45;
                // Trash can stands on pavement or floor
                this.y = player.groundY + 15;
                break;
            
            // Collectibles (float at mid-player height for easy collection)
            case 'chai':
                this.width = 28;
                this.height = 28;
                this.y = player.groundY - 20;
                break;
            case 'sheet':
                this.width = 24;
                this.height = 28;
                this.y = player.groundY - 24;
                break;
            case 'commit':
                this.width = 22;
                this.height = 22;
                this.y = player.groundY - 18;
                break;
            case 'magnet':
                this.width = 24;
                this.height = 24;
                this.y = player.groundY - 20;
                break;
            case 'laser':
                this.width = 50;
                this.height = 6;
                this.isHigh = Math.random() < 0.5;
                this.y = this.isHigh ? player.groundY - 15 : player.groundY + 30;
                
                const qaIndex = Math.floor(Math.random() * VIVA_QA.length);
                this.qaPair = VIVA_QA[qaIndex];
                this.questionText = this.qaPair.q;
                this.laserColor = this.isHigh ? '#ff0055' : '#00ffcc';
                break;
            case 'answer':
                this.width = 130;
                this.height = 24;
                this.y = player.groundY - 35 - Math.random() * 80;
                this.answerText = this.extra || "O(1)";
                break;
        }
    }

    getHitbox() {
        // Safe padded hitbox
        return {
            x: this.x + 4,
            y: this.y + 4,
            w: this.width - 8,
            h: this.height - 8
        };
    }

    update() {
        // Move towards left
        let speed = gameSpeed * this.speedMult;
        if (currentLevel === 3) {
            speed = 5.5 * this.speedMult;
        }
        
        // शर्मा सर walks back and forth
        if (this.type === 'sharma') {
            this.x += this.direction * 1.5;
            if (Math.abs(this.x - this.startX) > this.walkRange) {
                this.direction *= -1;
            }
        }
        
        // Magnet pulling effect
        if (magnetTimer > 0 && ['chai', 'sheet', 'commit', 'magnet', 'answer'].includes(this.type)) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                const pullSpeed = currentLevel === 3 ? 8 : (gameSpeed + 4);
                this.x += (dx / dist) * pullSpeed;
                this.y += (dy / dist) * pullSpeed;
            } else {
                this.x -= speed;
            }
        } else {
            this.x -= speed;
        }

        if (this.x < -this.width - 20) {
            if (this.type === 'laser' && !this.markedForDeletion) {
                vivaProgress++;
                updateHUD();
                if (vivaProgress >= 5) {
                    triggerWin();
                }
            }
            this.markedForDeletion = true;
        }

        // Animation for dog
        if (this.type === 'dog') {
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                this.animFrame = 1;
            } else {
                this.animFrame = 0;
            }
        }
    }

    draw() {
        ctx.save();

        switch (this.type) {
            case 'dog':
                // Draw transparent dog sprite with running bounce effect
                if (isDogImageLoaded && transparentDogCanvas) {
                    ctx.save();
                    const bounce = Math.sin(Date.now() / 80) * 4;
                    ctx.drawImage(transparentDogCanvas, this.x, this.y + bounce, this.width, this.height);
                    ctx.restore();
                } else {
                    // Fallback block dog drawing
                    ctx.fillStyle = '#b05a27';
                    ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
                }
                break;
                
            case 'cow':
                if (isCowImageLoaded && transparentCowCanvas) {
                    ctx.drawImage(transparentCowCanvas, this.x, this.y, this.width, this.height);
                } else {
                    // Fallback Sleeping Indian Cow
                    ctx.fillStyle = '#e8d8c8';
                    ctx.fillRect(this.x + 10, this.y + 10, 45, 35); // Torso
                    ctx.fillRect(this.x + 45, this.y, 15, 20); // Head
                    ctx.fillStyle = '#bda58d';
                    ctx.fillRect(this.x + 50, this.y - 6, 4, 8); // Horns
                    ctx.fillRect(this.x + 56, this.y - 6, 4, 8);
                    ctx.fillStyle = '#8c735d';
                    ctx.fillRect(this.x + 12, this.y + 40, 6, 5); // Sitting Hooves
                    ctx.fillRect(this.x + 35, this.y + 40, 6, 5);
                }
                break;

            case 'auto':
                // Yellow-Green Desi Auto
                ctx.fillStyle = '#39a737'; // Green bottom
                ctx.fillRect(this.x, this.y + 25, this.width, 22);
                ctx.fillStyle = '#fff000'; // Yellow top
                ctx.fillRect(this.x, this.y + 5, this.width, 20);
                
                ctx.fillStyle = '#000'; // Window cutouts
                ctx.fillRect(this.x + 10, this.y + 8, 20, 12);
                ctx.fillRect(this.x + 38, this.y + 8, 22, 12);

                ctx.fillStyle = '#222'; // Black Wheels
                ctx.beginPath();
                ctx.arc(this.x + 15, this.y + 50, 7, 0, Math.PI * 2);
                ctx.arc(this.x + 50, this.y + 50, 7, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'bench':
                // Corridor/classroom wooden bench
                ctx.fillStyle = '#795548'; // Wood wooden seat
                ctx.fillRect(this.x, this.y + 10, this.width, 8);
                ctx.fillStyle = '#4e342e'; // Dark brown legs
                ctx.fillRect(this.x + 8, this.y + 18, 6, 18);
                ctx.fillRect(this.x + this.width - 14, this.y + 18, 6, 18);
                ctx.fillStyle = '#8d6e63'; // Backrest
                ctx.fillRect(this.x, this.y, this.width, 6);
                ctx.fillRect(this.x + 8, this.y + 6, 6, 4);
                ctx.fillRect(this.x + this.width - 14, this.y + 6, 6, 4);
                break;

            case 'podium':
                // Wooden podium body
                ctx.fillStyle = '#6d4c41'; // Dark wooden body
                ctx.fillRect(this.x + 4, this.y + 10, this.width - 8, this.height - 10);
                
                // Slanted top board
                ctx.fillStyle = '#8d6e63'; // Lighter brown top
                ctx.fillRect(this.x, this.y + 2, this.width, 8);
                
                // Standing microphone
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x + 12, this.y + 2);
                ctx.lineTo(this.x + 8, this.y - 12);
                ctx.stroke();
                
                // Mic head
                ctx.fillStyle = '#aaaaaa';
                ctx.fillRect(this.x + 6, this.y - 15, 4, 4);
                
                // White paper notes on podium
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x + 20, this.y + 4, 12, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 22, this.y + 6, 8, 1);
                break;

            case 'backpack':
                // Main backpack bag
                ctx.fillStyle = '#0288d1'; // Bright blue backpack
                ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 4);
                
                // Front pocket
                ctx.fillStyle = '#03a9f4'; // Lighter blue front pocket
                ctx.fillRect(this.x + 8, this.y + 14, this.width - 16, this.height - 18);
                
                // Handle/Strap loops
                ctx.fillStyle = '#01579b'; // Dark blue straps/handle
                ctx.fillRect(this.x + 12, this.y, 10, 4);
                
                // Zipper detailing
                ctx.fillStyle = '#cfd8dc'; // Silver zipper
                ctx.fillRect(this.x + 6, this.y + 12, this.width - 12, 2);
                ctx.fillRect(this.x + 10, this.y + 24, this.width - 20, 2);
                break;

            case 'classmate':
                // Hoodie (Torso)
                ctx.fillStyle = '#78909c'; // Blue-grey hoodie
                ctx.fillRect(this.x + 6, this.y + 16, 20, 28);
                
                // Jeans (Legs)
                ctx.fillStyle = '#3f51b5'; // Blue jeans
                ctx.fillRect(this.x + 8, this.y + 44, 7, 26);
                ctx.fillRect(this.x + 17, this.y + 44, 7, 26);
                
                // Head
                ctx.fillStyle = '#ffdbb5'; // Skin color
                ctx.fillRect(this.x + 8, this.y + 2, 16, 14);
                
                // Hair/Hood top
                ctx.fillStyle = '#546e7a'; // Hood outline
                ctx.fillRect(this.x + 6, this.y, 20, 4);
                ctx.fillRect(this.x + 6, this.y, 4, 16);
                ctx.fillRect(this.x + 22, this.y, 4, 16);
                
                // Staring down head tilt (face features looking down)
                ctx.fillStyle = '#263238'; // Downcast eyes
                ctx.fillRect(this.x + 10, this.y + 8, 3, 2);
                
                // Glowing smartphone in hands
                ctx.fillStyle = '#ffdbb5'; // Hands
                ctx.fillRect(this.x + 18, this.y + 26, 6, 6);
                ctx.fillStyle = '#00e5ff'; // Glowing cyan screen
                ctx.fillRect(this.x + 22, this.y + 22, 6, 8);
                // Screen glow overlay
                ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
                ctx.beginPath();
                ctx.arc(this.x + 25, this.y + 26, 12, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'wetsign':
                // Yellow plastic body
                ctx.fillStyle = '#ffeb3b'; // Warning yellow
                ctx.beginPath();
                ctx.moveTo(this.x + 6, this.y + this.height);
                ctx.lineTo(this.x + 12, this.y);
                ctx.lineTo(this.x + 18, this.y);
                ctx.lineTo(this.x + 24, this.y + this.height);
                ctx.closePath();
                ctx.fill();
                
                // Black hinge at top
                ctx.fillStyle = '#212121';
                ctx.fillRect(this.x + 12, this.y, 6, 3);
                
                // CAUTION sign graphics
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x + 15, this.y + 10);
                ctx.lineTo(this.x + 10, this.y + 32);
                ctx.lineTo(this.x + 20, this.y + 32);
                ctx.closePath();
                ctx.stroke();
                
                // Slipping man figure (caution figure detail)
                ctx.fillStyle = '#d32f2f'; // Red warning sign mark
                ctx.fillRect(this.x + 14, this.y + 16, 2, 8);
                ctx.fillRect(this.x + 14, this.y + 26, 2, 2);
                break;

            case 'peer':
                if (isPeerLoaded && transparentPeerCanvas) {
                    const cellW = peerImage.width / 4;
                    const cellH = peerImage.height / 2;
                    ctx.drawImage(
                        transparentPeerCanvas,
                        this.peerIndexX * cellW, this.peerIndexY * cellH, cellW, cellH,
                        this.x, this.y, this.width, this.height
                    );
                } else {
                    ctx.fillStyle = '#ff8a80';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
                break;

            case 'security':
                if (isSecurityLoaded && transparentSecurityCanvas) {
                    ctx.drawImage(transparentSecurityCanvas, this.x, this.y, this.width, this.height);
                } else {
                    ctx.fillStyle = '#90a4ae';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
                break;

            case 'placement_flyer':
                // A flyer sheet of paper folded or flat with bold red text
                ctx.fillStyle = '#f5f5f5'; // slightly off-white paper
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Draw outline
                ctx.strokeStyle = '#c62828'; // red border outline
                ctx.lineWidth = 1.5;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                
                // Bold red text: "INFO" and "FLYER"
                ctx.fillStyle = '#d32f2f';
                ctx.font = 'bold 5px "Press Start 2P"';
                ctx.fillText("INFO", this.x + 3, this.y + 10);
                ctx.fillText("FLYER", this.x + 2, this.y + 20);
                break;

            case 'resume':
                // Drawing a white resume sheet with small lines of text and a tiny blue photo box
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Draw outline
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                
                // Draw a tiny blue photo box
                ctx.fillStyle = '#29b6f6';
                ctx.fillRect(this.x + this.width - 9, this.y + 3, 6, 8);
                
                // Draw lines representing text
                ctx.fillStyle = '#212121';
                ctx.fillRect(this.x + 3, this.y + 4, 10, 2);
                ctx.fillRect(this.x + 3, this.y + 8, 8, 2);
                ctx.fillRect(this.x + 3, this.y + 13, 16, 1.5);
                ctx.fillRect(this.x + 3, this.y + 16, 16, 1.5);
                ctx.fillRect(this.x + 3, this.y + 19, 14, 1.5);
                break;

            case 'sharma':
                // Sharma Sir: Angry external Examiner
                ctx.fillStyle = '#3f51b5'; // Blue Shirt
                ctx.fillRect(this.x + 8, this.y + 15, 20, 25);
                ctx.fillStyle = '#212121'; // Grey Pants
                ctx.fillRect(this.x + 8, this.y + 40, 20, 30);
                ctx.fillStyle = '#ffdbb5'; // Head
                ctx.fillRect(this.x + 10, this.y, 16, 16);
                ctx.fillStyle = '#5d4037'; // Hair
                ctx.fillRect(this.x + 8, this.y, 20, 4);
                ctx.fillStyle = '#fff'; // Specs
                ctx.fillRect(this.x + 11, this.y + 5, 14, 3);
                ctx.fillStyle = '#ff007f'; // Red tie
                ctx.fillRect(this.x + 17, this.y + 15, 2, 12);
                break;

            case 'bug':
                // Floating Bug error banner — bright red/yellow for visibility on any background
                ctx.fillStyle = '#c62828'; // solid dark red background
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = '#ff1744';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                // Warning stripes on top
                ctx.fillStyle = '#fff176';
                for (let xi = 0; xi < this.width; xi += 10) {
                    ctx.fillRect(this.x + xi, this.y, 5, 4);
                }
                // Bug name text
                ctx.fillStyle = '#ffffff';
                ctx.font = '6px "Press Start 2P"';
                ctx.fillText(this.bugText, this.x + 5, this.y + 20);
                // Blinking danger indicator
                if (Math.floor(Date.now() / 200) % 2 === 0) {
                    ctx.fillStyle = '#ff1744';
                    ctx.fillRect(this.x + this.width - 12, this.y + 6, 8, 8);
                } else {
                    ctx.fillStyle = '#fff176';
                    ctx.fillRect(this.x + this.width - 12, this.y + 6, 8, 8);
                }
                break;

            case 'pothole':
                // Pothole on road with visible orange warning border
                ctx.fillStyle = '#1a1a2e'; // Dark deep hole
                ctx.beginPath();
                ctx.ellipse(this.x + 28, this.y + 8, 28, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                // Warning rim
                ctx.strokeStyle = '#ff8f00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(this.x + 28, this.y + 8, 28, 8, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Hazard lines inside
                ctx.strokeStyle = '#ffd54f';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x + 15, this.y + 8);
                ctx.lineTo(this.x + 41, this.y + 8);
                ctx.stroke();
                break;

            case 'trashcan':
                // Green pixel art trash can
                ctx.fillStyle = '#388e3c'; // dark green body
                ctx.fillRect(this.x + 4, this.y + 8, 24, 37);
                ctx.fillStyle = '#4caf50'; // lighter green rim/lid
                ctx.fillRect(this.x, this.y, 32, 8);
                // Vertical ridges
                ctx.fillStyle = '#2e7d32'; 
                ctx.fillRect(this.x + 8, this.y + 12, 2, 30);
                ctx.fillRect(this.x + 15, this.y + 12, 2, 30);
                ctx.fillRect(this.x + 22, this.y + 12, 2, 30);
                // Trash overflowing (apple core / paper)
                ctx.fillStyle = '#e0e0e0'; // paper
                ctx.fillRect(this.x + 18, this.y - 4, 8, 6);
                ctx.fillStyle = '#d32f2f'; // apple
                ctx.fillRect(this.x + 6, this.y - 6, 6, 8);
                break;

            // Collectibles
            case 'chai':
                // Steaming Chai Glass
                ctx.fillStyle = '#f5c242'; // Tea color
                ctx.fillRect(this.x + 4, this.y + 8, 14, 14);
                ctx.fillStyle = '#fff'; // Glass rim
                ctx.fillRect(this.x + 2, this.y + 5, 18, 3);
                // Steam particles
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                if (Math.floor(Date.now() / 150) % 2 === 0) {
                    ctx.fillRect(this.x + 6, this.y - 2, 2, 4);
                    ctx.fillRect(this.x + 12, this.y - 4, 2, 4);
                } else {
                    ctx.fillRect(this.x + 8, this.y - 4, 2, 4);
                    ctx.fillRect(this.x + 14, this.y - 2, 2, 4);
                }
                break;

            case 'sheet':
                // Attendance Sheet
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#39ff14'; // Grade green
                ctx.font = 'bold 8px Arial';
                ctx.fillText("75%", this.x + 1, this.y + 16);
                break;

            case 'commit':
                // Green Git Commit
                ctx.fillStyle = '#39ff14';
                ctx.shadowColor = '#39ff14';
                ctx.shadowBlur = 10;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // Inner core
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
                break;

            case 'magnet':
                // Orange StackOverflow WiFi Magnet
                ctx.fillStyle = '#ff8f3b';
                ctx.shadowColor = '#ff8f3b';
                ctx.shadowBlur = 10;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#fff';
                ctx.fillRect(this.x + 4, this.y + 6, 14, 4);
                ctx.fillRect(this.x + 4, this.y + 12, 14, 4);
                break;
            case 'laser':
                ctx.save();
                ctx.shadowColor = this.laserColor;
                ctx.shadowBlur = 15;
                ctx.fillStyle = this.laserColor;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Laser core white stripe
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x, this.y + 1, this.width, this.height - 2);
                ctx.restore();
                
                // Question Text
                ctx.fillStyle = '#ff007f';
                ctx.font = '5px "Press Start 2P"';
                ctx.fillText(this.questionText, this.x + 10, this.y - 6);
                break;
            case 'answer':
                ctx.fillStyle = '#1b2b20';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = '#a3be8c';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                
                ctx.fillStyle = '#8fbcbb';
                ctx.font = '5px "Press Start 2P"';
                ctx.fillText(this.answerText, this.x + 8, this.y + 15);
                break;
        }

        ctx.restore();
    }
}

let items = [];
let itemSpawnTimer = 0;
let cloudsArray = [];
let birdsArray = [];

function updateCloudsAndBirds() {
    if (gameState !== 'PLAYING') return;
    
    // Cloud spawner
    if (Math.random() < 0.005) {
        cloudsArray.push({
            x: canvas.width + 50,
            y: 20 + Math.random() * 80,
            width: 80 + Math.random() * 60,
            speed: 0.2 + Math.random() * 0.4
        });
    }
    // Bird spawner
    if (Math.random() < 0.008) {
        birdsArray.push({
            x: canvas.width + 50,
            y: 40 + Math.random() * 120,
            speed: 1.5 + Math.random() * 1.5,
            flapPhase: Math.random() * Math.PI * 2
        });
    }

    // Update
    for (let i = cloudsArray.length - 1; i >= 0; i--) {
        cloudsArray[i].x -= cloudsArray[i].speed;
        if (cloudsArray[i].x + cloudsArray[i].width < -100) cloudsArray.splice(i, 1);
    }
    for (let i = birdsArray.length - 1; i >= 0; i--) {
        birdsArray[i].x -= birdsArray[i].speed;
        birdsArray[i].flapPhase += 0.15;
        if (birdsArray[i].x < -50) birdsArray.splice(i, 1);
    }
}


function spawnItems() {
    itemSpawnTimer--;
    if (itemSpawnTimer <= 0) {
        // Spawn obstacles
        const rand = Math.random();
        let newItem;
        
        if (currentLevel === 3) {
            // Spawn paired laser question (from boss) and answer bubble (from right)
            const qaIndex = Math.floor(Math.random() * VIVA_QA.length);
            const pair = VIVA_QA[qaIndex];
            
            const laserItem = new GameItem('laser', canvas.width - 160, 0, 1.4);
            laserItem.qaPair = pair;
            laserItem.questionText = pair.q;
            
            const answerItem = new GameItem('answer', canvas.width + 50, 0, 1.1, pair.a);
            
            items.push(laserItem);
            items.push(answerItem);
            
            // Random interval between boss attacks
            itemSpawnTimer = 110 + Math.random() * 50;
            return;
        } else {
            if (rand < 0.45) {
                // Spawning Obstacles
                let obsType;
                if (currentLevel === 4) {
                    obsType = ['peer', 'security', 'placement_flyer'][Math.floor(Math.random() * 3)];
                } else if (currentLevel === 2) {
                    // School / Classroom indoor obstacles (No cars or dogs!)
                    obsType = ['bench', 'podium', 'backpack', 'classmate', 'wetsign', 'sharma', 'bug'][Math.floor(Math.random() * 7)];
                } else {
                    // Street obstacles
                    obsType = ['dog', 'cow', 'auto', 'sharma', 'bug', 'pothole', 'trashcan'][Math.floor(Math.random() * 7)];
                }
                newItem = new GameItem(obsType, canvas.width + 50, 0);
            } else if (rand < 0.85) {
                // Spawning Collectibles
                let colType;
                if (currentLevel === 4) {
                    colType = ['chai', 'resume', 'commit', 'magnet'][Math.floor(Math.random() * 4)];
                } else if (currentLevel === 2) {
                    // Ensure commits are plentiful in Level 2!
                    colType = ['chai', 'sheet', 'commit', 'commit', 'magnet'][Math.floor(Math.random() * 5)];
                } else {
                    colType = ['chai', 'sheet', 'commit', 'magnet'][Math.floor(Math.random() * 4)];
                }
                const spawnY = player.groundY - 30 - Math.random() * 100; // Floating height
                newItem = new GameItem(colType, canvas.width + 50, spawnY);
            }
        }
        
        if (newItem) {
            items.push(newItem);
            if (newItem.type === 'dog') {
                synth.playDogBark();
            }
        }
        // Random intervals, speeds up as game goes on
        itemSpawnTimer = Math.max(40, 110 - Math.floor(distance / 50)) + Math.random() * 60;
    }
}

// --- Dynamic Particle Systems ---
class Particle {
    constructor(x, y, color, size, vx, vy, gravity = 0.1, life = 30) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.gravity = gravity;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

let particles = [];

function spawnDust(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            x, y - 5,
            'rgba(180, 160, 180, 0.4)',
            3 + Math.random() * 4,
            -1 - Math.random() * 2,
            -Math.random() * 2,
            0.05,
            15 + Math.random() * 15
        ));
    }
}

function spawnCollectSparks(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(
            x, y, color,
            3 + Math.random() * 3,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            0.05,
            20 + Math.random() * 20
        ));
    }
}

// --- Timers & Buffs State ---
let invincibilityTimer = 0;
let magnetTimer = 0;
let boostTimer = 0;

function updateTimers() {
    if (invincibilityTimer > 0) invincibilityTimer--;
    if (magnetTimer > 0) magnetTimer--;
    if (boostTimer > 0) boostTimer--;
}

// --- Collision Math Helper ---
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.h > rect2.y;
}

// --- Angry Sharma Sir Remarks ---
const SHARMA_REMARKS = [
    "\"Zero marks in external lab! Write Heap Sort on paper 100 times!\"",
    "\"Attendance short! Go bring NOC from Dean Office!\"",
    "\"What will you code with 70% attendance? Debarred!\"",
    "\"Bubble Sort takes O(N^2) and you take forever to reach lab!\"",
    "\"I have been waiting since 9:00 AM! Your viva is cancelled!\"",
    "\"Late admission denied! Go redo Semester 6!\"",
    "\"You missed DAA Viva! Don't expect to pass your placement evaluations!\""
];

// --- Main Game Loop & Logic Flow ---
function initGame(level = 1) {
    currentLevel = level;
    player.reset();
    items = [];
    particles = [];
    distance = 0;
    commits = 0;
    collectiblesCount = 0;
    attendance = 100; // Full 100% — fresh start!
    vivaProgress = 0;
    gameSpeed = level === 3 ? 0 : baseSpeed;
    itemSpawnTimer = 30;
    invincibilityTimer = 0;
    magnetTimer = 0;
    boostTimer = 0;
    groundOffset = 0;
    notifTimer = 0;
    notifMilestone = 0;
    nextNotifAt = level === 2 ? 250 : 500;

    updateHUD();
}

function updateHUD() {
    commitsVal.textContent = commits;
    if (currentLevel === 3) {
        if (distanceLabel) distanceLabel.textContent = 'VIVA PROG:';
        distanceVal.textContent = vivaProgress + ' / 5';
    } else {
        if (distanceLabel) distanceLabel.textContent = 'DISTANCE:';
        distanceVal.textContent = Math.floor(distance) + 'm';
    }
    
    // Update labels for Campaign 2
    if (currentLevel >= 4) {
        if (attendanceLabelEl) attendanceLabelEl.textContent = 'PROFILE STRENGTH:';
        if (commitsLabelEl) commitsLabelEl.textContent = 'NETWORKING:';
    } else {
        if (attendanceLabelEl) attendanceLabelEl.textContent = 'ATTENDANCE:';
        if (commitsLabelEl) commitsLabelEl.textContent = 'COMMITS:';
    }
    
    // Attendance updates
    const roundedAtt = attendance.toFixed(1);
    attendanceFill.textContent = roundedAtt + '%';
    attendanceFill.style.width = Math.min(100, Math.max(5, attendance)) + '%';
    
    // Color states
    attendanceFill.classList.remove('danger', 'warning', 'safe');
    if (attendance < 75.0) {
        attendanceFill.classList.add('danger');
    } else if (attendance < 85.0) {
        attendanceFill.classList.add('warning');
    } else {
        attendanceFill.classList.add('safe');
    }
}

function handleCollisions() {
    const pHbox = player.getHitbox();

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const iHbox = item.getHitbox();

        if (checkCollision(pHbox, iHbox)) {
            // Collision occurred!
            if (['dog', 'cow', 'auto', 'sharma', 'bug', 'pothole', 'bench', 'trashcan', 'podium', 'backpack', 'classmate', 'wetsign', 'laser', 'peer', 'security', 'placement_flyer'].includes(item.type)) {
                // Hitting Obstacle
                if (invincibilityTimer > 0) {
                    // Destroy obstacle
                    item.markedForDeletion = true;
                    spawnCollectSparks(item.x + item.width/2, item.y + item.height/2, '#ff007f');
                    synth.playHit();
                } else {
                    // Punished! Deduct attendance
                    attendance -= 15.0; // Big penalty
                    item.markedForDeletion = true;
                    spawnCollectSparks(player.x + player.width/2, player.y + player.height/2, '#ff007f');
                    synth.playHit();
                    
                    // Push player back / visual camera shake (implied by hit effect)
                    if (attendance < 50.0) {
                        triggerGameOver();
                    }
                    updateHUD();
                }
            } else {
                // Collectible picked up
                item.markedForDeletion = true;
                synth.playCollect();

                collectiblesCount++;
                if (collectiblesCount % 5 === 0) {
                    // Every 5 collectibles: 3-second (180 frames) speed boost + invincibility
                    boostTimer = 180;
                    invincibilityTimer = Math.max(invincibilityTimer, 180);
                    // Sparkles to indicate boost
                    spawnCollectSparks(player.x + player.width/2, player.y + player.height/2, '#00ffff');
                }

                if (item.type === 'chai') {
                    // Chai original power: 5s invincibility
                    invincibilityTimer = Math.max(invincibilityTimer, 300);
                    spawnCollectSparks(item.x + 10, item.y + 10, '#fff000');
                } else if (item.type === 'sheet' || item.type === 'resume') {
                    // Att sheet / Resume boost
                    attendance = Math.min(100, attendance + 3.0);
                    spawnCollectSparks(item.x + 10, item.y + 10, '#39ff14');
                } else if (item.type === 'commit') {
                    // Green commit
                    commits++;
                    spawnCollectSparks(item.x + 10, item.y + 10, '#39ff14');
                } else if (item.type === 'magnet') {
                    // StackOverflow magnet
                    magnetTimer = 360; // 6 seconds
                    spawnCollectSparks(item.x + 10, item.y + 10, '#ff8f3b');
                } else if (item.type === 'answer') {
                    // Answer bubble picked up! Recover 10% attendance and add 5 commits
                    attendance = Math.min(100, attendance + 10.0);
                    commits += 5;
                    vivaProgress++;
                    spawnCollectSparks(item.x + item.width/2, item.y + item.height/2, '#a3be8c');
                    
                    // Answering destroys the oldest active laser beam on screen!
                    const activeLaser = items.find(it => it.type === 'laser' && !it.markedForDeletion);
                    if (activeLaser) {
                        activeLaser.markedForDeletion = true;
                        spawnCollectSparks(activeLaser.x + activeLaser.width/2, activeLaser.y + activeLaser.height/2, '#00ffcc');
                    }
                    
                    if (vivaProgress >= 5) {
                        triggerWin();
                    }
                }
                updateHUD();
            }
        }
    }
}

function triggerWin() {
    gameState = 'WIN';
    synth.playWinSound();
    if (pauseToggleBtn) pauseToggleBtn.style.display = 'none';
    
    // Save High Score
    const finalDist = Math.floor(distance);
    if (finalDist > highScore) {
        highScore = finalDist;
        localStorage.setItem('btech_high_score', highScore);
    }

    // Populate win panels
    if (currentLevel === 3) {
        document.getElementById('win-distance').textContent = 'Defended: 5/5 Qs';
    } else {
        document.getElementById('win-distance').textContent = finalDist + 'm';
    }
    document.getElementById('win-commits').textContent = commits;
    document.getElementById('win-attendance').textContent = attendance.toFixed(1) + '%';

    const celebrationEl = document.getElementById('win-celebration');
    const winTitle = document.getElementById('win-title');
    const winSubtitle = document.getElementById('win-subtitle');
    const winMessage = document.getElementById('win-message');
    const winRestartPrompt = document.getElementById('win-restart-prompt');
    const nextBtn = document.getElementById('next-level-btn');

    // Clone button to strip previous event listeners cleanly
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    if (currentLevel === 3) {
        // Level 3 win: graduation grade card evaluation
        let grade = 'A+';
        if (attendance >= 90) grade = 'A+ (Topper)';
        else if (attendance >= 75) grade = 'A (Good Standing)';
        else if (attendance >= 60) grade = 'B (Passed)';
        else grade = 'C (Borderline)';

        winTitle.textContent = 'VIVA CLEARED!';
        winTitle.setAttribute('data-text', 'VIVA CLEARED!');
        winSubtitle.textContent = '🎓 GRADE: ' + grade + ' 🎓';
        winMessage.textContent = '"Outstanding! You dodged every hard question. You are officially a B.Tech Graduate! Go get your degree! 🏆"';
        newNextBtn.style.display = 'none';
        celebrationEl.classList.remove('hidden');
        winRestartPrompt.textContent = 'PRESS SPACE TO PLAY AGAIN FROM START';
    } else if (currentLevel === 4) {
        // Level 4 win
        winTitle.textContent = 'LEVEL 4 PASSED!';
        winTitle.setAttribute('data-text', 'LEVEL 4 PASSED!');
        winSubtitle.textContent = '🏃 Reached the placement cell!';
        winMessage.textContent = '"Excellent run! You made it to the interview center. Next up: navigate the corporate hallway!"';
        newNextBtn.style.display = 'block';
        newNextBtn.textContent = '▶ NEXT LEVEL: CORPORATE HALLWAY';
        newNextBtn.addEventListener('click', () => {
            alert("Great job! Level 5 (Corporate Hallway) is coming soon in the Part 2 release.");
            // Go back to main menu
            gameState = 'MENU';
            document.getElementById('win-screen').classList.add('hidden');
            menuScreen.classList.remove('hidden');
            if (pauseToggleBtn) pauseToggleBtn.style.display = 'none';
        });
        celebrationEl.classList.add('hidden');
        winRestartPrompt.textContent = 'PRESS SPACE TO PLAY LEVEL 4 AGAIN';
    } else if (currentLevel === 2) {
        // Level 2 win
        winTitle.textContent = 'LEVEL 2 PASSED!';
        winTitle.setAttribute('data-text', 'LEVEL 2 PASSED!');
        winSubtitle.textContent = '🏃 Arrived at the classroom hall!';
        winMessage.textContent = '"You reached the class door! But the Professor is sitting inside waiting for your Viva Exam. Get ready! 👨‍🏫"';
        newNextBtn.style.display = 'block';
        newNextBtn.textContent = '▶ START VIVA EXAM: THE BOSS FIGHT';
        newNextBtn.addEventListener('click', () => {
            startLevel3();
        });
        celebrationEl.classList.add('hidden');
        winRestartPrompt.textContent = 'PRESS SPACE TO PLAY LEVEL 2 AGAIN';
    } else {
        // Level 1 win
        winTitle.textContent = 'LEVEL 1 PASSED!';
        winTitle.setAttribute('data-text', 'LEVEL 1 PASSED!');
        winSubtitle.textContent = '🏃 Made it out of the streets!';
        winMessage.textContent = '"Outstanding! Now run through the college campus corridor to reach the classroom!"';
        newNextBtn.style.display = 'block';
        newNextBtn.textContent = '▶ NEXT LEVEL: COLLEGE CAMPUS';
        newNextBtn.addEventListener('click', () => {
            startLevel2();
        });
        celebrationEl.classList.add('hidden');
        winRestartPrompt.textContent = 'PRESS SPACE TO PLAY LEVEL 1 AGAIN';
    }

    // Show win screen
    hudElement.classList.add('hidden');
    document.getElementById('win-screen').classList.remove('hidden');
}

// --- Milestone WhatsApp Popup Notification ---
// Level-aware notification messages (fires at 500m in Level 1, 250m in Level 2)
const NOTIF_MESSAGES = {
    L1_500: "bro where are you!! its college time!! viva starts at 9 am!! 😱",
    L2_250: "bro you're almost inside the class!! run to your seat fast!! the Professor is HERE!! 🏃💨",
    L4_500: "bro where are you!! the YOLO Tech interviews have started at the Seminar Hall!! 😱"
};

function triggerNotification(milestone) {
    gameState = 'NOTIF';
    synth.stopBGM();
    notifMilestone = milestone;
    if (pauseToggleBtn) pauseToggleBtn.style.display = 'none';

    const popup = document.getElementById('notif-popup');
    const msgEl = document.getElementById('notif-message');
    const msgKey = `L${currentLevel}_${milestone}`;
    msgEl.textContent = NOTIF_MESSAGES[msgKey] || 'bro where are you!!!';

    // Trigger vibrate class for animation
    const phone = popup.querySelector('.notif-phone');
    phone.classList.remove('vibrate');
    void phone.offsetWidth; // reflow to restart animation
    phone.classList.add('vibrate');

    popup.classList.remove('hidden');

    // Auto-dismiss after 3.5 seconds
    notifTimer = setTimeout(dismissNotif, 3500);
}

function dismissNotif() {
    if (gameState !== 'NOTIF') return;
    clearTimeout(notifTimer);
    document.getElementById('notif-popup').classList.add('hidden');
    gameState = 'PLAYING';
    synth.startBGM();
    if (pauseToggleBtn) pauseToggleBtn.style.display = 'block';
}

function triggerGameOver() {
    gameState = 'GAMEOVER';
    synth.playGameOver();
    if (pauseToggleBtn) pauseToggleBtn.style.display = 'none';
    
    // Save High Score
    if (Math.floor(distance) > highScore) {
        highScore = Math.floor(distance);
        localStorage.setItem('btech_high_score', highScore);
    }

    // Populate gameover panels
    finalDistanceEl.textContent = Math.floor(distance) + 'm';
    finalCommitsEl.textContent = commits;
    highScoreEl.textContent = highScore + 'm';
    sharmaRemarkEl.textContent = SHARMA_REMARKS[Math.floor(Math.random() * SHARMA_REMARKS.length)];

    // Show menu
    hudElement.classList.add('hidden');
    gameoverScreen.classList.remove('hidden');
}

function updateGame() {
    if (gameState !== 'PLAYING') return;

    // Update backgrounds
    bgLayers.forEach(layer => layer.update());

    // Update player physics
    player.update();

    // Increment distance & speed
    let boostExtra = boostTimer > 0 ? 5 : 0;
    if (currentLevel === 3) {
        gameSpeed = 0;
        distance = 0;
        groundOffset = 0;
    } else {
        distance += gameSpeed * 0.05;
        groundOffset = (groundOffset + gameSpeed) % canvas.width;
        gameSpeed = Math.min(maxSpeed, baseSpeed + (distance * 0.005)) + boostExtra;
    }

    // Win check — Level 1 ends at 1000m, Level 2 ends at 250m, Level 3 ends at 300m, Level 4 ends at 1000m
    let winDistance = 1000;
    if (currentLevel === 2) winDistance = 250;
    else if (currentLevel === 3) winDistance = 300;
    else if (currentLevel === 4) winDistance = 500;

    if (distance >= winDistance) {
        distance = winDistance;
        triggerWin();
        return;
    }

    // --- WhatsApp Notification Milestones ---
    // (Only triggers for Level 1 at 500m and Level 2 at 250m)
    const milestoneTarget = currentLevel === 2 ? 250 : (currentLevel === 3 ? -1 : 500);
    if (milestoneTarget !== -1 && distance >= nextNotifAt && nextNotifAt <= milestoneTarget && currentLevel !== 4) {
        triggerNotification(nextNotifAt);
        nextNotifAt += 1000; // prevent re-triggering
        return;
    }

    // Attendance decays at 1% per 10 seconds = 0.1% per second = 0.001667 per frame @ 60 FPS
    attendance -= 0.001667;
    if (attendance < 50.0) {
        triggerGameOver();
    }
    updateHUD();

    // Spawning items
    spawnItems();
    updateCloudsAndBirds();

    // Update active obstacles and collectibles
    items.forEach(item => item.update());
    items = items.filter(item => !item.markedForDeletion);

    // Collision check
    handleCollisions();

    // Timers ticks
    updateTimers();

    // Particles updating
    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);
}

function drawRoad() {
    if (currentLevel === 1) {
        // --- LEVEL 1: ROAD & SIDEWALK ---
        // 1. Draw Pavement/Sidewalk with Red tiles (from y = 260 to y = 300)
        ctx.fillStyle = '#c56a5c'; // Terracotta brick color
        ctx.fillRect(0, player.groundY, canvas.width, 40);
        
        // Draw interlocking tile grout lines
        ctx.strokeStyle = '#9e4b3e'; // Dark brick grout outline
        ctx.lineWidth = 2;
        const tileW = 40;
        const speedCycle = groundOffset % tileW;
        
        ctx.beginPath();
        // Horizontal grooves
        ctx.moveTo(0, player.groundY + 20);
        ctx.lineTo(canvas.width, player.groundY + 20);
        ctx.moveTo(0, player.groundY + 40);
        ctx.lineTo(canvas.width, player.groundY + 40);
        ctx.stroke();

        // Vertical joints (staggered for interlocking effect)
        ctx.beginPath();
        for (let x = -tileW; x < canvas.width + tileW; x += tileW) {
            // Top brick row
            ctx.moveTo(x - speedCycle, player.groundY);
            ctx.lineTo(x - speedCycle, player.groundY + 20);
            
            // Bottom brick row (offset by half width)
            ctx.moveTo(x - speedCycle + tileW/2, player.groundY + 20);
            ctx.lineTo(x - speedCycle + tileW/2, player.groundY + 40);
        }
        ctx.stroke();

        // 2. Draw running asphalt grey road (from y = 300 to y = 400)
        ctx.fillStyle = '#616170'; // Daylight asphalt grey
        ctx.fillRect(0, player.groundY + 40, canvas.width, 100);

        // Road white border paint (daylight marking)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, player.groundY + 40, canvas.width, 4);
        ctx.fillRect(0, player.groundY + 136, canvas.width, 4);

        // Dashed center divider lines (moving)
        ctx.fillStyle = '#ffffff';
        const dashW = 40;
        const gap = 30;
        const roadCycle = groundOffset % (dashW + gap);
        
        for (let x = -dashW - gap; x < canvas.width + dashW; x += dashW + gap) {
            ctx.fillRect(x - roadCycle, player.groundY + 86, dashW, 4);
        }
    } else if (currentLevel === 2 || currentLevel === 3 || currentLevel === 4) {
        // --- LEVEL 2, 3 & 4 FLOOR ---
        if (currentLevel === 4) {
            drawGardensFloor();
        } else if (currentLevel === 3) {
            drawVivaRoomFloor();
        } else {
            drawCorridorFloor();
        }
    }
}

function drawCorridorFloor() {
    const floorY = player.groundY; // 260
    const floorH = 140; // up to 400
    
    // Base deep blue tile color
    ctx.fillStyle = '#204d80';
    ctx.fillRect(0, floorY, canvas.width, floorH);

    // Draw checkered tiles (scrolling)
    const tileSize = 35;
    const cycle = groundOffset % (tileSize * 2);

    ctx.fillStyle = '#2d6fa8'; // lighter blue tiles
    for (let yOffset = 0; yOffset < floorH; yOffset += tileSize) {
        const isEvenRow = (yOffset / tileSize) % 2 === 0;
        for (let x = -tileSize * 2; x < canvas.width + tileSize * 2; x += tileSize * 2) {
            const startX = x - cycle + (isEvenRow ? tileSize : 0);
            ctx.fillRect(startX, floorY + yOffset, tileSize, tileSize);
            
            // Add a glossy highlight line on each tile to match the reflection
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillRect(startX + 2, floorY + yOffset + 2, tileSize - 4, 3);
            ctx.fillStyle = '#2d6fa8'; // restore fill style for loop
        }
    }

    // Draw thin grid lines for defined retro tiles
    ctx.strokeStyle = '#15355e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Horizontal lines
    for (let y = floorY; y <= floorY + floorH; y += tileSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    // Vertical lines (scrolling)
    for (let x = -tileSize * 2; x < canvas.width + tileSize * 2; x += tileSize) {
        ctx.moveTo(x - (groundOffset % tileSize), floorY);
        ctx.lineTo(x - (groundOffset % tileSize), floorY + floorH);
    }
    ctx.stroke();

    // Top baseboard trim (dark mahogany/grey)
    ctx.fillStyle = '#2e3440';
    ctx.fillRect(0, floorY, canvas.width, 6);
}

function drawClassroomFloor() {
    const floorY = player.groundY; // 260
    const floorH = 140; // up to 400

    // Warm orange-brown wood plank color
    ctx.fillStyle = '#c08060';
    ctx.fillRect(0, floorY, canvas.width, floorH);

    // Dark brown wood grout line strokes
    ctx.strokeStyle = '#603020';
    ctx.lineWidth = 1.5;

    const plankH = 20;
    const cycle = groundOffset % 120;

    // Horizontal lines
    ctx.beginPath();
    for (let y = floorY; y <= floorY + floorH; y += plankH) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // Vertical joints (offset every alternating plank row)
    ctx.beginPath();
    for (let y = floorY; y < floorY + floorH; y += plankH) {
        const isEvenRow = ((y - floorY) / plankH) % 2 === 0;
        const shift = isEvenRow ? 60 : 0;
        for (let x = -120; x < canvas.width + 120; x += 120) {
            const startX = x - cycle + shift;
            ctx.moveTo(startX, y);
            ctx.lineTo(startX, y + plankH);
        }
    }
    ctx.stroke();

    // Top baseboard trim
    ctx.fillStyle = '#4c566a';
    ctx.fillRect(0, floorY, canvas.width, 6);
}

function drawGardensFloor() {
    const floorY = player.groundY; // 260
    const floorH = 140; // up to 400

    // Green grass base
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(0, floorY, canvas.width, floorH);

    // Stone pathway tiles (scrolling)
    const stoneW = 60;
    const stoneH = 30;
    const cycle = groundOffset % (stoneW * 2);

    for (let row = 0; row < Math.ceil(floorH / stoneH); row++) {
        for (let col = -2; col < Math.ceil(canvas.width / stoneW) + 2; col++) {
            const isStone = (row + col) % 2 === 0;
            if (isStone) {
                ctx.fillStyle = '#90a4ae'; // darker grey
                ctx.fillRect(col * stoneW - cycle, floorY + row * stoneH, stoneW - 6, stoneH - 6);
                ctx.fillStyle = '#b0bec5'; // light grey highlight
                ctx.fillRect(col * stoneW - cycle + 2, floorY + row * stoneH + 2, stoneW - 10, stoneH - 10);
            }
        }
    }

    // Top trim grass line (darker green)
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, floorY, canvas.width, 6);
}

function drawVivaRoomFloor() {
    const floorY = player.groundY; // 260
    const floorH = 140; // up to 400

    // Light blue-green teal tile base (matches the classroom background)
    ctx.fillStyle = '#b8e6d0';
    ctx.fillRect(0, floorY, canvas.width, floorH);

    // Checkerboard pattern with alternating lighter/darker teal
    const tileSize = 30;
    const cycle = groundOffset % (tileSize * 2);
    for (let row = 0; row < Math.ceil(floorH / tileSize); row++) {
        for (let col = -2; col < Math.ceil(canvas.width / tileSize) + 2; col++) {
            const isLight = (row + col) % 2 === 0;
            ctx.fillStyle = isLight ? '#c8f0de' : '#a0d8c0';
            ctx.fillRect(col * tileSize - cycle, floorY + row * tileSize, tileSize, tileSize);
        }
    }

    // Thin grout lines
    ctx.strokeStyle = '#88c0a8';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let y = floorY; y <= floorY + floorH; y += tileSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    for (let x = -tileSize * 2; x < canvas.width + tileSize * 2; x += tileSize) {
        ctx.moveTo(x - cycle, floorY);
        ctx.lineTo(x - cycle, floorY + floorH);
    }
    ctx.stroke();

    // Top baseboard trim (dark teal)
    ctx.fillStyle = '#5a9a80';
    ctx.fillRect(0, floorY, canvas.width, 4);
}

function drawGame() {
    // Clear canvas with base background color
    ctx.fillStyle = (currentLevel === 2 || currentLevel === 3) ? '#d8dee9' : '#7ac2f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentLevel === 2 || currentLevel === 3 || currentLevel === 4) {
        // --- LEVEL 2, 3 & 4 INDOOR/GARDENS BACKDROP RENDER ---
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        const bgHeight = player.groundY + 10; // 270px
        
        if (currentLevel === 4) {
            // Draw Level 4 scrolling backdrop - switches at 250m
            const bgScroll = (distance * 20) % canvas.width;
            const useSecondBg = distance >= 250;
            const activeBgImg = useSecondBg ? campusGreeneryBgImage : gardensBgImage;
            const activeBgLoaded = useSecondBg ? isCampusGreeneryBgLoaded : isGardensBgLoaded;
            if (activeBgLoaded) {
                ctx.drawImage(activeBgImg, -bgScroll, 0, canvas.width, bgHeight);
                ctx.drawImage(activeBgImg, canvas.width - bgScroll, 0, canvas.width, bgHeight);
            } else {
                ctx.fillStyle = '#b8e6d0';
                ctx.fillRect(0, 0, canvas.width, bgHeight);
            }
        } else if (currentLevel === 3) {
            // Draw Level 3 stationary classroom lab backdrop
            if (isClassroomLevel3Loaded) {
                ctx.drawImage(classroomLevel3Image, 0, 0, canvas.width, bgHeight);
            } else {
                ctx.fillStyle = '#1f232a';
                ctx.fillRect(0, 0, canvas.width, bgHeight);
            }

            // Draw the Professor Boss floating on the right
            const bossFloat = Math.sin(Date.now() / 250) * 8;
            const bossX = canvas.width - 150;
            const bossY = player.groundY - 100 + bossFloat;
            
            if (isProfessorLoaded && transparentProfessorCanvas) {
                ctx.drawImage(transparentProfessorCanvas, bossX, bossY, 110, 110);
            } else {
                // Fallback vector drawing (Professor body)
                ctx.fillStyle = '#3f51b5';
                ctx.fillRect(bossX + 30, bossY + 40, 40, 50);
                ctx.fillStyle = '#ffdbb5';
                ctx.fillRect(bossX + 40, bossY + 10, 20, 30);
            }
            
            // Draw a subtle neon glow border
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(bossX, bossY, 110, 110);
            
            // Text label
            ctx.fillStyle = '#ff007f';
            ctx.font = '5px "Press Start 2P"';
            ctx.fillText("THE EXAMINER", bossX + 15, bossY - 8);
        } else {
            // Level 2 scrolling corridor backdrop
            const bgScroll = (distance * 25) % canvas.width;

            // Corridor only for Level 2
            if (isCorridorLoaded) {
                ctx.drawImage(corridorImage, -bgScroll, 0, canvas.width, bgHeight);
                ctx.drawImage(corridorImage, canvas.width - bgScroll, 0, canvas.width, bgHeight);
            }
        }
        ctx.restore();
    } else {
        // --- LEVEL 1 OUTDOOR PARALLAX RENDER ---
        bgLayers[0].draw(); // Sky, Sun, Mountains

        // Draw Dynamic Clouds
        ctx.fillStyle = '#ffffff';
        cloudsArray.forEach(c => {
            ctx.fillRect(c.x, c.y, c.width, 20);
            ctx.fillRect(c.x + 15, c.y - 8, c.width - 30, 8);
            ctx.fillRect(c.x + 30, c.y - 16, c.width - 60, 8);
        });

        // Draw Dynamic Birds (Flapping Vs)
        ctx.fillStyle = '#000000';
        birdsArray.forEach(b => {
            const flap = Math.sin(b.flapPhase) > 0;
            if (flap) {
                // Wings up \ /
                ctx.fillRect(b.x, b.y, 4, 4);
                ctx.fillRect(b.x + 8, b.y, 4, 4);
                ctx.fillRect(b.x + 4, b.y + 4, 4, 4);
            } else {
                // Wings down / \
                ctx.fillRect(b.x, b.y + 4, 4, 4);
                ctx.fillRect(b.x + 8, b.y + 4, 4, 4);
                ctx.fillRect(b.x + 4, b.y, 4, 4);
            }
        });

        bgLayers[1].draw(); // Buildings
        bgLayers[2].draw(); // Foreground trees & poles
    }

    // Draw running road and red pavement
    drawRoad();

    // Draw items (obstacles, collectibles)
    items.forEach(item => item.draw());

    // Draw particles (dust, sparks)
    particles.forEach(p => p.draw());

    // Draw player Vardhan
    player.draw();
}

function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// --- Keyboard & Key State Handlers ---
window.addEventListener('keydown', (e) => {
    if (e.repeat) return;

    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameState === 'NOTIF') {
            dismissNotif();
        } else if (gameState === 'PLAYING') {
            player.jump();
        } else if (gameState === 'MENU' && e.code === 'Space') {
            startGame();
        } else if (gameState === 'WIN') {
            if (currentLevel === 1) {
                startLevel2();
            } else if (currentLevel === 2) {
                startLevel3();
            } else if (currentLevel === 4) {
                // Play Level 4 again in Part 2
                initGame(4);
                gameState = 'PLAYING';
                document.getElementById('win-screen').classList.add('hidden');
                hudElement.classList.remove('hidden');
                synth.startBGM();
            } else {
                // Restart from Level 1
                initGame(1);
                gameState = 'PLAYING';
                document.getElementById('win-screen').classList.add('hidden');
                hudElement.classList.remove('hidden');
                synth.startBGM();
            }
        } else if (gameState === 'GAMEOVER') {
            restartGame();
        }
    }
    
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (gameState === 'PLAYING') {
            e.preventDefault();
            player.slide();
        }
    }

    // Campaign Selector cycling on Menu Screen
    if (gameState === 'MENU') {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowUp' || e.code === 'KeyA' || e.code === 'KeyW') {
            e.preventDefault();
            selectedCampaign = 'commute';
            localStorage.setItem('btech-campaign', 'commute');
            updateCampaignUI();
        } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown' || e.code === 'KeyD' || e.code === 'KeyS') {
            e.preventDefault();
            selectedCampaign = 'placement';
            localStorage.setItem('btech-campaign', 'placement');
            updateCampaignUI();
        }
    }

    if (e.code === 'Escape') {
        e.preventDefault();
        togglePause();
    }
});

// Mobile/Touch Support (Swipes)
let touchStartX = 0;
let touchStartY = 0;

const crtScreen = document.querySelector('.crt-screen');

crtScreen.addEventListener('touchstart', (e) => {
    // Ignore touches on interactive buttons/links
    if (e.target.closest('.control-btn') || e.target.closest('button') || e.target.closest('a') || e.target.closest('.campaign-option-card')) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    
    if (gameState === 'NOTIF') {
        dismissNotif();
    } else if (gameState === 'MENU') {
        startGame();
    } else if (gameState === 'WIN') {
        if (currentLevel === 1) {
            startLevel2();
        } else {
            startGame();
        }
    } else if (gameState === 'GAMEOVER') {
        restartGame();
    }
}, { passive: true });

crtScreen.addEventListener('touchend', (e) => {
    // Ignore touches on interactive buttons/links
    if (e.target.closest('.control-btn') || e.target.closest('button') || e.target.closest('a') || e.target.closest('.campaign-option-card')) return;
    if (gameState !== 'PLAYING') return;

    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    // Detect Vertical Swipes
    if (Math.abs(diffY) > Math.abs(diffX)) {
        if (diffY < -30) {
            // Swipe Up
            player.jump();
        } else if (diffY > 30) {
            // Swipe Down
            player.slide();
        }
    } else {
        // Tapping screen acts as jump too
        if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
            player.jump();
        }
    }
}, { passive: true });

// --- Screen Transitions ---
function startGame() {
    gameState = 'PLAYING';
    menuScreen.classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('notif-popup').classList.add('hidden');
    hudElement.classList.remove('hidden');
    if (pauseToggleBtn) pauseToggleBtn.style.display = 'block';
    
    if (selectedCampaign === 'placement') {
        initGame(4);
    } else {
        initGame(1);
    }
    synth.init();
    synth.startBGM();
}

function startLevel2() {
    gameState = 'PLAYING';
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('notif-popup').classList.add('hidden');
    hudElement.classList.remove('hidden');
    if (pauseToggleBtn) pauseToggleBtn.style.display = 'block';
    
    initGame(2);
    synth.startBGM();
}

function startLevel3() {
    gameState = 'PLAYING';
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('notif-popup').classList.add('hidden');
    hudElement.classList.remove('hidden');
    if (pauseToggleBtn) pauseToggleBtn.style.display = 'block';
    
    initGame(3);
    synth.startBGM();
}

function restartGame() {
    gameState = 'PLAYING';
    gameoverScreen.classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('notif-popup').classList.add('hidden');
    hudElement.classList.remove('hidden');
    if (pauseToggleBtn) pauseToggleBtn.style.display = 'block';
    
    initGame(currentLevel);
    synth.startBGM();
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseScreen.classList.remove('hidden');
        synth.stopBGM();
        if (pauseToggleBtn) pauseToggleBtn.textContent = '▶';
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        pauseScreen.classList.add('hidden');
        synth.startBGM();
        if (pauseToggleBtn) pauseToggleBtn.textContent = '⏸';
    }
}

// Initial draw to render Menu
drawGame();
requestAnimationFrame(gameLoop);

// Allow clicking the notification popup to dismiss it immediately
document.getElementById('notif-popup').addEventListener('click', () => {
    dismissNotif();
});

// --- Sound Button Initialization ---
const savedMute = localStorage.getItem('btech-muted') !== 'false';
synth.muted = savedMute;
if (savedMute) {
    soundBtn.textContent = 'MUTED';
    soundBtn.classList.remove('unmuted');
} else {
    soundBtn.textContent = 'SOUND ON';
    soundBtn.classList.add('unmuted');
}

// --- Theme Toggle Logic & Event Listeners ---
const savedTheme = localStorage.getItem('btech-theme') || 'light';
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggleBtn.textContent = '🌙';
} else {
    themeToggleBtn.textContent = '☀️';
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggleBtn.textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('btech-theme', isDark ? 'dark' : 'light');
});

// Pause Button Click Listener
pauseToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent canvas touch trigger
    togglePause();
});

// Initially hide pause button on Menu Screen
if (pauseToggleBtn) {
    pauseToggleBtn.style.display = 'none';
}

// Initialize
if (typeof updateSkinUI === 'function') {
    updateSkinUI();
}

// --- Campaign Selection Toggle Logic & Initialization ---
function updateCampaignUI() {
    if (!campaignBtnCommute || !campaignBtnPlacement) return;
    
    const menuDescEl = document.querySelector('.menu-desc');
    const storyTeaserEl = document.querySelector('.story-teaser');

    if (selectedCampaign === 'placement') {
        campaignBtnPlacement.classList.add('active');
        campaignBtnCommute.classList.remove('active');
        
        if (menuDescEl) {
            menuDescEl.textContent = "You cleared the DAA Viva! 🎓 But your final-round Campus Placement interview with 'YOLO Tech' starts in 10 minutes at the Seminar Hall! Run across the campus lawns to get there!";
        }
        if (storyTeaserEl) {
            storyTeaserEl.innerHTML = '<span class="story-tag">GOAL:</span> Maintain <strong class="neon-pink">&gt;75% Profile Strength</strong>. Dodge competitive peers, security guards, and flying flyers!';
        }
    } else {
        campaignBtnCommute.classList.add('active');
        campaignBtnPlacement.classList.remove('active');
        
        if (menuDescEl) {
            menuDescEl.textContent = "You woke up at 8:45 AM! Your DAA Lab Viva starts at 9:00 AM. Run to college before the Professor debars you!";
        }
        if (storyTeaserEl) {
            storyTeaserEl.innerHTML = '<span class="story-tag">GOAL:</span> Maintain <strong class="neon-pink">&gt;75% Attendance</strong>. Escape Gully Dogs, Autos, Cows, and the Professor!';
        }
    }
}

if (campaignBtnCommute) {
    campaignBtnCommute.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedCampaign = 'commute';
        localStorage.setItem('btech-campaign', 'commute');
        updateCampaignUI();
    });
}

if (campaignBtnPlacement) {
    campaignBtnPlacement.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedCampaign = 'placement';
        localStorage.setItem('btech-campaign', 'placement');
        updateCampaignUI();
    });
}

updateCampaignUI();
