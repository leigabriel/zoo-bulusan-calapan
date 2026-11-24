const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');

const inserts = [];
const loadController = () => {
    const originalLoad = Module._load;
    Module._load = function (request, ...rest) {
        if (/config[\\/]database$/.test(request)) {
            return { query: async (sql, params) => { inserts.push({ sql, params }); return [{ insertId: 7 }]; } };
        }
        return originalLoad.call(this, request, ...rest);
    };
    try {
        const resolved = require.resolve('../controllers/prediction-controller');
        delete require.cache[resolved];
        return require('../controllers/prediction-controller');
    } finally {
        Module._load = originalLoad;
    }
};

const call = async (body, user) => {
    const controller = loadController();
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    inserts.length = 0;
    await controller.createPrediction({ body, user }, res);
    return res;
};

test('model class list matches the v2 class_names.json', () => {
    const { MODEL_CLASSES } = require('../config/model-classes');
    const names = require('../../frontend/public/model/bulusanzoo_machine_learning_v2/class_names.json');
    const fromModel = Object.entries(names.index_to_class)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([, name]) => name.charAt(0).toUpperCase() + name.slice(1));
    assert.deepStrictEqual([...MODEL_CLASSES].sort(), [...fromModel].sort());
});

test('a valid prediction is saved, including Koi', async () => {
    const res = await call({ prediction: 'Koi', confidence: 91.5, filename: 'a.jpg' }, { id: 3 });
    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(inserts[0].params, ['a.jpg', 'Koi', 91.5, 3]);
});

test('unknown classes are rejected without touching the database', async () => {
    for (const prediction of ['Dragon', 'koi', '<script>', 42, {}]) {
        const res = await call({ prediction, confidence: 80 });
        assert.strictEqual(res.statusCode, 400, String(prediction));
    }
    assert.strictEqual(inserts.length, 0);
});

test('confidence must be a number from 0 to 100', async () => {
    for (const confidence of [-1, 101, 'abc', NaN, Infinity, null]) {
        const res = await call({ prediction: 'Deer', confidence });
        assert.strictEqual(res.statusCode, 400, String(confidence));
    }
    assert.strictEqual((await call({ prediction: 'Deer', confidence: '55.5' })).statusCode, 201);
});

test('filename is trimmed, defaulted and capped at 255 chars', async () => {
    await call({ prediction: 'Owl', confidence: 70, filename: 'x'.repeat(400) });
    assert.strictEqual(inserts[0].params[0].length, 255);
    await call({ prediction: 'Owl', confidence: 70, filename: {} });
    assert.strictEqual(inserts[0].params[0], 'uploaded_image.jpg');
});
