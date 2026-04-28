
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
    acceptAllDevices: true,
    optionalServices: STANDARD_SERVICES,
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

    // Strip all BLE framing control characters from the final buffer
    // Removes 0x00-0x08 and 0x0E-0x1F everywhere except valid JSON whitespace (tab, LF, CR)
    const flush = () => buffer.replace(/[\x00-\x08\x0E-\x1F]/g, '')

    const done = () => {
      clearTimeout(inactivityTimer)
      char.removeEventListener("characteristicvaluechanged", handler)
      char.stopNotifications().catch(() => {})
    }

    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        console.warn("[BLE] readKeybox: timeout, resolving with", buffer.length, "chars")
        done()
        resolve(flush())
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
        done()
        resolve(flush())
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
        return char.properties.write
          ? char.writeValueWithResponse(trigger)
          : char.writeValueWithoutResponse(trigger)
      })
      .catch(reject)
  })
}

export async function writeKeybox(device: BluetoothDevice, value: string): Promise<void> {
  const char = await getChar(device)
  const data = new TextEncoder().encode(value)
  if (char.properties.write) {
    await char.writeValueWithResponse(data)
  } else {
    await char.writeValueWithoutResponse(data)
  }
}

export async function sendPin(device: BluetoothDevice, pin: string): Promise<void> {
  const char = await getChar(device)
  const data = new TextEncoder().encode(JSON.stringify({ pin }))
  if (char.properties.write) {
    await char.writeValueWithResponse(data)
  } else {
    await char.writeValueWithoutResponse(data)
  }
}

export async function shutdownKeybox(device: BluetoothDevice): Promise<void> {
  const jsonToSend = JSON.stringify(KEYBOX_ACTION["shutdown"])
  const send = await writeKeybox(device, jsonToSend)
  return send
}

