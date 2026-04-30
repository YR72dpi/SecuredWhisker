
export const KEYBOX_SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0"
export const KEYBOX_CHAR_UUID = "12345678-1234-5678-1234-56789abcdef1"
export const STANDARD_SERVICES: BluetoothServiceUUID[] = [KEYBOX_SERVICE_UUID]

export type DeviceData = { device: BluetoothDevice }
export const KEYBOX_ACTION = {
  "shutdown": { "action": "shutdown" },
  // "reboot" : {"action": "reboot"},
}

async function getChar(device: BluetoothDevice): Promise<BluetoothRemoteGATTCharacteristic> {
  const server = device.gatt!.connected ? device.gatt! : await device.gatt!.connect()
  const service = await server.getPrimaryService(KEYBOX_SERVICE_UUID)
  return service.getCharacteristic(KEYBOX_CHAR_UUID)
}

export async function getBondedDevices(): Promise<BluetoothDevice[]> {
  if (!navigator.bluetooth.getDevices) return []
  return navigator.bluetooth.getDevices()
}

export async function scanKeybox(): Promise<BluetoothDevice> {
  return navigator.bluetooth.requestDevice({
    filters: [{ services: [KEYBOX_SERVICE_UUID] }],
  })
}

export async function connectKeybox(device: BluetoothDevice): Promise<void> {
  await device.gatt!.connect()
}

export function disconnectKeybox(device: BluetoothDevice): void {
  device.gatt?.disconnect()
}

export function pingKeybox(device: BluetoothDevice): boolean {
  return device.gatt?.connected ?? false
}

export async function readKeybox(device: BluetoothDevice): Promise<string> {
  const char = await getChar(device)
  let buffer = ""

  return new Promise((resolve, reject) => {
    let inactivityTimer: ReturnType<typeof setTimeout>

    // Strip ALL control characters (0x00-0x1F) — the keybox JSON only contains
    // base64/hex values so no whitespace control chars are ever intentional
    const flush = () => buffer.replace(/[\x00-\x1F]/g, '')

    const done = async (): Promise<string> => {
      clearTimeout(inactivityTimer)
      char.removeEventListener("characteristicvaluechanged", handler)
      try { await char.stopNotifications() } catch { /* ignore */ }
      return flush()
    }

    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        console.warn("[BLE] readKeybox: timeout, resolving with", buffer.length, "chars")
        done().then(resolve).catch(reject)
      }, 3000)
    }

    const handler = (event: Event) => {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value!
      let raw = new Uint8Array(value.buffer)
      console.log("[BLE] chunk:", raw.length, "bytes", JSON.stringify(new TextDecoder().decode(raw).slice(0, 40)))

      // Strip 4-byte BLE framing header \x00\x04\x00\x08 if present
      if (raw.length >= 4 && raw[0] === 0 && raw[1] === 4 && raw[2] === 0 && raw[3] === 8) {
        raw = raw.slice(4)
      }

      // Terminator: empty after stripping, or standalone \x00\x04\x00 packet
      const isTerminator =
        raw.length === 0 ||
        (raw.length === 1 && raw[0] === 0) ||
        (raw.length === 3 && raw[0] === 0 && raw[1] === 4 && raw[2] === 0)

      if (isTerminator) {
        done().then(resolve).catch(reject)
        return
      }

      buffer += new TextDecoder().decode(raw)
      resetTimer()
    }

    char.addEventListener("characteristicvaluechanged", handler)
    char.startNotifications()
      .then(() => {
        resetTimer()
        const trigger = new TextEncoder().encode(JSON.stringify({ action: "read" }))
        return char.properties.writeWithoutResponse
          ? char.writeValueWithoutResponse(trigger)
          : char.writeValueWithResponse(trigger)
      })
      .catch(reject)
  })
}

export async function writeKeybox(device: BluetoothDevice, value: string): Promise<void> {
  const char = await getChar(device)
  const data = new TextEncoder().encode(value)
  // Prefer writeWithoutResponse: fire-and-forget, no ATT_WRITE_RSP needed.
  // Fall back to writeWithResponse but swallow GATT errors: the device may execute
  // the command (reset/validate/fix/shutdown) before it can send ATT_WRITE_RSP,
  // causing a spurious "GATT operation failed" even though the write succeeded.
  if (char.properties.writeWithoutResponse) {
    await char.writeValueWithoutResponse(data)
  } else if (char.properties.write) {
    try {
      await char.writeValueWithResponse(data)
    } catch (err) {
      if (err instanceof Error && err.name === 'NetworkError' || err instanceof Error && err.message.toLowerCase().includes('gatt')) {
        console.warn("[BLE] writeKeybox: GATT error swallowed (write likely succeeded):", err.message)
      } else {
        throw err
      }
    }
  }
}

export async function sendPin(device: BluetoothDevice, pin: string): Promise<void> {
  const char = await getChar(device)
  const data = new TextEncoder().encode(JSON.stringify({ pin }))
  if (char.properties.writeWithoutResponse) {
    await char.writeValueWithoutResponse(data)
  } else if (char.properties.write) {
    await char.writeValueWithResponse(data)
  }
}

export async function shutdownKeybox(device: BluetoothDevice): Promise<void> {
  const jsonToSend = JSON.stringify(KEYBOX_ACTION["shutdown"])
  const send = await writeKeybox(device, jsonToSend)
  return send
}

