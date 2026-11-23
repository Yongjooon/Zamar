import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accountEmail, LOGIN_ID_PATTERN, normalizeLoginId } from '../shared/identity.js';
import { isSunday } from '../shared/team.js';
import { findCurrentWeekIndex, upcomingSunday } from '../src/lib/date.js';
import { postExpiration, weekRetentionCutoff } from '../shared/retention.js';
import { getVideoId } from '../src/lib/youtube.js';

test('selects the upcoming Sunday using the team timezone', () => {
  assert.equal(upcomingSunday(new Date('2026-11-28T15:00:00Z')), '2026-11-29');
  assert.equal(upcomingSunday(new Date('2026-11-29T15:00:00Z')), '2026-12-06');
  const weeks = [{ sunday: '2026-11-22' }, { sunday: '2026-12-06' }];
  assert.equal(findCurrentWeekIndex(weeks, 'Asia/Seoul', new Date('2026-11-28T15:00:00Z')), 1);
  assert.equal(isSunday('2026-02-29'), false);
  assert.equal(isSunday('2026-11-29'), true);
});

test('maps login IDs to unique case-normalized Firebase identities', () => {
  const id = normalizeLoginId('  Zamar.Member  ');
  assert.equal(id, 'zamar.member');
  assert.equal(accountEmail(id), 'zamar.member@zamar.invalid');
  assert.match(id, LOGIN_ID_PATTERN);
  assert.doesNotMatch('zamar..member', LOGIN_ID_PATTERN);
  assert.doesNotMatch('zamar.', LOGIN_ID_PATTERN);
  assert.doesNotMatch('../admin', LOGIN_ID_PATTERN);
});

test('only accepts individual YouTube videos and trusted hosts', () => {
  const id = 'M7lc1UVf-VE';
  for (const url of [
    'https://www.youtube.com/watch?v=' + id,
    'https://youtu.be/' + id + '?si=123',
    'https://m.youtube.com/shorts/' + id,
    'https://www.youtube.com/live/' + id,
  ]) assert.equal(getVideoId(url), id);
  assert.equal(getVideoId('https://www.youtube.com.evil.test/watch?v=' + id), null);
  assert.equal(getVideoId('https://www.youtube.com/playlist?list=' + id), null);
  assert.equal(getVideoId('https://youtu.be/short'), null);
});


test('renders before the selected week or its entries have loaded', async () => {
  const [{ createElement }, { renderToStaticMarkup }, { createServer }] = await Promise.all([
    import('react'), import('react-dom/server'), import('vite'),
  ]);
  const server = await createServer({
    configFile: false,
    envFile: false,
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, watch: null, ws: false },
  });
  try {
    const { useWeekEntries } = await server.ssrLoadModule('/src/lib/storage.js');
    function WeekEntries({ sunday, kind }) {
      assert.equal(useWeekEntries(sunday, kind), null);
      return null;
    }
    assert.equal(renderToStaticMarkup(createElement(WeekEntries, { kind: 'positions' })), '');
    assert.equal(renderToStaticMarkup(createElement(WeekEntries, { sunday: '2026-11-29', kind: 'songs' })), '');
  } finally {
    await server.close();
  }
});

test('keeps a rolling calendar year in Korea and clamps the leap-day boundary', () => {
  assert.equal(weekRetentionCutoff(new Date('2026-11-22T14:59:59Z')), '2025-11-22');
  assert.equal(weekRetentionCutoff(new Date('2026-11-22T15:00:00Z')), '2025-11-23');
  assert.equal(weekRetentionCutoff(new Date('2024-02-29T00:00:00Z')), '2023-02-28');
});

test('anonymous posts expire one calendar month later in Korea', () => {
  assert.equal(postExpiration(new Date('2026-01-31T10:15:00Z')).toISOString(), '2026-02-28T10:15:00.000Z');
  assert.equal(postExpiration(new Date('2026-12-20T10:15:00Z')).toISOString(), '2027-01-20T10:15:00.000Z');
  assert.equal(postExpiration(new Date('2026-01-31T15:00:00Z')).toISOString(), '2026-02-28T15:00:00.000Z');
});
