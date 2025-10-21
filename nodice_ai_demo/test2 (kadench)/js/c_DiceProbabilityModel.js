import { DICE_SCORES } from "./DICE_SCORES.js";

export default class c_DiceProbabilityModel {
    constructor(classifierInstance) {
        this.classifierInstance = classifierInstance;
        this.totalOutcomes = Math.pow(6, 6);
        this.patternCounts = {};
        this.DICE_ROLLS = {};
    }
    //  identify patterns of all dice combinations
    _enumerateAllOutcomesAndTally() {
        for (let a = 1; a <= 6; a++)
            for (let b = 1; b <= 6; b++)
                for (let c = 1; c <= 6; c++)
                    for (let d = 1; d <= 6; d++)
                        for (let e = 1; e <= 6; e++)
                            for (let f = 1; f <= 6; f++) {
                                const diceValues = [a, b, c, d, e, f];
                                const { patternKey } = this.classifierInstance._classifyRoll(diceValues);
                                if (!this.patternCounts[patternKey]) this.patternCounts[patternKey] = 0;
                                this.patternCounts[patternKey]++;
                            };
    }

    _buildDiceRolls() {
        for (const patternKey in DICE_SCORES) {
            const count = this.patternCounts[patternKey] || 0;
            this.DICE_ROLLS[patternKey] = {
                score: DICE_SCORES[patternKey],
                probability: count / this.totalOutcomes
            };
        }
        const farkleCount = this.patternCounts["farkle"] || 0;
        this.DICE_ROLLS["farkle"] = { score: 0, probability: farkleCount / this.totalOutcomes };
    }

    _initialize() {
        this._enumerateAllOutcomesAndTally();
        this._buildDiceRolls();
    }
}