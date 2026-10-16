/**
 * Generate strong secrets for backend/.env.
 *
 *   node scripts/generate-secrets.js
 *
 * Prints values to copy into your .env. Nothing is written to disk and nothing
 * is printed to a log file, so the values never reach git history.
 */

const crypto = require('crypto');

// 64 random bytes -> 128 hex characters. Well above the 32-character minimum.
const generate = () => crypto.randomBytes(64).toString('hex');

console.log(`
Bulusan Zoo - secret generator
================================

Copy the values below into backend/.env, replacing the placeholder.
Keep .env out of git (it already is - see backend/.gitignore).

JWT_SECRET
  Rotating this signs out every user, invalidates outstanding single-use
  links, and changes the public-id cipher key. Do it once, deliberately.

PUBLIC_ID_SECRET
  Optional. Leave it unset to derive a distinct key from JWT_SECRET.
  Set it only if you need to rotate ID encryption independently.

RESERVATION_QR_SECRET
  Optional. Leave it unset to derive a distinct key from JWT_SECRET.
  NOTE: setting this for the first time changes the QR signing key, which
  invalidates reservation QR codes that were already issued.
`);

console.log('JWT_SECRET=' + generate());
console.log('PUBLIC_ID_SECRET=' + generate());
console.log('RESERVATION_QR_SECRET=' + generate());
console.log(`
Verify nothing leaked into git:
  git check-ignore backend/.env && echo "backend/.env is ignored"
`);