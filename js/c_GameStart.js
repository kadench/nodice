import c_initialize from "./c_Initialize.js";

export default class c_gameStart {
    constructor() {
        this._init = null;
    }

    // Accept an optional playerCount and optional useCustom flag and forward to Initialize
    start(playerCount, useCustom = false) {
        const n = Number.isFinite(playerCount) ? Math.max(1, Math.floor(playerCount)) : 4;
        const capped = Math.min(16, n); // keep within expected bounds
        this._init = new c_initialize({
            requestedPlayers: capped,
            useCustom: Boolean(useCustom)
        });
        this._init.run();
    }
}
