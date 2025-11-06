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

    _getDiceButtons() {
        // Prefer explicit ids die-1..die-6 for deterministic ordering
        const byId = [];
        for (let i = 1; i <= 6; i++) {
            const el = document.getElementById(`die-${i}`);
            if (el) byId.push(el);
        }
        if (byId.length === 6) return byId;
        // ...does it need to read the elements and then recreate them? can't we just make them from scratch?

        // Fallback to buttons inside #dice-container (kept for compatibility)
        if (!this.containerDice) return [];
        return Array.from(this.containerDice.querySelectorAll("button"));
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
        // so this functions doesn't make new dice, it just changes the existing ones...
        const diceButtons = this._getDiceButtons();
        const diceImg = this._getDiceImg();
        for (let i = 0; i < diceButtons.length && i < diceValues.length; i++) {
            const isSelected = !!selectedMask[i];
            const isBanked = !!bankedMask[i];
            diceButtons[i].hidden = isBanked;
            if (!isBanked) {
                // selected is kind of obnoxious, S is more clear
                const suffix = isSelected ? " [S]" : "";
                
                // also the 'Die -#' is also obnoxious
                diceButtons[i].textContent = `${diceValues[i]}${suffix}`;
                // change bg of selected dice
                diceButtons[i].textContent.includes("[S]")
                    ? diceButtons[i].classList.add("selected")
                    : diceButtons[i].classList.remove("selected");

            }
        }

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

    _applyDiceEnabledMask(selectableMask) {
        const diceButtons = this._getDiceButtons();
        const diceClicks = this._getDiceImg();
        for (let i = 0; i < diceButtons.length && i < selectableMask.length; i++) {
            // If the button is hidden (banked), ensure it is disabled as well
            diceButtons[i].disabled = diceButtons[i].hidden ? true : !selectableMask[i];
        }
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
