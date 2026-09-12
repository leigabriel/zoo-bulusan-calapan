const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeReceipt } = require('../services/esc-pos-service');

test('encodes a minimal receipt with a native ESC/POS QR command', () => {
    const output = encodeReceipt({
        organizationName: 'Bulusan Wildlife and Nature Park',
        receiptNumber: 'OR-20260912-ABC123',
        createdAt: '2026-09-12T10:30:00.000Z',
        qrData: 'OR-20260912-ABC123',
        items: [{ categoryCode: 'adult', categoryLabel: 'Adult', quantity: 2 }],
        totalCents: 999999,
        visitorName: 'Must not print'
    });
    const text = output.toString('ascii');

    assert.match(text, /BULUSAN ZOO/);
    assert.match(text, /Ticket  2 x Adult/);
    assert.match(text, /OR-20260912-ABC123/);
    assert.equal(text.includes('Must not print'), false);
    assert.equal(text.includes('999999'), false);
    assert.notEqual(output.indexOf(Buffer.from([0x1d, 0x28, 0x6b])), -1);
});
