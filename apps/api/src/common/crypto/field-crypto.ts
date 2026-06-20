import * as crypto from "crypto";

/**
 * Authenticated field-level encryption for PII at rest (e.g. seller bank details).
 *
 * - AES-256-GCM (confidentiality + integrity).
 * - Key comes from FIELD_ENCRYPTION_KEY env (64 hex chars = 32 bytes).
 * - Stored format: `enc:v1:<iv b64>:<authTag b64>:<ciphertext b64>`.
 *
 * The `enc:v1:` prefix lets decrypt() pass through legacy plaintext rows
 * unchanged, so existing data keeps working until it is re-saved (lazy migration).
 */

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const hex = process.env["FIELD_ENCRYPTION_KEY"];
  if (!hex || hex.length !== 64) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY must be set to 64 hex characters (32 bytes). Generate with: openssl rand -hex 32"
    );
  }
  cachedKey = Buffer.from(hex, "hex");
  return cachedKey;
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

/** Decrypts a stored value. Plaintext (non-prefixed) values are returned unchanged. */
export function decryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!isEncrypted(value)) return value; // legacy plaintext — pass through
  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return value;
  const [ivB64, tagB64, ctB64] = parts;
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64!, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64!, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ctB64!, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
