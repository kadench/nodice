import c_DiceRunGame from "./c_DiceRunGame.js";
import c_DiceRunGameCustom from "./c_DiceRunGameCustom.js";
import c_PlayerHandler from "./c_PlayerHandler.js";

export default class c_initialize {
    constructor(opts = {}) {
        this.opts = opts;
        this.game = null;
        this.players = null;

        this.$roll = null;
        this.$end = null;
        this.$playersWrapSel = "#players";
        this.$titleSel = "#playerTitle";

        this._farkleFreezeT = null;
    }

    run() {
        // choose game implementation based on opts.useCustom
        const GameClass = this.opts.useCustom ? c_DiceRunGameCustom : c_DiceRunGame;
        // allow passing custom options in opts.customOptions in future
        this.game = new GameClass(this.opts.customOptions || {});

        this.players = new c_PlayerHandler({ requestedPlayers: this.opts.requestedPlayers || 2 });

        this.players._attach(this.$playersWrapSel, this.$titleSel, true);

        this.$roll = document.querySelector("#roll-btn");
        this.$end = document.querySelector("#end-turn-btn");

        this._wirePlayerProgression();
        this._patchFarkleFlow();
        this._patchEndTurnMinimumRule();

        if (typeof this._postInit === "function") this._postInit();
    }

    _wirePlayerProgression() {
        const maybeHook = this.game._onEndTurn?.bind(this.game);
        if (maybeHook) {
            this.game._onEndTurn = (evt) => {
                this.players._commitPendingTurn(this.game.runScore || 0);
                maybeHook(evt);
                this.players._nextPlayer();
            };
        }
    }

    _patchFarkleFlow() {
        const origFarkle = this.game._onFarkle?.bind(this.game);
        if (!origFarkle) return;

        this.game._onFarkle = (evt) => {
            origFarkle(evt);
            if (this.$roll) this.$roll.disabled = true;

            if (this._farkleFreezeT) clearTimeout(this._farkleFreezeT);
            this._farkleFreezeT = setTimeout(() => {
                if (typeof this.game._resetDice === "function") {
                    this.game._resetDice();
                } else if (this.game._ui && typeof this.game._ui.resetDice === "function") {
                    this.game._ui.resetDice();
                }

                if (typeof this.game._onEndTurn === "function") {
                    this.game._onEndTurn({ reason: "farkle" });
                }

                if (this.$roll) this.$roll.disabled = false;
            }, 2000);
        };
    }

    _patchEndTurnMinimumRule() {
        if (typeof this.game._mustMeetMinimum === "function") {
            const _orig = this.game._mustMeetMinimum.bind(this.game);
            this.game._mustMeetMinimum = (...a) => {
                _orig(...a);
                return false;
            };
        }

        if (typeof this.game._canRoll === "function") {
            const _origCanRoll = this.game._canRoll.bind(this.game);
            this.game._canRoll = (...a) => {
                const res = _origCanRoll(...a);
                return res;
            };
        }

        if (typeof this.game._onEndTurn === "function") {
            const _origEnd = this.game._onEndTurn.bind(this.game);
            this.game._onEndTurn = (evt) => {
                if (typeof this.game._resetDice === "function") {
                    this.game._resetDice();
                } else if (this.game._ui && typeof this.game._ui.resetDice === "function") {
                    this.game._ui.resetDice();
                }
                _origEnd(evt);
            };
        }

        if (this.$roll) {
            this.$roll.addEventListener("click", () => {
                const s = this.game.currentRollScore || 0;
                if (s > 0) this.players._recordProvisionalRoll(s);
            });
        }
    }
}