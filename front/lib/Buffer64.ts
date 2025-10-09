/**
 * Utility class for converting between Base64 strings and binary data.
 */
export class Buffer64 {
  /**
   * Converts an ArrayBuffer or Uint8Array to a Base64-encoded string.
   * @param buffer - The input ArrayBuffer or Uint8Array.
   * @returns Base64-encoded string.
   * @throws Error if encoding fails.
   */
  static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    try {
      const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      return window.btoa(String.fromCharCode(...bytes));
    } catch (error: Error) {
      throw new Error(`Failed to encode to Base64: ${error.message}`);
    }
  }

  /**
   * Converts a Base64-encoded string to a Uint8Array.
   * @param base64 - The Base64-encoded string.
   * @returns Uint8Array containing the decoded binary data.
   * @throws Error if the Base64 string is invalid or decoding fails.
   */
  static base64ToArrayBuffer(base64: string): Uint8Array {
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid input: Base64 string must be non-empty');
    }

    try {
      // Normalize Base64: remove whitespace and ensure padding
      const normalizedBase64 = base64.replace(/\s/g, '') + '='.repeat((4 - (base64.length % 4)) % 4);
      if (!/^[A-Za-z0-9+/=]+$/.test(normalizedBase64)) {
        throw new Error('Invalid Base64 string: Contains invalid characters');
      }

      const binaryString = window.atob(normalizedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (error: Error) {
      throw new Error(`Failed to decode Base64 string: ${error.message}`);
    }
  }
}