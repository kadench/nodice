// Roll a die with the given number of sides using cryptographically strong randomness
function rollDie(sides) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % sides) + 1;
}

// --- Game State Variables ---
const diceTypes = [6, 6, 6, 6, 6, 6]; // Array of dice, each with 6 sides
let diceResults = Array(diceTypes.length).fill(1);      // Current face values for each die
let selectedDice = Array(diceTypes.length).fill(false); // Which dice are selected this roll
let diceBanked = Array(diceTypes.length).fill(false);   // Which dice have been banked (removed from play)
let score = 0;         // Score for current roll (not yet banked)
let runScore = 0;      // Score banked during this run (resets if run is lost)
let totalScore = 0;    // Score banked at end of turn (persists across runs)
let runActive = true;  // Is the run still active?

// --- Render Dice Buttons and UI ---
function renderDice() {
    const container = document.getElementById('dice-container');
    container.innerHTML = '';

    // Count occurrences of each value in current roll (only dice not banked)
    const valueCounts = {};
    diceResults.forEach((val, i) => {
        if (!diceBanked[i]) {
            valueCounts[val] = (valueCounts[val] || 0) + 1;
        }
    });

    let anyEnabled = false; // Track if any dice can be selected

    diceTypes.forEach((sides, i) => {
        if (diceBanked[i]) return; // Skip banked dice
        const val = diceResults[i];
        const btn = document.createElement('button');
        btn.textContent = `d${sides}: ${val}`;
        btn.style.background = selectedDice[i] ? '#90ee90' : '';

        // Enable button if die is a 1 or 5, or part of a three-of-a-kind
        if (val === 1 || val === 5 || valueCounts[val] >= 3) {
            btn.disabled = false;
            anyEnabled = true;
        } else {
            btn.disabled = true;
            btn.style.background = '#eee';
        }

        // --- Dice Selection Logic ---
        btn.onclick = () => {
            // Handle three-of-a-kind for any value (including 1 and 5)
            if (valueCounts[val] >= 3) {
                // Find all indices of dice with this value that are not banked
                const indices = [];
                diceResults.forEach((v, idx) => {
                    if (!diceBanked[idx] && v === val) {
                        indices.push(idx);
                    }
                });
                // Find which set this die belongs to
                let setIdx = -1;
                for (let j = 0; j <= indices.length - 3; j += 3) {
                    const set = indices.slice(j, j + 3);
                    if (set.includes(i)) {
                        setIdx = j;
                        break;
                    }
                }
                if (setIdx !== -1) {
                    const set = indices.slice(setIdx, setIdx + 3);
                    if (set.every(idx => selectedDice[idx])) {
                        // Unselect this set
                        set.forEach(idx => selectedDice[idx] = false);
                        if (val === 1) score -= 1000;
                        else if (val === 5) score -= 500;
                        else score -= val * 100;
                    } else if (set.every(idx => !selectedDice[idx])) {
                        // Select this set
                        set.forEach(idx => selectedDice[idx] = true);
                        if (val === 1) score += 1000;
                        else if (val === 5) score += 500;
                        else score += val * 100;
                    }
                    updateScore();
                    renderDice();
                    return;
                }
            }
            // Otherwise, handle single selection for 1 or 5
            if (val === 1 || val === 5) {
                if (selectedDice[i]) {
                    selectedDice[i] = false;
                    score -= (val === 1 ? 100 : 50);
                } else {
                    selectedDice[i] = true;
                    score += (val === 1 ? 100 : 50);
                }
            }
            updateScore();
            renderDice();
        };

        container.appendChild(btn);
    });

    // --- Update UI Elements ---
    document.getElementById('score').textContent = score;
    document.getElementById('runscore').textContent = runScore;
    document.getElementById('totalscore').textContent = totalScore;
    document.getElementById('message').textContent = runActive
        ? 'Select dice to keep (1, 5, or three of a kind).'
        : 'You lost your run! Roll again to start a new run.';
}

// --- Update Score Display ---
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('runscore').textContent = runScore;
    document.getElementById('totalscore').textContent = totalScore;
}

// --- Roll Dice Logic ---
function rollAllDice() {
    // If all dice are banked, unbank them (but do NOT reset runScore or score)
    if (diceBanked.every(b => b)) {
        diceBanked = Array(diceTypes.length).fill(false);
        selectedDice = Array(diceTypes.length).fill(false);
        document.getElementById('message').textContent = 'All dice are back in play! Keep your run going!';
    }

    // If the run was lost (no dice enabled), restore all dice and reset runScore and score
    if (!runActive) {
        diceBanked = Array(diceTypes.length).fill(false);
        selectedDice = Array(diceTypes.length).fill(false);
        score = 0;
        runScore = 0;
        runActive = true;
        // Roll all dice to randomize their values
        diceTypes.forEach((sides, i) => {
            diceResults[i] = rollDie(sides);
        });
        document.getElementById('message').textContent = 'You lost your run! All dice are available for the next roll.';
        renderDice();
        updateScore();
        return;
    }

    // Roll only dice not banked
    diceTypes.forEach((sides, i) => {
        if (!diceBanked[i]) {
            diceResults[i] = rollDie(sides);
        }
    });
    selectedDice = Array(diceTypes.length).fill(false);

    // Check if any dice can be selected (run is still active)
    const valueCounts = {};
    let anyEnabled = false;
    diceResults.forEach((val, i) => {
        if (!diceBanked[i]) {
            valueCounts[val] = (valueCounts[val] || 0) + 1;
        }
    });
    diceResults.forEach((val, i) => {
        if (!diceBanked[i]) {
            if (val === 1 || val === 5 || valueCounts[val] >= 3) {
                anyEnabled = true;
            }
        }
    });
    runActive = anyEnabled;

    if (!runActive) {
        score = 0;
        runScore = 0;
        document.getElementById('message').textContent = 'You lost your run! All dice are available for the next roll.';
    }

    renderDice();
    updateScore();
}

// --- Bank Score Logic ---
function bankScore() {
    runScore += score; // Add current roll score to run score
    score = 0;
    // Remove selected dice from play (bank them)
    selectedDice.forEach((selected, i) => {
        if (selected) {
            diceBanked[i] = true;
        }
    });
    selectedDice = Array(diceTypes.length).fill(false);
    updateScore();
    document.getElementById('runscore').textContent = runScore;
    document.getElementById('message').textContent = 'Score banked!';
    renderDice();
}

// --- End Turn Logic ---
function endTurn() {
    totalScore += runScore; // Add run score to total score
    runScore = 0;
    score = 0;
    diceBanked = Array(diceTypes.length).fill(false);
    selectedDice = Array(diceTypes.length).fill(false);
    runActive = true;
    document.getElementById('message').textContent = 'Turn ended! Your total score is updated.';
    // Automatically roll all dice for the next run
    diceTypes.forEach((sides, i) => {
        diceResults[i] = rollDie(sides);
    });
    renderDice();
    updateScore();
}

// --- Attach Button Events ---
document.getElementById('roll-btn').onclick = rollAllDice;
document.getElementById('bank-btn').onclick = bankScore;
document.getElementById('endturn-btn').onclick = endTurn;

// --- Initial Render ---
rollAllDice();