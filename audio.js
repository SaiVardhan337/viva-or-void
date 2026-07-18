/* -------------------------------------------------------------
   SEMESTER SPRINT - AUDIO SYSTEM (audio.js)
   Handles Web Audio API chiptune sequencing and pre-rendered SFX buffer caching.
   ------------------------------------------------------------- */

class AudioSynth {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('btech-muted') !== 'false'; // Defaults to true (muted)
        this.seqTimer = null;
        this.seqIndex = 0;
        this.buffers = {
            jump: null,
            slide: null,
            collect: null,
            hit: null,
            bark: null,
            win: null,
            gameover: null
        };
        
        // Chaotic-Peaceful mixed music box arrays (32 steps chord progression)
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
            this.preloadBuffers();
        }
    }

    async preloadBuffers() {
        if (!this.ctx) return;
        const sampleRate = this.ctx.sampleRate;

        // 1. Pre-render Jump Sound
        const durationJump = 0.15;
        const offlineJump = new OfflineAudioContext(1, sampleRate * durationJump, sampleRate);
        const oscJ = offlineJump.createOscillator();
        const gainJ = offlineJump.createGain();
        oscJ.connect(gainJ);
        gainJ.connect(offlineJump.destination);
        oscJ.type = 'triangle';
        oscJ.frequency.setValueAtTime(160, 0);
        oscJ.frequency.exponentialRampToValueAtTime(700, durationJump);
        gainJ.gain.setValueAtTime(0.12, 0);
        gainJ.gain.linearRampToValueAtTime(0.001, durationJump);
        oscJ.start(0);
        oscJ.stop(durationJump);
        offlineJump.startRendering().then(buf => this.buffers.jump = buf);

        // 2. Pre-render Slide Sound
        const durationSlide = 0.25;
        const offlineSlide = new OfflineAudioContext(1, sampleRate * durationSlide, sampleRate);
        const bufferSize = sampleRate * durationSlide;
        const noiseBuffer = offlineSlide.createBuffer(1, bufferSize, sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        const noiseS = offlineSlide.createBufferSource();
        noiseS.buffer = noiseBuffer;
        const filterS = offlineSlide.createBiquadFilter();
        filterS.type = 'lowpass';
        filterS.frequency.setValueAtTime(1000, 0);
        filterS.frequency.linearRampToValueAtTime(200, durationSlide);
        const gainS = offlineSlide.createGain();
        gainS.gain.setValueAtTime(0.08, 0);
        gainS.gain.linearRampToValueAtTime(0.001, durationSlide);
        noiseS.connect(filterS);
        filterS.connect(gainS);
        gainS.connect(offlineSlide.destination);
        noiseS.start(0);
        offlineSlide.startRendering().then(buf => this.buffers.slide = buf);

        // 3. Pre-render Collect Sound
        const durationCollect = 0.22;
        const offlineCollect = new OfflineAudioContext(1, sampleRate * durationCollect, sampleRate);
        const oscC = offlineCollect.createOscillator();
        const gainC = offlineCollect.createGain();
        oscC.connect(gainC);
        gainC.connect(offlineCollect.destination);
        oscC.type = 'sine';
        oscC.frequency.setValueAtTime(587.33, 0); // D5
        oscC.frequency.setValueAtTime(880.00, 0.08); // A5
        gainC.gain.setValueAtTime(0.1, 0);
        gainC.gain.linearRampToValueAtTime(0.001, durationCollect);
        oscC.start(0);
        oscC.stop(durationCollect);
        offlineCollect.startRendering().then(buf => this.buffers.collect = buf);

        // 4. Pre-render Hit Sound
        const durationHit = 0.3;
        const offlineHit = new OfflineAudioContext(1, sampleRate * durationHit, sampleRate);
        const oscH = offlineHit.createOscillator();
        const gainH = offlineHit.createGain();
        oscH.connect(gainH);
        gainH.connect(offlineHit.destination);
        oscH.type = 'sawtooth';
        oscH.frequency.setValueAtTime(180, 0);
        oscH.frequency.linearRampToValueAtTime(30, durationHit);
        gainH.gain.setValueAtTime(0.2, 0);
        gainH.gain.linearRampToValueAtTime(0.001, durationHit);
        oscH.start(0);
        oscH.stop(durationHit);
        offlineHit.startRendering().then(buf => this.buffers.hit = buf);

        // 5. Pre-render Bark Sound
        const durationBark = 0.22;
        const offlineBark = new OfflineAudioContext(1, sampleRate * durationBark, sampleRate);
        // Bark 1
        const oscB1 = offlineBark.createOscillator();
        const gainB1 = offlineBark.createGain();
        const filterB1 = offlineBark.createBiquadFilter();
        filterB1.type = 'bandpass';
        filterB1.frequency.setValueAtTime(380, 0);
        oscB1.type = 'triangle';
        oscB1.frequency.setValueAtTime(280, 0);
        oscB1.frequency.exponentialRampToValueAtTime(90, 0.08);
        gainB1.gain.setValueAtTime(0.1, 0);
        gainB1.gain.linearRampToValueAtTime(0.001, 0.08);
        oscB1.connect(filterB1);
        filterB1.connect(gainB1);
        gainB1.connect(offlineBark.destination);
        oscB1.start(0);
        oscB1.stop(0.08);

        // Bark 2
        const oscB2 = offlineBark.createOscillator();
        const gainB2 = offlineBark.createGain();
        const filterB2 = offlineBark.createBiquadFilter();
        filterB2.type = 'bandpass';
        filterB2.frequency.setValueAtTime(380, 0.12);
        oscB2.type = 'triangle';
        oscB2.frequency.setValueAtTime(280, 0.12);
        oscB2.frequency.exponentialRampToValueAtTime(90, 0.20);
        gainB2.gain.setValueAtTime(0.1, 0.12);
        gainB2.gain.linearRampToValueAtTime(0.001, 0.20);
        oscB2.connect(filterB2);
        filterB2.connect(gainB2);
        gainB2.connect(offlineBark.destination);
        oscB2.start(0.12);
        oscB2.stop(0.20);

        // Overlay low bark noise
        const barkNoiseBuf = offlineBark.createBuffer(1, sampleRate * 0.20, sampleRate);
        const barkNoiseData = barkNoiseBuf.getChannelData(0);
        for(let i=0; i<barkNoiseBuf.length; i++) barkNoiseData[i] = Math.random()*2 - 1;
        const noiseB1 = offlineBark.createBufferSource();
        noiseB1.buffer = barkNoiseBuf;
        const noiseGainB1 = offlineBark.createGain();
        noiseGainB1.gain.setValueAtTime(0.03, 0);
        noiseGainB1.gain.linearRampToValueAtTime(0.001, 0.08);
        noiseB1.connect(noiseGainB1);
        noiseGainB1.connect(offlineBark.destination);
        noiseB1.start(0);

        const noiseB2 = offlineBark.createBufferSource();
        noiseB2.buffer = barkNoiseBuf;
        const noiseGainB2 = offlineBark.createGain();
        noiseGainB2.gain.setValueAtTime(0.03, 0.12);
        noiseGainB2.gain.linearRampToValueAtTime(0.001, 0.20);
        noiseB2.connect(noiseGainB2);
        noiseGainB2.connect(offlineBark.destination);
        noiseB2.start(0.12);

        offlineBark.startRendering().then(buf => this.buffers.bark = buf);

        // 6. Pre-render Win Sound
        const durationWin = 0.35 + 7 * 0.08;
        const offlineWin = new OfflineAudioContext(1, sampleRate * durationWin, sampleRate);
        const winNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        winNotes.forEach((freq, idx) => {
            const osc = offlineWin.createOscillator();
            const gain = offlineWin.createGain();
            osc.connect(gain);
            gain.connect(offlineWin.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, idx * 0.08);
            gain.gain.setValueAtTime(0.08, idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.001, idx * 0.08 + 0.35);
            osc.start(idx * 0.08);
            osc.stop(idx * 0.08 + 0.35);
        });
        offlineWin.startRendering().then(buf => this.buffers.win = buf);

        // 7. Pre-render GameOver Sound
        const durationGameOver = 0.25 + 5 * 0.12;
        const offlineGameOver = new OfflineAudioContext(1, sampleRate * durationGameOver, sampleRate);
        const sadNotes = [392.00, 349.23, 311.13, 261.63, 196.00];
        sadNotes.forEach((freq, idx) => {
            const osc = offlineGameOver.createOscillator();
            const gain = offlineGameOver.createGain();
            osc.connect(gain);
            gain.connect(offlineGameOver.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, idx * 0.12);
            gain.gain.setValueAtTime(0.08, idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.001, idx * 0.12 + 0.25);
            osc.start(idx * 0.12);
            osc.stop(idx * 0.12 + 0.25);
        });
        offlineGameOver.startRendering().then(buf => this.buffers.gameover = buf);
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('btech-muted', this.muted);
        const soundBtn = document.getElementById('sound-btn');
        if (this.muted) {
            if (soundBtn) {
                soundBtn.textContent = 'MUTED';
                soundBtn.classList.remove('unmuted');
            }
            this.stopBGM();
        } else {
            if (soundBtn) {
                soundBtn.textContent = 'SOUND ON';
                soundBtn.classList.add('unmuted');
            }
            this.init();
            this.startBGM();
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }
    }

    playBuffer(buffer) {
        if (this.muted || !this.ctx || !buffer) return;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
    }

    playJump() {
        this.init();
        this.playBuffer(this.buffers.jump);
    }

    playSlide() {
        this.init();
        this.playBuffer(this.buffers.slide);
    }

    playCollect() {
        this.init();
        this.playBuffer(this.buffers.collect);
    }

    playHit() {
        this.init();
        this.playBuffer(this.buffers.hit);
    }

    playDogBark() {
        this.init();
        this.playBuffer(this.buffers.bark);
    }

    playWinSound() {
        this.init();
        this.stopBGM();
        this.playBuffer(this.buffers.win);
    }

    playGameOver() {
        this.init();
        this.stopBGM();
        this.playBuffer(this.buffers.gameover);
    }

    startBGM() {
        if (this.muted) return;
        this.stopBGM();
        this.seqIndex = 0;
        
        // Slower, peaceful tempo (~58 BPM, 260ms per step)
        const stepTime = 260; 
        this.seqTimer = setInterval(() => {
            if (this.muted || typeof gameState === 'undefined' || gameState !== 'PLAYING') return;
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
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        let activeBassline = this.bassline;
        let activeMelody = this.melody;

        // Custom high-tempo corporate techno/cyberpunk BGM theme for Level 5
        if (typeof currentLevel !== 'undefined' && currentLevel === 5) {
            activeBassline = [
                110.00, 110.00, 130.81, 130.81, 146.83, 146.83, 164.81, 164.81,
                110.00, 110.00, 130.81, 130.81, 98.00, 98.00, 164.81, 164.81,
                110.00, 110.00, 130.81, 130.81, 146.83, 146.83, 164.81, 164.81,
                164.81, 164.81, 146.83, 146.83, 130.81, 130.81, 98.00, 98.00
            ];
            activeMelody = [
                440.00, 440.00, 523.25, 587.33, 659.25, 659.25, 783.99, 783.99,
                587.33, 587.33, 523.25, 523.25, 440.00, 440.00, 392.00, 392.00,
                659.25, 0, 587.33, 0, 523.25, 0, 440.00, 0,
                392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 0
            ];
        }

        // 1. Play Soft Bass Note (Triangle wave, lowpassed for warmth)
        const bassFreq = activeBassline[this.seqIndex % activeBassline.length];
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
        const melFreq = activeMelody[this.seqIndex % activeMelody.length];
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

        // 4. Soft percussive noise hi-hat
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
document.addEventListener('DOMContentLoaded', () => {
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => synth.toggleMute());
    }
});
