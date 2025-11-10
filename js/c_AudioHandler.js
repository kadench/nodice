// c_AudioHandler.js
// Unified SFX entrypoint with recency-biased variant picker.
// Usage: this.audio?._playSfx("diceRoll"), this.audio?._playSfx("noDice"), etc.

export default class c_AudioHandler {
    constructor(opts = {}) {
        this.enabled = opts.enabled ?? true;
        this.volume = clamp01(opts.volume ?? 0.7);
        this.base = opts.base ?? "assets/audio/game/sfx/";
        this.bias = opts.bias ?? 2;
        this.historySizeFactor = opts.historySizeFactor ?? 2;

        // 3 variants each by default; diceRoll has 5
        this._registry = {
            buttonClick:   { prefix: "ui/reaction",count: 3 },
            successful:    { prefix: "rollsuccess", count: 3 },
            failed:        { prefix: "rollfail",count: 3 },
            disabled:      { prefix: "disabled", count: 3 },
            notAllowed:    { prefix: "notallowed",count: 3 },
            celebration:   { prefix: "celebration", count: 3 },
            noDice:        { prefix: "dice/nodice", count: 3 }, // farkle
            hotDice:       { prefix: "hotdice", count: 3 },
            diceRoll:      { prefix: "dice/diceroll", count: 5 }, // diceroll1..5
            uiWarning:     { prefix: "ui/warning", count: 3}
        };

        this._history = Object.create(null);       // per-type variant history
    }

    _playSfx(type) {
        if (!this._hasAudio() || !this.enabled) return;
        const cfg = this._registry[type];
        if (!cfg || !cfg.count) return;

        const variant = this._pickVariant(type, cfg.count);   // 1-based
        const url = this._pickUrl(`${cfg.prefix}${variant}`);
        if (!url) return;

        const a = new Audio(url);
        a.volume = this.volume;
        const p = a.play?.();
        if (p && typeof p.catch === "function") p.catch(() => {});
    }

    // Convenience aliases
    _variedDiceRoll()         { this._playSfx("diceRoll"); }
    _buttonClick()            { this._playSfx("buttonClick"); }
    _successfulDiceRoll()     { this._playSfx("successful"); }
    _failedDiceRoll()         { this._playSfx("failed"); }
    _disabled()               { this._playSfx("disabled"); }
    _notAllowed()             { this._playSfx("notAllowed"); }
    _celebration()            { this._playSfx("celebration"); }
    _noDice()                 { this._playSfx("noDice"); }
    _hotDice()                { this._playSfx("hotDice"); }
    _uiWarning()              { this._playSfx("uiWarning"); }

    _pickVariant(type, count) {
        const hist = this._history[type] ?? (this._history[type] = []);
        const maxHist = Math.max(1, Math.min(32, Math.floor(count * this.historySizeFactor)));

        const lastPos = new Array(count + 1).fill(-1); // 1..count
        for (let i = 0; i < hist.length; i++) lastPos[hist[i]] = i;

        const weights = [];
        for (let k = 1; k <= count; k++) {
            const pos = lastPos[k];
            const age = (pos === -1) ? (hist.length + 1) : (hist.length - pos);
            const w = Math.pow(Math.max(1, age), this.bias);
            weights.push(w);
        }

        const choice = weightedChoice(weights); // 0..count-1
        const variant = choice + 1;

        hist.push(variant);
        if (hist.length > maxHist) hist.shift();

        return variant;
    }

    _pickUrl(stem) {
        // prefer mp3, fall back to wav
        return this.base + stem + ".mp3"; // if server is missing it, the browser will just no-op
    }

    _hasAudio() { return (typeof Audio !== "undefined"); }
    _setEnabled(on) { this.enabled = !!on; }
    _toggleEnabled() { this.enabled = !this.enabled; }
    _setVolume(v) { this.volume = clamp01(v); }
}

function clamp01(x) {
    x = Number(x);
    if (!Number.isFinite(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
}

function weightedChoice(weights) {
    let total = 0;
    for (let i = 0; i < weights.length; i++) total += weights[i];
    if (total <= 0) return Math.floor(Math.random() * weights.length);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}