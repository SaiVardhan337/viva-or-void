# Viva or Void 🏃‍♂️🎓

**Viva or Void** is a level-based 2D side-scrolling runner game built using HTML Canvas and Vanilla JavaScript. Embark on the frantic morning commute of a B.Tech student running late for their crucial DAA Viva exam! Avoid local street obstacles and classroom hallway hurdles, keep your attendance at 100%, and make it to the classroom before the Professor locks the door.

---

## 🕹️ Play Now
Run the game locally by cloning this repository and opening `index.html` in your browser, or host it on Vercel/GitHub Pages!

---

## 🎮 Game Controls
* **SPACEBAR** or **UP ARROW**: Jump over obstacles / Double Jump in mid-air
* **M**: Mute/Unmute chaotic-peaceful chiptune audio

---

## ✨ Key Features
* **Dual Level Progression:** 
  * **Level 1 (The Streets):** Dodge cows, dogs, auto-rickshaws, and potholes through a vibrant parallax town.
  * **Level 2 (The Corridor):** Outrun class benches, bugs, and other students inside the college hallway.
* **Attendance System:** Your attendance starts at 100% and decays over time (1% every 10 seconds). Collect **Attendance Sheets** to bump it back up. Hitting obstacles results in a heavy penalty!
* **10s Boost Mechanics:** Collect **Chai** or any special collectible. Collect 5 items to trigger a 3-second invincibility and speed boost to zoom past hurdles.
* **Milestone Popups:** Receive urgent pause-screen WhatsApp notifications from your friend at the 500m mark warning you that Viva is starting!
* **Sound Effects & Music:** Dynamic 8-bit synthetic audio track with interactive jump, crash, and collectible sound effects.
* **Responsive Visuals:** Features custom retro pixel art, parallax scrolling background layers, dynamic cloud/bird spawning, and smooth player sprite animations.

---

## 🛠️ Project Structure
* `index.html` - The structural stage containing the 2D Canvas element.
* `style.css` - Classic arcade fonts, styling, layout styling, and animations.
* `game.js` - The engine containing the game loop, AABB physics, collision logic, layer offsets, and custom audio synthesizers.
* `/assets` - Visual sprite assets (custom running cycle sprite sheets) and backdrop images.

---

## 🚀 How to Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/btech-runner.git
   ```
2. Navigate into the directory and open `index.html` directly in any web browser, or start a local server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000/` in your browser.
