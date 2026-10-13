const test = require('node:test');
const assert = require('node:assert/strict');

const { POST_REPORT_REASONS, validatePostReport } = require('../utils/post-report-rules');

test('accepts all seven standard reasons with no detail', () => {
    for (const reason of POST_REPORT_REASONS.filter((r) => r !== 'other')) {
        const result = validatePostReport({ reason, detail: '' });
        assert.equal(result.ok, true, `${reason} should be accepted`);
        assert.equal(result.reason, reason);
        assert.equal(result.detail, null);
    }
});

test('exposes exactly the seven agreed reasons', () => {
    assert.deepEqual(POST_REPORT_REASONS, [
        'spam', 'harassment', 'hate_speech', 'inappropriate',
        'misinformation', 'personal_info', 'other'
    ]);
});

test('rejects an unknown reason', () => {
    const result = validatePostReport({ reason: 'because_i_can', detail: '' });
    assert.equal(result.ok, false);
    assert.equal(result.reason, null);
    assert.match(result.error, /reason/i);
});

test('rejects a missing reason', () => {
    assert.equal(validatePostReport({ detail: 'anything' }).ok, false);
});

test('other requires a detail', () => {
    assert.equal(validatePostReport({ reason: 'other', detail: '   ' }).ok, false);
    assert.equal(validatePostReport({ reason: 'other', detail: null }).ok, false);
});

test('other with a detail is accepted and trimmed', () => {
    const result = validatePostReport({ reason: 'other', detail: '  it is spam  ' });
    assert.equal(result.ok, true);
    assert.equal(result.detail, 'it is spam');
});

test('keeps an optional detail supplied with a non-other reason', () => {
    // Staff need to read why a post was reported whichever reason was picked, so a detail
    // is accepted on every reason. Only `other` makes it mandatory.
    const result = validatePostReport({ reason: 'spam', detail: 'a long explanation' });
    assert.equal(result.ok, true);
    assert.equal(result.reason, 'spam');
    assert.equal(result.detail, 'a long explanation');
});

test('a detail stays optional on every reason except other', () => {
    for (const reason of POST_REPORT_REASONS.filter((r) => r !== 'other')) {
        assert.equal(validatePostReport({ reason, detail: '' }).ok, true, reason);
        assert.equal(validatePostReport({ reason }).ok, true, reason);
    }
});

test('caps the detail at 500 characters', () => {
    const result = validatePostReport({ reason: 'other', detail: 'x'.repeat(900) });
    assert.equal(result.ok, true);
    assert.equal(result.detail.length, 500);
});

test('collapses whitespace and newlines in the detail', () => {
    const result = validatePostReport({ reason: 'other', detail: 'line one\n\n   line two' });
    assert.equal(result.detail, 'line one line two');
});

// The SQL below cannot be exercised without a database, and this project's tests are
// pure-function only. These assert the statement's shape instead, pinning the two clauses
// whose absence would silently corrupt the moderation queue.

const readModelSource = () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    return readFileSync(join(__dirname, '..', 'models', 'community-model.js'), 'utf8');
};

test('a repeated report reopens the report and clears any previous reviewer', () => {
    const source = readModelSource();
    const sql = source.slice(source.indexOf('static async reportPost'));
    assert.match(sql, /ON DUPLICATE KEY UPDATE/i);
    assert.match(sql, /status\s*=\s*'pending'/);
    assert.match(sql, /reviewed_by\s*=\s*NULL/);
    assert.match(sql, /reviewed_at\s*=\s*NULL/);
});

test('closing reports resolves every pending report on the post, not just one', () => {
    const source = readModelSource();
    const sql = source.slice(source.indexOf('static async closePostReports'));
    assert.match(sql, /WHERE post_id\s*=\s*\?\s*AND status\s*=\s*'pending'/);
});

test('the public feed computes post ownership server-side', () => {
    // Ids reach the browser as pid_ ciphertexts encrypted with a random IV per call, so
    // post.userId and currentUser.id are never string-equal even for the same account.
    // Ownership therefore has to be computed in SQL, like liked_by_viewer already is.
    const source = readModelSource();
    const sql = source.slice(source.indexOf('static async getPublicPosts'));
    assert.match(sql, /\(p\.user_id\s*=\s*\?\)\s*AS is_owner/);
});

test('normalizePost exposes an isOwner flag', () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    const source = readFileSync(join(__dirname, '..', 'controllers', 'community-controller.js'), 'utf8');
    const normalizer = source.slice(source.indexOf('const normalizePost'));
    assert.match(normalizer.slice(0, source.indexOf('const normalizeComment')), /isOwner:\s*Boolean\(post\.is_owner\)/);
});

test('the comment feed computes comment ownership server-side', () => {
    // Same reason as posts: without this, isOwner is always false, so an author never sees
    // the Edit/Delete controls on their own comment.
    const source = readModelSource();
    const sql = source.slice(source.indexOf('static async getCommentsByPost'));
    assert.match(sql, /\(c\.user_id\s*=\s*\?\)\s*AS is_owner/);
});

// Deleting a post must reclaim EVERY image it owns from Cloudinary, not just the cover:
// the community_post_images rows cascade away with the post, so an asset left on the remote
// has no remaining trace anywhere and silently consumes the storage quota forever.
test('deleting a post reclaims every image it owns from Cloudinary', () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    const source = readFileSync(join(__dirname, '..', 'controllers', 'community-controller.js'), 'utf8');
    const handler = source.slice(
        source.indexOf('exports.deletePost'),
        source.indexOf('exports.getAllPostsForModeration')
    );
    assert.match(handler, /getPostImagePublicIds/, 'must gather all of the post\'s images');
    assert.match(handler, /deleteFromCloudinary/);
    assert.ok(
        handler.indexOf('deleteFromCloudinary') > handler.indexOf('getPostImagePublicIds'),
        'cleanup must iterate the gathered ids rather than only the cover column'
    );
});

test('a Cloudinary cleanup failure does not block the post delete', () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    const source = readFileSync(join(__dirname, '..', 'controllers', 'community-controller.js'), 'utf8');
    const handler = source.slice(
        source.indexOf('exports.deletePost'),
        source.indexOf('exports.getAllPostsForModeration')
    );
    assert.match(handler, /catch\s*\(cloudError\)/);
});

test('normalizeComment exposes an isOwner flag', () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    const source = readFileSync(join(__dirname, '..', 'controllers', 'community-controller.js'), 'utf8');
    const normalizer = source.slice(source.indexOf('const normalizeComment'));
    assert.match(normalizer.slice(0, source.indexOf('const normalizeReportedComment')), /isOwner:\s*Boolean\(comment\.is_owner\)/);
});

// Guests can read the community, so the router no longer runs `protect` globally.
// `authorize` reads req.user.role directly and throws on an undefined req.user, so any
// route that is not one of the three public reads MUST still carry protect itself.

const readCommunityRoutes = () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    return readFileSync(join(__dirname, '..', 'routes', 'community-routes.js'), 'utf8');
};

const PUBLIC_READS = [
    "router.get('/posts'",
    "router.get('/posts/:postId/comments'",
    "router.get('/users/:userId/profile'"
];

const ROUTE_LINE = /^router\.(get|post|put|patch|delete)\(/;

const communityRouteLines = () => readCommunityRoutes()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => ROUTE_LINE.test(line));

test('the community router resolves the viewer optionally rather than requiring auth', () => {
    const source = readCommunityRoutes();
    assert.match(source, /router\.use\(optionalAuth\)/);
    assert.doesNotMatch(source, /router\.use\(protect\)/);
});

test('exactly three read routes stay open to guests', () => {
    const lines = communityRouteLines();
    const isPublic = (line) => PUBLIC_READS.some((prefix) => line.includes(prefix));
    assert.equal(lines.filter(isPublic).length, PUBLIC_READS.length);
});

test('every write and staff-only route still requires protect', () => {
    const lines = communityRouteLines();
    const isPublic = (line) => PUBLIC_READS.some((prefix) => line.includes(prefix));
    for (const line of lines) {
        if (isPublic(line)) continue;
        assert.match(line, /protect/, `route must keep protect: ${line}`);
    }
});
