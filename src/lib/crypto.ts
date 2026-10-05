import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "default_dev_secret_key_32_bytes_long!!";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt sensitive text (such as WhatsApp access tokens) at rest
 * Returns string in format: iv:ciphertext:authTag (hex encoded)
 */
export function encryptText(plaintext: string): string {
  if (!plaintext) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/**
 * Decrypt text encrypted with encryptText
 */
export function decryptText(encryptedBlob: string): string {
  if (!encryptedBlob) return "";
  const parts = encryptedBlob.split(":");
  if (parts.length !== 3) {
    // If not encrypted or invalid format (legacy/plain), return as-is for resilience
    return encryptedBlob;
  }

  const [ivHex, ciphertextHex, authTagHex] = parts;
  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err);
    return "";
  }
}
