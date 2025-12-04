// js/c_PlayerHandler.js
export default class c_PlayerHandler {
    constructor(opts = {}) {
        const DEFAULT_PLAYER_COUNT = 2; // changeable later in code, not HTML
        this.requestedPlayers = Number.isFinite(opts.requestedPlayers)
            ? Math.max(1, Math.floor(opts.requestedPlayers))
            : DEFAULT_PLAYER_COUNT;

        this._base = [
            { name: "blue",   bg: "#1e90ff", fg: "#ffffff", border: "#0f5fb3" },
            { name: "green",  bg: "#26a269", fg: "#ffffff", border: "#19744b" },
            { name: "pink",   bg: "#ff5fa2", fg: "#ffffff", border: "#b63a6d" },
            { name: "orange", bg: "#ff7a00", fg: "#1a1a1a", border: "#b35600" },
        ];

        this._players = [];
        this._active = 0;
        this._container = null;
        this._titleEl = null;

        this._$ = (sel) => (typeof sel === "string" ? document.querySelector(sel) : sel);

        this._pendingHighestRoll = 0;
    }

    _attach(containerSelector = "#players", titleSelector = "#playerTitle", createNow = true) {
        this._container = this._$(containerSelector);
        if (!this._container) {
            this._container = document.createElement("div");
            this._container.id = "players";
            document.body.prepend(this._container);
        }
        this._titleEl = this._$(titleSelector);
        if (createNow) this._initPlayers(this.requestedPlayers);
        this._syncTitle();
    }

    _initPlayers(n) {
        const count = Math.max(1, Math.floor(n || 1));
        this._players = [];
        for (let i = 0; i < count; i++) this._players.push(this._createDefaultPlayer(i));
        this._active = 0;
        this._render();
        this._syncTitle();
    }

    _getActiveIndex() { return this._active; }
    _getActivePlayer() { return this._players[this._active]; }

    _nextPlayer() {
        if (!this._players.length) return;
        this._active = (this._active + 1) % this._players.length;
        this._render();
        this._syncTitle();
    }

    _setActive(idx) {
        if (idx >= 0 && idx < this._players.length) {
            this._active = idx;
            this._render();
            this._syncTitle();
        }
    }

    _recordTurn(playerIndex, turnScore, highestSingleRollScore = 0) {
        const p = this._players[playerIndex];
        if (!p) return;
        const add = Math.max(0, Math.floor(turnScore || 0));
        const hi  = Math.max(0, Math.floor(highestSingleRollScore || 0));
        p.totalScore += add;
        p.highestDiceScore = Math.max(p.highestDiceScore, hi);
        this._render();
    }

    _recordProvisionalRoll(rollScore) {
        if (!Number.isFinite(rollScore)) return;
        this._pendingHighestRoll = Math.max(this._pendingHighestRoll, rollScore);
    }

    _commitPendingTurn(finalTurnScore) {
        this._recordTurn(this._active, finalTurnScore, this._pendingHighestRoll);
        this._pendingHighestRoll = 0;
    }

    _createDefaultPlayer(idx) {
        const palette = this._colorForIndex(idx);
        return {
            id: idx,
            name: `Player ${idx + 1}`,
            color: palette,
            totalScore: 0,
            highestDiceScore: 0
        };
    }

    _colorForIndex(idx) {
        if (idx < this._base.length) return this._base[idx];
        const base = this._base[idx % this._base.length];
        const step = 6 + (idx - this._base.length) * 6;
        const adj = this._adjustColor(base.bg, step);
        return { name: base.name + "+" + (idx - 3), bg: adj.bg, fg: adj.fg, border: adj.border };
    }

    _adjustColor(hex, lighten = 8) {
        const toRGB = (h) => {
            const m = /^#?([0-9a-f]{6})$/i.exec(h);
            const n = parseInt(m[1], 16);
            return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
        };
        const clamp = (x) => Math.max(0, Math.min(255, x));
        const { r, g, b } = toRGB(hex);
        const nr = clamp(r + lighten), ng = clamp(g + lighten), nb = clamp(b + lighten);
        const toHex = (x) => x.toString(16).padStart(2, "0");
        const bg = `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
        const luma = 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;
        const fg = luma > 170 ? "#1a1a1a" : "#ffffff";
        const border = `#${toHex(clamp(nr - 40))}${toHex(clamp(ng - 40))}${toHex(clamp(nb - 40))}`;
        return { bg, fg, border };
    }

    _syncTitle() {
        if (this._titleEl) {
            this._titleEl.textContent = `Player ${this._active + 1} Turn`;
        }
    }

    _render() {
        if (!this._container) return;
        this._container.innerHTML = "";
        this._container.classList.add("players-wrap");

        for (let i = 0; i < this._players.length; i++) {
            const p = this._players[i];
            const card = document.createElement("div");
            card.className = "player-card";
            card.dataset.idx = String(i);
            card.style.setProperty("--pc-bg", p.color.bg);
            card.style.setProperty("--pc-fg", p.color.fg);
            card.style.setProperty("--pc-border", p.color.border);
            card.style.setProperty("--pc-active", i === this._active ? "1" : "0");

            card.innerHTML = `
                <header class="player-head">
                    <span class="dot"></span>
                    <strong class="player-name">${p.name}</strong>
                    ${i === this._active ? '<span class="active-tag" aria-label="Active">●</span>' : ""}
                </header>
                <div class="player-body">
                    <div class="row">
                        <div class="label">Total</div>
                        <div class="value" data-field="total">${p.totalScore}</div>
                    </div>
                    <div class="row">
                        <div class="label">Highest Dice</div>
                        <div class="value" data-field="highest">${p.highestDiceScore}</div>
                    </div>
                </div>
            `;
            this._container.appendChild(card);
        }
    }
}