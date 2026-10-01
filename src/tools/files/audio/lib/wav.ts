/** Minimal WAV (RIFF PCM) writer and reader. */

/** Encode planar channels as a PCM WAV file (16-bit integer or 32-bit float). */
export function encodeWav(channels: Float32Array[], sampleRate: number, bits: 16 | 24 | 32 = 16): Uint8Array {
  const count = channels.length;
  const n = channels[0]?.length ?? 0;
  const bytes = bits / 8;
  const dataLen = n * count * bytes;
  const buf = new ArrayBuffer(44 + dataLen);
  const v = new DataView(buf);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  const float = bits === 32;
  w(0, "RIFF");
  v.setUint32(4, 36 + dataLen, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, float ? 3 : 1, true);
  v.setUint16(22, count, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * count * bytes, true);
  v.setUint16(32, count * bytes, true);
  v.setUint16(34, bits, true);
  w(36, "data");
  v.setUint32(40, dataLen, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < count; c++) {
      let s = channels[c][i];
      if (float) {
        v.setFloat32(o, s, true);
      } else {
        s = s > 1 ? 1 : s < -1 ? -1 : s;
        if (bits === 16) v.setInt16(o, s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff), true);
        else {
          const x = s < 0 ? Math.round(s * 0x800000) : Math.round(s * 0x7fffff);
          v.setUint8(o, x & 0xff);
          v.setUint8(o + 1, (x >> 8) & 0xff);
          v.setUint8(o + 2, (x >> 16) & 0xff);
        }
      }
      o += bytes;
    }
  }
  return new Uint8Array(buf);
}

/** Parse a PCM/float WAV into planar channels. Throws on unsupported data. */
export function decodeWav(data: Uint8Array): { sampleRate: number; channels: Float32Array[] } {
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const tag = (o: number) => String.fromCharCode(data[o], data[o + 1], data[o + 2], data[o + 3]);
  if (tag(0) !== "RIFF" && tag(0) !== "RF64") throw new Error("NOT_WAV");
  if (tag(8) !== "WAVE") throw new Error("NOT_WAV");
  let o = 12;
  let fmt: { format: number; channels: number; rate: number; bits: number } | null = null;
  while (o + 8 <= data.length) {
    const id = tag(o);
    let size = v.getUint32(o + 4, true);
    if (id === "fmt ") {
      let format = v.getUint16(o + 8, true);
      if (format === 0xfffe && size >= 40) format = v.getUint16(o + 32, true); // WAVE_FORMAT_EXTENSIBLE
      fmt = { format, channels: v.getUint16(o + 10, true), rate: v.getUint32(o + 12, true), bits: v.getUint16(o + 22, true) };
    } else if (id === "data") {
      if (!fmt) throw new Error("WAV_NO_FMT");
      if (size === 0xffffffff || o + 8 + size > data.length) size = data.length - o - 8;
      const bytes = fmt.bits / 8;
      const n = Math.floor(size / (bytes * fmt.channels));
      const ch = Array.from({ length: fmt.channels }, () => new Float32Array(n));
      let p = o + 8;
      for (let i = 0; i < n; i++) {
        for (let c = 0; c < fmt.channels; c++) {
          let s: number;
          if (fmt.format === 3 && fmt.bits === 32) s = v.getFloat32(p, true);
          else if (fmt.format === 3 && fmt.bits === 64) s = v.getFloat64(p, true);
          else if (fmt.bits === 16) s = v.getInt16(p, true) / 0x8000;
          else if (fmt.bits === 24) s = ((data[p] | (data[p + 1] << 8) | (data[p + 2] << 16)) << 8 >> 8) / 0x800000;
          else if (fmt.bits === 32) s = v.getInt32(p, true) / 0x80000000;
          else if (fmt.bits === 8) s = (data[p] - 128) / 128;
          else throw new Error("WAV_BITS");
          ch[c][i] = s;
          p += bytes;
        }
      }
      return { sampleRate: fmt.rate, channels: ch };
    }
    o += 8 + size + (size & 1);
  }
  throw new Error("WAV_NO_DATA");
}
