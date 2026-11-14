const test = require('node:test');
const assert = require('node:assert/strict');
const {
    POLICY_SLUGS,
    DEFAULT_POLICIES,
    PolicyValidationError,
    formatPolicyDate,
    mergePolicyUpdate,
    readConfig,
    writeConfig
} = require('../config/legal-policy-config');

test('publishes the four legal pages even before an admin saves', () => {
    const policies = readConfig();

    assert.deepEqual(Object.keys(policies).sort(), [...POLICY_SLUGS].sort());

    for (const slug of POLICY_SLUGS) {
        assert.equal(typeof policies[slug].title, 'string');
        assert.ok(policies[slug].title.length > 0, `${slug} needs a title`);
        assert.equal(typeof policies[slug].lastUpdated, 'string');
        assert.ok(policies[slug].content.length > 100, `${slug} needs a body`);
    }
});

test('default bodies no longer repeat the page heading', () => {
    for (const slug of POLICY_SLUGS) {
        const firstLine = DEFAULT_POLICIES[slug].content.split('\n')[0];
        assert.ok(!firstLine.startsWith('#'), `${slug} should not embed its own heading`);
        assert.ok(!/^last updated/i.test(firstLine), `${slug} should not embed its own date`);
    }
});

test('rejects an untitled policy', async () => {
    await assert.rejects(
        writeConfig({ privacy: { title: '   ', content: 'Body' } }),
        (error) => error instanceof PolicyValidationError
            && error.statusCode === 400
            && /privacy policy needs a title/i.test(error.message)
    );
});

test('rejects an empty policy body', async () => {
    await assert.rejects(
        writeConfig({ privacy: { title: 'Privacy Policy', content: '   ' } }),
        (error) => error instanceof PolicyValidationError && error.statusCode === 400
    );
});

test('rejects a payload that is not an object', async () => {
    await assert.rejects(
        writeConfig(null),
        (error) => error instanceof PolicyValidationError && error.statusCode === 400
    );
});

test('the published date is the Manila calendar date', () => {
    // 16:30 UTC is already the next day in Calapan City (UTC+8).
    assert.equal(formatPolicyDate(new Date('2026-11-14T16:30:00Z')), 'November 15, 2026');
    assert.equal(formatPolicyDate(new Date('2026-11-14T02:00:00Z')), 'November 14, 2026');
    assert.match(formatPolicyDate(), /^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
});

test('a wording change restamps the date, an identical save keeps it', () => {
    const current = { title: 'Privacy Policy', content: 'Body', lastUpdated: 'January 2, 2026' };

    const edited = mergePolicyUpdate(current, { title: 'Privacy Policy', content: 'New body' }, 'November 14, 2026');
    assert.equal(edited.lastUpdated, 'November 14, 2026');
    assert.equal(edited.content, 'New body');

    const unchanged = mergePolicyUpdate(current, { title: 'Privacy Policy', content: 'Body' }, 'November 14, 2026');
    assert.equal(unchanged.lastUpdated, 'January 2, 2026',
        'saving without a change must not imply the policy was revised');
});
