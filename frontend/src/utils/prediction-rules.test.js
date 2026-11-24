import test from 'node:test';
import assert from 'node:assert';
import { evaluatePrediction } from './prediction-rules.js';

const classes = ['Deer', 'Koi', 'Owl', 'Tiger'];
const config = { confidenceThreshold: 0.7, minMargin: 0.25, classThresholds: { Koi: 0.9 } };

test('accepts a confident, clearly separated result', () => {
    const r = evaluatePrediction([0.05, 0.02, 0.03, 0.9], classes, config);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.top.name, 'Tiger');
});

test('rejects a score under the global threshold', () => {
    const r = evaluatePrediction([0.1, 0.1, 0.1, 0.65], classes, config);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'low_confidence');
});

test('rejects a split result when the margin is too small (needs a low threshold to matter)', () => {
    const r = evaluatePrediction([0.01, 0.0, 0.4, 0.55], classes, { ...config, confidenceThreshold: 0.5 });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'ambiguous');
});

test('koi needs a higher score than other classes', () => {
    assert.strictEqual(evaluatePrediction([0.02, 0.85, 0.03, 0.1], classes, config).ok, false);
    assert.strictEqual(evaluatePrediction([0.01, 0.95, 0.02, 0.02], classes, config).ok, true);
});

test('a plant-like 60-90 percent koi result is rejected unless it is clear', () => {
    assert.strictEqual(evaluatePrediction([0.1, 0.75, 0.05, 0.1], classes, config).ok, false);
    assert.strictEqual(evaluatePrediction([0.0, 0.88, 0.0, 0.12], classes, config).ok, false);
});

test('rejects malformed output', () => {
    assert.strictEqual(evaluatePrediction([0.5, 0.5], classes, config).reason, 'invalid');
    assert.strictEqual(evaluatePrediction([NaN, NaN, NaN, NaN], classes, config).reason, 'invalid');
});
