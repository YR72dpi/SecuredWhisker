'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";

import { useRouter } from "next/navigation"
import { JwtTokenLib } from "@/lib/JwtTokenLib"
import { toast } from "sonner"

import {
  type DeviceData,
  getBondedDevices,
  scanKeybox,
  connectKeybox,
  disconnectKeybox,
  pingKeybox,
  readKeybox,
  writeKeybox,
  sendPin
} from "@/lib/bluetooth/keybox"
import {
  cryptBeforeSendToKeybox,
  formateDataToSendToKeybox,
  sliceDataOnBlock,
  md5,
} from "@/lib/bluetooth/keyboxDataFormater"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { SwDb } from "@/lib/SwDatabase"
import { AesLib } from "@/lib/Crypto/AesLib"
import { SessionStore } from "@/lib/SessionStore"

type PairStep = { label: string; done: boolean }

const formSchema = z.object({
  password: z.string().min(6, {
    message: "6 chars minimum",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const unlockFormSchema = z.object({
  password: z.string().min(6, { message: "6 chars minimum" }),
});

export default function Home() {
  const [canShowPage, setCanShowPage] = useState(false)
  const [bleAvailable, setBleAvailable] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [bleDevices, setBleDevices] = useState<BluetoothDevice[]>([])
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null)
  const [pinCode, setPinCode] = useState("")
  const [pinSending, setPinSending] = useState(false)
  const [pinSent, setPinSent] = useState(false)
  const [charValue, setCharValue] = useState<string | null>(null)
  const [charWriteInput, setCharWriteInput] = useState("")
  const [charBusy, setCharBusy] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  const [isKeyboxInit, setIsKeyboxInit] = useState<boolean | null>(null)
  const [bleDownloading, setBleDownloading] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle')

  const [showPairDialog, setShowPairDialog] = useState(false)
  const [pairPassword, setPairPassword] = useState<z.infer | null>(null)
  const [pairSteps, setPairSteps] = useState<PairStep[]>([])
  const pairStepsEndRef = useRef<HTMLDivElement>(null)

  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState<string | null>(null)

  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setPairPassword(values)
    setShowPairDialog(false)
  }

  const unlockForm = useForm<z.infer<typeof unlockFormSchema>>({
    resolver: zodResolver(unlockFormSchema),
    defaultValues: { password: "" },
  })

  const onUnlockSubmit = (values: z.infer<typeof unlockFormSchema>) => {
    setUnlockPassword(values.password)
    setShowUnlockDialog(false)
  }


  const handleScan = async () => {
    setScanning(true)
    try {
      const device = await scanKeybox()
      setBleDevices((prev) => prev.find((d) => d.id === device.id) ? prev : [...prev, device])
      await handleConnect(device)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'NotFoundError') {
        toast.error("Bluetooth error: " + err.message)
      }
    } finally {
      setScanning(false)
    }
  }

  const handleConnect = async (device: BluetoothDevice) => {
    setConnectingId(device.id)
    setDeviceData(null)
    try {
      await connectKeybox(device)
      setDeviceData({ device })
      const ok = await pingKeybox(device)
      if (ok) setPinSent(true)
    } catch (err: unknown) {
      toast.error("Connection error: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setConnectingId(null)
    }
  }

  const handleDisconnect = () => {
    if (deviceData) disconnectKeybox(deviceData.device)
    setDeviceData(null)
    setPinCode("")
    setPinSent(false)
    setCharValue(null)
    setCharWriteInput("")
    setIsConnected(null)
  }

  const handleSendPin = async () => {
    if (!pinCode.match(/^\d+$/)) {
      toast.error("Please enter a numeric code.")
      return
    }
    if (!deviceData) return
    setPinSending(true)
    try {
      await sendPin(deviceData.device, pinCode)
      setPinSent(true)
      toast.success("Code sent successfully")
    } catch (err: unknown) {
      toast.error("Send error: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setPinSending(false)
    }
  }

  const handleRead = async () => {
    if (!deviceData) return
    setCharBusy(true)
    try {
      const value = await readKeybox(deviceData.device)
      setCharValue(value)
    } catch (err: unknown) {
      toast.error("Read error: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCharBusy(false)
    }
  }

  const handleWrite = async () => {
    if (!deviceData) return
    setCharBusy(true)
    try {
      await writeKeybox(deviceData.device, charWriteInput)
      toast.success("Written successfully")
    } catch (err: unknown) {
      toast.error("Write error: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCharBusy(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAIRING FLOW
  // Triggered when user submits the password form.
  // Steps: fetch keys → encrypt → send chunks → validate → verify → confirm
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pairPassword || !deviceData) return
    setPairSteps([])
    ;(async () => {
      // ── 1. Récupération des clés locales ──────────────────────────────────
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

      // ── 2. Chiffrement de la clé privée avec le mot de passe ─────────────
      const passwordForCrypt = AesLib.iterateToMakePasswordLonger(pairPassword.password)
      const cryptedPrivateKey = await cryptBeforeSendToKeybox(passwordForCrypt, privateKeyResult)

      // ── 3. Envoi des hashes de contrôle ───────────────────────────────────
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("set_hash_private", md5(cryptedPrivateKey.encryptedData)))
      setPairSteps(prev => [...prev, { label: "Private key hash sent", done: true }])
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("set_hash_public", md5(publicKey)))
      setPairSteps(prev => [...prev, { label: "Public key hash sent", done: true }])
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("set_hash_iv", md5(cryptedPrivateKey.iv)))
      setPairSteps(prev => [...prev, { label: "IV hash sent", done: true }])

      // ── 4. Envoi de la clé privée chiffrée (par blocs) ───────────────────
      const privateKeyBlocks = sliceDataOnBlock(cryptedPrivateKey.encryptedData)
      for (let i = 0; i < privateKeyBlocks.length; i++) {
        await writeKeybox(deviceData.device, formateDataToSendToKeybox("concat_private", privateKeyBlocks[i]))
        setPairSteps(prev => [...prev, { label: `Private key block ${i + 1}/${privateKeyBlocks.length} sent`, done: true }])
      }

      // ── 5. Envoi de la clé publique (par blocs) ───────────────────────────
      const publicKeyBlocks = sliceDataOnBlock(publicKey)
      for (let i = 0; i < publicKeyBlocks.length; i++) {
        await writeKeybox(deviceData.device, formateDataToSendToKeybox("concat_public", publicKeyBlocks[i]))
        setPairSteps(prev => [...prev, { label: `Public key block ${i + 1}/${publicKeyBlocks.length} sent`, done: true }])
      }

      // ── 6. Envoi de l'IV ──────────────────────────────────────────────────
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("set_iv", cryptedPrivateKey.iv))
      setPairSteps(prev => [...prev, { label: "IV sent", done: true }])

      // ── 7. Demande de validation des hashes côté BLE ──────────────────────
      await writeKeybox(deviceData.device, JSON.stringify({ action: "validate" }))
      setPairSteps(prev => [...prev, { label: "Validation requested", done: true }])

      // ── 8. Lecture des données de retour ──────────────────────────────────
      setPairSteps(prev => [...prev, { label: "Reading back keybox data...", done: true }])
      const readBack = await readKeybox(deviceData.device)
      console.log("[Keybox] raw readBack:", readBack)
      const readBackData = JSON.parse(readBack)
      console.log("[Keybox] parsed readBack:", readBackData)

      // ── 9. Vérification : hash.allHashCorresponding + déchiffrement + comparaison clé privée
      const allHashesOk = readBackData.hash?.allHashCorresponding === true

      if (!allHashesOk) {
        setPairSteps(prev => [...prev, { label: "❌ Hash verification failed", done: false }])
        toast.error("Pairing failed: hashes do not all match on keybox.")
        return
      }

      // Déchiffrement de la clé privée stockée dans le BLE avec le mot de passe saisi
      setPairSteps(prev => [...prev, { label: "Decrypting BLE private key...", done: true }])
      let decryptedBlePrivateKey: string
      try {
        decryptedBlePrivateKey = await AesLib.cryptedToText(
          readBackData.keypair.private,
          readBackData.iv,
          passwordForCrypt
        )
      } catch {
        setPairSteps(prev => [...prev, { label: "❌ Failed to decrypt BLE private key", done: false }])
        toast.error("Pairing failed: could not decrypt the private key stored on keybox.")
        return
      }

      const privateKeyOk = decryptedBlePrivateKey === privateKey

      if (!privateKeyOk) {
        setPairSteps(prev => [...prev, { label: "❌ Private key mismatch", done: false }])
        toast.error("Pairing failed: decrypted BLE private key does not match local key.")
        return
      }

      await writeKeybox(deviceData.device, formateDataToSendToKeybox("fix"))

      // ── 10. Tout est OK → stockage + confirmation ─────────────────────────
      SessionStore.set('privateKey', decryptedBlePrivateKey)
      setPairSteps(prev => [...prev, { label: "✓ All hashes verified", done: true }])
      setPairSteps(prev => [...prev, { label: "✓ Keybox initialization complete", done: true }])
      setIsKeyboxInit(true)
      toast.success("Keybox successfully initialized!")
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("shutdown"))

    })()
  }, [pairPassword])

  useEffect(() => {
    if (!unlockPassword) return
    ;(async () => {
      const rawData = SessionStore.get('keyboxRawData')
      if (!rawData) { toast.error("No keybox data in session"); return }
      try {
        const keyBoxData = JSON.parse(rawData)
        const passwordForCrypt = AesLib.iterateToMakePasswordLonger(unlockPassword)
        const decryptedKey = await AesLib.cryptedToText(
          keyBoxData.keypair.private,
          keyBoxData.iv,
          passwordForCrypt
        )
        SessionStore.set('privateKey', decryptedKey)
        toast.success("Private key unlocked")
        await writeKeybox(deviceData.device, formateDataToSendToKeybox("shutdown"))
      } catch {
        toast.error("Failed to decrypt private key — wrong password?")
      }
    })()
  }, [unlockPassword])

  useEffect(() => {
    if (!pinSent || !deviceData) return

    (async () => {
      setBleDownloading('downloading')
      try {
        const keyboxDataString = await readKeybox(deviceData.device)
        SessionStore.set('keyboxRawData', keyboxDataString)
        const keyBoxData = JSON.parse(keyboxDataString)
        console.log(keyBoxData)
        setIsKeyboxInit(keyBoxData.initialized)
        if (keyBoxData.initialized === true) {
          setShowUnlockDialog(true)
        }
        setBleDownloading('done')
      } catch (err: unknown) {
        setBleDownloading('error')
        toast.error("Failed to read keybox status: " + (err instanceof Error ? err.message : String(err)))
      }
    })()

    const interval = setInterval(() => {
      const ok = pingKeybox(deviceData.device)
      setIsConnected(ok)
    }, 1000)

    return () => clearInterval(interval)
  }, [pinSent, deviceData]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      const jwtToken = await JwtTokenLib.isValidJwtToken()
      if (!jwtToken) {
        router.replace("/login")
        return
      }
      setBleAvailable(!!navigator.bluetooth)
      if (navigator.bluetooth) {
        const bonded = await getBondedDevices()
        if (bonded.length > 0) {
          setBleDevices(bonded)
        }
      }
      setCanShowPage(true)
    })()
  }, [router])

  useEffect(() => {
    pairStepsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [pairSteps])

  if (!canShowPage) return null

  return (
    <div className="flex flex-col pt-12 items-center min-h-screen font-[family-name:var(--font-geist-sans)]">

      {!bleAvailable ? (
        <p className="text-destructive text-sm text-center mt-8">
          Bluetooth is not available on this device or browser.
        </p>
      ) : (
        <div className="mt-8 w-full max-w-lg px-4 space-y-6">

          {bleDevices.length === 0 && (
            <Button onClick={handleScan} disabled={scanning} variant="outline" className="w-full">
              {scanning ? "Scanning..." : "Scan Bluetooth devices"}
            </Button>
          )}


          {bleDevices.length > 0 && !deviceData && (
            <ul className="border rounded-md divide-y">
              {bleDevices.map((device) => (
                <li
                  key={device.id}
                  className="px-4 py-3 flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50"
                  onClick={() => handleConnect(device)}
                >
                  <div>
                    {device.name ?? <span className="text-muted-foreground italic">Unknown device</span>}
                    <span className="block text-xs text-muted-foreground">{device.id}</span>
                  </div>
                  {connectingId === device.id && (
                    <span className="text-xs text-muted-foreground">Connecting...</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {deviceData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">
                  {deviceData.device.name ?? "Unknown device"}
                </p>
                <Button size="sm" variant="ghost" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>

              {!pinSent ? (
                <div className="border rounded-md p-4 space-y-3">
                  <p className="text-sm font-medium">Authenticate</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Numeric code"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendPin()}
                      className="text-center tracking-widest text-lg"
                    />
                    <Button disabled={pinSending || !pinCode} onClick={handleSendPin}>
                      {pinSending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected === null ? 'bg-muted-foreground' :
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Authenticated</p>
                  </div>

                  {bleDownloading === 'downloading' && (
                    <div className="flex items-center gap-2 rounded-md border border-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
                      <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Downloading keybox data...
                    </div>
                  )}
                  {bleDownloading === 'done' && (
                    <div className="flex items-center gap-2 rounded-md border border-green-400 bg-green-50 dark:bg-green-950 px-3 py-2 text-sm text-green-700 dark:text-green-300">
                      <span>✓</span> Keybox data loaded successfully
                    </div>
                  )}
                  {bleDownloading === 'error' && (
                    <div className="flex items-center gap-2 rounded-md border border-red-400 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                      <span>✕</span> Failed to load keybox data
                    </div>
                  )}

                  {process.env.NODE_ENV === 'developmens' && (
                    <>
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Read</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all min-w-0">
                            {charValue ?? "—"}
                          </code>
                          <Button size="sm" variant="secondary" disabled={charBusy} onClick={handleRead}>
                            {charBusy ? "..." : "Read"}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Write</p>
                        <div className="flex items-center gap-2">
                          <Input
                            className="h-8 text-sm"
                            placeholder="value to write"
                            value={charWriteInput}
                            onChange={(e) => setCharWriteInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleWrite()}
                          />
                          <Button size="sm" disabled={charBusy || !charWriteInput} onClick={handleWrite}>
                            {charBusy ? "..." : "Write"}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {pairSteps.length > 0 && (
            <div className="border rounded-md p-4 space-y-2">
              <p className="text-sm font-medium">Pairing progress</p>
              <ul
                className="space-y-1 overflow-y-auto font-mono bg-black rounded p-2"
                style={{ height: "50vh" }}
              >
                {pairSteps.map((step, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={step.done ? 'text-green-400' : 'text-red-400'}>{step.label}</span>
                  </li>
                ))}
                <div ref={pairStepsEndRef} />
              </ul>
            </div>
          )}

          <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unlock your private key</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Enter the password you used to encrypt your private key on this keybox.</p>
              <Form {...unlockForm}>
                <form onSubmit={unlockForm.handleSubmit(onUnlockSubmit)} className="space-y-2">
                  <FormField
                    control={unlockForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" placeholder="Password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Unlock</Button>
                </form>
              </Form>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowUnlockDialog(false)}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {isKeyboxInit === false && (
            <>
              <div className="flex justify-end">
                <Button onClick={() => setShowPairDialog(true)}>Put pair key on Keybox</Button>
              </div>

              <Dialog open={showPairDialog} onOpenChange={setShowPairDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Protect your private key</DialogTitle>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" autocomplet="new-password" placeholder="Password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" autocomplet="new-password" placeholder="Confirm password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Submit</Button>
                    </form>
                  </Form>

                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowPairDialog(false)}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}


        </div>
      )}
    </div>
  )
}
