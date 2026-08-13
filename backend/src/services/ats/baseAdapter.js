const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// Default 32-byte secret key for development AES encryption
const ENCRYPTION_KEY = Buffer.from(
  (process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef').slice(0, 64),
  'hex'
);

class BaseATSAdapter {
  constructor(company) {
    this.company = company;
  }

  /**
   * Encrypt sensitive ATS API Key at rest using AES-256-GCM
   */
  static encryptKey(plainTextKey) {
    if (!plainTextKey) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plainTextKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt ATS API Key from storage
   */
  static decryptKey(cipherTextKey) {
    if (!cipherTextKey) return null;
    if (!cipherTextKey.includes(':')) return cipherTextKey; // plain fallback if unencrypted demo string
    
    try {
      const [ivHex, authTagHex, encryptedHex] = cipherTextKey.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      console.error('[ATS BaseAdapter] Failed to decrypt API key:', e.message);
      return cipherTextKey;
    }
  }

  async submitCandidate({ seeker, posting, employee }) {
    throw new Error('submitCandidate method must be implemented by ATS subclass');
  }
}

module.exports = BaseATSAdapter;
