// =====================================
// GLOBAL BUTTON CLICK SOUND (FINAL)
// =====================================

let audioUnlocked = false;
let clickSound;

// Create audio lazily (important)
function initSound() {
  if (audioUnlocked) return;

  clickSound = new Audio("sounds/click.mp3");
  clickSound.volume = 0.6;

  // unlock
  clickSound.play().then(() => {
    clickSound.pause();
    clickSound.currentTime = 0;
    audioUnlocked = true;
  }).catch(() => {});
}

// 🔓 Unlock audio on FIRST interaction
document.addEventListener(
  "pointerdown",
  () => {
    initSound();
  },
  { once: true }
);

// 🔊 BUTTON-ONLY SOUND
document.addEventListener(
  "pointerdown",
  (e) => {
    const btn = e.target.closest("button");
    if (!btn || btn.disabled) return;
    if (!audioUnlocked) return;

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  },
  true // CAPTURE phase (important)
);
