
export type KeyPair = {
  publicKey: string
  privateKey: string
}

export class Crypto {


  static async textToCrypted(text: string, publicKeyPem: string): Promise<string> {
    // Convertir PEM en ArrayBuffer
    const publicKey = await Crypto.importPublicKey(publicKeyPem);
    const encoded = new TextEncoder().encode(text);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoded
    );
    return Crypto.arrayBufferToBase64(encrypted);
  }

  static async cryptedToText(encryptedText: string, privateKeyPem: string): Promise<string> {
    // Convertir PEM en ArrayBuffer
    const privateKey = await Crypto.importPrivateKey(privateKeyPem);
    const encryptedBuffer = Crypto.base64ToArrayBuffer(encryptedText);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
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
    const privateKeyBase64 = this.arrayBufferToBase64(privateKeyBuffer);
    const publicKeyBase64 = this.arrayBufferToBase64(publicKeyBuffer);

    // Format PEM
    const privateKeyPem = this.formatPem(privateKeyBase64, 'PRIVATE');
    const publicKeyPem = this.formatPem(publicKeyBase64, 'PUBLIC');

    return {
      publicKey: publicKeyPem,
      privateKey: privateKeyPem
    };

  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static formatPem(base64: string, type: string): string {
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type} KEY-----\n${lines.join('\n')}\n-----END ${type} KEY-----`;
  }

  // Helpers pour importer les clés PEM
  private static async importPublicKey(pem: string): Promise<CryptoKey> {
    // Nettoyer le PEM
    const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '');
    const binaryDer = Crypto.base64ToArrayBuffer(b64);
    return window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
  }

  private static async importPrivateKey(pem: string): Promise<CryptoKey> {
    const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
    const binaryDer = Crypto.base64ToArrayBuffer(b64);
    return window.crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt']
    );
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

}
