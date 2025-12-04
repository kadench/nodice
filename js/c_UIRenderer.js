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

        // toggle: show/hide the bottom info box (default true)
        this.showInfoBox = true;

        this._lastMessage = "";
    }

    _getDiceImg() {
        const byId = [];
        for (let i = 1; i <= 6; i++) {
            const dien = document.getElementsByClassName('dice-display')[i];
            if (dien) byId.push(dien);
        }
        if (byId.length === 6) return byId;

        if (!this.containerDice) return [];
        return Array.from(this.containerDice.querySelectorAll(".dice-display"));
    }

    _renderDiceLabels(diceValues, selectedMask, bankedMask) {
        const diceImg = this._getDiceImg();
        for (let i = 0; i < diceImg.length && i < diceValues.length; i++) {
            const isSelected = !!selectedMask[i];
            const isBanked = !!bankedMask[i];
            diceImg[i].hidden = isBanked;
            if (!isBanked) {
                diceImg[i].lastElementChild.style.backgroundPosition = `-${diceValues[i]-1}00% 0%`;
                diceImg[i].firstElementChild.classList.toggle('selected', isSelected);
            }
        }
    }

    _updateActionButtons({ hasRolledAtLeastOnce, selectableMask, selectedMask, bankedMask }) {
        const isHotDice = bankedMask && bankedMask.length === 6 && bankedMask.every(Boolean);

        // --- Roll ---
        if (this.buttonRoll) {
            this.buttonRoll.disabled = true; // can always roll
        }

        // --- Bank ---
        if (this.buttonBank) {
            const anySelected = Array.isArray(selectedMask) && selectedMask.some(Boolean);
            this.buttonBank.disabled = isHotDice || !anySelected || (Array.isArray(bankedMask) && bankedMask.every(Boolean));
        }

        // --- End Turn / Pass ---
        if (this.buttonEndTurn) {
            if (!hasRolledAtLeastOnce) {
                this.buttonEndTurn.textContent = "Pass";
                this.buttonEndTurn.disabled = false;
            } else {
                this.buttonEndTurn.textContent = "End Turn";
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

    _allSelectableAlreadySelected(selectableMask, selectedMask) {
        return selectableMask.every((v, i) => !v || selectedMask[i]);
    }

    _applyDiceEnabledMask(selectableMask) {
        const diceClicks = this._getDiceImg();
        for (let i = 0; i < diceClicks.length && i < selectableMask.length; i++) {
            diceClicks[i].classList.toggle('disabled', !selectableMask[i]); 
            diceClicks[i].firstElementChild.classList.toggle('disabled', !selectableMask[i]); 
            diceClicks[i].lastElementChild.classList.toggle('disabled', !selectableMask[i]); 
        }
    }

    _onFarkle() {
    // Disable roll immediately when Farkle occurs
    if (this.rollBtn) this.rollBtn.disabled = true;

    // Optional: give user feedback
    const msg = document.querySelector("#message");
    if (msg) msg.textContent = "Farkle! You must end your turn.";
}

    _setScoreDisplay(currentRollScore, runScore, totalScore) {
        if (this.containerScore) this.containerScore.textContent = String(currentRollScore);
        if (this.containerRunScore) this.containerRunScore.textContent = String(runScore);
        if (this.containerTotalScore) this.containerTotalScore.textContent = String(totalScore);
    }

    // INFO ONLY → bottom message box
    _setMessage(text) {
        this._lastMessage = text || "";
        this._renderMessageBox();
    }

    _showHelpBubbleNearEvent(evt, text) {
        const bubble = document.getElementById("message");
        if (!bubble) return;

        bubble.textContent = text;
        bubble.classList.remove("hidden");
        bubble.classList.add("visible");

        const outsideClick = (e) => {
            const rect = bubble.getBoundingClientRect();
            const tol = 0.011;
            const inside =
                e.clientX >= rect.left - rect.width * tol &&
                e.clientX <= rect.right + rect.width * tol &&
                e.clientY >= rect.top - rect.height * tol &&
                e.clientY <= rect.bottom + rect.height * tol;
            if (!inside) this._hideHelpBubble();
        };
        setTimeout(() => {
            document.addEventListener("mousedown", outsideClick, { once: true });
        }, 50);
    }

    _hideHelpBubble() {
        const bubble = document.getElementById("message");
        if (!bubble) return;
        bubble.classList.remove("visible");
        bubble.classList.add("hidden");
    }

    _renderMessageBox() {
        if (!this.showInfoBox) return;
        const box = this.containerMessage || document.getElementById("message");
        if (!box) return;

        const msg = (this._lastMessage || "").trim();
        box.textContent = msg;

        if (msg) {
            box.classList.remove("hidden");
            box.classList.add("visible");
        } else {
            box.classList.remove("visible");
            box.classList.add("hidden");
        }
    }

    // Add: visual farkle toggle — applies/removes .farkle on the dice container
    _setFarkleVisual(on = false) {
        if (!this.containerDice) return;
        if (on) this.containerDice.classList.add("farkle");
        else this.containerDice.classList.remove("farkle");
    }
}
