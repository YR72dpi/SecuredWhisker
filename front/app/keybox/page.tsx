'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
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

const formSchema = z.object({
  password: z.string().min(6, {
    message: "6 chars minimum",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
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

  const [showPairDialog, setShowPairDialog] = useState(false)
  const [pairPassword, setPairPassword] = useState<z.infer | null>(null)

  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => setPairPassword(values)


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

  useEffect(() => {
    if (!pairPassword) return
    (async () => {
      const privateKey = await SwDb.getPrivateKey()
      if (!privateKey) { toast.error("There is no key on this browser"); return }

      const jwtToken = await JwtTokenLib.isValidJwtToken()

      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + jwtToken);

      const requestOptions: RequestInit = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
      };

      const publicKey = await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", requestOptions)
        .then((response) => response.json())
        .then((result) => {
          return result.publicKey;
        })
        .catch((error) => console.error(error));
      if (!publicKey) { toast.error("There is no key on this browser"); return }

      const passwordForCrypt = AesLib.iterateToMakePasswordLonger(pairPassword.password)
      const cryptedPrivateKeyToSend = await cryptBeforeSendToKeybox(passwordForCrypt, privateKey)

      await writeKeybox(deviceData.device, formateDataToSendToKeybox("set_hash_private", md5(cryptedPrivateKeyToSend.encryptedData)))
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("set_hash_public", md5(publicKey)))
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("set_hash_iv", md5(cryptedPrivateKeyToSend.iv)))

      // send private key
      const slicedEncrpytedPrivateKey = sliceDataOnBlock(cryptedPrivateKeyToSend.encryptedData)
      for (const block of slicedEncrpytedPrivateKey) {
        await writeKeybox(deviceData.device, formateDataToSendToKeybox("concat_private", block))
      }

      // send public key
      const slicedEncrpytedPublicKeyKey = sliceDataOnBlock(publicKey)
      for (const block of slicedEncrpytedPublicKeyKey) {
        await writeKeybox(deviceData.device, formateDataToSendToKeybox("concat_public", block))
      }
      
      // send iv
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("set_iv", cryptedPrivateKeyToSend.iv))
      
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("validate"))

    })()
  }, [pairPassword])

  useEffect(() => {
    if (!pinSent || !deviceData) return

    (async () => {
      const keyboxDataString = await readKeybox(deviceData.device)
      const keyBoxData = JSON.parse(keyboxDataString)
      console.log(keyBoxData)
      setIsKeyboxInit(keyBoxData.initialized)
    })()

    const interval = setInterval(async () => {
      const ok = await pingKeybox(deviceData.device)
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

                  {process.env.NODE_ENV === 'development' && (
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
