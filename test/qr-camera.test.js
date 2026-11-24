import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { cameraErrorMessage, scanQrCamera } from '../src/lib/qrCamera.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/escape-qr.json', import.meta.url), 'utf8'));

function qrFrame() {
  const scale = 6;
  const border = 4;
  const width = (fixture.modules.length + border * 2) * scale;
  const data = new Uint8ClampedArray(width * width * 4).fill(255);
  fixture.modules.forEach((row, y) => [...row].forEach((bit, x) => {
    if (bit !== '1') return;
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const offset = (((y + border) * scale + dy) * width + (x + border) * scale + dx) * 4;
        data[offset] = data[offset + 1] = data[offset + 2] = 0;
      }
    }
  }));
  return { data, width, height: width };
}

function cameraEnvironment(t, getUserMedia) {
  const frame = qrFrame();
  const callbacks = new Map();
  let sequence = 0;
  let stops = 0;
  const stream = { getTracks: () => [{ stop() { stops++; } }] };
  const window = Object.assign(new EventTarget(), {
    isSecureContext: true,
    setTimeout(callback) { callbacks.set(++sequence, callback); return sequence; },
    clearTimeout(id) { callbacks.delete(id); },
  });
  const context = { drawImage() {}, getImageData: () => frame };
  const document = Object.assign(new EventTarget(), {
    hidden: false,
    createElement: () => ({ getContext: () => context }),
  });
  const navigator = { mediaDevices: { getUserMedia: getUserMedia ?? (async (options) => {
    assert.equal(options.audio, false);
    assert.equal(options.video.facingMode.ideal, 'environment');
    return stream;
  }) } };
  for (const [key, value] of Object.entries({ window, document, navigator })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    });
  }
  const video = { readyState: 2, videoWidth: frame.width, videoHeight: frame.height, srcObject: null, play: async () => {} };
  return {
    stream, video, document, window, context, callbacks,
    stops: () => stops,
    frame() {
      const [id, callback] = callbacks.entries().next().value;
      callbacks.delete(id);
      callback();
    },
  };
}

test('reads a real QR frame and releases the camera before delivering its text', async (t) => {
  const env = cameraEnvironment(t);
  const controller = new AbortController();
  let result;
  await scanQrCamera(env.video, {
    signal: controller.signal,
    onResult(value) { assert.ok(env.stops() > 0); result = value; },
    onError(error) { throw error; },
  });
  env.frame();
  assert.equal(result, fixture.payload);
  assert.equal(env.video.srcObject, null);
  assert.equal(env.callbacks.size, 0);
  controller.abort();
});

test('closing while permission is pending stops a stream that arrives later', async (t) => {
  let grant;
  const env = cameraEnvironment(t, () => new Promise((resolve) => { grant = resolve; }));
  const controller = new AbortController();
  const pending = scanQrCamera(env.video, { signal: controller.signal });
  controller.abort();
  grant(env.stream);
  await pending;
  assert.ok(env.stops() > 0);
  assert.equal(env.video.srcObject, null);
  assert.equal(env.callbacks.size, 0);
});

test('closing a live scanner cancels frame decoding and releases all tracks', async (t) => {
  const env = cameraEnvironment(t);
  const controller = new AbortController();
  await scanQrCamera(env.video, { signal: controller.signal });
  assert.equal(env.video.srcObject, env.stream);
  controller.abort();
  assert.ok(env.stops() > 0);
  assert.equal(env.video.srcObject, null);
  assert.equal(env.callbacks.size, 0);
});

test('backgrounding the page stops scanning and reports how to resume', async (t) => {
  const env = cameraEnvironment(t);
  const controller = new AbortController();
  let error;
  await scanQrCamera(env.video, { signal: controller.signal, onError(value) { error = value; } });
  env.document.hidden = true;
  env.document.dispatchEvent(new Event('visibilitychange'));
  assert.ok(env.stops() > 0);
  assert.equal(env.callbacks.size, 0);
  assert.match(error.message, /다시 촬영/);
  controller.abort();
});

test('frame reading errors release the camera instead of leaving it running', async (t) => {
  const env = cameraEnvironment(t);
  const controller = new AbortController();
  let error;
  env.context.drawImage = () => { throw new Error('Frame unavailable'); };
  await scanQrCamera(env.video, { signal: controller.signal, onError(value) { error = value; } });
  env.frame();
  assert.equal(error.message, 'Frame unavailable');
  assert.ok(env.stops() > 0);
  assert.equal(env.callbacks.size, 0);
  controller.abort();
});

test('denied camera permission produces a useful error and leaves no scanner active', async (t) => {
  const env = cameraEnvironment(t, async () => { throw new DOMException('', 'NotAllowedError'); });
  const controller = new AbortController();
  await assert.rejects(scanQrCamera(env.video, { signal: controller.signal }), { name: 'NotAllowedError' });
  assert.match(cameraErrorMessage({ name: 'NotAllowedError' }), /카메라 권한/);
  assert.equal(env.callbacks.size, 0);
  assert.equal(env.video.srcObject, null);
  controller.abort();
});

test('does not request camera access in an insecure context or after cancellation', async (t) => {
  const env = cameraEnvironment(t, async () => { throw new Error('Must not request access'); });
  const controller = new AbortController();
  env.window.isSecureContext = false;
  await assert.rejects(scanQrCamera(env.video, { signal: controller.signal }), { name: 'SecurityError' });
  controller.abort();
  await scanQrCamera(env.video, { signal: controller.signal });
});
