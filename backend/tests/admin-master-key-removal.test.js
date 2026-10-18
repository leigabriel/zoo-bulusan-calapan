const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

const read = (...segments) => fs.readFileSync(path.join(__dirname, '..', ...segments), 'utf8');

/**
 * Deleting the Master Key strips the second factor from admin login. The
 * confirmation is the account password only - deliberately weaker than disabling
 * the key, which also demands the key itself - so what is pinned here is that a
 * password is still required, that the call is audited, and that the row is
 * deleted rather than merely disabled.
 */
test('deletion requires the account password', () => {
    const source = read('controllers', 'admin-master-key-controller.js');
    const at = source.indexOf('exports.remove');
    assert.notEqual(at, -1, 'a delete handler must exist');
    const body = source.slice(at, source.indexOf('exports.', at + 10));

    assert.match(body, /await verifyPassword\(req\.user\.id, currentPassword\)/,
        'the account password must be verified');
    assert.match(body, /status\.configured/, 'must refuse when no key exists');

    // The password check has to gate the delete, not merely be present.
    const verifyIndex = body.indexOf('await verifyPassword');
    const removeIndex = body.indexOf('AdminMasterKey.remove');
    assert.ok(verifyIndex !== -1 && removeIndex > verifyIndex,
        'the password must be verified before the row is deleted');
});

test('deletion is exposed as an audited DELETE route', () => {
    const routes = read('routes', 'admin-routes.js');
    assert.match(routes, /router\.delete\('\/master-key', trackActivity\('master_key_delete'/,
        'deletion must be a DELETE route recorded in the activity log');
});

test('deletion deletes the stored hash rather than disabling it', () => {
    const model = read('models', 'admin-master-key-model.js');
    const at = model.indexOf('static async remove');
    assert.notEqual(at, -1, 'the model must expose remove()');
    const body = model.slice(at + 'static async remove'.length, model.indexOf('static async', at + 20));
    assert.match(body, /DELETE FROM admin_master_keys WHERE admin_id = \?/);
});