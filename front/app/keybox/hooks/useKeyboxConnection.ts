import { useEffect, useState } from "react"
import { toast } from "sonner"
import { SessionStore } from "@/lib/SessionStore"
import { AesLib } from "@/lib/Crypto/AesLib"
import {
  type DeviceData,
  getBondedDevices,
  scanKeybox,
  connectKeybox,
  disconnectKeybox,
  pingKeybox,
  readKeybox,
  writeKeybox,
  sendPin,
} from "@/lib/bluetooth/keybox"
import { formateDataToSendToKeybox } from "@/lib/bluetooth/keyboxDataFormater"

type BleDownloadState = 'idle' | 'downloading' | 'done' | 'error'

type UseKeyboxConnectionReturn = {
  bleAvailable: boolean
  scanning: boolean
  bleDevices: BluetoothDevice[]
  connectingId: string | null
  deviceData: DeviceData | null
  pinCode: string
  setPinCode: (v: string) => void
  pinSending: boolean
  pinSent: boolean
  isConnected: boolean | null
  bleDownloading: BleDownloadState
  isKeyboxInit: boolean | null
  isPrivateKeyUnlocked: boolean
  showUnlockDialog: boolean
  setShowUnlockDialog: (v: boolean) => void
  handleScan: () => Promise<void>
  handleConnect: (device: BluetoothDevice) => Promise<void>
  handleDisconnect: () => void
  handleSendPin: () => Promise<void>
  handleUnlock: (password: string) => Promise<void>
  handleShutdown: () => Promise<void>
  initBle: () => Promise<void>
  setIsKeyboxInit: (v: boolean) => void
}

export function useKeyboxConnection(): UseKeyboxConnectionReturn {
  const [bleAvailable, setBleAvailable] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [bleDevices, setBleDevices] = useState<BluetoothDevice[]>([])
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null)
  const [pinCode, setPinCode] = useState("")
  const [pinSending, setPinSending] = useState(false)
  const [pinSent, setPinSent] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [bleDownloading, setBleDownloading] = useState<BleDownloadState>('idle')
  const [isKeyboxInit, setIsKeyboxInit] = useState<boolean | null>(null)
  const [isPrivateKeyUnlocked, setIsPrivateKeyUnlocked] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)

  const handleScan = async () => {
    setScanning(true)
    try {
      const device = await scanKeybox()
      setBleDevices(prev => prev.find(d => d.id === device.id) ? prev : [...prev, device])
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
    setIsConnected(null)
    setBleDownloading('idle')
    setIsKeyboxInit(null)
    setIsPrivateKeyUnlocked(false)
  }

  const handleSendPin = async () => {
    if (!pinCode.match(/^\d+$/)) { toast.error("Please enter a numeric code."); return }
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

  const handleUnlock = async (password: string) => {
    const rawData = SessionStore.get('keyboxRawData')
    if (!rawData) { toast.error("No keybox data in session"); return }
    try {
      const keyBoxData = JSON.parse(rawData)
      const passwordForCrypt = AesLib.iterateToMakePasswordLonger(password)
      const decryptedKey = await AesLib.cryptedToText(
        keyBoxData.keypair.private,
        keyBoxData.iv,
        passwordForCrypt
      )
      SessionStore.set('privateKey', decryptedKey)
      setIsPrivateKeyUnlocked(true)
      toast.success("Private key unlocked")
    } catch {
      toast.error("Failed to decrypt private key — wrong password?")
      if (deviceData) await writeKeybox(deviceData.device, formateDataToSendToKeybox("shutdown"))
    }
  }

  const handleShutdown = async () => {
    if (!deviceData) return
    try {
      await writeKeybox(deviceData.device, formateDataToSendToKeybox("shutdown"))
      toast.success("Shutdown command sent")
    } catch (err: unknown) {
      toast.error("Failed to send shutdown: " + (err instanceof Error ? err.message : String(err)))
    }
  }

  const initBle = async () => {
    setBleAvailable(!!navigator.bluetooth)
    if (navigator.bluetooth) {
      const bonded = await getBondedDevices()
      if (bonded.length > 0) setBleDevices(bonded)
    }
  }

  // Lecture initiale après auth PIN
  useEffect(() => {
    if (!pinSent || !deviceData) return
    ;(async () => {
      setBleDownloading('downloading')
      try {
        const keyboxDataString = await readKeybox(deviceData.device)
        SessionStore.set('keyboxRawData', keyboxDataString)
        const keyBoxData = JSON.parse(keyboxDataString)
        setIsKeyboxInit(keyBoxData.initialized)
        if (keyBoxData.initialized === true) setShowUnlockDialog(true)
        setBleDownloading('done')
      } catch (err: unknown) {
        setBleDownloading('error')
        toast.error("Failed to read keybox status: " + (err instanceof Error ? err.message : String(err)))
      }
    })()

    const interval = setInterval(() => {
      setIsConnected(pingKeybox(deviceData.device))
    }, 1000)
    return () => clearInterval(interval)
  }, [pinSent, deviceData]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    bleAvailable, scanning, bleDevices, connectingId, deviceData,
    pinCode, setPinCode, pinSending, pinSent,
    isConnected, bleDownloading, isKeyboxInit, setIsKeyboxInit, isPrivateKeyUnlocked,
    showUnlockDialog, setShowUnlockDialog,
    handleScan, handleConnect, handleDisconnect, handleSendPin, handleUnlock, handleShutdown, initBle,
  }
}
