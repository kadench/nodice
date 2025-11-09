//Slice and Dice by Kaden Hansen
//License: All Rights Reserved ©

//Paperback by Bensound.com
//License code: WDELTECG6IBXAHH1
//Artist: : Diffie Bosman


// === Audio setup ===
const entrance = new Audio("assets/audio/music/nodice_theme.wav");

// Menu music playlist
const playlist = [
  { src: "assets/audio/music/paperback.mp3" },
  // { src: "assets/another_song.mp3" },
];
let currentTrack = 0;
const player = new Audio();
player.preload = "auto";
player.loop = (playlist.length === 1); // paperback loops if it's the only track

// Keep looping/advancing
player.addEventListener("ended", () => {
  if (playlist.length > 1) {
    currentTrack = (currentTrack + 1) % playlist.length;
    player.src = playlist[currentTrack].src;
    player.play().catch(err => console.warn("playlist play failed:", err));
  } else {
    // Safety loop for single-track case
    player.currentTime = 0;
    player.play().catch(err => console.warn("paperback replay failed:", err));
  }
});

function startPlaylist() {
  if (!playlist.length) return;
  player.src = playlist[currentTrack].src;
  player.currentTime = 0;
  player.play().catch(err => console.warn("playlist play failed:", err));
}

// === Consent flag (persistent) ===
const AUDIO_FLAG = "audioConsent";
const hasAudioConsent = () => localStorage.getItem(AUDIO_FLAG) === "true";
const setAudioConsent = () => { try { localStorage.setItem(AUDIO_FLAG, "true"); } catch {} };

// === DOM ===
const overlay = document.getElementById("start-overlay");
const beginBtn = document.getElementById("begin");
const logo = document.getElementById("logo");
const stage = document.getElementById("stage");

let started = false;
let entranceStarted = false;

/** Fade the logo in */
function fadeInLogo() {
  logo.classList.remove("is-hidden", "instant");
  void logo.offsetWidth;
  logo.classList.add("fade-in");
}

/** Instantly show logo */
function showLogoInstant() {
  logo.classList.remove("is-hidden", "fade-in");
  logo.classList.add("instant");
}

/** After fade completes, dock then reveal rest */
logo.addEventListener("transitionend", (e) => {
  if (e.propertyName === "opacity") {
    document.body.classList.add("docked");
    setTimeout(() => document.body.classList.add("ready"), 300); // after bounce
  }
}, { passive: true });

function hideOverlay() { overlay.classList.add("hidden"); }
function showOverlay() { overlay.classList.remove("hidden"); }

/** Skip intro entirely */
function skipToMenu() {
  try {
    entrance.pause();
    if (!isNaN(entrance.duration)) entrance.currentTime = entrance.duration;
  } catch {}

  showLogoInstant();
  document.body.classList.add("docked", "ready");

  setAudioConsent();        // gesture happened → persist consent
  startPlaylist();

  hideOverlay();
  started = true;
  entranceStarted = false;
}

/** Normal flow: Play -> entrance -> playlist */
function startNormal() {
  if (started) return;
  started = true;

  setAudioConsent();  // pressing Play grants/persists consent
  fadeInLogo();

  entrance.play()
    .then(() => {
      entranceStarted = true;
      entrance.addEventListener("ended", () => {
        startPlaylist();
      }, { once: true });
      hideOverlay();
    })
    .catch(err => {
      console.warn("Autoplay blocked; waiting for gesture:", err);
      started = false;
      showOverlay();
    });
}

/** Legacy alias */
function skipIntro() { skipToMenu(); }

/* Overlay clicks */
overlay.addEventListener("click", (e) => {
  const target = e.target;
  if (target && target.id === "begin") {
    startNormal();
  } else {
    skipToMenu();
  }
}, { capture: true });

/* Keyboard (while overlay visible) */
document.addEventListener("keydown", (e) => {
  if (overlay && !overlay.classList.contains("hidden")) {
    const k = e.key;
    if (k === "Escape" || (typeof k === "string" && k.toLowerCase() === "s")) {
      e.preventDefault();
      skipToMenu();
    }
  }
});

/* Play via Enter/Space on the button */
beginBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    startNormal();
  }
});

/* Pause/resume with tab visibility; resume only if consent persisted */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    entrance.pause();
    player.pause();
  } else if (started && hasAudioConsent()) {
    if (entranceStarted && !entrance.ended) {
      entrance.play().catch(() => {});
    } else {
      player.play().catch(() => {});
    }
  }
});

/* Initial overlay (no intro/menu persistence) */
window.addEventListener("DOMContentLoaded", () => {
  overlay.classList.remove("hidden");
});

/* Cleanup */
window.addEventListener("beforeunload", () => {
  entrance.pause();
  player.pause();
});