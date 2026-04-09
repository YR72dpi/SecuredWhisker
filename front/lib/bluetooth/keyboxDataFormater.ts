import { AesLib } from "@/lib/Crypto/AesLib";
import { PrivateKey } from "../SwDatabase";

export async function cryptBeforeSendToKeybox(password: string, privateKey: PrivateKey): Promise<{
  encryptedData: string;
  iv: string;
}> {
  const aesCryptedPrivateKey = await AesLib.textToCrypted(privateKey.privateKey, password)
  return aesCryptedPrivateKey
}

export function formateDataToSendToKeybox(action: string, data: string|null = null) :string {
  let payload: {action: string, data?: string} = {action: action}
  if (data !== null) payload.data = data
  return JSON.stringify(payload)
}

export function sliceDataOnBlock(data: string): string[] {
  let encoder = new TextEncoder()
  let slicedData = []
  const blockSize = 30
  for (let i = 0; i < Math.ceil(data.length / blockSize); i++) {
    const charsBlock = data.slice(i * blockSize, i * blockSize + blockSize)
    console.log(charsBlock + " " + encoder.encode(charsBlock).length)
    slicedData.push(charsBlock);
  }
  return slicedData
}