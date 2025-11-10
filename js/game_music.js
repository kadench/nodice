window.addEventListener("DOMContentLoaded", () => {
    // Use one of my existing tracks cause yes, I want to make this a list--can't be bothered right now
    // === Audio setup === NOT WRITTEN YET

    // Menu music playlist
    // Each track can have an optional volume property (0.0–1.0)
    const playlist = [
        { src: "assets/audio/music/paperback.mp3", volume: 0.3 },
    ];

    // Shuffle helper
    function shuffleArray(array) {
        const copy = array.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    // Prepare shuffled order
    let shuffledOrder = shuffleArray(playlist);
    let currentTrack = 0;

    const player = new Audio();
    player.preload = "auto";
    player.loop = false; // no per-track looping

    // Apply per-track volume safely
    function applyTrackVolume(track) {
        const volume = typeof track.volume === "number" ? track.volume : 1.0;
        player.volume = Math.min(Math.max(volume, 0), 1); // clamp 0–1
    }

    // Keep looping/advancing
    player.addEventListener("ended", () => {
        currentTrack++;
        if (currentTrack >= shuffledOrder.length) {
            // All songs have played--reshuffle for next round
            shuffledOrder = shuffleArray(playlist);
            currentTrack = 0;
        }
        const nextTrack = shuffledOrder[currentTrack];
        player.src = nextTrack.src;
        applyTrackVolume(nextTrack);
        player.play().catch(err => console.warn("playlist play failed:", err));
    });

    function startPlaylist() {
        if (!playlist.length) return;
        shuffledOrder = shuffleArray(playlist);
        currentTrack = 0;
        const track = shuffledOrder[currentTrack];
        player.src = track.src;
        applyTrackVolume(track);
        player.currentTime = 0;
        player.play().catch(err => console.warn("playlist play failed:", err));
    }

    // Consent flag
    const AUDIO_FLAG = "audioConsent";
    const hasAudioConsent = () => localStorage.getItem(AUDIO_FLAG) === "true";
    const setAudioConsent = () => { try { localStorage.setItem(AUDIO_FLAG, "true"); } catch {} };

    let started = false;

    const enableAudio = () => {
        if (started) return;
        started = true;
        if (!hasAudioConsent()) setAudioConsent();

        startPlaylist();

        // Remove listeners after first trigger
        window.removeEventListener("click", enableAudio);
        window.removeEventListener("keydown", enableAudio);
    };

    // Wait for any user gesture to start playback
    window.addEventListener("click", enableAudio);
    window.addEventListener("keydown", enableAudio);
});