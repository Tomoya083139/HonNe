// 依存なしで PWA 用 PNG アイコンを生成する（赤地 + 白い波）
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  const r = size * 0.22
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const i = y * (size * 3 + 1) + 1 + x * 3
      // 角丸
      const dx = Math.max(r - x, x - (size - 1 - r), 0)
      const dy = Math.max(r - y, y - (size - 1 - r), 0)
      const outside = dx * dx + dy * dy > r * r
      const wave = size * 0.62 + Math.sin((x / size) * Math.PI * 2 - 1) * size * 0.07
      let c = outside ? [250, 247, 243] : y > wave ? [255, 255, 255] : [224, 69, 90]
      raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
for (const s of [192, 512]) writeFileSync(`public/icons/icon-${s}.png`, png(s))
console.log('icons generated')
