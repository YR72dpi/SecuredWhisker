export class AesLib {

  static generateAESKey = async (): Promise<string> => {
    const cle = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );

    const exported = await crypto.subtle.exportKey("raw", cle);
    return AesLib.arrayBufferToBase64(exported);
  };

  static textToCrypted = async (text: string, keyBase64: string): Promise<{
    encryptedData: string;
    iv: string
  }> => {
    try {
      const key = await AesLib.importKey(keyBase64);
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes pour GCM

      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        data
      );

      const encryptedData = AesLib.arrayBufferToBase64(encryptedBuffer);
      const ivBase64 = AesLib.arrayBufferToBase64(iv);

      return {
        encryptedData,
        iv: ivBase64
      };
    } catch (error) {
      throw new Error(`Erreur de chiffrement: ${error}`);
    }
  };

  static cryptedToText = async (
    encryptedData: string,
    iv: string,
    keyBase64: string
  ): Promise<string> => {
    try {
      const key = await AesLib.importKey(keyBase64);

      const encryptedBuffer = AesLib.base64ToArrayBuffer(encryptedData);
      const ivBuffer = AesLib.base64ToArrayBuffer(iv);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivBuffer
        },
        key,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      throw new Error(`Erreur de déchiffrement: ${error}`);
    }
  };

  /* === Utility function === */

  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array<ArrayBuffer>): string { 
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static exportKey = async (key: CryptoKey): Promise<string> => {
    const exported = await crypto.subtle.exportKey("raw", key);
    return AesLib.arrayBufferToBase64(exported);
  };

  static importKey = async (keyBase64: string): Promise<CryptoKey> => {
    const keyBuffer = AesLib.base64ToArrayBuffer(keyBase64);
    return await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  };

}