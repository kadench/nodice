import { DICE_SCORES } from "./DICE_SCORES.js";

export default class c_SelectionManager {
    constructor() {}

    _getSelectableDiceMask(diceValues, bankedMask = []) {
        if (!Array.isArray(diceValues) || diceValues.length !== 6)
            return [false,false,false,false,false,false];

        const n = diceValues.length;
        const selectableMask = Array(n).fill(false);
        const unbankedIdx = [];
        for (let i = 0; i < n; i++) if (!bankedMask[i]) unbankedIdx.push(i);
        if (unbankedIdx.length === 0) return selectableMask;

        const faceToIndexes = {1:[],2:[],3:[],4:[],5:[],6:[]};
        for (const i of unbankedIdx) faceToIndexes[diceValues[i]].push(i);
        const fc = {1:faceToIndexes[1].length,2:faceToIndexes[2].length,3:faceToIndexes[3].length,4:faceToIndexes[4].length,5:faceToIndexes[5].length,6:faceToIndexes[6].length};
        const unbankedCount = unbankedIdx.length;
        const gate = (need)=>unbankedCount>=need;

        if (gate(6)) {
            const straight = fc[1]===1&&fc[2]===1&&fc[3]===1&&fc[4]===1&&fc[5]===1&&fc[6]===1;
            if (straight) { for (const i of unbankedIdx) selectableMask[i]=true; return selectableMask; }
            let trips=0; for (let f=1; f<=6; f++) if (fc[f]===3) trips++;
            if (trips===2) { for (const i of unbankedIdx) selectableMask[i]=true; return selectableMask; }
            let fourFace=0,pairFace=0;
            for (let f=1; f<=6; f++){ if(fc[f]===4) fourFace=f; if(fc[f]===2) pairFace=f; }
            if (fourFace&&pairFace){ for (const i of faceToIndexes[fourFace]) selectableMask[i]=true; return selectableMask; }
        }

        for (let f=1; f<=6; f++){
            if (gate(6) && fc[f]===6){ for (const i of faceToIndexes[f]) selectableMask[i]=true; return selectableMask; }
            if (gate(5) && fc[f]===5){ for (const i of faceToIndexes[f]) selectableMask[i]=true; return selectableMask; }
        }

        for (let f=1; f<=6; f++){
            if (gate(4) && fc[f]===4) for (const i of faceToIndexes[f]) selectableMask[i]=true;
            else if (gate(3) && fc[f]>3) for (let j=0;j<3&&j<faceToIndexes[f].length;j++) selectableMask[faceToIndexes[f][j]]=true;
        }

        if (gate(3)) for (let f=1; f<=6; f++) if (fc[f]===3) for (const i of faceToIndexes[f]) selectableMask[i]=true;

        for (const i of faceToIndexes[1]) selectableMask[i]=true;
        for (const i of faceToIndexes[5]) selectableMask[i]=true;

        return selectableMask;
    }


    _computeSelectedScore(selectedDiceValues) {
        if (!Array.isArray(selectedDiceValues) || selectedDiceValues.length === 0) return 0;

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        for (let i = 0; i < selectedDiceValues.length; i++) counts[selectedDiceValues[i]]++;

        if (selectedDiceValues.length === 6) {
            const isStraight =
                counts[1] === 1 && counts[2] === 1 && counts[3] === 1 &&
                counts[4] === 1 && counts[5] === 1 && counts[6] === 1;
            if (isStraight) return DICE_SCORES.straight;

            let tripletKinds = 0;
            for (let f = 1; f <= 6; f++) if (counts[f] === 3) tripletKinds++;
            if (tripletKinds === 2) return DICE_SCORES.two_triplets;

            let hasFour = false, hasPair = false;
            for (let f = 1; f <= 6; f++) {
                if (counts[f] === 4) hasFour = true;
                if (counts[f] === 2) hasPair = true;
            }
            if (hasFour && hasPair) return DICE_SCORES.four_any_w_pair;

            for (let f = 1; f <= 6; f++) {
                if (counts[f] === 6) return DICE_SCORES.six_any;
                if (counts[f] === 5) return DICE_SCORES.five_any;
            }
        }

        let score = 0;
        for (let f = 1; f <= 6; f++) {
            if (counts[f] >= 6) { score += DICE_SCORES.six_any; counts[f] -= 6; }
            else if (counts[f] === 5) { score += DICE_SCORES.five_any; counts[f] -= 5; }
            else if (counts[f] === 4) { score += DICE_SCORES.four_any; counts[f] -= 4; }

            if (counts[f] >= 3) { score += DICE_SCORES[`three_${f}`]; counts[f] -= 3; }
        }

        if (counts[1] > 0) score += counts[1] * DICE_SCORES.one_1;
        if (counts[5] > 0) score += counts[5] * DICE_SCORES.one_5;

        return score;
    }
}