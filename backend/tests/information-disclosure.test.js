const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { after } = require('node:test');

const BACKEND = path.join(__dirname, '..');

// Requiring controllers opens mysql2 pools; close them or the file hangs.
after(async () => {
    try {
        await require(path.join(BACKEND, 'config', 'database')).end();
    } catch {
        // never opened
    }
    setTimeout(() => process.exit(0), 500).unref();
});

const read = (rel) => fs.readFileSync(path.join(BACKEND, rel), 'utf8');

// ---------------------------------------------------------------- B-H12

test('the detailed health report requires staff credentials', () => {
    const server = read('server.js');
    assert.match(server, /app\.get\('\/api\/health', healthLimiter, optionalAuth/,
        'the health route must run optionalAuth so req.user can be populated');

    assert.match(server, /const isPrivileged = req\.user && \['admin', 'staff'\]\.includes\(req\.user\.role\)/,
        'the full report must be gated on an admin/staff role');

    const guardIndex = server.indexOf('if (!isPrivileged)');
    const emailIndex = server.indexOf('health.email =');
    const dbIndex = server.indexOf("await db.query('SELECT 1')");

    assert.ok(guardIndex > -1, 'no authorisation guard found');
    assert.ok(guardIndex < emailIndex, 'the guard must come before email-delivery stats');
    assert.ok(guardIndex < dbIndex, 'the guard must come before the database probe');
});

test('the database probe was not dropped while adding the guard', () => {
    const server = read('server.js');
    assert.match(server, /await db\.query\('SELECT 1'\)/, 'the database check must still run for staff');
    assert.match(server, /health\.database = 'connected'/);
    assert.match(server, /health\.database = 'disconnected'/);
});

test('the public health probe is still reachable without credentials', () => {
    // Uptime checks and the frontend warm-up depend on the plain probe.
    assert.doesNotMatch(read('server.js'), /app\.get\('\/api\/health', protect/);
});

test('the AI status endpoint requires staff credentials', () => {
    assert.match(read('routes/ai-routes.js'),
        /router\.get\('\/status', protect, authorize\('admin', 'staff'\)/);
});

test('the frontend warm-up uses the public probe', () => {
    const client = fs.readFileSync(
        path.join(__dirname, '..', '..', 'frontend', 'src', 'services', 'api-client.js'),
        'utf8'
    );
    assert.doesNotMatch(client, /\/health\?full=true/,
        'the warm-up must not request the now-restricted detailed report');
    assert.match(client, /\$\{API_BASE_URL\}\/health/);
});

// ---------------------------------------------------------------- B-H13

test('registration does not reveal which field collided', () => {
    const auth = read('controllers/auth-controller.js');

    // The public register handler must use one shared response for both cases.
    const registerStart = auth.indexOf('exports.register');
    const registerEnd = auth.indexOf('exports.login', registerStart);
    assert.ok(registerStart > -1 && registerEnd > registerStart, 'could not locate the register handler');

    const register = auth.slice(registerStart, registerEnd);
    assert.doesNotMatch(register, /Email already registered/,
        '"Email already registered" is an enumeration oracle');
    assert.doesNotMatch(register, /Username already taken/,
        '"Username already taken" is an enumeration oracle');

    const uses = (register.match(/ALREADY_IN_USE_RESPONSE\.body/g) || []).length;
    assert.strictEqual(uses, 2, 'both collision branches must return the same response');
});

// The authenticated change-email path is not an enumeration vector and must
// keep its specific message, otherwise the user cannot tell why it failed.
test('the authenticated change-email path keeps its specific message', () => {
    const auth = read('controllers/auth-controller.js');
    const updateStart = auth.indexOf('exports.updateEmail');
    const updateEnd = auth.indexOf('exports.', updateStart + 10);
    const update = auth.slice(updateStart, updateEnd === -1 ? undefined : updateEnd);

    assert.match(update, /Email already registered/,
        'updateEmail is behind protect + a password check; the specific message is required UX');
    assert.doesNotMatch(update, /ALREADY_IN_USE_RESPONSE/);
});

test('password reset already used a generic response, and still does', () => {
    const auth = read('controllers/auth-controller.js');
    const start = auth.indexOf('exports.requestPasswordReset');
    const body = auth.slice(start, auth.indexOf('exports.resetPassword'));
    assert.match(body, /If an account exists for that email/);
});
