import { Buffer64 } from "./Buffer64";

export type KeyPair = {
  publicKey: string
  privateKey: string
}

export class RsaLib {


  static async textToCrypted(text: string, publicKeyPem: string): Promise<string> {
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
  }

  static async cryptedToText(encryptedText: string, privateKeyPem: string): Promise<string> {
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
  }

  static generateRSAKeyPair = async (
    keySize: number = 2048,
    exponent: Uint8Array = new Uint8Array([1, 0, 1])
  ): Promise<KeyPair> => {

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: keySize,
        publicExponent: exponent,
        hash: 'SHA-256'
      } as RsaHashedKeyGenParams,
      true, // extractable
      ['encrypt', 'decrypt']
    );

    // Export des clés
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);

    // Conversion ArrayBuffer -> base64
    const privateKeyBase64 = Buffer64.arrayBufferToBase64(privateKeyBuffer);
    const publicKeyBase64 = Buffer64.arrayBufferToBase64(publicKeyBuffer);

    // Format PEM
    const privateKeyPem = this.formatPem(privateKeyBase64, 'PRIVATE');
    const publicKeyPem = this.formatPem(publicKeyBase64, 'PUBLIC');

    return {
      publicKey: publicKeyPem,
      privateKey: privateKeyPem
    };

  }

  private static formatPem(base64: string, type: "PRIVATE" | "PUBLIC"): string {
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type} KEY-----\n${lines.join('\n')}\n-----END ${type} KEY-----`;
  }

  private static unformatPem(pem: string): string {
    const base64 = pem
      .replace(/-----BEGIN (PRIVATE|PUBLIC) KEY-----/, '')
      .replace(/-----END (PRIVATE|PUBLIC) KEY-----/, '')
      .replace(/\s+/g, '');
    return base64;
  }

  // Helpers pour importer les clés PEM
  private static async importPublicKey(pem: string): Promise<CryptoKey> {
    // Nettoyer le PEM
    const b64 = this.unformatPem(pem)
    const binaryDer = Buffer64.base64ToArrayBuffer(b64) as BufferSource;
    return window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
  }

  private static async importPrivateKey(pem: string): Promise<CryptoKey> {
    const b64 = this.unformatPem(pem);
    const binaryDer = Buffer64.base64ToArrayBuffer(b64) as BufferSource;
    return window.crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt']
    );
  }
}
