import { AesLib } from "../Crypto/AesLib";

/**
 * Dérive une clé AES à partir d'un mot de passe en utilisant PBKDF2
 */
export class PasswordKeyDerivation {

  static async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array
  ): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Importer le mot de passe comme clé de base
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Dériver une clé AES-GCM à partir du mot de passe
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000, // Nombre d'itérations (ajustez selon vos besoins de sécurité)
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Exporter la clé en base64
    return await AesLib.exportKey(aesKey);
  }

  static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }
}