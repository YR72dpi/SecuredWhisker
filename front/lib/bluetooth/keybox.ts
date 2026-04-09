
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

export async function pingKeybox(device: BluetoothDevice): Promise<boolean> {
  try {
    const char = await getChar(device)
    await char.readValue()
    return true
  } catch {
    return false
  }
}

export async function readKeybox(device: BluetoothDevice): Promise<string> {
  const char = await getChar(device)
  const dv = await char.readValue()
  return new TextDecoder().decode(dv)
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

