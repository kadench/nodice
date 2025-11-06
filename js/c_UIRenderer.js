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
        this.buttonSelectAll = document.getElementById("select-all-btn");
    }

    _getDiceImg() {
        // so this is going to be like _getDiceButtons, but instead with the nested <div> structure for imgs
        const byId = [];
        for (let i = 1; i <= 6; i++) {
            const dien = document.getElementsByClassName('dice-display')[i];
            if (dien) byId.push(dien);
        }
        if (byId.length === 6) return byId;

        if (!this.containerDice) return [];
        return Array.from(this.containerDice.querySelectorAll(".dice-display"));
        //this might not work
    }

    _renderDiceLabels(diceValues, selectedMask, bankedMask) {
        const diceImg = this._getDiceImg();
        for (let i = 0; i < diceImg.length && i < diceValues.length; i++) {
            const isSelected = !!selectedMask[i];
            const isBanked = !!bankedMask[i];
            diceImg[i].hidden = isBanked;
            if (!isBanked) {
                
                diceImg[i].lastElementChild.style.backgroundPosition = `-${diceValues[i]-1}00% 0%`;
                // diceImg[i].firstChild.style. not really sure what do with this yet other than I need a conditional to set the background
                const suffix = isSelected ? "selected" : "";
                //diceImg[i].firstElementChild.classList.toggle(`${suffix}`);
                diceImg[i].firstElementChild.classList.toggle('selected', isSelected);
                //diceImg[i].firstElementChild.classList.contains('selected')
                //? diceImg[i].firstElementChild.classList.add('selected')
                //: diceImg[i].firstElementChild.classList.remove('selected');

            }
        }
    }

       _updateActionButtons({ hasRolledAtLeastOnce, selectableMask, selectedMask, bankedMask }) {
        // Detect hot dice: all six are banked (next roll must free them)
        const isHotDice = bankedMask && bankedMask.length === 6 && bankedMask.every(Boolean);

        // --- Roll ---
        if (this.buttonRoll) {
            // Force roll on hot dice
            this.buttonRoll.disabled = !hasRolledAtLeastOnce ? false : false; // can always roll
        }

        // --- Bank ---
        if (this.buttonBank) {
            // Disable bank on hot dice; otherwise enabled only if any die is selected
            const anySelected = Array.isArray(selectedMask) && selectedMask.some(Boolean);
            this.buttonBank.disabled = isHotDice || !anySelected || (Array.isArray(bankedMask) && bankedMask.every(Boolean));
        }

        // --- End Turn / Pass ---
        if (this.buttonEndTurn) {
            if (!hasRolledAtLeastOnce) {
                // Pre-first-roll: act like "Pass"
                this.buttonEndTurn.textContent = "Pass";
                this.buttonEndTurn.disabled = false; // allow passing
            } else {
                this.buttonEndTurn.textContent = "End Turn";
                // During hot dice, you cannot end the turn
                this.buttonEndTurn.disabled = !!isHotDice;
            }
        }

        // --- Select All / Deselect All ---
        if (this.buttonSelectAll) {
            const anySelectable = Array.isArray(selectableMask) && selectableMask.some(Boolean);
            this.buttonSelectAll.disabled = !anySelectable;

            if (anySelectable) {
                const allSelectableAlreadySelected = selectableMask.every((v, i) => !v || selectedMask[i]);
                this.buttonSelectAll.textContent = allSelectableAlreadySelected ? "Deselect All" : "Select All";
            } else {
                this.buttonSelectAll.textContent = "Select All";
            }
        }
    }

    // Optional tiny helper if you want to reuse elsewhere
    _allSelectableAlreadySelected(selectableMask, selectedMask) {
        return selectableMask.every((v, i) => !v || selectedMask[i]);
    }

    _applyDiceEnabledMask(selectableMask) {
        const diceClicks = this._getDiceImg();
            // If the button is hidden (banked), ensure it is disabled as well
            //diceButtons[i].disabled = diceButtons[i].hidden ? true : !selectableMask[i];
        for (let i = 0; i < diceClicks.length && i < selectableMask.length; i++) {
            //diceClicks[i].firstElementChild.disabled = diceClicks[i].hidden ? true : !selectableMask[i];
            diceClicks[i].firstElementChild.classList.toggle('disabled', !selectableMask[i]); 
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
