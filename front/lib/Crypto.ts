import * as forge from 'node-forge';

export type KeyPair = {
    publicKey: string
    privateKey: string
}

export class Crypto {


    static async textToCrypted(text: string, publicKeyPem: string): Promise<string> {
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const encrypted = publicKey.encrypt(text, 'RSA-OAEP');
        return forge.util.encode64(encrypted);
    }

    static async cryptedToText(encryptedText: string, privateKeyPem: string): Promise<string> {
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const decrypted = privateKey.decrypt(forge.util.decode64(encryptedText), 'RSA-OAEP');
        return decrypted;
    }

    static generateRSAKeyPair = async (
        keySize: number = 2048,
        exponent: number = 0x10001
    ): Promise<KeyPair> => {

        return new Promise((resolve, reject) => {
            forge.pki.rsa.generateKeyPair({ bits: keySize, e: exponent }, (err, keypair) => {
              if (err) {
                reject(err);
              } else {
                const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
                const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
        
                resolve({
                  publicKey: publicKeyPem,
                  privateKey: privateKeyPem,
                });
              }
            });
          });

    }

}
