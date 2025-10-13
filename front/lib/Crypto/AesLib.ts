export class AesLib {

  static generateAESKey = async (): Promise<string> => {
    try {
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
    } catch (error: any) {
      throw new Error(`Error generating AES key: ${error.message}`);
    }
  };

  static textToCrypted = async (text: string, keyBase64: string): Promise<{
    encryptedData: string;
    iv: string
  }> => {
    if (!text || typeof text !== 'string') {
      throw new Error("Invalid input: 'text' must be a non-empty string.");
    }
    if (!keyBase64 || typeof keyBase64 !== 'string') {
      throw new Error("Invalid input: 'keyBase64' must be a non-empty string.");
    }

    try {
      const key = await AesLib.importKey(keyBase64);
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM

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
    } catch (error: any) {
      throw new Error(`Error encrypting text: ${error.message}`);
    }
  };

  static cryptedToText = async (
    encryptedData: string,
    iv: string,
    keyBase64: string
  ): Promise<string> => {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error("Invalid input: 'encryptedData' must be a non-empty string.");
    }
    if (!iv || typeof iv !== 'string') {
      throw new Error("Invalid input: 'iv' must be a non-empty string.");
    }
    if (!keyBase64 || typeof keyBase64 !== 'string') {
      throw new Error("Invalid input: 'keyBase64' must be a non-empty string.");
    }

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
    } catch (error: any) {
      throw new Error(`Error decrypting text: ${error.message}`);
    }
  };

  /* === Utility function === */

  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array<ArrayBuffer>): string {
    try {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (error: any) {
      throw new Error(`Error converting ArrayBuffer to Base64: ${error.message}`);
    }
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error: any) {
      throw new Error(`Error converting Base64 to ArrayBuffer: ${error.message}`);
    }
  }

  static exportKey = async (key: CryptoKey): Promise<string> => {
    if (!key) {
      throw new Error("Invalid input: 'key' must be a valid CryptoKey.");
    }

    try {
      const exported = await crypto.subtle.exportKey("raw", key);
      return AesLib.arrayBufferToBase64(exported);
    } catch (error: any) {
      throw new Error(`Error exporting key: ${error.message}`);
    }
  };

  static importKey = async (keyBase64: string): Promise<CryptoKey> => {
    if (!keyBase64 || typeof keyBase64 !== 'string') {
      throw new Error("Invalid input: 'keyBase64' must be a non-empty string.");
    }

    try {
      const keyBuffer = AesLib.base64ToArrayBuffer(keyBase64);
      return await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
      );
    } catch (error: any) {
      throw new Error(`Error importing key: ${error.message}`);
    }
  };

}