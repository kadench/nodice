import { DICE_SCORES } from "./DICE_SCORES.js";
import c_DicePatternClassifier from "./c_DicePatternClassifier.js";
import c_DiceProbabilityModel from "./c_DiceProbabilityModel.js";
import c_PatternBasedDiceGenerator from "./c_PatternBasedDiceGenerator.js";
import c_SelectionManager from "./c_SelectionManager.js";
import c_UIRenderer from "./c_UIRenderer.js";

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

        this._initialize();
        this._wireUIEvents();
    }

    _initialize() {
        this.ui._setMessage("Computing probabilities…");
        this.probabilityModel._initialize();
        this.generator = new c_PatternBasedDiceGenerator(this.classifier, this.probabilityModel.DICE_ROLLS);
        if (this.ui.buttonEndTurn) {this.ui.buttonEndTurn.textContent = "End Turn";}

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
        if (this.hasRolledAtLeastOnce && this.mustBankBeforeReroll) {
            this.ui?._showHelpBubbleNearEvent?.(evt, "You must bank at least one scoring die before rolling again.");
            return;
        }
        if (this.bankedDiceMask.every(Boolean))
            this.bankedDiceMask = [false,false,false,false,false,false];

        const resultObject = (this.generator.roll
            ? this.generator.roll()
            : this.generator._rollSixDiceWeighted());

        const rolled = resultObject.diceValues.slice(); // number of unbanked dice
        let j = 0;
        for (let i = 0; i < 6; i++) {
            if (!this.bankedDiceMask[i]) this.latestDiceValues[i] = rolled[j++];
        }

        this.hasRolledAtLeastOnce = true;
        this.selectedDiceMask = [false,false,false,false,false,false];

        const selectableMask = this._computeSelectableMaskConsideringBanked();
        if (!this._anyTrue(selectableMask)) {
            this.currentRollScore = 0;
            this.runScore = 0;
            this.mustBankBeforeReroll = false;
            this.endTurnConfirmPending = false;
            this._refreshUI(resultObject.patternKey, resultObject.score, "Farkle. Turn ends.");
            this._onEndTurn(evt);
            return;
        }

        this.mustBankBeforeReroll = true;
        this.endTurnConfirmPending = false;
        this._refreshUI(resultObject.patternKey, resultObject.score);
    }


    _onToggleSelectDie(dieIndex) {
        if (!this.hasRolledAtLeastOnce) return;

        const selectableMask = this._computeSelectableMaskConsideringBanked();
        if (this.bankedDiceMask[dieIndex]) return;
        if (!selectableMask[dieIndex]) return;

        this.selectedDiceMask[dieIndex] = !this.selectedDiceMask[dieIndex];
        this._recomputeSelectedScore();
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
        return;
    }

    this._recomputeSelectedScore();
    this._refreshUI(undefined, undefined, newSelectState ? "All available dice selected." : "All available dice deselected.");
}

    _onBank(evt) {
        if (!this.hasRolledAtLeastOnce) return;
        if (this.currentRollScore <= 0) {
            this.ui?._showHelpBubbleNearEvent?.(evt, "Select scoring dice before banking.");
            return;
        }

        for (let i = 0; i < 6; i++) if (this.selectedDiceMask[i]) this.bankedDiceMask[i] = true;

        this.runScore += this.currentRollScore;
        this.currentRollScore = 0;
        this.selectedDiceMask = [false,false,false,false,false,false];
        this.mustBankBeforeReroll = false;
        this.endTurnConfirmPending = false;

        this._refreshUI(undefined, undefined, "Banked. Roll or End Turn.");
    }

    _onEndTurn(evt) {
        if (!this.hasRolledAtLeastOnce) return;

        const base = (this.firstRunThreshold ?? (DICE_SCORES.first_run_min ?? 300));
        if (this.firstRunThreshold == null) this.firstRunThreshold = base;

        const needMin = (this.totalScore === 0 && !this.firstTurnQualified);
        if (needMin && this.runScore < base) {
            if (!this.endTurnConfirmPending) {
            const canStill = this._anyTrue(this._computeSelectableMaskConsideringBanked());
            const msg = canStill
                ? `You need at least ${base} on your first scoring turn before ending. Bank more or roll. Click again to pass.`
                : `You haven't reached ${base} yet; ending will pass. Click again to confirm.`;
            this.ui?._showHelpBubbleNearEvent?.(evt, msg);
            this.endTurnConfirmPending = true;
            return;
            }
            this.runScore = 0; // pass
            this.endTurnConfirmPending = false;
        } else {
            this.totalScore += this.runScore;
            if (this.totalScore > 0) this.firstTurnQualified = true;
        }

        this.runScore = 0;
        this.currentRollScore = 0;
        this.bankedDiceMask = [false,false,false,false,false,false];
        this.selectedDiceMask = [false,false,false,false,false,false];
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
        const vals = Array.isArray(this.latestDiceValues) ? this.latestDiceValues : [0,0,0,0,0,0];
        const bank = Array.isArray(this.bankedDiceMask) ? this.bankedDiceMask : [false,false,false,false,false,false];
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
            if (this.ui.buttonRoll) this.ui.buttonRoll.disabled = false;
            if (this.ui.buttonBank) this.ui.buttonBank.disabled = true;
            if (this.ui.buttonEndTurn) this.ui.buttonEndTurn.disabled = false;
            if (this.ui.buttonSelectAll) this.ui.buttonSelectAll.disabled = true;
        } 
        // DOESN'T WORK RIGHT NOW
        // if (this.bankedDiceMask.every(v => v === false)) {
        //     if (this.ui.buttonEndTurn) { this.ui.buttonEndTurn.textContent = "Pass"; }
        // }

        else {
        if (this.ui.buttonRoll) this.ui.buttonRoll.disabled = false;
        if (this.ui.buttonBank) this.ui.buttonBank.disabled = this.currentRollScore <= 0;
        if (this.ui.buttonEndTurn) this.ui.buttonEndTurn.disabled = false;
        if (this.ui.buttonSelectAll) this.ui.buttonSelectAll.disabled = !this._anyTrue(selectableMask);
        if (this.ui.buttonEndTurn) {this.ui.buttonEndTurn.textContent = "End Turn";}
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
