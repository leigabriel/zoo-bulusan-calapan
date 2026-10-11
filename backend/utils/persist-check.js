/**
 * Idempotent writes report affectedRows === 0 when the stored value already equals
 * the attempted one, which means "already saved" rather than "failed". Callers use
 * this helper to confirm a write by reading the value back instead.
 *
 * @param {object|null|undefined} readBack - value re-read from the database
 * @param {object} attempted - key/value pairs that were meant to be written
 * @returns {boolean} true only when readBack is an object matching every attempted key
 */
const checkPersisted = (readBack, attempted) => {
    if (!readBack || typeof readBack !== 'object') return false;
    return Object.entries(attempted).every(([key, value]) => readBack[key] === value);
};

module.exports = { checkPersisted };