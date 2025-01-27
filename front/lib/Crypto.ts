import * as forge from 'node-forge';

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
}
