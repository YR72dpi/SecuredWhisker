import { useState } from "react"
import { toast } from "sonner"
import { API_PROTOCOL } from "@/lib/NetworkProtocol"
import { JwtTokenLib } from "@/lib/JwtTokenLib"
import { SwDb } from "@/lib/SwDatabase"
import { AesLib } from "@/lib/Crypto/AesLib"
import { SessionStore } from "@/lib/SessionStore"
import { readKeybox, writeKeybox } from "@/lib/bluetooth/keybox"
import {
  cryptBeforeSendToKeybox,
  formateDataToSendToKeybox,
  sliceDataOnBlock,
  md5,
} from "@/lib/bluetooth/keyboxDataFormater"

export type PairStep = { label: string; done: boolean }

type UsePairKeyboxReturn = {
  pairSteps: PairStep[]
  isPairing: boolean
  runPairing: (device: BluetoothDevice, password: string) => Promise<void>
}

export function usePairKeybox(onSuccess: () => void): UsePairKeyboxReturn {
  const [pairSteps, setPairSteps] = useState<PairStep[]>([])
  const [isPairing, setIsPairing] = useState(false)

  const step = (label: string, done: boolean) =>
    setPairSteps(prev => [...prev, { label, done }])

  const runPairing = async (device: BluetoothDevice, password: string) => {
    setPairSteps([])
    setIsPairing(true)

    try {
      // 1. Clés locales
      const privateKeyResult = await SwDb.getPrivateKey()
      if (!privateKeyResult) { toast.error("There is no key on this browser"); return }
      const privateKey = privateKeyResult.privateKey

      const jwtToken = await JwtTokenLib.isValidJwtToken()
      const myHeaders = new Headers()
      myHeaders.append("Authorization", "Bearer " + jwtToken)
      const publicKey = await fetch(
        API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData",
        { method: "GET", headers: myHeaders, redirect: "follow" }
      )
        .then(r => r.json())
        .then(r => r.publicKey)
        .catch((e) => { console.error(e); return null })
      if (!publicKey) { toast.error("Could not fetch public key"); return }

      // 2. Chiffrement
      const passwordForCrypt = AesLib.iterateToMakePasswordLonger(password)
      const cryptedPrivateKey = await cryptBeforeSendToKeybox(passwordForCrypt, privateKeyResult)

      // 3. Hashes de contrôle
      await writeKeybox(device, formateDataToSendToKeybox("set_hash_private", md5(cryptedPrivateKey.encryptedData)))
      step("Private key hash sent", true)
      await writeKeybox(device, formateDataToSendToKeybox("set_hash_public", md5(publicKey)))
      step("Public key hash sent", true)
      await writeKeybox(device, formateDataToSendToKeybox("set_hash_iv", md5(cryptedPrivateKey.iv)))
      step("IV hash sent", true)

      // 4. Clé privée chiffrée par blocs
      const privateKeyBlocks = sliceDataOnBlock(cryptedPrivateKey.encryptedData)
      for (let i = 0; i < privateKeyBlocks.length; i++) {
        await writeKeybox(device, formateDataToSendToKeybox("concat_private", privateKeyBlocks[i]))
        step(`Private key block ${i + 1}/${privateKeyBlocks.length} sent`, true)
      }

      // 5. Clé publique par blocs
      const publicKeyBlocks = sliceDataOnBlock(publicKey)
      for (let i = 0; i < publicKeyBlocks.length; i++) {
        await writeKeybox(device, formateDataToSendToKeybox("concat_public", publicKeyBlocks[i]))
        step(`Public key block ${i + 1}/${publicKeyBlocks.length} sent`, true)
      }

      // 6. IV
      await writeKeybox(device, formateDataToSendToKeybox("set_iv", cryptedPrivateKey.iv))
      step("IV sent", true)

      // 7. Validation
      await writeKeybox(device, formateDataToSendToKeybox("validate"))
      step("Validation requested", true)
      await new Promise(res => setTimeout(res, 500))

      // 8. Lecture retour
      step("Reading back keybox data...", true)
      const readBack = await readKeybox(device)
      const readBackData = JSON.parse(readBack)

      // 9. Vérification hashes
      if (!readBackData.hash?.allHashCorresponding) {
        step("❌ Hash verification failed, reset keybox", false)
        toast.error("Pairing failed: hashes do not all match on keybox.")
        return
      }
      step("✓ All hashes verified", true)

      // 10. Déchiffrement de vérification
      step("Decrypting BLE private key...", true)
      let decryptedBlePrivateKey: string
      try {
        decryptedBlePrivateKey = await AesLib.cryptedToText(
          readBackData.keypair.private,
          readBackData.iv,
          passwordForCrypt
        )
      } catch {
        step("❌ Failed to decrypt private key from BLE", false)
        toast.error("Pairing failed: could not decrypt the private key stored on keybox.")
        return
      }
      step("✓ Private key from BLE can be correctly decrypted", true)

      // 11. Comparaison
      if (decryptedBlePrivateKey !== privateKey) {
        step("❌ Private key mismatch", false)
        toast.error("Pairing failed: decrypted BLE private key does not match local key.")
        await writeKeybox(device, formateDataToSendToKeybox("reset"))
        step("❌ Complete reset of Keybox data", false)
        return
      }
      step("✓ Decrypted private key from BLE is correct", true)

      // 12. Fix
      await writeKeybox(device, formateDataToSendToKeybox("fix"))
      step("✓ Overwrite keybox data blocked", true)

      // 13. Stockage session
      SessionStore.set('privateKey', decryptedBlePrivateKey)
      step("✓ Keybox initialization complete", true)
      toast.success("Keybox successfully initialized!")
      onSuccess()
    } finally {
      setIsPairing(false)
    }
  }

  return { pairSteps, isPairing, runPairing }
}
