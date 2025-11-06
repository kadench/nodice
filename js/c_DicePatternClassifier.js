import { DICE_SCORES } from "./DICE_SCORES.js";

export default class c_DicePatternClassifier {
    constructor() {}

    _countFaces(diceValues) {
        const faceCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        for (let i = 0; i < diceValues.length; i++) faceCounts[diceValues[i]]++;
        return faceCounts;
    }

    _isStraight(faceCounts) {
        for (let i = 1; i <= 6; i++) if (faceCounts[i] !== 1) return false;
        return true;
    }

    _isTwoTriplets(faceCounts) {
        let tripletCount = 0;
        for (let i = 1; i <= 6; i++) if (faceCounts[i] === 3) tripletCount++;
        return tripletCount === 2;
    }

    _isFourWithPair(faceCounts) {
        let hasFour = false;
        let hasPair = false;
        for (let i = 1; i <= 6; i++) {
            if (faceCounts[i] === 4) hasFour = true;
            if (faceCounts[i] === 2) hasPair = true;
        }
        return hasFour && hasPair;
    }

    _hasOfAKind(faceCounts, targetCount) {
        for (let i = 1; i <= 6; i++) if (faceCounts[i] === targetCount) return i;
        return 0;
    }

    _hasAnyOneOrFive(faceCounts) {
        if (faceCounts[1] > 0) return "one_1";
        if (faceCounts[5] > 0) return "one_5";
        return "";
    }

    _classifyRoll(diceValues) {
        const faceCounts = this._countFaces(diceValues);

        if (this._isStraight(faceCounts)) return { patternKey: "straight", score: DICE_SCORES.straight };
        if (this._isTwoTriplets(faceCounts)) return { patternKey: "two_triplets", score: DICE_SCORES.two_triplets };
        if (this._isFourWithPair(faceCounts)) return { patternKey: "four_any_w_pair", score: DICE_SCORES.four_any_w_pair };
        if (this._hasOfAKind(faceCounts, 6)) return { patternKey: "six_any", score: DICE_SCORES.six_any };
        if (this._hasOfAKind(faceCounts, 5)) return { patternKey: "five_any", score: DICE_SCORES.five_any };
        if (this._hasOfAKind(faceCounts, 4)) return { patternKey: "four_any", score: DICE_SCORES.four_any };

        for (let faceValue = 1; faceValue <= 6; faceValue++) {
            if (faceCounts[faceValue] === 3) {
                const patternKey = `three_${faceValue}`;
                return { patternKey, score: DICE_SCORES[patternKey] };
            }
        }

        const singleKey = this._hasAnyOneOrFive(faceCounts);
        if (singleKey) return { patternKey: singleKey, score: DICE_SCORES[singleKey] };

        return { patternKey: "farkle", score: 0 };
    }
}