const fs = require('fs');
const path = require('path');
const vm = require('vm');

// lamejs@1.2.1 has broken CJS imports (missing globals between modules).
// Load the all-in-one bundle file and extract Mp3Encoder via vm context.
const bundlePath = require.resolve('lamejs/lame.all.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf-8');
const context = vm.createContext({
  Int8Array, Int16Array, Int32Array,
  Float32Array, Float64Array, Uint8Array,
  ArrayBuffer, DataView, Math, console,
});
vm.runInContext(bundleCode, context);
const Mp3Encoder = context.lamejs.Mp3Encoder;

const SOUNDS = [
  { name: 'correct',   freq: 800,  durationMs: 150 },
  { name: 'incorrect', freq: 300,  durationMs: 200 },
  { name: 'complete',  freq: 1000, durationMs: 300 },
  { name: 'fail',      freq: 200,  durationMs: 300 },
  { name: 'levelUp',   freq: 1200, durationMs: 250 },
  { name: 'rankUp',    freq: 1100, durationMs: 250 },
  { name: 'hint',      freq: 600,  durationMs: 150 },
  { name: 'click',     freq: 400,  durationMs: 100 },
  { name: 'tick',      freq: 500,  durationMs: 100 },
];

const SAMPLE_RATE = 44100;
const BITRATE = 128;
const outDir = path.join(__dirname, '..', 'public', 'audio');
fs.mkdirSync(outDir, { recursive: true });

for (const sound of SOUNDS) {
  const numSamples = Math.floor(SAMPLE_RATE * sound.durationMs / 1000);
  const samples = new Int16Array(numSamples);

  // Generate sine wave as 16-bit signed PCM
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Fade in/out envelope (10ms ramp) to avoid clicks
    const fadeLen = Math.floor(SAMPLE_RATE * 0.01);
    let envelope = 1;
    if (i < fadeLen) envelope = i / fadeLen;
    if (i > numSamples - fadeLen) envelope = (numSamples - i) / fadeLen;
    samples[i] = Math.round(Math.sin(2 * Math.PI * sound.freq * t) * 32767 * 0.5 * envelope);
  }

  // Encode to MP3 using lamejs
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, BITRATE);
  const mp3Chunks = [];
  // Encode in blocks of 1152 samples (MP3 frame size)
  for (let i = 0; i < numSamples; i += 1152) {
    const chunk = samples.subarray(i, Math.min(i + 1152, numSamples));
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) mp3Chunks.push(Buffer.from(mp3buf));
  }
  const flush = encoder.flush();
  if (flush.length > 0) mp3Chunks.push(Buffer.from(flush));

  const mp3Data = Buffer.concat(mp3Chunks);
  const filePath = path.join(outDir, `${sound.name}.mp3`);
  fs.writeFileSync(filePath, mp3Data);
  console.log(`Generated: ${filePath} (${mp3Data.length} bytes)`);
}

console.log('Done! All 9 placeholder audio files generated.');
