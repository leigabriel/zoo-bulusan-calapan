const test = require('node:test');
const assert = require('node:assert/strict');
const { buildWelcomeEmailHtml, buildWelcomeEmailText } = require('../utils/email');

const account = {
    firstName: 'Maria',
    username: 'maria.santos',
    profileUrl: 'https://bulusanzoo.vercel.app/profile',
    hasPassword: false
};

test('names the account and links to the profile', () => {
    const html = buildWelcomeEmailHtml(account);
    assert.match(html, /Maria/);
    assert.match(html, /maria\.santos/);
    assert.match(html, /https:\/\/bulusanzoo\.vercel\.app\/profile/);

    const text = buildWelcomeEmailText(account);
    assert.match(text, /maria\.santos/);
    assert.match(text, /https:\/\/bulusanzoo\.vercel\.app\/profile/);
});

test('mentions setting a password only when there is none', () => {
    assert.match(buildWelcomeEmailText(account), /set a password/i);
    assert.doesNotMatch(buildWelcomeEmailText({ ...account, hasPassword: true }), /set a password/i);
});

test('escapes interpolated values', () => {
    const html = buildWelcomeEmailHtml({ ...account, firstName: '<script>alert(1)</script>' });
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
});