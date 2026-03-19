import { AesLib } from '../Crypto/AesLib'; // Ajustez le chemin d'import
import { Buffer64 } from '../Crypto/Buffer64';
import { PasswordKeyDerivation } from './PasswordKeyDerivation';

export type QRCodeData = {
  encryptedPrivateKey: string;
  iv: string;
  salt: string;
  version: string; // Pour la compatibilité future
};

export type StringKeyToCrypt = {
  choosenLetters: string,
  choosenNumbers: string,
  keyToUseToCrypt: string,
  keyToShow: string
};

export class RSAKeyTransmission {

  static randomString(length: number = 4): StringKeyToCrypt {
    const charsToExclude = "o,0,i,l,1,3,e"; // put a "," between each letters "

    let chars = "abcdefghijklmnopqrstuvwxyz";
    const regexForChars = new RegExp(`[${charsToExclude}]`, 'gi');
    chars = chars.replace(regexForChars, '');

    let number = "0123456789";
    const regex = new RegExp(`[${charsToExclude}]`, 'gi');
    number = number.replace(regex, '');

    let choosenLetters = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      choosenLetters += chars[randomIndex];
    }

    let choosenNumbers = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * number.length);
      choosenNumbers += number[randomIndex];
    }

    return {
      choosenLetters: choosenLetters,
      choosenNumbers: choosenNumbers,
      keyToUseToCrypt: choosenLetters + choosenNumbers,
      keyToShow: choosenLetters + '-' + choosenNumbers
    }
  }

  static async encryptPrivateKeyWithPassword(
    privateKeyPem: string,
    password: string
  ): Promise<QRCodeData> {
    // Générer un salt aléatoire
    const salt = PasswordKeyDerivation.generateSalt();

    // Dériver une clé AES à partir du mot de passe
    const aesKeyBase64 = await PasswordKeyDerivation.deriveKeyFromPassword(
      password,
      salt
    );

    // Chiffrer la clé privée avec AES
    const { encryptedData, iv } = await AesLib.textToCrypted(
      privateKeyPem,
      aesKeyBase64
    );

    // Préparer les données pour le QR code
    return {
      encryptedPrivateKey: encryptedData,
      iv,
      salt: Buffer64.arrayBufferToBase64(salt),
      version: '1.0'
    };
  }

  static async decryptPrivateKeyWithPassword(
    qrData: QRCodeData,
    password: string
  ): Promise<string> {
    // Reconstruire le salt
    const salt = Buffer64.base64ToArrayBuffer(qrData.salt);

    // Dériver la clé AES à partir du mot de passe
    const aesKeyBase64 = await PasswordKeyDerivation.deriveKeyFromPassword(
      password,
      salt
    );

    // Déchiffrer la clé privée
    const privateKeyPem = await AesLib.cryptedToText(
      qrData.encryptedPrivateKey,
      qrData.iv,
      aesKeyBase64
    );

    return privateKeyPem;
  }

  static encodePayload(qrData: QRCodeData): string {
    return JSON.stringify(qrData);
  }

  static decodePayload(qrString: string): QRCodeData {
    return JSON.parse(qrString) as QRCodeData;
  }

}