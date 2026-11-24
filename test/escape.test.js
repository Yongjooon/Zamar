import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import jsQR from 'jsqr';
import { ESCAPE_CLUES, escapeView } from '../shared/escape.js';
import { loadEscapeProgress, updateEscapeProgress } from '../server/escape.js';

// Read PNGs with the PNG decoder used by our declared qrcode generator dependency.
const { PNG } = createRequire(import.meta.resolve('qrcode'))('pngjs');

function memoryDatabase() {
  const records = new Map();
  let queue = Promise.resolve();
  const snapshot = (key) => ({ data: () => structuredClone(records.get(key)) });
  return {
    records,
    collection: (name) => ({ doc: (uid) => ({ key: name + '/' + uid, get: async () => snapshot(name + '/' + uid) }) }),
    runTransaction(action) {
      const next = queue.then(async () => {
        const writes = [];
        const result = await action({
          get: async (ref) => snapshot(ref.key),
          set: (ref, record) => writes.push([ref.key, { round: record.round, opened: [...record.opened] }]),
        });
        for (const [key, value] of writes) records.set(key, value);
        return result;
      });
      queue = next.catch(() => {});
      return next;
    },
  };
}

test('each delivered QR PNG is decodable and maps to its own digit in 6371', () => {
  assert.equal(ESCAPE_CLUES.map(({ digit }) => digit).join(''), '6371');
  assert.equal(new Set(ESCAPE_CLUES.map(({ token }) => token)).size, 4);
  for (const [index, { token, id, digit }] of ESCAPE_CLUES.entries()) {
    const frame = PNG.sync.read(readFileSync(new URL(`../output/escape-qr/qr-${index + 1}.png`, import.meta.url)));
    const data = new Uint8ClampedArray(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength);
    assert.equal(jsQR(data, frame.width, frame.height).data, token);
    const view = escapeView({ opened: [id] });
    assert.equal(view.digits[index], digit);
    assert.equal(view.digits.filter((value) => value !== '?').length, 1);
    assert.equal(view.found, 1);
  }
});

test('out-of-order and repeated scans persist per account without duplicate progress', async () => {
  const db = memoryDatabase();
  const scan = (index, uid = 'alice', round = 0) => updateEscapeProgress(db, uid, { action: 'scan', code: ESCAPE_CLUES[index].token, round });
  assert.deepEqual((await loadEscapeProgress(db, 'alice')).progress.digits, ['?', '?', '?', '?']);
  assert.deepEqual((await scan(2)).progress.digits, ['?', '?', '7', '?']);
  assert.equal((await scan(2)).alreadyFound, true);
  assert.equal((await loadEscapeProgress(db, 'alice')).progress.found, 1);
  assert.equal((await loadEscapeProgress(db, 'bob')).progress.found, 0);
  await Promise.all([scan(3), scan(0)]);
  const final = await scan(1);
  assert.equal(final.progress.digits.join(''), '6371');
  assert.equal(final.progress.complete, true);
  assert.deepEqual((await loadEscapeProgress(db, 'alice')).progress, final.progress);
  assert.equal((await loadEscapeProgress(db, 'bob')).progress.complete, false);
});

test('only completion can reset; stale scans and repeated confirmations cannot alter a new round', async () => {
  const db = memoryDatabase();
  await assert.rejects(updateEscapeProgress(db, 'alice', { action: 'reset', round: 0 }), { status: 409 });
  for (const { token } of ESCAPE_CLUES) await updateEscapeProgress(db, 'alice', { action: 'scan', code: token, round: 0 });
  const reset = await updateEscapeProgress(db, 'alice', { action: 'reset', round: 0 });
  assert.deepEqual(reset.progress, { round: 1, found: 0, complete: false, digits: ['?', '?', '?', '?'] });
  await assert.rejects(updateEscapeProgress(db, 'alice', { action: 'reset', round: 0 }), { status: 409 });
  await assert.rejects(updateEscapeProgress(db, 'alice', { action: 'scan', code: ESCAPE_CLUES[0].token, round: 0 }), { status: 409 });
  assert.equal((await loadEscapeProgress(db, 'alice')).progress.found, 0);
  assert.equal((await updateEscapeProgress(db, 'alice', { action: 'scan', code: ESCAPE_CLUES[0].token, round: 1 })).progress.digits[0], '6');
});

test('unknown QR data and invalid requests never create progress', async () => {
  const db = memoryDatabase();
  for (const body of [undefined, { action: 'scan', code: '6371', round: 0 }, { action: 'scan', code: 'https://example.com', round: 0 }, { action: 'reset', round: -1 }]) {
    await assert.rejects(updateEscapeProgress(db, 'alice', body), { status: 400 });
  }
  assert.equal(db.records.size, 0);
});
