export default class c_PatternBasedDiceGenerator {
    constructor(classifierInstance, diceRollsObject) {
        this.classifierInstance = classifierInstance;
        this.diceRollsObject = diceRollsObject;
        this.patternKeysInOrder = Object.keys(diceRollsObject);
        this.cumulativeDistribution = this._buildCumulativeDistribution();
        this.maximumSimulationAttempts = 200;
    }

    _buildCumulativeDistribution() {
        const distribution = [];
        let cumulative = 0;
        for (let i = 0; i < this.patternKeysInOrder.length; i++) {
            const key = this.patternKeysInOrder[i];
            cumulative += this.diceRollsObject[key].probability;
            distribution.push({ key, cumulative });
        }
        if (distribution.length) distribution[distribution.length - 1].cumulative = 1;
        return distribution;
    }

    _choosePatternKeyByProbability() {
        const r = Math.random();
        for (let i = 0; i < this.cumulativeDistribution.length; i++) {
            if (r <= this.cumulativeDistribution[i].cumulative) return this.cumulativeDistribution[i].key;
        }
        return this.patternKeysInOrder[this.patternKeysInOrder.length - 1];
    }

    _simulateRollForPattern(patternKey) {
        for (let attempt = 0; attempt < this.maximumSimulationAttempts; attempt++) {
            const candidate = this._generateCandidate(patternKey);
            const { patternKey: classified } = this.classifierInstance._classifyRoll(candidate);
            if (classified === patternKey) return candidate;
        }
        return [2, 2, 3, 4, 6, 6];
    }

    _generateCandidate(patternKey) {
        let diceValues = [];
        const _pushMany = (face, count) => { for (let i = 0; i < count; i++) diceValues.push(face); };

        switch (patternKey) {
            case "straight":
                diceValues = [1, 2, 3, 4, 5, 6];
                this._shuffleInPlace(diceValues);
                return diceValues;

            case "two_triplets": {
                const a = 1 + Math.floor(Math.random() * 6);
                let b = 1 + Math.floor(Math.random() * 6);
                while (b === a) b = 1 + Math.floor(Math.random() * 6);
                _pushMany(a, 3); _pushMany(b, 3);
                this._shuffleInPlace(diceValues);
                return diceValues;
            }

            case "four_any_w_pair": {
                const fourFace = 1 + Math.floor(Math.random() * 6);
                let pairFace = 1 + Math.floor(Math.random() * 6);
                while (pairFace === fourFace) pairFace = 1 + Math.floor(Math.random() * 6);
                _pushMany(fourFace, 4); _pushMany(pairFace, 2);
                this._shuffleInPlace(diceValues);
                return diceValues;
            }

            case "six_any": {
                const face = 1 + Math.floor(Math.random() * 6);
                _pushMany(face, 6);
                return diceValues;
            }

            case "five_any": {
                const fiveFace = 1 + Math.floor(Math.random() * 6);
                let singleton = 1 + Math.floor(Math.random() * 6);
                if (singleton === fiveFace) singleton = ((fiveFace % 6) + 1);
                _pushMany(fiveFace, 5); diceValues.push(singleton);
                this._shuffleInPlace(diceValues);
                return diceValues;
            }

            case "four_any": {
                const fourFace = 1 + Math.floor(Math.random() * 6);
                _pushMany(fourFace, 4);
                let x = 1 + Math.floor(Math.random() * 6);
                while (x === fourFace) x = 1 + Math.floor(Math.random() * 6);
                let y = 1 + Math.floor(Math.random() * 6);
                while (y === fourFace || y === x) y = 1 + Math.floor(Math.random() * 6);
                diceValues.push(x, y);
                this._shuffleInPlace(diceValues);
                return diceValues;
            }

            case "three_1": case "three_2": case "three_3":
            case "three_4": case "three_5": case "three_6": {
                const face = Number(patternKey.split("_")[1]);
                _pushMany(face, 3);
                while (diceValues.length < 6) {
                    let v = 1 + Math.floor(Math.random() * 6);
                    if (v === face) continue;
                    diceValues.push(v);
                    const counts = this._countFacesLocal(diceValues);
                    let bad = false;
                    for (let f = 1; f <= 6; f++) if (f !== face && counts[f] >= 3) bad = true;
                    if (bad) diceValues.pop();
                }
                this._shuffleInPlace(diceValues);
                return diceValues;
            }

            case "one_1": {
                diceValues = [1];
                while (diceValues.length < 6) diceValues.push(2 + Math.floor(Math.random() * 5));
                this._shuffleInPlace(diceValues);
                return diceValues;
            }

            case "one_5": {
                diceValues = [5];
                while (diceValues.length < 6) {
                    let v = 1 + Math.floor(Math.random() * 6);
                    if (v === 5) v = ((v % 6) + 1);
                    diceValues.push(v);
                }
                this._shuffleInPlace(diceValues);
                return diceValues;
            }

            case "farkle": {
                for (let attempt = 0; attempt < 400; attempt++) {
                    const candidate = Array.from({ length: 6 }, () => 2 + Math.floor(Math.random() * 4));
                    const { patternKey } = this.classifierInstance._classifyRoll(candidate);
                    if (patternKey === "farkle") return candidate;
                }
                return [2, 2, 3, 4, 6, 6];
            }

            default:
                return Array.from({ length: 6 }, () => 1 + Math.floor(Math.random() * 6));
        }
    }

    _countFacesLocal(values) {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        for (let i = 0; i < values.length; i++) counts[values[i]]++;
        return counts;
    }

    _shuffleInPlace(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = array[i]; array[i] = array[j]; array[j] = t;
        }
    }

    _rollSixDiceWeighted() {
        const key = this._choosePatternKeyByProbability();
        const diceValues = this._simulateRollForPattern(key);
        const result = this.classifierInstance._classifyRoll(diceValues);
        return { diceValues, patternKey: result.patternKey, score: result.score };
    }
}