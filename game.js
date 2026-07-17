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

// Image Objects Declaration (Loaded asynchronously via Promise.all)
const spriteSheet = new Image();
let isSpriteSheetLoaded = false;
let transparentSpriteCanvas = null;

const gardensBgImage = new Image();
let isGardensBgLoaded = false;

const campusGreeneryBgImage = new Image();
let isCampusGreeneryBgLoaded = false;

const peerImage = new Image();
let isPeerLoaded = false;
let transparentPeerCanvas = null;

const securityImage = new Image();
let isSecurityLoaded = false;
let transparentSecurityCanvas = null;

const resumeImage = new Image();
let isResumeLoaded = false;
let transparentResumeCanvas = null;

const flyerImage = new Image();
let isFlyerLoaded = false;
let transparentFlyerCanvas = null;

const dogImage = new Image();
let isDogImageLoaded = false;
let transparentDogCanvas = null;

const cowImage = new Image();
let isCowImageLoaded = false;
let transparentCowCanvas = null;

const corridorImage = new Image();
let isCorridorLoaded = false;

const classroomLevel3Image = new Image();
let isClassroomLevel3Loaded = false;

const professorImage = new Image();
let isProfessorLoaded = false;
let transparentProfessorCanvas = null;

function preloadImage(imgObject, src, processCallback = null) {
    return new Promise((resolve) => {
        imgObject.onload = () => {
            if (processCallback) processCallback();
            resolve();
        };
        imgObject.onerror = () => {
            console.error("Failed to load image:", src);
            resolve();
        };
        imgObject.src = src;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const menuTitle = document.querySelector('#menu-screen .menu-title');
    if (menuTitle) {
        menuTitle.textContent = "LOADING CAMPUS ASSETS...";
    }

    const preloadPromises = [
        preloadImage(spriteSheet, 'assets/vardhan_spritesheet.jpg', () => { isSpriteSheetLoaded = true; processSpriteSheet(); }),
        preloadImage(gardensBgImage, 'assets/gardens_bg.jpg', () => { isGardensBgLoaded = true; }),
        preloadImage(campusGreeneryBgImage, 'assets/campus_greenery_bg.jpg', () => { isCampusGreeneryBgLoaded = true; }),
        preloadImage(peerImage, 'assets/peer.png', () => { isPeerLoaded = true; processPeerImage(); }),
        preloadImage(securityImage, 'assets/security.png', () => { isSecurityLoaded = true; processSecurityImage(); }),
        preloadImage(resumeImage, 'assets/resume.jpg', () => { isResumeLoaded = true; processResumeImage(); }),
        preloadImage(flyerImage, 'assets/placement_flyer.jpg', () => { isFlyerLoaded = true; processFlyerImage(); }),
        preloadImage(dogImage, 'assets/dog.png', () => { isDogImageLoaded = true; processDogImage(); }),
        preloadImage(cowImage, 'assets/cow.png', () => { isCowImageLoaded = true; processCowImage(); }),
        preloadImage(corridorImage, 'assets/corridor.jpg', () => { isCorridorLoaded = true; }),
        preloadImage(classroomLevel3Image, 'assets/classroom_level3.png', () => { isClassroomLevel3Loaded = true; }),
        preloadImage(professorImage, 'assets/professor.png', () => { isProfessorLoaded = true; processProfessorImage(); })
    ];

    Promise.all(preloadPromises).then(() => {
        console.log("All assets preloaded successfully! Game ready.");
        if (menuTitle) {
            menuTitle.textContent = "PRESS SPACE TO START";
        }
    });
});

// --- Spritesheet Pixel Processor ---
function processSpriteSheet() {
    transparentSpriteCanvas = document.createElement('canvas');
    transparentSpriteCanvas.width = spriteSheet.width;
    transparentSpriteCanvas.height = spriteSheet.height;
    const tempCtx = transparentSpriteCanvas.getContext('2d');
    tempCtx.drawImage(spriteSheet, 0, 0);
    try {
        const imgData = tempCtx.getImageData(0, 0, spriteSheet.width, spriteSheet.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2];
            // Remove pure white / near-white background pixels
            if (r > 230 && g > 230 && b > 230) {
                data[i+3] = 0;
            }
        }
        tempCtx.putImageData(imgData, 0, 0);
    } catch (e) {
        // CORS: file:// protocol blocks getImageData — just use the raw image drawn onto canvas
        console.warn('Spritesheet CORS fallback — using raw image.', e);
        tempCtx.clearRect(0, 0, transparentSpriteCanvas.width, transparentSpriteCanvas.height);
        tempCtx.drawImage(spriteSheet, 0, 0);
    }
    console.log('✅ Hero spritesheet ready!', spriteSheet.width, 'x', spriteSheet.height);
}

function processPeerImage() {
    transparentPeerCanvas = document.createElement('canvas');
    transparentPeerCanvas.width = peerImage.width;
    transparentPeerCanvas.height = peerImage.height;
    const tempCtx = transparentPeerCanvas.getContext('2d');
    tempCtx.drawImage(peerImage, 0, 0);
    try {
        const imgData = tempCtx.getImageData(0, 0, peerImage.width, peerImage.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 210 && data[i + 1] > 210 && data[i + 2] > 210) data[i + 3] = 0;
        }
        tempCtx.putImageData(imgData, 0, 0);
    } catch (e) {
        console.warn("Local CORS security policy blocked peer image manipulation. Using raw image.", e);
        tempCtx.drawImage(peerImage, 0, 0);
    }
}

function processSecurityImage() {
    transparentSecurityCanvas = document.createElement('canvas');
    transparentSecurityCanvas.width = securityImage.width;
    transparentSecurityCanvas.height = securityImage.height;
    const tempCtx = transparentSecurityCanvas.getContext('2d');
    tempCtx.drawImage(securityImage, 0, 0);
    try {
        const imgData = tempCtx.getImageData(0, 0, securityImage.width, securityImage.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 210 && data[i + 1] > 210 && data[i + 2] > 210) data[i + 3] = 0;
        }
        tempCtx.putImageData(imgData, 0, 0);
    } catch (e) {
        console.warn("Local CORS security policy blocked security image manipulation. Using raw image.", e);
        tempCtx.drawImage(securityImage, 0, 0);
    }
}

function processResumeImage() {
    transparentResumeCanvas = document.createElement('canvas');
    transparentResumeCanvas.width = resumeImage.width;
    transparentResumeCanvas.height = resumeImage.height;
    const tempCtx = transparentResumeCanvas.getContext('2d');
    tempCtx.drawImage(resumeImage, 0, 0);
    try {
        const imgData = tempCtx.getImageData(0, 0, resumeImage.width, resumeImage.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) data[i + 3] = 0;
        }
        tempCtx.putImageData(imgData, 0, 0);
    } catch (e) {
        console.warn("Local CORS security policy blocked resume image manipulation. Using raw image.", e);
        tempCtx.drawImage(resumeImage, 0, 0);
    }
}

function processFlyerImage() {
    transparentFlyerCanvas = document.createElement('canvas');
    transparentFlyerCanvas.width = flyerImage.width;
    transparentFlyerCanvas.height = flyerImage.height;
    const tempCtx = transparentFlyerCanvas.getContext('2d');
    tempCtx.drawImage(flyerImage, 0, 0);
    try {
        const imgData = tempCtx.getImageData(0, 0, flyerImage.width, flyerImage.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) data[i + 3] = 0;
        }
        tempCtx.putImageData(imgData, 0, 0);
    } catch (e) {
        console.warn("Local CORS security policy blocked flyer image manipulation. Using raw image.", e);
        tempCtx.drawImage(flyerImage, 0, 0);
    }
}



function processProfessorImage() {
    transparentProfessorCanvas = document.createElement('canvas');
    transparentProfessorCanvas.width = professorImage.width;
    transparentProfessorCanvas.height = professorImage.height;
    const tempCtx = transparentProfessorCanvas.getContext('2d');
    tempCtx.drawImage(professorImage, 0, 0);

    try {
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
    } catch (e) {
        console.warn("Local CORS security policy blocked professor image manipulation. Using raw image.", e);
        tempCtx.drawImage(professorImage, 0, 0);
    }
}

function processDogImage() {
    transparentDogCanvas = document.createElement('canvas');
    transparentDogCanvas.width = dogImage.width;
    transparentDogCanvas.height = dogImage.height;
    const tempCtx = transparentDogCanvas.getContext('2d');
    tempCtx.drawImage(dogImage, 0, 0);

    try {
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
    } catch (e) {
        console.warn("Local CORS security policy blocked dog image manipulation. Using raw image.", e);
        tempCtx.drawImage(dogImage, 0, 0);
    }
}

function processCowImage() {
    transparentCowCanvas = document.createElement('canvas');
    transparentCowCanvas.width = cowImage.width;
    transparentCowCanvas.height = cowImage.height;
    const tempCtx = transparentCowCanvas.getContext('2d');
    tempCtx.drawImage(cowImage, 0, 0);

    try {
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
    } catch (e) {
        console.warn("Local CORS security policy blocked cow image manipulation. Using raw image.", e);
        tempCtx.drawImage(cowImage, 0, 0);
    }
}



// Mute button listener
document.addEventListener('DOMContentLoaded', () => {
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn && typeof synth !== 'undefined') {
        soundBtn.addEventListener('click', () => synth.toggleMute());
    }
});

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
            
            const laserItem = acquireItem('laser', canvas.width - 160, 0, 1.4);
            laserItem.qaPair = pair;
            laserItem.questionText = pair.q;
            
            const answerItem = acquireItem('answer', canvas.width + 50, 0, 1.1, pair.a);
            
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
                newItem = acquireItem(obsType, canvas.width + 50, 0);
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
                newItem = acquireItem(colType, canvas.width + 50, spawnY);
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
    items.forEach(item => item.update(gameSpeed, currentLevel, magnetTimer, player));
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
                // Seamless horizontal scroll: tile 1 scrolls left, tile 2 immediately follows
                const t1x = -bgScroll;
                const t2x = canvas.width - bgScroll;
                ctx.drawImage(activeBgImg, t1x, 0, canvas.width, bgHeight);
                ctx.drawImage(activeBgImg, t2x, 0, canvas.width, bgHeight);
            } else {
                // Fallback gradient sky + green grass
                const grd = ctx.createLinearGradient(0, 0, 0, bgHeight);
                grd.addColorStop(0, '#87ceeb');
                grd.addColorStop(0.6, '#c8e6c9');
                grd.addColorStop(1, '#388e3c');
                ctx.fillStyle = grd;
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
    items.forEach(item => item.draw(ctx, isDogImageLoaded, transparentDogCanvas, isCowImageLoaded, transparentCowCanvas, isPeerLoaded, transparentPeerCanvas, isSecurityLoaded, transparentSecurityCanvas));

    // Draw particles (dust, sparks)
    particles.forEach(p => p.draw(ctx));

    // Draw player Vardhan
    player.draw(ctx, transparentSpriteCanvas, isSpriteSheetLoaded, SPRITE_MAP, invincibilityTimer, gameState);
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
                if (pauseToggleBtn) pauseToggleBtn.style.display = 'block';
                synth.startBGM();
            } else {
                // Restart from Level 1
                initGame(1);
                gameState = 'PLAYING';
                document.getElementById('win-screen').classList.add('hidden');
                hudElement.classList.remove('hidden');
                if (pauseToggleBtn) pauseToggleBtn.style.display = 'block';
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
