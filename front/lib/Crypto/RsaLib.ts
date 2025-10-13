import { Buffer64 } from "../Buffer64";

export type KeyPair = {
  publicKey: string
  privateKey: string
}

export class RsaLib {

  static async textToCrypted(text: string, publicKeyPem: string): Promise<string> {
    if (!text || typeof text !== 'string') {
      throw new Error("Invalid input: 'text' must be a non-empty string.");
    }
    if (!publicKeyPem || typeof publicKeyPem !== 'string') {
      throw new Error("Invalid input: 'publicKeyPem' must be a non-empty string.");
    }

    try {
      const publicKey = await RsaLib.importPublicKey(publicKeyPem);
      const encoded = new TextEncoder().encode(text);
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
          hash: { name: "SHA-256" }
        } as RsaOaepParams,
        publicKey,
        encoded
      );
      return Buffer64.arrayBufferToBase64(encrypted);
    } catch (error: any) {
      throw new Error(`Error encrypting text: ${error.message}`);
    }
  }

  static async cryptedToText(encryptedText: string, privateKeyPem: string): Promise<string> {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new Error("Invalid input: 'encryptedText' must be a non-empty string.");
    }
    if (!privateKeyPem || typeof privateKeyPem !== 'string') {
      throw new Error("Invalid input: 'privateKeyPem' must be a non-empty string.");
    }

    try {
      const privateKey = await RsaLib.importPrivateKey(privateKeyPem);
      const encryptedBuffer = Buffer64.base64ToArrayBuffer(encryptedText) as BufferSource;
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
          hash: { name: "SHA-256" }
        } as RsaOaepParams,
        privateKey,
        encryptedBuffer
      );
      return new TextDecoder().decode(decrypted);
    } catch (error: any) {
      throw new Error(`Error decrypting text: ${error.message}`);
    }
  }

  static generateRSAKeyPair = async (
    keySize: number = 2048,
    exponent: Uint8Array = new Uint8Array([1, 0, 1])
  ): Promise<KeyPair> => {
    if (!Number.isInteger(keySize) || keySize < 2048) {
      throw new Error("Invalid input: 'keySize' must be an integer greater than or equal to 2048.");
    }
    if (!(exponent instanceof Uint8Array)) {
      throw new Error("Invalid input: 'exponent' must be a Uint8Array.");
    }

    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: keySize,
          publicExponent: exponent,
          hash: 'SHA-256'
        } as RsaHashedKeyGenParams,
        true,
        ['encrypt', 'decrypt']
      );

      const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);

      const privateKeyBase64 = Buffer64.arrayBufferToBase64(privateKeyBuffer);
      const publicKeyBase64 = Buffer64.arrayBufferToBase64(publicKeyBuffer);

      const privateKeyPem = this.formatPem(privateKeyBase64, 'PRIVATE');
      const publicKeyPem = this.formatPem(publicKeyBase64, 'PUBLIC');

      return {
        publicKey: publicKeyPem,
        privateKey: privateKeyPem
      };
    } catch (error: any) {
      throw new Error(`Error generating RSA key pair: ${error.message}`);
    }
  }

  private static formatPem(base64: string, type: "PRIVATE" | "PUBLIC"): string {
    if (!base64 || typeof base64 !== 'string') {
      throw new Error("Invalid input: 'base64' must be a non-empty string.");
    }
    if (type !== "PRIVATE" && type !== "PUBLIC") {
      throw new Error("Invalid input: 'type' must be either 'PRIVATE' or 'PUBLIC'.");
    }

    try {
      const lines = base64.match(/.{1,64}/g) || [];
      return `-----BEGIN ${type} KEY-----\n${lines.join('\n')}\n-----END ${type} KEY-----`;
    } catch (error: any) {
      throw new Error(`Error formatting PEM: ${error.message}`);
    }
  }

  private static unformatPem(pem: string): string {
    if (!pem || typeof pem !== 'string') {
      throw new Error("Invalid input: 'pem' must be a non-empty string.");
    }

    try {
      const base64 = pem
        .replace(/-----BEGIN (PRIVATE|PUBLIC) KEY-----/, '')
        .replace(/-----END (PRIVATE|PUBLIC) KEY-----/, '')
        .replace(/\s+/g, '');
      return base64;
    } catch (error: any) {
      throw new Error(`Error unformatting PEM: ${error.message}`);
    }
  }

  private static async importPublicKey(pem: string): Promise<CryptoKey> {
    if (!pem || typeof pem !== 'string') {
      throw new Error("Invalid input: 'pem' must be a non-empty string.");
    }

    try {
      const b64 = this.unformatPem(pem);
      const binaryDer = Buffer64.base64ToArrayBuffer(b64) as BufferSource;
      return window.crypto.subtle.importKey(
        'spki',
        binaryDer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
      );
    } catch (error: any) {
      throw new Error(`Error importing public key: ${error.message}`);
    }
  }

  private static async importPrivateKey(pem: string): Promise<CryptoKey> {
    if (!pem || typeof pem !== 'string') {
      throw new Error("Invalid input: 'pem' must be a non-empty string.");
    }

    try {
      const b64 = this.unformatPem(pem);
      const binaryDer = Buffer64.base64ToArrayBuffer(b64) as BufferSource;
      return window.crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
      );
    } catch (error: any) {
      throw new Error(`Error importing private key: ${error.message}`);
    }
  }
}
