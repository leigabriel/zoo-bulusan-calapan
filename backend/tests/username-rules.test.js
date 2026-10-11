const test = require('node:test');
const assert = require('node:assert/strict');
const { validateUsername, RESERVED_USERNAMES } = require('../utils/username-rules');

test('accepts a normal name and trims surrounding whitespace', () => {
    const result = validateUsername('  Maria.Santos  ');
    assert.equal(result.ok, true);
    assert.equal(result.value, 'Maria.Santos');
    assert.equal(result.error, null);
});

test('rejects names that are too short, too long, or empty', () => {
    assert.equal(validateUsername('ab').ok, false);
    assert.equal(validateUsername('a'.repeat(51)).ok, false);
    assert.equal(validateUsername('').ok, false);
    assert.equal(validateUsername(null).ok, false);
});

test('rejects characters outside the allowed set', () => {
    assert.equal(validateUsername('maria santos').ok, false);
    assert.equal(validateUsername('maria@zoo').ok, false);
    assert.equal(validateUsername('<script>').ok, false);
});

test('rejects reserved names', () => {
    assert.equal(validateUsername('admin').ok, false);
    assert.equal(validateUsername('JIJI').ok, false);
    assert.deepEqual([...RESERVED_USERNAMES].sort(), ['admin', 'bulusanzoo', 'jiji', 'staff', 'system']);
});

test('always reports the 50 character column limit', () => {
    const result = validateUsername('a'.repeat(50));
    assert.equal(result.ok, true);
    assert.equal(result.value.length, 50);
});