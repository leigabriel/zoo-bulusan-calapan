const test = require('node:test');
const assert = require('node:assert');

const {
    ApiError,
    isAuthoredError,
    resolveStatus,
    clientMessage,
    GENERIC_MESSAGES
} = require('../middleware/error-handler');

test('resolveStatus honours an explicit valid status', () => {
    assert.strictEqual(resolveStatus({ status: 400 }), 400);
    assert.strictEqual(resolveStatus({ statusCode: 409 }), 409);
    assert.strictEqual(resolveStatus({ status: 503 }), 503);
});

test('resolveStatus ignores statuses that are not real HTTP errors', () => {
    // A driver error can carry an unrelated numeric field.
    for (const bogus of [200, 301, 399, 600, 999, -1, 0, '400', null, undefined, NaN]) {
        assert.strictEqual(resolveStatus({ status: bogus }), 500, `expected 500 for ${String(bogus)}`);
    }
    assert.strictEqual(resolveStatus({}), 500);
    assert.strictEqual(resolveStatus(null), 500);
});

test('isAuthoredError accepts ApiError and the named WalkInError', () => {
    assert.strictEqual(isAuthoredError(ApiError.badRequest('Please supply a date')), true);

    const walkIn = Object.assign(new Error('A valid visit date is required.'), {
        name: 'WalkInError',
        status: 400
    });
    assert.strictEqual(isAuthoredError(walkIn), true);
});

// The regression this rule exists for: matching on shape (4xx + a message)
// meant an upstream error carrying a 4xx status still leaked its message.
test('a 4xx status alone does not make an error safe to show', () => {
    const upstream = { status: 400, name: 'Error', message: "ER_BAD_FIELD_ERROR: Unknown column 'zzz'" };
    assert.strictEqual(isAuthoredError(upstream), false);

    const sdkStyle = { status: 400, name: 'PayMongoError', message: 'secret upstream detail' };
    assert.strictEqual(isAuthoredError(sdkStyle), false);
});

test('isAuthoredError rejects driver errors and untrusted messages', () => {
    assert.strictEqual(isAuthoredError(new Error('ER_DUP_ENTRY: Duplicate entry for key users.uk_email')), false);
    assert.strictEqual(isAuthoredError({ status: 500, message: 'ER_NO_REFERENCED_ROW_2: foreign key fails' }), false);
    assert.strictEqual(isAuthoredError({ status: 400, message: 'x'.repeat(5000) }), false);
    assert.strictEqual(isAuthoredError({ status: 400, message: '' }), false);
    assert.strictEqual(isAuthoredError(null), false);
});

// The regression: err.message used to be forwarded on every status.
test('5xx responses never contain the underlying error message', () => {
    const driver = new Error("ER_NO_REFERENCED_ROW_2: Cannot add or update a child row: a foreign key constraint fails on `users`.`uk_email`");

    for (const status of [500, 502, 503]) {
        const message = clientMessage({ ...driver, status }, status);
        assert.ok(!message.includes('ER_'), 'mysql error code leaked');
        assert.ok(!message.includes('users'), 'table name leaked');
        assert.ok(!message.includes('foreign key'), 'constraint detail leaked');
    }
});

test('4xx authored errors keep their message', () => {
    assert.strictEqual(
        clientMessage(ApiError.badRequest('Please provide a visit date'), 400),
        'Please provide a visit date'
    );
    assert.strictEqual(
        clientMessage({ name: 'WalkInError', status: 400, message: 'A valid visit date is required.' }, 400),
        'A valid visit date is required.'
    );
});

test('4xx unauthored errors fall back to a generic message', () => {
    // A 400 with a driver-flavoured message must not pass it through.
    const message = clientMessage({ status: 400, message: "ER_BAD_FIELD_ERROR: Unknown column 'zzz' in 'field list'" }, 400);
    assert.strictEqual(message, GENERIC_MESSAGES[400]);
    assert.ok(!message.includes('ER_'));
});

test('every generic 4xx message is non-empty and leak-free', () => {
    for (const [status, message] of Object.entries(GENERIC_MESSAGES)) {
        assert.ok(message.length > 0, `empty message for ${status}`);
        assert.ok(!/ER_|_key|table|column/i.test(message), `generic message for ${status} looks leaky: ${message}`);
    }
});

test('ApiError helpers build the expected statuses', () => {
    assert.strictEqual(ApiError.badRequest('x').status, 400);
    assert.strictEqual(ApiError.unauthorized('x').status, 401);
    assert.strictEqual(ApiError.forbidden('x').status, 403);
    assert.strictEqual(ApiError.notFound('x').status, 404);
});

test('ApiError keeps the cause out of the message', () => {
    const cause = new Error('connect ECONNREFUSED 127.0.0.1:3306');
    const err = ApiError.notFound('Animal not found', { cause, code: 'ANIMAL_MISSING' });
    assert.strictEqual(err.message, 'Animal not found');
    assert.strictEqual(err.cause, cause);
    assert.strictEqual(err.code, 'ANIMAL_MISSING');
    assert.ok(!err.message.includes('ECONNREFUSED'));
});


