# Google Onboarding & Visitor Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give brand-new Google visitors a one-time onboarding stepper (choose a username, optionally set a password), send a one-time welcome email on both signup paths, route every visitor-facing notification through a typed catalog, and fix the settings page that reports false save failures.

**Architecture:** Two new pure modules carry the decision logic — `utils/username-rules.js` (validation) and `services/notification-service.js` (the type catalog) — so both are unit-testable without a database, which matches this repo's existing test style (`backend/tests/walk-in-service.test.js` tests pure functions only; there is no DB mock or supertest setup anywhere). Controllers call the service instead of hand-building `title`/`message`/`category`. Every idempotent save is verified by **read-back** rather than by MySQL's `affectedRows`, because `affectedRows === 0` means "already that value", not "failed".

**Tech Stack:** Node.js CommonJS, Express 4, `mysql2` promise pool, `node:test` + `node:assert/strict`, `nodemailer`. Frontend: React 19, Vite 7, Tailwind 4, `ReactDOM.createPortal`.

**Spec:** `docs/superpowers/specs/2026-10-11-google-onboarding-and-notifications-design.md` — read it alongside this plan; the spec carries the reasoning, this plan carries the decisions.

## Global Constraints

- **No new dependencies.** No `express-rate-limit`, no schema-validation library, no frontend test runner. Everything reuses what is already in `package.json`.
- **Test style is pure-function only.** Every new test must run under `npm test` from `backend/` with no database, no network, and no SMTP. If a behaviour needs I/O, extract the decision into a pure helper and test that.
- **CommonJS** (`require`/`module.exports`) for all backend files. ESM (`import`/`export`) for all frontend files.
- **Never trust `affectedRows`.** Any idempotent write in this plan must be confirmed by reading the value back (`utils/persist-check.js`). This is not optional — it is the exact defect being fixed.
- **New env vars: none.** Both new columns are created by the runtime-DDL ensure scripts.
- **Notification delivery must never block or fail the originating request.** A notification failure is logged; the reservation/event write still succeeds.
- **UI strings are hardcoded English**, matching the entire existing codebase. There is no i18n layer.
- Backend must ship **before or with** the frontend. A new backend sending `isNewGoogleAccount` to an old frontend is harmless (the field is ignored); an old backend means the stepper never renders.

## Review Focus

Five failure modes the spec implies that are most likely to bite a real person. Each has a test pinned to the task that owns the code.

1. **A visitor types a username that was already theirs.** The save is a no-op, `affectedRows === 0`, and the naive implementation returns an error for a save that worked. → Task 3 test: `checkPersisted` returns `true` when the read-back matches an unchanged value.
2. **A visitor toggles a notification setting to the value it already holds** (e.g. re-enabling after a page reload left it on). Same `affectedRows` trap; today this shows *"Couldn't update settings"* for a save that succeeded. → Task 3 test.
3. **SMTP is unconfigured or down.** The visitor must still see the in-app notification in the bell, and the reservation write must still succeed. Email failure is logged, not thrown. → Task 7 test.
4. **The visitor closes the tab during the onboarding stepper.** The flag was never set, so they must see the stepper again next sign-in — and must not get a welcome email twice. → Task 10 and Task 11 tests on the gate being a one-way `FALSE → TRUE` write.
5. **The visitor turns off "Event Reminders" and then misses new event announcements entirely.** Today `type: 'event'` resolves to the `eventReminders` preference, so the two are conflated. → Task 6 test: `event.announced` and any future reminder type resolve to distinct categories.

---

## Phase A — Shared foundations

### Task 1: Add the two new `users` columns

**Files:**
- Modify: `backend/database/ensure-auth-schema.js`
- Modify: `backend/database/bulusanzoodatabasedevelopment.sql` (in the `CREATE TABLE users` block, after `notification_settings JSON DEFAULT NULL,`)

**Interfaces:**
- Consumes: nothing.
- Produces: two columns that every later task reads — `users.google_onboarding_complete BOOLEAN DEFAULT FALSE` and `users.is_welcome_sent BOOLEAN NOT NULL DEFAULT FALSE`.

- [ ] **Step 1: Extend the ensure script**

`ensure-auth-schema.js` already probes `INFORMATION_SCHEMA` for its two existing columns and `ALTER`s when absent. Extend the `IN ('...')` list at line 7 and add two guarded `ALTER` blocks matching the existing `if (!existing.has(...))` shape:

```sql
ALTER TABLE users ADD COLUMN google_onboarding_complete BOOLEAN DEFAULT FALSE
ALTER TABLE users ADD COLUMN is_welcome_sent BOOLEAN NOT NULL DEFAULT FALSE
```

Keep the `existing` `Set` pattern — do not add a second query.

- [ ] **Step 2: Mirror both columns in the schema SQL file**

Add both definitions to `CREATE TABLE users`, so a fresh install matches a migrated one. Place them directly after the `notification_settings` line.

- [ ] **Step 3: Verify the script is idempotent by reading it twice**

Run: `node -e "require('./database/ensure-auth-schema')"` from `backend/` — it exports a function and must not throw on load.

Expected: exits 0, no output. This only proves the module parses; the `ALTER` itself runs at boot (Task 2 verification covers that).

- [ ] **Step 4: Commit**

```bash
git add backend/database/ensure-auth-schema.js backend/database/bulusanzoodatabasedevelopment.sql
git commit -m "feat(db): add google_onboarding_complete and is_welcome_sent columns"
```

---

### Task 2: Read-back verification helper

Every idempotent save in this plan needs the same non-obvious check: *did the value actually persist, regardless of what the driver reported?* Extract it once.

**Files:**
- Create: `backend/utils/persist-check.js`
- Create: `backend/tests/persist-check.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `checkPersisted(readBack, attempted) -> boolean`. `readBack` is the value re-read from the database (an object, or `null`); `attempted` is an object of key/value pairs that were meant to be written. Returns `true` only when `readBack` is a non-null object and **every** key in `attempted` is strictly equal in `readBack`.

- [ ] **Step 1: Write the failing test**

`backend/tests/persist-check.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkPersisted } = require('../utils/persist-check');

test('treats an unchanged value as persisted', () => {
    assert.equal(checkPersisted({ emailNotifications: true }, { emailNotifications: true }), true);
});

test('reports a mismatch when a value did not land', () => {
    assert.equal(checkPersisted({ emailNotifications: true }, { emailNotifications: false }), false);
});

test('requires every attempted key to match', () => {
    assert.equal(
        checkPersisted({ emailNotifications: true, pushNotifications: true }, { emailNotifications: true, pushNotifications: false }),
        false
    );
});

test('treats a null or missing read-back as not persisted', () => {
    assert.equal(checkPersisted(null, { emailNotifications: true }), false);
    assert.equal(checkPersisted(undefined, { emailNotifications: true }), false);
    assert.equal(checkPersisted({}, { emailNotifications: true }), false);
});
```

The first test is Review Focus items #1 and #2 — the case the old `affectedRows > 0` check got wrong.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` from `backend/`

Expected: FAIL with `Cannot find module '../utils/persist-check'`.

- [ ] **Step 3: Implement `checkPersisted`**

```js
const checkPersisted = (readBack, attempted) => {
    if (!readBack || typeof readBack !== 'object') return false;
    return Object.entries(attempted).every(([key, value]) => readBack[key] === value);
};

module.exports = { checkPersisted };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test` from `backend/`

Expected: PASS, and the four pre-existing test files still pass.

- [ ] **Step 5: Commit**

```bash
git add backend/utils/persist-check.js backend/tests/persist-check.test.js
git commit -m "feat(utils): add checkPersisted read-back helper"
```

---

### Task 3: Username validation rules

**Files:**
- Create: `backend/utils/username-rules.js`
- Create: `backend/tests/username-rules.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `RESERVED_USERNAMES` — `Set<string>` containing exactly `admin`, `staff`, `jiji`, `bulusanzoo`, `system`.
  - `validateUsername(input) -> { ok: boolean, value: string, error: string | null }`. Never throws.
- Consumed later by `auth-controller.js` (Task 10) and mirrored in the frontend stepper (Task 12).

The rules, in order: must be a string → sanitized with the existing `sanitizeInput` from `auth-controller.js:37` (trim, strip `<>`) → 3–50 characters → matches `/^[a-zA-Z0-9._-]+$/` → not reserved. Error messages are user-facing sentences, since they render directly in the stepper.

- [ ] **Step 1: Write the failing test**

`backend/tests/username-rules.test.js`:

```js
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
```

`validateUsername('JIJI')` must fail — the reserved check is case-insensitive, and the value is lowercased on the way out.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` from `backend/`

Expected: FAIL with `Cannot find module '../utils/username-rules'`.

- [ ] **Step 3: Implement `validateUsername`**

Lowercase the sanitized value first (usernames are displayed as `@name` and the auto-generator already lowercases, per `google-auth-controller.js:358`), then apply the five checks in order, returning on the first failure. `sanitizeInput` is a one-line local implementation — trim plus strip `<>` — matching `auth-controller.js:37-40` rather than importing from the controller, since controllers import this module and a circular require would follow.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test` from `backend/`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/utils/username-rules.js backend/tests/username-rules.test.js
git commit -m "feat(utils): add username validation rules"
```

---

### Task 4: Welcome email template

**Files:**
- Modify: `backend/utils/email.js` (add alongside the existing `generateVerificationEmailHtml` / `...Text` pair at lines 279-358)
- Create: `backend/tests/welcome-email.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `buildWelcomeEmailHtml({ firstName, username, profileUrl, hasPassword })` -> `string`
  - `buildWelcomeEmailText({ firstName, username, profileUrl, hasPassword })` -> `string`
- Consumed by `sendWelcomeEmail` in Task 5.

Both must HTML-escape all four interpolated values. Reuse the existing `escapeHtml` at `email.js:383` — do not write a second one.

- [ ] **Step 1: Write the failing test**

`backend/tests/welcome-email.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` from `backend/`

Expected: FAIL — `buildWelcomeEmailHtml is not a function`.

- [ ] **Step 3: Implement both builders**

`buildWelcomeEmailText` first, then `buildWelcomeEmailHtml` wrapping it. Match the visual language of `generateVerificationEmailHtml` (emerald `#059669`/`#047857` header, `#1f3328` body text) so the three templates look like one product. Note in the body whether `hasPassword` is false.

- [ ] **Step 4: Export both**

Add `buildWelcomeEmailHtml` and `buildWelcomeEmailText` to the `module.exports` block at `email.js:418-425`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test` from `backend/`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/utils/email.js backend/tests/welcome-email.test.js
git commit -m "feat(email): add welcome email templates"
```

---

### Task 5: Honest email delivery

**Files:**
- Modify: `backend/utils/email.js` (`sendNotificationEmail` at lines 390-416, the `module.exports` block, and the new `sendWelcomeEmail`)
- Create: `backend/tests/email-delivery.test.js`

**Interfaces:**
- Consumes: `buildWelcomeEmailHtml` / `buildWelcomeEmailText` from Task 4.
- Produces:
  - `sendNotificationEmail(email, firstName, title, message, link)` -> `Promise<boolean>` — **signature change from `boolean`**. Resolves `true` only when SMTP accepted the message. Never rejects; a missing SMTP config resolves `false`.
  - `sendWelcomeEmail({ email, firstName, username, profileUrl, hasPassword })` -> `Promise<boolean>`.
- Consumed by `notification-model.js` (Task 7), which must now `await` the result.

This is the change that makes the current unconditional `return true` at `email.js:415` honest, and it is what lets Task 7 record real delivery outcomes.

- [ ] **Step 1: Write the failing test**

`backend/tests/email-delivery.test.js`. The point is the *contract*, not SMTP itself — assert that the function returns a promise and that a broken transport resolves `false` instead of throwing:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { sendNotificationEmail } = require('../utils/email');

test('returns a promise rather than a bare boolean', () => {
    const result = sendNotificationEmail('visitor@example.com', 'Maria', 'Ticket confirmed', 'Your ticket is confirmed.', '/reservations');
    assert.ok(result instanceof Promise);
    return result;
});

test('resolves false when SMTP is not configured instead of throwing', async (t) => {
    const previous = {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS
    };
    for (const key of Object.keys(previous)) delete process.env[key];
    t.after(() => { for (const [k, v] of Object.entries(previous)) if (v !== undefined) process.env[k] = v; });

    assert.equal(await sendNotificationEmail('visitor@example.com', 'Maria', 'Hi', 'There', null), false);
});

test('resolves false for a missing recipient', async () => {
    assert.equal(await sendNotificationEmail(null, 'Maria', 'Hi', 'There', null), false);
});
```

If the developer's environment has real SMTP credentials, the second test deletes them for its duration and restores them in `t.after`. Do not skip it on that basis — the assertion is that the function is *total*.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` from `backend/`

Expected: FAIL — the current `sendNotificationEmail` returns `true`, so `result instanceof Promise` is `false`.

- [ ] **Step 3: Rewrite `sendNotificationEmail`**

Change the signature to `async`, and replace the `sendEmailAsync` fire-and-forget call plus `return true` with:

```js
try {
    return await sendEmailWithRetry(mailOptions);
} catch (error) {
    logEmail('error', 'Notification email failed', { to: email, error: error.message });
    return false;
}
```

The `try/catch` covers `getTransporter()` throwing on missing SMTP config (`email.js:14-16`). Keep the existing `if (!email) return false` guard. Preserve the current `escapeHtml` usage on every interpolated value.

- [ ] **Step 4: Add `sendWelcomeEmail`**

`async`, builds via the Task 4 helpers, subject `Welcome to Bulusan Zoo`, returns `await sendEmailWithRetry(mailOptions)`.

Note in the code that this one *is* awaited by its caller (the gate must only be set on real success), unlike `sendVerificationEmail` which uses fire-and-forget.

- [ ] **Step 5: Export `sendWelcomeEmail`**

Add it to the `module.exports` block.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test` from `backend/`

Expected: PASS.

- [ ] **Step 7: Check the one existing call site still compiles**

`notification-model.js:260` calls `sendNotificationEmail(...)` without `await`. That is still valid JavaScript — a floating promise — so nothing breaks, but it is exactly the bug being fixed. Task 7 is what repairs it. Confirm no other call sites exist:

Run: `Select-String -Path backend/**/*.js -Pattern 'sendNotificationEmail'` from the repo root.

Expected: matches only in `email.js` and `notification-model.js`.

- [ ] **Step 8: Commit**

```bash
git add backend/utils/email.js backend/tests/email-delivery.test.js
git commit -m "fix(email): return real delivery result from notification and welcome emails"
```

---

## Phase B — Notification service and coverage

### Task 6: The notification type catalog

The catalog is the heart of the notification work: it is what makes the `event.announced` / `eventReminders` conflation impossible to reproduce.

**Files:**
- Create: `backend/services/notification-service.js` (catalog + pure resolution only in this task)
- Create: `backend/tests/notification-catalog.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces from this task:
  - `CATALOG` — `Record<string, { category: string|null, emailByDefault: boolean, title: (data) => string, message: (data) => string }>`, containing exactly the 15 keys in the spec's §4.2 table.
  - `resolveNotification(type, data)` -> `{ category, emailByDefault, title, message }`. **Throws** `Error('Unknown notification type: <type>')` for a key not in `CATALOG`.
  - `CATEGORIES` — the five preference keys, used by the settings merge in Task 9.
- Extended in Task 8 with the delivery functions.

- [ ] **Step 1: Write the failing test**

`backend/tests/notification-catalog.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { CATALOG, resolveNotification, CATEGORIES } = require('../services/notification-service');

const EXPECTED_TYPES = [
    'event.announced', 'event.updated', 'event.cancelled',
    'reservation.confirmed', 'reservation.cancelled', 'reservation.completed',
    'reservation.no_show', 'reservation.verification',
    'ticket.paid', 'ticket.checked_in',
    'appeal.reviewed', 'post.moderated', 'message.replied',
    'account.password_set', 'marketing.broadcast'
];

test('contains every documented type and nothing else', () => {
    assert.deepEqual(Object.keys(CATALOG).sort(), [...EXPECTED_TYPES].sort());
});

test('exposes exactly the five notification preference keys', () => {
    assert.deepEqual([...CATEGORIES].sort(),
        ['emailNotifications', 'eventReminders', 'marketingEmails', 'pushNotifications', 'ticketUpdates']);
});

test('every entry declares a category and resolvable copy', () => {
    for (const [key, entry] of Object.entries(CATALOG)) {
        const resolved = resolveNotification(key, { reference: 'BK-1', title: 'Night Safari', status: 'confirmed' });
        assert.equal(typeof resolved.title, 'string', key);
        assert.equal(typeof resolved.message, 'string', key);
        assert.ok(resolved.message.length > 0, key);
        assert.ok(CATEGORIES.has(resolved.category) || resolved.category === null, key);
        assert.equal(typeof entry.emailByDefault, 'boolean', key);
    }
});

test('new event announcements are not conflated with event reminders', () => {
    // Review Focus #5: event.announced and any future event.reminder must not share a gate.
    assert.equal(resolveNotification('event.announced', {}).category, 'eventReminders');
    assert.equal(CATALOG['event.announced'].reminder, false,
        'mark event.announced as a non-reminder so a reminder type can be added later without collision');
});

test('substitutes data into the copy', () => {
    const resolved = resolveNotification('reservation.confirmed', { reference: 'BK-1234' });
    assert.match(resolved.title, /Ticket Reservation Confirmed/);
    assert.match(resolved.message, /BK-1234/);
});

test('throws on an unknown type rather than sending an empty notification', () => {
    assert.throws(() => resolveNotification('nope.not.real', {}), /Unknown notification type: nope\.not\.real/);
});

test('every key fits the notifications.type VARCHAR(32) column', () => {
    // ensure-notification-schema.js:19 — a longer key would be truncated by MySQL.
    for (const key of Object.keys(CATALOG)) {
        assert.ok(key.length <= 32, `${key} is ${key.length} characters`);
    }
});

test('marketing is the only entry that defaults to no email', () => {
    const off = Object.entries(CATALOG).filter(([, e]) => e.emailByDefault === false).map(([k]) => k);
    assert.deepEqual(off, ['marketing.broadcast']);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` from `backend/`

Expected: FAIL with `Cannot find module '../services/notification-service'`.

- [ ] **Step 3: Implement the catalog**

`CATALOG` with all 15 entries, each with the `category`, `emailByDefault`, `reminder` flag, and `title`/`message` template functions from the spec's §4.2 table. Every template must render non-empty text with an empty `data` object — that is what the loop test above pins.

`resolveNotification` looks up the entry, calls both template functions with `data`, and returns `{ category, emailByDefault, reminder, title, message }`. It throws on a missing key.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test` from `backend/`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/services/notification-service.js backend/tests/notification-catalog.test.js
git commit -m "feat(notifications): add notification type catalog"
```

---

### Task 7: Notification model honours explicit categories and real email results

**Files:**
- Modify: `backend/models/notification-model.js` (`create` at lines 229-263)
- Create: `backend/tests/notification-model.test.js`

**Interfaces:**
- Consumes: `sendNotificationEmail` (Task 5), now returning `Promise<boolean>`.
- Produces: `Notification.create(notification)` where `notification` gains a **required** `category` field (`string | null`). Returns `Promise<{ id: number|null, emailSent: boolean, skipped: boolean }>` instead of the current bare `insertId | null`.

Every existing caller is updated in Task 8 and by the controller migration in Task 9; until then the model is mid-migration, which is acceptable because each commit is a working branch state and no other feature depends on the return shape.

- [ ] **Step 1: Write the failing test**

`backend/tests/notification-model.test.js`. `create` needs a database, so test the pure decision it delegates to — export that decision from the model file and test it directly:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveDelivery } = require('../models/notification-model');

const DEFAULTS = {
    emailNotifications: true, pushNotifications: true,
    eventReminders: true, ticketUpdates: true, marketingEmails: false
};
const withSettings = (overrides) => ({ ...DEFAULTS, ...overrides });

test('push and email are both sent by default', () => {
    assert.deepEqual(resolveDelivery(withSettings(), 'ticketUpdates', false),
        { push: true, email: true });
});

test('a disabled category suppresses the whole notification', () => {
    assert.deepEqual(resolveDelivery(withSettings({ ticketUpdates: false }), 'ticketUpdates', false),
        { push: false, email: false });
});

test('a null category is never suppressed by a preference', () => {
    assert.deepEqual(resolveDelivery(withSettings({ ticketUpdates: false }), null, false),
        { push: true, email: true });
});

test('marketing needs both the category and its own preference', () => {
    assert.equal(resolveDelivery(withSettings(), 'marketing', false).email, false);
    assert.equal(resolveDelivery(withSettings({ marketingEmails: true }), 'marketing', false).email, true);
    // ...and still respects the global email switch.
    assert.equal(resolveDelivery(withSettings({ marketingEmails: true, emailNotifications: false }), 'marketing', false).email, false);
});

test('in-app and email switches are independent', () => {
    assert.deepEqual(resolveDelivery(withSettings({ pushNotifications: false }), 'ticketUpdates', false),
        { push: false, email: true });
    assert.deepEqual(resolveDelivery(withSettings({ emailNotifications: false }), 'ticketUpdates', false),
        { push: true, email: false });
});
```

Review Focus #3 lives in the last two tests: turning off email must never stop the in-app notification, and vice versa.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` from `backend/`

Expected: FAIL — `resolveDelivery is not exported`.

- [ ] **Step 3: Implement and export `resolveDelivery`**

```js
const resolveDelivery = (settings, category, emailByDefault) => {
    if (category && settings[category] === false) return { push: false, email: false };
    const email = settings.emailNotifications !== false
        && (category !== 'marketing' || settings.marketingEmails === true);
    return { push: settings.pushNotifications !== false, email: email && emailByDefault };
};
```

Export it alongside the class.

- [ ] **Step 4: Rewrite `Notification.create` to use it**

Keep the existing settings read/parse block (lines 231-248) but replace the ad-hoc `preference` derivation with the passed-in `category`, then:

```js
const delivery = resolveDelivery(settings, category, emailByDefault);
if (!delivery.push && !delivery.email) return { id: null, emailSent: false, skipped: true };
```

Insert the row only when `delivery.push` is true, then `await sendNotificationEmail(...)` when `delivery.email` is true and capture its boolean into `emailSent`. Wrap the email call in its own `try/catch` so an SMTP fault returns `emailSent: false` without discarding the already-inserted row — this is the "notification failure never breaks the originating write" guarantee.

Remove the now-dead `DEFAULT_SETTINGS` merge from `create` if it is duplicated by the new settings merge in Task 9; keep the export if other code reads it.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test` from `backend/`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/models/notification-model.js backend/tests/notification-model.test.js
git commit -m "fix(notifications): use explicit categories and real email delivery results"
```

---

### Task 8: Notification service delivery functions

**Files:**
- Modify: `backend/services/notification-service.js`
- Create: `backend/tests/notification-service.test.js`

**Interfaces:**
- Consumes: `CATALOG` / `resolveNotification` / `CATEGORIES` (Task 6), `Notification.create` (Task 7).
- Produces:
  - `notifyUser(userId, type, data)` -> `Promise<{ id, emailSent, skipped } | null>` — `null` when `userId` is falsy.
  - `notifyManagement({ title, message, type, link })` -> `Promise<void>` — unchanged shape, so the ten existing management call sites keep working untouched.
  - `broadcastToVisitors(type, data)` -> `Promise<number>` — returns the count of recipients the notification was created for.
- Consumed by every controller in Task 9.

- [ ] **Step 1: Write the failing test**

`backend/tests/notification-service.test.js`. Both delivery functions hit the database, so test the recipient-selection query shapes as pure predicates by exporting them:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { isEligibleRecipient, selectVisitorRecipients } = require('../services/notification-service');

test('excludes inactive, suspended and deleted accounts', () => {
    const active = { role: 'user', is_active: 1, is_suspended: 0, deleted_at: null };
    assert.equal(isEligibleRecipient(active), true);
    assert.equal(isEligibleRecipient({ ...active, is_active: 0 }), false);
    assert.equal(isEligibleRecipient({ ...active, is_suspended: 1 }), false);
    assert.equal(isEligibleRecipient({ ...active, deleted_at: new Date() }), false);
    assert.equal(isEligibleRecipient({ ...active, role: 'staff' }), false);
});

test('never notifies an inactive or deleted account', () => {
    const rows = [
        { id: 1, role: 'user', is_active: 1, is_suspended: 0, deleted_at: null },
        { id: 2, role: 'user', is_active: 0, is_suspended: 0, deleted_at: null },
        { id: 3, role: 'staff', is_active: 1, is_suspended: 0, deleted_at: null }
    ];
    assert.deepEqual(selectVisitorRecipients(rows).map(r => r.id), [1]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` from `backend/`

Expected: FAIL — the exports do not exist yet.

- [ ] **Step 3: Add the delivery functions**

`notifyUser` resolves the catalog entry, calls `Notification.create({ userId, title, message, type, category, emailByDefault, link })`, and returns its result. `link` is accepted as a fourth argument defaulting to `null`.

`broadcastToVisitors` selects all `role = 'user'` rows that are active, not suspended and not deleted, then `Promise.all`s `notifyUser` over them.

`notifyManagement` keeps its existing implementation (`notification-model.js:177-195`) re-exported as-is — including its internal try/catch, which is what stops a notification fault from breaking a saved booking.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test` from `backend/`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/services/notification-service.js backend/tests/notification-service.test.js
git commit -m "feat(notifications): add notifyUser, notifyManagement and broadcastToVisitors"
```

---

### Task 9: Close the notification coverage gaps

Every entry below is a change that is **currently silent**. This is the user-visible half of the notification work.

**Files:**
- Modify: `backend/controllers/admin-controller.js` (`updateEvent` line 418, `deleteEvent` line 434, `updateTicketStatus` line 533)
- Modify: `backend/controllers/staff-controller.js` (`updateTicketStatus` line 335, `markTicketUsed`)
- Modify: `backend/controllers/reservation-controller.js` (`updateVerificationStatus` line 581, `updateTicketReservationStatus` line 455, `updateEventReservationStatus` line 515, `notifyReservationUser` line 106)
- Modify: `backend/controllers/community-controller.js` (line 305)
- Modify: `backend/controllers/message-controller.js` (lines 33, 101, 237)
- Modify: `backend/controllers/payment-controller.js` (lines 108, 168)
- Modify: `backend/controllers/chat-controller.js` (line 136)
- Modify: `backend/controllers/auth-controller.js` (`submitPublicAppeal`, line 918)
- Modify: `backend/controllers/admin-controller.js` (`reviewAppeal` line 1168)
- Modify: `backend/models/notification-model.js` (`getSystemNotifications` line 36)
- Modify: `frontend/src/components/Header.jsx` (notification icon, lines 816-825)

**Interfaces:**
- Consumes: `notifyUser`, `broadcastToVisitors`, `notifyManagement` (Task 8).
- Produces: no new exports. Existing controller signatures and response shapes are unchanged.

- [ ] **Step 1: Store the catalog key as the notification `type`, and update the two readers**

`notifications.type` is `VARCHAR(32)` (`ensure-notification-schema.js:19`). Every catalog key fits:
the longest, `reservation.verification`, is 24 characters. So the stored `type` becomes the catalog key
verbatim — no new column, and the stored value stays self-describing.

Two existing readers assume the old short values and must be updated **in this same step**, or
notifications silently stop rendering:

- `notification-model.js:36` `getSystemNotifications` filters
  `WHERE type IN ('system', 'ticket', 'event')`. That returns nothing once every `event.*` is stored as
  `event.announced`. Widen it with prefix matching — `type LIKE 'event%' OR type LIKE 'ticket%' OR
  type LIKE 'reservation%'`.
- `Header.jsx:816-825` branches on `notif.type === 'event'` / `'ticket'` / `'reservation'` to pick an
  icon and colour. Rewrite as prefix matching on the key before the `.`: `event.` -> Calendar,
  `ticket.` / `reservation.` -> Ticket, everything else -> Message. **Keep the `else` fallback** —
  `message.replied`, `post.moderated`, `appeal.reviewed` and `account.password_set` all land there,
  and an unknown future key must degrade to the neutral icon rather than render nothing.

- [ ] **Step 2: Replace the ad-hoc `notifyReservationUser` helper**

`reservation-controller.js:106-113` hardcodes `type: 'event'` and `category: 'ticketUpdates'`, which is exactly the conflation being removed. Delete the helper body and route all its call sites through `notifyUser(userId, type, data)` from the service, mapping:

| Old site | New call |
|---|---|
| line 481 (confirmed) | `notifyUser(uid, 'reservation.confirmed', { reference })` |
| line 489 (cancelled) | `notifyUser(uid, 'reservation.cancelled', { reference })` |
| line 543 (event confirmed) | `notifyUser(uid, 'reservation.confirmed', { reference })` |
| line 554 (event cancelled) | `notifyUser(uid, 'reservation.cancelled', { reference })` |

Links stay `/reservations` and `/my-events` respectively.

- [ ] **Step 3: Notify on every reservation status, not just two**

In `updateTicketReservationStatus` (line 455) and `updateEventReservationStatus` (line 515), the `if (status === ...)` chains only cover `confirmed` and `cancelled`. Add `completed` -> `reservation.completed` and `no_show` -> `reservation.no_show`, matching the `validStatuses` list at lines 460 and 520.

Use a lookup rather than four sequential `if`s:

```js
const RESERVATION_STATUS_TYPES = {
    confirmed: 'reservation.confirmed',
    cancelled: 'reservation.cancelled',
    completed: 'reservation.completed',
    no_show: 'reservation.no_show'
};
```

- [ ] **Step 4: Notify on reservation verification changes**

`reservation-controller.js:581` `updateVerificationStatus` sends nothing today, while its two siblings (`admin-controller.js:1219`, `staff-controller.js:674`) do. Read the reservation first so the message can name it, then call `notifyUser(userId, 'reservation.verification', { status })`.

Make all three paths emit the same copy — the duplicated implementations in `admin-controller.js:1239-1252` and `staff-controller.js:695-703` should read the reservation and delegate rather than building their own message.

- [ ] **Step 5: Notify on event update and delete**

`admin-controller.js:418` `updateEvent` currently sends nothing. Fetch the existing event with `Event.findById(id)` before updating so the message can name it, then `broadcastToVisitors('event.updated', { title })`.

`deleteEvent` (line 434) is harder: the row is soft-deleted, so read it *before* `Event.softDelete` and `broadcastToVisitors('event.cancelled', { title })` after.

`createEvent` at line 401 changes from `Notification.notifyUsers({...})` to `broadcastToVisitors('event.announced', { title })`.

- [ ] **Step 6: Notify on ticket status from both admin and staff**

`admin-controller.js:533` and `staff-controller.js:335` are near-identical duplicates. Both map through the same lookup:

```js
const TICKET_STATUS_TYPES = {
    confirmed: 'reservation.confirmed',
    cancelled: 'reservation.cancelled',
    completed: 'reservation.completed',
    no_show: 'reservation.no_show'
};
```

Keep both handlers (deduplicating the controllers is explicitly out of scope per spec §10) — only their notification calls change.

- [ ] **Step 7: Notify when a ticket is checked in**

`staff-controller.js` `markTicketUsed` sends nothing. Add `notifyUser(ticket.user_id, 'ticket.checked_in', { reference })`.

- [ ] **Step 8: Migrate the remaining direct `Notification.create` call sites**

These already work — they pass a correct `category` by hand — but they hand-build `title`/`message` and
some omit `category` entirely, which would become a required argument after Task 7. Migrating them is
mechanical:

| Site | Becomes |
|---|---|
| `community-controller.js:305` | `notifyUser(post.user_id, 'post.moderated', { status, note })` |
| `message-controller.js:33, 101, 237` | `notifyUser(userId, 'message.replied', { subject })` |
| `chat-controller.js:136` | `notifyUser(result.conversation.user_id, 'message.replied', { subject: 'New Support Reply' })` |
| `payment-controller.js:108` | `notifyUser(reservation.user_id, 'ticket.paid', { reference, status })` |
| `payment-controller.js:168` | `notifyUser(reservation.user_id, 'ticket.paid', { reference })` |
| `admin-controller.js:1168`, `staff-controller.js:623` | `notifyUser(appeal.user_id, 'appeal.reviewed', { status, response })` |
| `auth-controller.js:918` | replace the manual admin loop with `notifyManagement({ ... })` |

`message-controller.js:80` keeps `notifyManagement` — already correct.

Note `payment-controller.js:108` covers `paid`, `expired` and `refunded`, so the `status` data field
carries the distinction; the catalog entry's message must render it.

- [ ] **Step 9: Leave animal and plant CRUD silent**

`admin-controller.js:332-506` deliberately gets **no** broadcast, per the agreed scope in spec §4.5. Add a one-line comment at each so a future reader does not assume it was an oversight.

- [ ] **Step 10: Verify every `Notification.create` call site now passes a category**

Run: `Select-String -Path backend/**/*.js -Pattern 'Notification\.create'`

Expected: matches only inside `notification-model.js` itself. Every controller goes through the service.

- [ ] **Step 11: Run the full suite**

Run: `npm test` from `backend/`

Expected: PASS. No controller has a unit test, so this confirms no import cycle was introduced — a circular `require` between a controller and the service would surface here.

- [ ] **Step 12: Commit**

```bash
git add backend/controllers/ backend/models/notification-model.js frontend/src/components/Header.jsx
git commit -m "feat(notifications): notify visitors on event, reservation and ticket changes"
```

---

## Phase C — Google onboarding

### Task 10: User model — username, onboarding and welcome gates

**Files:**
- Modify: `backend/models/user-model.js`
- Create: `backend/tests/user-model.test.js`

**Interfaces:**
- Consumes: `checkPersisted` (Task 2), `CATEGORIES` (Task 6).
- Produces:
  - `setUsername(userId, username)` -> `Promise<boolean>` — returns `true` when the row was written, **including** when `affectedRows === 0` because the name was already correct. Callers still verify with `checkPersisted`.
  - `isUsernameAvailable(username, excludeUserId)` -> `Promise<boolean>`
  - `markOnboardingComplete(userId)` -> `Promise<boolean>`
  - `markWelcomeSent(userId)` -> `Promise<boolean>`
  - `getSettings(userId)` -> `Promise<object>` — **changed**: returns `CATEGORIES` merged with stored settings instead of `null`.
- Consumed by Task 11.

- [ ] **Step 1: Write the failing test**

`backend/tests/user-model.test.js` — the merge is pure once the read is done, so test it via the exported helper:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeNotificationSettings } = require('../models/user-model');
const { CATEGORIES } = require('../services/notification-service');

test('returns full defaults when nothing is stored', () => {
    assert.deepEqual(Object.keys(mergeNotificationSettings(null)).sort(), [...CATEGORIES].sort());
    assert.equal(mergeNotificationSettings(null).emailNotifications, true);
    assert.equal(mergeNotificationSettings(null).marketingEmails, false);
});

test('stored values win over defaults', () => {
    const merged = mergeNotificationSettings({ emailNotifications: false });
    assert.equal(merged.emailNotifications, false);
    assert.equal(merged.pushNotifications, true);
});

test('tolerates the column arriving as a JSON string', () => {
    const merged = mergeNotificationSettings('{"ticketUpdates":false}');
    assert.equal(merged.ticketUpdates, false);
    assert.equal(merged.pushNotifications, true);
});

test('ignores unknown keys and unparseable JSON', () => {
    assert.equal(mergeNotificationSettings({ hacked: true }).hacked, undefined);
    assert.equal(mergeNotificationSettings('not json').emailNotifications, true);
});
```

The third test covers the real risk: mysql2 returns a `JSON` column as an already-parsed object on some paths and a string on others, and the current code at `user-model.js:474` handles both inconsistently.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` from `backend/`

Expected: FAIL — `mergeNotificationSettings` is not exported.

- [ ] **Step 3: Implement `mergeNotificationSettings`**

```js
const mergeNotificationSettings = (stored) => {
    let parsed = stored;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch { parsed = null; }
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) parsed = {};
    const merged = {};
    for (const key of CATEGORIES) merged[key] = key in parsed ? Boolean(parsed[key]) : DEFAULT_DEFAULTS[key];
    return merged;
};
```

with a local `DEFAULT_DEFAULTS` map matching `notification-model.js:4-10`. Export it.

- [ ] **Step 4: Fix `getSettings` to use the merge**

Replace lines 468-477 with a read followed by `return mergeNotificationSettings(rows[0]?.notification_settings)`. It now returns a complete object instead of `null`.

- [ ] **Step 5: Fix `updateSettings` to not report false failures**

Current lines 479-485 return `result.affectedRows > 0`. Change the model to return `true` whenever the statement executed without throwing:

```js
static async updateSettings(userId, settings) {
    await db.query(
        'UPDATE users SET notification_settings = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(settings), userId]
    );
    return true;
}
```

The read-back that actually decides success lives in the controller (Task 11). Add a comment saying so, or the next reader will reintroduce the bug.

- [ ] **Step 6: Add the four new methods**

```js
static async setUsername(userId, username) {
    await db.query('UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?', [username, userId]);
    return true;
}

static async isUsernameAvailable(username, excludeUserId = null) {
    const [rows] = await db.query(
        'SELECT id FROM users WHERE username = ? AND (? IS NULL OR id <> ?) LIMIT 1',
        [username, excludeUserId, excludeUserId]
    );
    return rows.length === 0;
}

static async markOnboardingComplete(userId) { /* ... google_onboarding_complete = TRUE ... */ }
static async markWelcomeSent(userId) { /* ... is_welcome_sent = TRUE ... */ }
```

Both marks are one-way writes with no unset path. Add a comment on each: the absence of a reset is a security property, not an oversight.

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test` from `backend/`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/models/user-model.js backend/tests/user-model.test.js
git commit -m "fix(users): read-back settings merge and add username/onboarding gates"
```

---

### Task 11: Auth endpoints for username, onboarding and welcome

**Files:**
- Modify: `backend/controllers/auth-controller.js` (`login` line 158, new exports)
- Modify: `backend/routes/auth-routes.js` (protected block, lines 34-42)
- Create: `backend/tests/auth-controller.test.js`

**Interfaces:**
- Consumes: `validateUsername` (Task 3), `checkPersisted` (Task 2), `sendWelcomeEmail` (Task 5), the four new model methods (Task 10).
- Produces three routes, all behind the existing `protect` middleware:
  - `PUT /api/auth/username` — body `{ username }` -> `{ success, username }`. 400 invalid, 409 taken, 500 if the read-back disagrees.
  - `GET /api/auth/username/check?name=` -> `{ success, available }`. 400 invalid, never reveals the account behind the name.
  - `POST /api/auth/onboarding/complete` -> `{ success }`. Flips the gate and sends the welcome email.
- Consumed by Task 12 (frontend api-client).

- [ ] **Step 1: Write the failing test**

`backend/tests/auth-controller.test.js` — the controllers need a database, so test the status-code mapping as a pure exported helper:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { usernameErrorStatus } = require('../controllers/auth-controller');
const { validateUsername } = require('../utils/username-rules');

test('maps invalid usernames to 400 and taken names to 409', () => {
    assert.equal(usernameErrorStatus(validateUsername('ab')), 400);
    assert.equal(usernameErrorStatus(validateUsername('ok.name')), null);
    assert.equal(usernameErrorStatus({ taken: true }), 409);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test` from `backend/`

Expected: FAIL — `usernameErrorStatus` is not exported.

- [ ] **Step 3: Implement and export `usernameErrorStatus`**

```js
const usernameErrorStatus = (result) => {
    if (result && result.taken) return 409;
    if (!result || result.ok !== true) return 400;
    return null;
};
```

- [ ] **Step 4: Add `exports.setUsername`**

Validate with `validateUsername`, return the mapped status on failure, then check `User.isUsernameAvailable(req.user.id)`. On success:

```js
await User.setUsername(req.user.id, clean);
const saved = await User.findById(req.user.id);
if (!checkPersisted({ username: saved.username }, { username: clean })) {
    return res.status(500).json({ success: false, message: 'Could not update your username. Please try again.' });
}
res.json({ success: true, username: saved.username });
```

Do not reissue a token — `username` is not in the JWT payload.

- [ ] **Step 5: Add `exports.checkUsername`**

Same validation, then `available: await User.isUsernameAvailable(value, req.user.id)`. Always 200 for a valid name regardless of availability, so a client can distinguish "invalid" from "taken".

- [ ] **Step 6: Add `exports.completeOnboarding`**

Call `User.markOnboardingComplete(req.user.id)`. Then, if `req.user.is_welcome_sent` is falsy, read the fresh user and attempt `sendWelcomeEmail`. **Set `is_welcome_sent` only if the send returned `true`** — otherwise a transient SMTP fault would permanently consume the welcome. Do not fail the request when the email fails; onboarding succeeded regardless.

- [ ] **Step 7: Send the welcome email on first local login**

In `login` (line 158), after the token is generated and before `res.json`, if `user.role === 'user'` and `!user.is_welcome_sent`, attempt `sendWelcomeEmail` and call `User.markWelcomeSent(user.id)` **only on success**. Reuse the already-loaded `user` row — do not add a query.

Move this *before* `res.json` and wrap it so the response is never delayed indefinitely; `sendEmailWithRetry` already caps at 3 attempts with its own timeouts.

- [ ] **Step 8: Notify on password set and change**

The catalog defines `account.password_set` ("password created or changed") but nothing currently
notifies on it — a Google visitor who sets a password from the stepper, or anyone who changes their
password from `UserProfile.jsx`, gets no confirmation.

In `updatePassword` (`auth-controller.js:608`), after `User.updatePassword` succeeds and before
`res.json`, call `notifyUser(req.user.id, 'account.password_set', {})`. It must not block the response —
the endpoint already returns a fresh token that the client stores, so delay here is directly visible.

Import `notifyUser` at the top of the file rather than lazily. The existing lazy
`require('../models/notification-model')` at line 909 inside `submitPublicAppeal` becomes unnecessary
once Step 8 migrates that call site to `notifyManagement`; remove the inline require and hoist the
import.

- [ ] **Step 9: Register the three routes**

In the protected block of `auth-routes.js`, alongside the existing `router.put('/updatepassword', protect, updatePassword)`:

```js
router.put('/username', protect, setUsername);
router.get('/username/check', protect, checkUsername);
router.post('/onboarding/complete', protect, completeOnboarding);
```

Add all three names to the destructure at the top.

- [ ] **Step 10: Run the test to verify it passes**

Run: `npm test` from `backend/`

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add backend/controllers/auth-controller.js backend/routes/auth-routes.js backend/tests/auth-controller.test.js
git commit -m "feat(auth): add username, onboarding-complete and first-login welcome endpoints"
```

---

### Task 12: Frontend — api-client methods and the onboarding stepper

**Files:**
- Modify: `frontend/src/services/api-client.js` (the `authAPI` object, which ends around line 250)
- Create: `frontend/src/components/auth/GoogleOnboardingFlow.jsx`
- Modify: `frontend/src/pages/auth/GoogleAuthSuccess.jsx`

**Interfaces:**
- Consumes: the three routes from Task 11; `hasPassword` and `isNewGoogleAccount` from the handoff (Task 13); `updateUser` from `AuthContext` (already exists, `AuthContext.jsx:138`).
- Produces:
  - `authAPI.setUsername(username)` -> `Promise<{ success, username }>`
  - `authAPI.checkUsername(name)` -> `Promise<{ success, available }>`
  - `authAPI.completeOnboarding()` -> `Promise<{ success }>`
  - `<GoogleOnboardingFlow isOpen user hasPassword onComplete />` — `hasPassword: boolean`, `onComplete: () => void`. Self-contained; it does its own navigation, so `GoogleAuthSuccess.jsx` only decides *whether* to render it.

**There are no frontend tests** — the project has no test runner and adding one is out of scope. Verification for this task is manual; the steps below say what to check.

- [ ] **Step 1: Add the three api-client methods**

Follow the existing pattern exactly — `fetch` against `${API_BASE_URL}/auth/...` with `getAuthHeaders('user')`, returned through `handleResponse`. Place them next to `verifyAdminMasterKey` (line 168). Do not add try/catch; `handleResponse` (line 131) already throws on non-2xx.

- [ ] **Step 2: Create `GoogleOnboardingFlow.jsx`**

Structure, following `AuthSuccessModal.jsx`: `ReactDOM.createPortal(content, document.body)`, `useScrollLock(isOpen)` (already at `hooks/use-scroll-lock.js`), and the same emerald/gray Tailwind tokens.

Props: `isOpen`, `user`, `hasPassword`, `onComplete`.

State machine — a single `step` string, `'username' | 'password' | 'done'`:

- **`'username'`** — heading *"What should we call you?"*. Input prefilled with `user.username` so the visitor can accept the auto-generated name by pressing Continue without typing. Debounced 400ms availability check against `checkUsername`; show *"That name is already taken."* inline as they type. Two buttons: **Continue** (disabled while checking or invalid) and **"Keep my current name"** — the latter advances without calling `setUsername`, and its label states plainly that the name is being kept.
- **`'password'`** — only reachable when `hasPassword === false`. Heading *"Add a password?"*. Primary **"Add a password"** reveals the form; secondary **"Maybe later"** goes straight to done. The form sends `{ newPassword }` with **no `currentPassword`** — `auth-controller.js:627` skips that check when `user.password` is null. Mirror the four rules from `auth-controller.js:17-34` as inline errors: 8+ characters, one uppercase, one number, one special character.
- **`'done'`** — call `authAPI.completeOnboarding()`, then `onComplete()`. Navigate away regardless of whether that request succeeded.

On a successful `setUsername`, call `updateUser({ ...user, username })` from `useAuth` so the stored session stays in sync.

Disable Escape and backdrop-click dismissal — the visitor must either confirm or take an explicit skip branch. Move focus to each step's heading on transition. Each step's container carries `role="dialog"`, `aria-modal="true"` and `aria-labelledby`.

Every step is independently retryable: a failed username save stays on step 1 with the error inline and preserves the typed value; a failed password save keeps the form filled. Neither discards the other step's progress.

- [ ] **Step 3: Wire it into `GoogleAuthSuccess.jsx`**

After the existing `login(userData, token, 'user')` at line 40, add state `const [onboarding, setOnboarding] = useState(null)`. When `data.isNewGoogleAccount && userData.role === 'user'`, set it to `userData`; otherwise render nothing extra and navigate as today (lines 43-49).

Render `<GoogleOnboardingFlow isOpen={Boolean(onboarding)} user={onboarding} hasPassword={userData.hasPassword} onComplete={...} />`, and clear `onboarding` in `onComplete` so the normal role-based navigation runs.

Note in a comment that admins never reach this point: master-key admins are redirected at line 26, and the role check here covers staff.

- [ ] **Step 4: Verify against a dev server**

Start: `npm start` from the repo root, then sign in with a Google account whose email local-part is not already a username.

Expected, in order:
1. The spinner, then the stepper — not the home page.
2. *"Keep my current name"* advances to step 2 without a network write.
3. *"Maybe later"* reaches done, and the home page loads.
4. Signing in again shows **no** stepper.
5. Signing out and back in shows no stepper.
6. In DevTools, `PUT /api/auth/username` fires on Continue and `POST /api/auth/onboarding/complete` fires on done.

- [ ] **Step 5: Verify the take-a-new-name path**

Sign in with a **second** Google account and choose a name the first account already took.

Expected: the availability check reports it taken, Continue stays disabled, and the error is announced. Then close the tab mid-stepper, sign back in, and confirm the stepper reappears (Review Focus #4).

- [ ] **Step 6: Verify the welcome email**

Check the SMTP inbox for the signing-in account.

Expected: exactly one *"Welcome to Bulusan Zoo"*, naming the chosen username. Confirm a second sign-in sends nothing.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/services/api-client.js frontend/src/components/auth/GoogleOnboardingFlow.jsx frontend/src/pages/auth/GoogleAuthSuccess.jsx
git commit -m "feat(auth): add Google onboarding stepper for new accounts"
```

---

### Task 13: Expose the onboarding gate on the Google handoff

**Files:**
- Modify: `backend/controllers/google-auth-controller.js` (handoff payload at lines 392-414, response at line 447)

**Interfaces:**
- Consumes: the `google_onboarding_complete` column (Task 1).
- Produces: `isNewGoogleAccount: boolean` in the handoff payload and in `GET /auth/google/session` responses.

This must land **before or with** Task 12 — a frontend that expects the field against a backend that never sends it simply never shows the stepper, which fails silently.

- [ ] **Step 1: Add the field to the handoff payload**

In `handleGoogleCallback`, add to `userData`:

```js
isNewGoogleAccount: !Boolean(user.google_onboarding_complete)
```

Set it for **all** roles — `GoogleAuthSuccess.jsx` filters on `userData.role === 'user'`, so the backend should not encode role policy.

- [ ] **Step 2: Include it in the handoff response**

`getGoogleHandoff` (line 447) spreads specific fields explicitly rather than the whole object, so add `isNewGoogleAccount: data.userData.isNewGoogleAccount` to that response.

- [ ] **Step 3: Verify by hand**

Sign in with a new Google account with the dev server running, and inspect the `GET /auth/google/session` response body.

Expected: `"isNewGoogleAccount": true` on first sign-in, `false` on every sign-in after.

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/google-auth-controller.js
git commit -m "feat(auth): expose isNewGoogleAccount on the Google handoff"
```

---

### Task 14: Fix the notification settings page

**Files:**
- Modify: `backend/controllers/user-controller.js` (`getSettings` line 87, `updateSettings` line 97)
- Modify: `frontend/src/pages/user/Settings.jsx` (state at 66-72, fetch at 82-102, toggle at 128-141)

**Interfaces:**
- Consumes: `mergeNotificationSettings` behaviour from `getSettings` (Task 10), `checkPersisted` (Task 2), `CATEGORIES` (Task 6).
- Produces: `GET /api/users/settings` returns `{ success, settings }` where `settings` is always a complete five-key object. `PUT /api/users/settings` returns `success: true` whenever the value landed, including when it was already that value.

- [ ] **Step 1: Verify the bug exists before fixing it**

With the dev server running, open Settings -> Notifications and toggle **Email Notifications** twice in a row within the same second (toggle on, off, on). Toggle the same setting to the value it already holds and submit.

Expected on current code: the UI reverts the toggle and shows *"Couldn't update settings."* while the value was in fact saved. Capture the network tab showing the `PUT` returning **400** for a save that succeeded.

Do not skip this. It is the defect; confirming it is what makes the fix verifiable.

- [ ] **Step 2: Make `getSettings` return the merged object**

`user-controller.js:87-95` already delegates to `User.getSettings`, which now returns the merged object (Task 10). No controller change needed — confirm by reloading Settings and checking all five toggles reflect defaults for a fresh account.

- [ ] **Step 3: Make `updateSettings` verify by read-back**

Replace the `if (result)` branch at line 111:

```js
await User.updateSettings(req.user.id, nextSettings);
const saved = await User.getSettings(req.user.id);
if (!checkPersisted(saved, nextSettings)) {
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
}
res.json({ success: true, message: 'Settings updated successfully' });
```

Import `checkPersisted`. This is Review Focus #2: re-enabling a setting that was already on must now return 200.

- [ ] **Step 4: Re-run the Step 1 verification**

Expected: every toggle sticks, no revert, no error toast, and the `PUT` returns **200**.

- [ ] **Step 5: Fix the frontend's in-flight guard and stale revert**

`Settings.jsx:128-141` fires a request per toggle with no pending state and reverts with `setNotifications(notifications)` — the closure value, not the persisted one.

Replace with a `pendingKeys` `Set` in state:

- On toggle, add the key to `pendingKeys` and optimistically update `notifications`.
- On success, replace `notifications` with the object the server confirmed (or keep the optimistic value — the server is now authoritative and matches).
- On failure, restore from the last server-confirmed snapshot held in a `ref`, not from the render closure.
- Disable the row's checkbox while its key is in `pendingKeys`.

Also replace the `useState` initialiser at lines 66-72 with a comment noting the server response is authoritative and the five keys are only a loading placeholder — this is the duplication called out in spec §4.4(c).

- [ ] **Step 6: Add per-row feedback**

Render a small saving indicator per row while its key is pending, and put the result in an `aria-live="polite"` region so the success or failure is announced rather than only shown as a toast. This closes the missing live-region gap in the accessibility analysis.

- [ ] **Step 7: Verify rapid toggling**

Toggle five different settings as fast as the UI allows.

Expected: every one persists, no row sticks in a pending state, and a reload shows all five exactly as left.

- [ ] **Step 8: Commit**

```bash
git add backend/controllers/user-controller.js frontend/src/pages/user/Settings.jsx
git commit -m "fix(settings): verify notification saves by read-back and guard rapid toggles"
```

---

### Task 15: Surface email delivery health

**Files:**
- Modify: `backend/server.js` (health handler at lines 120-140)

**Interfaces:**
- Consumes: a failure counter exported from `notification-model.js` (Task 7) and incremented by `sendWelcomeEmail` failures (Task 11).
- Produces: `email: { sent, failed }` on `GET /api/health?full=true`.

The point is that email failure is currently invisible (`email.js:415` returned `true` unconditionally). This makes it observable without adding a logging pipeline.

- [ ] **Step 1: Add the counters**

Export `emailDeliveryStats()` from `notification-model.js` returning `{ sent, failed }`, incremented in `create` from the boolean `sendNotificationEmail` returns.

- [ ] **Step 2: Include them in the full health response**

In `server.js`'s health handler, inside the existing `if (req.query.full === 'true')` block, add `health.email = emailDeliveryStats()`.

Keep it inside the `full` guard — the unauthenticated health check should not leak operational detail.

- [ ] **Step 3: Verify**

Run: `GET /api/health?full=true` against the dev server.

Expected: `"email": { "sent": N, "failed": 0 }`, and `database: "connected"`.

- [ ] **Step 4: Commit**

```bash
git add backend/server.js backend/models/notification-model.js
git commit -m "feat(health): expose email delivery counters on the full health check"
```

---

## Final verification

- [ ] **Run the whole backend suite:** `npm test` from `backend/` — all files pass.
- [ ] **Confirm no controller calls `Notification.create` directly:** `Select-String -Path backend/**/*.js -Pattern 'Notification\.create'` returns matches only inside `notification-model.js`.
- [ ] **Confirm no `Notification.notifyUsers` call sites remain:** `Select-String -Path backend/**/*.js -Pattern 'notifyUsers'` returns nothing.
- [ ] **Confirm the visitor bell still renders new types:** sign in as a visitor, have an admin update an event, and check the bell shows a Calendar icon rather than a blank or missing entry. This exercises the `Header.jsx` prefix matching from Task 9 Step 1.
- [ ] **Boot the backend against a real database** and confirm both new columns exist and the ensure script is idempotent across two restarts.
- [ ] **Walk the four manual scenarios** from spec §3.5 end to end on the dev server.
- [ ] **Repeat the notification scenarios against the deployed production environment** — specifically that `NODE_ENV=production` CORS (`server.js:64-77`) and the `SameSite=None; Secure` handoff cookie (`google-auth-controller.js:416`) still let the stepper complete, since the OAuth handoff is cross-site there and behaves differently than in dev.
- [ ] **Confirm the full build:** `npm run build` from `frontend/`.

## Notes for the implementer

- **Do not trust `affectedRows` anywhere in this plan.** It is the defect, not an implementation detail.
- **Do not reorder Tasks 13 and 12.** Task 12's frontend is inert without Task 13's backend field, and the failure is silent.
- **Do not add a dependency to solve something the plan already solves in-repo.** `checkPersisted`, `validateUsername` and the catalog are all deliberately local.
- **Tasks 12 and 14 have no automated tests** because this project has no frontend test runner. Do not add one as part of this plan; the manual verification steps in each are the contract.