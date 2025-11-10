import { DICE_SCORES } from "./DICE_SCORES.js";
import c_DicePatternClassifier from "./c_DicePatternClassifier.js";
import c_DiceProbabilityModel from "./c_DiceProbabilityModel.js";
import c_PatternBasedDiceGenerator from "./c_PatternBasedDiceGenerator.js";
import c_SelectionManager from "./c_SelectionManager.js";
import c_UIRenderer from "./c_UIRenderer.js";
import c_AudioHandler from "./c_AudioHandler.js";

export default class c_DiceRunGame {
    constructor() {
        this.classifier = new c_DicePatternClassifier();
        this.probabilityModel = new c_DiceProbabilityModel(this.classifier);
        this.ui = new c_UIRenderer();
        this.selectionManager = new c_SelectionManager();

        this.latestDiceValues = [1, 1, 1, 1, 1, 1];
        this.selectedDiceMask = [false, false, false, false, false, false];
        this.bankedDiceMask = [false, false, false, false, false, false];

        this.currentRollScore = 0;
        this.runScore = 0;
        this.totalScore = 0;
        this.hasRolledAtLeastOnce = false;

        this.mustBankBeforeReroll = false;
        this.endTurnConfirmPending = false;
        this.firstTurnQualified = false;
        this.firstRunThreshold = (DICE_SCORES.first_run_min ?? 3);

        this.generator = null;
        this.audio = null;

        this._initialize();
        this._wireUIEvents();
    }

    _initialize() {
        this.ui._setMessage("Computing probabilities…");
        this.probabilityModel._initialize();
        this.generator = new c_PatternBasedDiceGenerator(
            this.classifier,
            this.probabilityModel.DICE_ROLLS
        );
        if (this.ui.buttonEndTurn) {
            this.ui.buttonEndTurn.textContent = "End Turn";
        }

        // Universal audio system
        this.audio = new c_AudioHandler({
            base: "assets/audio/game/sfx/",
            volume: 0.8,
            bias: 2,
            historySizeFactor: 2
        });
        this.ui._bindAudioHandler?.(this.audio);

        this.ui._setMessage('Ready. Press "Roll" to begin.');
        this._refreshUI();
    }

    _wireUIEvents() {
        if (this.ui.buttonRoll) this.ui.buttonRoll.addEventListener("click", () => this._onRoll());
        if (this.ui.buttonBank) this.ui.buttonBank.addEventListener("click", () => this._onBank());
        if (this.ui.buttonEndTurn) this.ui.buttonEndTurn.addEventListener("click", () => this._onEndTurn());

        const diceClicks = this.ui._getDiceImg();
        for (let i = 0; i < diceClicks.length; i++) {
            diceClicks[i].addEventListener("click", () => this._onToggleSelectDie(i));
        }

        if (this.ui.buttonSelectAll) {
            this.ui.buttonSelectAll.addEventListener("click", () => this._onSelectAllAvailable());
        }
    }

    _onRoll(evt) {
        if (!this.hasRolledAtLeastOnce) {
            this.mustBankBeforeReroll = false; // first roll should never be blocked
        }

        if (this.hasRolledAtLeastOnce && this.mustBankBeforeReroll) {
            const allBanked = this.bankedDiceMask && this.bankedDiceMask.every(Boolean); // hot dice if true
            const preSelectableMask = this._computeSelectableMaskConsideringBanked();
            const anySelectable = this._anyTrue(preSelectableMask);

            if (!anySelectable) {
                // else. farkle if there are dice on the table that are not banked.
                // if ALL dice are banked that's hot dice (allow roll).
                if (!allBanked) {
                    this.currentRollScore = 0;
                    this.runScore = 0;
                    this.mustBankBeforeReroll = false;
                    this.endTurnConfirmPending = false;
                    this.audio?._playSfx("noDice");
                    this.ui?.buttonRoll.disabled;
                    this._refreshUI(undefined, 0, "Farkle. Turn ends.");
                    this._onEndTurn(evt);
                    return;
                }
                // hot dice: fall through and allow roll (optional sting)
                this.audio?._playSfx("hotDice");
            } else {
                // something selectable → must bank first
                this.ui?._showHelpBubbleNearEvent?.(evt, "You must bank at least one scoring die before rolling again.");
                this.audio?._playSfx("notAllowed");
                return;
            }
        }

        if (this.bankedDiceMask.every(Boolean))
            this.bankedDiceMask = [false, false, false, false, false, false];

        const resultObject = (this.generator.roll
            ? this.generator.roll()
            : this.generator._rollSixDiceWeighted());

        const rolled = resultObject.diceValues.slice();
        let j = 0;
        for (let i = 0; i < 6; i++) {
            if (!this.bankedDiceMask[i]) {
                this.latestDiceValues[i] = rolled[j++];
            }
        }

        this.hasRolledAtLeastOnce = true;
        this.selectedDiceMask = [false, false, false, false, false, false];

        const selectableMask = this._computeSelectableMaskConsideringBanked();
        if (!this._anyTrue(selectableMask)) {
            // post-roll dead roll (farkle)
            this.currentRollScore = 0;
            this.runScore = 0;
            this.mustBankBeforeReroll = false;
            this.endTurnConfirmPending = false;
            this.audio?._playSfx("noDice");
            this._refreshUI(resultObject.patternKey, resultObject.score, "Farkle. Turn ends.");
            this._onEndTurn(evt);
            return;
        }

        // Successful roll (something selectable exists)
        const selectableMaskAmount = selectableMask
        .map((val, idx) => (val === true ? idx : null))
        .filter(idx => idx !== null);

        this.audio?._playSfx("diceRoll");
        this.audio?._playDiceSuccessForSelectable(selectableMaskAmount.length);

        this.mustBankBeforeReroll = true;
        this.endTurnConfirmPending = false;
        this._refreshUI(resultObject.patternKey, resultObject.score);
    }

    _onToggleSelectDie(dieIndex) {
        if (!this.hasRolledAtLeastOnce) return;

        const selectableMask = this._computeSelectableMaskConsideringBanked();
        if (this.bankedDiceMask[dieIndex]) {
            this.audio?._playSfx("disabled");
            return;
        }
        if (!selectableMask[dieIndex]) {
            this.audio?._playSfx("notAllowed");
            return;
        }

        this.selectedDiceMask[dieIndex] = !this.selectedDiceMask[dieIndex];
        this._recomputeSelectedScore();
        this.audio?._playSfx("buttonClick");
        this._refreshUI();
    }

    _onSelectAllAvailable() {
        if (!this.hasRolledAtLeastOnce) return;

        const selectableMask = this._computeSelectableMaskConsideringBanked();

        // Check if all selectable dice are already selected
        const allSelectableSelected = selectableMask.every(
            (val, i) => !val || this.selectedDiceMask[i]
        );

        // Toggle: if all selectable dice are already selected, deselect them
        const newSelectState = !allSelectableSelected;

        let changed = false;
        for (let i = 0; i < 6; i++) {
            if (selectableMask[i]) {
                this.selectedDiceMask[i] = newSelectState;
                changed = true;
            } else {
                // Non-selectable dice remain untouched
                this.selectedDiceMask[i] = this.selectedDiceMask[i] && selectableMask[i];
            }
        }

        if (!changed) {
            this.ui._setMessage("No selectable dice right now.");
            this.audio?._playSfx("disabled");
            return;
        }

        this._recomputeSelectedScore();
        this.audio?._playSfx("buttonClick");
        this._refreshUI(undefined, undefined, newSelectState ? "All available dice selected." : "All available dice deselected.");
    }

    _onBank(evt) {
        if (!this.hasRolledAtLeastOnce) return;
        if (this.currentRollScore <= 0) {
            this.ui?._showHelpBubbleNearEvent?.(evt, "Select scoring dice before banking.");
            this.audio?._playSfx("notAllowed");
            return;
        }

        for (let i = 0; i < 6; i++) if (this.selectedDiceMask[i]) this.bankedDiceMask[i] = true;

        this.runScore += this.currentRollScore;
        this.currentRollScore = 0;
        this.selectedDiceMask = [false, false, false, false, false, false];
        this.mustBankBeforeReroll = false;
        this.endTurnConfirmPending = false;

        this.audio?._playSfx("buttonClick");
        this._refreshUI(undefined, undefined, "Banked. Roll or End Turn.");
    }

    _onEndTurn(evt) {
        this.audio?._playSfx("buttonClick")
        if (!this.hasRolledAtLeastOnce) return;

        const base = (this.firstRunThreshold ?? (DICE_SCORES.first_run_min ?? 300));
        if (this.firstRunThreshold == null) this.firstRunThreshold = base;

        const needMin = (this.totalScore === 0 && !this.firstTurnQualified);
        if (needMin && this.runScore < base) {
            if (!this.endTurnConfirmPending) {
                const canStill = this._anyTrue(this._computeSelectableMaskConsideringBanked());
                const msg = canStill
                    ? `You need at least ${base} on your first scoring turn to keep your score, however, you've NoDiced Click again to pass.`
                    : `You haven't reached ${base} yet; ending will pass. Click again to confirm.`;
                this.ui?._showHelpBubbleNearEvent?.(evt, msg);
                this.audio?._playSfx("notAllowed");
                this.endTurnConfirmPending = true;
                return;
            }
            this.runScore = 0; // pass
            this.endTurnConfirmPending = false;
        } else {
            this.totalScore += this.runScore;
            if (this.totalScore > 0) this.firstTurnQualified = true;
            if (this.runScore > 0) {
                this.audio?._playSfx("celebration");
            }
        }

        this.runScore = 0;
        this.currentRollScore = 0;
        this.bankedDiceMask = [false, false, false, false, false, false];
        this.selectedDiceMask = [false, false, false, false, false, false];
        this.hasRolledAtLeastOnce = false;
        this.mustBankBeforeReroll = false;
        this.endTurnConfirmPending = false;

        this._refreshUI(undefined, undefined, "Turn ended. Total updated.");
    }

    _recomputeSelectedScore() {
        const selectedValues = [];
        for (let i = 0; i < 6; i++) if (this.selectedDiceMask[i]) selectedValues.push(this.latestDiceValues[i]);
        this.currentRollScore = this.selectionManager._computeSelectedScore(selectedValues);
    }

    _computeSelectableMaskConsideringBanked() {
        const vals = Array.isArray(this.latestDiceValues) ? this.latestDiceValues : [0, 0, 0, 0, 0, 0];
        const bank = Array.isArray(this.bankedDiceMask) ? this.bankedDiceMask : [false, false, false, false, false, false];
        return this.selectionManager._getSelectableDiceMask(vals, bank);
    }

    _anyTrue(arr) {
        for (let i = 0; i < arr.length; i++) if (arr[i]) return true;
        return false;
    }

    _refreshUI(mostRecentPatternKey, mostRecentPatternScore, overrideMessage) {
        let selectableMask = this._computeSelectableMaskConsideringBanked();

        if (!this.hasRolledAtLeastOnce) {
            selectableMask = [false, false, false, false, false, false];
            if (this.ui.buttonRoll) this.ui.buttonRoll.disabled = this._anyTrue(selectableMask);
            if (this.ui.buttonBank) this.ui.buttonBank.disabled = true;
            if (this.ui.buttonEndTurn) this.ui.buttonEndTurn.disabled = false;
            if (this.ui.buttonSelectAll) this.ui.buttonSelectAll.disabled = true;
        } else {
            if (this.ui.buttonRoll) this.ui.buttonRoll.disabled = false;
            if (this.ui.buttonBank) this.ui.buttonBank.disabled = this.currentRollScore <= 0;
            if (this.ui.buttonEndTurn) this.ui.buttonEndTurn.disabled = false;
            if (this.ui.buttonSelectAll) this.ui.buttonSelectAll.disabled = !this._anyTrue(selectableMask);
            if (this.ui.buttonEndTurn) { this.ui.buttonEndTurn.textContent = "End Turn"; }
            if (this.ui.buttonSelectAll) {
                const allSelectableAlreadySelected = selectableMask.every((v, i) => !v || this.selectedDiceMask[i]);
                this.ui.buttonSelectAll.textContent = allSelectableAlreadySelected ? "Deselect All" : "Select All";
            }
        }

        this.ui._applyDiceEnabledMask(selectableMask);
        this.ui._renderDiceLabels(this.latestDiceValues, this.selectedDiceMask, this.bankedDiceMask);

        const baseMessage =
            overrideMessage ??
            (mostRecentPatternKey
                ? `Last pattern: ${mostRecentPatternKey.replaceAll("_", " ")} (+${mostRecentPatternScore})`
                : (!this.hasRolledAtLeastOnce ? "Waiting for first roll…" : ""));

        this.ui._setMessage(baseMessage);
        this.ui._setScoreDisplay(this.currentRollScore, this.runScore, this.totalScore);
    }
}
