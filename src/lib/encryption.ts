import crypto from 'crypto';

/**
 * Enterprise-grade AES-256-CBC Field-Level Encryption Utility
 * 
 * Used for encrypting sensitive identifiable government credentials
 * (such as APAAR ID and PAN Numbers) at rest before storage in the database.
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size in bytes

/**
 * Resolves or derives a consistent 32-byte (256-bit) buffer key from the environment.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;

  if (!envKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_KEY must be defined in production environment variables.');
    }
    // Safe deterministic development fallback if key is not yet set in .env
    return crypto.createHash('sha256').update('townhall-development-secure-encryption-key-salt').digest();
  }

  // If 64-character hex string (32 bytes raw)
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }

  // If exact 32-character utf8 string (32 bytes)
  if (Buffer.byteLength(envKey, 'utf8') === 32) {
    return Buffer.from(envKey, 'utf8');
  }

  // For any passphrase/arbitrary length, derive a standard 256-bit SHA-256 key
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * Generates a unique, cryptographically random initialization vector (IV) for each encryption.
 * 
 * @param text The plaintext string to encrypt (e.g., APAAR ID or PAN number)
 * @returns Serialized encrypted string in the format `<iv_hex>:<ciphertext_hex>`
 */
export function encryptData(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted ciphertext hash formatted as `<iv_hex>:<ciphertext_hex>` back to plaintext.
 * 
 * @param hash The encrypted string (iv:ciphertext)
 * @returns Plaintext decrypted string
 */
export function decryptData(hash: string): string {
  if (!hash || typeof hash !== 'string') {
    return hash;
  }

  const parts = hash.split(':');
  if (parts.length !== 2) {
    // If not encrypted or in invalid format, return input as fallback
    return hash;
  }

  try {
    const [ivHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt data payload:', error);
    return hash;
  }
}

/**
 * Generates a secure, cryptographically random print tracking audit identifier.
 * Format: PRNT-<TIMESTAMP>-<RANDOM_HEX>
 */
export function generatePrintId(prefix: string = 'PRNT'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomEntropy = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${randomEntropy}`;
}

/**
 * Masks an Indian Permanent Account Number (PAN) according to privacy compliance standards.
 * Format: e.g. "ABCDE1234F" -> "XXXXX1234X"
 * 
 * @param pan Raw plaintext PAN string
 * @returns Masked PAN string (e.g., "XXXXX1234X") or "—" if not provided
 */
export function maskPanNumber(pan: string | null | undefined): string {
  if (!pan || typeof pan !== 'string') {
    return '—';
  }

  const clean = pan.trim().toUpperCase();
  if (!clean) return '—';

  if (clean.length === 10) {
    const middleFour = clean.substring(5, 9);
    return `XXXXX${middleFour}X`;
  }

  if (clean.length > 4) {
    return `${'X'.repeat(clean.length - 4)}${clean.slice(-4)}`;
  }

  return clean;
}

/**
 * Creates an HMAC-SHA256 signed session token for the Director authentication cookie.
 * Token format: `<payload_base64>.<signature_hex>`
 */
export function signSessionToken(payload: string): string {
  const key = getEncryptionKey();
  const payloadBase64 = Buffer.from(payload, 'utf8').toString('base64url');
  const hmac = crypto.createHmac('sha256', key).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${hmac}`;
}

/**
 * Verifies the validity and cryptographic signature of a director session token.
 * 
 * @param token Signed token from director_session cookie
 * @param maxAgeMs Maximum allowed token age in milliseconds (default: 8 hours)
 */
export function verifySessionToken(
  token: string | null | undefined,
  maxAgeMs: number = 8 * 60 * 60 * 1000
): { valid: boolean; payload?: string; issuedAt?: number } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }

  try {
    const [payloadBase64, signatureHex] = parts;
    const key = getEncryptionKey();
    const expectedHmac = crypto.createHmac('sha256', key).update(payloadBase64).digest('hex');

    const expectedBuffer = Buffer.from(expectedHmac, 'hex');
    const actualBuffer = Buffer.from(signatureHex, 'hex');

    if (
      expectedBuffer.length !== actualBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      return { valid: false };
    }

    const payload = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    
    // Payload expected format: director:<issuedAtTimestamp>
    const [role, timestampStr] = payload.split(':');
    if (role !== 'director' || !timestampStr) {
      return { valid: false };
    }

    const issuedAt = parseInt(timestampStr, 10);
    if (isNaN(issuedAt)) {
      return { valid: false };
    }

    const now = Date.now();
    if (now - issuedAt > maxAgeMs || issuedAt > now + 60000) {
      // Expired or clock skew > 1 min
      return { valid: false };
    }

    return { valid: true, payload, issuedAt };
  } catch (err) {
    console.error('Session token verification error:', err);
    return { valid: false };
  }
}

