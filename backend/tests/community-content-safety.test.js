const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Community content (posts, comments, reports, notes) is stored as plain text
 * and returned to clients verbatim. That is only safe while no consumer treats
 * it as markup.
 *
 * These are wiring assertions, in the same spirit as
 * tests/reservation-self-service.test.js, which also guards an invariant by
 * reading source rather than by exercising behaviour. They fail loudly if
 * someone introduces an HTML sink, which is the one change that would turn the
 * latent risk into a stored-XSS vulnerability.
 *
 * This test lives in the backend suite because that is where the test runner
 * exists; the frontend has no test infrastructure at all.
 */

const FRONTEND_SRC = path.join(__dirname, '../../frontend/src');

/** Recursively collect source files under the frontend source tree. */
const collectSourceFiles = (dir, acc = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectSourceFiles(full, acc);
        } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
            acc.push(full);
        }
    }
    return acc;
};

const files = collectSourceFiles(FRONTEND_SRC);

/**
 * Strip comments so assertions target code rather than documentation. The
 * normalizePlainText doc comment deliberately mentions the old helper name.
 */
const stripComments = (source) => source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('frontend source tree was found', () => {
    assert.ok(files.length > 0, 'expected to find frontend source files to scan');
});

test('no dangerouslySetInnerHTML anywhere in the frontend', () => {
    const offenders = files.filter(f => fs.readFileSync(f, 'utf8').includes('dangerouslySetInnerHTML'));
    assert.deepStrictEqual(
        offenders.map(f => path.relative(FRONTEND_SRC, f)),
        [],
        'dangerouslySetInnerHTML renders unescaped HTML. If community content must be rendered as '
        + 'markup, sanitise it on write and update this test deliberately.'
    );
});

test('no direct DOM HTML sinks in the frontend', () => {
    const patterns = [
        /\.innerHTML\b/,
        /\.outerHTML\b/,
        /insertAdjacentHTML/,
        /document\.write\s*\(/,
        /createContextualFragment/
    ];
    const offenders = [];
    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        if (patterns.some(p => p.test(source))) {
            offenders.push(path.relative(FRONTEND_SRC, file));
        }
    }
    assert.deepStrictEqual(offenders, [], 'direct DOM HTML sinks bypass React escaping');
});

test('community content is rendered through JSX expressions, not markup', () => {
    const postFeed = path.join(FRONTEND_SRC, 'components/features/community/PostFeed.jsx');
    assert.ok(fs.existsSync(postFeed), 'PostFeed.jsx not found');
    const source = fs.readFileSync(postFeed, 'utf8');
    // The body is rendered as a text child, which React escapes.
    assert.ok(
        /\{post\.content\}/.test(source),
        'expected post content to be rendered as a JSX expression child {post.content}'
    );
});

test('the community helper does not claim to be HTML sanitisation', () => {
    const controller = path.join(__dirname, '../controllers/community-controller.js');
    const source = stripComments(fs.readFileSync(controller, 'utf8'));

    assert.ok(
        !/sanitizeText/.test(source),
        'sanitizeText implies HTML sanitisation but only trims and truncates; use normalizePlainText'
    );
    assert.ok(
        /normalizePlainText/.test(source),
        'normalizePlainText is expected to remain the plain-text normaliser'
    );
});

test('backend never advertises community content as html', () => {
    // Guard the other direction: no community response should claim to be HTML.
    const controller = stripComments(fs.readFileSync(
        path.join(__dirname, '../controllers/community-controller.js'),
        'utf8'
    ));
    assert.ok(
        !/Content-Type\s*['"`]?:?\s*['"`]text\/html/i.test(controller),
        'community endpoints must not serve HTML content types'
    );
});