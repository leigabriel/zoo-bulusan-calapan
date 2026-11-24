// Decides whether a model output is trustworthy enough to show as an animal result.
// Pure function (no tensors, no DOM) so it can be unit tested.

export const evaluatePrediction = (probabilities, classes, config) => {
    if (!Array.isArray(probabilities) || probabilities.length !== classes.length || probabilities.length === 0) {
        return { ok: false, reason: 'invalid' };
    }

    const ranked = probabilities
        .map((score, index) => ({ index, score, name: classes[index] }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) return { ok: false, reason: 'invalid' };

    const [top, runnerUp] = ranked;
    const threshold = Math.max(config.confidenceThreshold, config.classThresholds?.[top.name] ?? 0);
    const margin = top.score - (runnerUp ? runnerUp.score : 0);
    const topThree = ranked.slice(0, 3).map(({ name, score }) => ({ name, score: Number(score.toFixed(3)) }));

    if (top.score < threshold) return { ok: false, reason: 'low_confidence', top, margin, topThree };
    if (margin < config.minMargin) return { ok: false, reason: 'ambiguous', top, margin, topThree };
    return { ok: true, top, margin, topThree };
};
