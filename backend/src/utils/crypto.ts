import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getSecretKey(): Buffer {
  const seed = process.env.CHAT_ENCRYPTION_KEY || process.env.JWT_SECRET || 'chronodesk_secure_chat_encryption_key_2026_aes256';
  return crypto.createHash('sha256').update(seed).digest();
}

/**
 * Encrypts plain text into an AES-256-GCM cipher string format: "enc:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 */
export function encryptMessage(text: string): string {
  if (!text) return text;
  try {
    const key = getSecretKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return text;
  }
}

/**
 * Decrypts an encrypted message string format "enc:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 */
export function decryptMessage(encryptedText: string): string {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.startsWith('enc:')) {
    return encryptedText;
  }
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 4) return encryptedText;
    const [, ivHex, authTagHex, cipherHex] = parts;
    const key = getSecretKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return encryptedText;
  }
}
