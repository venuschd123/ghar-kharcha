/**
 * Pro code validation — offline, hash-based.
 *
 * HOW IT WORKS:
 *   1. Developer generates codes offline: any string starting with "GK" + 8+ random chars
 *   2. For each code: hash = SHA256(SECRET_SALT + code.toUpperCase())
 *   3. Store the HASH in VALID_CODE_HASHES (never store the actual code)
 *   4. Validation: compute hash of entered code, check Set membership
 *
 * GENERATING NEW CODES (run locally):
 *   node -e "
 *     const c = require('crypto');
 *     const SALT = 'gk_pro_2026_india_v1';
 *     const code = 'GK' + c.randomBytes(4).toString('hex').toUpperCase();
 *     const hash = c.createHash('sha256').update(SALT + code).digest('hex');
 *     console.log(code, '->', hash);
 *   "
 *   Add the hash to VALID_CODE_HASHES. Give the code to the buyer.
 *
 * TRADEOFF: The salt is hardcoded (accepted — this is a fully offline app with no server).
 * A determined attacker with the source could brute-force, but the attack surface is small
 * for ₹299 software and requires decompiling + significant compute.
 */

const SECRET_SALT = 'gk_pro_2026_india_v1';

// SHA256 hashes of valid purchase codes (codes never stored here)
// Generated 2026-06-01. Add new hashes as new codes are sold.
const VALID_CODE_HASHES = new Set([
  'c8b1c49efce71d6d0b76e2dd5efd7481fa0689991a7b55cf022ad72374615355',
  '64ee5e4f0f576d4b28ae4aac4dd2a071630559c0c1c2b2faa172888b6c81d961',
  '7eb25041367974858e42e60e85a9b8b31598178e91a9b28f0b4bf1093e22dcd6',
  'dd90aff4d6e3abf6839d5fef81fa2487737113eaa9c98f4096be9a2f0e1a5b0d',
  '51e4008f685ed4fb550464e3bb5199c12a4209f84b6d75d870270b8d35c246e8',
  'f69aa7206df6d528e7875328f99fdab3168cac7d5fe9b3716c971b332d35a383',
  'd94e3b4689c7196a4c143f3268e410f4abadcc9744160553647ec480268fee80',
  'ca28cf082b399178493b0f10a7a15a3c835cdd2e1f494dee9ecc3dc5609ef894',
  'f18867c5557b272b8340119c2a1d830a80362c36d3e543181f5f1029b17bf3d8',
  'af83de419c6dcb826e9a257f3407126c708fda74539cbde444e9286a6671ccf9',
  '2ffda91b2fad677ecd6151490a4871ac1eaf03122638814250082be0af38e3b8',
  '7229d1280d63a2f8152e26f99a401f49af42dd019902db0173143446ca7055a3',
  '5abc709bb8189c72bb8b948d25ec5ee18b1464517fc295e15039207ee4f91874',
  '1563b3c5b8bf745ce76eb2b512b97ba8a53a44f5b85da78825d5752b075533ea',
  '326e01508853ca5f5d3e23f15d2743c9721a73bf6870e49736e3a2477caabb76',
  'a20e9d82d9275f4234d8d42e7b878c7d025d10db38be85eb27f9523852c19370',
  'f366548ceda1cc0caf9c1e1eef472e899f061c2779183d9b5c34fbe50789aad1',
  'f35e78ffded9df476175c20d7f1cbb5f41c3ac987f080eabbb67a6093e407e88',
  '0d090371a1a1aa768fef3c2000062e7c72ddd660a72f35af30e7d59375e30985',
  '2e44d72237a19e823dcf8ad388754d84a7ba7ed7f0f15949de90d97b4d162c6a',
]);

const MAX_ATTEMPTS = 5;
const LOCKOUT_HOURS = 24;

async function computeHash(code) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(SECRET_SALT + code.toUpperCase())
  );
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate a pro code. Returns { valid: boolean, locked: boolean, attemptsLeft: number }.
 * Enforces rate limiting: after MAX_ATTEMPTS wrong guesses in LOCKOUT_HOURS, locks.
 */
export async function validateProCode(code, db) {
  const attemptRec = await db.settings.get('pro_code_attempts');
  const attemptData = attemptRec?.value ? JSON.parse(attemptRec.value) : { count: 0, firstAt: null };

  // Check lockout
  if (attemptData.count >= MAX_ATTEMPTS && attemptData.firstAt) {
    const hoursSince = (Date.now() - attemptData.firstAt) / 3600000;
    if (hoursSince < LOCKOUT_HOURS) {
      return { valid: false, locked: true, attemptsLeft: 0 };
    }
    // Lockout expired — reset
    attemptData.count = 0;
    attemptData.firstAt = null;
  }

  const hash = await computeHash(code.trim());
  const valid = VALID_CODE_HASHES.has(hash);

  if (!valid) {
    const newCount = attemptData.count + 1;
    await db.settings.put({
      key: 'pro_code_attempts',
      value: JSON.stringify({
        count: newCount,
        firstAt: attemptData.firstAt ?? Date.now(),
      }),
    });
    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - newCount);
    const locked = newCount >= MAX_ATTEMPTS;
    return { valid: false, locked, attemptsLeft };
  }

  // Valid — reset attempt counter
  await db.settings.delete('pro_code_attempts');
  return { valid: true, locked: false, attemptsLeft: MAX_ATTEMPTS };
}
