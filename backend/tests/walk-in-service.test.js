const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAndCalculate } = require('../services/walk-in-service');

const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

test('calculates server prices, discounts, total, and cash change', () => {
    const result = validateAndCalculate({
        visitDate: today(),
        items: [
            { categoryCode: 'adult', quantity: 2 },
            { categoryCode: 'senior', quantity: 1 }
        ],
        payment: { method: 'cash', amountReceivedCents: 12000 }
    });

    assert.equal(result.subtotalCents, 12000);
    assert.equal(result.discountCents, 800);
    assert.equal(result.totalCents, 11200);
    assert.equal(result.payment.changeCents, 800);
    assert.equal(result.totalVisitors, 3);
});

test('rejects duplicate categories and invalid quantities', () => {
    assert.throws(() => validateAndCalculate({
        visitDate: today(),
        items: [{ categoryCode: 'adult', quantity: 1 }, { categoryCode: 'adult', quantity: 2 }],
        payment: { method: 'cash', amountReceivedCents: 12000 }
    }), /invalid or duplicated/);
    assert.throws(() => validateAndCalculate({
        visitDate: today(),
        items: [{ categoryCode: 'adult', quantity: -1 }],
        payment: { method: 'cash', amountReceivedCents: 0 }
    }), /positive whole numbers/);
});

test('requires enough cash and a GCash reference', () => {
    assert.throws(() => validateAndCalculate({
        visitDate: today(),
        items: [{ categoryCode: 'adult', quantity: 1 }],
        payment: { method: 'cash', amountReceivedCents: 3999 }
    }), /cover the total/);
    assert.throws(() => validateAndCalculate({
        visitDate: today(),
        items: [{ categoryCode: 'adult', quantity: 1 }],
        payment: { method: 'gcash' }
    }), /payment reference/);
});

test('ignores client prices and uses the configured catalog', () => {
    const result = validateAndCalculate({
        visitDate: today(),
        items: [{ categoryCode: 'adult', quantity: 1, unitPriceCents: 1 }],
        totalCents: 1,
        payment: { method: 'cash', amountReceivedCents: 4000 }
    });
    assert.equal(result.totalCents, 4000);
});
