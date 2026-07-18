/* -------------------------------------------------------------
   SEMESTER SPRINT - OBSTACLES, COLLECTIBLES, PARTICLES & COLLISIONS (obstacles.js)
   Handles GameItem, Particle, Object Pooling, Spawners, and Collisions.
   ------------------------------------------------------------- */

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
        // Safe access to player groundY (falls back to 260 if player not loaded yet)
        const groundY = (typeof player !== 'undefined') ? player.groundY : 260;

        switch (this.type) {
            case 'dog':
                this.width = 72;
                this.height = 58;
                this.y = groundY + 2;
                this.animFrame = 0;
                break;
            case 'cow':
                this.width = 90;
                this.height = 76;
                this.y = groundY - 16;
                break;
            case 'auto':
                this.width = 72;
                this.height = 58;
                this.y = groundY + 42;
                break;
            case 'sharma':
                this.width = 36;
                this.height = 72;
                this.y = groundY;
                this.direction = -1;
                this.walkRange = 80;
                this.startX = this.x;
                break;
            case 'bug':
                this.width = 130;
                this.height = 28;
                this.y = groundY - 52;
                const bugs = ["NullPointerException", "Segmentation Fault", "Merge Conflict", "StackOverflowError", "Infinite Loop"];
                this.bugText = bugs[Math.floor(Math.random() * bugs.length)];
                break;
            case 'bench':
                this.width = 65;
                this.height = 36;
                this.y = groundY + 24; 
                break;
            case 'podium':
                this.width = 40;
                this.height = 60;
                this.y = groundY;
                break;
            case 'peer':
                this.width = 32;
                this.height = 70;
                this.y = groundY - 10;
                this.peerIndexX = Math.floor(Math.random() * 4);
                this.peerIndexY = Math.floor(Math.random() * 2);
                break;
            case 'security':
                this.width = 40;
                this.height = 72;
                this.y = groundY - 12;
                break;
            case 'placement_flyer':
                this.width = 30;
                this.height = 30;
                this.y = groundY + 5 + Math.random() * 10;
                break;
            case 'resume':
                this.width = 24;
                this.height = 28;
                this.y = groundY - 24;
                break;
            case 'backpack':
                this.width = 34;
                this.height = 34;
                this.y = groundY + 26;
                break;
            case 'classmate':
                this.width = 32;
                this.height = 70;
                this.y = groundY - 10;
                break;
            case 'wetsign':
                this.width = 30;
                this.height = 42;
                this.y = groundY + 18;
                break;
            case 'pothole':
                this.width = 56;
                this.height = 16;
                this.y = groundY + 48;
                break;
            case 'trashcan':
                this.width = 32;
                this.height = 45;
                this.y = groundY + 15;
                break;
            case 'chai':
                this.width = 28;
                this.height = 28;
                this.y = groundY - 20;
                break;
            case 'sheet':
                this.width = 24;
                this.height = 28;
                this.y = groundY - 24;
                break;
            case 'commit':
                this.width = 22;
                this.height = 22;
                this.y = groundY - 18;
                break;
            case 'magnet':
                this.width = 24;
                this.height = 24;
                this.y = groundY - 20;
                break;
            case 'laser':
                this.width = 50;
                this.height = 6;
                this.isHigh = Math.random() < 0.5;
                this.y = this.isHigh ? groundY - 15 : groundY + 30;
                
                const qaIndex = Math.floor(Math.random() * VIVA_QA.length);
                this.qaPair = VIVA_QA[qaIndex];
                this.questionText = this.qaPair.q;
                this.laserColor = this.isHigh ? '#ff0055' : '#00ffcc';
                break;
            case 'answer':
                this.width = 130;
                this.height = 24;
                this.y = groundY - 35 - Math.random() * 80;
                this.answerText = this.extra || "O(1)";
                break;
        }
    }

    getHitbox() {
        return {
            x: this.x + 4,
            y: this.y + 4,
            w: this.width - 8,
            h: this.height - 8
        };
    }

    update(gameSpeed, currentLevel, magnetTimer, player) {
        let speed = gameSpeed * this.speedMult;
        if (currentLevel === 3) {
            speed = 5.5 * this.speedMult;
        }
        
        // Sharma walks back and forth
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
                if (typeof vivaProgress !== 'undefined') {
                    vivaProgress++;
                    if (typeof updateHUD === 'function') updateHUD();
                    if (vivaProgress >= 5 && typeof triggerWin === 'function') {
                        triggerWin();
                    }
                } else if (typeof window.vivaProgress !== 'undefined') {
                    window.vivaProgress++;
                    if (typeof updateHUD === 'function') updateHUD();
                    if (window.vivaProgress >= 5 && typeof triggerWin === 'function') {
                        triggerWin();
                    }
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

    draw(ctx, isDogImageLoaded, transparentDogCanvas, isCowImageLoaded, transparentCowCanvas, isPeerLoaded, transparentPeerCanvas, isSecurityLoaded, transparentSecurityCanvas) {
        ctx.save();

        switch (this.type) {
            case 'dog':
                if (isDogImageLoaded && transparentDogCanvas) {
                    ctx.save();
                    const bounce = Math.sin(Date.now() / 80) * 4;
                    ctx.drawImage(transparentDogCanvas, this.x, this.y + bounce, this.width, this.height);
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#b05a27';
                    ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
                }
                break;
                
            case 'cow':
                if (isCowImageLoaded && transparentCowCanvas) {
                    ctx.drawImage(transparentCowCanvas, this.x, this.y, this.width, this.height);
                } else {
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
                ctx.fillStyle = '#6d4c41'; // Dark wooden body
                ctx.fillRect(this.x + 4, this.y + 10, this.width - 8, this.height - 10);
                ctx.fillStyle = '#8d6e63'; // Lighter brown top
                ctx.fillRect(this.x, this.y + 2, this.width, 8);
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x + 12, this.y + 2);
                ctx.lineTo(this.x + 8, this.y - 12);
                ctx.stroke();
                ctx.fillStyle = '#aaaaaa';
                ctx.fillRect(this.x + 6, this.y - 15, 4, 4);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x + 20, this.y + 4, 12, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 22, this.y + 6, 8, 1);
                break;

            case 'backpack':
                ctx.fillStyle = '#0288d1'; // Bright blue backpack
                ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 4);
                ctx.fillStyle = '#03a9f4'; // Lighter blue front pocket
                ctx.fillRect(this.x + 8, this.y + 14, this.width - 16, this.height - 18);
                ctx.fillStyle = '#01579b'; // Dark blue straps/handle
                ctx.fillRect(this.x + 12, this.y, 10, 4);
                ctx.fillStyle = '#cfd8dc'; // Silver zipper
                ctx.fillRect(this.x + 6, this.y + 12, this.width - 12, 2);
                ctx.fillRect(this.x + 10, this.y + 24, this.width - 20, 2);
                break;

            case 'classmate':
                ctx.fillStyle = '#78909c'; // Blue-grey hoodie
                ctx.fillRect(this.x + 6, this.y + 16, 20, 28);
                ctx.fillStyle = '#3f51b5'; // Blue jeans
                ctx.fillRect(this.x + 8, this.y + 44, 7, 26);
                ctx.fillRect(this.x + 17, this.y + 44, 7, 26);
                ctx.fillStyle = '#ffdbb5'; // Skin color
                ctx.fillRect(this.x + 8, this.y + 2, 16, 14);
                ctx.fillStyle = '#546e7a'; // Hood outline
                ctx.fillRect(this.x + 6, this.y, 20, 4);
                ctx.fillRect(this.x + 6, this.y, 4, 16);
                ctx.fillRect(this.x + 22, this.y, 4, 16);
                ctx.fillStyle = '#263238'; // Downcast eyes
                ctx.fillRect(this.x + 10, this.y + 8, 3, 2);
                ctx.fillStyle = '#ffdbb5'; // Hands
                ctx.fillRect(this.x + 18, this.y + 26, 6, 6);
                ctx.fillStyle = '#00e5ff'; // Glowing cyan screen
                ctx.fillRect(this.x + 22, this.y + 22, 6, 8);
                ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
                ctx.beginPath();
                ctx.arc(this.x + 25, this.y + 26, 12, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'wetsign':
                ctx.fillStyle = '#ffeb3b'; // Warning yellow
                ctx.beginPath();
                ctx.moveTo(this.x + 6, this.y + this.height);
                ctx.lineTo(this.x + 12, this.y);
                ctx.lineTo(this.x + 18, this.y);
                ctx.lineTo(this.x + 24, this.y + this.height);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#212121';
                ctx.fillRect(this.x + 12, this.y, 6, 3);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x + 15, this.y + 10);
                ctx.lineTo(this.x + 10, this.y + 32);
                ctx.lineTo(this.x + 20, this.y + 32);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = '#d32f2f'; // Red warning sign mark
                ctx.fillRect(this.x + 14, this.y + 16, 2, 8);
                ctx.fillRect(this.x + 14, this.y + 26, 2, 2);
                break;

            case 'peer':
                // Always drawn in canvas code: 8 unique vibrant pixel-art students
                this.drawPeerPixelArt(ctx);
                break;


            case 'security':
                // Always drawn in canvas code: authoritative grey-uniformed guard
                this.drawSecurityPixelArt(ctx);
                break;


            case 'placement_flyer':
                ctx.fillStyle = '#f5f5f5'; // slightly off-white paper
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = '#c62828'; // red border outline
                ctx.lineWidth = 1.5;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#d32f2f';
                ctx.font = 'bold 5px "Press Start 2P"';
                ctx.fillText("INFO", this.x + 3, this.y + 10);
                ctx.fillText("FLYER", this.x + 2, this.y + 20);
                break;

            case 'resume':
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#29b6f6';
                ctx.fillRect(this.x + this.width - 9, this.y + 3, 6, 8);
                ctx.fillStyle = '#212121';
                ctx.fillRect(this.x + 3, this.y + 4, 10, 2);
                ctx.fillRect(this.x + 3, this.y + 8, 8, 2);
                ctx.fillRect(this.x + 3, this.y + 13, 16, 1.5);
                ctx.fillRect(this.x + 3, this.y + 16, 16, 1.5);
                ctx.fillRect(this.x + 3, this.y + 19, 14, 1.5);
                break;

            case 'sharma':
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
                ctx.fillStyle = '#c62828'; // solid dark red background
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.strokeStyle = '#ff1744';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#fff176';
                for (let xi = 0; xi < this.width; xi += 10) {
                    ctx.fillRect(this.x + xi, this.y, 5, 4);
                }
                ctx.fillStyle = '#ffffff';
                ctx.font = '6px "Press Start 2P"';
                ctx.fillText(this.bugText, this.x + 5, this.y + 20);
                if (Math.floor(Date.now() / 200) % 2 === 0) {
                    ctx.fillStyle = '#ff1744';
                } else {
                    ctx.fillStyle = '#fff176';
                }
                ctx.fillRect(this.x + this.width - 12, this.y + 6, 8, 8);
                break;

            case 'pothole':
                ctx.fillStyle = '#1a1a2e'; // Dark deep hole
                ctx.beginPath();
                ctx.ellipse(this.x + 28, this.y + 8, 28, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ff8f00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(this.x + 28, this.y + 8, 28, 8, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = '#ffd54f';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x + 15, this.y + 8);
                ctx.lineTo(this.x + 41, this.y + 8);
                ctx.stroke();
                break;

            case 'trashcan':
                ctx.fillStyle = '#388e3c'; // dark green body
                ctx.fillRect(this.x + 4, this.y + 8, 24, 37);
                ctx.fillStyle = '#4caf50'; // lighter green rim/lid
                ctx.fillRect(this.x, this.y, 32, 8);
                ctx.fillStyle = '#2e7d32'; 
                ctx.fillRect(this.x + 8, this.y + 12, 2, 30);
                ctx.fillRect(this.x + 15, this.y + 12, 2, 30);
                ctx.fillRect(this.x + 22, this.y + 12, 2, 30);
                ctx.fillStyle = '#e0e0e0'; // paper
                ctx.fillRect(this.x + 18, this.y - 4, 8, 6);
                ctx.fillStyle = '#d32f2f'; // apple
                ctx.fillRect(this.x + 6, this.y - 6, 6, 8);
                break;

            case 'chai':
                ctx.fillStyle = '#f5c242'; // Tea color
                ctx.fillRect(this.x + 4, this.y + 8, 14, 14);
                ctx.fillStyle = '#fff'; // Glass rim
                ctx.fillRect(this.x + 2, this.y + 5, 18, 3);
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
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#39ff14'; // Grade green
                ctx.font = 'bold 8px Arial';
                ctx.fillText("75%", this.x + 1, this.y + 16);
                break;

            case 'commit':
                ctx.fillStyle = '#39ff14';
                ctx.shadowColor = '#39ff14';
                ctx.shadowBlur = 10;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
                break;

            case 'magnet':
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
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x, this.y + 1, this.width, this.height - 2);
                ctx.restore();
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

    // 8 unique hand-drawn pixel art student characters
    drawPeerPixelArt(ctx) {
        const x = this.x;
        const y = this.y;
        // peerIndexX: 0-3, peerIndexY: 0-1 → 8 unique variants
        const variant = this.peerIndexY * 4 + this.peerIndexX; // 0..7

        const skins   = ['#f5cba7','#d4a070','#c68642','#8d5524','#f5cba7','#d4a070','#c68642','#8d5524'];
        const hair    = ['#1a0a00','#3b2507','#000000','#2c1a0e','#8B4513','#000000','#1a0a00','#3b2507'];

        // Clothing colour sets per variant [torso, bottom, accent]
        const clothes = [
            ['#2196f3','#37474f','#ff5722'],   // 0 blue hoodie grey jeans
            ['#e91e63','#1a237e','#fff176'],   // 1 pink kurta dark jeans
            ['#f44336','#4a148c','#80cbc4'],   // 2 red tee purple cargo
            ['#4caf50','#3e2723','#ffd54f'],   // 3 green top brown jeans
            ['#ff9800','#263238','#b2ebf2'],   // 4 orange shirt dark jeans
            ['#9c27b0','#388e3c','#ffe082'],   // 5 purple kurta green jeans
            ['#00bcd4','#1b5e20','#ff8a80'],   // 6 cyan hoodie dark green
            ['#ffeb3b','#4e342e','#ce93d8'],   // 7 yellow churidar brown
        ];

        const skinColor = skins[variant];
        const hairColor = hair[variant];
        const [torso, bottom, accentColor] = clothes[variant];

        const W = this.width;   // ~32
        const H = this.height;  // ~70

        const hx = Math.round(W * 0.28); // head x offset
        const hw = Math.round(W * 0.44); // head width
        const hh = Math.round(H * 0.20); // head height

        ctx.save();

        // --- HAIR ---
        ctx.fillStyle = hairColor;
        ctx.fillRect(x + hx - 1, y, hw + 2, Math.round(hh * 0.5));

        // --- HEAD ---
        ctx.fillStyle = skinColor;
        ctx.fillRect(x + hx, y + Math.round(hh * 0.25), hw, hh);

        // --- EYES (facing left) ---
        ctx.fillStyle = '#111';
        ctx.fillRect(x + hx + 2, y + Math.round(hh * 0.55), 3, 2);

        // --- MOUTH expression smile ---
        ctx.fillStyle = '#b03030';
        ctx.fillRect(x + hx + 3, y + Math.round(hh * 0.85), 4, 1);

        // --- NECK ---
        const neckY = y + hh + Math.round(hh * 0.25);
        ctx.fillStyle = skinColor;
        ctx.fillRect(x + hx + Math.round(hw * 0.3), neckY, Math.round(hw * 0.4), 4);

        // --- TORSO ---
        const torsoY = neckY + 3;
        const torsoH = Math.round(H * 0.35);
        ctx.fillStyle = torso;
        ctx.fillRect(x + Math.round(W * 0.1), torsoY, Math.round(W * 0.8), torsoH);

        // Accent detail (collar/badge stripe)
        ctx.fillStyle = accentColor;
        ctx.fillRect(x + Math.round(W * 0.42), torsoY + 2, Math.round(W * 0.16), Math.round(torsoH * 0.55));

        // --- LEFT ARM (near side, holding something) ---
        ctx.fillStyle = torso;
        ctx.fillRect(x, torsoY + 2, Math.round(W * 0.12), Math.round(torsoH * 0.75));
        // Hand
        ctx.fillStyle = skinColor;
        ctx.fillRect(x, torsoY + Math.round(torsoH * 0.65), Math.round(W * 0.12), 5);

        // --- ACCESSORY based on variant ---
        if (variant === 0 || variant === 4) {
            // Backpack strap visible on back
            ctx.fillStyle = accentColor;
            ctx.fillRect(x + Math.round(W * 0.7), torsoY, 4, torsoH);
        }
        if (variant === 1 || variant === 5) {
            // Dupatta/scarf across shoulder
            ctx.fillStyle = accentColor;
            ctx.fillRect(x + Math.round(W * 0.55), torsoY, Math.round(W * 0.3), 4);
        }
        if (variant === 2 || variant === 6) {
            // Headphones on head
            ctx.fillStyle = '#333';
            ctx.fillRect(x + hx - 2, y + Math.round(hh * 0.3), 4, hh);
        }
        if (variant === 3 || variant === 7) {
            // Books carried in right arm
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + Math.round(W * 0.62), torsoY + 8, 8, Math.round(torsoH * 0.7));
            ctx.fillStyle = accentColor;
            ctx.fillRect(x + Math.round(W * 0.62), torsoY + 8, 8, 3);
        }

        // --- LEGS ---
        const legY = torsoY + torsoH;
        const legH = Math.round(H * 0.30);
        ctx.fillStyle = bottom;
        // Left leg
        ctx.fillRect(x + Math.round(W * 0.15), legY, Math.round(W * 0.3), legH);
        // Right leg
        ctx.fillRect(x + Math.round(W * 0.52), legY, Math.round(W * 0.3), legH);

        // Belt line
        ctx.fillStyle = '#333';
        ctx.fillRect(x + Math.round(W * 0.13), legY, Math.round(W * 0.74), 2);

        // --- SHOES ---
        const shoeY = legY + legH;
        ctx.fillStyle = '#111';
        ctx.fillRect(x + Math.round(W * 0.12), shoeY, Math.round(W * 0.32), 4);
        ctx.fillRect(x + Math.round(W * 0.49), shoeY, Math.round(W * 0.32), 4);

        // --- GLASSES for variant 4 ---
        if (variant === 4) {
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + hx + 1, y + Math.round(hh * 0.48), 5, 4);
            ctx.strokeRect(x + hx + 7, y + Math.round(hh * 0.48), 5, 4);
        }

        // --- SHADOW on ground ---
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + 4, shoeY + 4, W - 8, 3);

        ctx.restore();
    }

    drawSecurityPixelArt(ctx) {
        const x = this.x;
        const y = this.y;
        const W = this.width;   // ~40
        const H = this.height;  // ~72

        ctx.save();

        // --- HAIR (short, dark) ---
        ctx.fillStyle = '#1a0a00';
        ctx.fillRect(x + Math.round(W*0.2), y, Math.round(W*0.6), 6);

        // --- HEAD ---
        ctx.fillStyle = '#c68642';
        ctx.fillRect(x + Math.round(W*0.22), y + 4, Math.round(W*0.56), Math.round(H*0.18));

        // --- STERN EYES ---
        ctx.fillStyle = '#111';
        ctx.fillRect(x + Math.round(W*0.27), y + 8, 4, 2);
        ctx.fillRect(x + Math.round(W*0.55), y + 8, 4, 2);

        // Thick eyebrows
        ctx.fillStyle = '#1a0a00';
        ctx.fillRect(x + Math.round(W*0.26), y + 6, 5, 2);
        ctx.fillRect(x + Math.round(W*0.53), y + 6, 5, 2);

        // Serious mouth (flat line)
        ctx.fillStyle = '#8b3a3a';
        ctx.fillRect(x + Math.round(W*0.32), y + 14, 7, 1);

        // --- NECK ---
        const neckY = y + Math.round(H*0.18) + 5;
        ctx.fillStyle = '#c68642';
        ctx.fillRect(x + Math.round(W*0.38), neckY, Math.round(W*0.24), 5);

        // --- GREY UNIFORM SHIRT ---
        const torsoY = neckY + 4;
        const torsoH = Math.round(H*0.36);
        ctx.fillStyle = '#607d8b'; // Slate grey uniform
        ctx.fillRect(x + Math.round(W*0.08), torsoY, Math.round(W*0.84), torsoH);

        // Collar (darker)
        ctx.fillStyle = '#455a64';
        ctx.fillRect(x + Math.round(W*0.35), torsoY, Math.round(W*0.3), 6);

        // Badge (gold star on chest)
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + Math.round(W*0.2), torsoY + 8, 8, 8);
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(x + Math.round(W*0.22), torsoY + 10, 4, 4);

        // Shoulder stripes (authority marks)
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + Math.round(W*0.1), torsoY + 2, Math.round(W*0.16), 3);
        ctx.fillRect(x + Math.round(W*0.74), torsoY + 2, Math.round(W*0.16), 3);

        // --- LEFT ARM raised (stop gesture!) ---
        ctx.fillStyle = '#607d8b';
        ctx.fillRect(x, torsoY + 2, Math.round(W*0.1), Math.round(torsoH*0.6));
        // Hand raised up (palm out)
        ctx.fillStyle = '#c68642';
        ctx.fillRect(x - 2, torsoY, Math.round(W*0.18), 8);

        // --- RIGHT ARM (holding walkie-talkie) ---
        ctx.fillStyle = '#607d8b';
        ctx.fillRect(x + Math.round(W*0.9), torsoY + 4, Math.round(W*0.1), Math.round(torsoH*0.5));
        // Walkie talkie
        ctx.fillStyle = '#212121';
        ctx.fillRect(x + Math.round(W*0.86), torsoY + 16, 7, 12);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(x + Math.round(W*0.87), torsoY + 17, 5, 2);

        // --- BELT with buckle ---
        const beltY = torsoY + torsoH;
        ctx.fillStyle = '#212121';
        ctx.fillRect(x + Math.round(W*0.08), beltY, Math.round(W*0.84), 4);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + Math.round(W*0.42), beltY + 1, 8, 3);

        // --- TROUSERS (dark grey) ---
        const legY = beltY + 4;
        const legH = Math.round(H*0.28);
        ctx.fillStyle = '#37474f';
        ctx.fillRect(x + Math.round(W*0.12), legY, Math.round(W*0.32), legH);
        ctx.fillRect(x + Math.round(W*0.56), legY, Math.round(W*0.32), legH);

        // Trouser crease lines
        ctx.fillStyle = '#263238';
        ctx.fillRect(x + Math.round(W*0.26), legY + 4, 2, legH - 4);
        ctx.fillRect(x + Math.round(W*0.70), legY + 4, 2, legH - 4);

        // --- BLACK BOOTS ---
        const shoeY = legY + legH;
        ctx.fillStyle = '#111';
        ctx.fillRect(x + Math.round(W*0.1), shoeY, Math.round(W*0.36), 5);
        ctx.fillRect(x + Math.round(W*0.54), shoeY, Math.round(W*0.36), 5);

        // Boot shine
        ctx.fillStyle = '#444';
        ctx.fillRect(x + Math.round(W*0.11), shoeY + 1, Math.round(W*0.14), 2);
        ctx.fillRect(x + Math.round(W*0.55), shoeY + 1, Math.round(W*0.14), 2);

        // --- SHADOW ---
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 4, shoeY + 5, W - 8, 3);

        ctx.restore();
    }
}


// --- Object Pool for GameItems ---
const itemPool = [];

function acquireItem(type, x, y, speedMult = 1, extra = null) {
    let item = itemPool.find(it => it.markedForDeletion);
    if (item) {
        item.type = type;
        item.x = x;
        item.y = y;
        item.speedMult = speedMult;
        item.extra = extra;
        item.markedForDeletion = false;
        item.setupType();
    } else {
        item = new GameItem(type, x, y, speedMult, extra);
        itemPool.push(item);
    }
    return item;
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

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

// --- Object Pool for Particles ---
const particlePool = [];
let particles = [];

function acquireParticle(x, y, color, size, vx, vy, gravity = 0.1, life = 30) {
    let p = particlePool.find(item => item.life <= 0);
    if (p) {
        p.x = x;
        p.y = y;
        p.color = color;
        p.size = size;
        p.vx = vx;
        p.vy = vy;
        p.gravity = gravity;
        p.life = life;
        p.maxLife = life;
    } else {
        p = new Particle(x, y, color, size, vx, vy, gravity, life);
        particlePool.push(p);
    }
    return p;
}

function spawnDust(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
        const p = acquireParticle(
            x, y - 5,
            'rgba(180, 160, 180, 0.4)',
            3 + Math.random() * 4,
            -1 - Math.random() * 2,
            -Math.random() * 2,
            0.05,
            15 + Math.random() * 15
        );
        particles.push(p);
    }
}

function spawnCollectSparks(x, y, color) {
    for (let i = 0; i < 8; i++) {
        const p = acquireParticle(
            x, y, color,
            3 + Math.random() * 3,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            0.05,
            20 + Math.random() * 20
        );
        particles.push(p);
    }
}

// --- Collision Math Helper ---
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.h > rect2.y;
}
