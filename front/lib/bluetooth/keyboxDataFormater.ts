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

export function md5(str: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  const rol = (n: number, c: number) => (n << c) | (n >>> (32 - c))
  const add = (q: number, a: number, b: number, x: number, s: number, t: number) =>
    safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => add((b & c) | (~b & d), a, b, x, s, t)
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => add((b & d) | (c & ~d), a, b, x, s, t)
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => add(b ^ c ^ d, a, b, x, s, t)
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => add(c ^ (b | ~d), a, b, x, s, t)

  const bytes = new TextEncoder().encode(str)
  const len = bytes.length
  const buf = new Uint8Array(Math.ceil((len + 9) / 64) * 64)
  buf.set(bytes)
  buf[len] = 0x80
  const view = new DataView(buf.buffer)
  view.setUint32(buf.length - 8, (len << 3) >>> 0, true)
  view.setUint32(buf.length - 4, len >>> 29, true)

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476
  for (let i = 0; i < buf.length; i += 64) {
    const m = Array.from({ length: 16 }, (_, j) => view.getInt32(i + j * 4, true))
    const [aa, bb, cc, dd] = [a, b, c, d]
    // Round 1
    a=ff(a,b,c,d,m[0], 7,0xd76aa478);d=ff(d,a,b,c,m[1], 12,0xe8c7b756);c=ff(c,d,a,b,m[2], 17,0x242070db);b=ff(b,c,d,a,m[3], 22,0xc1bdceee)
    a=ff(a,b,c,d,m[4], 7,0xf57c0faf);d=ff(d,a,b,c,m[5], 12,0x4787c62a);c=ff(c,d,a,b,m[6], 17,0xa8304613);b=ff(b,c,d,a,m[7], 22,0xfd469501)
    a=ff(a,b,c,d,m[8], 7,0x698098d8);d=ff(d,a,b,c,m[9], 12,0x8b44f7af);c=ff(c,d,a,b,m[10],17,0xffff5bb1);b=ff(b,c,d,a,m[11],22,0x895cd7be)
    a=ff(a,b,c,d,m[12],7,0x6b901122);d=ff(d,a,b,c,m[13],12,0xfd987193);c=ff(c,d,a,b,m[14],17,0xa679438e);b=ff(b,c,d,a,m[15],22,0x49b40821)
    // Round 2
    a=gg(a,b,c,d,m[1], 5,0xf61e2562);d=gg(d,a,b,c,m[6], 9,0xc040b340);c=gg(c,d,a,b,m[11],14,0x265e5a51);b=gg(b,c,d,a,m[0], 20,0xe9b6c7aa)
    a=gg(a,b,c,d,m[5], 5,0xd62f105d);d=gg(d,a,b,c,m[10],9,0x02441453);c=gg(c,d,a,b,m[15],14,0xd8a1e681);b=gg(b,c,d,a,m[4], 20,0xe7d3fbc8)
    a=gg(a,b,c,d,m[9], 5,0x21e1cde6);d=gg(d,a,b,c,m[14],9,0xc33707d6);c=gg(c,d,a,b,m[3], 14,0xf4d50d87);b=gg(b,c,d,a,m[8], 20,0x455a14ed)
    a=gg(a,b,c,d,m[13],5,0xa9e3e905);d=gg(d,a,b,c,m[2], 9,0xfcefa3f8);c=gg(c,d,a,b,m[7], 14,0x676f02d9);b=gg(b,c,d,a,m[12],20,0x8d2a4c8a)
    // Round 3
    a=hh(a,b,c,d,m[5], 4,0xfffa3942);d=hh(d,a,b,c,m[8], 11,0x8771f681);c=hh(c,d,a,b,m[11],16,0x6d9d6122);b=hh(b,c,d,a,m[14],23,0xfde5380c)
    a=hh(a,b,c,d,m[1], 4,0xa4beea44);d=hh(d,a,b,c,m[4], 11,0x4bdecfa9);c=hh(c,d,a,b,m[7], 16,0xf6bb4b60);b=hh(b,c,d,a,m[10],23,0xbebfbc70)
    a=hh(a,b,c,d,m[13],4,0x289b7ec6);d=hh(d,a,b,c,m[0], 11,0xeaa127fa);c=hh(c,d,a,b,m[3], 16,0xd4ef3085);b=hh(b,c,d,a,m[6], 23,0x04881d05)
    a=hh(a,b,c,d,m[9], 4,0xd9d4d039);d=hh(d,a,b,c,m[12],11,0xe6db99e5);c=hh(c,d,a,b,m[15],16,0x1fa27cf8);b=hh(b,c,d,a,m[2], 23,0xc4ac5665)
    // Round 4
    a=ii(a,b,c,d,m[0], 6,0xf4292244);d=ii(d,a,b,c,m[7], 10,0x432aff97);c=ii(c,d,a,b,m[14],15,0xab9423a7);b=ii(b,c,d,a,m[5], 21,0xfc93a039)
    a=ii(a,b,c,d,m[12],6,0x655b59c3);d=ii(d,a,b,c,m[3], 10,0x8f0ccc92);c=ii(c,d,a,b,m[10],15,0xffeff47d);b=ii(b,c,d,a,m[1], 21,0x85845dd1)
    a=ii(a,b,c,d,m[8], 6,0x6fa87e4f);d=ii(d,a,b,c,m[15],10,0xfe2ce6e0);c=ii(c,d,a,b,m[6], 15,0xa3014314);b=ii(b,c,d,a,m[13],21,0x4e0811a1)
    a=ii(a,b,c,d,m[4], 6,0xf7537e82);d=ii(d,a,b,c,m[11],10,0xbd3af235);c=ii(c,d,a,b,m[2], 15,0x2ad7d2bb);b=ii(b,c,d,a,m[9], 21,0xeb86d391)
    a=safeAdd(a,aa); b=safeAdd(b,bb); c=safeAdd(c,cc); d=safeAdd(d,dd)
  }
  const hexLE = (n: number) => [n, n>>>8, n>>>16, n>>>24].map(b => (b & 0xff).toString(16).padStart(2, '0')).join('')
  return hexLE(a) + hexLE(b) + hexLE(c) + hexLE(d)
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