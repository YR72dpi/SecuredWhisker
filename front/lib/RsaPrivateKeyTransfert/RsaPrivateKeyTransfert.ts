import { RSAKeyTransmission } from "./RSAKeyTransmission";

export class RsaPrivateKeyTransfert {
    
  static async generatePayload(
  privateKeyPem: string,
  password: string
): Promise<string> {

  // Chiffrer la clé privée avec le mot de passe
  const qrData = await RSAKeyTransmission.encryptPrivateKeyWithPassword(
    privateKeyPem,
    password
  );

  // Encoder en JSON pour le QR code
  return RSAKeyTransmission.encodePayload(qrData);
}

static async recoverPayload(
  qrString: string,
  password: string
): Promise<string> {

  // Décoder les données du QR code
  const qrData = RSAKeyTransmission.decodePayload(qrString);

  // Déchiffrer la clé privée avec le mot de passe
  return await RSAKeyTransmission.decryptPrivateKeyWithPassword(
    qrData,
    password
  );
}
}