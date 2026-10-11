# Google Onboarding & Visitor Notifications — Design

**Date:** 2026-10-11
**Scope:** `backend/` and `frontend/` (excluding `staff-mobile/`)
**Status:** Awaiting implementation plan

---

## 1. Goal

Two visitor-facing defects:

1. **Google sign-in onboarding.** A visitor who creates an account through Google gets a silently
   auto-generated username derived from their email local-part and no password, with no chance to
   choose either. We add a one-time onboarding stepper after a *brand-new* Google account is created:
   choose a display name, then optionally set a password. Both the local-register and Google-onboarding
   paths send a one-time "welcome to Bulusan Zoo" email.

2. **Visitor notifications.** Several admin/staff actions change a visitor's world without telling them.
   Event edits are invisible. Reservation verification changes are silent on one of the three code
   paths. The user-facing notification settings page reports failure when the save actually succeeded.
   We build a single notification service with an explicit type catalog, close the coverage gaps, and
   fix the settings page.

Out of scope: staff/admin notification behaviour beyond routing through the new service, the walk-in
POS notification path, and any change to the AI assistant.

---

## 2. Non-goals

- No realtime push. Socket.IO stays chat-only; the visitor bell keeps its existing 30s poll.
- No email on routine repeat logins.
- No broadcasting animal/plant catalog changes to all visitors.
- No change to the master-key 2FA flow, which already works.

---

## 3. Part 1 — Google onboarding

### 3.1 Current behaviour

`google-auth-controller.js:352-378` creates the account and derives a username:

```js
let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
// ... appends 1, 2, 3... until User.findByUsername(username) is null
await User.createGoogleUser({ ..., username, ... });
```

The handoff response already carries the flag the frontend needs (`google-auth-controller.js:401`):

```js
hasPassword: Boolean(user.password)
```

`GoogleAuthSuccess.jsx` already reads that handoff. **The handoff contract does not need to change** —
it only needs one more boolean.

### 3.2 Schema

Add one column to `users`, via the existing `database/ensure-*.js` runtime-DDL pattern
(`ensure-auth-schema.js`, following its `INFORMATION_SCHEMA` probe-then-`ALTER` shape):

| Column | Type | Default | Meaning |
|---|---|---|---|
| `google_onboarding_complete` | `BOOLEAN` | `FALSE` | `TRUE` once the visitor has been through the stepper. |

- **Local accounts are not backfilled.** `auth_provider = 'local'` never enters the Google stepper, so
  the flag is irrelevant to them. Backfilling would be a lie anyway — those visitors did not choose a name.
- **Existing Google accounts start at `FALSE`** and will therefore see the stepper once on their next
  Google sign-in. This is intended: they are exactly the population that currently has an auto-generated
  name and no way to fix it.
- The column is also added to `backend/database/bulusanzoodatabasedevelopment.sql` so a fresh install
  matches a migrated one.

### 3.3 Handoff contract

`googleHandoffStore` entries gain `isNewGoogleAccount`:

```js
isNewGoogleAccount: Boolean(!user.google_onboarding_complete)
```

Set for **all** roles. `GoogleAuthSuccess.jsx` filters on `userData.role === 'user'` before running the
stepper, so a Google-authenticated admin or staff never sees it — matching the password-login path,
which shows no onboarding for staff or admin either.

`GET /auth/google/session` returns it alongside the existing fields. The cookie is still single-use
(`google-auth-controller.js:446` deletes the handoff on read), so this cannot be replayed.

### 3.4 Username endpoint

**No username mutation path exists anywhere in the codebase today.** `User.updateProfile`
(`user-model.js:86`) does not write the column, `auth-controller.updateProfile:493` does not accept it,
and `UserProfile.jsx:328` only displays it. This is new work.

**`User.setUsername(userId, username)`** — `user-model.js`

```sql
UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?
```

Returns `affectedRows > 0`. Callers must treat `false` as "nothing to do", not as an error — see §3.6.

**`PUT /api/auth/username`** — `auth-routes.js`, guarded by `protect`

Request: `{ username }`. Response: `{ success, username }`.

Validation, in order:

1. **Required and string** → 400.
2. **Sanitize** with the existing `sanitizeInput` (`auth-controller.js:37`, trim + strip `<>`).
3. **Length** 3–50 characters, matching `users.username VARCHAR(50)` in the schema file. This also
   satisfies the `VARCHAR(50)` write.
4. **Charset** `/^[a-zA-Z0-9._-]+$/` — same character class the auto-generator produces today, so no
   name is reachable by the modal that the auto-generator could not have produced.
5. **Reserved** — reject against a small set: `admin`, `staff`, `jiji`, `bulusanzoo`, `system`.
6. **Uniqueness** via `User.findByUsername` → 409 with `"That name is already taken."`

On success the response is `{ success: true, username }`. The client calls `AuthContext.updateUser` to
keep the stored session object in sync — the backend does not reissue a token, because `username` is
not in the JWT payload (`google-auth-controller.js:177` signs only `{ id, role, tabId }`).

**Rate limiting:** reuse the existing implicit per-session throttle. Three `PUT`s per second is not a
brute-force surface, and the uniqueness check makes enumeration uninteresting. We are not adding
`express-rate-limit` in this change.

### 3.5 Client flow

New component `frontend/src/components/auth/GoogleOnboardingFlow.jsx`.

Rendered by `GoogleAuthSuccess.jsx` as an overlay, after `login(userData, token, 'user')` succeeds.
Rendered via `ReactDOM.createPortal`, matching `AuthSuccessModal.jsx:231`.

**When it runs:** `isNewGoogleAccount === true && userData.role === 'user'`.
**When it is skipped:** master-key admins (`GoogleAuthSuccess.jsx:25-28` redirects before this point),
non-user roles, and returning Google accounts.

State machine, driven by a single `step` value:

```
'username' → 'password' → done
                 ↓
          'skip' (dismissal)
```

**Step 1 — "What should we call you?"**
- Input, prefilled with the current auto-generated username so the visitor can accept it by pressing
  Continue without typing.
- Live availability: `GET /api/auth/username/check?name=...` → `{ available: boolean }`. Debounced
  400ms. The route is mounted behind `protect` like every other route in `auth-routes.js:34-42`, so it
  is authenticated, not public. It returns only a boolean and never the account behind the name.
- Skip button: *"Keep my current name"*. Leaves the auto-generated username. Modal cannot be dismissed
  by backdrop click or Escape — the visitor must either confirm or explicitly keep.
  **Known dead end:** taking this path leaves a name the visitor cannot change later, because no other
  screen in the app exposes username editing (see §10). This is why the button reads *"Keep my current
  name"* rather than *"Skip"* — it states plainly that the name is being kept, not that the question is
  being dodged. Adding username editing to `UserProfile.jsx` is a follow-up, not this change.
- On success, `updateUser({ ...user, username })`.

**Step 2 — "Add a password?"**
Shown only when `hasPassword === false`.
- Explains the benefit: sign in with email even if Google is unavailable.
- Primary: *"Add a password"* → reveals a password form.
- Secondary: *"Maybe later"* → goes straight to done. This is the `Add Password later` branch the
  request asked for.
- The form reuses the existing `validatePassword` rules surfaced as inline errors (8+ chars, one
  uppercase, one number, one special character), so the modal and `UserProfile.jsx`'s *Add Password*
  panel accept and reject exactly the same passwords.
- Submit calls the existing `authAPI.updatePassword({ newPassword })`. **No `currentPassword` is sent** —
  `auth-controller.updatePassword:627` already skips that check when `user.password` is null. This step
  adds no new backend password logic.

**Done** → call `onComplete()` and navigate exactly as today (`GoogleAuthSuccess.jsx:43-49`).

**Failure handling:** every step is independently retryable. A failed username save leaves the modal on
step 1 with the error inline; a failed password save leaves the form filled. Neither loses the other
step's progress.

**Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on each step, matching
`LoginPage.jsx:116-118`. Escape and backdrop are disabled so focus cannot strand the visitor; the
explicit Skip / Maybe later buttons are the escape hatches. Focus moves to the step's heading on
transition.

### 3.6 `PUT /api/auth/username` and the `affectedRows` trap

This is the same defect that breaks the settings page (§4.4). `affectedRows === 0` means "the value was
already that", which for an idempotent save is a **success**.

`User.setUsername` returns `affectedRows > 0`, so the controller must not map `false` to a 400. It
verifies independently:

```js
const updated = await User.setUsername(req.user.id, cleanUsername);
const saved = await User.findById(req.user.id);
if (saved.username !== cleanUsername) return 500;
```

Read-back is the source of truth. This is deliberate and is called out here because the naive version
of this endpoint reintroduces the §4.4 bug.

### 3.7 Marking onboarding complete

`POST /api/auth/onboarding/complete` — `auth-routes.js`, guarded by `protect`.

```sql
UPDATE users SET google_onboarding_complete = TRUE, updated_at = NOW() WHERE id = ?
```

Called by the stepper once the visitor has reached **done** — regardless of which branches they took.
Skipping the username or skipping the password still completes onboarding; the flag means "this visitor
was offered the choice", not "this visitor did everything".

The endpoint is idempotent and idempotency is *required*: a dropped response followed by a retry must
not be able to un-complete the flag. It is a one-way `FALSE → TRUE` write with no unset path, and it is
only ever reached from an authenticated session.

**Failure to reach this endpoint is non-fatal.** The stepper navigates home regardless; the worst case
is the visitor sees the stepper again next sign-in.

### 3.8 Welcome email

New template in `backend/utils/email.js`, alongside the existing verification and reset templates.

**Subject:** `Welcome to Bulusan Zoo`
**Content:** confirms the account is active, names the account's username, and — when the visitor has no
password — states that they can set one from their profile. Includes the frontend profile URL.

Sent once, at the **first successful login**, for both paths:

| Path | Trigger | Gate column |
|---|---|---|
| Google onboarding | End of `GoogleOnboardingFlow`, via `POST /api/auth/onboarding/complete` | `google_onboarding_complete` transitions `FALSE → TRUE` |
| Local register | First `POST /api/auth/login` that succeeds for an account with `is_welcome_sent = FALSE` | `is_welcome_sent` |

**Add `users.is_welcome_sent BOOLEAN NOT NULL DEFAULT FALSE`** (`ensure-auth-schema.js`).

**Google accounts that already exist will receive this email.** Their `google_onboarding_complete` is
`FALSE` (§3.2), so the first time they run the stepper — which for them is their next Google sign-in —
the welcome fires. This is intended: they are the population that never got an onboarding moment at
all, and a welcome that names their chosen username is a reasonable re-introduction.

The gate is set **only after `sendEmailWithRetry` reports success**, so a transient SMTP failure does
not permanently consume the welcome. If delivery fails the flag stays `FALSE` and the next login retries.
`sendEmailWithRetry` already returns a real boolean (`email.js:123`) — unlike `sendNotificationEmail`,
which returns `true` unconditionally (`email.js:415`).

The Google path fires from the onboarding-complete endpoint rather than from login, because the request
puts the email *after* both modals. The local path fires from login because there are no modals to sit
between.

Delivery uses `sendEmailAsync` so a slow SMTP server cannot delay the response. **This is safe here but
not elsewhere** — see §4.3.

---

## 4. Part 2 — Visitor notifications

### 4.1 The notification service

New `backend/services/notification-service.js`. One entry point per audience.

```js
const { notifyUser, notifyManagement, broadcastToVisitors } = require('../services/notification-service');

await notifyUser(userId, 'reservation.confirmed', { reference: 'BK-1234' });
await broadcastToVisitors('event.announced', { title: 'Night Safari' });
await notifyManagement({ title, message, type, link });   // unchanged shape
```

Every entry takes a **type key** and a **data object**. Call sites never write `title`, `message`, or
`category` by hand. The service resolves all three from the catalog, which is the point: it makes the
type→preference mapping explicit and reviewable in one place instead of implicit across ten files.

**The catalog lives in `notification-service.js`, not in the model.** `notification-model.js` keeps only
persistence and preference resolution, and gains a required explicit `category` argument. This keeps the
policy table (what a notification *is*) separate from the mechanism (how it is stored and delivered), and
means `notification-model.js` never needs to know that `event.announced` exists.

The `notifications` table has no `category` column, and does not need one — the category is a
delivery-time gate, not stored data. Existing rows are unaffected by any catalog change.

### 4.2 The catalog

Each entry declares its category, whether it emails by default, and its copy template.

| Type key | Category | Email | Recipients | Trigger |
|---|---|---|---|---|
| `event.announced` | `eventReminders` | yes | all visitors | event created |
| `event.updated` | `eventReminders` | yes | all visitors | event fields changed |
| `event.cancelled` | `eventReminders` | yes | all visitors | event deleted |
| `reservation.confirmed` | `ticketUpdates` | yes | owner | status → confirmed |
| `reservation.cancelled` | `ticketUpdates` | yes | owner | status → cancelled |
| `reservation.completed` | `ticketUpdates` | yes | owner | status → completed |
| `reservation.no_show` | `ticketUpdates` | yes | owner | status → no_show |
| `reservation.verification` | `ticketUpdates` | yes | owner | verification changed |
| `ticket.paid` | `ticketUpdates` | yes | owner | marked as paid |
| `ticket.checked_in` | `ticketUpdates` | yes | owner | QR scanned / marked used |
| `appeal.reviewed` | `null` | yes | owner | appeal approved/declined |
| `post.moderated` | `null` | yes | author | post approved/declined |
| `message.replied` | `null` | yes | owner | staff responded to support message |
| `account.password_set` | `null` | yes | owner | password created or changed |
| `marketing.broadcast` | `marketing` | **no** | all visitors | staff newsletter send |

**The `eventReminders` collision is resolved by naming.** Today `createEvent` sends `type: 'event'`,
which `notification-model.js:247` resolves to the `eventReminders` preference — so a visitor who
switches off *Event Reminders* silently stops receiving *new event announcements*. Splitting
`event.announced` from any future reminder type means the two can be governed separately.

`marketing.broadcast` is the only entry that defaults to email-off; `notification-model.js:259` already
gates marketing behind `settings.marketingEmails`.

### 4.3 Email delivery becomes honest

`sendNotificationEmail` (`email.js:390-416`) unconditionally returns `true` and hands off to
`sendEmailAsync`, which resolves into `setImmediate` with no reporting channel. A notification is
therefore recorded as delivered whether or not SMTP accepted it.

The service replaces it with a promise-returning call:

```js
const delivered = await sendNotificationEmail(email, firstName, title, message, link);
```

Backed by `sendEmailWithRetry` (`email.js:75`), which already returns `true`/`false` after 3 attempts
and stops early on `EAUTH`.

**The push insert is never gated on email success.** If SMTP is down, the in-app notification still
persists and the visitor still sees it in the bell. Email failure is logged with the notification id and
the recipient, and surfaced on `GET /api/health?full=true` as a counter — not swallowed.

This directly addresses the analysis finding that notification failures are invisible.

### 4.4 Fixing the settings page

Three defects, all confirmed in code:

**(a) `affectedRows` false failure.** `User.updateSettings` (`user-model.js:479-485`) returns
`affectedRows > 0`. MySQL reports `0` when the stored JSON is byte-identical or when `updated_at = NOW()`
lands in the same second. `user-controller.js:113` maps that to `HTTP 400`, `Settings.jsx:135-139`
catches it, reverts the toggle, and shows *"Couldn't update settings."* The save **succeeded**; the UI
reports it failed.

Fix — same read-back pattern as §3.6:

```js
const savedKeys = Object.keys(nextSettings);
await User.updateSettings(req.user.id, nextSettings);
const saved = await User.getSettings(req.user.id);
const mismatched = savedKeys.some(k => !saved || saved[k] !== nextSettings[k]);
if (mismatched) return 500;
```

and the model returns `true` on a successful write regardless of `affectedRows`.

**(b) No in-flight guard, stale-closure revert.** `Settings.jsx:128-141` fires a request per toggle with
no pending state and reverts with `setNotifications(notifications)` — the closure value, not the value
actually persisted. Two fast toggles can leave the UI disagreeing with the server.

Fix: a `pendingKeys` `Set` disables toggles while a save is in flight; revert restores from the
server-confirmed snapshot returned by the read-back, not from a closure.

**(c) Defaults defined twice.** `DEFAULT_SETTINGS` (`notification-model.js:4-10`) and the `useState`
initialiser (`Settings.jsx:66-72`) are separate lists that can drift.

Fix: `GET /api/users/settings` returns the **merged** object — `DEFAULT_SETTINGS` overlaid with whatever
is stored — instead of `null` for users who never saved (`user-model.js:476`). The client's `useState`
initialiser keeps the same five keys as a loading placeholder, but the server response becomes
authoritative.

Each toggle now shows a per-row saving state, and `aria-live="polite"` announces the result, which
also fixes the missing live-region feedback noted in the accessibility analysis.

### 4.5 Coverage gaps closed

| Gap | Location | Fix |
|---|---|---|
| Event edit is invisible | `admin-controller.js:418` `updateEvent` — no notification at all | `event.updated` |
| Event deletion is invisible | `admin-controller.js:434` `deleteEvent` | `event.cancelled` |
| Reservation verification silent on one path | `reservation-controller.js:581` `updateVerificationStatus` sends nothing, while `admin-controller.js:1219` and `staff-controller.js:674` do | `reservation.verification` on all three |
| `completed` / `no_show` produce no notice | `reservation-controller.js:480-496` only handles confirmed/cancelled | `reservation.completed`, `reservation.no_show` |
| Ticket marked used is silent | `staff-controller.js` `markTicketUsed` | `ticket.checked_in` |
| Animal / plant CRUD | `admin-controller.js:332-506` | **No broadcast.** Announcements only, per the agreed scope — these stay silent for visitors. |
| `admin-controller.updateTicketStatus` and `staff-controller.updateTicketStatus` are near-identical duplicates (`admin-controller.js:533-576`, `staff-controller.js:335-381`) | — | Both route through the service. The duplication itself is not refactored away in this change — that is separate work on an already-oversized file. |

`community-controller.js` moderation and `message-controller.js` replies already notify correctly;
they are migrated to the catalog for consistency, not because they are broken.

### 4.6 Client changes

Minimal. The bell in `Header.jsx` already polls `GET /api/users/notifications` every 30s
(`Header.jsx:248-259`) and needs no change — new notification types flow through unchanged.

One addition: `Header.jsx` maps notification `type` to an icon/colour. New type keys need entries in
that map, with a documented fallback so an unknown type degrades to the neutral icon rather than
rendering nothing.

---

## 5. Configuration

No new environment variables. No new dependencies.

`.env.example` gains nothing; both new columns are created by the runtime-DDL ensure scripts.

The SMTP variables already present are the only ones this feature depends on. If SMTP is unconfigured,
`sendEmailWithRetry` throws from `getTransporter` (`email.js:14-16`) — the service catches this per
notification so one missing variable cannot take down a reservation write.

---

## 6. Failure handling summary

| Failure | Behaviour |
|---|---|
| SMTP unconfigured or down | In-app notification still persists. Email failure logged and counted on `/api/health?full=true`. The originating request still succeeds. |
| `ensure-auth-schema.js` cannot add a column | Caught by the existing `.catch` at `server.js:172`; server still starts. Onboarding silently disabled — the endpoint 500s and the stepper's failure path shows an error. Documented limitation, not a crash. |
| Onboarding-complete request drops | Non-fatal. Visitor reaches home; stepper reappears next sign-in. |
| Username save returns 0 rows | Read-back at §3.6 distinguishes "already set" from "failed". |
| Client navigates away mid-stepper | `useEffect` cleanup clears the portal. Reappears next sign-in because the flag was never set. |
| Two visitors pick the same name simultaneously | `uk_users_username` unique key is the final arbiter; the controller's `findByUsername` check narrows the window but does not replace it. Duplicate-key error is caught and returned as 409. |

---

## 7. Testing

New tests in `backend/tests/`, matching the existing `node:test` + `node:assert/strict` style.

**Notification service** — `notification-service.test.js`
- Catalog lookup: every key resolves to a category, a title, and a message.
- An unknown type key throws rather than silently sending an empty notification.
- Template substitution renders the reference into the body.
- `broadcastToVisitors` respects `marketingEmails === false`.

**Email change** — `notification-service.test.js` or a new `email.test.js`
- `sendNotificationEmail` resolves `false` on SMTP failure instead of `true`.
- A marketing-category notification is not emailed when `marketingEmails` is off.

**Settings read-back** — `user-controller.test.js`
- `updateSettings` returns `success: true` when `affectedRows` is 0 but the stored value already matches.
- `getSettings` returns merged defaults, not `null`, for a user with no stored settings.

**Username** — `auth.test.js`
- Rejects empty, <3, >50, bad charset, and reserved names with 400.
- Returns 409 on a taken name.
- Succeeds when the name is unchanged (idempotent re-save).

**Onboarding gate** — `auth.test.js`
- `isNewGoogleAccount` is `true` only when `google_onboarding_complete` is `FALSE`.
- It is `false` for a returning Google account.

The existing suite (`walk-in-service`, `helpers`, `esc-pos-service`, `jiji-prompt-service`) must stay
green. `npm test` from `backend/`.

**No frontend tests** — the project has no frontend test runner and adding one is out of scope. The
stepper is verified manually against dev and prod.

---

## 8. Rollout

1. Schema ensure scripts run at boot and are idempotent. Deploy backend first.
2. `ensure-auth-schema.js` adds both columns; `ensure-notification-schema.js` is unchanged.
3. Deploy frontend; the stepper is gated on a flag the old backend does not send, so if the frontend
   ships first the stepper simply never renders. **Backend-before-frontend is not strictly required** —
   frontend-before-backend is safe too, but the reverse is not: a new backend sending
   `isNewGoogleAccount` to an old frontend just ignores the field.
4. Existing Google accounts see the stepper once on their next sign-in. Expected.
5. Existing local accounts are untouched; their first login after deploy receives the welcome email.

No feature flag. The gate column *is* the flag, and it is only ever read to decide whether to show a
one-time modal to a new account.

---

## 9. Files affected

**New**
- `backend/services/notification-service.js`
- `backend/tests/notification-service.test.js`
- `backend/tests/auth.test.js`
- `backend/tests/user-controller.test.js`
- `frontend/src/components/auth/GoogleOnboardingFlow.jsx`

**Modified — backend**
- `backend/database/ensure-auth-schema.js` — two new columns
- `backend/database/bulusanzoodatabasedevelopment.sql` — same, for fresh installs
- `backend/utils/email.js` — welcome template; `sendNotificationEmail` returns a real boolean
- `backend/models/user-model.js` — `setUsername`, `markOnboardingComplete`, `markWelcomeSent`,
  `getSettings` default merge, `updateSettings` `affectedRows` fix
- `backend/models/notification-model.js` — catalog-backed `create`, honest email result
- `backend/controllers/auth-controller.js` — `setUsername`, `completeOnboarding`,
  welcome email on first login
- `backend/controllers/google-auth-controller.js` — `isNewGoogleAccount` in handoff
- `backend/controllers/user-controller.js` — settings read-back
- `backend/controllers/admin-controller.js` — event update/delete; ticket status
- `backend/controllers/staff-controller.js` — ticket status, marked-used
- `backend/controllers/reservation-controller.js` — verification, completed/no_show
- `backend/controllers/community-controller.js`, `message-controller.js` — migrate to catalog
- `backend/routes/auth-routes.js` — three new routes
- `backend/server.js` — health counter for email failures

**Modified — frontend**
- `frontend/src/pages/auth/GoogleAuthSuccess.jsx` — render the stepper
- `frontend/src/services/api-client.js` — `setUsername`, `checkUsername`, `completeOnboarding`
- `frontend/src/pages/user/Settings.jsx` — pending state, read-back, aria-live
- `frontend/src/components/Header.jsx` — new type keys in the icon map
- `frontend/src/context/AuthContext.jsx` — unchanged; `updateUser` already exists and is reused

---

## 10. Open questions deferred

- The `AdminX`/`StaffX` frontend duplication and the `updateTicketStatus` controller duplication are
  real but separate. Both files are already over 1200 and 800 lines; folding refactoring into a
  behavioural fix would make the change harder to review.
- `utils/api.js` (184 lines, zero imports, exports a weaker duplicate `authAPI`) is dead code that
  should be deleted. Not part of this change.
- **Username editing outside the onboarding stepper.** A visitor who picks *"Keep my current name"*,
  or any account that wants to change their name later, has no UI for it. `PUT /api/auth/username`
  exists and is correct; only the entry points are missing. Wiring it into `UserProfile.jsx` is a
  small, natural follow-up that reuses everything built here.
- **Existing Google accounts and the welcome email.** Covered in §3.8 — they will get one. Flagging it
  here so it is a decision on record rather than a surprise.