export default class c_UIRenderer {
    constructor() {
        this.containerDice = document.getElementById("dice-container");
        this.containerScore = document.getElementById("score");
        this.containerRunScore = document.getElementById("runscore");
        this.containerTotalScore = document.getElementById("totalscore");
        this.containerMessage = document.getElementById("message");
        this.buttonRoll = document.getElementById("roll-btn");
        this.buttonBank = document.getElementById("bank-btn");
        this.buttonEndTurn = document.getElementById("endturn-btn");
        this.buttonSelectAll = document.getElementById("selectall-btn");
    }

    _getDiceButtons() {
        // Prefer explicit ids die-1..die-6 for deterministic ordering
        const byId = [];
        for (let i = 1; i <= 6; i++) {
            const el = document.getElementById(`die-${i}`);
            if (el) byId.push(el);
        }
        if (byId.length === 6) return byId;

        // Fallback to buttons inside #dice-container (kept for compatibility)
        if (!this.containerDice) return [];
        return Array.from(this.containerDice.querySelectorAll("button"));
    }

    _renderDiceLabels(diceValues, selectedMask, bankedMask) {
        const diceButtons = this._getDiceButtons();
        for (let i = 0; i < diceButtons.length && i < diceValues.length; i++) {
            const isSelected = !!selectedMask[i];
            const isBanked = !!bankedMask[i];
            diceButtons[i].hidden = isBanked;
            if (!isBanked) {
                const suffix = isSelected ? " [selected]" : "";
                
                diceButtons[i].textContent = `Die ${i + 1}: ${diceValues[i]}${suffix}`;
                // change bg of selected dice
                diceButtons[i].textContent.includes("[selected]")
                    ? diceButtons[i].classList.add("selected")
                    : diceButtons[i].classList.remove("selected");

            }
        }
    }

    _applyDiceEnabledMask(selectableMask) {
        const diceButtons = this._getDiceButtons();
        for (let i = 0; i < diceButtons.length && i < selectableMask.length; i++) {
            // If the button is hidden (banked), ensure it is disabled as well
            diceButtons[i].disabled = diceButtons[i].hidden ? true : !selectableMask[i];
        }
    }

    _setScoreDisplay(currentRollScore, runScore, totalScore) {
        if (this.containerScore) this.containerScore.textContent = String(currentRollScore);
        if (this.containerRunScore) this.containerRunScore.textContent = String(runScore);
        if (this.containerTotalScore) this.containerTotalScore.textContent = String(totalScore);
    }

    _setMessage(textMessage) {
        if (this.containerMessage) this.containerMessage.textContent = textMessage;
    }
}