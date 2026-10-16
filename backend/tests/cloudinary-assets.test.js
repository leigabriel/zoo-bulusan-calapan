const test = require('node:test');
const assert = require('node:assert');

const { parseAssetId, canDeleteAsset } = require('../utils/cloudinary-ownership');
const { validateBase64Image, allowedTypesForRole, MAX_IMAGE_BYTES } = require('../utils/cloudinary-upload-rules');

// Real shapes produced by generatePublicId(): <prefix>_<userId>_<ms>_<16 hex>
const HASH = 'abcdef0123456789';
const TS = '1700000000000';
const profile5 = `zoo-bulusan/profile-images/profile_5_${TS}_${HASH}`;
const profile9 = `zoo-bulusan/profile-images/profile_9_${TS}_${HASH}`;
const resident5 = `zoo-bulisan/resident-id-images/resident_id_5_${TS}_${HASH}`;
const animal5 = `zoo-bulusan/animals/animal_5_${TS}_${HASH}`;

test('parseAssetId recovers prefix and owner', () => {
    const a = parseAssetId(profile5);
    assert.strictEqual(a.prefix, 'profile');
    assert.strictEqual(a.ownerId, 5);
    assert.strictEqual(a.folder, 'zoo-bulusan/profile-images');
});

test('parseAssetId handles prefixes containing underscores', () => {
    const a = parseAssetId(resident5);
    assert.strictEqual(a.prefix, 'resident_id');
    assert.strictEqual(a.ownerId, 5);
});

test('parseAssetId rejects structurally malformed ids', () => {
    for (const bad of ['', '   ', null, undefined, 42, {}, 'not-an-id',
                       'profile_5_' + TS,
                       'profile_5_' + TS + '_short',
                       'profile_5_99_' + HASH]) {
        assert.strictEqual(parseAssetId(bad), null, `expected null for ${String(bad)}`);
    }
});

test('a non-numeric owner parses as unowned rather than being accepted', () => {
    // generatePublicId falls back to 'unknown'/'system' when there is no user.
    const a = parseAssetId('profile_x_' + TS + '_' + HASH);
    assert.notStrictEqual(a, null);
    assert.strictEqual(a.ownerId, null);
    // ...and it must not become deletable.
    assert.strictEqual(canDeleteAsset('profile_x_' + TS + '_' + HASH, { id: 9, role: 'staff' }).ok, false);
});

test('uploads made without a user are unowned', () => {
    const a = parseAssetId(`general_unknown_${TS}_${HASH}`);
    assert.strictEqual(a.ownerId, null);
});

// --- the regression: any staff could delete any tenant's asset ---
test('staff cannot delete another user profile picture', () => {
    const r = canDeleteAsset(profile5, { id: 9, role: 'staff' });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'You can only delete your own images.');
});

test('staff cannot delete another user resident ID document', () => {
    const r = canDeleteAsset(resident5, { id: 9, role: 'staff' });
    assert.strictEqual(r.ok, false);
});

test('staff can delete their own personal assets', () => {
    assert.strictEqual(canDeleteAsset(profile9, { id: 9, role: 'staff' }).ok, true);
    assert.strictEqual(canDeleteAsset(resident5.replace('_5_', '_9_'), { id: 9, role: 'staff' }).ok, true);
});

test('staff can delete shared collection assets', () => {
    for (const id of [animal5, `zoo-bulusan/plants/plant_3_${TS}_${HASH}`,
                      `zoo-bulusan/events/event_3_${TS}_${HASH}`,
                      `zoo-bulusan/community-posts/community_3_${TS}_${HASH}`,
                      `zoo-bultan/uploads/general_3_${TS}_${HASH}`]) {
        assert.strictEqual(canDeleteAsset(id, { id: 9, role: 'staff' }).ok, true, id);
    }
});

test('admins may delete anything', () => {
    assert.strictEqual(canDeleteAsset(profile5, { id: 1, role: 'admin' }).ok, true);
    assert.strictEqual(canDeleteAsset(resident5, { id: 1, role: 'admin' }).ok, true);
    // Even an id that cannot be parsed, which fails closed for everyone else.
    assert.strictEqual(canDeleteAsset('garbage', { id: 1, role: 'admin' }).ok, true);
});

test('unparseable ids fail closed for non-admins', () => {
    assert.strictEqual(canDeleteAsset('garbage', { id: 9, role: 'staff' }).ok, false);
    assert.strictEqual(canDeleteAsset('garbage', { id: 9, role: 'user' }).ok, false);
});

test('unauthenticated callers are refused', () => {
    assert.strictEqual(canDeleteAsset(profile5, undefined).ok, false);
    assert.strictEqual(canDeleteAsset(profile5, {}).ok, false);
});

test('role is compared by identity, not shape', () => {
    // A forged role string must not grant admin rights.
    assert.strictEqual(canDeleteAsset(profile5, { id: 9, role: 'Admin' }).ok, false);
    assert.strictEqual(canDeleteAsset(profile5, { id: 9, role: 'admin ' }).ok, false);
});

test('validateBase64Image accepts a real image data URL', () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const r = validateBase64Image(png);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.mimeType, 'image/png');
    assert.ok(r.approxBytes > 0);
});

// The regression: any signed-in user could POST arbitrary strings here.
test('validateBase64Image rejects non-image and malformed payloads', () => {
    for (const bad of [
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        'iVBORw0KGgoAAAANSUhEUg==',
        '<script>alert(1)</script>',
        'https://evil.com/x.png',
        'data:image/png,notbase64',
        '',
        null,
        undefined,
        42,
        {}
    ]) {
        assert.strictEqual(validateBase64Image(bad).ok, false, `expected reject for ${String(bad)}`);
    }
});

test('validateBase64Image enforces the size ceiling', () => {
    const huge = 'data:image/png;base64,' + 'A'.repeat(Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 100);
    assert.strictEqual(validateBase64Image(huge).ok, false);
});

test('a visitor may only upload to the general folder', () => {
    assert.deepStrictEqual(allowedTypesForRole('user'), ['general']);
    assert.ok(!allowedTypesForRole('user').includes('residentId'));
    assert.ok(!allowedTypesForRole(undefined).includes('animal'));
});

test('staff may upload to the managed folders', () => {
    for (const t of ['general', 'animal', 'plant', 'event', 'community']) {
        assert.ok(allowedTypesForRole('staff').includes(t), `staff should be able to upload ${t}`);
    }
});

