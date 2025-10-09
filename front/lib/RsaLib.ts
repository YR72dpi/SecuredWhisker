import { Buffer64 } from './Buffer64';

/**
 * Interface for RSA key pair in PEM format.
 */
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Utility class for RSA-OAEP encryption, decryption, and key pair generation.
 */
export class RsaLib {
  /**
   * Encrypts a plaintext string using an RSA public key in PEM format.
   * @param text - The plaintext to encrypt.
   * @param publicKeyPem - The PEM-encoded RSA public key (SPKI format).
   * @returns Base64-encoded encrypted data.
   * @throws Error if encryption fails or inputs are invalid.
   */
  static async textToCrypted(text: string, publicKeyPem: string): Promise<string> {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text: Must be a non-empty string');
    }
    if (!publicKeyPem || typeof publicKeyPem !== 'string') {
      throw new Error('Invalid public key: Must be a non-empty string');
    }

    try {
      const publicKey = await this.importPublicKey(publicKeyPem);
      const encodedText = new TextEncoder().encode(text);
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP', hash: { name: 'SHA-256' } } as RsaOaepParams,
        publicKey,
        encodedText
      );
      return Buffer64.arrayBufferToBase64(encrypted);
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts a Base64-encoded encrypted string using an RSA private key in PEM format.
   * @param encryptedText - The Base64-encoded encrypted data.
   * @param privateKeyPem - The PEM-encoded RSA private key (PKCS#8 format).
   * @returns Decrypted plaintext string.
   * @throws Error if decryption fails or inputs are invalid.
   */
  static async cryptedToText(encryptedText: string, privateKeyPem: string): Promise<string> {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new Error('Invalid encrypted text: Must be a non-empty string');
    }
    if (!privateKeyPem || typeof privateKeyPem !== 'string') {
      throw new Error('Invalid private key: Must be a non-empty string');
    }

    try {
      const privateKey = await this.importPrivateKey(privateKeyPem);
      const encryptedBytes = Buffer64.base64ToArrayBuffer(encryptedText) as BufferSource;
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP', hash: { name: 'SHA-256' } } as RsaOaepParams,
        privateKey,
        encryptedBytes // Uint8Array is a valid BufferSource
      );
      return new TextDecoder().decode(decrypted);
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generates an RSA-OAEP key pair.
   * @param keySize - The key size in bits (default: 2048).
   * @param publicExponent - The public exponent (default: 65537).
   * @returns A KeyPair object with PEM-encoded public and private keys.
   * @throws Error if key generation fails.
   */
  static async generateRSAKeyPair(
    keySize: number = 2048,
    publicExponent: Uint8Array = new Uint8Array([1, 0, 1])
  ): Promise<KeyPair> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: keySize,
          publicExponent,
          hash: 'SHA-256',
        },
        true, // Extractable
        ['encrypt', 'decrypt']
      );

      const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);

      const privateKeyBase64 = Buffer64.arrayBufferToBase64(privateKeyBuffer);
      const publicKeyBase64 = Buffer64.arrayBufferToBase64(publicKeyBuffer);

      return {
        publicKey: this.formatPem(publicKeyBase64, 'PUBLIC'),
        privateKey: this.formatPem(privateKeyBase64, 'PRIVATE'),
      };
    } catch (error: any) {
      throw new Error(`Key generation failed: ${error.message}`);
    }
  }

  /**
   * Formats a Base64 string as a PEM-encoded key.
   * @param base64 - The Base64-encoded key data.
   * @param keyType - The type of key ('PUBLIC' or 'PRIVATE').
   * @returns PEM-formatted string.
   * @throws Error if the Base64 input is invalid.
   */
  private static formatPem(base64: string, keyType: 'PUBLIC' | 'PRIVATE'): string {
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid Base64 input: Must be a non-empty string');
    }
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${keyType} KEY-----\n${lines.join('\n')}\n-----END ${keyType} KEY-----\n`;
  }

  /**
   * Imports a PEM-encoded RSA public key (SPKI format).
   * @param pem - The PEM-encoded public key.
   * @returns A CryptoKey for encryption.
   * @throws Error if the public key is invalid or import fails.
   */
  private static async importPublicKey(pem: string): Promise<CryptoKey> {
    if (!pem || typeof pem !== 'string') {
      throw new Error('Invalid PEM public key: Must be a non-empty string');
    }
    if (!pem.includes('-----BEGIN PUBLIC KEY-----')) {
      throw new Error('Invalid PEM public key: Missing expected header');
    }

    try {
      const base64 = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '');
      if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
        throw new Error('Invalid PEM public key: Contains invalid Base64 characters');
      }

      const binaryDer = Buffer64.base64ToArrayBuffer(base64) as BufferSource;
      return await window.crypto.subtle.importKey(
        'spki',
        binaryDer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
      );
    } catch (error: any) {
      throw new Error(`Failed to import public key: ${error.message}`);
    }
  }

  /**
   * Imports a PEM-encoded RSA private key (PKCS#8 format).
   * @param pem - The PEM-encoded private key.
   * @returns A CryptoKey for decryption.
   * @throws Error if the private key is invalid or import fails.
   */
  static async importPrivateKey(pem: string): Promise<CryptoKey> {

    if (!pem || typeof pem !== 'string') {
      throw new Error('Invalid PEM private key: Must be a non-empty string');
    }
    if (!pem.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid PEM private key: Missing PKCS#8 header (BEGIN PRIVATE KEY)');
    }
    if (pem.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      throw new Error(
        'PKCS#1 keys (RSA PRIVATE KEY) are not supported. Convert to PKCS#8 using: ' +
        'openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt'
      );
    }

    try {
      const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
      if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
        throw new Error('Invalid PEM private key: Contains invalid Base64 characters');
      }

      const binaryDer = Buffer64.base64ToArrayBuffer(base64) as BufferSource;
      return await window.crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt']
      );
    } catch (error: any) {
      throw new Error(`Failed to import private key: ${error.message}`);
    }
  }
}