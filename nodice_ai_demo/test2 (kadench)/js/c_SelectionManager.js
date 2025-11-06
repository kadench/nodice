import { DICE_SCORES } from "./DICE_SCORES.js";

export default class c_SelectionManager {
    constructor() {}

    _getSelectableDiceMask(diceValues) {
        const selectableMask = Array(6).fill(false);
        const faceToIndexes = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        for (let i = 0; i < diceValues.length; i++) faceToIndexes[diceValues[i]].push(i);
        const faceCounts = {
            1: faceToIndexes[1].length, 2: faceToIndexes[2].length, 3: faceToIndexes[3].length,
            4: faceToIndexes[4].length, 5: faceToIndexes[5].length, 6: faceToIndexes[6].length
        };

        const isStraight =
            faceCounts[1] === 1 && faceCounts[2] === 1 && faceCounts[3] === 1 &&
            faceCounts[4] === 1 && faceCounts[5] === 1 && faceCounts[6] === 1;
        if (isStraight) { for (let i = 0; i < 6; i++) selectableMask[i] = true; return selectableMask; }

        let triplets = 0;
        for (let f = 1; f <= 6; f++) if (faceCounts[f] === 3) triplets++;
        if (triplets === 2) { for (let i = 0; i < 6; i++) selectableMask[i] = true; return selectableMask; }

        let fourFace = 0, pairFace = 0;
        for (let f = 1; f <= 6; f++) { if (faceCounts[f] === 4) fourFace = f; if (faceCounts[f] === 2) pairFace = f; }
        if (fourFace && pairFace) { for (const idx of faceToIndexes[fourFace]) selectableMask[idx] = true; return selectableMask; }

        for (let f = 1; f <= 6; f++) {
            if (faceCounts[f] === 6 || faceCounts[f] === 5) { for (const idx of faceToIndexes[f]) selectableMask[idx] = true; return selectableMask; }
        }

        if (fourFace && !pairFace) { for (const idx of faceToIndexes[fourFace]) selectableMask[idx] = true; }

        for (let f = 1; f <= 6; f++) {
            if (faceCounts[f] === 3) { for (const idx of faceToIndexes[f]) selectableMask[idx] = true; }
            else if (faceCounts[f] > 3) { for (let j = 0; j < 3 && j < faceToIndexes[f].length; j++) selectableMask[faceToIndexes[f][j]] = true; }
        }

        for (const idx of faceToIndexes[1]) selectableMask[idx] = true;
        for (const idx of faceToIndexes[5]) selectableMask[idx] = true;

        return selectableMask;
    }

    _computeSelectedScore(selectedDiceValues) {
        if (selectedDiceValues.length === 0) return 0;

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        for (let i = 0; i < selectedDiceValues.length; i++) counts[selectedDiceValues[i]]++;

        if (selectedDiceValues.length === 6) {
            const isStraight = counts[1] === 1 && counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 1 && counts[6] === 1;
            if (isStraight) return DICE_SCORES.straight;

            let tripletKinds = 0; for (let f = 1; f <= 6; f++) if (counts[f] === 3) tripletKinds++;
            if (tripletKinds === 2) return DICE_SCORES.two_triplets;

            let hasFour = false, hasPair = false;
            for (let f = 1; f <= 6; f++) { if (counts[f] === 4) hasFour = true; if (counts[f] === 2) hasPair = true; }
            if (hasFour && hasPair) return DICE_SCORES.four_any_w_pair;

            for (let f = 1; f <= 6; f++) { if (counts[f] === 6) return DICE_SCORES.six_any; if (counts[f] === 5) return DICE_SCORES.five_any; }
        }

        let score = 0;
        for (let f = 1; f <= 6; f++) {
            if (counts[f] >= 6) { score += DICE_SCORES.six_any; counts[f] -= 6; }
            else if (counts[f] === 5) { score += DICE_SCORES.five_any; counts[f] -= 5; }
            else if (counts[f] === 4) { score += DICE_SCORES.four_any; counts[f] -= 4; }

            if (counts[f] >= 3) { const key = `three_${f}`; score += DICE_SCORES[key]; counts[f] -= 3; }
        }
        if (counts[1] > 0) score += counts[1] * DICE_SCORES.one_1;
        if (counts[5] > 0) score += counts[5] * DICE_SCORES.one_5;

        return score;
    }
}