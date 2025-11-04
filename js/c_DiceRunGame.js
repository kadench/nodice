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
        this.rollsThisTurn = 0;
        this.devModeEnabled = false;
        this.hasRolledAtLeastOnce = false;

        this.generator = null;

        this._initialize();
        this._wireUIEvents();
    }

    _initialize() {
        this.ui._setMessage("Computing probabilities…");
        this.probabilityModel._initialize();
        this.generator = new c_PatternBasedDiceGenerator(this.classifier, this.probabilityModel.DICE_ROLLS);
        if (this.ui.buttonEndTurn) {this.ui.buttonEndTurn.textContent = (this.rollsThisTurn === 0) ? "Pass" : "End Turn";}

        this.ui._setMessage('Ready. Press "Roll" to begin. (Press "D" to toggle Dev Mode)');
        this._refreshUI();
    }

    _wireUIEvents() {
        if (this.ui.buttonRoll) this.ui.buttonRoll.addEventListener("click", () => this._onRoll());
        if (this.ui.buttonBank) this.ui.buttonBank.addEventListener("click", () => this._onBank());
        if (this.ui.buttonEndTurn) this.ui.buttonEndTurn.addEventListener("click", () => this._onEndTurn());

        const diceButtons = this.ui._getDiceButtons();
        for (let i = 0; i < diceButtons.length; i++) {
            diceButtons[i].addEventListener("click", () => this._onToggleSelectDie(i));
        }

        if (this.ui.buttonSelectAll) {
            this.ui.buttonSelectAll.addEventListener("click", () => this._onSelectAllAvailable());
        }

        document.addEventListener("keydown", (eventObject) => {
            const keyValue = eventObject.key || eventObject.code;
            if (keyValue === "d" || keyValue === "D") {
                this.devModeEnabled = !this.devModeEnabled;
                const statusText = this.devModeEnabled ? "ON — roll limit disabled" : "OFF — 3 rolls per turn";
                this.ui._setMessage(`Dev Mode ${statusText}`);
            }
        });
    }

    _onRoll() {
        if (!this.devModeEnabled && this.rollsThisTurn >= 3) {
            this.ui._setMessage("You have reached the maximum of 3 rolls. Bank or End Turn.");
            return;
        }

        if (this.bankedDiceMask.every(Boolean)) {
            this.bankedDiceMask = [false, false, false, false, false, false];
        }

        // Produce a 6-die roll; copy sequentially into unbanked positions
        const resultObject = this.generator._rollSixDiceWeighted();
        const rolled = resultObject.diceValues.slice();
        let copyIndex = 0;
        for (let i = 0; i < 6; i++) {
            if (!this.bankedDiceMask[i]) this.latestDiceValues[i] = rolled[copyIndex++];
        }

        this.rollsThisTurn++;
        this.hasRolledAtLeastOnce = true;
        this.selectedDiceMask = [false, false, false, false, false, false];

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
        let selectedAny = false;
        for (let i = 0; i < 6; i++) {
            if (selectableMask[i]) {
                this.selectedDiceMask[i] = true;
                selectedAny = true;
            } else {
                // ensure non-selectable dice are not marked selected
                this.selectedDiceMask[i] = this.selectedDiceMask[i] && selectableMask[i];
            }
        }
        if (!selectedAny) {
            this.ui._setMessage("No selectable dice right now.");
            return;
        }
        this._recomputeSelectedScore();
        this._refreshUI(undefined, undefined, "All available dice selected.");
    }

    _onBank() {
        if (!this.hasRolledAtLeastOnce) return;

        if (this.currentRollScore <= 0) {
            this.ui._setMessage("Select scoring dice before banking.");
            return;
        }

        for (let i = 0; i < 6; i++) {
            if (this.selectedDiceMask[i]) this.bankedDiceMask[i] = true;
        }

        this.runScore += this.currentRollScore;
        this.currentRollScore = 0;
        this.selectedDiceMask = [false, false, false, false, false, false];

        this._refreshUI(undefined, undefined, "Banked. Roll or End Turn.");
    }

    _onEndTurn() {
        if (!this.hasRolledAtLeastOnce) return;

        this.totalScore += this.runScore;
        this.runScore = 0;
        this.currentRollScore = 0;
        this.rollsThisTurn = 0;
        this.bankedDiceMask = [false, false, false, false, false, false];
        this.selectedDiceMask = [false, false, false, false, false, false];
        this.hasRolledAtLeastOnce = false;
        this._refreshUI(undefined, undefined, "Turn ended. Total updated.");
    }

    _recomputeSelectedScore() {
        const selectedValues = [];
        for (let i = 0; i < 6; i++) if (this.selectedDiceMask[i]) selectedValues.push(this.latestDiceValues[i]);
        this.currentRollScore = this.selectionManager._computeSelectedScore(selectedValues);
    }

    _computeSelectableMaskConsideringBanked() {
        const mask = this.selectionManager._getSelectableDiceMask(this.latestDiceValues);
        for (let i = 0; i < 6; i++) if (this.bankedDiceMask[i]) mask[i] = false;
        return mask;
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
        } else {
            const canRoll = this.devModeEnabled || this.rollsThisTurn < 3;
            if (this.ui.buttonRoll) this.ui.buttonRoll.disabled = !canRoll;
            if (this.ui.buttonBank) this.ui.buttonBank.disabled = this.currentRollScore <= 0;
            if (this.ui.buttonEndTurn) this.ui.buttonEndTurn.disabled = false;
            if (this.ui.buttonSelectAll) this.ui.buttonSelectAll.disabled = !this._anyTrue(selectableMask);
            if (this.ui.buttonEndTurn) {this.ui.buttonEndTurn.textContent = (this.rollsThisTurn === 0) ? "Pass" : "End Turn";}
        }

        this.ui._applyDiceEnabledMask(selectableMask);
        this.ui._renderDiceLabels(this.latestDiceValues, this.selectedDiceMask, this.bankedDiceMask);

        const rollsCaption = this.devModeEnabled ? `Roll ${this.rollsThisTurn}` : `Roll ${this.rollsThisTurn}/3`;
        const baseMessage =
            overrideMessage ??
            (mostRecentPatternKey
                ? `${rollsCaption} — Last pattern: ${mostRecentPatternKey.replaceAll("_", " ")} (+${mostRecentPatternScore})`
                : (!this.hasRolledAtLeastOnce ? "Waiting for first roll…" : `${rollsCaption}`));

        this.ui._setMessage(baseMessage);
        this.ui._setScoreDisplay(this.currentRollScore, this.runScore, this.totalScore);
    }
}